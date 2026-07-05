"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseClient } from "@/lib/supabaseClient";
import { getSupabaseBrowserConfigStatus } from "@/lib/supabase/browser";
import { ensureUserProfile, mapProfileToAdminUser } from "@/lib/supabase/profiles";
import { useProjectStore } from "@/lib/project-store";
import type { AdminUser } from "@/types";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AdminUser | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  changePassword: (password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  audit: (title: string, description: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const publicRoutes = ["/"];
const passwordChangeRoute = "/change-password";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { addSystemEvent, adminUsers } = useProjectStore();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [remoteProfile, setRemoteProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const profile = useMemo(() => {
    if (remoteProfile) return remoteProfile;
    if (!user?.email) return null;
    return adminUsers.find((item) => item.email.toLowerCase() === user.email?.toLowerCase()) ?? null;
  }, [adminUsers, remoteProfile, user?.email]);
  const mustChangePassword = Boolean(
    profile?.mustChangePassword ||
      user?.user_metadata?.must_change_password ||
      user?.user_metadata?.mustChangePassword ||
      user?.app_metadata?.must_change_password
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabaseClient) {
      setLoading(false);
      return;
    }

    let mounted = true;
    supabaseClient.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await syncProfile(data.session.user);
      setLoading(false);
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) await syncProfile(nextSession.user);
      if (!nextSession?.user) setRemoteProfile(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [adminUsers]);

  useEffect(() => {
    if (loading) return;
    if (publicRoutes.includes(pathname)) return;
    if (!session) router.replace("/");
  }, [loading, pathname, router, session]);

  useEffect(() => {
    if (loading || !session || !mustChangePassword) return;
    if (pathname !== passwordChangeRoute) router.replace(passwordChangeRoute);
  }, [loading, mustChangePassword, pathname, router, session]);

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured || !supabaseClient) return { error: "Supabase no está configurado." };
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    console.info("[DAC Auth] Supabase config", getSupabaseBrowserConfigStatus());
    setLoading(true);
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email: normalizedEmail, password: normalizedPassword });
    setLoading(false);

    if (error) {
      console.error("[DAC Auth] Supabase signInWithPassword error", {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return { error: error.message };
    }

    setSession(data.session);
    setUser(data.user);
    const nextProfile = await syncProfile(data.user);
    addSystemEvent({
      title: "Usuario inicio sesion.",
      description: (data.user.email ?? normalizedEmail) + " inicio sesion con Supabase."
    });
    const requiresPasswordChange = Boolean(
      nextProfile?.mustChangePassword ||
        data.user.user_metadata?.must_change_password ||
        data.user.user_metadata?.mustChangePassword ||
        data.user.app_metadata?.must_change_password
    );
    router.push(requiresPasswordChange ? passwordChangeRoute : "/dashboard");
    return {};
  }

  async function changePassword(password: string) {
    if (!isSupabaseConfigured || !supabaseClient || !user) return { error: "Supabase no estÃ¡ configurado." };
    const normalizedPassword = password.trim();
    if (normalizedPassword.length < 8) return { error: "La nueva contrasena debe tener minimo 8 caracteres." };

    setLoading(true);
    const { data, error } = await supabaseClient.auth.updateUser({
      password: normalizedPassword,
      data: {
        ...user.user_metadata,
        must_change_password: false,
        mustChangePassword: false
      }
    });
    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user.id);

    const missingMustChangeColumn = profileError?.message.toLowerCase().includes("must_change_password");
    if (profileError && !missingMustChangeColumn) {
      setLoading(false);
      return { error: profileError.message };
    }

    const nextUser = data.user ?? user;
    setUser(nextUser);
    const nextProfile = await syncProfile(nextUser);
    if (nextProfile) setRemoteProfile({ ...nextProfile, mustChangePassword: false });
    setLoading(false);
    addSystemEvent({
      title: "Usuario cambio contrasena temporal.",
      description: (user.email ?? "Usuario") + " actualizo su contrasena inicial."
    });
    router.replace("/dashboard");
    return {};
  }

  async function syncProfile(nextUser: User) {
    try {
      const nextProfile = await ensureUserProfile(nextUser, adminUsers);
      if (nextProfile) {
        const mappedProfile = mapProfileToAdminUser(nextProfile);
        setRemoteProfile(mappedProfile);
        return mappedProfile;
      }
    } catch (error) {
      addSystemEvent({
        title: "No fue posible sincronizar perfil.",
        description: error instanceof Error ? error.message : "Error desconocido al crear o leer profiles."
      });
    }
    return null;
  }

  async function logout() {
    const email = user?.email ?? "Usuario";
    if (isSupabaseConfigured && supabaseClient) await supabaseClient.auth.signOut();
    setSession(null);
    setUser(null);
    addSystemEvent({
      title: "Usuario cerro sesion.",
      description: email + " cerro sesion."
    });
    router.push("/");
  }

  function audit(title: string, description: string) {
    addSystemEvent({ title, description });
  }

  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    signIn,
    changePassword,
    logout,
    audit
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
