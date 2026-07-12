"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  activateProjectBudgetVersion,
  compareProjectBudgetVersions,
  listProjectBudgetVersions,
  loadProjectBudgetVersion,
  loadProjectBudgetVersionItems
} from "@/lib/supabase/budget-versions";
import { useProjectStore } from "@/lib/project-store";
import type { BudgetItem, BudgetVersionComparison, BudgetVersionSummary } from "@/types";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-CO");
const percentFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2
});

export function BudgetVersionsPanel({ projectId }: { projectId: string }) {
  const { refreshOfficialBudget } = useProjectStore();
  const [versions, setVersions] = useState<BudgetVersionSummary[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BudgetVersionSummary | null>(null);
  const [selectedItems, setSelectedItems] = useState<BudgetItem[]>([]);
  const [sourceVersionId, setSourceVersionId] = useState("");
  const [targetVersionId, setTargetVersionId] = useState("");
  const [comparison, setComparison] = useState<BudgetVersionComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activatingVersionId, setActivatingVersionId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function reloadVersions(showLoading = false) {
    try {
      if (showLoading) setIsLoading(true);
      setError("");
      const remoteVersions = await listProjectBudgetVersions(projectId);
      setVersions(remoteVersions);
      setSourceVersionId(remoteVersions.find((version) => version.status === "Oficial")?.id ?? remoteVersions[0]?.id ?? "");
      setTargetVersionId(remoteVersions.find((version) => version.status === "Borrador")?.id ?? remoteVersions[1]?.id ?? "");
      return remoteVersions;
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No fue posible cargar las versiones del presupuesto.");
      throw currentError;
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }

  useEffect(() => {
    reloadVersions(true).catch(() => undefined);
  }, [projectId]);

  const selectedSummary = useMemo(() => buildDetailSummary(selectedItems), [selectedItems]);

  async function openVersionDetail(versionId: string) {
    try {
      setIsDetailLoading(true);
      setMessage("");
      setError("");
      const [version, items] = await Promise.all([
        loadProjectBudgetVersion(projectId, versionId),
        loadProjectBudgetVersionItems(projectId, versionId)
      ]);
      setSelectedVersion(version);
      setSelectedItems(items);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No fue posible cargar el detalle de la version.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function compareVersions() {
    if (!sourceVersionId || !targetVersionId) {
      setError("Selecciona dos versiones para comparar.");
      return;
    }

    if (sourceVersionId === targetVersionId) {
      setError("Selecciona dos versiones diferentes.");
      return;
    }

    try {
      setIsComparing(true);
      setMessage("");
      setError("");
      const result = await compareProjectBudgetVersions(projectId, sourceVersionId, targetVersionId);
      setComparison(result);
      setMessage("Comparacion generada sin modificar datos.");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No fue posible comparar las versiones.");
    } finally {
      setIsComparing(false);
    }
  }

  async function activateVersion(version: BudgetVersionSummary) {
    if (!version.id || isActivating || !canActivateVersion(version)) return;

    const currentOfficial = versions.find((item) => item.status === "Oficial");
    const confirmation = [
      "Esta accion activara una nueva version Oficial del presupuesto.",
      "",
      "Version Oficial actual: " + (currentOfficial ? "V" + currentOfficial.versionNumber + " - " + currentOfficial.fileName : "No identificada"),
      "Version seleccionada: V" + version.versionNumber + " - " + version.fileName,
      "Items: " + numberFormatter.format(version.itemCount || version.totalActivities),
      "Valor total: " + currencyFormatter.format(version.totalBudgetValue),
      "",
      "La Oficial actual quedara Archivada.",
      "No se migraran avances historicos.",
      "No se ejecutara el Motor Central.",
      "",
      "Para confirmar, acepta esta ventana."
    ].join("\n");

    if (!window.confirm(confirmation)) return;

    try {
      setIsActivating(true);
      setActivatingVersionId(version.id);
      setMessage("");
      setError("");
      const result = await activateProjectBudgetVersion(projectId, version.id);
      await reloadVersions(false);
      await refreshOfficialBudget();
      setSelectedVersion(null);
      setSelectedItems([]);
      setComparison(null);
      setMessage(
        "Version " +
          result.activatedVersionNumber +
          " activada como Oficial. La version " +
          result.archivedVersionNumber +
          " quedo Archivada."
      );
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No fue posible activar la version seleccionada.");
    } finally {
      setIsActivating(false);
      setActivatingVersionId("");
    }
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-dac-primary/70">Versiones de presupuesto</p>
            <h2 className="mt-1 text-xl font-black text-dac-primary">Consulta y trazabilidad</h2>
            <p className="mt-1 max-w-3xl text-sm text-dac-text/70">
              Consulta versiones Oficiales, Borradores y Archivadas. Esta vista no activa presupuestos ni modifica datos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedVersion(null);
              setSelectedItems([]);
              setComparison(null);
              setMessage("");
            }}
            className="focus-ring rounded-md border border-dac-primary/20 bg-white px-4 py-2 text-sm font-black text-dac-primary hover:bg-dac-secondary/10"
          >
            Limpiar vista
          </button>
        </div>

        {isLoading && <p className="mt-4 rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-bold text-dac-primary">Cargando versiones...</p>}
        {message && <p className="mt-4 rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-bold text-dac-primary">{message}</p>}
        {error && <p className="mt-4 rounded-md bg-dac-alert/15 px-4 py-3 text-sm font-black text-dac-alert">{error}</p>}

        {!isLoading && versions.length === 0 && (
          <p className="mt-4 rounded-md bg-dac-primary/5 px-4 py-3 text-sm font-semibold text-dac-text/70">No existen versiones de presupuesto para este proyecto.</p>
        )}

        {versions.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-lg border border-dac-primary/10">
            <table className="min-w-full border-collapse bg-white text-left">
              <thead className="bg-dac-primary text-white">
                <tr>
                  <HeaderCell>Version</HeaderCell>
                  <HeaderCell>Estado</HeaderCell>
                  <HeaderCell>Archivo</HeaderCell>
                  <HeaderCell>Importacion</HeaderCell>
                  <HeaderCell>Usuario</HeaderCell>
                  <HeaderCell>Items</HeaderCell>
                  <HeaderCell>Valor total</HeaderCell>
                  <HeaderCell>Accion</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id ?? version.versionNumber} className="border-b border-dac-primary/10 last:border-b-0">
                    <BodyCell>
                      <span className="font-black text-dac-primary">V{version.versionNumber}</span>
                    </BodyCell>
                    <BodyCell>
                      <StatusBadge status={version.status ?? "Borrador"} />
                    </BodyCell>
                    <BodyCell>
                      <span className="block max-w-xs truncate font-bold text-dac-text">{version.fileName}</span>
                    </BodyCell>
                    <BodyCell>{formatDate(version.importedAt)}</BodyCell>
                    <BodyCell>{version.importedBy}</BodyCell>
                    <BodyCell>{numberFormatter.format(version.itemCount || version.totalActivities)}</BodyCell>
                    <BodyCell>{currencyFormatter.format(version.totalBudgetValue)}</BodyCell>
                    <BodyCell>
                      <button
                        type="button"
                        onClick={() => version.id && openVersionDetail(version.id)}
                        disabled={!version.id || isDetailLoading}
                        className="focus-ring rounded-md bg-dac-primary px-3 py-2 text-xs font-black text-white hover:bg-dac-secondary disabled:bg-dac-primary/35"
                      >
                        Ver version
                      </button>
                      {canActivateVersion(version) && (
                        <button
                          type="button"
                          onClick={() => activateVersion(version)}
                          disabled={!version.id || isActivating}
                          className="focus-ring ml-2 rounded-md bg-dac-alert px-3 py-2 text-xs font-black text-white hover:bg-dac-alert/85 disabled:bg-dac-alert/35"
                        >
                          {activatingVersionId === version.id ? "Activando..." : "Activar como Oficial"}
                        </button>
                      )}
                    </BodyCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {versions.length >= 2 && (
        <div className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-dac-primary/70">Comparar versiones</p>
              <h3 className="mt-1 text-lg font-black text-dac-primary">Selecciona dos versiones</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <VersionSelect label="Version origen" value={sourceVersionId} versions={versions} onChange={setSourceVersionId} />
              <VersionSelect label="Version destino" value={targetVersionId} versions={versions} onChange={setTargetVersionId} />
              <button
                type="button"
                onClick={compareVersions}
                disabled={isComparing}
                className="focus-ring rounded-md bg-dac-primary px-5 py-3 text-sm font-black text-white hover:bg-dac-secondary disabled:bg-dac-primary/35"
              >
                {isComparing ? "Comparando..." : "Comparar"}
              </button>
            </div>
          </div>

          {comparison && <ComparisonSummary comparison={comparison} />}
        </div>
      )}

      {selectedVersion && (
        <div className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-dac-primary/70">Detalle de version</p>
              <h3 className="mt-1 text-xl font-black text-dac-primary">Version {selectedVersion.versionNumber} - {selectedVersion.fileName}</h3>
              <div className="mt-2"><StatusBadge status={selectedVersion.status ?? "Borrador"} /></div>
            </div>
            <p className="rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-black text-dac-primary">
              {numberFormatter.format(selectedItems.length)} items
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Valor total" value={currencyFormatter.format(selectedSummary.totalValue)} />
            <Metric label="Capitulos" value={numberFormatter.format(selectedSummary.chapters)} />
            <Metric label="Obras extras" value={numberFormatter.format(selectedSummary.extraWorks)} />
            <Metric label="Valor obras extras" value={currencyFormatter.format(selectedSummary.extraWorksValue)} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <VersionBreakdown title="Capitulos" rows={selectedSummary.chapterRows} />
            <VersionBreakdown title="Obras extras" rows={selectedSummary.extraWorkRows} />
          </div>

          <div className="mt-5 overflow-x-auto rounded-lg border border-dac-primary/10">
            <table className="min-w-full border-collapse bg-white text-left">
              <thead className="bg-dac-primary text-white">
                <tr>
                  <HeaderCell>Item</HeaderCell>
                  <HeaderCell>Descripcion</HeaderCell>
                  <HeaderCell>Unidad</HeaderCell>
                  <HeaderCell>Cantidad</HeaderCell>
                  <HeaderCell>Valor unitario</HeaderCell>
                  <HeaderCell>Valor total</HeaderCell>
                  <HeaderCell>Capitulo</HeaderCell>
                  <HeaderCell>Tipo</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {selectedItems.slice(0, 250).map((item) => (
                  <tr key={item.id ?? item.item + "-" + item.importOrder} className="border-b border-dac-primary/10 last:border-b-0">
                    <BodyCell><span className="font-black text-dac-primary">{item.item}</span></BodyCell>
                    <BodyCell><span className="block min-w-72 font-bold text-dac-text">{item.description}</span></BodyCell>
                    <BodyCell>{item.unit}</BodyCell>
                    <BodyCell>{numberFormatter.format(item.quantity)}</BodyCell>
                    <BodyCell>{currencyFormatter.format(item.unitValue)}</BodyCell>
                    <BodyCell>{currencyFormatter.format(item.totalValue)}</BodyCell>
                    <BodyCell>{item.chapter || "-"}</BodyCell>
                    <BodyCell>{item.budgetType || "Presupuesto Base"}</BodyCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function VersionSelect({
  label,
  value,
  versions,
  onChange
}: {
  label: string;
  value: string;
  versions: BudgetVersionSummary[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase text-dac-text/50">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring mt-1 w-full rounded-md border border-dac-primary/15 bg-white px-3 py-3 text-sm font-semibold text-dac-text shadow-sm outline-none"
      >
        {versions.map((version) => (
          <option key={version.id ?? version.versionNumber} value={version.id}>
            Version {version.versionNumber} - {version.status} - {version.fileName}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparisonSummary({ comparison }: { comparison: BudgetVersionComparison }) {
  const cards = [
    ["Items nuevos", comparison.newItems.length],
    ["Items eliminados", comparison.removedItems.length],
    ["Cambios detectados", comparison.changedItems.length],
    ["Cambios en obras extras", comparison.extraWorksChanges.length],
    ["Diferencia total", currencyFormatter.format(comparison.totalDifference)]
  ];

  return (
    <div className="mt-5 grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <Metric key={label} label={String(label)} value={String(value)} />
        ))}
      </div>
      <div className="rounded-md bg-dac-primary/5 p-4">
        <p className="text-sm font-bold text-dac-text/70">
          Criterio de comparacion: ITEM + orden de importacion + descripcion. La comparacion no modifica datos.
        </p>
      </div>
    </div>
  );
}

function VersionBreakdown({ title, rows }: { title: string; rows: Array<{ label: string; count: number; value: number }> }) {
  return (
    <div className="rounded-lg border border-dac-primary/10 bg-dac-primary/5 p-4">
      <h4 className="text-sm font-black uppercase text-dac-primary/70">{title}</h4>
      <div className="mt-3 grid max-h-72 gap-2 overflow-auto pr-1">
        {rows.length === 0 && <p className="text-sm font-semibold text-dac-text/60">Sin registros.</p>}
        {rows.map((row) => (
          <div key={row.label} className="rounded-md bg-white p-3 text-sm">
            <p className="font-black text-dac-text">{row.label || "Sin clasificar"}</p>
            <p className="mt-1 font-semibold text-dac-text/65">
              {numberFormatter.format(row.count)} items / {currencyFormatter.format(row.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={getStatusClass(status)}>{status}</span>;
}

function canActivateVersion(version: BudgetVersionSummary) {
  return version.status === "Borrador" || version.status === "En revision";
}

function getStatusClass(status: string) {
  if (status === "Oficial") return "inline-flex rounded-full bg-dac-primary px-3 py-1 text-xs font-black text-white";
  if (status === "Borrador") return "inline-flex rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-alert";
  if (status === "Archivada") return "inline-flex rounded-full bg-dac-text/10 px-3 py-1 text-xs font-black text-dac-text/70";
  return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
}

function HeaderCell({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-3 text-xs font-black uppercase tracking-wide">{children}</th>;
}

function BodyCell({ children }: { children: ReactNode }) {
  return <td className="px-3 py-3 text-sm font-semibold text-dac-text/75">{children}</td>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-dac-text/50">{label}</p>
      <p className="mt-2 text-xl font-black text-dac-primary">{value}</p>
    </article>
  );
}

function buildDetailSummary(items: BudgetItem[]) {
  const chapters = groupRows(items, (item) => item.chapter || "Sin capitulo");
  const extraWorks = items.filter(isExtraWork);

  return {
    totalValue: items.reduce((sum, item) => sum + item.totalValue, 0),
    chapters: chapters.length,
    extraWorks: extraWorks.length,
    extraWorksValue: extraWorks.reduce((sum, item) => sum + item.totalValue, 0),
    chapterRows: chapters,
    extraWorkRows: groupRows(extraWorks, (item) => item.chapter || "Obra Extra")
  };
}

function groupRows(items: BudgetItem[], getLabel: (item: BudgetItem) => string) {
  const grouped = new Map<string, { label: string; count: number; value: number }>();
  for (const item of items) {
    const label = getLabel(item);
    const current = grouped.get(label) ?? { label, count: 0, value: 0 };
    grouped.set(label, { ...current, count: current.count + 1, value: current.value + item.totalValue });
  }
  return Array.from(grouped.values()).sort((left, right) => right.value - left.value);
}

function isExtraWork(item: BudgetItem) {
  return (item.budgetType ?? "").toLowerCase() === "obra extra" || item.item.trim().toUpperCase().startsWith("OE");
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
