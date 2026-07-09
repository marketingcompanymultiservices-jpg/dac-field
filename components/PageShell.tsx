"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { AppBrand } from "@/components/AppBrand";
import { useAuth } from "@/components/AuthProvider";
import { getVersionLabel } from "@/lib/appConfig";
import { useProjectStore } from "@/lib/project-store";
import type { AdminPermissionModule } from "@/types";

type NavItem = {
  label: string;
  href: string;
  permission?: AdminPermissionModule;
};

type NavGroup = {
  title: string;
  items: NavItem[];
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
  const { adminCompany, adminRoles, currentUser, hasLocalData, isHydrated, lastSavedAt, project } = useProjectStore();
  const { logout, profile, user } = useAuth();
  const displayName = profile ? profile.firstName + " " + profile.lastName : user?.email ?? currentUser.firstName + " " + currentUser.lastName;
  const displayRole = profile?.role ?? currentUser.role;
  const roleConfig = adminRoles.find((role) => role.name === displayRole);
  const navigation: NavGroup[] = [
    {
      title: "Dashboard",
      items: [{ label: "Dashboard", href: "/dashboard", permission: "Dashboard" }]
    },
    {
      title: "Obra",
      items: [
        { label: "Modo Obra", href: "/field", permission: "Registro Diario" },
        { label: "Obra", href: "/projects/" + projectId },
        { label: "Levantamiento", href: "/projects/" + projectId + "/initial-survey", permission: "Levantamiento Inicial" },
        { label: "Avance", href: "/projects/" + projectId + "/progress", permission: "Avance" },
        { label: "Planificación", href: "/projects/" + projectId + "/planning" }
      ]
    },
    {
      title: "Control",
      items: [
        { label: "Registro Diario", href: "/projects/" + projectId + "/daily-report", permission: "Registro Diario" },
        { label: "Inspecciones de Dirección", href: "/projects/" + projectId + "/direction-inspections", permission: "Inspecciones de Direccion" },
        { label: "Compromisos", href: "/projects/" + projectId + "/commitments", permission: "Compromisos" },
        { label: "Alertas", href: "/projects/" + projectId + "/alerts" }
      ]
    },
    {
      title: "Gestión",
      items: [
        { label: "Presupuesto", href: "/projects/" + projectId + "/budget", permission: "Presupuesto" },
        { label: "Reportes", href: "/projects/" + projectId + "/reports", permission: "Reportes" },
        { label: "Documentos", href: "/projects/" + projectId + "/documents", permission: "Documentos" }
      ]
    },
    {
      title: "Administración",
      items: [
        { label: "Empresa", href: "/admin#empresa", permission: "Administracion" },
        { label: "Usuarios", href: "/admin#usuarios", permission: "Administracion" },
        { label: "Roles", href: "/admin#roles", permission: "Administracion" },
        { label: "Permisos", href: "/admin#permisos", permission: "Administracion" }
      ]
    }
  ];
  const visibleNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canView(item.permission, roleConfig, displayRole))
    }))
    .filter((group) => group.items.length > 0);

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-dac-primary/10 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[1800px] px-3 py-2 sm:px-4 lg:px-5">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <Link href="/dashboard" className="focus-ring rounded-md">
                <AppBrand />
              </Link>
              <div className="hidden min-w-0 rounded-md bg-dac-primary/[0.04] px-3 py-2 lg:block">
                <p className="text-xs font-black uppercase text-dac-text/50">Proyecto activo</p>
                <p className="truncate text-sm font-black text-dac-primary">{project.name}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 xl:items-end">
              <div className="flex flex-wrap items-center justify-between gap-2 xl:justify-end">
                <ModuleMenu groups={visibleNavigation} activeItem={activeItem} />
                <StorageIndicator hasLocalData={hasLocalData} isHydrated={isHydrated} lastSavedAt={lastSavedAt} />
                <div className="text-right">
                  <p className="text-sm font-black text-dac-primary">{displayName}</p>
                  <p className="text-xs font-semibold text-dac-text/60">{displayRole} - {adminCompany.name}</p>
                </div>
                <button type="button" onClick={logout} className="focus-ring rounded-md border border-dac-primary/20 px-3 py-1.5 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white">
                  Salir
                </button>
              </div>

              <div className="rounded-md bg-dac-primary/[0.04] px-3 py-2 lg:hidden">
                <p className="text-xs font-black uppercase text-dac-text/50">Proyecto activo</p>
                <p className="mb-2 text-sm font-black text-dac-primary">{project.name}</p>
                <p className="text-sm font-black text-dac-primary">{displayName}</p>
                <p className="text-xs font-semibold text-dac-text/60">{displayRole}</p>
                <p className="text-xs font-semibold text-dac-text/60">{adminCompany.name}</p>
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
          <span>Doble Altura Construcciones S.A.S.</span>
        </div>
      </footer>
    </main>
  );
}

