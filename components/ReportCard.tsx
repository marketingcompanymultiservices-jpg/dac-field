import type { ProjectReport } from "@/types";

export function ReportCard({
  report,
  onPreview,
  onDownload,
  onDeleteDraft
}: {
  report: ProjectReport;
  onPreview: (report: ProjectReport) => void;
  onDownload: (report: ProjectReport) => void;
  onDeleteDraft: (id: string) => void;
}) {
  return (
    <article className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary">{report.type}</span>
            <span className={getStatusClass(report.status)}>{report.status}</span>
            {report.format && <span className="rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary">{report.format}</span>}
          </div>
          <h2 className="mt-3 text-xl font-black text-dac-primary">{report.name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button type="button" onClick={() => onPreview(report)} className="focus-ring rounded-md border border-dac-primary px-4 py-2 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white">
            Ver
          </button>
          <button type="button" onClick={() => onDownload(report)} className="focus-ring rounded-md bg-dac-secondary px-4 py-2 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white">
            Descargar
          </button>
          {report.status === "Borrador" && (
            <button type="button" onClick={() => onDeleteDraft(report.id)} className="focus-ring col-span-2 rounded-md border border-dac-alert px-4 py-2 text-sm font-bold text-dac-alert hover:bg-dac-alert hover:text-white sm:col-span-1">
              Eliminar borrador
            </button>
          )}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Fecha generacion" value={report.generationDate} />
        <Info label="Generado por" value={report.generatedBy} />
        <Info label="Fotografias" value={report.includesPhotos ? "Incluidas" : "No incluidas"} />
        <Info label="Compromisos" value={report.includesCommitments ? "Incluidos" : "No incluidos"} />
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

function getStatusClass(status: ProjectReport["status"]) {
  if (status === "Generado") return "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700";
  return "rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-text";
}
