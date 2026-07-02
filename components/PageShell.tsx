"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AppBrand } from "@/components/AppBrand";
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
  const environment = getEnvironment();
  const navigation: NavItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Modo Obra", href: "/field" },
    { label: "Obra", href: "/projects/" + projectId },
    { label: "Registro Diario", href: "/projects/" + projectId + "/daily-report" },
    { label: "Bitacora", href: "/projects/" + projectId + "/bitacora" },
    { label: "Presupuesto", href: "/projects/" + projectId + "/budget" },
    { label: "Levantamiento", href: "/projects/" + projectId + "/initial-survey" },
    { label: "Planificación", href: "/projects/" + projectId + "/planning" },
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
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link href="/dashboard" className="focus-ring rounded-md">
                <AppBrand />
              </Link>
              <Link href="/" className="focus-ring rounded-md border border-dac-primary/20 px-4 py-2 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white lg:hidden">
                Salir
              </Link>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="hidden items-center gap-3 lg:flex">
                <StorageIndicator hasLocalData={hasLocalData} isHydrated={isHydrated} lastSavedAt={lastSavedAt} />
                <div className="text-right">
                  <p className="text-sm font-black text-dac-primary">{currentUser.firstName} {currentUser.lastName}</p>
                  <p className="text-xs font-semibold text-dac-text/60">{currentUser.role} - {adminCompany.name}</p>
                </div>
                <Link href="/" className="focus-ring rounded-md border border-dac-primary/20 px-4 py-2 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white">
                  Salir
                </Link>
              </div>

              <nav aria-label="Navegacion principal" className="-mx-1 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2 px-1">
                  {navigation.map((item) => (
                    <Link key={item.href} href={item.href} className={getNavClass(activeItem === item.label)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </nav>

              <div className="rounded-md bg-dac-primary/[0.04] px-3 py-2 lg:hidden">
                <p className="text-sm font-black text-dac-primary">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-xs font-semibold text-dac-text/60">{currentUser.role}</p>
                <p className="text-xs font-semibold text-dac-text/60">{adminCompany.name}</p>
                <StorageIndicator hasLocalData={hasLocalData} isHydrated={isHydrated} lastSavedAt={lastSavedAt} compact />
              </div>
            </div>
          </div>

          {backHref && backLabel && (
            <div className="mt-3">
              <Link href={backHref} className="focus-ring inline-flex rounded-md text-sm font-bold text-dac-primary hover:text-dac-secondary">
                {backLabel}
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</div>

      <footer className="border-t border-dac-primary/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs font-bold text-dac-text/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
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
    <div className={(compact ? "mt-2 " : "") + "rounded-md border border-dac-secondary/25 bg-dac-secondary/10 px-3 py-2 text-left"}>
      <p className="text-xs font-black text-dac-primary">{label}</p>
      {!compact && detail && <p className="text-[11px] font-semibold text-dac-text/60">Ultimo guardado: {detail}</p>}
    </div>
  );
}

function getNavClass(active: boolean) {
  return (
    "focus-ring whitespace-nowrap rounded-md border px-3 py-2 text-sm font-bold transition " +
    (active
      ? "border-dac-primary bg-dac-primary text-white"
      : "border-dac-primary/15 bg-white text-dac-primary hover:border-dac-secondary hover:bg-dac-secondary/10")
  );
}
