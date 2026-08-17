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
    <main className="min-h-screen bg-[#faf9f5] text-[#1f231e]">
      <div className="mx-auto max-w-[640px] px-6 py-16 md:py-24">
        <header className="mb-14 flex flex-col items-center text-center">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3a6650] text-xs font-bold text-white">
              S
            </div>
            <span className="text-sm font-medium tracking-wide text-[#3a6650]">
              SiteLens AI
            </span>
          </div>

          <h1 className="max-w-md text-[28px] font-semibold leading-tight tracking-tight text-[#1a1d18] md:text-[34px]">
            Website-Audit für Suche & KI
          </h1>

          <p className="mt-4 max-w-sm text-[15px] leading-6 text-[#6b7168]">
            Analysiere zentrale technische, strukturelle und inhaltliche
            Signale deiner Website.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2.5 rounded-2xl border border-[#e5e3d8] bg-white p-2.5 shadow-[0_1px_2px_rgba(20,20,10,0.04)] sm:flex-row"
        >
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="deine-website.de"
            disabled={loading}
            required
            className="min-w-0 flex-1 rounded-xl border border-transparent bg-[#f6f5ef] px-4 py-3 text-[15px] outline-none transition focus:border-[#3a6650] focus:bg-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#3a6650] px-6 py-3 text-[15px] font-medium text-white transition hover:bg-[#2f5441] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analysiere…" : "Analysieren"}
          </button>
        </form>

        {loading && (
          <p className="mt-5 text-center text-sm text-[#8b9086]">
            Website wird analysiert …
          </p>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <section className="mt-14 space-y-5">
            <div className="rounded-2xl border border-[#e5e3d8] bg-white p-8">
              <p className="mb-8 break-all text-center text-xs tracking-wide text-[#9a9d92]">
                {result.url}
              </p>

              <div className="flex flex-col items-center">
                <div
                  className="flex h-36 w-36 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#3a6650 ${
                      result.overallScore * 3.6
                    }deg, #ece9dd 0deg)`,
                  }}
                >
                  <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-3xl font-semibold text-[#1a1d18]">
                      {result.overallScore}
                    </span>
                    <span className="text-xs text-[#9a9d92]">von 100</span>
                  </div>
                </div>

                <h2 className="mt-5 text-lg font-semibold text-[#1a1d18]">
                  {scoreLabel(result.overallScore)}
                </h2>

                <p className="mt-1.5 max-w-xs text-center text-sm leading-6 text-[#8b9086]">
                  Zusammenfassung der sechs geprüften Bereiche deiner
                  Startseite.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e5e3d8] bg-white p-8">
              <h2 className="mb-6 text-[13px] font-semibold uppercase tracking-wide text-[#8b9086]">
                Audit-Bereiche
              </h2>

              <div className="space-y-5">
                {result.categories.map((category) => (
                  <div key={category.key}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-sm text-[#3a3e37]">
                        {category.label}
                      </span>

                      <span className="text-sm font-semibold text-[#1a1d18]">
                        {category.score}
                      </span>
                    </div>

                    <div className="h-[5px] overflow-hidden rounded-full bg-[#ece9dd]">
                      <div
                        className="h-full rounded-full bg-[#3a6650] transition-all"
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e5e3d8] bg-white p-8">
              <h2 className="mb-6 text-[13px] font-semibold uppercase tracking-wide text-[#8b9086]">
                Empfehlungen
              </h2>

              <div className="space-y-3">
                {result.recommendations.map((recommendation, index) => (
                  <div
                    key={`${recommendation}-${index}`}
                    className="flex gap-3.5 rounded-xl border border-[#ece9dd] px-4 py-3.5"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef2ec] text-[11px] font-semibold text-[#3a6650]">
                      {index + 1}
                    </div>

                    <p className="text-sm leading-6 text-[#3a3e37]">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="px-4 pt-2 text-center text-xs leading-5 text-[#9a9d92]">
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