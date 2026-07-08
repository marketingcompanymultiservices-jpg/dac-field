"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentCard } from "@/components/DocumentCard";
import { DocumentFilter, DocumentFilters, statusMatchesFilter } from "@/components/DocumentFilters";
import { DocumentForm } from "@/components/DocumentForm";
import { DocumentSummary } from "@/components/DocumentSummary";
import { useAuth } from "@/components/AuthProvider";
import { useProjectStore } from "@/lib/project-store";
import { createProjectDocumentDownloadUrl, loadProjectDocumentsFromSupabase, uploadProjectDocumentToSupabase } from "@/lib/supabase/documents";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import type { AdminPermissionModule, ProjectDocument } from "@/types";

export function DocumentsBoard({ folders }: { folders: string[] }) {
  const { profile, user } = useAuth();
  const { documents, addDocument, setProjectDocuments, adminRoles, currentUser, project } = useProjectStore();
  const [activeFolder, setActiveFolder] = useState("Todas");
  const [activeFilter, setActiveFilter] = useState<DocumentFilter>("Todos");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
  const displayUser = profile ? (profile.firstName + " " + profile.lastName).trim() : user?.email ?? currentUser.email;

  useEffect(() => {
    let active = true;
    async function loadDocuments() {
      if (!isSupabaseConfigured) {
        setMessage("Supabase no esta configurado. Los documentos se mostraran desde datos locales.");
        return;
      }

      try {
        setIsLoading(true);
        const remoteDocuments = await loadProjectDocumentsFromSupabase(project.id);
        if (active) {
          setProjectDocuments(remoteDocuments);
          setMessage(remoteDocuments.length ? "Documentos sincronizados desde Supabase." : "");
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "No fue posible cargar documentos desde Supabase.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      active = false;
    };
  }, [project.id]);

  async function handleAddDocument(document: Omit<ProjectDocument, "id"> & { file: File }) {
    if (!isSupabaseConfigured) throw new Error("Supabase no esta configurado. No es posible subir archivos reales.");

    const uploadedDocument = await uploadProjectDocumentToSupabase({
      projectId: project.id,
      name: document.name,
      folder: document.folder,
      version: document.version,
      status: document.status,
      uploadDate: document.uploadDate,
      expirationDate: document.expirationDate,
      uploadedBy: document.user,
      uploadedByEmail: user?.email ?? currentUser.email,
      observation: document.observation,
      file: document.file
    });

    addDocument(uploadedDocument);
    setMessage("Documento cargado en Supabase Storage.");
  }

  async function handleDownload(document: ProjectDocument) {
    if (!canExportDocuments) return;
    try {
      const url = await createProjectDocumentDownloadUrl(document);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible descargar el documento.");
    }
  }

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
          {message && <p className="rounded-lg border border-dac-primary/10 bg-white p-4 text-sm font-bold text-dac-primary">{message}</p>}
          {isLoading && <p className="rounded-lg border border-dac-primary/10 bg-white p-4 text-sm font-semibold text-dac-text/60">Cargando documentos desde Supabase...</p>}
          <DocumentFilters activeFilter={activeFilter} onChange={setActiveFilter} search={search} onSearchChange={setSearch} />
          <div className="flex flex-col gap-2 rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-dac-secondary">Acciones documentales</p>
              <p className="text-sm font-semibold text-dac-text/70">Permisos activos para {roleName}.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.alert("Exportacion documental preparada desde documentos filtrados.")}
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
            <DocumentForm folders={folders} defaultUser={displayUser} onAdd={handleAddDocument} />
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
              filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  canDownload={canExportDocuments}
                  onDownload={() => handleDownload(document)}
                />
              ))
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
