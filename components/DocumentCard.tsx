import type { ProjectDocument } from "@/types";

export function DocumentCard({ document }: { document: ProjectDocument }) {
  return (
    <article className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary">{document.folder}</span>
            <span className={getStatusClass(document.status)}>{document.status}</span>
          </div>
          <h2 className="mt-3 text-xl font-black text-dac-primary">{document.name}</h2>
          <p className="mt-2 text-sm text-dac-text/70">{document.observation}</p>
        </div>
        <div className="rounded-md border border-dac-primary/10 px-4 py-3 text-center">
          <p className="text-xs font-bold uppercase text-dac-text/50">Version</p>
          <p className="text-2xl font-black text-dac-primary">{document.version}</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Fecha de carga" value={document.uploadDate} />
        <Info label="Vencimiento" value={document.expirationDate ?? "No aplica"} />
        <Info label="Usuario" value={document.user} />
        <Info label="Archivo simulado" value={document.simulatedFile ?? "Sin archivo"} />
      </dl>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-dac-primary/10 p-3">
      <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-dac-text">{value}</dd>
    </div>
  );
}

function getStatusClass(status: ProjectDocument["status"]) {
  if (status === "Vigente") return "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700";
  if (status === "Proxima a vencer") return "rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-text";
  if (status === "Reemplazado") return "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700";
  return "rounded-full bg-slate-700 px-3 py-1 text-xs font-black text-white";
}
