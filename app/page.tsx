"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBrand } from "@/components/AppBrand";
import { testUser } from "@/lib/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(testUser.email);
  const [password, setPassword] = useState(testUser.password);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email === testUser.email && password === testUser.password) {
      window.localStorage.setItem("dac-session", JSON.stringify({ email, name: testUser.name }));
      router.push("/dashboard");
      return;
    }
    setError("Correo o contraseña incorrectos.");
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
        <p className="text-sm text-white/70">Sprint 1 - Login simulado</p>
      </section>
      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-dac-primary/10 bg-white p-6 shadow-panel sm:p-8">
          <h2 className="text-2xl font-black text-dac-primary">Ingresar</h2>
          <p className="mt-2 text-sm text-dac-text/70">Acceso de prueba para el Director / Administrador.</p>
          <label className="mt-6 block text-sm font-bold text-dac-text" htmlFor="email">Usuario o correo</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3" />
          <label className="mt-4 block text-sm font-bold text-dac-text" htmlFor="password">Contraseña</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3" />
          {error && <p className="mt-4 rounded-md bg-dac-alert/10 px-4 py-3 text-sm font-semibold text-dac-text">{error}</p>}
          <button className="focus-ring mt-6 w-full rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary" type="submit">Ingresar</button>
        </form>
      </section>
    </main>
  );
}
