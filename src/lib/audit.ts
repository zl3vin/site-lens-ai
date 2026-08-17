import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { lookup } from "node:dns/promises";
import type { AnalysisResult, CategoryResult } from "./types";

type Check = {
  passed: boolean;
  issue: string;
};

type FetchedPage = {
  url: string;
  status: number;
  html: string;
};

function normalizeUrl(input: string): string {
  const trimmed = input.trim();

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIPv6(ip: string): boolean {
  const value = ip.toLowerCase();

  return (
    value === "::1" ||
    value === "::" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe80:")
  );
}

async function assertSafeUrl(urlString: string): Promise<URL> {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Die eingegebene URL ist ungültig.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Nur HTTP- und HTTPS-Adressen sind erlaubt.");
  }

  if (url.username || url.password) {
    throw new Error("URLs mit Zugangsdaten sind nicht erlaubt.");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0"
  ) {
    throw new Error("Lokale Adressen können nicht analysiert werden.");
  }

  let addresses;

  try {
    addresses = await lookup(hostname, {
      all: true,
      verbatim: true,
    });
  } catch {
    throw new Error("Die Domain konnte nicht aufgelöst werden.");
  }

  if (addresses.length === 0) {
    throw new Error("Für diese Domain wurde keine IP-Adresse gefunden.");
  }

  for (const entry of addresses) {
    if (
      (entry.family === 4 && isPrivateIPv4(entry.address)) ||
      (entry.family === 6 && isPrivateIPv6(entry.address))
    ) {
      throw new Error("Private oder lokale Netzwerkadressen sind nicht erlaubt.");
    }
  }

  return url;
}

