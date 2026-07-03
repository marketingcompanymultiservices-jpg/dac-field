import type {
  AdminCompany,
  AdminPermissionAction,
  AdminPermissionMatrix,
  AdminPermissionModule,
  AdminRole,
  AdminUser,
  BudgetItem,
  Commitment,
  DashboardMetric,
  Project,
  ProjectDocument,
  ProjectReport,
  ReportType,
  TimelineEvent
} from "@/types";

export const permissionModules: AdminPermissionModule[] = [
  "Dashboard",
  "Registro Diario",
  "Bitacora",
  "Avance",
  "Presupuesto",
  "Reportes",
  "Documentos",
  "Compromisos",
  "Levantamiento Inicial",
  "Administracion"
];

export const permissionActions: AdminPermissionAction[] = ["Ver", "Crear", "Editar", "Eliminar", "Exportar", "Imprimir", "Administrar"];

function buildPermissionMatrix(enabledActions: AdminPermissionAction[] = ["Ver"]): AdminPermissionMatrix {
  return Object.fromEntries(
    permissionModules.map((module) => [
      module,
      Object.fromEntries(permissionActions.map((action) => [action, enabledActions.includes(action)]))
    ])
  ) as AdminPermissionMatrix;
}

function buildAuxiliaryPermissionMatrix(): AdminPermissionMatrix {
  const matrix = buildPermissionMatrix(["Ver"]);
  matrix.Reportes.Exportar = true;
  matrix.Reportes.Imprimir = true;
  matrix.Documentos.Exportar = true;
  matrix.Documentos.Imprimir = true;
  return matrix;
}

export const adminCompany: AdminCompany = {
  id: "doble-altura-construcciones",
  name: "Doble Altura Construcciones S.A.S.",
  nit: "901.000.000-1",
  address: "Calle 4 Sur 80AA-60",
  city: "Medellin",
  email: "administracion@doblealtura.com",
  phone: "+57 300 000 0000",
  logoUrl: "/branding/logo.png",
  futureSubdomain: "control.doblealturaconstrucciones.com.co"
};

export const adminUsers: AdminUser[] = [
  {
    id: "user-jose-martinez",
    firstName: "Jose",
    lastName: "Martinez",
    email: "jose@doblealtura.com",
    position: "Director Administrativo",
    role: "Director Administrativo",
    status: "Activo",
    phone: "+57 300 111 2233",
    company: "Doble Altura Construcciones S.A.S.",
    createdAt: "2026-07-01",
    active: true
  },
  {
    id: "user-hernan-aristizabal",
    firstName: "Hernan",
    lastName: "Aristizabal",
    email: "hernan@doblealtura.com",
    position: "Residente de Obra",
    role: "Residente de Obra",
    status: "Activo",
    phone: "+57 300 222 3344",
    company: "Doble Altura Construcciones S.A.S.",
    createdAt: "2026-07-01",
    active: true
  },
  {
    id: "user-oscar-ospina",
    firstName: "Oscar",
    lastName: "Ospina",
    email: "oscar@doblealtura.com",
    position: "Interventoria",
    role: "Interventoria",
    status: "Activo",
    phone: "+57 300 333 4455",
    company: "Doble Altura Construcciones S.A.S.",
    createdAt: "2026-07-01",
    active: true
  },
  {
    id: "user-oliver-mora",
    firstName: "Oliver",
    lastName: "Mora",
    email: "oliver@doblealtura.com",
    position: "Supervisor Tecnico",
    role: "Supervisor Tecnico",
    status: "Activo",
    phone: "+57 300 444 5566",
    company: "Doble Altura Construcciones S.A.S.",
    createdAt: "2026-07-01",
    active: true
  },
  {
    id: "user-juliana-auxiliar",
    firstName: "Juliana",
    lastName: "",
    email: "juliana@doblealtura.com",
    position: "Auxiliar Administrativa",
    role: "Auxiliar Administrativa",
    status: "Activo",
    phone: "+57 300 555 6677",
    company: "Doble Altura Construcciones S.A.S.",
    createdAt: "2026-07-02",
    active: true
  }
];

