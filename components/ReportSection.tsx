import type { ReactNode } from "react";

export function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid rounded-lg border border-dac-primary/15 bg-white p-5 shadow-sm print:border-dac-primary/30 print:shadow-none">
      <h2 className="text-lg font-black text-dac-primary">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md bg-dac-primary/[0.04] p-3 print:bg-white">
          <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
          <dd className="mt-1 text-sm font-semibold text-dac-text">{value || "Sin registrar"}</dd>
        </div>
      ))}
    </dl>
  );
}
