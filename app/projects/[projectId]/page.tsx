"use client";

import Link from "next/link";
import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { ProgressBar } from "@/components/ProgressBar";
import { useProjectStore } from "@/lib/project-store";

const actions = [
  ["Modo Obra", "../../field"],
  ["Registro Diario", "daily-report"],
  ["Bitacora", "bitacora"],
  ["Presupuesto", "budget"],
  ["Levantamiento Inicial", "initial-survey"],
  ["Inspecciones de Dirección", "direction-inspections"],
  ["Planificación", "planning"],
  ["Avance", "progress"],
  ["Alertas", "alerts"],
  ["Documentos", "documents"],
  ["Reportes", "reports"],
  ["Compromisos", "commitments"]
];

export default function ProjectControlPage() {
  const { project } = useProjectStore();

  const team = [
    ["Director", project.director],
    ["Residente", project.resident],
    ["Interventor", project.auditor],
    ["Supervisor tecnico", project.technicalSupervisor]
  ];

  return (
    <PageShell activeItem="Obra" projectId={project.id} backHref="/dashboard" backLabel="Volver al dashboard">
      <ModuleHeader
        eyebrow="Centro de Control de Obra"
        title={project.name}
        meta={"Estado: " + project.status}
        aside={<HeaderMetric label="Avance general" value={project.progress.toFixed(1) + " %"} detail={<ProgressBar value={project.progress} />} />}
      />

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {team.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm">
            <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
            <dd className="mt-1 font-semibold text-dac-text">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map(([label, href]) => (
          <Link key={label} href={href === "../../field" ? "/field" : "/projects/" + project.id + "/" + href} className="focus-ring flex min-h-28 items-center justify-center rounded-lg border border-dac-primary/15 bg-white p-5 text-center text-xl font-black text-dac-primary shadow-sm hover:border-dac-secondary hover:bg-dac-secondary/10 sm:min-h-32">
            {label}
          </Link>
        ))}
      </section>
    </PageShell>
  );
}