async function readLimitedHtml(
  response: Response,
  maxBytes = 1_000_000
): Promise<string> {
  if (!response.body) {
    throw new Error("Die Website hat keinen Inhalt zurückgegeben.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let result = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("Die Website ist für den Mini-Audit zu groß.");
    }

    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();

  return result;
}

async function fetchPage(rawUrl: string): Promise<FetchedPage> {
  let currentUrl = normalizeUrl(rawUrl);

  for (let redirectCount = 0; redirectCount <= 5; redirectCount++) {
    const safeUrl = await assertSafeUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let response: Response;

    try {
      response = await fetch(safeUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "SiteLensAI/1.0 Website Audit",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } catch {
      throw new Error("Die Website konnte nicht erreicht werden.");
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      if (!location) {
        throw new Error("Die Website hat eine ungültige Weiterleitung.");
      }

      currentUrl = new URL(location, safeUrl).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`Die Website antwortet mit HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("Die angegebene URL liefert keine HTML-Seite.");
    }

    const html = await readLimitedHtml(response);

    return {
      url: safeUrl.toString(),
      status: response.status,
      html,
    };
  }

  throw new Error("Zu viele Weiterleitungen.");
}

function createCategory(
  key: string,
  label: string,
  checks: Check[]
): CategoryResult {
  const passedChecks = checks.filter((check) => check.passed).length;

  return {
    key,
    label,
    score: Math.round((passedChecks / checks.length) * 100),
    issues: checks
      .filter((check) => !check.passed)
      .map((check) => check.issue),
  };
}

function visibleText($: CheerioAPI): string {
  const body = $("body").clone();

  body.find("script, style, noscript, svg").remove();

  return body.text().replace(/\s+/g, " ").trim();
}

function getJsonLd($: CheerioAPI): unknown[] {
  const blocks: unknown[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).html()?.trim();

    if (!raw) {
      return;
    }

    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Fehlerhaftes JSON-LD wird bewusst ignoriert.
    }
  });

  return blocks;
}

function getSchemaTypes(blocks: unknown[]): string[] {
  const types: string[] = [];

  function walk(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    const object = value as Record<string, unknown>;
    const type = object["@type"];

    if (typeof type === "string") {
      types.push(type.toLowerCase());
    }

    if (Array.isArray(type)) {
      type.forEach((item) => {
        if (typeof item === "string") {
          types.push(item.toLowerCase());
        }
      });
    }

    if (object["@graph"]) {
      walk(object["@graph"]);
    }
  }

  blocks.forEach(walk);

  return types;
}

function countInternalLinks($: CheerioAPI, pageUrl: string): number {
  const hostname = new URL(pageUrl).hostname;
  const links = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    try {
      const url = new URL(href, pageUrl);

      if (
        ["http:", "https:"].includes(url.protocol) &&
        url.hostname === hostname
      ) {
        links.add(url.pathname);
      }
    } catch {
      // Ungültige Links ignorieren.
    }
  });

  return links.size;
}

export async function analyzeUrl(rawUrl: string): Promise<AnalysisResult> {
  const page = await fetchPage(rawUrl);
  const $ = cheerio.load(page.html);

  const text = visibleText($);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const title = $("title").first().text().trim();
  const description =
    $('meta[name="description"]').attr("content")?.trim() ?? "";

  const canonical = $('link[rel="canonical"]').attr("href");
  const viewport = $('meta[name="viewport"]').attr("content");

  const robots =
    $('meta[name="robots"]').attr("content")?.toLowerCase() ?? "";

  const jsonLd = getJsonLd($);
  const schemaTypes = getSchemaTypes(jsonLd);

  const links = $("a[href]")
    .map((_, element) => $(element).attr("href") ?? "")
    .get()
    .join(" ")
    .toLowerCase();

  const jsonLdText = JSON.stringify(jsonLd).toLowerCase();

  const hasOrganization = schemaTypes.some(
    (type) =>
      type === "organization" ||
      type === "localbusiness" ||
      type === "corporation"
  );

  const hasAboutLink =
    /über-uns|ueber-uns|about|unternehmen|wir-ueber-uns/.test(links);

  const hasContactLink =
    /kontakt|contact|impressum/.test(links);

  const hasSocialSignals =
    jsonLdText.includes('"sameas"') ||
    /linkedin\.com|instagram\.com|facebook\.com|youtube\.com|x\.com/.test(
      links
    );

  const technical = createCategory("technik", "Technik", [
    {
      passed: page.url.startsWith("https://"),
      issue: "Die Website wird nicht vollständig über HTTPS aufgerufen.",
    },
    {
      passed: page.status >= 200 && page.status < 300,
      issue: "Die Startseite liefert keinen erfolgreichen HTTP-Status.",
    },
    {
      passed: Boolean(viewport),
      issue: "Es wurde kein Viewport-Meta-Tag gefunden.",
    },
    {
      passed: Boolean(canonical),
      issue: "Es wurde keine Canonical-URL gefunden.",
    },
    {
      passed: !robots.includes("noindex"),
      issue: "Die Seite enthält ein noindex-Signal.",
    },
  ]);

  const metadata = createCategory("metadaten", "Metadaten", [
    {
      passed: title.length > 0,
      issue: "Der Seitentitel fehlt.",
    },
    {
      passed: title.length >= 10 && title.length <= 65,
      issue: "Der Seitentitel könnte prägnanter dimensioniert werden.",
    },
    {
      passed: description.length > 0,
      issue: "Die Meta Description fehlt.",
    },
    {
      passed: description.length >= 50 && description.length <= 170,
      issue: "Die Länge der Meta Description könnte verbessert werden.",
    },
    {
      passed:
        Boolean($('meta[property="og:title"]').attr("content")) ||
        Boolean($('meta[property="og:description"]').attr("content")),
      issue: "Es wurden keine grundlegenden Open-Graph-Metadaten gefunden.",
    },
  ]);

  const structuredData = createCategory(
    "structured-data",
    "Strukturierte Daten",
    [
      {
        passed: $('script[type="application/ld+json"]').length > 0,
        issue: "Es wurde kein JSON-LD gefunden.",
      },
      {
        passed: jsonLd.length > 0,
        issue: "Es wurde kein gültiges JSON-LD erkannt.",
      },
      {
        passed: schemaTypes.length > 0,
        issue: "Es konnten keine Schema.org-Typen erkannt werden.",
      },
      {
        passed: hasOrganization,
        issue: "Es wurde kein Organization-Schema erkannt.",
      },
    ]
  );

  const content = createCategory("inhalte", "Inhalte", [
    {
      passed: $("h1").length >= 1,
      issue: "Es wurde keine H1-Überschrift gefunden.",
    },
    {
      passed: $("h2").length >= 1,
      issue: "Es wurden keine H2-Überschriften gefunden.",
    },
    {
      passed: wordCount >= 200,
      issue: "Auf der Startseite wurde nur wenig sichtbarer Text gefunden.",
    },
    {
      passed: countInternalLinks($, page.url) >= 3,
      issue: "Es wurden nur wenige interne Links gefunden.",
    },
  ]);

  const entitySignals = createCategory(
    "entitaetssignale",
    "Entitätssignale",
    [
      {
        passed: hasOrganization,
        issue: "Ein klares Organization-Schema fehlt.",
      },
      {
        passed: hasAboutLink,
        issue: "Es wurde kein eindeutiger Über-uns-Bereich verlinkt.",
      },
      {
        passed: hasContactLink,
        issue: "Kontakt- oder Impressumsinformationen sind nicht klar verlinkt.",
      },
      {
        passed: hasSocialSignals,
        issue: "Es wurden keine eindeutigen Social- oder sameAs-Signale gefunden.",
      },
    ]
  );

  const citationReadiness = createCategory(
    "zitationsbereitschaft",
    "Zitationsbereitschaft",
    [
      {
        passed: $("h1, h2, h3").length >= 3,
        issue: "Die Inhaltsstruktur könnte durch klarere Überschriften verbessert werden.",
      },
      {
        passed: wordCount >= 300,
        issue: "Es wurde nur wenig informativer Inhalt erkannt.",
      },
      {
        passed: jsonLd.length > 0,
        issue: "Maschinenlesbare strukturierte Daten fehlen.",
      },
      {
        passed: hasOrganization || hasAboutLink || hasContactLink,
        issue: "Die Identität der Website ist nicht eindeutig genug erkennbar.",
      },
      {
        passed: $("p").length >= 3 || $("ul, ol").length >= 1,
        issue: "Der Inhalt könnte stärker in klar erfassbare Informationsblöcke gegliedert werden.",
      },
    ]
  );

  const categories = [
    technical,
    metadata,
    structuredData,
    content,
    entitySignals,
    citationReadiness,
  ];

  const overallScore = Math.round(
    categories.reduce((sum, category) => sum + category.score, 0) /
      categories.length
  );

  const recommendations = [...categories]
    .sort((a, b) => a.score - b.score)
    .flatMap((category) => category.issues)
    .slice(0, 5);

  return {
    url: page.url,
    overallScore,
    categories,
    recommendations,
  };
}