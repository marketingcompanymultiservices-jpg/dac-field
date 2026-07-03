"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  adminCompany as initialAdminCompany,
  adminRoles as initialAdminRoles,
  adminUsers as initialAdminUsers,
  budgetItems as initialBudgetItems,
  commitmentItems,
  documentItems,
  projects,
  reportItems,
  timelineEvents
} from "@/lib/mock-data";
import { buildProgressFromActivities, calculateProgressSummary } from "@/lib/progress";
import { addDaysISO, getWeekStartISO } from "@/lib/planning";
import { clearImages } from "@/lib/imageStorage";
import { buildProgrammedRows, calculateProgrammedSummary } from "@/lib/programmed-progress";
import { buildSmartAlerts } from "@/lib/alerts";
import { buildActivityProductivity, calculateProductivitySummary } from "@/lib/productivity";
import { clearAppState, loadAppState, saveAppState } from "@/lib/storage";
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
  timeline: TimelineEvent[];
  reports: ProjectReport[];
  planningItems: ActivityPlanning[];
  initialSurvey: InitialSurveyMetadata | null;
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
  updateDailyPhotoDescription: (id: string, description: string) => void;
  updateDailyPhotoDetails: (id: string, details: Pick<DailyPhoto, "description" | "activityId">) => void;
  deleteDailyPhoto: (id: string) => void;
  saveDailyReport: (report: Omit<DailyReportEntry, "id" | "projectId" | "status">, status: DailyReportEntry["status"]) => void;
  addCommitment: (commitment: Commitment) => void;
  updateCommitmentStatus: (id: string, status: CommitmentStatus) => void;
  addDocument: (document: ProjectDocument) => void;
  addReport: (report: ProjectReport) => void;
  deleteDraftReport: (id: string) => void;
  importBudget: (items: BudgetItem[], version: BudgetVersion) => void;
  updateManualProgress: (change: Omit<ManualProgressChange, "id" | "date" | "origin">) => void;
  updateBudgetQuantity: (change: Omit<BudgetQuantityChange, "id" | "date" | "origin">) => void;
  saveInitialSurvey: (items: BudgetItem[], metadata: InitialSurveyMetadata) => void;
  upsertActivityPlanning: (planning: Omit<ActivityPlanning, "status">) => void;
  duplicateWeeklyPlanning: (fromWeekStart: string, toWeekStart: string) => void;
  updateAdminCompany: (company: AdminCompany) => void;
  addAdminUser: (user: Omit<AdminUser, "id" | "createdAt" | "status" | "active">) => void;
  updateAdminUser: (user: AdminUser) => void;
  deleteAdminUser: (id: string) => void;
  updateAdminRole: (role: AdminRole) => void;
  toggleRolePermission: (roleId: string, module: AdminPermissionModule, action: AdminPermissionAction) => void;
  updateAlertStatus: (id: string, status: AlertStatus) => void;
  addSystemEvent: (event: Omit<TimelineEvent, "id" | "time" | "source"> & { time?: string }) => void;
  resetDemoData: () => void;
};

const ProjectStoreContext = createContext<ProjectStoreValue | null>(null);

