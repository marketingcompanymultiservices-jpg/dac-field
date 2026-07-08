"use client";

import { useRef, useState } from "react";
import type { DocumentStatus, ProjectDocument } from "@/types";

const inputClass = "focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3";
const labelClass = "text-sm font-bold text-dac-text";

export function DocumentForm({
  folders,
  onAdd,
  defaultUser
}: {
  folders: string[];
  defaultUser: string;
  onAdd: (document: Omit<ProjectDocument, "id"> & { file: File }) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLSelectElement>(null);
  const versionRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);
  const uploadDateRef = useRef<HTMLInputElement>(null);
  const expirationDateRef = useRef<HTMLInputElement>(null);
  const userRef = useRef<HTMLInputElement>(null);
  const observationRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd() {
    const name = nameRef.current?.value.trim() ?? "";
    const folder = folderRef.current?.value ?? folders[0];
    const version = Number(versionRef.current?.value || 1);
    const status = (statusRef.current?.value ?? "Vigente") as DocumentStatus;
    const uploadDate = uploadDateRef.current?.value || new Date().toISOString().slice(0, 10);
    const expirationDate = expirationDateRef.current?.value || undefined;
    const user = userRef.current?.value.trim() || defaultUser;
    const observation = observationRef.current?.value.trim() ?? "";
    const file = fileRef.current?.files?.[0];

    if (!name || !folder || !uploadDate || !user || !file) {
      setMessage("Nombre, carpeta, fecha, usuario y archivo son obligatorios.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");
      await onAdd({
        name,
        folder,
        version,
        status,
        uploadDate,
        expirationDate,
        user,
        observation: observation || "Sin observacion.",
        simulatedFile: file.name,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        file
      });

      formRef.current?.reset();
      setMessage("Documento cargado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible cargar el documento.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form ref={formRef} className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Nuevo documento</p>
        <h2 className="mt-1 text-xl font-black text-dac-primary">Agregar documento al expediente</h2>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className={labelClass + " lg:col-span-2"}>
          Nombre
          <input ref={nameRef} name="name" className={inputClass} placeholder="Nombre del documento" />
        </label>
        <label className={labelClass}>
          Carpeta
          <select ref={folderRef} name="folder" defaultValue="Presupuesto" className={inputClass}>
            {folders.map((folder) => (
              <option key={folder}>{folder}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Version
          <input ref={versionRef} name="version" type="number" min="1" defaultValue="1" className={inputClass} />
        </label>
        <label className={labelClass}>
          Estado
          <select ref={statusRef} name="status" defaultValue="Vigente" className={inputClass}>
            <option>Vigente</option>
            <option>Proxima a vencer</option>
            <option>Reemplazado</option>
            <option>Archivado</option>
          </select>
        </label>
        <label className={labelClass}>
          Fecha de carga
          <input ref={uploadDateRef} name="uploadDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Fecha de vencimiento opcional
          <input ref={expirationDateRef} name="expirationDate" type="date" className={inputClass} />
        </label>
        <label className={labelClass}>
          Usuario
          <input ref={userRef} name="user" defaultValue={defaultUser} className={inputClass} placeholder="Usuario que carga" />
        </label>
        <label className={labelClass + " lg:col-span-2"}>
          Observacion
          <textarea ref={observationRef} name="observation" rows={3} className={inputClass + " resize-y"} placeholder="Notas del documento" />
        </label>
        <label className={labelClass + " lg:col-span-2"}>
          Archivo
          <input ref={fileRef} name="file" type="file" className={inputClass} />
        </label>
      </div>

      {message && <p className="mt-4 rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-bold text-dac-primary">{message}</p>}

      <button type="button" onClick={handleAdd} disabled={isSaving} className="focus-ring mt-5 w-full rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary disabled:cursor-not-allowed disabled:bg-dac-primary/35 sm:w-auto">
        {isSaving ? "Cargando..." : "Agregar documento"}
      </button>
    </form>
  );
}
