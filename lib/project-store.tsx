"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  adminCompany as initialAdminCompany,
  adminRoles as initialAdminRoles,
  adminUsers as initialAdminUsers,
  currentUserFallback,
  documentItems,
  permissionActions,
  permissionModules,
  projects
} from "@/lib/production-data";
import { buildProgressFromActivities, calculateProgressSummary } from "@/lib/progress";
import { addDaysISO, getWeekStartISO } from "@/lib/planning";
import { clearImages, getImage } from "@/lib/imageStorage";
import { buildProgrammedRows, calculateProgrammedSummary } from "@/lib/programmed-progress";
import { buildSmartAlerts } from "@/lib/alerts";
import { buildActivityProductivity, calculateProductivitySummary } from "@/lib/productivity";
import { clearAppState, loadAppState, saveAppState } from "@/lib/storage";
import { recalculateProjectBudgetExecution } from "@/lib/supabase/progress-engine";
import { createDraftProjectBudgetInSupabase, loadProjectBudgetFromSupabase, replaceProjectBudgetInSupabase, updateProjectBudgetItemInSupabase } from "@/lib/supabase/budget";
import { loadDailyReportBundleFromSupabase, saveDailyReportBundleToSupabase } from "@/lib/supabase/daily-reports";
import { loadProjectInitialSurveyItems, saveProjectInitialSurveyItems } from "@/lib/supabase/initial-survey";
import type {
  ActivityPlanning,
  AdminCompany,
  AdminPermissionAction,
  AdminPermissionModule,
  AdminRole,
  AdminUser,
  AlertOverride,
  AlertStatus,
  BudgetItem,
  BudgetQuantityChange,
  BudgetVersion,
  BudgetProgressItem,
  Commitment,
  CommitmentStatus,
  DailyActivity,
  DailyPhoto,
  DailyReportEntry,
  DashboardMetric,
  DirectionInspection,
  DirectionInspectionStatus,
  InitialSurveyItem,
  InitialSurveyMetadata,
  ManualProgressChange,
  Project,
  ProjectDocument,
  ProjectReport,
  SmartAlert,
  TimelineEvent
} from "@/types";

type ProjectStoreValue = {
  project: Project;
  projects: Project[];
  activities: DailyActivity[];
  dailyReports: DailyReportEntry[];
  photos: DailyPhoto[];
  commitments: Commitment[];
  documents: ProjectDocument[];
  budgetItems: BudgetItem[];
  budgetVersion: BudgetVersion | null;
  progressItems: BudgetProgressItem[];
  manualProgressChanges: ManualProgressChange[];
  budgetQuantityChanges: BudgetQuantityChange[];
  directionInspections: DirectionInspection[];
  timeline: TimelineEvent[];
  reports: ProjectReport[];
  planningItems: ActivityPlanning[];
  initialSurvey: InitialSurveyMetadata | null;
  initialSurveyItems: InitialSurveyItem[];
  dashboardMetrics: DashboardMetric[];
  alerts: SmartAlert[];
  progressSummary: ReturnType<typeof calculateProgressSummary>;
  isHydrated: boolean;
  hasLocalData: boolean;
  lastSavedAt: string | null;
  executiveSummary: {
    activities: number;
    photos: number;
    commitmentsPending: number;
    progress: number;
  };
  adminCompany: AdminCompany;
  adminUsers: AdminUser[];
  adminRoles: AdminRole[];
  currentUser: AdminUser;
  addDailyActivity: (activity: Omit<DailyActivity, "id" | "projectId">) => void;
  addDailyCommitment: (commitment: Omit<Commitment, "id" | "status" | "origin" | "createdAt" | "projectId">) => void;
  addDailyPhotos: (photos: DailyPhoto[]) => void;
  addDirectionInspectionPhotos: (photos: DailyPhoto[]) => void;
  updateDailyPhotoDescription: (id: string, description: string) => void;
  updateDailyPhotoDetails: (id: string, details: Pick<DailyPhoto, "description" | "activityId">) => void;
  deleteDailyPhoto: (id: string) => void;
  saveDailyReport: (report: Omit<DailyReportEntry, "id" | "projectId" | "status">, status: DailyReportEntry["status"]) => Promise<{ progressConsolidationWarning?: string }>;
  addCommitment: (commitment: Commitment) => void;
  updateCommitmentStatus: (id: string, status: CommitmentStatus) => void;
  addDocument: (document: ProjectDocument) => void;
  setProjectDocuments: (documents: ProjectDocument[]) => void;
  removeDocument: (id: string) => void;
  addReport: (report: ProjectReport) => void;
  deleteDraftReport: (id: string) => void;
  importBudget: (items: BudgetItem[], version: BudgetVersion) => Promise<BudgetVersion>;
  updateManualProgress: (change: Omit<ManualProgressChange, "id" | "date" | "origin">) => void;
  updateBudgetQuantity: (change: Omit<BudgetQuantityChange, "id" | "date" | "origin">) => void;
  saveInitialSurvey: (items: BudgetItem[], metadata: InitialSurveyMetadata, observations?: Record<string, string>) => Promise<{ warning?: string }>;
  upsertActivityPlanning: (planning: Omit<ActivityPlanning, "status">) => void;
  duplicateWeeklyPlanning: (fromWeekStart: string, toWeekStart: string) => void;
  updateAdminCompany: (company: AdminCompany) => void;
  addAdminUser: (user: Omit<AdminUser, "id" | "createdAt">) => void;
  updateAdminUser: (user: AdminUser) => void;
  deleteAdminUser: (id: string) => void;
  updateAdminRole: (role: AdminRole) => void;
  toggleRolePermission: (roleId: string, module: AdminPermissionModule, action: AdminPermissionAction) => void;
  updateAlertStatus: (id: string, status: AlertStatus) => void;
  addDirectionInspection: (inspection: Omit<DirectionInspection, "id" | "createdAt" | "updatedAt" | "history">) => void;
  updateDirectionInspection: (id: string, update: Partial<DirectionInspection>, user: string, action: string, detail: string) => void;
  updateDirectionInspectionStatus: (id: string, status: DirectionInspectionStatus, user: string, detail?: string) => void;
  addSystemEvent: (event: Omit<TimelineEvent, "id" | "time" | "source"> & { time?: string }) => void;
  clearProductionSessionData: (requesterRole?: string) => void;
};