function ModuleMenu({ groups, activeItem }: { groups: NavGroup[]; activeItem?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="focus-ring rounded-md bg-dac-primary px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-dac-secondary md:hidden"
      >
        Módulos
      </button>

      <details className="group relative hidden md:block">
        <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 rounded-md bg-dac-primary px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-dac-secondary [&::-webkit-details-marker]:hidden">
          Módulos
          <span className="text-xs transition group-open:rotate-180">⌄</span>
        </summary>
        <div className="absolute right-0 z-40 mt-2 max-h-[75vh] w-[min(92vw,760px)] overflow-y-auto rounded-lg border border-dac-primary/15 bg-white p-3 shadow-panel">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <section key={group.title} className="rounded-md border border-dac-primary/10 p-3">
                <p className="text-xs font-black uppercase text-dac-secondary">{group.title}</p>
                <div className="mt-2 grid gap-1">
                  {group.items.map((item) => (
                    <Link key={item.href + item.label} href={item.href} className={getMenuItemClass(activeItem === item.label)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </details>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Cerrar menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-dac-text/45" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col overflow-y-auto bg-white p-4 shadow-panel">
            <div className="flex items-start justify-between gap-3 border-b border-dac-primary/10 pb-3">
              <div>
                <p className="text-xs font-black uppercase text-dac-secondary">Navegación</p>
                <h2 className="text-xl font-black text-dac-primary">Módulos</h2>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="focus-ring rounded-md border border-dac-primary/20 px-3 py-2 text-sm font-black text-dac-primary">
                Cerrar
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {groups.map((group) => (
                <section key={group.title} className="rounded-md border border-dac-primary/10 p-3">
                  <p className="text-xs font-black uppercase text-dac-secondary">{group.title}</p>
                  <div className="mt-2 grid gap-1">
                    {group.items.map((item) => (
                      <Link key={item.href + item.label} href={item.href} onClick={() => setMobileOpen(false)} className={getMenuItemClass(activeItem === item.label)}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
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
    ? "Sincronizando"
    : hasLocalData
      ? "Sincronizado"
      : "Sin registros";
  const detail = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className={(compact ? "mt-2 " : "") + "rounded-md border border-dac-secondary/25 bg-dac-secondary/10 px-2.5 py-1.5 text-left"}>
      <p className="text-xs font-black text-dac-primary">{label}</p>
      {!compact && detail && <p className="text-[11px] font-semibold text-dac-text/60">Última sincronización: {detail}</p>}
    </div>
  );
}

function getMenuItemClass(active: boolean) {
  return (
    "focus-ring rounded-md px-3 py-2 text-sm font-bold transition " +
    (active
      ? "bg-dac-primary text-white"
      : "text-dac-primary hover:bg-dac-secondary/10")
  );
}

function canView(permission: AdminPermissionModule | undefined, roleConfig: { permissions: Partial<Record<AdminPermissionModule, { Ver?: boolean }>> } | undefined, displayRole: string) {
  if (!permission) return true;
  if (displayRole === "Administrador") return true;
  if (!roleConfig) return true;
  return roleConfig.permissions[permission]?.Ver ?? false;
}


