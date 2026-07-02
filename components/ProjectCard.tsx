import Link from "next/link";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  const details = [
    ["Director", project.director],
    ["Residente", project.resident],
    ["Interventor", project.auditor],
    ["Supervisor técnico", project.technicalSupervisor],
    ["Dirección", project.address],
    ["Ciudad", project.city],
    ["Fecha inicio", project.startDate],
    ["Fecha terminación contractual", project.contractualEndDate]
  ];

  return (
    <article className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Obra piloto</p>
          <h2 className="mt-1 text-2xl font-black text-dac-primary">{project.name}</h2>
          <p className="mt-2 text-sm text-dac-text/75">Estado: <span className="font-semibold text-dac-text">{project.status}</span></p>
        </div>
        <div className="min-w-40 rounded-lg bg-dac-primary p-4 text-white">
          <p className="text-sm opacity-80">Avance</p>
          <p className="text-3xl font-black">{project.progress} %</p>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-dac-primary/10">
        <div className="h-full rounded-full bg-dac-secondary" style={{ width: project.progress + "%" }} />
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-md border border-dac-primary/10 p-3">
            <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-dac-text">{value}</dd>
          </div>
        ))}
      </dl>
      <Link href={"/projects/" + project.id} className="focus-ring mt-6 inline-flex w-full items-center justify-center rounded-md bg-dac-primary px-5 py-3 text-sm font-bold text-white hover:bg-dac-secondary sm:w-auto">
        Entrar a obra
      </Link>
    </article>
  );
}
