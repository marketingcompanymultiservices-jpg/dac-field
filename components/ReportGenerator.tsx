"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import type { ProjectReport, ReportType } from "@/types";

const inputClass = "focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3";
const labelClass = "text-sm font-bold text-dac-text";

export function ReportGenerator({
  reportTypes,
  onGenerate
}: {
  reportTypes: ReportType[];
  onGenerate: (report: ProjectReport) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<HTMLSelectElement>(null);
  const commitmentsRef = useRef<HTMLSelectElement>(null);
  const notesRef = useRef<HTMLSelectElement>(null);
  const formatRef = useRef<HTMLSelectElement>(null);

  function handleGenerate() {
    const type = (typeRef.current?.value ?? reportTypes[0]) as ReportType;
    const startDate = startDateRef.current?.value ?? "";
    const endDate = endDateRef.current?.value ?? "";
    const format = (formatRef.current?.value ?? "PDF") as ProjectReport["format"];
    const generationDate = new Date().toISOString().slice(0, 10);
    const suffix = endDate || startDate || generationDate;

    onGenerate({
      id: "report-" + Date.now(),
      name: `${type} - ${suffix}`,
      type,
      generationDate,
      generatedBy: "Jose Martinez",
      status: "Generado",
      format,
      includesPhotos: photosRef.current?.value === "Si",
      includesCommitments: commitmentsRef.current?.value === "Si",
      includesInterventionNotes: notesRef.current?.value === "Si"
    });

    formRef.current?.reset();
  }

  return (
    <form ref={formRef} className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Generar nuevo reporte</p>
        <h2 className="mt-1 text-xl font-black text-dac-primary">Reporte operativo</h2>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className={labelClass + " lg:col-span-2"}>
          Tipo de reporte
          <select ref={typeRef} defaultValue="Reporte Diario de Obra" className={inputClass}>
            {reportTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Fecha inicial
          <input ref={startDateRef} type="date" className={inputClass} />
        </label>
        <label className={labelClass}>
          Fecha final
          <input ref={endDateRef} type="date" className={inputClass} />
        </label>
        <SelectField label="Incluir fotografias" refValue={photosRef} />
        <SelectField label="Incluir compromisos" refValue={commitmentsRef} />
        <SelectField label="Incluir observaciones de interventoria" refValue={notesRef} />
        <label className={labelClass}>
          Formato
          <select ref={formatRef} defaultValue="PDF" className={inputClass}>
            <option>PDF</option>
            <option>Excel</option>
          </select>
        </label>
      </div>

      <button type="button" onClick={handleGenerate} className="focus-ring mt-5 w-full rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary sm:w-auto">
        Generar reporte
      </button>
    </form>
  );
}

function SelectField({
  label,
  refValue
}: {
  label: string;
  refValue: RefObject<HTMLSelectElement>;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select ref={refValue} defaultValue="Si" className={inputClass}>
        <option>Si</option>
        <option>No</option>
      </select>
    </label>
  );
}
