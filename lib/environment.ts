import { appConfig } from "@/lib/appConfig";

export type PublicEnvironment = {
  appName: string;
  version: string;
  environment: string;
  company: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function getEnvironment(): PublicEnvironment {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? appConfig.systemName,
    version: process.env.NEXT_PUBLIC_VERSION ?? appConfig.version,
    environment: process.env.NEXT_PUBLIC_ENV ?? appConfig.environment,
    company: process.env.NEXT_PUBLIC_COMPANY ?? appConfig.company,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ""
  };
}

export function isProductionEnvironment() {
  const environment = getEnvironment().environment.toLowerCase();
  return environment === "produccion" || environment === "producción" || environment === "production";
}
