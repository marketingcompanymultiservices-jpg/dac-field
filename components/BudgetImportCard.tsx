"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { parseBudgetExcel, type ParsedBudgetExcel } from "@/lib/excelBudgetParser";
import type { BudgetItem, BudgetVersion } from "@/types";

type BudgetImportCardProps = {
  budgetVersion: BudgetVersion | null;
  onImportBudget: (items: BudgetItem[], version: BudgetVersion) => Promise<void>;
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-CO");

export function BudgetImportCard({ budgetVersion, onImportBudget }: BudgetImportCardProps) {
  const { audit, user } = useAuth();
  const [parsedBudget, setParsedBudget] = useState<ParsedBudgetExcel | null>(null);
  const [lastImportedVersion, setLastImportedVersion] = useState<BudgetVersion | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleFileChange(file: File | undefined) {
    setMessage("");
    setError("");
    setParsedBudget(null);
    setLastImportedVersion(null);

    if (!file) return;

    try {
      setIsReading(true);
      const parsed = await parseBudgetExcel(file);
      setParsedBudget(parsed);
      setMessage("Archivo leido correctamente. Revisa la validacion antes de confirmar.");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No fue posible leer el archivo Excel.");
    } finally {
      setIsReading(false);
    }
  }

  async function confirmImport() {
    if (!parsedBudget) return;
    if (!parsedBudget.canImport) {
      setError("No se puede importar: revisa actividades validas, valor total y columnas obligatorias.");
      return;
    }

    const confirmed = window.confirm("Esta importacion reemplazara el presupuesto maestro actual. Los avances calculados asociados al presupuesto anterior seran reiniciados. Desea continuar?");
    if (!confirmed) return;

    const nextVersion: BudgetVersion = {
      versionNumber: (budgetVersion?.versionNumber ?? 0) + 1,
      importedAt: new Date().toISOString(),
      importedBy: "Jose Martinez",
      fileName: parsedBudget.fileName,
      totalActivities: parsedBudget.activities.length,
      totalBudgetValue: parsedBudget.summary.totalBudgetValue
    };

    try {
      setIsImporting(true);
      setError("");
      setMessage("Importando presupuesto en Supabase...");
      await onImportBudget(parsedBudget.activities, nextVersion);
      setLastImportedVersion(nextVersion);
      setParsedBudget(null);
      setMessage("Presupuesto importado correctamente.");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No fue posible importar el presupuesto en Supabase.");
      setMessage("");
    } finally {
      setIsImporting(false);
    }
  }

  function cancelImport() {
    setParsedBudget(null);
    setMessage("Importacion cancelada. El presupuesto anterior se mantiene intacto.");
    setError("");
  }

  function handleExport() {
    audit("Usuario exporto documento.", (user?.email ?? "Usuario") + " exporto el presupuesto.");
    window.alert("Exportacion de presupuesto simulada.");
  }

  return (
    <section className="rounded-lg border border-dac-secondary/25 bg-dac-secondary/10 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-dac-primary/70">Importar presupuesto desde Excel</p>
            <h2 className="mt-1 text-xl font-black text-dac-primary">Validacion y auditoria de importacion</h2>
            <p className="mt-1 max-w-3xl text-sm text-dac-text/70">
              DAC lee la primera hoja del archivo, detecta actividades, descarta filas no importables y permite confirmar solo despues de revisar.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-96">
            <label className="focus-ring cursor-pointer rounded-md bg-dac-primary px-4 py-3 text-center text-sm font-black text-white hover:bg-dac-primary/90">
              Seleccionar Excel
              <input type="file" accept=".xlsx,.xls" onChange={(event) => handleFileChange(event.target.files?.[0])} className="sr-only" />
            </label>
            <button
              type="button"
              onClick={handleExport}
              className="focus-ring rounded-md border border-dac-primary/20 bg-white px-4 py-3 text-sm font-black text-dac-primary hover:bg-dac-secondary/10"
            >
              Exportar Presupuesto
            </button>
          </div>
        </div>

        {budgetVersion && <BudgetVersionPanel title="Presupuesto actual" version={budgetVersion} />}
        {lastImportedVersion && <BudgetVersionPanel title="Presupuesto importado correctamente" version={lastImportedVersion} highlight />}

        {isReading && <p className="rounded-md bg-white px-4 py-3 text-sm font-bold text-dac-primary">Leyendo archivo Excel...</p>}
        {isImporting && <p className="rounded-md bg-white px-4 py-3 text-sm font-bold text-dac-primary">Guardando y recargando presupuesto maestro desde Supabase...</p>}
        {message && <p className="rounded-md bg-white px-4 py-3 text-sm font-bold text-dac-primary">{message}</p>}
        {error && <p className="rounded-md bg-dac-alert/15 px-4 py-3 text-sm font-black text-dac-alert">{error}</p>}

        {parsedBudget && (
          <div className="rounded-lg border border-dac-primary/10 bg-white p-4">
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-dac-alert/10 p-4">
                <p className="text-sm font-black text-dac-alert">
                  Esta importacion reemplazara el presupuesto maestro actual. Los avances calculados asociados al presupuesto anterior seran reiniciados.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-lg font-black text-dac-primary">Validacion del archivo</h3>
                  <p className="text-sm font-semibold text-dac-text/65">{parsedBudget.fileName}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={confirmImport}
                    disabled={!parsedBudget.canImport || isImporting}
                    className="focus-ring rounded-md bg-dac-primary px-5 py-3 font-black text-white hover:bg-dac-secondary disabled:cursor-not-allowed disabled:bg-dac-primary/35"
                  >
                    {isImporting ? "Importando..." : "Confirmar importacion"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelImport}
                    disabled={isImporting}
                    className="focus-ring rounded-md border border-dac-primary/20 bg-white px-5 py-3 font-black text-dac-primary hover:bg-dac-secondary/10"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              <ValidationSummary parsedBudget={parsedBudget} />

              {parsedBudget.warnings.length > 0 && (
                <div className="rounded-md bg-dac-alert/10 p-3">
                  <p className="text-sm font-black text-dac-alert">Alertas de validacion</p>
                  <ul className="mt-2 grid gap-1 text-sm font-semibold text-dac-text/75">
                    {parsedBudget.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <PreviewTables parsedBudget={parsedBudget} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ValidationSummary({ parsedBudget }: { parsedBudget: ParsedBudgetExcel }) {
  const summary = parsedBudget.summary;
  const cards = [
    ["Nombre del archivo", summary.fileName],
    ["Filas leidas", numberFormatter.format(summary.rowsRead)],
    ["Actividades validas", numberFormatter.format(summary.validActivities)],
    ["Capitulos detectados", numberFormatter.format(summary.chaptersDetected)],
    ["Subcapitulos detectados", numberFormatter.format(summary.subchaptersDetected)],
    ["Filas descartadas", numberFormatter.format(summary.discardedRows)],
    ["Valor total detectado", currencyFormatter.format(summary.totalBudgetValue)],
    ["Columnas detectadas", summary.detectedColumns.map(formatColumnLabel).join(", ")]
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([label, value]) => (
        <Info key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function PreviewTables({ parsedBudget }: { parsedBudget: ParsedBudgetExcel }) {
  return (
    <div className="grid gap-5">
      <div>
        <h4 className="text-base font-black text-dac-primary">Primeras 20 actividades validas</h4>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="bg-dac-primary text-white">
              <tr>
                {["FILA", "ITEM", "DESCRIPCION", "UND", "CANT", "VALOR TOTAL", "%", "CAPITULO", "SUBCAPITULO"].map((header) => (
                  <th key={header} className="px-3 py-3 text-xs font-black uppercase">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedBudget.validRows.slice(0, 20).map((row) => (
                <tr key={row.rowNumber + row.item} className="border-b border-dac-primary/10 last:border-b-0">
                  <td className="px-3 py-3 text-sm font-black text-dac-primary">{row.rowNumber}</td>
                  <td className="px-3 py-3 text-sm font-black text-dac-primary">{row.item}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{row.description}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{row.unit}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{numberFormatter.format(row.quantity)}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{currencyFormatter.format(row.totalValue)}</td>
                  <td className="px-3 py-3 text-sm font-black text-dac-primary">{row.initialProgress.toFixed(1)} %</td>
                  <td className="px-3 py-3 text-sm font-semibold">{row.chapter}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{row.subchapter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h4 className="text-base font-black text-dac-primary">Primeras 20 filas descartadas</h4>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-dac-primary text-white">
              <tr>
                {["FILA", "ITEM", "DESCRIPCION", "MOTIVO"].map((header) => (
                  <th key={header} className="px-3 py-3 text-xs font-black uppercase">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedBudget.discardedRows.slice(0, 20).map((row) => (
                <tr key={row.rowNumber + row.reason} className="border-b border-dac-primary/10 last:border-b-0">
                  <td className="px-3 py-3 text-sm font-black text-dac-primary">{row.rowNumber}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{row.item || "-"}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{row.description || "-"}</td>
                  <td className="px-3 py-3"><span className="inline-flex rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-alert">{row.reason}</span></td>
                </tr>
              ))}
              {parsedBudget.discardedRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-sm font-semibold text-dac-text/60">No hay filas descartadas en la muestra.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BudgetVersionPanel({ title, version, highlight = false }: { title: string; version: BudgetVersion; highlight?: boolean }) {
  return (
    <div className={(highlight ? "border-dac-secondary bg-white" : "border-dac-primary/10 bg-white") + " grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5"}>
      <Info label={title} value={version.fileName} />
      <Info label="Version" value={String(version.versionNumber)} />
      <Info label="Fecha" value={new Date(version.importedAt).toLocaleString("es-CO")} />
      <Info label="Actividades" value={numberFormatter.format(version.totalActivities)} />
      <Info label="Valor total" value={currencyFormatter.format(version.totalBudgetValue)} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs font-black uppercase text-dac-text/50">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-dac-primary">{value || "No detectado"}</p>
    </div>
  );
}

function formatColumnLabel(column: string) {
  const labels: Record<string, string> = {
    item: "ITEM",
    description: "DESCRIPCION",
    unit: "UND",
    quantity: "CANTIDAD",
    unitValue: "VALOR UNITARIO",
    totalValue: "VALOR TOTAL",
    progress: "AVANCE"
  };

  return labels[column] ?? column;
}
