"use client";

import { FormEvent, useState } from "react";
import { AppBrand } from "@/components/AppBrand";
import { useAuth } from "@/components/AuthProvider";

export default function ChangePasswordPage() {
  const { changePassword, loading, profile, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("La confirmacion no coincide con la nueva contrasena.");
      return;
    }

    const result = await changePassword(password);
    if (result.error) setError(result.error);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-dac-primary/[0.04] px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-dac-primary/15 bg-white p-6 shadow-panel">
        <AppBrand />
        <div className="mt-6">
          <p className="text-sm font-black uppercase text-dac-secondary">Cambio obligatorio</p>
          <h1 className="mt-1 text-2xl font-black text-dac-primary">Actualiza tu contrasena</h1>
          <p className="mt-2 text-sm font-semibold text-dac-text/65">
            {profile ? profile.firstName + " " + profile.lastName : user?.email}, estas usando una contrasena temporal. Debes crear una nueva antes de ingresar a DAC.
          </p>
        </div>

        <label className="mt-5 block text-sm font-bold text-dac-text">
          Nueva contrasena
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3" />
        </label>

        <label className="mt-4 block text-sm font-bold text-dac-text">
          Confirmar contrasena
          <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3" />
        </label>

        {error && <p className="mt-4 rounded-md bg-dac-alert/10 px-4 py-3 text-sm font-bold text-dac-alert">{error}</p>}

        <button type="submit" disabled={loading} className="focus-ring mt-6 w-full rounded-md bg-dac-primary px-5 py-3 font-black text-white hover:bg-dac-secondary disabled:cursor-not-allowed disabled:bg-dac-primary/40">
          {loading ? "Actualizando..." : "Guardar nueva contrasena"}
        </button>
      </form>
    </main>
  );
}
