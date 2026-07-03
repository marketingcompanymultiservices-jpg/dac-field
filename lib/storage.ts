import type {
  ActivityPlanning,
  AdminCompany,
  AdminRole,
  AdminUser,
  AlertOverride,
  BudgetItem,
  BudgetVersion,
  BudgetProgressItem,
  Commitment,
  DailyActivity,
  DailyPhoto,
  DailyReportEntry,
  Project,
  ProjectDocument,
  ProjectReport,
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
  systemEvents?: TimelineEvent[];
  adminCompany?: AdminCompany;
  adminUsers?: AdminUser[];
  adminRoles?: AdminRole[];
  alertOverrides?: AlertOverride[];
  knownAlertIds?: string[];
  manualProgressChanges?: ManualProgressChange[];
};

export function saveAppState(state: PersistedAppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
