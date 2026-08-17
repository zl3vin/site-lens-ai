"use client";

import { FormEvent, useState } from "react";
import type { AnalysisResult } from "@/lib/types";

function scoreLabel(score: number) {
  if (score >= 85) return "Sehr gut";
  if (score >= 70) return "Gute Grundlage";
  if (score >= 50) return "Ausbaufähig";
  return "Handlungsbedarf";
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Die Analyse ist fehlgeschlagen.");
      }

      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Die Website konnte nicht analysiert werden."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#20241f]">
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
        <header className="mb-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#315c45] text-sm font-bold text-white">
              S
            </div>

            <div>
              <div className="font-semibold">SiteLens AI</div>
              <div className="text-xs text-[#70766e]">
                Search & AI Readiness Audit
              </div>
            </div>
          </div>

          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Wie gut ist deine Website für Suche & KI aufgestellt?
          </h1>

          <p className="mt-3 max-w-xl text-[#697068]">
            Gib eine URL ein. SiteLens AI prüft wichtige technische,
            inhaltliche und strukturierte Signale deiner Startseite.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-[#dedfd8] bg-white p-3 shadow-sm sm:flex-row"
        >
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="z. B. example.com"
            disabled={loading}
            required
            className="min-w-0 flex-1 rounded-xl border border-transparent bg-[#f6f6f2] px-4 py-3 outline-none transition focus:border-[#315c45]"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#315c45] px-6 py-3 font-medium text-white transition hover:bg-[#274b38] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analysiere..." : "Analysieren"}
          </button>
        </form>

        {loading && (
          <p className="mt-4 text-sm text-[#70766e]">
            Website wird analysiert ...
          </p>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <section className="mt-10 space-y-6">
            <div className="rounded-2xl border border-[#dedfd8] bg-white p-6 shadow-sm md:p-8">
              <p className="mb-6 break-all text-sm text-[#747a73]">
                {result.url}
              </p>

              <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
                <div
                  className="flex h-40 w-40 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#315c45 ${
                      result.overallScore * 3.6
                    }deg, #e8ebe5 0deg)`,
                  }}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-4xl font-semibold">
                      {result.overallScore}
                    </span>
                    <span className="text-sm text-[#737970]">von 100</span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-medium text-[#315c45]">
                    Gesamtbewertung
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {scoreLabel(result.overallScore)}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6e746c]">
                    Der Score fasst die sechs geprüften Bereiche deiner
                    Startseite zusammen.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#dedfd8] bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 text-lg font-semibold">
                Audit-Bereiche
              </h2>

              <div className="space-y-5">
                {result.categories.map((category) => (
                  <div key={category.key}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-sm font-medium">
                        {category.label}
                      </span>

                      <span className="text-sm font-semibold">
                        {category.score}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#e8ebe5]">
                      <div
                        className="h-full rounded-full bg-[#315c45] transition-all"
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#dedfd8] bg-white p-6 shadow-sm md:p-8">
              <div className="mb-5">
                <p className="text-sm font-medium text-[#315c45]">
                  Nächste Schritte
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Wichtigste Empfehlungen
                </h2>
              </div>

              <div className="space-y-3">
                {result.recommendations.map((recommendation, index) => (
                  <div
                    key={`${recommendation}-${index}`}
                    className="flex gap-4 rounded-xl border border-[#e3e4de] p-4"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf2ed] text-xs font-semibold text-[#315c45]">
                      {index + 1}
                    </div>

                    <p className="text-sm leading-6 text-[#4e554d]">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="px-4 text-center text-xs leading-5 text-[#858a83]">
              SiteLens AI bewertet technische und inhaltliche
              Readiness-Signale. Der Audit misst keine tatsächlichen Rankings
              oder Erwähnungen in ChatGPT, Gemini oder anderen KI-Systemen.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}