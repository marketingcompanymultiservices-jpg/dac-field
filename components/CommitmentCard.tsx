import type { Commitment, CommitmentStatus } from "@/types";

export function CommitmentCard({
  commitment,
  onStatusChange
}: {
  commitment: Commitment;
  onStatusChange: (id: string, status: CommitmentStatus) => void;
}) {
  return (
    <article className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={getPriorityClass(commitment.priority)}>{commitment.priority}</span>
            <span className={getStatusClass(commitment.status)}>{commitment.status}</span>
          </div>
          <h2 className="mt-3 text-xl font-black text-dac-primary">{commitment.description}</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button
            type="button"
            onClick={() => onStatusChange(commitment.id, "En proceso")}
            disabled={commitment.status === "En proceso" || commitment.status === "Cumplido"}
            className="focus-ring rounded-md border border-dac-primary px-4 py-2 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white disabled:cursor-not-allowed disabled:border-dac-primary/20 disabled:text-dac-primary/35 disabled:hover:bg-white"
          >
            Marcar en proceso
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(commitment.id, "Cumplido")}
            disabled={commitment.status === "Cumplido"}
            className="focus-ring rounded-md bg-dac-secondary px-4 py-2 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white disabled:cursor-not-allowed disabled:bg-dac-secondary/35"
          >
            Marcar cumplido
          </button>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Responsable" value={commitment.owner} />
        <Info label="Fecha limite" value={commitment.dueDate} />
        <Info label="Origen" value={commitment.origin} />
        <Info label="Estado" value={commitment.status} />
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

function getPriorityClass(priority: Commitment["priority"]) {
  if (priority === "Critica") return "inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white";
  if (priority === "Alta") return "inline-flex rounded-full bg-dac-alert px-3 py-1 text-xs font-black text-white";
  if (priority === "Media") return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  return "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700";
}

function getStatusClass(status: Commitment["status"]) {
  if (status === "Vencido") return "inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700";
  if (status === "Cumplido") return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  if (status === "En proceso") return "inline-flex rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-text";
  return "inline-flex rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary";
}
