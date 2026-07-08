"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/components/AuthProvider";
import { deleteImage, getImage, saveImage } from "@/lib/imageStorage";
import { getPlanningExecution, getPlanningStatus, getTodayISO } from "@/lib/planning";
import { useProjectStore } from "@/lib/project-store";
import type { Commitment, CommitmentPriority } from "@/types";

type CompactActivityDraft = {
  budgetItemId: string;
  quantity: string;
  observation: string;
  workFront: string;
  owner: string;
  startTime: string;
  endTime: string;
};

type CompactReport = {
  weather: string;
  personal: string;
  observations: string;
};

const today = getTodayISO();
const inputClass = "focus-ring mt-2 w-full rounded-md border border-dac-primary/20 bg-white px-4 py-4 text-base font-semibold text-dac-text outline-none";
const labelClass = "block text-sm font-black text-dac-text";

export function FieldMode() {
  const { profile, user } = useAuth();
  const {
    activities,
    addDailyActivity,
    addDailyCommitment,
    addDailyPhotos,
    budgetItems,
    commitments,
    dailyReports,
    deleteDailyPhoto,
    hasLocalData,
    isHydrated,
    photos,
    planningItems,
    progressItems,
    project,
    saveDailyReport
  } = useProjectStore();
  const [report, setReport] = useState<CompactReport>({ weather: "", personal: "", observations: "" });
  const [activityDraft, setActivityDraft] = useState<CompactActivityDraft>(getEmptyActivityDraft());
  const [activitySearch, setActivitySearch] = useState("");
  const [commitmentDescription, setCommitmentDescription] = useState("");
  const [commitmentPriority, setCommitmentPriority] = useState<CommitmentPriority>("Media");
  const [message, setMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});

  const currentUserName = profile ? (profile.firstName + " " + profile.lastName).trim() : user?.email ?? project.resident;
  const currentUserEmail = user?.email ?? currentUserName;
  const currentPhotos = photos.filter((photo) => photo.date === today);
  const todayActivities = activities.filter((activity) => activity.date === today);
  const todayReport = dailyReports.find((entry) => entry.date === today);
  const progressByItem = useMemo(() => new Map(progressItems.map((item) => [item.item, item])), [progressItems]);
  const selectedBudgetItem = budgetItems.find((item) => item.item === activityDraft.budgetItemId);
  const selectedProgress = selectedBudgetItem ? progressByItem.get(selectedBudgetItem.item) : undefined;
  const pendingQuantity = selectedProgress?.pendingQuantity ?? selectedBudgetItem?.quantity ?? 0;

  const plannedToday = useMemo(() => {
    return planningItems
      .filter((item) => item.startDate <= today && item.endDate >= today)
      .map((item) => {
        const budget = budgetItems.find((budgetItem) => budgetItem.item === item.budgetItemId);
        const executed = getPlanningExecution(item, activities);
        return {
          ...item,
          budget,
          executed,
          status: getPlanningStatus(item, executed, today)
        };
      });
  }, [activities, budgetItems, planningItems]);

  const searchResults = useMemo(() => {
    const normalizedSearch = activitySearch.trim().toLowerCase();
    const source = plannedToday.length > 0 ? plannedToday.map((item) => item.budget).filter(Boolean) : budgetItems;
    if (!normalizedSearch) return source.slice(0, 6);
    return source
      .filter((item) => item && [item.item, item.description, item.chapter, item.subchapter].some((value) => value.toLowerCase().includes(normalizedSearch)))
      .slice(0, 8);
  }, [activitySearch, budgetItems, plannedToday]);

  const pendingCommitments = commitments.filter((commitment) => commitment.status === "Pendiente");
  const overdueCommitments = commitments.filter((commitment) => commitment.status === "Vencido" || (commitment.status !== "Cumplido" && commitment.dueDate < today));
  const myCommitments = commitments.filter((commitment) => belongsToUser(commitment, currentUserName));

  useEffect(() => {
    let active = true;
    async function loadPreviews() {
      const entries = await Promise.all(currentPhotos.map(async (photo) => [photo.id, photo.imageData || (await getImage(photo.id))] as const));
      if (active) setPhotoPreviews(Object.fromEntries(entries.filter(([, dataUrl]) => Boolean(dataUrl))));
    }
    loadPreviews();
    return () => {
      active = false;
    };
  }, [currentPhotos]);

  function updateReport(field: keyof CompactReport, value: string) {
    setReport((current) => ({ ...current, [field]: value }));
  }

  function selectActivity(item: NonNullable<(typeof searchResults)[number]>) {
    setActivityDraft((current) => ({
      ...current,
      budgetItemId: item.item,
      owner: current.owner || currentUserName
    }));
    setActivitySearch(item.item + " - " + item.description);
  }

  function addCompactActivity() {
    if (!selectedBudgetItem) {
      setMessage("Selecciona una actividad del presupuesto.");
      return;
    }

    const quantity = Number(activityDraft.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("La cantidad ejecutada debe ser mayor que cero.");
      return;
    }

    if (quantity > pendingQuantity) {
      setMessage("La cantidad ejecutada no puede superar el pendiente.");
      return;
    }

    addDailyActivity({
      budgetItemId: selectedBudgetItem.item,
      activity: selectedBudgetItem.description,
      unit: selectedBudgetItem.unit,
      quantity,
      observation: activityDraft.observation,
      workFront: activityDraft.workFront,
      owner: activityDraft.owner || currentUserName,
      startTime: activityDraft.startTime,
      endTime: activityDraft.endTime,
      photoCount: currentPhotos.length,
      date: today,
      time: new Date().toTimeString().slice(0, 5),
      createdBy: currentUserEmail,
      updatedBy: currentUserEmail
    });
    setActivityDraft(getEmptyActivityDraft());
    setActivitySearch("");
    setMessage("Actividad registrada en Avance, Bitacora y Dashboard.");
  }

  function addCompactCommitment() {
    if (!commitmentDescription.trim()) return;
    addDailyCommitment({
      budgetItemId: activityDraft.budgetItemId || undefined,
      description: commitmentDescription.trim(),
      owner: activityDraft.owner || currentUserName,
      dueDate: today,
      priority: commitmentPriority,
      createdBy: currentUserEmail,
      updatedBy: currentUserEmail
    });
    setCommitmentDescription("");
    setCommitmentPriority("Media");
    setMessage("Compromiso agregado.");
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoMessage("");
    const savedPhotos = [];

    for (const file of Array.from(files)) {
      try {
        const photo = await saveImage(file, {
          projectId: project.id,
          date: today,
          time: new Date().toTimeString().slice(0, 5),
          user: currentUserName,
          activityId: activityDraft.budgetItemId || undefined
        });
        savedPhotos.push(photo);
      } catch (error) {
        setPhotoMessage(error instanceof Error ? error.message : "No fue posible guardar una imagen.");
      }
    }

    if (savedPhotos.length > 0) {
      addDailyPhotos(savedPhotos);
      setPhotoMessage("Se cargaron " + savedPhotos.length + " fotografias.");
    }
  }

  async function removePhoto(id: string) {
    await deleteImage(id);
    deleteDailyPhoto(id);
    setPhotoPreviews((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function sendReport() {
    setIsSendingReport(true);
    setMessage("");
    try {
      await saveDailyReport(
        {
          date: today,
          time: new Date().toTimeString().slice(0, 5),
          weather: report.weather,
          administrativeStaff: currentUserName,
          operativeStaff: report.personal,
          contractors: "",
          equipment: "",
          material: "",
          observations: report.observations,
          problems: "",
          actions: "",
          signature: currentUserName,
          createdBy: currentUserEmail,
          updatedBy: currentUserEmail
        },
        "Enviado"
      );
      setMessage("Reporte enviado desde Modo Obra y visible para el proyecto.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible enviar el reporte a Supabase.");
    } finally {
      setIsSendingReport(false);
    }
  }

  return (
    <main className="min-h-screen bg-dac-primary/[0.03] pb-24 text-dac-text md:bg-white">
      <header className="sticky top-0 z-20 border-b border-dac-primary/10 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between md:max-w-3xl">
          <div className="flex items-center gap-3">
            <AppLogo className="h-12 w-12" />
            <div>
              <p className="text-xs font-black uppercase text-dac-secondary">Modo Obra</p>
              <h1 className="text-xl font-black text-dac-primary">DAC</h1>
            </div>
          </div>
          <Link href="/dashboard" className="focus-ring rounded-md border border-dac-primary/20 px-3 py-2 text-sm font-black text-dac-primary">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-md gap-4 px-4 py-4 md:max-w-3xl">
        <section className="rounded-lg bg-dac-primary p-5 text-white shadow-panel">
          <p className="text-sm font-bold opacity-80">Obra activa</p>
          <h2 className="mt-1 text-2xl font-black">{project.name}</h2>
          <p className="mt-2 text-sm font-semibold opacity-85">Residente: {project.resident}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <StatusPill label="Avance" value={project.progress.toFixed(1) + " %"} />
            <StatusPill label="Fotos" value={currentPhotos.length + "/5"} />
            <StatusPill label="Reporte" value={todayReport?.status ?? "No enviado"} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <ActionButton href="#registrar" label="Registrar dia" />
          <CameraButton onChange={handleImageUpload} />
          <ActionButton href="#hoy" label="Actividades de hoy" />
          <ActionButton href="#compromisos" label="Compromisos" />
          <ActionButton href="#enviar" label="Enviar reporte" wide />
          <ActionButton href="#sync" label="Sincronizacion local" wide />
        </section>

        {message && <p className="rounded-lg bg-dac-secondary/10 p-4 text-sm font-black text-dac-primary">{message}</p>}

        <section id="registrar" className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm">
          <SectionTitle eyebrow="Registro compacto" title="Registrar dia" />
          <div className="mt-4 grid gap-4">
            <Field label="Clima" value={report.weather} placeholder="Soleado, lluvia parcial" onChange={(value) => updateReport("weather", value)} />
            <Field label="Personal" value={report.personal} placeholder="12 oficiales, 8 ayudantes" onChange={(value) => updateReport("personal", value)} />

            <div>
              <Field label="Actividades" value={activitySearch} placeholder="Buscar item, actividad o capitulo" onChange={setActivitySearch} />
              <div className="mt-3 grid gap-2">
                {searchResults.map((item) => item && (
                  <button key={item.item} type="button" onClick={() => selectActivity(item)} className={getActivityButtonClass(activityDraft.budgetItemId === item.item)}>
                    <span className="block text-sm font-black">{item.item} - {item.description}</span>
                    <span className="mt-1 block text-xs font-semibold opacity-70">{item.unit} / {item.chapter}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedBudgetItem && (
              <div className="grid gap-2 rounded-lg bg-dac-primary/[0.04] p-3 text-sm">
                <Info label="Pendiente" value={formatNumber(pendingQuantity) + " " + selectedBudgetItem.unit} />
                <Info label="Valor total" value={formatCurrency(selectedBudgetItem.totalValue)} />
                <Info label="% ejecutado" value={(selectedProgress?.progress ?? 0).toFixed(1) + " %"} />
              </div>
            )}

            <Field label="Cantidad ejecutada hoy" value={activityDraft.quantity} placeholder="48" onChange={(value) => setActivityDraft((current) => ({ ...current, quantity: value }))} />
            <Field label="Frente de trabajo" value={activityDraft.workFront} placeholder="Torre 3 - Piso 5" onChange={(value) => setActivityDraft((current) => ({ ...current, workFront: value }))} />
            <Field label="Responsable" value={activityDraft.owner} placeholder={currentUserName} onChange={(value) => setActivityDraft((current) => ({ ...current, owner: value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hora inicio" type="time" value={activityDraft.startTime} onChange={(value) => setActivityDraft((current) => ({ ...current, startTime: value }))} />
              <Field label="Hora final" type="time" value={activityDraft.endTime} onChange={(value) => setActivityDraft((current) => ({ ...current, endTime: value }))} />
            </div>
            <TextArea label="Observaciones" value={activityDraft.observation} placeholder="Detalle rapido del avance" onChange={(value) => setActivityDraft((current) => ({ ...current, observation: value }))} />
            <button type="button" onClick={addCompactActivity} className="focus-ring rounded-lg bg-dac-primary px-5 py-4 text-lg font-black text-white hover:bg-dac-secondary">
              Guardar actividad
            </button>
          </div>
        </section>

        <section id="fotos" className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm">
          <SectionTitle eyebrow="Camara" title={"Fotografias " + currentPhotos.length + "/5"} />
          <p className="mt-2 text-sm font-semibold text-dac-text/70">Minimo recomendado: 5 fotos por jornada.</p>
          {photoMessage && <p className="mt-3 rounded-md bg-dac-secondary/10 p-3 text-sm font-bold text-dac-primary">{photoMessage}</p>}
          <div className="mt-4 grid gap-3">
            <label className="focus-ring cursor-pointer rounded-lg bg-dac-alert px-5 py-5 text-center text-lg font-black text-white">
              Tomar foto
              <input type="file" accept="image/*" capture="environment" onChange={(event) => handleImageUpload(event.target.files)} className="sr-only" />
            </label>
            <label className="focus-ring cursor-pointer rounded-lg border border-dac-primary px-5 py-4 text-center text-base font-black text-dac-primary">
              Seleccionar desde galeria
              <input type="file" accept="image/*" multiple onChange={(event) => handleImageUpload(event.target.files)} className="sr-only" />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {currentPhotos.map((photo) => (
              <article key={photo.id} className="rounded-lg border border-dac-primary/10 p-2">
                {photoPreviews[photo.id] ? <img src={photoPreviews[photo.id]} alt={photo.name} className="h-28 w-full rounded-md object-cover" /> : <div className="h-28 rounded-md bg-dac-secondary/10" />}
                <p className="mt-2 truncate text-xs font-bold text-dac-primary">{photo.name}</p>
                <button type="button" onClick={() => removePhoto(photo.id)} className="mt-2 text-xs font-black text-dac-alert">Eliminar</button>
              </article>
            ))}
          </div>
        </section>

        <section id="hoy" className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm">
          <SectionTitle eyebrow="Planificacion" title="Actividades de hoy" />
          <div className="mt-4 grid gap-3">
            {plannedToday.map((item) => (
              <article key={(item.id ?? item.budgetItemId) + item.startDate} className="rounded-lg border border-dac-primary/10 p-3">
                <p className="text-sm font-black text-dac-primary">{item.budgetItemId} - {item.budget?.description ?? "Actividad"}</p>
                <p className="mt-1 text-sm font-semibold text-dac-text/70">{item.owner} / {item.plannedQuantity} {item.budget?.unit ?? "und"}</p>
                <p className="mt-2 inline-flex rounded-full bg-dac-secondary/10 px-3 py-1 text-xs font-black text-dac-primary">{item.status}</p>
              </article>
            ))}
            {plannedToday.length === 0 && <p className="text-sm font-semibold text-dac-text/60">No hay actividades programadas para hoy.</p>}
          </div>
        </section>

        <section id="compromisos" className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm">
          <SectionTitle eyebrow="Seguimiento" title="Compromisos" />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniMetric label="Pendientes" value={pendingCommitments.length} />
            <MiniMetric label="Vencidos" value={overdueCommitments.length} />
            <MiniMetric label="Mios" value={myCommitments.length} />
          </div>
          <div className="mt-4 grid gap-3">
            <TextArea label="Nuevo compromiso" value={commitmentDescription} placeholder="Compromiso rapido" onChange={setCommitmentDescription} />
            <label className={labelClass}>
              Prioridad
              <select value={commitmentPriority} onChange={(event) => setCommitmentPriority(event.target.value as CommitmentPriority)} className={inputClass}>
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
                <option>Critica</option>
              </select>
            </label>
            <button type="button" onClick={addCompactCommitment} className="focus-ring rounded-lg bg-dac-primary px-5 py-4 font-black text-white">Agregar compromiso</button>
          </div>
          <CommitmentList title="Pendientes y vencidos" items={[...overdueCommitments, ...pendingCommitments].slice(0, 5)} />
        </section>

        <section id="enviar" className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm">
          <SectionTitle eyebrow="Cierre" title="Enviar reporte" />
          <TextArea label="Observacion general" value={report.observations} placeholder="Resumen corto de la jornada" onChange={(value) => updateReport("observations", value)} />
          <button type="button" disabled={isSendingReport} onClick={sendReport} className="focus-ring mt-4 w-full rounded-lg bg-dac-secondary px-5 py-5 text-lg font-black text-dac-primary hover:bg-dac-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isSendingReport ? "Enviando..." : "Enviar reporte"}
          </button>
        </section>

        <section id="sync" className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm">
          <SectionTitle eyebrow="Sincronizacion local" title="Estado de datos" />
          <div className="mt-4 grid gap-3">
            <Info label="Datos" value={!isHydrated ? "Sincronizando" : hasLocalData ? "Sincronizado" : "Datos base"} />
            <Info label="Fotos pendientes" value={String(Math.max(0, 5 - currentPhotos.length))} />
            <Info label="Reporte de hoy" value={todayReport?.status ?? "No enviado"} />
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-dac-primary/10 bg-white/95 px-3 py-2 backdrop-blur md:hidden" aria-label="Navegacion Modo Obra">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 text-center text-[11px] font-black text-dac-primary">
          <a href="#registrar" className="rounded-md px-2 py-2 hover:bg-dac-secondary/10">Dia</a>
          <a href="#fotos" className="rounded-md px-2 py-2 hover:bg-dac-secondary/10">Fotos</a>
          <a href="#hoy" className="rounded-md px-2 py-2 hover:bg-dac-secondary/10">Hoy</a>
          <a href="#compromisos" className="rounded-md px-2 py-2 hover:bg-dac-secondary/10">Comp.</a>
          <a href="#enviar" className="rounded-md px-2 py-2 hover:bg-dac-secondary/10">Enviar</a>
        </div>
      </nav>
    </main>
  );
}

function ActionButton({ href, label, wide = false }: { href: string; label: string; wide?: boolean }) {
  return (
    <a href={href} className={(wide ? "col-span-2 " : "") + "focus-ring flex min-h-24 items-center justify-center rounded-lg border border-dac-primary/10 bg-white p-4 text-center text-lg font-black text-dac-primary shadow-sm hover:bg-dac-secondary/10"}>
      {label}
    </a>
  );
}

function CameraButton({ onChange }: { onChange: (files: FileList | null) => void }) {
  return (
    <label className="focus-ring flex min-h-24 cursor-pointer items-center justify-center rounded-lg bg-dac-alert p-4 text-center text-lg font-black text-white shadow-sm">
      Tomar fotografias
      <input type="file" accept="image/*" capture="environment" onChange={(event) => onChange(event.target.files)} className="sr-only" />
    </label>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className={labelClass}>
      {label}
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className={labelClass}>
      {label}
      <textarea rows={3} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass + " resize-y"} />
    </label>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-dac-secondary">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black text-dac-primary">{title}</h2>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-dac-primary/[0.04] p-3">
      <p className="text-xs font-bold uppercase text-dac-text/50">{label}</p>
      <p className="mt-1 text-sm font-black text-dac-primary">{value}</p>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-2">
      <p className="text-[11px] font-bold opacity-75">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-dac-primary/[0.04] p-3">
      <p className="text-2xl font-black text-dac-primary">{value}</p>
      <p className="text-xs font-bold text-dac-text/60">{label}</p>
    </div>
  );
}

function CommitmentList({ title, items }: { title: string; items: Commitment[] }) {
  return (
    <div className="mt-5">
      <p className="text-sm font-black text-dac-primary">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-md border border-dac-primary/10 p-3">
            <p className="text-sm font-black text-dac-text">{item.description}</p>
            <p className="mt-1 text-xs font-semibold text-dac-text/60">{item.owner} / {item.dueDate} / {item.status}</p>
          </article>
        ))}
        {items.length === 0 && <p className="text-sm font-semibold text-dac-text/60">Sin compromisos visibles.</p>}
      </div>
    </div>
  );
}

function getEmptyActivityDraft(): CompactActivityDraft {
  return {
    budgetItemId: "",
    quantity: "",
    observation: "",
    workFront: "",
    owner: "",
    startTime: "",
    endTime: ""
  };
}

function getActivityButtonClass(active: boolean) {
  return (
    "focus-ring rounded-md border p-3 text-left transition " +
    (active
      ? "border-dac-primary bg-dac-primary text-white"
      : "border-dac-primary/15 bg-white text-dac-text hover:border-dac-secondary hover:bg-dac-secondary/10")
  );
}

function belongsToUser(commitment: Commitment, userName: string) {
  return commitment.owner.toLowerCase().includes(userName.toLowerCase()) || userName.toLowerCase().includes(commitment.owner.toLowerCase());
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}
