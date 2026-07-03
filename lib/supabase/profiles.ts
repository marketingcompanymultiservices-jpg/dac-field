import type { User } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabaseClient";
import type { AdminUser } from "@/types";

export type SupabaseProfile = {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  must_change_password?: boolean;
  created_at: string;
};

export async function ensureUserProfile(user: User, localUsers: AdminUser[]) {
  if (!supabaseClient || !user.email) return null;

  const localUser = findLocalUserForEmail(user.email, localUsers);
  const fallbackName = user.email.split("@")[0] || "Usuario DAC";
  const profilePayload = {
    id: user.id,
    nombre: localUser ? (localUser.firstName + " " + localUser.lastName).trim() : fallbackName,
    correo: user.email,
    rol: localUser?.role ?? "Consulta",
    activo: localUser?.active ?? true,
    must_change_password: localUser?.mustChangePassword ?? false
  };

  const currentProfile = await selectProfile(user.id);

  if (currentProfile) return currentProfile as SupabaseProfile;

  const { data, error } = await supabaseClient
    .from("profiles")
    .insert(profilePayload)
    .select("id,nombre,correo,rol,activo,must_change_password,created_at")
    .single();

  if (error) {
    const fallbackPayload = {
      id: profilePayload.id,
      nombre: profilePayload.nombre,
      correo: profilePayload.correo,
      rol: profilePayload.rol,
      activo: profilePayload.activo
    };
    const { data: fallbackData, error: fallbackError } = await supabaseClient
      .from("profiles")
      .insert(fallbackPayload)
      .select("id,nombre,correo,rol,activo,created_at")
      .single();
    if (fallbackError) throw fallbackError;
    return { ...(fallbackData as SupabaseProfile), must_change_password: false };
  }
  return data as SupabaseProfile;
}

async function selectProfile(id: string) {
  if (!supabaseClient) return null;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id,nombre,correo,rol,activo,must_change_password,created_at")
    .eq("id", id)
    .maybeSingle();

  if (!error) return data as SupabaseProfile | null;
  if (!error.message.toLowerCase().includes("must_change_password")) throw error;

  const { data: fallbackData, error: fallbackError } = await supabaseClient
    .from("profiles")
    .select("id,nombre,correo,rol,activo,created_at")
    .eq("id", id)
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  return fallbackData ? ({ ...(fallbackData as SupabaseProfile), must_change_password: false } as SupabaseProfile) : null;
}

function findLocalUserForEmail(email: string, localUsers: AdminUser[]) {
  const normalizedEmail = email.toLowerCase();
  const normalizedLocalPart = normalizeEmailLocalPart(email);

  return (
    localUsers.find((item) => item.email.toLowerCase() === normalizedEmail) ??
    localUsers.find((item) => normalizeEmailLocalPart(item.email) === normalizedLocalPart)
  );
}

function normalizeEmailLocalPart(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[._-]/g, "");
}

export function mapProfileToAdminUser(profile: SupabaseProfile): AdminUser {
  const parts = profile.nombre.trim().split(/\s+/);
  return {
    id: profile.id,
    firstName: parts[0] ?? profile.correo,
    lastName: parts.slice(1).join(" "),
    email: profile.correo,
    position: profile.rol,
    role: profile.rol,
    status: profile.activo ? "Activo" : "Inactivo",
    phone: "",
    company: "Doble Altura Construcciones S.A.S.",
    createdAt: profile.created_at.slice(0, 10),
    active: profile.activo,
    mustChangePassword: profile.must_change_password ?? false
  };
}
