import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedAdminRoles = new Set(["Administrador", "Director Administrativo"]);

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "Supabase Admin no esta configurado. Falta SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sesion no autorizada." }, { status: 401 });

  const serverClient = createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();
  if (!serverClient || !adminClient) return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 500 });

  const { data: sessionUser, error: sessionError } = await serverClient.auth.getUser(token);
  if (sessionError || !sessionUser.user) return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });

  const { data: requesterProfile, error: requesterError } = await adminClient
    .from("profiles")
    .select("rol,activo")
    .eq("id", sessionUser.user.id)
    .maybeSingle();

  if (requesterError) return NextResponse.json({ error: requesterError.message }, { status: 500 });
  if (!requesterProfile?.activo || !allowedAdminRoles.has(requesterProfile.rol)) {
    return NextResponse.json({ error: "No tienes permisos para administrar usuarios." }, { status: 403 });
  }

  const body = await request.json();
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "Consulta").trim();
  const active = Boolean(body.active);
  const temporaryPassword = String(body.temporaryPassword ?? "").trim();

  if (!fullName || !email || !role) {
    return NextResponse.json({ error: "Nombre, correo y rol son obligatorios." }, { status: 400 });
  }

  if (temporaryPassword && temporaryPassword.length < 8) {
    return NextResponse.json({ error: "La contrasena temporal debe tener minimo 8 caracteres." }, { status: 400 });
  }

  const existingUser = await findAuthUserByEmail(adminClient, email);
  if (!existingUser && !temporaryPassword) {
    return NextResponse.json({ error: "La contrasena temporal es obligatoria para crear usuarios nuevos." }, { status: 400 });
  }

  const mustChangePassword = Boolean(temporaryPassword);
  const authPayload = {
    email,
    user_metadata: {
      full_name: fullName,
      role,
      must_change_password: mustChangePassword
    },
    ban_duration: active ? "none" : "876000h"
  };

  const authResult = existingUser
    ? await adminClient.auth.admin.updateUserById(existingUser.id, {
        ...authPayload,
        ...(temporaryPassword ? { password: temporaryPassword } : {})
      })
    : await adminClient.auth.admin.createUser({
        ...authPayload,
        password: temporaryPassword,
        email_confirm: true
      });

  if (authResult.error) return NextResponse.json({ error: authResult.error.message }, { status: 500 });

  const authUser = authResult.data.user;
  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: authUser.id,
      nombre: fullName,
      correo: email,
      rol: role,
      activo: active,
      must_change_password: mustChangePassword
    },
    { onConflict: "id" }
  );

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({
    id: authUser.id,
    email,
    role,
    active,
    mustChangePassword
  });
}

async function findAuthUserByEmail(adminClient: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, email: string) {
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}