const ProjectStoreContext = createContext<ProjectStoreValue | null>(null);
const ACTIVE_PROJECT_ID = projects[0].id;
const IMAGE_READ_TIMEOUT_MS = 6000;

export function ProjectStoreProvider({ children }: { children: ReactNode }) {
  const [projectBase, setProjectBase] = useState<Project>(projects[0]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReportEntry[]>([]);
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>(documentItems);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetVersion, setBudgetVersion] = useState<BudgetVersion | null>(null);
  const [manualProgressChanges, setManualProgressChanges] = useState<ManualProgressChange[]>([]);
  const [budgetQuantityChanges, setBudgetQuantityChanges] = useState<BudgetQuantityChange[]>([]);
  const [directionInspections, setDirectionInspections] = useState<DirectionInspection[]>([]);
  const [planningItems, setPlanningItems] = useState<ActivityPlanning[]>([]);
  const [initialSurvey, setInitialSurvey] = useState<InitialSurveyMetadata | null>(null);
  const [initialSurveyItems, setInitialSurveyItems] = useState<InitialSurveyItem[]>([]);
  const [systemEvents, setSystemEvents] = useState<TimelineEvent[]>([]);
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [adminCompany, setAdminCompany] = useState<AdminCompany>(initialAdminCompany);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>(initialAdminRoles);
  const [alertOverrides, setAlertOverrides] = useState<AlertOverride[]>([]);
  const [knownAlertIds, setKnownAlertIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [shouldPersist, setShouldPersist] = useState(false);
  const didHydrateRef = useRef(false);
  const pendingLocalBudgetRef = useRef<{ items: BudgetItem[]; version: BudgetVersion | null } | null>(null);

  const progressItems = useMemo(() => buildProgressFromActivities(budgetItems, activities, manualProgressChanges), [activities, budgetItems, manualProgressChanges]);
  const progressSummary = useMemo(() => calculateProgressSummary(progressItems), [progressItems]);
  const project = useMemo(
    () => ({ ...projectBase, progress: Number(progressSummary.generalProgress.toFixed(1)) }),
    [projectBase, progressSummary.generalProgress]
  );
  const alerts = useMemo(
    () =>
      buildSmartAlerts({
        project,
        budgetItems,
        planningItems,
        activities,
        dailyReports,
        photos,
        commitments,
        documents,
        overrides: alertOverrides
      }),
    [activities, alertOverrides, budgetItems, commitments, dailyReports, documents, photos, planningItems, project]
  );

  const timeline = useMemo(() => {
    const activityEvents: TimelineEvent[] = activities.map((activity) => ({
      id: "event-activity-" + activity.id,
      time: activity.time || "08:00",
      title: "Actividad registrada",
      description: `${activity.activity}: ${activity.quantity} ${activity.unit || "und"}. ${activity.observation || "Sin observacion."}`,
      source: "Registro Diario"
    }));
    const commitmentEvents: TimelineEvent[] = commitments
      .filter((commitment) => commitment.origin === "Registro Diario")
      .map((commitment) => ({
        id: "event-commitment-" + commitment.id,
        time: commitment.createdAt?.slice(11, 16) || "11:20",
        title: "Compromiso registrado",
        description: `${commitment.description} Responsable: ${commitment.owner}.`,
        source: "Compromiso"
      }));
    const photoEvents: TimelineEvent[] = photos.map((photo) => ({
      id: "event-photo-" + photo.id,
      time: photo.time || "14:00",
      title: "Fotografia cargada",
      description: photo.name + " agregada desde Registro Diario.",
      source: "Fotografia"
    }));

    return [...systemEvents, ...activityEvents, ...commitmentEvents, ...photoEvents].sort((a, b) => a.time.localeCompare(b.time));
  }, [activities, commitments, photos, systemEvents]);

  const dashboardMetrics = useMemo<DashboardMetric[]>(() => {
    const pendingCommitments = commitments.filter((commitment) => commitment.status === "Pendiente").length;
    const overdueCommitments = commitments.filter((commitment) => commitment.status === "Vencido").length;
    const criticalCommitments = commitments.filter((commitment) => commitment.priority === "Critica" && commitment.status !== "Cumplido").length;
    const criticalAlerts = alerts.filter((alert) => alert.priority === "Critica" && alert.status !== "Cerrada").length;
    const activeProjects = project.status === "En ejecucion" ? 1 : 0;
    const activityPhotos = activities.reduce((sum, activity) => sum + (activity.photoCount ?? 0), 0);
    const currentWeek = getWeekStartISO(new Date().toISOString().slice(0, 10));
    const weeklyProgrammedRows = buildProgrammedRows({
      activities,
      budgetItems,
      planningItems,
      weekStart: currentWeek
    });
    const programmedSummary = calculateProgrammedSummary(weeklyProgrammedRows, budgetItems);
    const productivityRows = buildActivityProductivity(activities, budgetItems);
    const productivitySummary = calculateProductivitySummary(productivityRows, currentWeek);

    return [
      { label: "Obras activas", value: String(activeProjects), tone: "primary" },
      { label: "Avance promedio", value: project.progress.toFixed(1) + " %", tone: "secondary" },
      { label: "Registros pendientes", value: String(dailyReports.filter((report) => report.status === "Borrador").length), tone: "alert" },
      { label: "Alertas criticas", value: String(Math.max(criticalAlerts, criticalCommitments)), tone: "alert" },
      { label: "Compromisos vencidos", value: String(overdueCommitments), tone: "alert" },
      { label: "Fotos de hoy", value: String(photos.length + activityPhotos), tone: "secondary" },
      { label: "Compromisos pendientes", value: String(pendingCommitments), tone: "alert" },
      { label: "Desviacion Programado vs Ejecutado", value: programmedSummary.deviation.toFixed(1) + " %", tone: programmedSummary.deviation < 0 ? "alert" : "secondary" },
      { label: "Productividad semanal", value: productivitySummary.weeklyProductivity.toFixed(1) + " %", tone: productivitySummary.weeklyProductivity < 50 ? "alert" : "secondary" }
    ];
  }, [activities, alerts, budgetItems, commitments, dailyReports, photos.length, planningItems, project.progress, project.status]);

  useEffect(() => {
    if (!isHydrated) return;
    const newAlerts = alerts.filter((alert) => !knownAlertIds.includes(alert.id));
    if (newAlerts.length === 0) return;

    setKnownAlertIds((current) => Array.from(new Set([...current, ...newAlerts.map((alert) => alert.id)])));
    setSystemEvents((current) => [
      ...newAlerts.slice(0, 5).map((alert) => ({
        id: "event-alert-created-" + alert.id,
        time: new Date().toTimeString().slice(0, 5),
        title: "Alerta inteligente creada.",
        description: alert.type + ": " + alert.detail,
        source: "Sistema" as const
      })),
      ...current
    ]);
    setShouldPersist(true);
  }, [alerts, isHydrated, knownAlertIds]);

  const executiveSummary = useMemo(
    () => ({
      activities: activities.length,
      photos: photos.length + activities.reduce((sum, activity) => sum + (activity.photoCount ?? 0), 0),
      commitmentsPending: commitments.filter((commitment) => commitment.status === "Pendiente").length,
      progress: project.progress
    }),
    [activities, commitments, photos.length, project.progress]
  );

  async function saveReport(report: Omit<DailyReportEntry, "id" | "projectId" | "status">, status: DailyReportEntry["status"]) {
    const projectIdForDailyReports = normalizeProjectId(project.id);
    const reportId = "daily-report-" + Date.now();
    const nextReport: DailyReportEntry = {
      ...report,
      id: reportId,
      projectId: projectIdForDailyReports,
      status
    };
    const reportActivities = activities.filter((activity) => normalizeProjectId(activity.projectId) === projectIdForDailyReports && activity.date === report.date && !activity.dailyReportId);
    const reportCommitments = commitments
      .filter((commitment) => normalizeProjectId(commitment.projectId) === projectIdForDailyReports && commitment.origin === "Registro Diario" && !commitment.dailyReportId)
      .map((commitment) => ({ ...commitment, dailyReportId: commitment.dailyReportId ?? reportId }));
    const reportPhotos = await Promise.all(
      photos
        .filter((photo) => normalizeProjectId(photo.projectId) === projectIdForDailyReports && photo.date === report.date && !photo.dailyReportId && !photo.reportId)
        .map(async (photo) => ({
          ...photo,
          reportId,
          dailyReportId: reportId,
          imageData: photo.imageData || (await getImageWithTimeout(photo.id).catch(() => ""))
        }))
    );

    await saveDailyReportBundleToSupabase({
      projectId: projectIdForDailyReports,
      report: nextReport,
      activities: reportActivities,
      photos: reportPhotos,
      commitments: reportCommitments
    });

    const remoteBundle = await loadDailyReportBundleFromSupabase(projectIdForDailyReports);
    const createdReport = remoteBundle.dailyReports.find((item) => item.id === reportId);
    const visibleReports = prioritizeReport(remoteBundle.dailyReports, reportId);

    if (!createdReport) {
      throw new Error("El reporte fue enviado, pero no pudo confirmarse su lectura desde Supabase.");
    }

    let progressConsolidationWarning: string | undefined;
    let consolidatedBudget: Awaited<ReturnType<typeof loadProjectBudgetFromSupabase>> | null = null;
    try {
      await recalculateProjectBudgetExecution(projectIdForDailyReports);
      try {
        consolidatedBudget = await loadProjectBudgetFromSupabase(projectIdForDailyReports);
      } catch (error) {
        const warningMessage =
          "Registro Diario guardado correctamente y avance consolidado, pero la vista no pudo actualizarse. " +
          (error instanceof Error ? error.message : "Error desconocido al recargar el presupuesto consolidado.");
        progressConsolidationWarning = warningMessage;
        console.error("[DAC Progress Engine] Avance consolidado sin refrescar presupuesto", {
          projectId: projectIdForDailyReports,
          reportId,
          error
        });
        setSystemEvents((current) => [
          {
            id: "event-progress-engine-refresh-error-" + Date.now(),
            time: new Date().toTimeString().slice(0, 5),
            title: "Avance consolidado sin refrescar vista.",
            description: warningMessage,
            source: "Sistema"
          },
          ...current
        ]);
      }
    } catch (error) {
      const warningMessage =
        "Registro Diario guardado correctamente, pero el avance no pudo consolidarse. " +
        (error instanceof Error ? error.message : "Error desconocido al ejecutar el motor de avance.");
      progressConsolidationWarning = warningMessage;
      console.error("[DAC Progress Engine] Registro Diario guardado sin consolidar avance", {
        projectId: projectIdForDailyReports,
        reportId,
        error
      });
      setSystemEvents((current) => [
        {
          id: "event-progress-engine-error-" + Date.now(),
          time: new Date().toTimeString().slice(0, 5),
          title: "Registro Diario guardado sin consolidar avance.",
          description: warningMessage,
          source: "Sistema"
        },
        ...current
      ]);
    }

    setShouldPersist(true);
    setDailyReports(visibleReports);
    setActivities(remoteBundle.activities);
    setPhotos(remoteBundle.photos);
    setCommitments(remoteBundle.commitments);
    if (consolidatedBudget) {
      setBudgetItems(consolidatedBudget.items);
      setBudgetVersion(consolidatedBudget.version);
    }

    return { progressConsolidationWarning };
  }

  useEffect(() => {
    const storedState = loadAppState();

    if (storedState) {
      setProjectBase(normalizeProject(storedState.project));
      setActivities([]);
      setDailyReports([]);
      setPhotos([]);
      setCommitments([]);
      setDocuments(storedState.documents);
      pendingLocalBudgetRef.current = {
        items: storedState.budgetItems ?? [],
        version: storedState.budgetVersion ?? null
      };
      setManualProgressChanges(storedState.manualProgressChanges ?? []);
      setBudgetQuantityChanges(storedState.budgetQuantityChanges ?? []);
      setDirectionInspections(storedState.directionInspections ?? []);
      setPlanningItems((storedState.planningItems ?? []).map((item) => ({ ...item, plannedQuantity: item.plannedQuantity ?? 0, status: "Pendiente" })));
      setInitialSurvey(storedState.initialSurvey ?? null);
      setInitialSurveyItems(storedState.initialSurveyItems ?? []);
      setSystemEvents(storedState.systemEvents ?? []);
      setReports([]);
      setAdminCompany(storedState.adminCompany ?? initialAdminCompany);
      setAdminUsers(mergeAdminUsers(storedState.adminUsers ?? initialAdminUsers));
      setAdminRoles(mergeAdminRoles(storedState.adminRoles ?? initialAdminRoles));
      setAlertOverrides(storedState.alertOverrides ?? []);
      setKnownAlertIds(storedState.knownAlertIds ?? []);
      setHasLocalData(true);
      setLastSavedAt(storedState.savedAt);
      setShouldPersist(true);
    }

    didHydrateRef.current = true;
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    let active = true;
    async function loadRemoteBudget() {
      try {
        const remoteBudget = await loadProjectBudgetFromSupabase(projectBase.id);
        if (!active) return;

        if (remoteBudget.items.length > 0) {
          setBudgetItems(remoteBudget.items);
          setBudgetVersion(remoteBudget.version);
          pendingLocalBudgetRef.current = null;
          return;
        }

        const pendingLocalBudget = pendingLocalBudgetRef.current;
        if (pendingLocalBudget?.items.length) {
          const migrationVersion =
            pendingLocalBudget.version ??
            {
              versionNumber: 1,
              importedAt: new Date().toISOString(),
              importedBy: "Migracion local DAC",
              fileName: "Presupuesto local migrado",
              totalActivities: pendingLocalBudget.items.length,
              totalBudgetValue: pendingLocalBudget.items.reduce((sum, item) => sum + item.totalValue, 0)
            };
          const migratedBudget = await replaceProjectBudgetInSupabase(projectBase.id, pendingLocalBudget.items, migrationVersion);
          if (!active) return;
          setBudgetItems(migratedBudget.items);
          setBudgetVersion(migratedBudget.version);
          pendingLocalBudgetRef.current = null;
          setSystemEvents((current) => [
            {
              id: "event-budget-migrated-" + Date.now(),
              time: new Date().toTimeString().slice(0, 5),
              title: "Presupuesto local sincronizado con Supabase.",
              description: "Se migro una unica vez el presupuesto local para usar Supabase como fuente maestra.",
              source: "Sistema"
            },
            ...current
          ]);
          setShouldPersist(true);
          return;
        }

        setBudgetItems([]);
        setBudgetVersion(remoteBudget.version);
      } catch (error) {
        if (!active) return;
        setBudgetItems([]);
        setBudgetVersion(null);
        setSystemEvents((current) => [
          {
            id: "event-budget-supabase-error-" + Date.now(),
            time: new Date().toTimeString().slice(0, 5),
            title: "No fue posible cargar presupuesto desde Supabase.",
            description: error instanceof Error ? error.message : "Error desconocido al consultar presupuesto maestro.",
            source: "Sistema"
          },
          ...current
        ]);
        setShouldPersist(true);
      }
    }

    loadRemoteBudget();
    return () => {
      active = false;
    };
  }, [isHydrated, projectBase.id]);

  useEffect(() => {
    if (!isHydrated) return;

    let active = true;
    async function loadRemoteInitialSurvey() {
      try {
        const remoteItems = await loadProjectInitialSurveyItems(projectBase.id);
        if (!active) return;
        setInitialSurveyItems(remoteItems);
      } catch (error) {
        if (!active) return;
        setSystemEvents((current) => [
          {
            id: "event-initial-survey-load-error-" + Date.now(),
            time: new Date().toTimeString().slice(0, 5),
            title: "No fue posible cargar levantamiento inicial desde Supabase.",
            description: error instanceof Error ? error.message : "Error desconocido al consultar levantamiento inicial.",
            source: "Sistema"
          },
          ...current
        ]);
      }
    }

    loadRemoteInitialSurvey();
    return () => {
      active = false;
    };
  }, [isHydrated, projectBase.id]);

  useEffect(() => {
    if (!isHydrated) return;

    let active = true;
    async function loadRemoteDailyReports() {
      try {
        const projectIdForDailyReports = normalizeProjectId(projectBase.id);
        const remoteBundle = await loadDailyReportBundleFromSupabase(projectIdForDailyReports);
        if (!active) return;

        setDailyReports(remoteBundle.dailyReports);
        setActivities(remoteBundle.activities);
        setPhotos(remoteBundle.photos);
        setCommitments(remoteBundle.commitments);
        setShouldPersist(true);
      } catch (error) {
        if (!active) return;
        setDailyReports([]);
        setActivities([]);
        setPhotos([]);
        setCommitments([]);
        console.error("[DAC DailyReports] No fue posible cargar reportes diarios desde Supabase", {
          origin: "Supabase",
          projectId: normalizeProjectId(projectBase.id),
          error
        });
        setSystemEvents((current) => [
          {
            id: "event-daily-reports-supabase-error-" + Date.now(),
            time: new Date().toTimeString().slice(0, 5),
            title: "No fue posible cargar reportes diarios desde Supabase.",
            description: error instanceof Error ? error.message : "Error desconocido al consultar reportes diarios.",
            source: "Sistema"
          },
          ...current
        ]);
        setShouldPersist(true);
      }
    }

    loadRemoteDailyReports();
    return () => {
      active = false;
    };
  }, [isHydrated, projectBase.id]);

  useEffect(() => {
    if (!didHydrateRef.current || !isHydrated || !shouldPersist) return;
    const savedAt = new Date().toISOString();
    saveAppState({
      version: 1,
      savedAt,
      project,
      activities,
      dailyReports,
      photos: photos.map(stripPhotoImageData),
      commitments,
      documents,
      budgetItems: [],
      budgetVersion: null,
      manualProgressChanges,
      budgetQuantityChanges,
      directionInspections,
      planningItems,
      initialSurvey,
      initialSurveyItems,
      systemEvents,
      reports,
      adminCompany,
      adminUsers,
      adminRoles,
      alertOverrides,
      knownAlertIds,
      timeline,
      progressItems
    });
    setHasLocalData(true);
    setLastSavedAt(savedAt);
  }, [activities, adminCompany, adminRoles, adminUsers, alertOverrides, budgetItems, budgetQuantityChanges, budgetVersion, commitments, dailyReports, directionInspections, documents, initialSurvey, initialSurveyItems, isHydrated, knownAlertIds, manualProgressChanges, photos, planningItems, progressItems, project, reports, shouldPersist, systemEvents, timeline]);

  function clearProductionSessionData(requesterRole?: string) {
    if (requesterRole !== "Administrador") {
      console.error("[DAC Security] Accion administrativa no autorizada", {
        file: "lib/project-store.tsx",
        function: "clearProductionSessionData",
        role: requesterRole ?? "sin rol"
      });
      return;
    }
    clearAppState();
    clearImages().catch(() => undefined);
    setProjectBase(projects[0]);
    setActivities([]);
    setDailyReports([]);
    setPhotos([]);
    setCommitments([]);
    setDocuments(documentItems);
    setBudgetItems([]);
    setBudgetVersion(null);
    setManualProgressChanges([]);
    setBudgetQuantityChanges([]);
    setDirectionInspections([]);
    setPlanningItems([]);
    setInitialSurvey(null);
    setInitialSurveyItems([]);
    setSystemEvents([]);
    setReports([]);
    setAdminCompany(initialAdminCompany);
    setAdminUsers(initialAdminUsers);
    setAdminRoles(initialAdminRoles);
    setAlertOverrides([]);
    setKnownAlertIds([]);
    setHasLocalData(false);
    setLastSavedAt(null);
    setShouldPersist(false);
  }

  const value: ProjectStoreValue = {
    project,
    projects: [project],
    activities,
    dailyReports,
    photos,
    commitments,
    documents,
    budgetItems,
    budgetVersion,
    manualProgressChanges,
    budgetQuantityChanges,
    directionInspections,
    progressItems,
    planningItems,
    initialSurvey,
    initialSurveyItems,
    timeline,
    reports,
    alerts,
    dashboardMetrics,
    progressSummary,
    isHydrated,
    hasLocalData,
    lastSavedAt,
    executiveSummary,
    adminCompany,
    adminUsers,
    adminRoles,
    currentUser: adminUsers[0] ?? currentUserFallback,
    addDailyActivity(activity) {
      setShouldPersist(true);
      const quantity = Number(activity.quantity || 0);
      setActivities((current) => [
        {
          ...activity,
          id: "activity-" + Date.now(),
          projectId: project.id,
          quantity
        },
        ...current
      ]);
      if (activity.budgetItemId) {
        const currentBudgetItem = budgetItems.find((item) => item.item === activity.budgetItemId);
        if (currentBudgetItem) {
          const nextExecutedQuantity = Math.min((currentBudgetItem.executedQuantity ?? 0) + quantity, currentBudgetItem.quantity);
          updateProjectBudgetItemInSupabase(project.id, currentBudgetItem.item, { executedQuantity: nextExecutedQuantity })
            .then((remoteItem) => {
              setBudgetItems((current) => current.map((item) => (item.item === remoteItem.item ? remoteItem : item)));
            })
            .catch((error) => {
              setSystemEvents((current) => [
                {
                  id: "event-daily-activity-budget-sync-error-" + Date.now(),
                  time: new Date().toTimeString().slice(0, 5),
                  title: "No fue posible sincronizar avance del Registro Diario en Supabase.",
                  description: error instanceof Error ? error.message : "Error desconocido al actualizar presupuesto.",
                  source: "Sistema"
                },
                ...current
              ]);
            });
        }
      }
    },
    addDailyCommitment(commitment) {
      setShouldPersist(true);
      setCommitments((current) => [
        {
          ...commitment,
          id: "commitment-" + Date.now(),
          projectId: project.id,
          status: "Pendiente",
          origin: "Registro Diario",
          createdAt: new Date().toISOString()
        },
        ...current
      ]);
    },
    addDailyPhotos(nextPhotos) {
      setShouldPersist(true);
      setPhotos((current) => [...nextPhotos, ...current]);
      if (nextPhotos.length > 0) {
        setSystemEvents((current) => [
          {
            id: "event-photos-" + Date.now(),
            time: nextPhotos[0].time || new Date().toTimeString().slice(0, 5),
            title: "Se cargaron " + nextPhotos.length + " fotografias al registro diario.",
            description: "Registro fotografico cargado por " + (nextPhotos[0].user || "Jose Martinez") + ".",
            source: "Fotografia"
          },
          ...current
        ]);
      }
    },
    addDirectionInspectionPhotos(nextPhotos) {
      setShouldPersist(true);
      setPhotos((current) => [...nextPhotos, ...current]);
    },
    updateDailyPhotoDescription(id, description) {
      setShouldPersist(true);
      setPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, description } : photo)));
    },
    updateDailyPhotoDetails(id, details) {
      setShouldPersist(true);
      setPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, ...details } : photo)));
    },
    deleteDailyPhoto(id) {
      setShouldPersist(true);
      setPhotos((current) => current.filter((photo) => photo.id !== id));
    },
    saveDailyReport: saveReport,
    addCommitment(commitment) {
      setShouldPersist(true);
      setCommitments((current) => [{ ...commitment, projectId: project.id }, ...current]);
    },
    updateCommitmentStatus(id, status) {
      setShouldPersist(true);
      setCommitments((current) => current.map((commitment) => (commitment.id === id ? { ...commitment, status } : commitment)));
    },
    addDocument(document) {
      setShouldPersist(true);
      setDocuments((current) => [document, ...current]);
    },
    setProjectDocuments(nextDocuments) {
      setShouldPersist(true);
      setDocuments(nextDocuments);
    },
    removeDocument(id) {
      setShouldPersist(true);
      setDocuments((current) => current.filter((document) => document.id !== id));
    },
    addReport(report) {
      setShouldPersist(true);
      setReports((current) => [report, ...current]);
    },
    deleteDraftReport(id) {
      setShouldPersist(true);
      setReports((current) => current.filter((report) => report.id !== id || report.status !== "Borrador"));
    },
    async importBudget(items, version) {
      setShouldPersist(true);
      try {
        const result = await createDraftProjectBudgetInSupabase(project.id, items, {
          ...version,
          status: "Borrador"
        });
        return result.version;
      } catch (error) {
        console.error("[DAC Budget] No fue posible crear version Borrador del presupuesto en Supabase", error);
        setSystemEvents((current) => [
          {
            id: "event-budget-import-error-" + Date.now(),
            time: new Date().toTimeString().slice(0, 5),
            title: "No fue posible crear presupuesto Borrador en Supabase.",
            description: error instanceof Error ? error.message : "Error desconocido al guardar presupuesto.",
            source: "Sistema"
          },
          ...current
        ]);
        throw error;
      }
    },
    updateManualProgress(change) {
      setShouldPersist(true);
      const nextChange: ManualProgressChange = {
        ...change,
        id: "manual-progress-" + Date.now(),
        date: new Date().toISOString(),
        origin: "Edición manual de avance"
      };
      setManualProgressChanges((current) => [nextChange, ...current]);
      updateProjectBudgetItemInSupabase(project.id, change.item, { executedQuantity: change.newQuantity })
        .then((remoteItem) => {
          setBudgetItems((current) => current.map((item) => (item.item === change.item ? remoteItem : item)));
        })
        .catch((error) => {
          setSystemEvents((current) => [
            {
              id: "event-manual-progress-supabase-error-" + Date.now(),
              time: new Date().toTimeString().slice(0, 5),
              title: "No fue posible sincronizar avance manual en Supabase.",
              description: error instanceof Error ? error.message : "Error desconocido al actualizar avance.",
              source: "Sistema"
            },
            ...current
          ]);
        });
      setSystemEvents((current) => [
        {
          id: "event-manual-progress-" + Date.now(),
          time: new Date().toTimeString().slice(0, 5),
          title: "Se actualizo avance manual de la actividad " + change.item + " " + change.description + ".",
          description: "Cantidad anterior: " + change.previousQuantity + ". Cantidad nueva: " + change.newQuantity + ". Observacion: " + (change.observation || "Sin observacion."),
          source: "Sistema"
        },
        ...current
      ]);
    },
    updateBudgetQuantity(change) {
      setShouldPersist(true);
      const nextChange: BudgetQuantityChange = {
        ...change,
        id: "budget-quantity-" + Date.now(),
        date: new Date().toISOString(),
        origin: "Correccion manual de cantidad presupuestada"
      };
      setBudgetQuantityChanges((current) => [nextChange, ...current]);
      const currentItem = budgetItems.find((item) => item.item === change.item);
      updateProjectBudgetItemInSupabase(project.id, change.item, {
        quantity: change.newQuantity,
        totalValue: change.newQuantity * (currentItem?.unitValue ?? 0)
      })
        .then((remoteItem) => {
          setBudgetItems((current) => current.map((item) => (item.item === change.item ? remoteItem : item)));
        })
        .catch((error) => {
          setSystemEvents((current) => [
            {
              id: "event-budget-quantity-supabase-error-" + Date.now(),
              time: new Date().toTimeString().slice(0, 5),
              title: "No fue posible sincronizar cantidad presupuestada en Supabase.",
              description: error instanceof Error ? error.message : "Error desconocido al actualizar presupuesto.",
              source: "Sistema"
            },
            ...current
          ]);
        });
      setSystemEvents((current) => [
        {
          id: "event-budget-quantity-" + Date.now(),
          time: new Date().toTimeString().slice(0, 5),
          title: "Se actualizo cantidad presupuestada de la actividad " + change.item + " " + change.description + ".",
          description: "Cantidad anterior: " + change.previousQuantity + ". Cantidad nueva: " + change.newQuantity + ". Observacion: " + (change.observation || "Sin observacion."),
          source: "Sistema"
        },
        ...current
      ]);
    },
    async saveInitialSurvey(items, metadata, observations = {}) {
      setShouldPersist(true);
      const savedSurveyItems = await saveProjectInitialSurveyItems(project.id, items, observations);
      if (savedSurveyItems.length === 0) {
        throw new Error("No se guardo ningun registro del levantamiento inicial. El avance no fue recalculado.");
      }
      setInitialSurveyItems(savedSurveyItems);

      let warning: string | undefined;
      try {
        await recalculateProjectBudgetExecution(project.id);
        try {
          const consolidatedBudget = await loadProjectBudgetFromSupabase(project.id);
          setBudgetItems(consolidatedBudget.items);
          setBudgetVersion(consolidatedBudget.version);
        } catch (error) {
          const warningMessage =
            "Levantamiento inicial guardado y avance consolidado, pero la vista no pudo actualizarse. " +
            (error instanceof Error ? error.message : "Error desconocido al recargar presupuesto consolidado.");
          warning = warningMessage;
          setSystemEvents((current) => [
            {
              id: "event-initial-survey-budget-refresh-error-" + Date.now(),
              time: new Date().toTimeString().slice(0, 5),
              title: "Levantamiento consolidado sin refrescar vista.",
              description: warningMessage,
              source: "Sistema"
            },
            ...current
          ]);
        }
      } catch (error) {
        const warningMessage =
          "Levantamiento inicial guardado, pero el avance no pudo consolidarse. " +
          (error instanceof Error ? error.message : "Error desconocido al ejecutar el motor de avance.");
        warning = warningMessage;
        setSystemEvents((current) => [
          {
            id: "event-initial-survey-progress-engine-error-" + Date.now(),
            time: new Date().toTimeString().slice(0, 5),
            title: "Levantamiento guardado sin consolidar avance.",
            description: warningMessage,
            source: "Sistema"
          },
          ...current
        ]);
      }

      setInitialSurvey(metadata);
      setSystemEvents((current) => [
        {
          id: "event-initial-survey-" + Date.now(),
          time: new Date().toTimeString().slice(0, 5),
          title: "Levantamiento inicial actualizado.",
          description: "Jose Martinez guardo el punto de partida del control DAC con avance inicial de " + metadata.initialProgress.toFixed(1) + " %.",
          source: "Sistema"
        },
        ...current
      ]);
      return { warning };
    },
    upsertActivityPlanning(planning) {
      setShouldPersist(true);
      setPlanningItems((current) => {
        const nextPlanning: ActivityPlanning = { ...planning, id: planning.id ?? "planning-" + Date.now(), status: "Pendiente", createdAt: planning.createdAt ?? new Date().toISOString() };
        const exists = current.some((item) => item.budgetItemId === planning.budgetItemId && item.startDate === planning.startDate && item.endDate === planning.endDate);
        if (!exists) {
          setSystemEvents((events) => [
            {
              id: "event-weekly-planning-" + Date.now(),
              time: new Date().toTimeString().slice(0, 5),
              title: "Se creo una nueva planificacion semanal.",
              description: "Actividad " + planning.budgetItemId + " programada para la semana.",
              source: "Sistema"
            },
            ...events
          ]);
          return [nextPlanning, ...current];
        }
        return current.map((item) => (item.budgetItemId === planning.budgetItemId && item.startDate === planning.startDate && item.endDate === planning.endDate ? nextPlanning : item));
      });
    },
    duplicateWeeklyPlanning(fromWeekStart, toWeekStart) {
      setShouldPersist(true);
      const fromWeekEnd = addDaysISO(fromWeekStart, 6);
      const toWeekEnd = addDaysISO(toWeekStart, 6);
      setPlanningItems((current) => {
        const sourceItems = current.filter((item) => item.startDate >= fromWeekStart && item.startDate <= fromWeekEnd);
        const sourceByItem = new Set(sourceItems.map((item) => item.budgetItemId));
        const preserved = current.filter((item) => !(sourceByItem.has(item.budgetItemId) && item.startDate >= toWeekStart && item.startDate <= toWeekEnd));
        const duplicated = sourceItems.map((item, index) => {
          const offsetStart = Math.max(0, Math.round((new Date(item.startDate + "T00:00:00").getTime() - new Date(fromWeekStart + "T00:00:00").getTime()) / 86400000));
          const duration = Math.max(0, Math.round((new Date(item.endDate + "T00:00:00").getTime() - new Date(item.startDate + "T00:00:00").getTime()) / 86400000));
          return {
            ...item,
            id: "planning-copy-" + Date.now() + "-" + index,
            startDate: addDaysISO(toWeekStart, offsetStart),
            endDate: addDaysISO(addDaysISO(toWeekStart, offsetStart), duration),
            status: "Pendiente" as const,
            createdAt: new Date().toISOString()
          };
        });

        if (duplicated.length > 0) {
          setSystemEvents((events) => [
            {
              id: "event-weekly-planning-copy-" + Date.now(),
              time: new Date().toTimeString().slice(0, 5),
              title: "Se creo una nueva planificacion semanal.",
              description: "Se duplico la programacion de " + fromWeekStart + " hacia " + toWeekStart + ".",
              source: "Sistema"
            },
            ...events
          ]);
        }

        return [...duplicated, ...preserved];
      });
    },
    updateAdminCompany(company) {
      setShouldPersist(true);
      setAdminCompany(company);
    },
    addAdminUser(user) {
      setShouldPersist(true);
      setAdminUsers((current) => [
        {
          ...user,
          id: "admin-user-" + Date.now(),
          createdAt: new Date().toISOString().slice(0, 10),
          status: user.status,
          active: user.active
        },
        ...current
      ]);
    },
    updateAdminUser(user) {
      setShouldPersist(true);
      setAdminUsers((current) => current.map((item) => (item.id === user.id ? user : item)));
    },
    deleteAdminUser(id) {
      setShouldPersist(true);
      setAdminUsers((current) => current.filter((item) => item.id !== id));
    },
    updateAdminRole(role) {
      setShouldPersist(true);
      setAdminRoles((current) => current.map((item) => (item.id === role.id ? role : item)));
    },
    toggleRolePermission(roleId, module, action) {
      setShouldPersist(true);
      setAdminRoles((current) =>
        current.map((role) =>
          role.id === roleId
            ? {
                ...role,
                permissions: {
                  ...role.permissions,
                  [module]: {
                    ...role.permissions[module],
                    [action]: !role.permissions[module][action]
                  }
                }
              }
            : role
        )
      );
    },
    updateAlertStatus(id, status) {
      setShouldPersist(true);
      setAlertOverrides((current) => {
        const exists = current.some((item) => item.id === id);
        const nextOverride = { id, status, updatedAt: new Date().toISOString() };
        return exists ? current.map((item) => (item.id === id ? nextOverride : item)) : [nextOverride, ...current];
      });
      setSystemEvents((current) => [
        {
          id: "event-alert-status-" + id + "-" + Date.now(),
          time: new Date().toTimeString().slice(0, 5),
          title: status === "Cerrada" ? "Alerta inteligente cerrada." : "Alerta inteligente actualizada.",
          description: "La alerta " + id + " cambio a estado " + status + ".",
          source: "Sistema"
        },
        ...current
      ]);
    },
    addDirectionInspection(inspection) {
      setShouldPersist(true);
      const now = new Date().toISOString();
      const nextInspection: DirectionInspection = {
        ...inspection,
        id: "inspection-" + Date.now(),
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: "inspection-history-" + Date.now(),
            user: inspection.createdBy,
            date: now,
            action: "Creacion",
            detail: "Inspeccion creada y asignada a " + inspection.responsible + "."
          }
        ]
      };
      setDirectionInspections((current) => [nextInspection, ...current]);
    },
    updateDirectionInspection(id, update, user, action, detail) {
      setShouldPersist(true);
      const now = new Date().toISOString();
      setDirectionInspections((current) =>
        current.map((inspection) =>
          inspection.id === id
            ? {
                ...inspection,
                ...update,
                updatedAt: now,
                updatedBy: user,
                history: [
                  {
                    id: "inspection-history-" + Date.now(),
                    user,
                    date: now,
                    action,
                    detail
                  },
                  ...inspection.history
                ]
              }
            : inspection
        )
      );
    },
    updateDirectionInspectionStatus(id, status, user, detail) {
      setShouldPersist(true);
      const now = new Date().toISOString();
      const nextUpdate: Partial<DirectionInspection> = { status };
      if (status === "Atendida") nextUpdate.attendedAt = now;
      if (status === "Cerrada") nextUpdate.closedAt = now;
      if (status !== "Cerrada") nextUpdate.closedAt = undefined;
      setDirectionInspections((current) =>
        current.map((inspection) =>
          inspection.id === id
            ? {
                ...inspection,
                ...nextUpdate,
                updatedAt: now,
                updatedBy: user,
                history: [
                  {
                    id: "inspection-history-" + Date.now(),
                    user,
                    date: now,
                    action: "Cambio de estado",
                    detail: detail ?? "Estado actualizado a " + status + "."
                  },
                  ...inspection.history
                ]
              }
            : inspection
        )
      );
    },
    addSystemEvent(event) {
      setShouldPersist(true);
      setSystemEvents((current) => [
        {
          id: "event-system-" + Date.now(),
          time: event.time ?? new Date().toTimeString().slice(0, 5),
          title: event.title,
          description: event.description,
          source: "Sistema"
        },
        ...current
      ]);
    },
    clearProductionSessionData
  };

  return <ProjectStoreContext.Provider value={value}>{children}</ProjectStoreContext.Provider>;
}

