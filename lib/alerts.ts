import { getPlanningExecution, getPlanningStatus, getTodayISO } from "@/lib/planning";
import type {
  ActivityPlanning,
  AlertOverride,
  AlertPriority,
  Commitment,
  DailyActivity,
  DailyPhoto,
  DailyReportEntry,
  Project,
  ProjectDocument,
  SmartAlert,
  BudgetItem,
  DirectionInspection
} from "@/types";

type BuildAlertInput = {
  project: Project;
  budgetItems: BudgetItem[];
  planningItems: ActivityPlanning[];
  activities: DailyActivity[];
  dailyReports: DailyReportEntry[];
  photos: DailyPhoto[];
  commitments: Commitment[];
  documents: ProjectDocument[];
  directionInspections: DirectionInspection[];
  overrides: AlertOverride[];
};

const movementThresholdDays = 2;
const lowProductivityThresholdDays = 3;

export function buildSmartAlerts({
  project,
  budgetItems,
  planningItems,
  activities,
  dailyReports,
  photos,
  commitments,
  documents,
  directionInspections,
  overrides
}: BuildAlertInput): SmartAlert[] {
  const today = getTodayISO();
  const budgetByItem = new Map(budgetItems.map((item) => [item.item, item]));
  const overrideById = new Map(overrides.map((item) => [item.id, item.status]));
  const alerts: SmartAlert[] = [];

  planningItems.forEach((planning) => {
    const budget = budgetByItem.get(planning.budgetItemId);
    const executed = getPlanningExecution(planning, activities);
    const status = getPlanningStatus(planning, executed, today);

    if (status === "Atrasada") {
      alerts.push(withStatus({
        id: "planning-overdue-" + planning.budgetItemId + "-" + planning.endDate,
        type: "Planificacion vencida",
        priority: "Alta",
        date: planning.endDate,
        projectId: project.id,
        projectName: project.name,
        activityId: planning.budgetItemId,
        activityName: budget?.description,
        responsible: planning.owner,
        recommendedAction: "Reprogramar la actividad o registrar el avance pendiente en Registro Diario.",
        detail: "La actividad programada vencio sin completar la cantidad planificada.",
        href: "/projects/" + project.id + "/activities/" + encodeURIComponent(planning.budgetItemId)
      }, overrideById));
    }

    const planningActivityRecords = activities
      .filter((activity) => activity.budgetItemId === planning.budgetItemId && activity.date >= planning.startDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    const lastMovementDate = planningActivityRecords[0]?.date ?? planning.startDate;
    if (planning.startDate <= today && status !== "Finalizada" && daysBetween(lastMovementDate, today) > lowProductivityThresholdDays) {
      alerts.push(withStatus({
        id: "low-productivity-" + planning.budgetItemId + "-" + planning.startDate,
        type: "Actividad con baja productividad",
        priority: "Media",
        date: today,
        projectId: project.id,
        projectName: project.name,
        activityId: planning.budgetItemId,
        activityName: budget?.description,
        responsible: planning.owner,
        recommendedAction: "Revisar cuadrilla, restricciones y registrar avance o reprogramacion.",
        detail: "Actividad programada sin avance reciente en mas de " + lowProductivityThresholdDays + " dias.",
        href: "/projects/" + project.id + "/activities/" + encodeURIComponent(planning.budgetItemId)
      }, overrideById));
    }
  });

  commitments
    .filter((commitment) => commitment.status !== "Cumplido" && (commitment.status === "Vencido" || commitment.dueDate < today))
    .forEach((commitment) => {
      alerts.push(withStatus({
        id: "commitment-overdue-" + commitment.id,
        type: "Compromiso vencido",
        priority: commitment.priority === "Critica" ? "Critica" : "Alta",
        date: commitment.dueDate,
        projectId: project.id,
        projectName: project.name,
        activityId: commitment.budgetItemId,
        activityName: commitment.budgetItemId ? budgetByItem.get(commitment.budgetItemId)?.description : undefined,
        responsible: commitment.owner || "Sin responsable",
        recommendedAction: "Actualizar responsable, nueva fecha o marcar cumplimiento con evidencia.",
        detail: commitment.description,
        href: commitment.budgetItemId ? "/projects/" + project.id + "/activities/" + encodeURIComponent(commitment.budgetItemId) : "/projects/" + project.id + "/commitments"
      }, overrideById));
    });

  const lastReportDate = dailyReports.map((report) => report.date).sort().at(-1);
  if (!lastReportDate || daysBetween(lastReportDate, today) > 2) {
    alerts.push(withStatus({
      id: "daily-report-missing-" + today,
      type: "Registro diario faltante",
      priority: "Critica",
      date: today,
      projectId: project.id,
      projectName: project.name,
      responsible: project.resident,
      recommendedAction: "Crear y enviar el Registro Diario pendiente.",
      detail: lastReportDate ? "Han pasado mas de 2 dias desde el ultimo Registro Diario." : "No hay Registro Diario guardado.",
      href: "/projects/" + project.id + "/daily-report"
    }, overrideById));
  }

  budgetItems.forEach((budgetItem) => {
    const itemActivities = activities.filter((activity) => activity.budgetItemId === budgetItem.item).sort((a, b) => b.date.localeCompare(a.date));
    if (itemActivities.length === 0) return;
    const lastActivity = itemActivities[0];
    if (daysBetween(lastActivity.date, today) > movementThresholdDays) {
      alerts.push(withStatus({
        id: "activity-no-movement-" + budgetItem.item,
        type: "Actividad sin movimiento",
        priority: "Media",
        date: today,
        projectId: project.id,
        projectName: project.name,
        activityId: budgetItem.item,
        activityName: budgetItem.description,
        responsible: lastActivity.owner || project.resident,
        recommendedAction: "Validar si la actividad continua detenida o registrar avance actualizado.",
        detail: "La actividad no registra movimiento en mas de " + movementThresholdDays + " dias.",
        href: "/projects/" + project.id + "/activities/" + encodeURIComponent(budgetItem.item)
      }, overrideById));
    }
  });

  documents
    .filter((document) => document.status === "Proxima a vencer")
    .forEach((document) => {
      alerts.push(withStatus({
        id: "document-pending-" + document.id,
        type: "Documento pendiente",
        priority: "Media",
        date: document.expirationDate ?? document.uploadDate,
        projectId: project.id,
        projectName: project.name,
        responsible: document.user,
        recommendedAction: "Revisar vigencia, reemplazar o archivar el documento.",
        detail: document.name + ": " + document.observation,
        href: "/projects/" + project.id + "/documents"
      }, overrideById));
    });

  directionInspections
    .filter((inspection) => inspection.projectId === project.id && (inspection.status === "Pendiente" || inspection.status === "En proceso") && inspection.dueDate)
    .forEach((inspection) => {
      const daysToDue = daysBetween(today, inspection.dueDate);
      if (daysToDue > 2) return;

      const isOverdue = daysToDue < 0;
      alerts.push(withStatus({
        id: (isOverdue ? "direction-inspection-overdue-" : "direction-inspection-due-soon-") + inspection.id,
        type: isOverdue ? "Inspeccion vencida" : "Inspeccion proxima a vencer",
        priority: isOverdue ? (inspection.priority === "Critica" ? "Critica" : "Alta") : "Media",
        date: inspection.dueDate,
        projectId: project.id,
        projectName: project.name,
        responsible: inspection.responsible,
        recommendedAction: isOverdue ? "Atender la inspeccion vencida y registrar seguimiento." : "Revisar la inspeccion proxima a vencer y coordinar respuesta.",
        detail: inspection.description,
        href: "/projects/" + project.id + "/direction-inspections"
      }, overrideById));
    });

  commitments
    .filter((commitment) => commitment.origin.toLowerCase().includes("intervent") && commitment.status !== "Cumplido")
    .forEach((commitment) => {
      alerts.push(withStatus({
        id: "intervention-observation-" + commitment.id,
        type: "Observacion de interventoria pendiente",
        priority: "Alta",
        date: commitment.dueDate,
        projectId: project.id,
        projectName: project.name,
        activityId: commitment.budgetItemId,
        activityName: commitment.budgetItemId ? budgetByItem.get(commitment.budgetItemId)?.description : undefined,
        responsible: commitment.owner,
        recommendedAction: "Responder la observacion de interventoria y adjuntar soporte.",
        detail: commitment.description,
        href: "/projects/" + project.id + "/commitments"
      }, overrideById));
    });

  return dedupeAlerts(alerts).sort(compareAlerts);
}

function withStatus(alert: Omit<SmartAlert, "status">, overrides: Map<string, SmartAlert["status"]>): SmartAlert {
  return { ...alert, status: overrides.get(alert.id) ?? "Nueva" };
}

function dedupeAlerts(alerts: SmartAlert[]) {
  return Array.from(new Map(alerts.map((alert) => [alert.id, alert])).values());
}

function compareAlerts(a: SmartAlert, b: SmartAlert) {
  const priorityWeight: Record<AlertPriority, number> = { Critica: 0, Alta: 1, Media: 2, Baja: 3 };
  return priorityWeight[a.priority] - priorityWeight[b.priority] || b.date.localeCompare(a.date);
}

function daysBetween(fromDate: string, toDate: string) {
  const from = new Date(fromDate + "T00:00:00").getTime();
  const to = new Date(toDate + "T00:00:00").getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.floor((to - from) / 86400000);
}
