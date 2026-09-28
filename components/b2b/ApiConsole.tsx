"use client";

import { Play } from "lucide-react";
import { useState, type ReactNode } from "react";
import { sampleTripRequest } from "@/data/trips";
import { cn } from "@/lib/cn";
import type { EngineModule } from "@/data/engine";

type RunState = { status: "idle" } | { status: "running" } | { status: "done"; code: number; ms: number; body: unknown } | { status: "error"; message: string };

/** Minimal JSON highlighter that builds React nodes (no innerHTML). */
function highlight(json: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(json))) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1] && m[2]) out.push(<span key={k++} className="text-sand">{m[1]}</span>, m[2]);
    else if (m[1]) out.push(<span key={k++} className="text-[#a9c7a2]">{m[1]}</span>);
    else if (m[3]) out.push(<span key={k++} className="text-ocean">{m[3]}</span>);
    else if (m[4]) out.push(<span key={k++} className="text-[#e3a57a]">{m[4]}</span>);
    last = re.lastIndex;
  }
  out.push(json.slice(last));
  return out;
}

/** Condense large responses to what reads well in a demo console. */
function condense(module: EngineModule["id"], body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const b = body as Record<string, unknown>;
  if (module === "journey" && b.trip) {
    const t = b.trip as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    return {
      trip: {
        id: t.id,
        title: t.title,
        days: t.days,
        matchScore: t.matchScore,
        budget: { total: t.budget?.total, requested: t.budget?.requested, withinBudget: t.budget?.withinBudget },
        transport: { mode: t.transport?.mode, durationHours: Number(t.transport?.durationHours?.toFixed?.(2)) },
        stay: { name: t.stay?.name, tier: t.stay?.tier },
        itinerary: (t.itinerary ?? []).map((d: { day: number; title: string }) => `Day ${d.day}: ${d.title}`),
        journeyStops: t.journey?.length,
        engine: t.engine,
      },
      meta: b.meta,
    };
  }
  if (Array.isArray(b.data)) {
    return { data: (b.data as { id: string; name: string; tagline: string }[]).map((d) => ({ id: d.id, name: d.name, tagline: d.tagline })), meta: b.meta };
  }
  if (b.data && typeof b.data === "object") {
    const d = b.data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    return { data: { id: d.id, name: d.name, idealDays: d.idealDays, bestTime: d.bestTime, experiences: `${d.experiences?.length} items`, stays: d.stays?.map((s: { name: string }) => s.name) }, meta: b.meta };
  }
  return body;
}

export function ApiConsole({ module }: { module: EngineModule }) {
  const [tab, setTab] = useState<"sdk" | "api">("sdk");
  const [run, setRun] = useState<RunState>({ status: "idle" });

  const execute = async () => {
    if (!module.endpoint) return;
    setRun({ status: "running" });
    const started = performance.now();
    try {
      const res = await fetch(module.endpoint.path, {
        method: module.endpoint.method,
        headers: module.endpoint.method === "POST" ? { "Content-Type": "application/json" } : undefined,
        body: module.endpoint.method === "POST" ? JSON.stringify(sampleTripRequest) : undefined,
      });
      const body = await res.json();
      setRun({ status: "done", code: res.status, ms: Math.round(performance.now() - started), body: condense(module.id, body) });
    } catch (e) {
      setRun({ status: "error", message: e instanceof Error ? e.message : "Request failed" });
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden border border-line bg-[#07090b]">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div role="tablist" aria-label="Integration view" className="flex gap-1">
          {(["sdk", "api"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("hud rounded-full px-3 py-1.5 transition-colors", tab === t ? "bg-white/10 text-bone" : "text-mist hover:text-bone")}
            >
              {t === "sdk" ? "SDK" : "Live API"}
            </button>
          ))}
        </div>
        <span className="hud text-mist">{module.code}</span>
      </div>

      {tab === "sdk" ? (
        <pre className="scrollbar-none flex-1 overflow-auto p-5 font-mono text-[0.78rem] leading-relaxed text-bone-dim">
          <code>{module.snippet}</code>
        </pre>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            {module.endpoint ? (
              <>
                <span className="font-mono text-xs text-sand">{module.endpoint.method}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-bone">{module.endpoint.path}</span>
                <button
                  type="button"
                  onClick={execute}
                  disabled={run.status === "running"}
                  className="flex items-center gap-2 rounded-full bg-bone px-3.5 py-1.5 text-xs font-medium text-ink-950 transition-opacity disabled:opacity-50"
                >
                  <Play className="size-3" aria-hidden /> {run.status === "running" ? "Running…" : "Run"}
                </button>
              </>
            ) : (
              <p className="text-sm text-mist">This module is delivered as an embeddable component in the prototype.</p>
            )}
          </div>
          <div aria-live="polite" className="scrollbar-none max-h-[26rem] flex-1 overflow-auto p-5 font-mono text-[0.74rem] leading-relaxed text-bone-dim">
            {run.status === "idle" && module.endpoint && <p className="text-mist">Press Run to call this prototype&apos;s own API. Responses use sample data.</p>}
            {run.status === "running" && <p className="text-mist">Calling the engine…</p>}
            {run.status === "error" && <p className="text-sunset">{run.message}</p>}
            {run.status === "done" && (
              <>
                <p className="mb-3 text-mist">
                  <span className={run.code < 400 ? "text-emerald" : "text-sunset"}>{run.code}</span> · {run.ms} ms · sample data
                </p>
                <pre className="whitespace-pre-wrap break-words">{highlight(JSON.stringify(run.body, null, 2))}</pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
