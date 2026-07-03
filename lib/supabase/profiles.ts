import type { User } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabaseClient";
import type { AdminUser } from "@/types";

export type SupabaseProfile = {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
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
    activo: localUser?.active ?? true
  };

  const { data: currentProfile, error: selectError } = await supabaseClient
    .from("profiles")
    .select("id,nombre,correo,rol,activo,created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (currentProfile) return currentProfile as SupabaseProfile;

  const { data, error } = await supabaseClient
    .from("profiles")
    .insert(profilePayload)
    .select("id,nombre,correo,rol,activo,created_at")
    .single();

  if (error) throw error;
  return data as SupabaseProfile;
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
    active: profile.activo
  };
}
