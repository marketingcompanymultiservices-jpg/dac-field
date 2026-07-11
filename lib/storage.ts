import type {
  ActivityPlanning,
  AdminCompany,
  AdminRole,
  AdminUser,
  AlertOverride,
  BudgetItem,
  BudgetQuantityChange,
  BudgetVersion,
  BudgetProgressItem,
  Commitment,
  DailyActivity,
  DailyPhoto,
  DailyReportEntry,
  DirectionInspection,
  Project,
  ProjectDocument,
  ProjectReport,
  InitialSurveyItem,
  InitialSurveyMetadata,
  ManualProgressChange,
  TimelineEvent
} from "@/types";

const STORAGE_KEY = "dac-project-store-v2-1";

export type PersistedAppState = {
  version: 1;
  savedAt: string;
  project: Project;
  activities: DailyActivity[];
  dailyReports: DailyReportEntry[];
  photos: DailyPhoto[];
  commitments: Commitment[];
  documents: ProjectDocument[];
  reports: ProjectReport[];
  timeline: TimelineEvent[];
  progressItems: BudgetProgressItem[];
  budgetItems?: BudgetItem[];
  budgetVersion?: BudgetVersion | null;
  planningItems?: ActivityPlanning[];
  initialSurvey?: InitialSurveyMetadata | null;
  initialSurveyItems?: InitialSurveyItem[];
  systemEvents?: TimelineEvent[];
  adminCompany?: AdminCompany;
  adminUsers?: AdminUser[];
  adminRoles?: AdminRole[];
  alertOverrides?: AlertOverride[];
  knownAlertIds?: string[];
  manualProgressChanges?: ManualProgressChange[];
  budgetQuantityChanges?: BudgetQuantityChange[];
  directionInspections?: DirectionInspection[];
};

export function saveAppState(state: PersistedAppState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("[DAC Storage] No fue posible persistir estado local sin bloquear la pantalla", {
      function: "saveAppState",
      file: "lib/storage.ts",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

export function loadAppState(): PersistedAppState | null {
  if (typeof window === "undefined") return null;

  const rawState = window.localStorage.getItem(STORAGE_KEY);
  if (!rawState) return null;

  try {
    const parsed = JSON.parse(rawState) as PersistedAppState;
    if (!parsed || parsed.version !== 1) return null;
    if (!Array.isArray(parsed.activities) || !Array.isArray(parsed.commitments)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAppState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
