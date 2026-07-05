"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/components/AuthProvider";
import { permissionActions, permissionModules } from "@/lib/mock-data";
import { useProjectStore } from "@/lib/project-store";
import type { AdminCompany, AdminRole, AdminUser } from "@/types";

type AdminTab = "Empresa" | "Usuarios" | "Roles" | "Permisos";
type UserDraft = Omit<AdminUser, "id" | "createdAt" | "status"> & { temporaryPassword: string };

const tabs: AdminTab[] = ["Empresa", "Usuarios", "Roles", "Permisos"];
const inputClass = "focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-3 py-2 text-sm";
const labelClass = "block text-sm font-bold text-dac-text";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("Empresa");

  useEffect(() => {
    function syncTabFromHash() {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      const nextTab = tabs.find((tab) => normalizeTab(tab) === hash);
      if (nextTab) setActiveTab(nextTab);
    }

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  return (
    <div className="mt-6 grid gap-6">
      <section className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-dac-secondary">Modulo base Supabase</p>
            <h1 className="mt-1 text-3xl font-black text-dac-primary">Administracion</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-dac-text/70">
              Configuracion local de empresa, usuarios, roles y permisos. Esta capa queda lista para conectarse a autenticacion real en un sprint futuro.
            </p>
          </div>
          <div className="rounded-lg border border-dac-primary/10 bg-dac-primary/[0.03] p-4">
            <p className="text-xs font-black uppercase text-dac-text/50">Estado</p>
            <p className="mt-1 text-sm font-black text-dac-primary">LocalStorage / Store Global</p>
            <p className="mt-1 text-xs font-semibold text-dac-text/60">Sin autenticacion real todavia</p>
            <Link href="/system/health" className="focus-ring mt-3 inline-flex rounded-md bg-dac-primary px-4 py-2 text-xs font-black text-white hover:bg-dac-secondary">
              Estado del Sistema
            </Link>
          </div>
        </div>
      </section>

      <nav className="-mx-1 overflow-x-auto pb-1" aria-label="Submodulos administracion">
        <div className="flex min-w-max gap-2 px-1">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={getTabClass(activeTab === tab)}>
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "Empresa" && <CompanyAdmin />}
      {activeTab === "Usuarios" && <UsersAdmin />}
      {activeTab === "Roles" && <RolesAdmin />}
      {activeTab === "Permisos" && <PermissionsAdmin />}
    </div>
  );
}

function CompanyAdmin() {
  const { adminCompany, updateAdminCompany } = useProjectStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AdminCompany>(adminCompany);

  function saveCompany() {
    updateAdminCompany(draft);
    setEditing(false);
  }

  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-dac-secondary">Empresa</p>
          <h2 className="mt-1 text-2xl font-black text-dac-primary">{adminCompany.name}</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(true)} className="focus-ring rounded-md border border-dac-primary px-4 py-2 text-sm font-black text-dac-primary hover:bg-dac-primary hover:text-white">Editar</button>
          <button type="button" onClick={saveCompany} disabled={!editing} className="focus-ring rounded-md bg-dac-primary px-4 py-2 text-sm font-black text-white hover:bg-dac-secondary disabled:cursor-not-allowed disabled:bg-dac-primary/35">Guardar</button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="rounded-lg border border-dac-primary/10 bg-dac-primary/[0.03] p-4">
          <p className="text-sm font-black text-dac-primary">Logo institucional</p>
          <div className="mt-4 rounded-md bg-white p-4">
            <AppLogo />
          </div>
          <p className="mt-3 break-all text-xs font-semibold text-dac-text/60">{draft.logoUrl}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre empresa" value={draft.name} disabled={!editing} onChange={(value) => setDraft({ ...draft, name: value })} />
          <Field label="NIT" value={draft.nit} disabled={!editing} onChange={(value) => setDraft({ ...draft, nit: value })} />
          <Field label="Direccion" value={draft.address} disabled={!editing} onChange={(value) => setDraft({ ...draft, address: value })} />
          <Field label="Ciudad" value={draft.city} disabled={!editing} onChange={(value) => setDraft({ ...draft, city: value })} />
          <Field label="Correo" value={draft.email} disabled={!editing} onChange={(value) => setDraft({ ...draft, email: value })} />
          <Field label="Telefono" value={draft.phone} disabled={!editing} onChange={(value) => setDraft({ ...draft, phone: value })} />
          <Field label="Logo" value={draft.logoUrl} disabled={!editing} onChange={(value) => setDraft({ ...draft, logoUrl: value })} />
          <Field label="Subdominio futuro" value={draft.futureSubdomain} disabled={!editing} onChange={(value) => setDraft({ ...draft, futureSubdomain: value })} />
        </div>
      </div>
    </section>
  );
}

