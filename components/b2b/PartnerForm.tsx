"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const TYPES = ["Airline", "Hotel group", "OTA", "Tourism board", "Other"] as const;

const inputCls =
  "h-12 w-full rounded-none border-b border-line-strong bg-transparent px-0 text-bone outline-none transition-colors placeholder:text-mist focus:border-sand";

/**
 * Partnership enquiry. The prototype validates and confirms locally — nothing
 * is transmitted. In production this posts to a CRM endpoint server-side.
 */
export function PartnerForm() {
  const [type, setType] = useState<(typeof TYPES)[number]>("Hotel group");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<{ name: string; company: string } | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const next: Record<string, string> = {};
    if (!name) next.name = "Tell us who you are.";
    if (!company) next.company = "Which company?";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "A work email we can reply to.";
    setErrors(next);
    if (Object.keys(next).length === 0) setSent({ name, company });
  };

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div key="sent" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="border border-line p-8 md:p-12">
          <span className="grid size-10 place-items-center rounded-full bg-sand text-ink-950">
            <Check className="size-5" aria-hidden />
          </span>
          <p className="mt-6 font-serif text-3xl italic">Thank you, {sent.name}.</p>
          <p className="mt-3 max-w-lg text-bone-dim">
            This is a prototype, so nothing was sent — but in production, {sent.company}&apos;s enquiry would route straight to our partnerships team with the modules you&apos;re interested in.
          </p>
          <Button variant="ghost" className="mt-8" onClick={() => setSent(null)}>
            Send another
          </Button>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} noValidate className="grid gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <fieldset>
            <legend className="hud text-mist">You are</legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={type === t}
                  onClick={() => setType(t)}
                  className={cn("rounded-full border px-4 py-2 text-sm transition-colors", type === t ? "border-bone bg-bone text-ink-950" : "border-line-strong text-bone-dim hover:text-bone")}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-8 md:grid-cols-2">
            {[
              { id: "name", label: "Name", type: "text", auto: "name" },
              { id: "company", label: "Company", type: "text", auto: "organization" },
              { id: "email", label: "Work email", type: "email", auto: "email" },
              { id: "module", label: "Most interested in", type: "text", auto: "off", placeholder: "e.g. Immersive Stay Engine" },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={`pf-${f.id}`} className="hud text-mist">
                  {f.label}
                </label>
                <input
                  id={`pf-${f.id}`}
                  name={f.id}
                  type={f.type}
                  autoComplete={f.auto}
                  placeholder={f.placeholder}
                  aria-invalid={!!errors[f.id]}
                  aria-describedby={errors[f.id] ? `pf-${f.id}-err` : undefined}
                  className={cn(inputCls, errors[f.id] && "border-sunset")}
                />
                {errors[f.id] && (
                  <p id={`pf-${f.id}-err`} className="mt-2 text-sm text-sunset">
                    {errors[f.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <input type="hidden" name="type" value={type} />
          <div className="flex flex-wrap items-center gap-5">
            <Button type="submit" size="lg" arrow magnetic>
              Partner With Us
            </Button>
            <p className="text-xs text-mist">Prototype form — nothing is sent or stored.</p>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
