"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { deleteImage, getImage, saveImage } from "@/lib/imageStorage";
import { getProgressStatus } from "@/lib/progress";
import { useProjectStore } from "@/lib/project-store";
import type { CommitmentPriority } from "@/types";

type ActivityDraft = {
  budgetItemId: string;
  activity: string;
  unit: string;
  quantityToday: string;
  observation: string;
  workFront: string;
  owner: string;
  startTime: string;
  endTime: string;
  photoCount: string;
  commitmentDescription: string;
  commitmentOwner: string;
  commitmentDueDate: string;
  commitmentPriority: CommitmentPriority;
};

type CommitmentDraft = {
  description: string;
  owner: string;
  dueDate: string;
  priority: CommitmentPriority;
};

type ReportData = {
  date: string;
  time: string;
  weather: string;
  administrativeStaff: string;
  operativeStaff: string;
  contractors: string;
  equipment: string;
  material: string;
  observations: string;
  problems: string;
  actions: string;
  signature: string;
};

const steps = [
  "Informacion general",
  "Personal y contratistas",
  "Equipos y materiales",
  "Actividades ejecutadas",
  "Observaciones, problemas y acciones",
  "Compromisos",
  "Fotografias",
  "Firma y resumen"
];

const initialReport: ReportData = {
  date: "",
  time: "",
  weather: "",
  administrativeStaff: "",
  operativeStaff: "",
  contractors: "",
  equipment: "",
  material: "",
  observations: "",
  problems: "",
  actions: "",
  signature: ""
};

const inputClass = "focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3";
const labelClass = "block text-sm font-bold text-dac-text";

