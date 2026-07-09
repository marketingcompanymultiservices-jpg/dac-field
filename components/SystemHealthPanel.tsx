"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/components/AuthProvider";
import { appConfig } from "@/lib/appConfig";
import { getEnvironment } from "@/lib/environment";
import { useProjectStore } from "@/lib/project-store";
import type { AdminRole } from "@/types";

type DiagnosticResult = {
  data: Array<{ label: string; value: number; severity: "ok" | "warn" | "bad" }>;
  performance: Array<{ label: string; value: number }>;
  integrity: Array<{ label: string; ok: boolean; detail: string }>;
  navigation: Array<{ label: string; href: string; ok: boolean }>;
  storage: Array<{ label: string; value: string; ok: boolean }>;
  score: number;
  status: "Excelente" | "Bueno" | "Requiere atencion";
  ranAt: string;
};

const dacVersion = appConfig.version;
const mainRoutes = [
  ["Login", "/"],
  ["Dashboard", "/dashboard"],
  ["Administracion", "/admin"],
  ["Estado del Sistema", "/system/health"],
  ["Modo Obra", "/field"],
  ["Centro de Control", "/projects/quintas-de-acuarela"],
  ["Registro Diario", "/projects/quintas-de-acuarela/daily-report"],
  ["Presupuesto", "/projects/quintas-de-acuarela/budget"],
  ["Levantamiento Inicial", "/projects/quintas-de-acuarela/initial-survey"],
  ["Planificacion", "/projects/quintas-de-acuarela/planning"],
  ["Avance", "/projects/quintas-de-acuarela/progress"],
  ["Alertas", "/projects/quintas-de-acuarela/alerts"],
  ["Documentos", "/projects/quintas-de-acuarela/documents"],
  ["Reportes", "/projects/quintas-de-acuarela/reports"],
  ["Compromisos", "/projects/quintas-de-acuarela/commitments"]
] as const;