export const adminRoles: AdminRole[] = [
  { id: "role-admin", name: "Administrador", description: "Control total de la plataforma y configuracion.", permissions: buildPermissionMatrix(permissionActions) },
  { id: "role-director-administrativo", name: "Director Administrativo", description: "Gestion integral administrativa, reportes, seguimiento directivo y control de usuarios.", permissions: buildPermissionMatrix(["Ver", "Crear", "Editar", "Exportar", "Imprimir"]) },
  { id: "role-residente-obra", name: "Residente de Obra", description: "Registro diario, bitacora, fotografias y compromisos operativos.", permissions: buildPermissionMatrix(["Ver", "Crear", "Editar", "Imprimir"]) },
  { id: "role-interventoria", name: "Interventoria", description: "Consulta, observaciones y seguimiento documental.", permissions: buildPermissionMatrix(["Ver", "Crear", "Exportar"]) },
  { id: "role-supervisor", name: "Supervisor Tecnico", description: "Revision tecnica de avance, presupuesto y actividades.", permissions: buildPermissionMatrix(["Ver", "Editar"]) },
  { id: "role-auxiliar-administrativa", name: "Auxiliar Administrativa", description: "Puede ver informacion, descargar informes, imprimir reportes y exportar documentos. No puede eliminar, modificar presupuestos, crear obras, aprobar compras, cambiar usuarios ni configuracion.", permissions: buildAuxiliaryPermissionMatrix() },
  { id: "role-consulta", name: "Consulta", description: "Acceso de lectura para seguimiento sin modificacion.", permissions: buildPermissionMatrix(["Ver"]) }
];

export const testUser = {
  name: "Jose Martinez",
  role: "Director / Administrador",
  email: "jose@doblealtura.com",
  password: "admin123"
};

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Obras activas", value: "1", tone: "primary" },
  { label: "Avance promedio", value: "0 %", tone: "secondary" },
  { label: "Registros pendientes", value: "0", tone: "alert" },
  { label: "Alertas criticas", value: "1", tone: "alert" },
  { label: "Compromisos vencidos", value: "1", tone: "alert" },
  { label: "Fotos de hoy", value: "0", tone: "secondary" }
];

export const projects: Project[] = [
  {
    id: "quintas-de-acuarela",
    name: "Quintas de Acuarela",
    status: "En ejecucion",
    progress: 0,
    director: "Jose Martinez",
    resident: "Hernan Aristizabal",
    auditor: "Oscar Ospina",
    technicalSupervisor: "Oliver Mora",
    address: "Calle 4 Sur 80AA-60",
    city: "Medellin",
    startDate: "30/04/2025",
    contractualEndDate: "30/12/2026"
  }
];

export const timelineEvents: TimelineEvent[] = [
  { id: "seed-1", time: "07:00", title: "Inicio de jornada", description: "Revision de frente de obra y asignacion de cuadrillas.", source: "Sistema" },
  { id: "seed-2", time: "17:00", title: "Cierre de jornada", description: "Validacion de compromisos y limpieza de areas intervenidas.", source: "Sistema" }
];

export const budgetItems: BudgetItem[] = [
  {
    item: "1.01",
    description: "Preliminares",
    unit: "und",
    quantity: 1,
    unitValue: 5000000,
    totalValue: 5000000,
    chapter: "Capitulo 1 - Preliminares",
    subchapter: "Instalacion y alistamiento"
  },
  {
    item: "2.01",
    description: "Excavacion manual",
    unit: "m3",
    quantity: 120,
    unitValue: 85000,
    totalValue: 10200000,
    chapter: "Capitulo 2 - Movimiento de tierra",
    subchapter: "Excavaciones"
  },
  {
    item: "3.01",
    description: "Concreto estructural",
    unit: "m3",
    quantity: 250,
    unitValue: 720000,
    totalValue: 180000000,
    chapter: "Capitulo 3 - Estructura",
    subchapter: "Concretos"
  },
  {
    item: "4.01",
    description: "Acero de refuerzo",
    unit: "kg",
    quantity: 18000,
    unitValue: 6800,
    totalValue: 122400000,
    chapter: "Capitulo 3 - Estructura",
    subchapter: "Aceros"
  },
  {
    item: "5.01",
    description: "Mamposteria",
    unit: "m2",
    quantity: 3250,
    unitValue: 78000,
    totalValue: 253500000,
    chapter: "Capitulo 4 - Mamposteria y acabados",
    subchapter: "Mamposteria"
  },
  {
    item: "6.01",
    description: "Redes hidrosanitarias",
    unit: "ml",
    quantity: 1200,
    unitValue: 45000,
    totalValue: 54000000,
    chapter: "Capitulo 5 - Instalaciones",
    subchapter: "Hidrosanitarias"
  },
  {
    item: "7.01",
    description: "Redes electricas",
    unit: "ml",
    quantity: 1500,
    unitValue: 38000,
    totalValue: 57000000,
    chapter: "Capitulo 5 - Instalaciones",
    subchapter: "Electricas"
  },
  {
    item: "8.01",
    description: "Revoques",
    unit: "m2",
    quantity: 2800,
    unitValue: 32000,
    totalValue: 89600000,
    chapter: "Capitulo 4 - Mamposteria y acabados",
    subchapter: "Revoques"
  },
  {
    item: "9.01",
    description: "Pisos",
    unit: "m2",
    quantity: 1900,
    unitValue: 95000,
    totalValue: 180500000,
    chapter: "Capitulo 4 - Mamposteria y acabados",
    subchapter: "Pisos"
  },
  {
    item: "10.01",
    description: "Pintura",
    unit: "m2",
    quantity: 4000,
    unitValue: 18000,
    totalValue: 72000000,
    chapter: "Capitulo 4 - Mamposteria y acabados",
    subchapter: "Pintura"
  }
];

