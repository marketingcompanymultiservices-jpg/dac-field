export type ProjectStatus = "En ejecucion" | "Planeacion" | "Finalizada" | "Suspendida";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  director: string;
  resident: string;
  auditor: string;
  technicalSupervisor: string;
  address: string;
  city: string;
  startDate: string;
  contractualEndDate: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  tone?: "primary" | "secondary" | "alert";
};

export type TimelineEvent = {
  id?: string;
  time: string;
  title: string;
  description: string;
  source?: "Sistema" | "Registro Diario" | "Compromiso" | "Fotografia";
};

export type AlertType =
  | "Actividad atrasada"
  | "Compromiso vencido"
  | "Registro diario faltante"
  | "Registro sin fotografias"
  | "Actividad sin movimiento"
  | "Actividad con baja productividad"
  | "Planificacion vencida"
  | "Documento pendiente"
  | "Observacion de interventoria pendiente";

export type AlertPriority = "Critica" | "Alta" | "Media" | "Baja";

export type AlertStatus = "Nueva" | "En proceso" | "Atendida" | "Cerrada";

export type SmartAlert = {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  date: string;
  projectId: string;
  projectName: string;
  activityId?: string;
  activityName?: string;
  responsible: string;
  status: AlertStatus;
  recommendedAction: string;
  detail: string;
  href?: string;
};

export type AlertOverride = {
  id: string;
  status: AlertStatus;
  updatedAt: string;
};

export type ProgressStatus = "Finalizado" | "En ejecucion" | "Sin iniciar";

export type PlanningStatus = "Pendiente" | "En ejecucion" | "Finalizada" | "Atrasada";

export type PlanningPriority = "Baja" | "Media" | "Alta";

export type BudgetProgressItem = {
  item: string;
  description: string;
  unit: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  progress: number;
  executedQuantity?: number;
  pendingQuantity?: number;
};

export type ManualProgressChange = {
  id: string;
  activityId: string;
  item: string;
  description: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  user: string;
  date: string;
  observation: string;
  origin: "Edición manual de avance";
};

export type BudgetQuantityChange = {
  id: string;
  activityId: string;
  item: string;
  description: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  user: string;
  date: string;
  observation: string;
  origin: "Correccion manual de cantidad presupuestada";
};

export type BudgetItem = {
  id?: string;
  item: string;
  importOrder?: number;
  description: string;
  unit: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  chapter: string;
  subchapter: string;
  initialProgress?: number;
  executedQuantity?: number;
};

export type BudgetVersion = {
  versionNumber: number;
  importedAt: string;
  importedBy: string;
  fileName: string;
  totalActivities: number;
  totalBudgetValue: number;
};

export type InitialSurveyMetadata = {
  savedAt: string;
  savedBy: string;
  totalActivities: number;
  executedValue: number;
  pendingValue: number;
  initialProgress: number;
};

export type ActivityPlanning = {
  id?: string;
  budgetItemId: string;
  plannedQuantity: number;
  startDate: string;
  endDate: string;
  owner: string;
  priority: PlanningPriority;
  status: PlanningStatus;
  createdAt?: string;
};

export type DailyActivity = {
  id: string;
  projectId: string;
  budgetItemId?: string;
  activity: string;
  unit: string;
  quantity: number;
  observation: string;
  workFront?: string;
  owner?: string;
  startTime?: string;
  endTime?: string;
  photoCount?: number;
  date: string;
  time: string;
  createdBy?: string;
  updatedBy?: string;
};

export type DailyPhoto = {
  id: string;
  projectId: string;
  name: string;
  date: string;
  time: string;
  user: string;
  description?: string;
  activityId?: string;
  reportId?: string;
  dailyReportId?: string;
  inspectionId?: string;
  inspectionPhotoType?: "observacion" | "correccion";
  type?: string;
  size?: number;
  storage?: "indexedDB" | "localStorage";
};

export type DailyReportEntry = {
  id: string;
  projectId: string;
  date: string;
  time: string;
  weather: string;
  administrativeStaff?: string;
  operativeStaff?: string;
  contractors?: string;
  equipment?: string;
  material?: string;
  observations: string;
  problems: string;
  actions: string;
  signature: string;
  status: "Borrador" | "Enviado";
  createdBy?: string;
  updatedBy?: string;
};

