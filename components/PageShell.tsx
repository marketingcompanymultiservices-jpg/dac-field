"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AppBrand } from "@/components/AppBrand";
import { useAuth } from "@/components/AuthProvider";
import { getVersionLabel } from "@/lib/appConfig";
import { getEnvironment } from "@/lib/environment";
import { useProjectStore } from "@/lib/project-store";

type NavItem = {
  label: string;
  href: string;
};

export function PageShell({
  children,
  activeItem,
  projectId = "quintas-de-acuarela",
  backHref,
  backLabel
}: {
  children: ReactNode;
  activeItem?: string;
  projectId?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const { adminCompany, currentUser, hasLocalData, isHydrated, lastSavedAt } = useProjectStore();
  const { logout, profile, user } = useAuth();
  const displayName = profile ? profile.firstName + " " + profile.lastName : user?.email ?? currentUser.firstName + " " + currentUser.lastName;
  const displayRole = profile?.role ?? currentUser.role;
  const environment = getEnvironment();
  const navigation: NavItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Modo Obra", href: "/field" },
    { label: "Obra", href: "/projects/" + projectId },
    { label: "Registro Diario", href: "/projects/" + projectId + "/daily-report" },
    { label: "Bitacora", href: "/projects/" + projectId + "/bitacora" },
    { label: "Presupuesto", href: "/projects/" + projectId + "/budget" },
    { label: "Levantamiento", href: "/projects/" + projectId + "/initial-survey" },
    { label: "Inspecciones de Dirección", href: "/projects/" + projectId + "/direction-inspections" },
    { label: "PlanificaciÃ³n", href: "/projects/" + projectId + "/planning" },
    { label: "Avance", href: "/projects/" + projectId + "/progress" },
    { label: "Alertas", href: "/projects/" + projectId + "/alerts" },
    { label: "Documentos", href: "/projects/" + projectId + "/documents" },
    { label: "Reportes", href: "/projects/" + projectId + "/reports" },
    { label: "Compromisos", href: "/projects/" + projectId + "/commitments" },
    { label: "Administracion", href: "/admin" },
    { label: "Acerca de", href: "/about" }
  ];

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-dac-primary/10 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[1800px] px-3 py-2 sm:px-4 lg:px-5">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link href="/dashboard" className="focus-ring rounded-md">
                <AppBrand />
              </Link>
              <button type="button" onClick={logout} className="focus-ring rounded-md border border-dac-primary/20 px-3 py-1.5 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white xl:hidden">
                Salir
              </button>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 xl:items-end">
              <div className="hidden items-center gap-2 xl:flex">
                <StorageIndicator hasLocalData={hasLocalData} isHydrated={isHydrated} lastSavedAt={lastSavedAt} />
                <div className="text-right">
                  <p className="text-sm font-black text-dac-primary">{displayName}</p>
                  <p className="text-xs font-semibold text-dac-text/60">{displayRole} - {adminCompany.name}</p>
                </div>
                <button type="button" onClick={logout} className="focus-ring rounded-md border border-dac-primary/20 px-3 py-1.5 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white">
                  Salir
                </button>
              </div>

              <nav aria-label="Navegacion principal" className="w-full overflow-x-auto pb-0.5 xl:w-auto xl:max-w-full">
                <div className="flex min-w-max gap-1.5">
                  {navigation.map((item) => (
                    <Link key={item.href} href={item.href} className={getNavClass(activeItem === item.label)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </nav>

              <div className="rounded-md bg-dac-primary/[0.04] px-3 py-2 lg:hidden">
                <p className="text-sm font-black text-dac-primary">{displayName}</p>
                <p className="text-xs font-semibold text-dac-text/60">{displayRole}</p>
                <p className="text-xs font-semibold text-dac-text/60">{adminCompany.name}</p>
                <StorageIndicator hasLocalData={hasLocalData} isHydrated={isHydrated} lastSavedAt={lastSavedAt} compact />
              </div>
            </div>
          </div>

          {backHref && backLabel && (
            <div className="mt-2">
              <Link href={backHref} className="focus-ring inline-flex rounded-md text-sm font-bold text-dac-primary hover:text-dac-secondary">
                {backLabel}
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1800px] overflow-x-hidden px-3 py-4 sm:px-4 sm:py-5 lg:px-5">{children}</div>

      <footer className="border-t border-dac-primary/10 bg-white">
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 px-3 py-3 text-xs font-bold text-dac-text/55 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-5">
          <Link href="/about" className="focus-ring rounded-md text-dac-primary hover:text-dac-secondary">
            {getVersionLabel()}
          </Link>
          <span>Ambiente: {environment.environment}</span>
        </div>
      </footer>
    </main>
  );
}

function StorageIndicator({
  hasLocalData,
  isHydrated,
  lastSavedAt,
  compact = false
}: {
  hasLocalData: boolean;
  isHydrated: boolean;
  lastSavedAt: string | null;
  compact?: boolean;
}) {
  const label = !isHydrated
    ? "Cargando datos locales"
    : hasLocalData
      ? "Datos guardados localmente"
      : "Datos de prueba";
  const detail = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className={(compact ? "mt-2 " : "") + "rounded-md border border-dac-secondary/25 bg-dac-secondary/10 px-2.5 py-1.5 text-left"}>
      <p className="text-xs font-black text-dac-primary">{label}</p>
      {!compact && detail && <p className="text-[11px] font-semibold text-dac-text/60">Ultimo guardado: {detail}</p>}
    </div>
  );
}

function getNavClass(active: boolean) {
  return (
    "focus-ring whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[13px] font-bold transition " +
    (active
      ? "border-dac-primary bg-dac-primary text-white"
      : "border-dac-primary/15 bg-white text-dac-primary hover:border-dac-secondary hover:bg-dac-secondary/10")
  );
}