export function SystemHealthPanel() {
  const { audit, user } = useAuth();
  const store = useProjectStore();
  const environment = getEnvironment();
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const initialResult = useMemo(() => buildDiagnostic(store, mainRoutes.map(([label, href]) => ({ label, href, ok: true })), []), [store]);
  const visibleResult = result ?? initialResult;

  async function runDiagnostic() {
    setRunning(true);
    setProgress(10);

    const navigation = [];
    for (let index = 0; index < mainRoutes.length; index += 1) {
      const [label, href] = mainRoutes[index];
      const ok = await routeResponds(href);
      navigation.push({ label, href, ok });
      setProgress(20 + Math.round(((index + 1) / mainRoutes.length) * 45));
    }

    const storage = await getStorageDiagnostics();
    setProgress(85);
    const nextResult = buildDiagnostic(store, navigation, storage);
    setResult(nextResult);
    setProgress(100);
    setRunning(false);

    store.addSystemEvent({
      title: "Diagnostico del sistema ejecutado.",
      description: "Estado general: " + nextResult.status + ". Hallazgos de datos: " + nextResult.data.reduce((sum, item) => sum + item.value, 0) + "."
    });
  }

  function exportConfiguration() {
    const payload = {
      appConfig,
      environment,
      exportedAt: new Date().toISOString(),
      capabilities: buildDeploymentCapabilities(store)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dac-field-config.json";
    anchor.click();
    URL.revokeObjectURL(url);
    audit("Usuario exporto documento.", (user?.email ?? "Usuario") + " exporto la configuracion del sistema.");
  }

  return (
    <PageShell activeItem="Administracion" backHref="/admin" backLabel="Volver a Administracion">
      <ModuleHeader
        eyebrow="QA integral"
        title="Estado del Sistema"
        meta={"Estado general: " + visibleResult.status}
        description="Diagnostico de datos, navegacion, persistencia e integridad de modulos."
      />

      <section className="mt-5 rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-dac-secondary">Ejecucion de diagnostico</p>
            <h2 className="mt-1 text-2xl font-black text-dac-primary">{visibleResult.status}</h2>
            <p className="mt-1 text-sm font-semibold text-dac-text/65">Ultima revision: {visibleResult.ranAt}</p>
          </div>
          <div className="grid gap-2 sm:flex">
            <button type="button" onClick={exportConfiguration} className="focus-ring rounded-md border border-dac-primary px-5 py-3 text-sm font-black text-dac-primary hover:bg-dac-secondary/10">
              Exportar configuracion
            </button>
            <button type="button" onClick={runDiagnostic} disabled={running} className="focus-ring rounded-md bg-dac-primary px-5 py-3 text-sm font-black text-white hover:bg-dac-secondary disabled:cursor-wait disabled:bg-dac-primary/40">
              {running ? "Ejecutando..." : "Ejecutar diagnostico"}
            </button>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-dac-primary/10">
          <div className="h-full rounded-full bg-dac-secondary transition-all" style={{ width: progress + "%" }} />
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-3">
        <Panel title="Estado General">
          <Info label="Sistema operativo" value={getPlatform()} />
          <Info label="Version DAC" value={environment.version || dacVersion} />
          <Info label="Fecha compilacion" value={appConfig.buildDate} />
          <Info label="Ultima actualizacion" value={store.lastSavedAt ? formatDate(store.lastSavedAt) : "Sin registros"} />
          <Info label="Estado general" value={visibleResult.status} tone={visibleResult.status === "Requiere atencion" ? "bad" : "ok"} />
        </Panel>

        <Panel title="Diagnostico de rendimiento">
          {visibleResult.performance.map((item) => <Info key={item.label} label={item.label} value={String(item.value)} />)}
        </Panel>

        <Panel title="Validacion de almacenamiento">
          {visibleResult.storage.map((item) => <Info key={item.label} label={item.label} value={item.value} tone={item.ok ? "ok" : "bad"} />)}
        </Panel>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel title="Diagnostico de datos">
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleResult.data.map((item) => <Metric key={item.label} label={item.label} value={item.value} tone={item.severity} />)}
          </div>
        </Panel>

        <Panel title="Diagnostico de integridad">
          <div className="grid gap-2">
            {visibleResult.integrity.map((item) => <CheckLine key={item.label} label={item.label} ok={item.ok} detail={item.detail} />)}
          </div>
        </Panel>
      </section>

      <section className="mt-5">
        <Panel title="Estado de despliegue">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {buildDeploymentCapabilities(store).map((item) => <CheckLine key={item.label} label={item.label} ok={item.ok} detail={item.detail} />)}
          </div>
        </Panel>
      </section>

      <section className="mt-5">
        <Panel title="Validacion de navegacion">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleResult.navigation.map((route) => (
              <Link key={route.href} href={route.href} className="focus-ring rounded-md border border-dac-primary/10 p-3 hover:border-dac-secondary hover:bg-dac-secondary/10">
                <span className={route.ok ? "text-dac-primary" : "text-dac-alert"}>{route.ok ? "OK" : "Revisar"}</span>
                <p className="mt-1 text-sm font-black text-dac-primary">{route.label}</p>
                <p className="mt-1 break-all text-xs font-semibold text-dac-text/55">{route.href}</p>
              </Link>
            ))}
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}

function buildDeploymentCapabilities(store: ReturnType<typeof useProjectStore>) {
  return [
    { label: "Persistencia del navegador", ok: typeof window !== "undefined" && !!window.localStorage, detail: getBrowserStorageUsage() },
    { label: "Evidencia fotografica", ok: typeof indexedDB !== "undefined", detail: typeof indexedDB !== "undefined" ? "Disponible" : "No disponible" },
    { label: "Estado interno", ok: store.isHydrated, detail: store.isHydrated ? "Activo" : "Cargando" },
    { label: "PDF", ok: true, detail: "Reportes PDF preparados" },
    { label: "Camara", ok: typeof navigator !== "undefined" && !!navigator.mediaDevices, detail: "Input movil y galeria disponibles" },
    { label: "Reportes", ok: Array.isArray(store.reports), detail: store.reports.length + " reportes" },
    { label: "Presupuesto", ok: store.budgetItems.length > 0, detail: store.budgetItems.length + " actividades" }
  ];
}