function UsersAdmin() {
  const { session } = useAuth();
  const { adminCompany, adminRoles, adminUsers, addAdminUser, deleteAdminUser, updateAdminUser } = useProjectStore();
  const emptyDraft: UserDraft = {
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    role: adminRoles[0]?.name ?? "Consulta",
    phone: "",
    company: adminCompany.name,
    photoUrl: "",
    active: true,
    mustChangePassword: false,
    temporaryPassword: ""
  };
  const [draft, setDraft] = useState<UserDraft>(emptyDraft);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.firstName.trim() || !draft.email.trim()) return;

    setMessage("");
    setSubmitting(true);
    const fullName = [draft.firstName, draft.lastName].filter(Boolean).join(" ").trim();
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: "Bearer " + session.access_token } : {})
      },
      body: JSON.stringify({
        fullName,
        email: draft.email,
        role: draft.role,
        active: draft.active,
        temporaryPassword: draft.temporaryPassword
      })
    });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      setMessage(result.error ?? "No fue posible activar el usuario en Supabase.");
      return;
    }

    const userStatus: AdminUser["status"] = draft.active ? "Activo" : "Inactivo";
    const localUser = {
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      position: draft.position,
      role: draft.role,
      phone: draft.phone,
      company: draft.company,
      photoUrl: draft.photoUrl,
      active: draft.active,
      id: result.id ?? editingId,
      status: userStatus,
      mustChangePassword: result.mustChangePassword ?? Boolean(draft.temporaryPassword)
    };

    if (editingId) {
      const current = adminUsers.find((user) => user.id === editingId);
      if (current) updateAdminUser({ ...current, ...localUser });
    } else {
      addAdminUser(localUser);
    }

    setDraft(emptyDraft);
    setEditingId("");
    setMessage("Usuario activado correctamente en Supabase Auth.");
  }

  function editUser(user: AdminUser) {
    setEditingId(user.id);
    setDraft({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      position: user.position,
      role: user.role,
      phone: user.phone,
      company: user.company,
      photoUrl: user.photoUrl ?? "",
      active: user.active,
      mustChangePassword: user.mustChangePassword ?? false,
      temporaryPassword: ""
    });
  }

  function toggleUser(user: AdminUser) {
    setDraft({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      position: user.position,
      role: user.role,
      phone: user.phone,
      company: user.company,
      photoUrl: user.photoUrl ?? "",
      active: !user.active,
      mustChangePassword: user.mustChangePassword ?? false,
      temporaryPassword: ""
    });
    setEditingId(user.id);
    setMessage("Revisa y guarda para " + (user.active ? "desactivar" : "activar") + " el usuario en Supabase.");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <form onSubmit={submitUser} className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
        <p className="text-sm font-black uppercase text-dac-secondary">{editingId ? "Editar usuario" : "Nuevo usuario"}</p>
        <div className="mt-4 grid gap-3">
          <Field label="Nombre" value={draft.firstName} onChange={(value) => setDraft({ ...draft, firstName: value })} />
          <Field label="Apellido" value={draft.lastName} onChange={(value) => setDraft({ ...draft, lastName: value })} />
          <Field label="Correo" value={draft.email} type="email" onChange={(value) => setDraft({ ...draft, email: value })} />
          <Field label="Cargo" value={draft.position} onChange={(value) => setDraft({ ...draft, position: value })} />
          <label className={labelClass}>
            Estado
            <select value={draft.active ? "Activo" : "Inactivo"} onChange={(event) => setDraft({ ...draft, active: event.target.value === "Activo" })} className={inputClass}>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </label>
          <label className={labelClass}>
            Rol
            <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} className={inputClass}>
              {adminRoles.map((role) => <option key={role.id}>{role.name}</option>)}
            </select>
          </label>
          <Field label={editingId ? "Nueva contrasena temporal opcional" : "Contrasena temporal"} value={draft.temporaryPassword} type="password" onChange={(value) => setDraft({ ...draft, temporaryPassword: value, mustChangePassword: Boolean(value) })} />
          <Field label="Telefono" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
          <Field label="Empresa" value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
          <Field label="Foto opcional" value={draft.photoUrl ?? ""} onChange={(value) => setDraft({ ...draft, photoUrl: value })} />
        </div>
        {message && <p className="mt-4 rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-bold text-dac-primary">{message}</p>}
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="submit" disabled={submitting} className="focus-ring rounded-md bg-dac-primary px-4 py-3 text-sm font-black text-white hover:bg-dac-secondary disabled:cursor-not-allowed disabled:bg-dac-primary/40">{submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear usuario"}</button>
          <button type="button" onClick={() => { setDraft(emptyDraft); setEditingId(""); }} className="focus-ring rounded-md border border-dac-primary px-4 py-3 text-sm font-black text-dac-primary hover:bg-dac-primary hover:text-white">Limpiar</button>
        </div>
      </form>

      <div className="grid gap-3">
        {adminUsers.map((user) => (
          <article key={user.id} className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-black text-dac-primary">{user.firstName} {user.lastName}</p>
                <p className="mt-1 text-sm font-semibold text-dac-text/70">{user.position} - {user.role}</p>
                <p className="mt-1 text-sm text-dac-text/60">{user.email} - {user.phone}</p>
                <p className="mt-1 text-xs font-bold text-dac-text/50">{user.company} - Creado: {user.createdAt}</p>
                {user.mustChangePassword && <p className="mt-1 text-xs font-black text-dac-alert">Debe cambiar contrasena en el proximo ingreso</p>}
              </div>
              <span className={(user.active ? "bg-dac-secondary/15 text-dac-primary" : "bg-dac-alert/15 text-dac-alert") + " rounded-full px-3 py-1 text-xs font-black"}>{user.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => editUser(user)} className="focus-ring rounded-md border border-dac-primary px-3 py-2 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white">Editar</button>
              <button type="button" onClick={() => toggleUser(user)} className="focus-ring rounded-md border border-dac-secondary px-3 py-2 text-sm font-bold text-dac-primary hover:bg-dac-secondary/10">{user.active ? "Desactivar" : "Activar"}</button>
              <button type="button" onClick={() => deleteAdminUser(user.id)} className="focus-ring rounded-md border border-dac-alert px-3 py-2 text-sm font-bold text-dac-alert hover:bg-dac-alert hover:text-white">Eliminar</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RolesAdmin() {
  const { adminRoles, adminUsers, updateAdminRole } = useProjectStore();

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {adminRoles.map((role) => {
        const userCount = adminUsers.filter((user) => user.role === role.name).length;
        const enabledPermissions = countEnabledPermissions(role);
        return (
          <article key={role.id} className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xl font-black text-dac-primary">{role.name}</p>
                <p className="mt-1 text-sm font-semibold text-dac-text/70">{userCount} usuarios</p>
              </div>
              <span className="rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary">{enabledPermissions} permisos</span>
            </div>
            <label className={labelClass + " mt-4"}>
              Descripcion
              <textarea value={role.description} onChange={(event) => updateAdminRole({ ...role, description: event.target.value })} className={inputClass + " min-h-24"} />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {permissionModules.filter((module) => role.permissions[module].Ver).slice(0, 6).map((module) => (
                <span key={module} className="rounded-md bg-dac-primary/[0.06] px-2 py-1 text-xs font-bold text-dac-primary">{module}</span>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function PermissionsAdmin() {
  const { adminRoles, toggleRolePermission } = useProjectStore();
  const [roleId, setRoleId] = useState(adminRoles[0]?.id ?? "");
  const role = useMemo(() => adminRoles.find((item) => item.id === roleId) ?? adminRoles[0], [adminRoles, roleId]);

  if (!role) return null;

  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white shadow-panel">
      <div className="border-b border-dac-primary/10 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-dac-secondary">Matriz de permisos</p>
            <h2 className="text-2xl font-black text-dac-primary">Configuracion por rol</h2>
          </div>
          <label className="block text-sm font-bold text-dac-text">
            Rol
            <select value={role.id} onChange={(event) => setRoleId(event.target.value)} className={inputClass + " min-w-64"}>
              {adminRoles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="overflow-x-auto p-5">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-dac-primary text-white">
            <tr>
              <th className="px-3 py-3 text-xs font-black uppercase">Modulo</th>
              {permissionActions.map((action) => <th key={action} className="px-3 py-3 text-center text-xs font-black uppercase">{action}</th>)}
            </tr>
          </thead>
          <tbody>
            {permissionModules.map((module) => (
              <tr key={module} className="border-b border-dac-primary/10">
                <td className="px-3 py-3 text-sm font-black text-dac-primary">{module}</td>
                {permissionActions.map((action) => (
                  <td key={action} className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleRolePermission(role.id, module, action)}
                      className={(role.permissions[module][action] ? "bg-dac-secondary" : "bg-dac-text/20") + " focus-ring relative inline-flex h-7 w-12 rounded-full transition"}
                      aria-label={module + " " + action}
                    >
                      <span className={(role.permissions[module][action] ? "translate-x-6" : "translate-x-1") + " mt-1 h-5 w-5 rounded-full bg-white transition"} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={inputClass + " disabled:bg-dac-primary/[0.04] disabled:text-dac-text/70"} />
    </label>
  );
}

function countEnabledPermissions(role: AdminRole) {
  return permissionModules.reduce((sum, module) => sum + permissionActions.filter((action) => role.permissions[module][action]).length, 0);
}

function getTabClass(active: boolean) {
  return (
    "focus-ring whitespace-nowrap rounded-md border px-4 py-2 text-sm font-black transition " +
    (active
      ? "border-dac-primary bg-dac-primary text-white"
      : "border-dac-primary/15 bg-white text-dac-primary hover:border-dac-secondary hover:bg-dac-secondary/10")
  );
}

function normalizeTab(tab: AdminTab) {
  return tab.toLowerCase();
}
