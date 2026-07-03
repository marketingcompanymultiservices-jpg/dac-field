"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBrand } from "@/components/AppBrand";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { isConfigured, loading, session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [router, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isConfigured) {
      setError("Supabase no está configurado.");
      return;
    }

    const result = await signIn(email, password);
    if (result.error) {
      console.error("[DAC Login] Error visible de autenticacion", result.error);
      setError(result.error);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_0.9fr]">
      <section className="flex min-h-[42vh] flex-col justify-between bg-dac-primary px-6 py-8 text-white sm:px-10 lg:min-h-screen">
        <AppBrand inverted showMotto />
        <div className="max-w-2xl py-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-dac-secondary">Sistema Integral de Gestión de Obras</p>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Doble Altura Control</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">Construimos información con la misma precisión con la que construimos obras.</p>
        </div>
        <p className="text-sm text-white/70">DAC Field v1.0.0 - Login real Supabase</p>
      </section>
      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-dac-primary/10 bg-white p-6 shadow-panel sm:p-8">
          <h2 className="text-2xl font-black text-dac-primary">Ingresar</h2>
          <p className="mt-2 text-sm text-dac-text/70">Acceso real con Supabase Auth.</p>
          {!isConfigured && <p className="mt-4 rounded-md bg-dac-alert/10 px-4 py-3 text-sm font-black text-dac-alert">Supabase no está configurado.</p>}
          <label className="mt-6 block text-sm font-bold text-dac-text" htmlFor="email">Correo</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3" />
          <label className="mt-4 block text-sm font-bold text-dac-text" htmlFor="password">Contraseña</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3" />
          {error && <p className="mt-4 rounded-md bg-dac-alert/10 px-4 py-3 text-sm font-semibold text-dac-text">{error}</p>}
          <button disabled={loading || !isConfigured} className="focus-ring mt-6 w-full rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary disabled:cursor-not-allowed disabled:bg-dac-primary/40" type="submit">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}