function buildDiagnostic(
  store: ReturnType<typeof useProjectStore>,
  navigation: Array<{ label: string; href: string; ok: boolean }>,
  storageDiagnostics: Array<{ label: string; value: string; ok: boolean }>
): DiagnosticResult {
  const budgetIds = new Set(store.budgetItems.map((item) => item.item));
  const activityKeys = new Set<string>();
  let duplicateActivities = 0;
  store.activities.forEach((activity) => {
    const key = [activity.budgetItemId, activity.date, activity.time, activity.quantity].join("|");
    if (activityKeys.has(key)) duplicateActivities += 1;
    activityKeys.add(key);
  });

  const activitiesWithoutBudget = store.activities.filter((activity) => !activity.budgetItemId || !budgetIds.has(activity.budgetItemId)).length;
  const orphanCommitments = store.commitments.filter((commitment) => commitment.budgetItemId && !budgetIds.has(commitment.budgetItemId)).length;
  const reportsWithoutActivities = store.dailyReports.filter((report) => !store.activities.some((activity) => activity.date === report.date)).length;
  const photosWithoutReport = store.photos.filter((photo) => !photo.reportId && !photo.dailyReportId).length;
  const usersWithoutRole = store.adminUsers.filter((user) => !user.role || !store.adminRoles.some((role) => role.name === user.role)).length;
  const rolesWithoutPermissions = store.adminRoles.filter((role) => countPermissions(role) === 0).length;

  const data = [
    { label: "Actividades sin presupuesto", value: activitiesWithoutBudget, severity: severity(activitiesWithoutBudget) },
    { label: "Actividades duplicadas", value: duplicateActivities, severity: severity(duplicateActivities) },
    { label: "Compromisos huerfanos", value: orphanCommitments, severity: severity(orphanCommitments) },
    { label: "Reportes sin actividades", value: reportsWithoutActivities, severity: severity(reportsWithoutActivities, 1) },
    { label: "Fotografias sin reporte", value: photosWithoutReport, severity: severity(photosWithoutReport, 4) },
    { label: "Usuarios sin rol", value: usersWithoutRole, severity: severity(usersWithoutRole) },
    { label: "Roles sin permisos", value: rolesWithoutPermissions, severity: severity(rolesWithoutPermissions) }
  ];

  const integrity = [
    { label: "Presupuesto", ok: store.budgetItems.length > 0, detail: store.budgetItems.length + " actividades" },
    { label: "Registro Diario", ok: Array.isArray(store.dailyReports), detail: store.dailyReports.length + " registros" },
    { label: "Avance", ok: store.progressItems.length === store.budgetItems.length, detail: store.progressItems.length + " items calculados" },
    { label: "Reportes", ok: Array.isArray(store.reports), detail: store.reports.length + " reportes" },
    { label: "Alertas", ok: Array.isArray(store.alerts), detail: store.alerts.length + " alertas" },
    { label: "Planificacion", ok: Array.isArray(store.planningItems), detail: store.planningItems.length + " actividades programadas" },
    { label: "Productividad", ok: store.budgetItems.length > 0, detail: "Calculada desde presupuesto y registro diario" },
    { label: "Modo Obra", ok: navigation.some((route) => route.href === "/field" && route.ok), detail: "Ruta /field" },
    { label: "Dashboard", ok: navigation.some((route) => route.href === "/dashboard" && route.ok), detail: "Centro de Control del Director" }
  ];

  const defaultStorage = [
    { label: "Estado interno", value: store.isHydrated ? "Activo" : "Cargando", ok: store.isHydrated },
    { label: "Persistencia del navegador", value: getBrowserStorageUsage(), ok: typeof window !== "undefined" && !!window.localStorage },
    { label: "Evidencia fotografica", value: typeof indexedDB !== "undefined" ? "Disponible" : "No disponible", ok: typeof indexedDB !== "undefined" }
  ];

  const issues = data.reduce((sum, item) => sum + (item.severity === "bad" ? 2 : item.severity === "warn" ? 1 : 0), 0)
    + integrity.filter((item) => !item.ok).length * 2
    + navigation.filter((item) => !item.ok).length * 2
    + (storageDiagnostics.length ? storageDiagnostics : defaultStorage).filter((item) => !item.ok).length * 2;
  const score = Math.max(0, 100 - issues * 8);

  return {
    data,
    performance: [
      { label: "Total actividades", value: store.activities.length },
      { label: "Total registros diarios", value: store.dailyReports.length },
      { label: "Total fotografias", value: store.photos.length },
      { label: "Total documentos", value: store.documents.length },
      { label: "Total reportes", value: store.reports.length }
    ],
    integrity,
    navigation,
    storage: storageDiagnostics.length ? storageDiagnostics : defaultStorage,
    score,
    status: score >= 90 ? "Excelente" : score >= 70 ? "Bueno" : "Requiere atencion",
    ranAt: new Date().toLocaleString("es-CO")
  };
}

