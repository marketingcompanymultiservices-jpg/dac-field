"use client";

import { useMemo, useState } from "react";
import { DocumentCard } from "@/components/DocumentCard";
import { DocumentFilter, DocumentFilters, statusMatchesFilter } from "@/components/DocumentFilters";
import { DocumentForm } from "@/components/DocumentForm";
import { DocumentSummary } from "@/components/DocumentSummary";
import { useAuth } from "@/components/AuthProvider";
import { useProjectStore } from "@/lib/project-store";
import type { AdminPermissionModule } from "@/types";

export function DocumentsBoard({ folders }: { folders: string[] }) {
  const { profile } = useAuth();
  const { documents, addDocument, adminRoles, currentUser } = useProjectStore();
  const [activeFolder, setActiveFolder] = useState("Todas");
  const [activeFilter, setActiveFilter] = useState<DocumentFilter>("Todos");
  const [search, setSearch] = useState("");
  const roleName = profile?.role ?? currentUser.role;
  const roleConfig = adminRoles.find((role) => role.name === roleName);
  const canCreateDocuments = hasPermission("Documentos", "Crear", roleConfig, roleName);
  const canExportDocuments = hasPermission("Documentos", "Exportar", roleConfig, roleName);
  const canPrintDocuments = hasPermission("Documentos", "Imprimir", roleConfig, roleName);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesFolder = activeFolder === "Todas" || document.folder === activeFolder;
      const matchesStatus = statusMatchesFilter(document.status, activeFilter);
      const searchable = [document.name, document.folder, document.user, document.observation].join(" ").toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      return matchesFolder && matchesStatus && matchesSearch;
    });
  }, [activeFilter, activeFolder, documents, search]);

  const activeFolderCount = new Set(documents.map((document) => document.folder)).size;

  return (
    <div className="mt-6 grid gap-6">
      <DocumentSummary documents={documents} activeFolders={activeFolderCount} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm">
          <p className="text-sm font-black uppercase text-dac-primary">Carpetas</p>
          <div className="mt-3 grid gap-2">
            {["Todas", ...folders].map((folder) => {
              const count = folder === "Todas" ? documents.length : documents.filter((document) => document.folder === folder).length;
              return (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setActiveFolder(folder)}
                  className={
                    "focus-ring flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-bold " +
                    (activeFolder === folder
                      ? "border-dac-primary bg-dac-primary text-white"
                      : "border-dac-primary/10 bg-white text-dac-primary hover:bg-dac-secondary/10")
                  }
                >
                  <span>{folder}</span>
                  <span className="ml-3 rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="grid gap-6">
          <DocumentFilters activeFilter={activeFilter} onChange={setActiveFilter} search={search} onSearchChange={setSearch} />
          <div className="flex flex-col gap-2 rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-dac-secondary">Acciones documentales</p>
              <p className="text-sm font-semibold text-dac-text/70">Permisos activos para {roleName}.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.alert("Exportacion documental simulada.")}
                disabled={!canExportDocuments}
                className="focus-ring rounded-md border border-dac-primary px-4 py-2 text-sm font-black text-dac-primary hover:bg-dac-primary hover:text-white disabled:cursor-not-allowed disabled:border-dac-primary/20 disabled:text-dac-text/35"
              >
                Exportar documentos
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!canPrintDocuments}
                className="focus-ring rounded-md bg-dac-primary px-4 py-2 text-sm font-black text-white hover:bg-dac-secondary disabled:cursor-not-allowed disabled:bg-dac-primary/35"
              >
                Imprimir
              </button>
            </div>
          </div>
          {canCreateDocuments ? (
            <DocumentForm folders={folders} onAdd={addDocument} />
          ) : (
            <p className="rounded-lg border border-dac-primary/10 bg-white p-5 text-sm font-semibold text-dac-text/60">
              Tu rol permite consultar documentos, pero no cargar nuevos archivos.
            </p>
          )}

          <div className="grid gap-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Listado</p>
                <h2 className="text-xl font-black text-dac-primary">Documentos del expediente</h2>
              </div>
              <p className="text-sm font-semibold text-dac-text/60">{filteredDocuments.length} visibles</p>
            </div>

            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((document) => <DocumentCard key={document.id} document={document} />)
            ) : (
              <p className="rounded-lg border border-dac-primary/10 bg-white p-5 text-sm font-semibold text-dac-text/60">
                No hay documentos para los filtros actuales.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function hasPermission(
  module: AdminPermissionModule,
  action: "Crear" | "Exportar" | "Imprimir",
  roleConfig: { permissions: Partial<Record<AdminPermissionModule, Partial<Record<string, boolean>>>> } | undefined,
  roleName: string
) {
  if (roleName === "Administrador") return true;
  return Boolean(roleConfig?.permissions[module]?.[action]);
}