export function DailyReportWizard({ projectName }: { projectName: string }) {
  const { profile, user } = useAuth();
  const {
    activities,
    project,
    budgetItems,
    progressItems,
    photos,
    commitments,
    dailyReports,
    addDailyActivity,
    addDailyCommitment,
    addDailyPhotos,
    updateDailyPhotoDescription,
    updateDailyPhotoDetails,
    deleteDailyPhoto,
    saveDailyReport,
    executiveSummary
  } = useProjectStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<ReportData>(initialReport);
  const [message, setMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});
  const [activityDraft, setActivityDraft] = useState<ActivityDraft>(getEmptyActivityDraft());
  const [activitySearch, setActivitySearch] = useState("");
  const [commitmentDraft, setCommitmentDraft] = useState<CommitmentDraft>({ description: "", owner: "", dueDate: "", priority: "Media" });
  const currentUserName = profile ? (profile.firstName + " " + profile.lastName).trim() : user?.email ?? project.resident;
  const currentUserEmail = user?.email ?? currentUserName;

  const progress = useMemo(() => ((currentStep + 1) / steps.length) * 100, [currentStep]);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const reportDate = getReportDate();
  const draftActivities = useMemo(() => activities.filter((activity) => activity.projectId === project.id && activity.date === reportDate && !activity.dailyReportId), [activities, project.id, reportDate]);
  const draftCommitments = useMemo(() => commitments.filter((commitment) => commitment.projectId === project.id && commitment.origin === "Registro Diario" && !commitment.dailyReportId), [commitments, project.id]);
  const currentPhotos = useMemo(() => photos.filter((photo) => photo.projectId === project.id && photo.date === reportDate && !photo.dailyReportId && !photo.reportId), [photos, project.id, reportDate]);
  const progressByItem = useMemo(() => new Map(progressItems.map((item) => [item.item, item])), [progressItems]);
  const selectedBudgetItem = budgetItems.find((item) => item.item === activityDraft.budgetItemId);
  const selectedProgressItem = selectedBudgetItem ? progressByItem.get(selectedBudgetItem.item) : undefined;
  const selectedPending = selectedProgressItem?.pendingQuantity ?? selectedBudgetItem?.quantity ?? 0;
  const selectedProgress = selectedProgressItem?.progress ?? 0;
  const selectedStatus = getProgressStatus(selectedProgress);
  const searchedBudgetItems = useMemo(() => {
    const search = activitySearch.trim().toLowerCase();
    if (!search) return budgetItems.slice(0, 6);

    return budgetItems
      .filter((item) => [item.item, item.description, item.chapter, item.subchapter].some((value) => value.toLowerCase().includes(search)))
      .slice(0, 8);
  }, [activitySearch, budgetItems]);

  useEffect(() => {
    let active = true;

    async function loadPreviews() {
      try {
        const entries = await Promise.all(
          currentPhotos.map(async (photo) => [photo.id, photo.imageData || (await getImage(photo.id))] as const)
        );
        if (active) setPhotoPreviews(Object.fromEntries(entries.filter(([, dataUrl]) => Boolean(dataUrl))));
      } catch (error) {
        logDailyReportClientError(error, "loadPreviews");
        if (active) setPhotoPreviews({});
      }
    }

    loadPreviews();
    return () => {
      active = false;
    };
  }, [currentPhotos]);

  function updateReport(field: keyof ReportData, value: string) {
    setReport((current) => ({ ...current, [field]: value }));
  }

  function getReportDate() {
    return report.date || new Date().toISOString().slice(0, 10);
  }

  function getReportTime() {
    return report.time || new Date().toTimeString().slice(0, 5);
  }

  function addActivity() {
    if (!selectedBudgetItem) {
      setMessage("Selecciona una actividad del presupuesto antes de agregar avance.");
      return;
    }

    const quantityToday = Number(activityDraft.quantityToday || 0);
    if (!Number.isFinite(quantityToday)) {
      setMessage("La cantidad ejecutada hoy debe ser un numero valido.");
      return;
    }

    if (quantityToday <= 0) {
      setMessage("La cantidad ejecutada hoy debe ser mayor que cero.");
      return;
    }

    if (quantityToday < 0) {
      setMessage("La cantidad ejecutada hoy no puede ser negativa.");
      return;
    }

    if (quantityToday > selectedPending) {
      setMessage("La cantidad ejecutada hoy no puede superar la cantidad pendiente.");
      return;
    }

    addDailyActivity({
      budgetItemId: selectedBudgetItem.item,
      activity: selectedBudgetItem.description,
      unit: selectedBudgetItem.unit,
      quantity: quantityToday,
      observation: activityDraft.observation.trim(),
      workFront: activityDraft.workFront.trim(),
      owner: activityDraft.owner.trim() || currentUserName,
      startTime: activityDraft.startTime,
      endTime: activityDraft.endTime,
      photoCount: 0,
      date: getReportDate(),
      time: getReportTime(),
      createdBy: currentUserEmail,
      updatedBy: currentUserEmail
    });

    if (activityDraft.commitmentDescription.trim()) {
      addDailyCommitment({
        budgetItemId: selectedBudgetItem.item,
        description: activityDraft.commitmentDescription.trim(),
        owner: activityDraft.commitmentOwner.trim() || activityDraft.owner.trim() || currentUserName,
        dueDate: activityDraft.commitmentDueDate || getReportDate(),
        priority: activityDraft.commitmentPriority,
        createdBy: currentUserEmail,
        updatedBy: currentUserEmail
      });
    }

    setActivityDraft(getEmptyActivityDraft());
    setActivitySearch("");
    setMessage("Actividad agregada al avance, bitacora y dashboard.");
  }

  function addCommitment() {
    if (!commitmentDraft.description.trim()) return;
    addDailyCommitment({
      description: commitmentDraft.description.trim(),
      owner: commitmentDraft.owner.trim() || currentUserName,
      dueDate: commitmentDraft.dueDate || getReportDate(),
      priority: commitmentDraft.priority,
      createdBy: currentUserEmail,
      updatedBy: currentUserEmail
    });
    setCommitmentDraft({ description: "", owner: "", dueDate: "", priority: "Media" });
    setMessage("Compromiso agregado al modulo Compromisos y a la bitacora.");
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setPhotoMessage("");
    const savedPhotos = [];

    for (const file of Array.from(files)) {
      try {
        const photo = await saveImage(file, {
          projectId: project.id,
          date: getReportDate(),
          time: getReportTime(),
          user: currentUserName
        });
        savedPhotos.push(photo);
      } catch (error) {
        setPhotoMessage(error instanceof Error ? error.message : "No fue posible guardar una imagen.");
      }
    }

    if (savedPhotos.length > 0) {
      addDailyPhotos(savedPhotos);
      setPhotoMessage("Se cargaron " + savedPhotos.length + " fotografias al registro diario.");
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

  async function persistReport(status: "Borrador" | "Enviado") {
    setIsSavingReport(true);
    setMessage("");
    try {
      await saveDailyReport(
        {
          date: getReportDate(),
          time: getReportTime(),
          weather: report.weather,
          administrativeStaff: report.administrativeStaff,
          operativeStaff: report.operativeStaff,
          contractors: report.contractors,
          equipment: report.equipment,
          material: report.material,
          observations: report.observations,
          problems: report.problems,
          actions: report.actions,
          signature: report.signature || currentUserName,
          createdBy: currentUserEmail,
          updatedBy: currentUserEmail
        },
        status
      );
      setReport(initialReport);
      setActivityDraft(getEmptyActivityDraft());
      setActivitySearch("");
      setCommitmentDraft({ description: "", owner: "", dueDate: "", priority: "Media" });
      setPhotoPreviews({});
      setPhotoMessage("");
      setCurrentStep(0);
      setMessage("Registro Diario guardado correctamente.");
    } catch (error) {
      logDailyReportClientError(error, "persistReport");
      setMessage("No fue posible guardar el Registro Diario en Supabase. " + (error instanceof Error ? error.message : "code: DAC_UNKNOWN | message: Error desconocido | details: Sin detalles | hint: Revisa consola."));
    } finally {
      setIsSavingReport(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-dac-primary/15 bg-white shadow-panel">
      <div className="border-b border-dac-primary/10 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Paso {currentStep + 1} de {steps.length}</p>
            <h2 className="mt-1 text-2xl font-black text-dac-primary">{steps[currentStep]}</h2>
          </div>
          <p className="text-sm font-semibold text-dac-text/70">{projectName}</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-dac-primary/10">
          <div className="h-full rounded-full bg-dac-secondary" style={{ width: progress + "%" }} />
        </div>
        {message && <p className="mt-4 rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-bold text-dac-primary">{message}</p>}
      </div>

      <div className="p-4 sm:p-6">
        {dailyReports.length > 0 && (
          <div className="mb-5 rounded-lg border border-dac-primary/10 bg-dac-primary/[0.03] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-dac-secondary">Reporte diario</p>
                <p className="mt-1 text-sm font-semibold text-dac-text/70">Ultimo registro guardado: {dailyReports[0].date} - {dailyReports[0].status}</p>
              </div>
              <Link href={"/projects/" + dailyReports[0].projectId + "/daily-report/" + dailyReports[0].id} className="focus-ring rounded-md bg-dac-primary px-4 py-3 text-center text-sm font-black text-white hover:bg-dac-secondary">
                Ver reporte diario
              </Link>
            </div>
          </div>
        )}
        {dailyReports.length === 0 && (
          <div className="mb-5 rounded-lg border border-dac-primary/10 bg-white p-4">
            <p className="text-sm font-black uppercase text-dac-secondary">Reportes diarios</p>
            <p className="mt-1 text-sm font-semibold text-dac-text/70">No se encontraron reportes para este proyecto en Supabase.</p>
          </div>
        )}

        {currentStep === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha" type="date" value={report.date} onChange={(value) => updateReport("date", value)} />
            <Field label="Hora" type="time" value={report.time} onChange={(value) => updateReport("time", value)} />
            <Field label="Clima" value={report.weather} placeholder="Soleado con intervalos de lluvia" onChange={(value) => updateReport("weather", value)} className="sm:col-span-2" />
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid gap-4">
            <TextArea label="Personal administrativo" value={report.administrativeStaff} placeholder="Director, residente, auxiliar SST" onChange={(value) => updateReport("administrativeStaff", value)} />
            <TextArea label="Personal operativo" value={report.operativeStaff} placeholder="18 oficiales y ayudantes" onChange={(value) => updateReport("operativeStaff", value)} />
            <TextArea label="Contratistas presentes" value={report.contractors} placeholder="Estructura, redes, mamposteria" onChange={(value) => updateReport("contractors", value)} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid gap-4">
            <TextArea label="Equipos utilizados" value={report.equipment} placeholder="Mezcladora, andamios, cortadora" onChange={(value) => updateReport("equipment", value)} />
            <TextArea label="Material recibido" value={report.material} placeholder="Cemento, acero, tuberia PVC" onChange={(value) => updateReport("material", value)} />
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid gap-5">
            <div className="grid gap-4 rounded-lg border border-dac-primary/10 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Buscar actividad del presupuesto" value={activitySearch} placeholder="Item, descripcion, capitulo o subcapitulo" onChange={setActivitySearch} />
                <div className="mt-3 grid gap-2">
                  {searchedBudgetItems.map((item) => {
                    const active = activityDraft.budgetItemId === item.item;
                    return (
                      <button
                        key={item.item}
                        type="button"
                        onClick={() => {
                          setActivityDraft((current) => ({
                            ...current,
                            budgetItemId: item.item,
                            activity: item.description,
                            unit: item.unit
                          }));
                          setActivitySearch(item.item + " - " + item.description);
                        }}
                        className={
                          "focus-ring rounded-md border p-3 text-left transition " +
                          (active
                            ? "border-dac-primary bg-dac-primary text-white"
                            : "border-dac-primary/15 bg-white text-dac-text hover:border-dac-secondary hover:bg-dac-secondary/10")
                        }
                      >
                        <span className="block text-sm font-black">{item.item} - {item.description}</span>
                        <span className="mt-1 block text-xs font-semibold opacity-75">{item.unit} - {item.chapter} - {item.subchapter}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedBudgetItem && (
                <div className="grid gap-3 rounded-lg bg-dac-primary/[0.04] p-4 sm:col-span-2 sm:grid-cols-3">
                  <Info label="ITEM" value={selectedBudgetItem.item} />
                  <Info label="DESCRIPCION" value={selectedBudgetItem.description} />
                  <Info label="UNIDAD" value={selectedBudgetItem.unit} />
                  <Info label="CAPITULO" value={selectedBudgetItem.chapter} />
                  <Info label="SUBCAPITULO" value={selectedBudgetItem.subchapter} />
                  <Info label="CANTIDAD CONTRATADA" value={formatNumber(selectedBudgetItem.quantity)} />
                  <Info label="CANTIDAD EJECUTADA ACUMULADA" value={formatNumber(selectedProgressItem?.executedQuantity ?? 0)} />
                  <Info label="CANTIDAD PENDIENTE" value={formatNumber(selectedPending)} />
                  <Info label="VALOR UNITARIO" value={formatCurrency(selectedBudgetItem.unitValue)} />
                  <Info label="VALOR TOTAL" value={formatCurrency(selectedBudgetItem.totalValue)} />
                  <Info label="PORCENTAJE EJECUTADO" value={selectedProgress.toFixed(1) + " %"} />
                  <Info label="ESTADO" value={selectedStatus} />
                </div>
              )}

              <Field label="Cantidad ejecutada hoy" value={activityDraft.quantityToday} placeholder="48" onChange={(value) => setActivityDraft((current) => ({ ...current, quantityToday: value }))} />
              <Field label="Frente de trabajo" value={activityDraft.workFront} placeholder="Torre 3 - Piso 5" onChange={(value) => setActivityDraft((current) => ({ ...current, workFront: value }))} />
              <Field label="Responsable" value={activityDraft.owner} placeholder="Hernan Aristizabal" onChange={(value) => setActivityDraft((current) => ({ ...current, owner: value }))} />
              <Field label="Hora inicio" type="time" value={activityDraft.startTime} onChange={(value) => setActivityDraft((current) => ({ ...current, startTime: value }))} />
              <Field label="Hora final" type="time" value={activityDraft.endTime} onChange={(value) => setActivityDraft((current) => ({ ...current, endTime: value }))} />
              <TextArea label="Observacion" value={activityDraft.observation} placeholder="Detalle del avance ejecutado" onChange={(value) => setActivityDraft((current) => ({ ...current, observation: value }))} className="sm:col-span-2" />
              <div className="grid gap-4 rounded-lg border border-dac-primary/10 bg-dac-primary/[0.03] p-4 sm:col-span-2 sm:grid-cols-2">
                <p className="text-sm font-black uppercase text-dac-primary sm:col-span-2">Compromiso opcional asociado a la actividad</p>
                <Field label="Descripcion compromiso" value={activityDraft.commitmentDescription} placeholder="Resolver detalle pendiente del frente" onChange={(value) => setActivityDraft((current) => ({ ...current, commitmentDescription: value }))} className="sm:col-span-2" />
                <Field label="Responsable compromiso" value={activityDraft.commitmentOwner} placeholder="Oscar Ospina" onChange={(value) => setActivityDraft((current) => ({ ...current, commitmentOwner: value }))} />
                <Field label="Fecha limite" type="date" value={activityDraft.commitmentDueDate} onChange={(value) => setActivityDraft((current) => ({ ...current, commitmentDueDate: value }))} />
                <label className={labelClass + " sm:col-span-2"}>
                  Prioridad
                  <select value={activityDraft.commitmentPriority} onChange={(event) => setActivityDraft((current) => ({ ...current, commitmentPriority: event.target.value as CommitmentPriority }))} className={inputClass}>
                    <option>Baja</option>
                    <option>Media</option>
                    <option>Alta</option>
                    <option>Critica</option>
                  </select>
                </label>
              </div>
              <button type="button" onClick={addActivity} className="focus-ring rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary sm:col-span-2">Agregar actividad</button>
            </div>
            <ItemList empty="Aun no hay actividades agregadas." items={draftActivities.map((item) => ({ title: item.activity, meta: item.quantity + " " + item.unit + " - " + item.time, detail: [item.observation, item.workFront, item.owner].filter(Boolean).join(" - ") }))} />
          </div>
        )}

        {currentStep === 4 && (
          <div className="grid gap-4">
            <TextArea label="Observaciones" value={report.observations} placeholder="Se mantiene el ritmo programado de obra." onChange={(value) => updateReport("observations", value)} />
            <TextArea label="Problemas" value={report.problems} placeholder="Retraso menor por lluvia en la tarde." onChange={(value) => updateReport("problems", value)} />
            <TextArea label="Acciones tomadas" value={report.actions} placeholder="Reprogramacion de remates y proteccion de materiales." onChange={(value) => updateReport("actions", value)} />
          </div>
        )}

        {currentStep === 5 && (
          <div className="grid gap-5">
            <div className="grid gap-4 rounded-lg border border-dac-primary/10 p-4 sm:grid-cols-2">
              <Field label="Descripcion" value={commitmentDraft.description} placeholder="Actualizar evidencia fotografica" onChange={(value) => setCommitmentDraft((current) => ({ ...current, description: value }))} className="sm:col-span-2" />
              <Field label="Responsable" value={commitmentDraft.owner} placeholder="Hernan Aristizabal" onChange={(value) => setCommitmentDraft((current) => ({ ...current, owner: value }))} />
              <Field label="Fecha limite" type="date" value={commitmentDraft.dueDate} onChange={(value) => setCommitmentDraft((current) => ({ ...current, dueDate: value }))} />
              <label className={labelClass + " sm:col-span-2"}>
                Prioridad
                <select value={commitmentDraft.priority} onChange={(event) => setCommitmentDraft((current) => ({ ...current, priority: event.target.value as CommitmentPriority }))} className={inputClass}>
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Critica</option>
                </select>
              </label>
              <button type="button" onClick={addCommitment} className="focus-ring rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary sm:col-span-2">Agregar compromiso</button>
            </div>
            <ItemList empty="Aun no hay compromisos agregados desde Registro Diario." items={draftCommitments.map((item) => ({ title: item.description, meta: (item.owner || "Sin responsable") + " - " + item.priority + " - " + item.status, detail: item.dueDate ? "Fecha limite: " + item.dueDate : "Sin fecha limite" }))} />
          </div>
        )}

        {currentStep === 6 && (
          <div className="grid gap-5">
            <div className="rounded-lg border border-dac-primary/10 p-4">
              <p className="text-lg font-black text-dac-primary">Fotos cargadas: {currentPhotos.length}/5</p>
              <p className="mt-1 text-sm text-dac-text/70">Carga imagenes reales desde la camara o galeria. Recomendado minimo 5 fotos.</p>
              {currentPhotos.length < 5 && <p className="mt-2 text-sm font-bold text-dac-alert">Aun faltan {5 - currentPhotos.length} fotos para el minimo recomendado.</p>}
              {photoMessage && <p className="mt-3 rounded-md bg-dac-secondary/10 px-3 py-2 text-sm font-bold text-dac-primary">{photoMessage}</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="focus-ring cursor-pointer rounded-md bg-dac-primary px-5 py-3 text-center font-bold text-white hover:bg-dac-secondary">
                  Tomar foto
                  <input type="file" accept="image/*" capture="environment" onChange={(event) => handleImageUpload(event.target.files)} className="sr-only" />
                </label>
                <label className="focus-ring cursor-pointer rounded-md border border-dac-primary px-5 py-3 text-center font-bold text-dac-primary hover:bg-dac-secondary/10">
                  Seleccionar imagenes
                  <input type="file" accept="image/*" multiple onChange={(event) => handleImageUpload(event.target.files)} className="sr-only" />
                </label>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentPhotos.map((photo) => (
                <article key={photo.id} className="rounded-lg border border-dac-primary/10 bg-white p-3">
                  {photoPreviews[photo.id] ? (
                    <img src={photoPreviews[photo.id]} alt={photo.name} className="h-44 w-full rounded-md object-cover" />
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded-md bg-dac-secondary/10 text-sm font-bold text-dac-primary">Cargando imagen</div>
                  )}
                  <p className="mt-3 text-sm font-black text-dac-primary">{photo.name}</p>
                  <textarea
                    value={photo.description ?? ""}
                    onChange={(event) => updateDailyPhotoDescription(photo.id, event.target.value)}
                    className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-3 py-2 text-sm"
                    placeholder="Descripcion opcional"
                    rows={2}
                  />
                  <label className="mt-2 block text-sm font-bold text-dac-text">
                    Actividad asociada
                    <select
                      value={photo.activityId ?? ""}
                      onChange={(event) => updateDailyPhotoDetails(photo.id, { description: photo.description ?? "", activityId: event.target.value || undefined })}
                      className="focus-ring mt-1 w-full rounded-md border border-dac-primary/20 px-3 py-2 text-sm"
                    >
                      <option value="">Sin asociar</option>
                      {budgetItems.map((item) => (
                        <option key={item.item} value={item.item}>{item.item} - {item.description}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={() => removePhoto(photo.id)} className="focus-ring mt-3 rounded-md border border-dac-alert px-3 py-2 text-sm font-bold text-dac-alert hover:bg-dac-alert hover:text-white">
                    Eliminar
                  </button>
                </article>
              ))}
              {currentPhotos.length === 0 && <p className="rounded-lg border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60">Aun no hay fotografias cargadas.</p>}
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="grid gap-5">
            <Field label="Firma del residente simulada" value={report.signature} placeholder="Hernan Aristizabal" onChange={(value) => updateReport("signature", value)} />
            <Summary report={report} activities={draftActivities} commitments={draftCommitments} photosCount={currentPhotos.length} executiveSummary={executiveSummary} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-dac-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <button type="button" onClick={() => setCurrentStep((step) => Math.max(0, step - 1))} disabled={isFirstStep} className="focus-ring rounded-md border border-dac-primary px-4 py-3 font-bold text-dac-primary hover:bg-dac-primary hover:text-white disabled:cursor-not-allowed disabled:border-dac-primary/20 disabled:text-dac-primary/35 disabled:hover:bg-white">Anterior</button>
          <button type="button" onClick={() => setCurrentStep((step) => Math.min(steps.length - 1, step + 1))} disabled={isLastStep} className="focus-ring rounded-md bg-dac-primary px-4 py-3 font-bold text-white hover:bg-dac-secondary disabled:cursor-not-allowed disabled:bg-dac-primary/35">Siguiente</button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:flex">
          <button type="button" disabled={isSavingReport} onClick={() => persistReport("Borrador")} className="focus-ring rounded-md border border-dac-alert px-4 py-3 font-bold text-dac-alert hover:bg-dac-alert hover:text-white disabled:cursor-not-allowed disabled:opacity-60">Guardar borrador</button>
          <button type="button" disabled={isSavingReport} onClick={() => persistReport("Enviado")} className="focus-ring rounded-md bg-dac-secondary px-4 py-3 font-bold text-dac-primary hover:bg-dac-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60">{isSavingReport ? "Guardando..." : "Enviar registro"}</button>
        </div>
      </div>
    </section>
  );
}

function logDailyReportClientError(error: unknown, functionName: string) {
  console.error("[DAC DailyReport] Excepcion controlada en frontend", {
    file: "components/DailyReportWizard.tsx",
    function: functionName,
    line: "ver sourcemap/build",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
}

function Field({ label, value, onChange, type = "text", placeholder, className = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; className?: string }) {
  return (
    <label className={labelClass + " " + className}>
      {label}
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, className = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={labelClass + " " + className}>
      {label}
      <textarea rows={4} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass + " resize-y"} />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs font-bold uppercase text-dac-text/50">{label}</p>
      <p className="mt-1 text-sm font-black text-dac-primary">{value}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

function getEmptyActivityDraft(): ActivityDraft {
  return {
    budgetItemId: "",
    activity: "",
    unit: "",
    quantityToday: "",
    observation: "",
    workFront: "",
    owner: "",
    startTime: "",
    endTime: "",
    photoCount: "",
    commitmentDescription: "",
    commitmentOwner: "",
    commitmentDueDate: "",
    commitmentPriority: "Media"
  };
}

function ItemList({ items, empty }: { items: Array<{ title: string; meta: string; detail?: string }>; empty: string }) {
  if (items.length === 0) {
    return <p className="rounded-lg border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60">{empty}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <article key={item.title + index} className="rounded-lg border border-dac-primary/10 p-4">
          <p className="font-black text-dac-primary">{item.title}</p>
          <p className="mt-1 text-sm font-semibold text-dac-alert">{item.meta}</p>
          {item.detail && <p className="mt-2 text-sm text-dac-text/70">{item.detail}</p>}
        </article>
      ))}
    </div>
  );
}

function Summary({
  report,
  activities,
  commitments,
  photosCount,
  executiveSummary
}: {
  report: ReportData;
  activities: Array<{ activity: string; quantity: number; unit: string; observation: string }>;
  commitments: Array<{ description: string; owner: string; priority: string; status: string; dueDate: string }>;
  photosCount: number;
  executiveSummary: { activities: number; photos: number; commitmentsPending: number; progress: number };
}) {
  const general = [
    ["Fecha", report.date],
    ["Hora", report.time],
    ["Clima", report.weather],
    ["Personal administrativo", report.administrativeStaff],
    ["Personal operativo", report.operativeStaff],
    ["Contratistas", report.contractors],
    ["Equipos", report.equipment],
    ["Material recibido", report.material],
    ["Observaciones", report.observations],
    ["Problemas", report.problems],
    ["Acciones tomadas", report.actions],
    ["Firma", report.signature],
    ["Fotografias", photosCount + "/5"],
    ["Avance calculado", executiveSummary.progress.toFixed(1) + " %"]
  ];

  return (
    <section className="rounded-lg border border-dac-primary/10 bg-dac-primary/[0.03] p-4">
      <h3 className="text-xl font-black text-dac-primary">Resumen antes de enviar</h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {general.map(([label, value]) => (
          <div key={label} className="rounded-md bg-white p-3">
            <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-dac-text">{value || "Sin diligenciar"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="font-black text-dac-primary">Actividades ejecutadas</h4>
          <ItemList empty="Sin actividades." items={activities.map((item) => ({ title: item.activity, meta: item.quantity + " " + item.unit, detail: item.observation }))} />
        </div>
        <div>
          <h4 className="font-black text-dac-primary">Compromisos</h4>
          <ItemList empty="Sin compromisos." items={commitments.map((item) => ({ title: item.description, meta: (item.owner || "Sin responsable") + " - " + item.priority + " - " + item.status, detail: item.dueDate ? "Fecha limite: " + item.dueDate : "Sin fecha limite" }))} />
        </div>
      </div>
    </section>
  );
}