export type CommitmentPriority = "Baja" | "Media" | "Alta" | "Critica";

export type CommitmentStatus = "Pendiente" | "En proceso" | "Vencido" | "Cumplido";

export type Commitment = {
  id: string;
  description: string;
  owner: string;
  dueDate: string;
  priority: CommitmentPriority;
  status: CommitmentStatus;
  origin: string;
  createdAt?: string;
  projectId?: string;
  budgetItemId?: string;
  createdBy?: string;
  updatedBy?: string;
};

export type DocumentStatus = "Vigente" | "Proxima a vencer" | "Reemplazado" | "Archivado";

export type ProjectDocument = {
  id: string;
  projectId?: string;
  name: string;
  folder: string;
  version: number;
  status: DocumentStatus;
  uploadDate: string;
  expirationDate?: string;
  user: string;
  observation: string;
  simulatedFile?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  storagePath?: string;
  publicUrl?: string;
  uploadedBy?: string;
};

export type ReportType =
  | "Reporte Diario de Obra"
  | "Reporte Semanal"
  | "Reporte Mensual"
  | "Reporte Fotografico"
  | "Reporte de Avance"
  | "Reporte de Compromisos"
  | "Reporte Programado vs Ejecutado"
  | "Reporte de Productividad"
  | "Reporte Documental"
  | "Bitacora General";

export type ReportStatus = "Generado" | "Borrador";

export type ProjectReport = {
  id: string;
  name: string;
  type: ReportType;
  generationDate: string;
  generatedBy: string;
  status: ReportStatus;
  format?: "PDF" | "Excel";
  includesPhotos?: boolean;
  includesCommitments?: boolean;
  includesInterventionNotes?: boolean;
  summary?: string;
};

export type AdminCompany = {
  id: string;
  name: string;
  nit: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  logoUrl: string;
  futureSubdomain: string;
};

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  role: string;
  status: "Activo" | "Inactivo";
  phone: string;
  company: string;
  createdAt: string;
  active: boolean;
  photoUrl?: string;
  mustChangePassword?: boolean;
};

export type AdminPermissionAction = "Ver" | "Crear" | "Editar" | "Eliminar" | "Exportar" | "Imprimir" | "Administrar";

export type AdminPermissionModule =
  | "Dashboard"
  | "Registro Diario"
  | "Bitacora"
  | "Avance"
  | "Presupuesto"
  | "Reportes"
  | "Documentos"
  | "Compromisos"
  | "Levantamiento Inicial"
  | "Inspecciones de Direccion"
  | "Administracion";

export type AdminPermissionMatrix = Record<AdminPermissionModule, Record<AdminPermissionAction, boolean>>;

export type AdminRole = {
  id: string;
  name: string;
  description: string;
  permissions: AdminPermissionMatrix;
};

export type DirectionInspectionStatus = "Pendiente" | "En proceso" | "Atendida" | "Cerrada";

export type DirectionInspectionPriority = "Baja" | "Media" | "Alta" | "Critica";

export type DirectionInspectionCategory =
  | "Estructural"
  | "Arquitectonica"
  | "Calidad"
  | "Seguridad y Salud en el Trabajo"
  | "Programacion"
  | "Materiales"
  | "Equipos"
  | "Ambiental"
  | "Administrativa"
  | "Otra";

export type DirectionInspectionHistory = {
  id: string;
  user: string;
  date: string;
  action: string;
  detail: string;
};

export type DirectionInspection = {
  id: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  createdBy: string;
  director: string;
  responsible: string;
  status: DirectionInspectionStatus;
  tower: string;
  floor: string;
  apartment?: string;
  workFront: string;
  category: DirectionInspectionCategory;
  priority: DirectionInspectionPriority;
  description: string;
  dueDate: string;
  commitmentNotes: string;
  observationPhotoIds: string[];
  response?: string;
  attendedAt?: string;
  correctionPhotoIds: string[];
  closedAt?: string;
  updatedAt: string;
  updatedBy: string;
  history: DirectionInspectionHistory[];
};