export function useProjectStore() {
  const context = useContext(ProjectStoreContext);
  if (!context) throw new Error("useProjectStore must be used inside ProjectStoreProvider");
  return context;
}

function stripPhotoImageData(photo: DailyPhoto): DailyPhoto {
  if (!photo.imageData) return photo;
  const { imageData: _imageData, ...metadata } = photo;
  return metadata;
}

function normalizeProject(project: Project): Project {
  const knownProject = projects.find((item) => item.id === project.id);
  return knownProject ? { ...knownProject, ...project, id: knownProject.id } : projects[0];
}

function normalizeProjectId(projectId?: string) {
  return projects.some((item) => item.id === projectId) ? projectId! : ACTIVE_PROJECT_ID;
}

function prioritizeReport(reports: DailyReportEntry[], reportId: string) {
  const report = reports.find((item) => item.id === reportId);
  if (!report) return reports;
  return [report, ...reports.filter((item) => item.id !== reportId)];
}

function getImageWithTimeout(id: string) {
  return Promise.race([
    getImage(id),
    new Promise<string>((resolve) => {
      globalThis.setTimeout(() => {
        resolve("");
      }, IMAGE_READ_TIMEOUT_MS);
    })
  ]);
}

function normalizeRolePermissions(role: AdminRole): AdminRole {
  return {
    ...role,
    permissions: Object.fromEntries(
      permissionModules.map((module) => [
        module,
        {
          ...Object.fromEntries(permissionActions.map((action) => [action, false])),
          ...(role.permissions[module] ?? {})
        }
      ])
    ) as AdminRole["permissions"]
  };
}

function mergeAdminRoles(storedRoles: AdminRole[]) {
  const byId = new Map(storedRoles.map((role) => [role.id, role]));
  initialAdminRoles.forEach((role) => {
    if (!byId.has(role.id)) byId.set(role.id, role);
  });
  return Array.from(byId.values()).map(normalizeRolePermissions);
}

function mergeAdminUsers(storedUsers: AdminUser[]) {
  const byId = new Map(storedUsers.map((user) => [user.id, user]));
  initialAdminUsers.forEach((user) => {
    if (!byId.has(user.id)) byId.set(user.id, user);
  });

  const julianaSeed = initialAdminUsers.find((user) => user.id === "user-juliana-auxiliar");
  if (julianaSeed && byId.has(julianaSeed.id)) {
    byId.set(julianaSeed.id, {
      ...byId.get(julianaSeed.id)!,
      position: julianaSeed.position,
      role: julianaSeed.role
    });
  }

  return Array.from(byId.values());
}
