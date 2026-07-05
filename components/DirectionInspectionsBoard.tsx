"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getImage, saveImage } from "@/lib/imageStorage";
import { useProjectStore } from "@/lib/project-store";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  createDirectionInspectionInSupabase,
  loadDirectionInspectionsFromSupabase,
  mergeDirectionInspectionUpdate,
  updateDirectionInspectionInSupabase
} from "@/lib/supabase/direction-inspections";
import type { DirectionInspection, DirectionInspectionCategory, DirectionInspectionPriority, DirectionInspectionStatus } from "@/types";

type InspectionDraft = {
  responsible: string;
  status: DirectionInspectionStatus;
  tower: string;
  floor: string;
  apartment: string;
  workFront: string;
  category: DirectionInspectionCategory;
  priority: DirectionInspectionPriority;
  description: string;
  dueDate: string;
  commitmentNotes: string;
};

type Filters = {
  project: string;
  responsible: string;
  status: string;
  priority: string;
  category: string;
  date: string;
};

const statuses: DirectionInspectionStatus[] = ["Pendiente", "En proceso", "Atendida", "Cerrada"];
const priorities: DirectionInspectionPriority[] = ["Baja", "Media", "Alta", "Critica"];
const categories: DirectionInspectionCategory[] = [
  "Estructural",
  "Arquitectonica",
  "Calidad",
  "Seguridad y Salud en el Trabajo",
  "Programacion",
  "Materiales",
  "Equipos",
  "Ambiental",
  "Administrativa",
  "Otra"
];

const emptyDraft: InspectionDraft = {
  responsible: "",
  status: "Pendiente",
  tower: "",
  floor: "",
  apartment: "",
  workFront: "",
  category: "Calidad",
  priority: "Media",
  description: "",
  dueDate: "",
  commitmentNotes: ""
};

const inputClass = "focus-ring mt-1 w-full rounded-md border border-dac-primary/15 bg-white px-3 py-2 text-sm font-semibold text-dac-text outline-none";

