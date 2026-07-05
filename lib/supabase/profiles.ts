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

  const profilePayload = buildProfilePayload(user, localUsers);
  const currentProfile = await selectProfile(user.id);

  if (currentProfile) {
    const repairedProfile = await repairProfileIfNeeded(currentProfile, profilePayload);
    return {
      ...repairedProfile,
      must_change_password: repairedProfile.must_change_password || profilePayload.must_change_password
    } as SupabaseProfile;
  }

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
    return { ...(fallbackData as SupabaseProfile), must_change_password: profilePayload.must_change_password };
  }
  return data as SupabaseProfile;
}

function buildProfilePayload(user: User, localUsers: AdminUser[]) {
  const localUser = findLocalUserForIdentity(user, localUsers);
  const metadataName = getMetadataString(user, ["full_name", "name", "nombre"]);
  const fallbackName = user.email?.split("@")[0] || "Usuario DAC";
  const metadataRole = getMetadataString(user, ["role", "rol"]);
  const inferredRole = metadataRole || localUser?.role || inferRoleFromKnownUser(user, localUsers) || "Consulta";
  const metadataMustChangePassword = Boolean(user.user_metadata?.must_change_password || user.user_metadata?.mustChangePassword || user.app_metadata?.must_change_password);
  return {
    id: user.id,
    nombre: localUser ? (localUser.firstName + " " + localUser.lastName).trim() : metadataName || fallbackName,
    correo: user.email ?? "",
    rol: inferredRole,
    activo: localUser?.active ?? true,
    must_change_password: metadataMustChangePassword || localUser?.mustChangePassword || false
  };
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

async function repairProfileIfNeeded(currentProfile: SupabaseProfile, profilePayload: ReturnType<typeof buildProfilePayload>) {
  if (!supabaseClient) return currentProfile;

  const updates: Partial<Pick<SupabaseProfile, "nombre" | "correo" | "rol" | "activo" | "must_change_password">> = {};
  if (!currentProfile.nombre && profilePayload.nombre) updates.nombre = profilePayload.nombre;
  if (currentProfile.correo.toLowerCase() !== profilePayload.correo.toLowerCase()) updates.correo = profilePayload.correo;
  if (currentProfile.rol === "Consulta" && profilePayload.rol !== "Consulta") updates.rol = profilePayload.rol;
  if (!currentProfile.activo && profilePayload.activo) updates.activo = true;
  if (!currentProfile.must_change_password && profilePayload.must_change_password) updates.must_change_password = true;

  if (Object.keys(updates).length === 0) return currentProfile;

  const { data, error } = await supabaseClient
    .from("profiles")
    .update(updates)
    .eq("id", currentProfile.id)
    .select("id,nombre,correo,rol,activo,must_change_password,created_at")
    .single();

  if (!error) return data as SupabaseProfile;
  if (!error.message.toLowerCase().includes("must_change_password")) throw error;

  const { must_change_password: _ignored, ...fallbackUpdates } = updates;
  const { data: fallbackData, error: fallbackError } = await supabaseClient
    .from("profiles")
    .update(fallbackUpdates)
    .eq("id", currentProfile.id)
    .select("id,nombre,correo,rol,activo,created_at")
    .single();

  if (fallbackError) throw fallbackError;
  return { ...(fallbackData as SupabaseProfile), must_change_password: currentProfile.must_change_password ?? false };
}

function findLocalUserForIdentity(user: User, localUsers: AdminUser[]) {
  const email = user.email ?? "";
  const normalizedEmail = email.toLowerCase();
  const normalizedLocalPart = normalizeEmailLocalPart(email);
  const metadataName = normalizeName(getMetadataString(user, ["full_name", "name", "nombre"]));

  return (
    localUsers.find((item) => item.email.toLowerCase() === normalizedEmail) ??
    localUsers.find((item) => normalizeEmailLocalPart(item.email) === normalizedLocalPart) ??
    localUsers.find((item) => normalizeName(item.firstName + " " + item.lastName) === metadataName)
  );
}

function normalizeEmailLocalPart(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[._-]/g, "");
}

function inferRoleFromKnownUser(user: User, localUsers: AdminUser[]) {
  const email = user.email ?? "";
  const localPart = normalizeEmailLocalPart(email);
  const name = normalizeName(getMetadataString(user, ["full_name", "name", "nombre"]) || email.split("@")[0]);

  const knownUser = localUsers.find((item) => {
    const itemName = normalizeName(item.firstName + " " + item.lastName);
    const firstName = normalizeName(item.firstName);
    return localPart.includes(firstName) || name.includes(itemName) || name.includes(firstName);
  });

  return knownUser?.role ?? null;
}

function getMetadataString(user: User, keys: string[]) {
  for (const key of keys) {
    const value = user.user_metadata?.[key] ?? user.app_metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
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