export const commitmentItems: Commitment[] = [
  {
    id: "commitment-1",
    description: "Revisar fisura en muro eje C, Torre 3, piso 5.",
    owner: "Hernan Aristizabal",
    dueDate: "2026-07-02",
    priority: "Alta",
    status: "Pendiente",
    origin: "Observacion Director"
  },
  {
    id: "commitment-2",
    description: "Adjuntar ensayo de asentamiento del concreto.",
    owner: "Oscar Ospina",
    dueDate: "2026-07-01",
    priority: "Critica",
    status: "Vencido",
    origin: "Interventoria"
  },
  {
    id: "commitment-3",
    description: "Verificar curado de placa durante tres dias.",
    owner: "Hernan Aristizabal",
    dueDate: "2026-07-03",
    priority: "Media",
    status: "En proceso",
    origin: "Registro Diario"
  }
];

export const documentFolders = [
  "Contratos",
  "Presupuesto",
  "Planos",
  "Actas",
  "Licencias",
  "Polizas",
  "Ensayos de laboratorio",
  "Correspondencia",
  "Disenos y modificaciones",
  "Informes",
  "Seguridad y salud en el trabajo",
  "Registro fotografico",
  "Documentos juridicos",
  "Entregas y recibos"
];

export const documentItems: ProjectDocument[] = [
  {
    id: "document-1",
    name: "Presupuesto Torre 3 - version inicial",
    folder: "Presupuesto",
    version: 1,
    status: "Vigente",
    uploadDate: "2026-06-30",
    user: "Jose Martinez",
    observation: "Presupuesto base cargado para control de avance.",
    simulatedFile: "presupuesto-torre-3-v1.xlsx"
  },
  {
    id: "document-2",
    name: "Licencia de construccion",
    folder: "Licencias",
    version: 1,
    status: "Vigente",
    uploadDate: "2026-06-15",
    user: "Jose Martinez",
    observation: "Documento soporte del proyecto.",
    simulatedFile: "licencia-construccion.pdf"
  },
  {
    id: "document-3",
    name: "Poliza de cumplimiento",
    folder: "Polizas",
    version: 1,
    status: "Proxima a vencer",
    uploadDate: "2026-06-10",
    expirationDate: "2026-07-15",
    user: "Jose Martinez",
    observation: "Requiere seguimiento.",
    simulatedFile: "poliza-cumplimiento.pdf"
  }
];

export const reportTypes: ReportType[] = [
  "Reporte Diario de Obra",
  "Reporte Semanal",
  "Reporte Mensual",
  "Reporte Fotografico",
  "Reporte de Avance",
  "Reporte de Compromisos",
  "Reporte Programado vs Ejecutado",
  "Reporte de Productividad",
  "Reporte Documental",
  "Bitacora General"
];

export const reportItems: ProjectReport[] = [
  {
    id: "report-1",
    name: "Reporte Diario - base",
    type: "Reporte Diario de Obra",
    generationDate: "2026-06-30",
    generatedBy: "Hernan Aristizabal",
    status: "Borrador",
    format: "PDF",
    includesPhotos: true,
    includesCommitments: true,
    includesInterventionNotes: false,
    summary: "Reporte base en memoria. La vista previa se alimenta del Registro Diario."
  }
];