export function DirectionInspectionsBoard() {
  const { profile, user } = useAuth();
  const {
    adminUsers,
    addDirectionInspectionPhotos,
    photos,
    project,
    projects
  } = useProjectStore();
  const currentUser = profile ? (profile.firstName + " " + profile.lastName).trim() : user?.email ?? "Usuario DAC";
  const [draft, setDraft] = useState<InspectionDraft>({ ...emptyDraft, responsible: project.resident });
  const [observationFiles, setObservationFiles] = useState<File[]>([]);
  const [directionInspections, setDirectionInspections] = useState<DirectionInspection[]>([]);
  const [filters, setFilters] = useState<Filters>({ project: "Todos", responsible: "Todos", status: "Todos", priority: "Todas", category: "Todas", date: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const responsibles = useMemo(() => {
    return adminUsers.filter((item) => item.active).map((item) => (item.firstName + " " + item.lastName).trim() || item.email);
  }, [adminUsers]);

  const filteredInspections = useMemo(() => {
    return directionInspections.filter((inspection) => {
      const matchesProject = filters.project === "Todos" || inspection.projectId === filters.project;
      const matchesResponsible = filters.responsible === "Todos" || inspection.responsible === filters.responsible;
      const matchesStatus = filters.status === "Todos" || inspection.status === filters.status;
      const matchesPriority = filters.priority === "Todas" || inspection.priority === filters.priority;
      const matchesCategory = filters.category === "Todas" || inspection.category === filters.category;
      const matchesDate = !filters.date || inspection.createdAt.slice(0, 10) === filters.date;
      return matchesProject && matchesResponsible && matchesStatus && matchesPriority && matchesCategory && matchesDate;
    });
  }, [directionInspections, filters]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      pending: directionInspections.filter((item) => item.status === "Pendiente").length,
      inProcess: directionInspections.filter((item) => item.status === "En proceso").length,
      closed: directionInspections.filter((item) => item.status === "Cerrada").length,
      overdue: directionInspections.filter((item) => item.status !== "Cerrada" && item.dueDate && item.dueDate < today).length
    };
  }, [directionInspections]);

  useEffect(() => {
    let active = true;
    async function loadInspections() {
      if (!isSupabaseConfigured) {
        setMessage("Supabase no esta configurado. No es posible cargar inspecciones remotas.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const inspections = await loadDirectionInspectionsFromSupabase();
        if (active) setDirectionInspections(inspections);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "No fue posible cargar inspecciones desde Supabase.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadInspections();
    return () => {
      active = false;
    };
  }, []);

  async function submitInspection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!draft.description.trim() || !draft.responsible || !draft.dueDate) {
      setMessage("Descripcion, responsable y fecha limite son obligatorios.");
      return;
    }

    try {
      const now = new Date();
      const createdInspection = await createDirectionInspectionInSupabase({
        projectId: project.id,
        projectName: project.name,
        createdBy: currentUser,
        director: currentUser,
        responsible: draft.responsible,
        status: draft.status,
        tower: draft.tower,
        floor: draft.floor,
        apartment: draft.apartment,
        workFront: draft.workFront,
        category: draft.category,
        priority: draft.priority,
        description: draft.description.trim(),
        dueDate: draft.dueDate,
        commitmentNotes: draft.commitmentNotes,
        observationPhotoIds: [],
        correctionPhotoIds: [],
        updatedBy: currentUser
      });
      const savedPhotos = await saveFiles(observationFiles, "observacion", createdInspection.id);
      addDirectionInspectionPhotos(savedPhotos);
      let nextInspection = createdInspection;
      if (savedPhotos.length > 0) {
        const updateResult = await updateDirectionInspectionInSupabase(
          createdInspection.id,
          { observationPhotoIds: savedPhotos.map((photo) => photo.id) },
          currentUser,
          "Fotografias de observacion",
          "Se asociaron " + savedPhotos.length + " fotografias a la inspeccion."
        );
        nextInspection = mergeDirectionInspectionUpdate(createdInspection, updateResult.inspection, updateResult.history);
      }
      setDirectionInspections((current) => [nextInspection, ...current]);
      setDraft({ ...emptyDraft, responsible: project.resident });
      setObservationFiles([]);
      setMessage("Inspeccion registrada en Supabase el " + now.toLocaleString("es-CO") + ".");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar la inspeccion en Supabase.");
    }
  }

  async function saveFiles(files: File[], photoType: "observacion" | "correccion", inspectionId: string) {
    const now = new Date();
    const saved = [];
    for (const file of files) {
      saved.push(
        await saveImage(file, {
          projectId: project.id,
          date: now.toISOString().slice(0, 10),
          time: now.toTimeString().slice(0, 5),
          user: currentUser,
          inspectionId,
          inspectionPhotoType: photoType
        })
      );
    }
    return saved;
  }

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="mt-5 grid gap-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pendientes" value={summary.pending} tone="alert" />
        <Metric label="En proceso" value={summary.inProcess} tone="secondary" />
        <Metric label="Cerradas" value={summary.closed} tone="primary" />
        <Metric label="Vencidas" value={summary.overdue} tone="alert" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <form onSubmit={submitInspection} className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel">
          <p className="text-sm font-black uppercase text-dac-secondary">Nueva inspeccion</p>
          <h2 className="mt-1 text-xl font-black text-dac-primary">Recorrido de direccion</h2>
          <div className="mt-4 grid gap-3">
            <ReadOnly label="Obra" value={project.name} />
            <ReadOnly label="Director que registra" value={currentUser} />
            <Select label="Responsable" value={draft.responsible} options={responsibles} onChange={(value) => setDraft({ ...draft, responsible: value })} />
            <Select label="Estado" value={draft.status} options={statuses} onChange={(value) => setDraft({ ...draft, status: value as DirectionInspectionStatus })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Torre" value={draft.tower} onChange={(value) => setDraft({ ...draft, tower: value })} />
              <Field label="Piso" value={draft.floor} onChange={(value) => setDraft({ ...draft, floor: value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Apartamento" value={draft.apartment} onChange={(value) => setDraft({ ...draft, apartment: value })} />
              <Field label="Zona o frente" value={draft.workFront} onChange={(value) => setDraft({ ...draft, workFront: value })} />
            </div>
            <Select label="Clasificacion" value={draft.category} options={categories} onChange={(value) => setDraft({ ...draft, category: value as DirectionInspectionCategory })} />
            <Select label="Prioridad" value={draft.priority} options={priorities} onChange={(value) => setDraft({ ...draft, priority: value as DirectionInspectionPriority })} />
            <TextArea label="Observacion detallada" value={draft.description} onChange={(value) => setDraft({ ...draft, description: value })} />
            <Field label="Fecha limite de atencion" type="date" value={draft.dueDate} onChange={(value) => setDraft({ ...draft, dueDate: value })} />
            <TextArea label="Observaciones adicionales" value={draft.commitmentNotes} onChange={(value) => setDraft({ ...draft, commitmentNotes: value })} />
            <label className="block text-sm font-bold text-dac-text">
              Fotografias
              <input type="file" multiple accept="image/*" onChange={(event) => setObservationFiles(Array.from(event.target.files ?? []))} className={inputClass} />
            </label>
            {observationFiles.length > 0 && <p className="text-xs font-bold text-dac-primary">{observationFiles.length} fotografias listas para guardar.</p>}
            {message && <p className="rounded-md bg-dac-secondary/10 px-3 py-2 text-sm font-bold text-dac-primary">{message}</p>}
            <button type="submit" className="focus-ring rounded-md bg-dac-primary px-4 py-3 text-sm font-black text-white hover:bg-dac-secondary">
              Crear inspeccion
            </button>
          </div>
        </form>

        <section className="grid gap-4">
          <FiltersPanel filters={filters} projects={projects} responsibles={responsibles} onChange={updateFilter} />
          {filteredInspections.map((inspection) => (
            <InspectionCard
              key={inspection.id}
              currentUser={currentUser}
              inspection={inspection}
              photos={photos}
              saveFiles={saveFiles}
              addPhotos={addDirectionInspectionPhotos}
              onRemoteUpdate={(nextInspection) =>
                setDirectionInspections((current) => current.map((item) => (item.id === nextInspection.id ? nextInspection : item)))
              }
            />
          ))}
          {isLoading && <p className="rounded-lg border border-dac-primary/10 bg-white p-5 text-sm font-semibold text-dac-text/60">Cargando inspecciones desde Supabase...</p>}
          {!isLoading && filteredInspections.length === 0 && <p className="rounded-lg border border-dac-primary/10 bg-white p-5 text-sm font-semibold text-dac-text/60">No hay inspecciones para los filtros seleccionados.</p>}
        </section>
      </section>

      <DashboardBreakdown inspections={directionInspections} />
    </div>
  );
}

function InspectionCard({
  currentUser,
  inspection,
  photos,
  saveFiles,
  addPhotos,
  onRemoteUpdate
}: {
  currentUser: string;
  inspection: DirectionInspection;
  photos: Array<{ id: string; name: string }>;
  saveFiles: (files: File[], photoType: "observacion" | "correccion", inspectionId: string) => Promise<Array<{ id: string }>>;
  addPhotos: (photos: any[]) => void;
  onRemoteUpdate: (inspection: DirectionInspection) => void;
}) {
  const [response, setResponse] = useState(inspection.response ?? "");
  const [correctionFiles, setCorrectionFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const observationPhotos = photos.filter((photo) => inspection.observationPhotoIds.includes(photo.id));
  const correctionPhotos = photos.filter((photo) => inspection.correctionPhotoIds.includes(photo.id));

  async function submitResponse() {
    setMessage("");
    try {
      const savedPhotos = await saveFiles(correctionFiles, "correccion", inspection.id);
      addPhotos(savedPhotos as any[]);
      const updateResult = await updateDirectionInspectionInSupabase(
        inspection.id,
        {
          response,
          correctionPhotoIds: [...savedPhotos.map((photo) => photo.id), ...inspection.correctionPhotoIds],
          status: "Atendida",
          attendedAt: new Date().toISOString()
        },
        currentUser,
        "Respuesta del responsable",
        "Respuesta registrada con " + savedPhotos.length + " fotografias de correccion."
      );
      onRemoteUpdate(mergeDirectionInspectionUpdate(inspection, updateResult.inspection, updateResult.history));
      setCorrectionFiles([]);
      setMessage("Seguimiento guardado en Supabase.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar el seguimiento.");
    }
  }

  async function updateStatus(status: DirectionInspectionStatus, detail?: string) {
    setMessage("");
    try {
      const now = new Date().toISOString();
      const nextUpdate: Partial<DirectionInspection> = { status };
      if (status === "Atendida") nextUpdate.attendedAt = now;
      if (status === "Cerrada") nextUpdate.closedAt = now;
      if (status !== "Cerrada") nextUpdate.closedAt = null as unknown as string;
      const updateResult = await updateDirectionInspectionInSupabase(
        inspection.id,
        nextUpdate,
        currentUser,
        "Cambio de estado",
        detail ?? "Estado actualizado a " + status + "."
      );
      onRemoteUpdate(mergeDirectionInspectionUpdate(inspection, updateResult.inspection, updateResult.history));
      setMessage("Estado actualizado en Supabase.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible actualizar el estado.");
    }
  }

  return (
    <article className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className={priorityClass(inspection.priority)}>{inspection.priority}</span>
            <span className={statusClass(inspection.status)}>{inspection.status}</span>
            <span className="rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary">{inspection.category}</span>
          </div>
          <h3 className="mt-3 text-xl font-black text-dac-primary">{inspection.description}</h3>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Info label="Responsable" value={inspection.responsible} />
            <Info label="Ubicacion" value={[inspection.tower, inspection.floor, inspection.apartment, inspection.workFront].filter(Boolean).join(" / ") || "Sin ubicacion"} />
            <Info label="Fecha limite" value={inspection.dueDate} />
            <Info label="Director" value={inspection.director} />
          </dl>
        </div>
        <div className="grid min-w-48 gap-2">
          {statuses.map((status) => (
            <button key={status} type="button" onClick={() => updateStatus(status)} className="focus-ring rounded-md border border-dac-primary/15 px-3 py-2 text-sm font-bold text-dac-primary hover:bg-dac-secondary/10">
              {status}
            </button>
          ))}
          <button type="button" onClick={() => updateStatus("Pendiente", "Inspeccion reabierta por Direccion.")} className="focus-ring rounded-md border border-dac-alert px-3 py-2 text-sm font-bold text-dac-alert hover:bg-dac-alert hover:text-white">
            Reabrir
          </button>
        </div>
      </div>

      <PhotoStrip title="Fotografias de observacion" photos={observationPhotos} />

      <div className="mt-4 rounded-lg bg-dac-primary/[0.03] p-3">
        <p className="text-sm font-black uppercase text-dac-secondary">Seguimiento</p>
        <textarea value={response} onChange={(event) => setResponse(event.target.value)} className={inputClass + " min-h-24"} placeholder="Respuesta del responsable o revision de Direccion" />
        <input type="file" multiple accept="image/*" onChange={(event) => setCorrectionFiles(Array.from(event.target.files ?? []))} className={inputClass} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={submitResponse} className="focus-ring rounded-md bg-dac-primary px-4 py-2 text-sm font-black text-white hover:bg-dac-secondary">Guardar seguimiento</button>
          <button type="button" onClick={() => updateStatus("Cerrada", "Cierre aprobado por Direccion.")} className="focus-ring rounded-md border border-dac-primary px-4 py-2 text-sm font-black text-dac-primary hover:bg-dac-primary hover:text-white">Aprobar cierre</button>
        </div>
        {message && <p className="mt-3 rounded-md bg-dac-secondary/10 px-3 py-2 text-sm font-bold text-dac-primary">{message}</p>}
      </div>

      <PhotoStrip title="Fotografias de correccion" photos={correctionPhotos} />

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-black text-dac-primary">Historial completo</summary>
        <div className="mt-3 grid gap-2">
          {inspection.history.map((item) => (
            <div key={item.id} className="rounded-md border border-dac-primary/10 p-3 text-sm">
              <p className="font-black text-dac-primary">{item.action} / {new Date(item.date).toLocaleString("es-CO")}</p>
              <p className="font-semibold text-dac-text/70">{item.user}: {item.detail}</p>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}

function PhotoStrip({ title, photos }: { title: string; photos: Array<{ id: string; name: string }> }) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all(photos.map(async (photo) => [photo.id, await getImage(photo.id)] as const)).then((entries) => {
      if (active) setPreviews(Object.fromEntries(entries.filter(([, dataUrl]) => Boolean(dataUrl))));
    });
    return () => {
      active = false;
    };
  }, [photos]);

  if (photos.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-black uppercase text-dac-text/50">{title}</p>
      <div className="mt-2 flex gap-2 overflow-x-auto">
        {photos.map((photo) => (
          <button key={photo.id} type="button" onClick={() => setSelected(previews[photo.id])} className="focus-ring h-20 w-24 shrink-0 overflow-hidden rounded-md border border-dac-primary/10 bg-dac-primary/[0.03]">
            {previews[photo.id] ? <img src={previews[photo.id]} alt={photo.name} className="h-full w-full object-cover" /> : <span className="text-xs font-bold text-dac-text/50">Foto</span>}
          </button>
        ))}
      </div>
      {selected && (
        <button type="button" onClick={() => setSelected("")} className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-6">
          <img src={selected} alt="Vista ampliada" className="max-h-full max-w-full rounded-lg bg-white object-contain" />
        </button>
      )}
    </div>
  );
}

function FiltersPanel({ filters, projects, responsibles, onChange }: { filters: Filters; projects: Array<{ id: string; name: string }>; responsibles: string[]; onChange: (key: keyof Filters, value: string) => void }) {
  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel">
      <p className="text-sm font-black uppercase text-dac-secondary">Consultas</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Select label="Obra" value={filters.project} options={["Todos", ...projects.map((item) => item.id)]} labels={{ [projects[0]?.id ?? ""]: projects[0]?.name ?? "" }} onChange={(value) => onChange("project", value)} />
        <Select label="Responsable" value={filters.responsible} options={["Todos", ...responsibles]} onChange={(value) => onChange("responsible", value)} />
        <Select label="Estado" value={filters.status} options={["Todos", ...statuses]} onChange={(value) => onChange("status", value)} />
        <Select label="Prioridad" value={filters.priority} options={["Todas", ...priorities]} onChange={(value) => onChange("priority", value)} />
        <Select label="Clasificacion" value={filters.category} options={["Todas", ...categories]} onChange={(value) => onChange("category", value)} />
        <Field label="Fecha" type="date" value={filters.date} onChange={(value) => onChange("date", value)} />
      </div>
    </section>
  );
}

function DashboardBreakdown({ inspections }: { inspections: DirectionInspection[] }) {
  const byResponsible = Array.from(new Set(inspections.map((item) => item.responsible))).map((responsible) => ({ label: responsible, value: inspections.filter((item) => item.responsible === responsible).length }));
  const byCategory = categories.map((category) => ({ label: category, value: inspections.filter((item) => item.category === category).length })).filter((item) => item.value > 0);

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Breakdown title="Por responsable" items={byResponsible} />
      <Breakdown title="Por clasificacion" items={byCategory} />
    </section>
  );
}

function Breakdown({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  return (
    <article className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel">
      <p className="text-sm font-black uppercase text-dac-secondary">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-md bg-dac-primary/[0.04] px-3 py-2">
            <span className="text-sm font-bold text-dac-text/70">{item.label}</span>
            <span className="text-sm font-black text-dac-primary">{item.value}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm font-semibold text-dac-text/60">Sin datos.</p>}
      </div>
    </article>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "primary" | "secondary" | "alert" }) {
  const className = tone === "primary" ? "bg-dac-primary text-white" : tone === "secondary" ? "bg-dac-secondary/10 text-dac-primary" : "bg-dac-alert/15 text-dac-text";
  return (
    <article className={"rounded-lg border border-dac-primary/10 p-4 shadow-sm " + className}>
      <p className="text-sm font-bold opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-dac-primary/10 p-3">
      <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-dac-text">{value || "No registra"}</dd>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-dac-primary/[0.04] px-3 py-2">
      <p className="text-xs font-black uppercase text-dac-text/50">{label}</p>
      <p className="mt-1 text-sm font-black text-dac-primary">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-sm font-bold text-dac-text">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-bold text-dac-text">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className={inputClass + " min-h-24"} />
    </label>
  );
}

function Select({ label, value, options, labels = {}, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-bold text-dac-text">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option} value={option}>{labels[option] || option}</option>
        ))}
      </select>
    </label>
  );
}

function priorityClass(priority: DirectionInspectionPriority) {
  if (priority === "Critica") return "rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white";
  if (priority === "Alta") return "rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-alert";
  if (priority === "Media") return "rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  return "rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-text/70";
}

function statusClass(status: DirectionInspectionStatus) {
  if (status === "Cerrada") return "rounded-full bg-dac-text/15 px-3 py-1 text-xs font-black text-dac-text";
  if (status === "Atendida") return "rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  if (status === "En proceso") return "rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-text";
  return "rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary";
}
