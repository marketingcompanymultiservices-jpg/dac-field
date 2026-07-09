import type {
  AdminCompany,
  AdminPermissionAction,
  AdminPermissionMatrix,
  AdminPermissionModule,
  AdminRole,
  AdminUser,
  BudgetItem,
  Commitment,
  Project,
  ProjectDocument,
  ProjectReport,
  ReportType
} from "@/types";

export const permissionModules: AdminPermissionModule[] = [
  "Dashboard",
  "Registro Diario",
  "Avance",
  "Presupuesto",
  "Reportes",
  "Documentos",
  "Compromisos",
  "Levantamiento Inicial",
  "Inspecciones de Direccion",
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

function buildDocumentManagementPermissionMatrix(): AdminPermissionMatrix {
  const matrix = buildPermissionMatrix([]);
  matrix.Dashboard.Ver = true;
  matrix.Documentos.Ver = true;
  matrix.Documentos.Crear = true;
  matrix.Documentos.Editar = true;
  matrix.Documentos.Exportar = true;
  matrix.Documentos.Imprimir = true;
  matrix.Reportes.Ver = true;
  matrix.Reportes.Exportar = true;
  matrix.Reportes.Imprimir = true;
  matrix.Presupuesto.Ver = true;
  matrix["Registro Diario"].Ver = true;
  matrix["Inspecciones de Direccion"].Ver = true;
  return matrix;
}

function buildResidentPermissionMatrix(): AdminPermissionMatrix {
  const matrix = buildPermissionMatrix([]);
  matrix.Dashboard.Ver = true;
  matrix["Registro Diario"].Ver = true;
  matrix["Registro Diario"].Crear = true;
  matrix["Registro Diario"].Editar = true;
  matrix.Avance.Ver = true;
  matrix.Avance.Crear = true;
  matrix.Avance.Editar = true;
  matrix.Presupuesto.Ver = true;
  matrix.Presupuesto.Editar = true;
  matrix.Documentos.Ver = true;
  matrix.Documentos.Crear = true;
  matrix["Levantamiento Inicial"].Ver = true;
  matrix["Inspecciones de Direccion"].Ver = true;
  matrix["Inspecciones de Direccion"].Editar = true;
  return matrix;
}

export const adminCompany: AdminCompany = {
  id: "doble-altura-construcciones",
  name: "Doble Altura Construcciones S.A.S.",
  nit: "",
  address: "",
  city: "",
  email: "",
  phone: "",
  logoUrl: "/branding/logo.png",
  futureSubdomain: "control.doblealturaconstrucciones.com.co"
};

export const adminUsers: AdminUser[] = [];

export const currentUserFallback: AdminUser = {
  id: "authenticated-user",
  firstName: "Usuario",
  lastName: "DAC",
  email: "",
  position: "Consulta",
  role: "Consulta",
  status: "Activo",
  phone: "",
  company: "Doble Altura Construcciones S.A.S.",
  createdAt: "",
  active: true
};

export const adminRoles: AdminRole[] = [
  { id: "role-admin", name: "Administrador", description: "Control total de la plataforma y configuracion.", permissions: buildPermissionMatrix(permissionActions) },
  { id: "role-director-administrativo", name: "Director Administrativo", description: "Gestion integral administrativa, reportes, seguimiento directivo y control de usuarios.", permissions: buildPermissionMatrix(["Ver", "Crear", "Editar", "Exportar", "Imprimir"]) },
  { id: "role-residente-obra", name: "Residente de Obra", description: "Registro Diario, fotografias, avances y consulta del presupuesto sin administracion de usuarios ni configuracion.", permissions: buildResidentPermissionMatrix() },
  { id: "role-interventoria", name: "Interventoria", description: "Consulta, observaciones y seguimiento documental.", permissions: buildPermissionMatrix(["Ver", "Crear", "Exportar"]) },
  { id: "role-supervisor", name: "Supervisor Tecnico", description: "Revision tecnica de avance, presupuesto y actividades.", permissions: buildPermissionMatrix(["Ver", "Editar"]) },
  { id: "role-gestion-documental", name: "Gestion Documental", description: "Gestion documental del expediente de obra: carga, clasificacion, descarga, impresion y exportacion sin modificar informacion tecnica o financiera critica.", permissions: buildDocumentManagementPermissionMatrix() },
  { id: "role-auxiliar-administrativa", name: "Auxiliar Administrativa", description: "Puede ver informacion, descargar informes, imprimir reportes y exportar documentos. No puede eliminar, modificar presupuestos, crear obras, aprobar compras, cambiar usuarios ni configuracion.", permissions: buildAuxiliaryPermissionMatrix() },
  { id: "role-consulta", name: "Consulta", description: "Acceso de lectura para seguimiento sin modificacion.", permissions: buildPermissionMatrix(["Ver"]) }
];

export const projects: Project[] = [
  {
    id: "quintas-de-acuarela",
    name: "Quintas de Acuarela",
    status: "En ejecucion",
    progress: 0,
    director: "",
    resident: "",
    auditor: "",
    technicalSupervisor: "",
    address: "Calle 4 Sur 80AA-60",
    city: "Medellin",
    startDate: "",
    contractualEndDate: ""
  }
];

export const budgetItems: BudgetItem[] = [];
export const commitmentItems: Commitment[] = [];

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

export const documentItems: ProjectDocument[] = [];

export const reportTypes: ReportType[] = [
  "Reporte Diario de Obra",
  "Reporte Semanal",
  "Reporte Mensual",
  "Reporte Fotografico",
  "Reporte de Avance",
  "Reporte de Compromisos",
  "Reporte Programado vs Ejecutado",
  "Reporte de Productividad",
  "Reporte Documental"
];

export const reportItems: ProjectReport[] = [];
