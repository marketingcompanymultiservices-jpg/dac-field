"use client";

import { useMemo, useState } from "react";
import { DocumentCard } from "@/components/DocumentCard";
import { DocumentFilter, DocumentFilters, statusMatchesFilter } from "@/components/DocumentFilters";
import { DocumentForm } from "@/components/DocumentForm";
import { DocumentSummary } from "@/components/DocumentSummary";
import { useProjectStore } from "@/lib/project-store";

export function DocumentsBoard({ folders }: { folders: string[] }) {
  const { documents, addDocument } = useProjectStore();
  const [activeFolder, setActiveFolder] = useState("Todas");
  const [activeFilter, setActiveFilter] = useState<DocumentFilter>("Todos");
  const [search, setSearch] = useState("");

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
          <DocumentForm folders={folders} onAdd={addDocument} />

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