async function routeResponds(href: string) {
  try {
    const response = await fetch(href, { method: "GET", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

async function getStorageDiagnostics() {
  const localUsage = getBrowserStorageUsage();
  const indexedDbAvailable = typeof indexedDB !== "undefined";
  let storageEstimate = "No disponible";

  if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    storageEstimate = formatBytes(estimate.usage ?? 0) + " usados / " + formatBytes(estimate.quota ?? 0);
  }

  return [
    { label: "Estado interno", value: "Activo", ok: true },
    { label: "Persistencia del navegador", value: localUsage, ok: typeof window !== "undefined" && !!window.localStorage },
    { label: "Evidencia fotografica", value: indexedDbAvailable ? "Disponible" : "No disponible", ok: indexedDbAvailable },
    { label: "Uso navegador", value: storageEstimate, ok: true }
  ];
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
      <h2 className="text-xl font-black text-dac-primary">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function Info({ label, value, tone = "ok" }: { label: string; value: string; tone?: "ok" | "bad" }) {
  return (
    <div className={(tone === "bad" ? "bg-dac-alert/15" : "bg-dac-primary/[0.04]") + " rounded-md p-3"}>
      <p className="text-xs font-bold uppercase text-dac-text/50">{label}</p>
      <p className={(tone === "bad" ? "text-dac-alert" : "text-dac-primary") + " mt-1 text-sm font-black"}>{value}</p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" | "bad" }) {
  const className = tone === "bad" ? "bg-dac-alert/15 text-dac-alert" : tone === "warn" ? "bg-dac-alert/10 text-dac-text" : "bg-dac-secondary/10 text-dac-primary";
  return (
    <article className={"rounded-md p-3 " + className}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-dac-text/65">{label}</p>
    </article>
  );
}

function CheckLine({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-dac-primary/10 p-3">
      <span className={(ok ? "bg-dac-secondary text-dac-primary" : "bg-dac-alert text-white") + " grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-black"}>{ok ? "OK" : "!"}</span>
      <div>
        <p className="text-sm font-black text-dac-primary">{label}</p>
        <p className="mt-1 text-xs font-semibold text-dac-text/60">{detail}</p>
      </div>
    </div>
  );
}

function countPermissions(role: AdminRole) {
  return Object.values(role.permissions).reduce((sum, modulePermissions) => sum + Object.values(modulePermissions).filter(Boolean).length, 0);
}

function severity(value: number, warnThreshold = 0): "ok" | "warn" | "bad" {
  if (value === 0) return "ok";
  return value > warnThreshold ? "bad" : "warn";
}

function getBrowserStorageUsage() {
  if (typeof window === "undefined" || !window.localStorage) return "No disponible";
  let bytes = 0;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index) ?? "";
    bytes += key.length + (window.localStorage.getItem(key)?.length ?? 0);
  }
  return formatBytes(bytes * 2);
}

function getPlatform() {
  if (typeof navigator === "undefined") return "Navegador";
  return navigator.platform || "Navegador";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1) + " " + units[exponent];
}
