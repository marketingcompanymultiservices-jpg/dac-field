import type { ReactNode } from "react";

export function ModuleHeader({
  eyebrow,
  title,
  description,
  meta,
  aside
}: {
  eyebrow: string;
  title: string;
  description?: string;
  meta?: string;
  aside?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-dac-primary sm:text-4xl">{title}</h1>
          {meta && <p className="mt-2 text-dac-text/70">{meta}</p>}
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-dac-text/70">{description}</p>}
        </div>
        {aside && <div className="w-full lg:w-auto">{aside}</div>}
      </div>
    </section>
  );
}

export function HeaderMetric({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-dac-primary p-5 text-white lg:min-w-72">
      <p className="text-sm font-semibold text-white/75">{label}</p>
      <p className="mt-1 text-3xl font-black sm:text-4xl">{value}</p>
      {detail && <div className="mt-3 text-sm text-white/70">{detail}</div>}
    </div>
  );
}
