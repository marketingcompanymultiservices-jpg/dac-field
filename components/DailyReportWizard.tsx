"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { deleteImage, getImage, saveImage } from "@/lib/imageStorage";
import { getProgressStatus } from "@/lib/progress";
import { useProjectStore } from "@/lib/project-store";
import type { CommitmentPriority, DailyActivity } from "@/types";

type ActivityDraft = {
  activityType: "budget" | "free";
  budgetItemId: string;
  activity: string;
  freeActivityName: string;
  freeActivityDescription: string;
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

type WorkerDraft = {
  id: string;
  name: string;
  role: string;
  company: string;
  observation: string;
};

type MaterialUsedDraft = {
  id: string;
  material: string;
  unit: string;
  quantity: string;
  observation: string;
};

type ReportData = {
  date: string;
  time: string;
  weather: string;
  peopleCount: string;
  equipment: string;
  observations: string;
  problems: string;
  actions: string;
  signature: string;
};

const steps = [
  "Informacion general",
  "Personal de obra",
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
  peopleCount: "",
  equipment: "",
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
  const [workerDraft, setWorkerDraft] = useState<WorkerDraft>(getEmptyWorkerDraft());
  const [workers, setWorkers] = useState<WorkerDraft[]>([]);
  const [materialDraft, setMaterialDraft] = useState<MaterialUsedDraft>(getEmptyMaterialDraft());
  const [materialsUsed, setMaterialsUsed] = useState<MaterialUsedDraft[]>([]);
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
    return report.date || getLocalDateISO();
  }

  function getReportTime() {
    return report.time || new Date().toTimeString().slice(0, 5);
  }

  function addWorker() {
    if (!workerDraft.name.trim() || !workerDraft.role.trim()) {
      setMessage("Registra nombre y cargo o cuadrilla del trabajador.");
      return;
    }

    setWorkers((current) => [...current, { ...workerDraft, id: createClientId("worker") }]);
    setWorkerDraft(getEmptyWorkerDraft());
    setMessage("Trabajador agregado al personal de obra.");
  }

  function removeWorker(id: string) {
    setWorkers((current) => current.filter((worker) => worker.id !== id));
  }

  function addMaterialUsed() {
    if (!materialDraft.material.trim() || !materialDraft.unit.trim()) {
      setMessage("Registra material y unidad antes de agregarlo.");
      return;
    }

    const quantity = Number(materialDraft.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("La cantidad de material utilizado debe ser mayor que cero.");
      return;
    }

    setMaterialsUsed((current) => [...current, { ...materialDraft, id: createClientId("material") }]);
    setMaterialDraft(getEmptyMaterialDraft());
    setMessage("Material utilizado agregado al Registro Diario.");
  }

  function removeMaterialUsed(id: string) {
    setMaterialsUsed((current) => current.filter((material) => material.id !== id));
  }

  function addActivity() {
    if (activityDraft.activityType === "free") {
      if (!activityDraft.freeActivityName.trim()) {
        setMessage("Escribe el nombre de la actividad libre.");
        return;
      }

      addDailyActivity({
        activity: activityDraft.freeActivityName.trim(),
        unit: "Actividad",
        quantity: 1,
        observation: activityDraft.freeActivityDescription.trim() || activityDraft.observation.trim(),
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

      setActivityDraft(getEmptyActivityDraft());
      setActivitySearch("");
      setMessage("Actividad libre agregada al Registro Diario. No modifica el presupuesto.");
      return;
    }

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
    setMessage("Actividad agregada al Registro Diario, avance y dashboard.");
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
    setMessage("Compromiso agregado al Registro Diario y al modulo Compromisos.");
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
      const saveResult = await saveDailyReport(
        {
          date: getReportDate(),
          time: getReportTime(),
          weather: report.weather,
          administrativeStaff: serializePersonnel(report.peopleCount, workers),
          operativeStaff: "",
          contractors: "",
          equipment: report.equipment,
          material: serializeMaterialsUsed(materialsUsed),
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
      setWorkerDraft(getEmptyWorkerDraft());
      setWorkers([]);
      setMaterialDraft(getEmptyMaterialDraft());
      setMaterialsUsed([]);
      setCommitmentDraft({ description: "", owner: "", dueDate: "", priority: "Media" });
      setPhotoPreviews({});
      setPhotoMessage("");
      setCurrentStep(0);
      setMessage(saveResult.progressConsolidationWarning ?? "Registro Diario guardado correctamente.");
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
        {currentStep === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha" type="date" value={report.date} onChange={(value) => updateReport("date", value)} />
            <Field label="Hora" type="time" value={report.time} onChange={(value) => updateReport("time", value)} />
            <Field label="Clima" value={report.weather} placeholder="Soleado con intervalos de lluvia" onChange={(value) => updateReport("weather", value)} className="sm:col-span-2" />
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid gap-4">
            <Field label="Numero total de personas en obra" type="number" value={report.peopleCount} placeholder="18" onChange={(value) => updateReport("peopleCount", value)} />
            <div className="grid gap-4 rounded-lg border border-dac-primary/10 p-4 sm:grid-cols-2">
              <p className="text-sm font-black uppercase text-dac-primary sm:col-span-2">Listado de trabajadores</p>
              <Field label="Nombre" value={workerDraft.name} placeholder="Nombre del trabajador" onChange={(value) => setWorkerDraft((current) => ({ ...current, name: value }))} />
              <Field label="Cargo o cuadrilla" value={workerDraft.role} placeholder="Oficial, ayudante, estructura" onChange={(value) => setWorkerDraft((current) => ({ ...current, role: value }))} />
              <Field label="Empresa opcional" value={workerDraft.company} placeholder="Contratista o empresa" onChange={(value) => setWorkerDraft((current) => ({ ...current, company: value }))} />
              <Field label="Observaciones opcionales" value={workerDraft.observation} placeholder="Ingreso parcial, novedad, frente" onChange={(value) => setWorkerDraft((current) => ({ ...current, observation: value }))} />
              <button type="button" onClick={addWorker} className="focus-ring rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary sm:col-span-2">Agregar trabajador</button>
            </div>
            <ItemList
              empty="Aun no hay trabajadores agregados."
              items={workers.map((worker) => ({
                id: worker.id,
                title: worker.name,
                meta: [worker.role, worker.company].filter(Boolean).join(" - "),
                detail: worker.observation || "Sin observaciones"
              }))}
              onRemove={removeWorker}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid gap-4">
            <TextArea label="Equipos utilizados" value={report.equipment} placeholder="Mezcladora, andamios, cortadora" onChange={(value) => updateReport("equipment", value)} />
            <div className="grid gap-4 rounded-lg border border-dac-primary/10 p-4 sm:grid-cols-2">
              <p className="text-sm font-black uppercase text-dac-primary sm:col-span-2">Material utilizado</p>
              <Field label="Material" value={materialDraft.material} placeholder="Cemento, malla, varilla, concreto" onChange={(value) => setMaterialDraft((current) => ({ ...current, material: value }))} />
              <Field label="Unidad" value={materialDraft.unit} placeholder="Bultos, m2, varillas, m3" onChange={(value) => setMaterialDraft((current) => ({ ...current, unit: value }))} />
              <Field label="Cantidad" type="number" value={materialDraft.quantity} placeholder="3" onChange={(value) => setMaterialDraft((current) => ({ ...current, quantity: value }))} />
              <Field label="Observacion opcional" value={materialDraft.observation} placeholder="Uso informativo, sin afectar inventario" onChange={(value) => setMaterialDraft((current) => ({ ...current, observation: value }))} />
              <button type="button" onClick={addMaterialUsed} className="focus-ring rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary sm:col-span-2">Agregar material utilizado</button>
            </div>
            <ItemList
              empty="Aun no hay materiales utilizados agregados."
              items={materialsUsed.map((material) => ({
                id: material.id,
                title: material.material,
                meta: material.quantity + " " + material.unit,
                detail: material.observation || "Sin observacion"
              }))}
              onRemove={removeMaterialUsed}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid gap-5">
            <div className="grid gap-4 rounded-lg border border-dac-primary/10 p-4 sm:grid-cols-2">
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setActivityDraft((current) => ({ ...current, activityType: "budget" }))}
                  className={"focus-ring rounded-md border px-4 py-3 text-sm font-black " + (activityDraft.activityType === "budget" ? "border-dac-primary bg-dac-primary text-white" : "border-dac-primary/20 text-dac-primary hover:bg-dac-secondary/10")}
                >
                  Actividad del presupuesto
                </button>
                <button
                  type="button"
                  onClick={() => setActivityDraft((current) => ({ ...current, activityType: "free", budgetItemId: "", activity: "", unit: "", quantityToday: "" }))}
                  className={"focus-ring rounded-md border px-4 py-3 text-sm font-black " + (activityDraft.activityType === "free" ? "border-dac-primary bg-dac-primary text-white" : "border-dac-primary/20 text-dac-primary hover:bg-dac-secondary/10")}
                >
                  Actividad libre
                </button>
              </div>

              {activityDraft.activityType === "budget" && (
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
              )}

              {activityDraft.activityType === "budget" && selectedBudgetItem && (
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

              {activityDraft.activityType === "budget" ? (
                <Field label="Cantidad ejecutada hoy" value={activityDraft.quantityToday} placeholder="48" onChange={(value) => setActivityDraft((current) => ({ ...current, quantityToday: value }))} />
              ) : (
                <>
                  <Field label="Nombre de la actividad libre" value={activityDraft.freeActivityName} placeholder="Cimbrada de apartamentos" onChange={(value) => setActivityDraft((current) => ({ ...current, freeActivityName: value }))} />
                  <TextArea label="Descripcion" value={activityDraft.freeActivityDescription} placeholder="Detalle de la actividad no presupuestal ejecutada o gestionada durante la jornada." onChange={(value) => setActivityDraft((current) => ({ ...current, freeActivityDescription: value }))} className="sm:col-span-2" />
                </>
              )}
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
            <Field label="Firma del residente" value={report.signature} placeholder="Hernan Aristizabal" onChange={(value) => updateReport("signature", value)} />
            <Summary report={report} workers={workers} materialsUsed={materialsUsed} activities={draftActivities} commitments={draftCommitments} photosCount={currentPhotos.length} executiveSummary={executiveSummary} />
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
    activityType: "budget",
    budgetItemId: "",
    activity: "",
    freeActivityName: "",
    freeActivityDescription: "",
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

function getEmptyWorkerDraft(): WorkerDraft {
  return {
    id: "",
    name: "",
    role: "",
    company: "",
    observation: ""
  };
}

function getEmptyMaterialDraft(): MaterialUsedDraft {
  return {
    id: "",
    material: "",
    unit: "",
    quantity: "",
    observation: ""
  };
}

function createClientId(prefix: string) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function serializePersonnel(peopleCount: string, workers: WorkerDraft[]) {
  return JSON.stringify({
    type: "dac-personnel-v1",
    totalPeople: Number(peopleCount || workers.length || 0),
    workers: workers.map(({ name, role, company, observation }) => ({ name, role, company, observation }))
  });
}

function serializeMaterialsUsed(materialsUsed: MaterialUsedDraft[]) {
  return JSON.stringify({
    type: "dac-materials-used-v1",
    items: materialsUsed.map(({ material, unit, quantity, observation }) => ({
      material,
      unit,
      quantity: Number(quantity || 0),
      observation
    }))
  });
}

function getLocalDateISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function ItemList({ items, empty, onRemove }: { items: Array<{ title: string; meta: string; detail?: string; id?: string }>; empty: string; onRemove?: (id: string) => void }) {
  if (items.length === 0) {
    return <p className="rounded-lg border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60">{empty}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <article key={item.title + index} className="rounded-lg border border-dac-primary/10 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <p className="font-black text-dac-primary">{item.title}</p>
            {onRemove && item.id && (
              <button type="button" onClick={() => onRemove(item.id ?? "")} className="focus-ring rounded-md border border-dac-alert px-3 py-1 text-xs font-bold text-dac-alert hover:bg-dac-alert hover:text-white">
                Eliminar
              </button>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-dac-alert">{item.meta}</p>
          {item.detail && <p className="mt-2 text-sm text-dac-text/70">{item.detail}</p>}
        </article>
      ))}
    </div>
  );
}

function Summary({
  report,
  workers,
  materialsUsed,
  activities,
  commitments,
  photosCount,
  executiveSummary
}: {
  report: ReportData;
  workers: WorkerDraft[];
  materialsUsed: MaterialUsedDraft[];
  activities: DailyActivity[];
  commitments: Array<{ description: string; owner: string; priority: string; status: string; dueDate: string }>;
  photosCount: number;
  executiveSummary: { activities: number; photos: number; commitmentsPending: number; progress: number };
}) {
  const peopleCount = Number(report.peopleCount || workers.length || 0);
  const budgetActivities = activities.filter((activity) => Boolean(activity.budgetItemId));
  const freeActivities = activities.filter((activity) => !activity.budgetItemId);
  const general = [
    ["Fecha", report.date],
    ["Hora", report.time],
    ["Clima", report.weather],
    ["Personas en obra", peopleCount > 0 ? String(peopleCount) : ""],
    ["Trabajadores listados", String(workers.length)],
    ["Equipos", report.equipment],
    ["Material utilizado", String(materialsUsed.length)],
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
          <h4 className="font-black text-dac-primary">Actividades presupuestales</h4>
          <ItemList empty="Sin actividades presupuestales." items={budgetActivities.map((item) => ({ title: item.activity, meta: item.quantity + " " + item.unit, detail: item.observation }))} />
          <h4 className="mt-4 font-black text-dac-primary">Actividades libres</h4>
          <ItemList empty="Sin actividades libres." items={freeActivities.map((item) => ({ title: item.activity, meta: "Actividad informativa", detail: item.observation }))} />
        </div>
        <div>
          <h4 className="font-black text-dac-primary">Personal y material utilizado</h4>
          <ItemList empty="Sin trabajadores listados." items={workers.map((worker) => ({ title: worker.name, meta: [worker.role, worker.company].filter(Boolean).join(" - "), detail: worker.observation }))} />
          <h4 className="mt-4 font-black text-dac-primary">Material utilizado</h4>
          <ItemList empty="Sin materiales utilizados." items={materialsUsed.map((material) => ({ title: material.material, meta: material.quantity + " " + material.unit, detail: material.observation }))} />
        </div>
        <div>
          <h4 className="font-black text-dac-primary">Compromisos</h4>
          <ItemList empty="Sin compromisos." items={commitments.map((item) => ({ title: item.description, meta: (item.owner || "Sin responsable") + " - " + item.priority + " - " + item.status, detail: item.dueDate ? "Fecha limite: " + item.dueDate : "Sin fecha limite" }))} />
        </div>
      </div>
    </section>
  );
}