export function ProjectStoreProvider({ children }: { children: ReactNode }) {
  const [projectBase, setProjectBase] = useState<Project>(projects[0]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReportEntry[]>([]);
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>(commitmentItems);
  const [documents, setDocuments] = useState<ProjectDocument[]>(documentItems);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(initialBudgetItems);
  const [budgetVersion, setBudgetVersion] = useState<BudgetVersion | null>(null);
  const [manualProgressChanges, setManualProgressChanges] = useState<ManualProgressChange[]>([]);
  const [budgetQuantityChanges, setBudgetQuantityChanges] = useState<BudgetQuantityChange[]>([]);
  const [planningItems, setPlanningItems] = useState<ActivityPlanning[]>([]);
  const [initialSurvey, setInitialSurvey] = useState<InitialSurveyMetadata | null>(null);
  const [systemEvents, setSystemEvents] = useState<TimelineEvent[]>([]);
  const [reports, setReports] = useState<ProjectReport[]>(reportItems);
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

    return [...timelineEvents, ...systemEvents, ...activityEvents, ...commitmentEvents, ...photoEvents].sort((a, b) => a.time.localeCompare(b.time));
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

  function saveReport(report: Omit<DailyReportEntry, "id" | "projectId" | "status">, status: DailyReportEntry["status"]) {
    setShouldPersist(true);
    const reportId = "daily-report-" + Date.now();
    setDailyReports((current) => [
      {
        ...report,
        id: reportId,
        projectId: project.id,
        status
      },
      ...current
    ]);
    setPhotos((current) => current.map((photo) => (photo.date === report.date && !photo.reportId && !photo.dailyReportId ? { ...photo, reportId, dailyReportId: reportId } : photo)));
  }

  useEffect(() => {
    const storedState = loadAppState();

    if (storedState) {
      setProjectBase(storedState.project);
      setActivities(storedState.activities);
      setDailyReports(storedState.dailyReports);
      setPhotos(storedState.photos);
      setCommitments(storedState.commitments);
      setDocuments(storedState.documents);
      setBudgetItems(storedState.budgetItems ?? initialBudgetItems);
      setBudgetVersion(storedState.budgetVersion ?? null);
      setManualProgressChanges(storedState.manualProgressChanges ?? []);
      setBudgetQuantityChanges(storedState.budgetQuantityChanges ?? []);
      setPlanningItems((storedState.planningItems ?? []).map((item) => ({ ...item, plannedQuantity: item.plannedQuantity ?? 0, status: "Pendiente" })));
      setInitialSurvey(storedState.initialSurvey ?? null);
      setSystemEvents(storedState.systemEvents ?? []);
      setReports(storedState.reports);
      setAdminCompany(storedState.adminCompany ?? initialAdminCompany);
      setAdminUsers(storedState.adminUsers ?? initialAdminUsers);
      setAdminRoles(storedState.adminRoles ?? initialAdminRoles);
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
    if (!didHydrateRef.current || !isHydrated || !shouldPersist) return;
    const savedAt = new Date().toISOString();
    saveAppState({
      version: 1,
      savedAt,
      project,
      activities,
      dailyReports,
      photos,
      commitments,
      documents,
      budgetItems,
      budgetVersion,
      manualProgressChanges,
      budgetQuantityChanges,
      planningItems,
      initialSurvey,
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
  }, [activities, adminCompany, adminRoles, adminUsers, alertOverrides, budgetItems, budgetQuantityChanges, budgetVersion, commitments, dailyReports, documents, initialSurvey, isHydrated, knownAlertIds, manualProgressChanges, photos, planningItems, progressItems, project, reports, shouldPersist, systemEvents, timeline]);

  function resetDemoData() {
    clearAppState();
    clearImages().catch(() => undefined);
    setProjectBase(projects[0]);
    setActivities([]);
    setDailyReports([]);
    setPhotos([]);
    setCommitments(commitmentItems);
    setDocuments(documentItems);
    setBudgetItems(initialBudgetItems);
    setBudgetVersion(null);
    setManualProgressChanges([]);
    setBudgetQuantityChanges([]);
    setPlanningItems([]);
    setInitialSurvey(null);
    setSystemEvents([]);
    setReports(reportItems);
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
    progressItems,
    planningItems,
    initialSurvey,
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
    currentUser: adminUsers.find((user) => user.email === "jose@doblealtura.com") ?? initialAdminUsers[0],
    addDailyActivity(activity) {
      setShouldPersist(true);
      setActivities((current) => [
        {
          ...activity,
          id: "activity-" + Date.now(),
          projectId: project.id,
          quantity: Number(activity.quantity || 0)
        },
        ...current
      ]);
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
    addReport(report) {
      setShouldPersist(true);
      setReports((current) => [report, ...current]);
    },
    deleteDraftReport(id) {
      setShouldPersist(true);
      setReports((current) => current.filter((report) => report.id !== id || report.status !== "Borrador"));
    },
    importBudget(items, version) {
      setShouldPersist(true);
      setBudgetItems(items);
      setBudgetVersion(version);
      setInitialSurvey(null);
      setActivities([]);
      setPlanningItems([]);
      setManualProgressChanges([]);
      setBudgetQuantityChanges([]);
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
      setBudgetItems((current) =>
        current.map((item) =>
          item.item === change.item
            ? {
                ...item,
                quantity: change.newQuantity,
                totalValue: change.newQuantity * item.unitValue
              }
            : item
        )
      );
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
    saveInitialSurvey(items, metadata) {
      setShouldPersist(true);
      setBudgetItems(items);
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
          status: "Activo",
          active: true
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
    resetDemoData
  };

  return <ProjectStoreContext.Provider value={value}>{children}</ProjectStoreContext.Provider>;
}

export function useProjectStore() {
  const context = useContext(ProjectStoreContext);
  if (!context) throw new Error("useProjectStore must be used inside ProjectStoreProvider");
  return context;
}
