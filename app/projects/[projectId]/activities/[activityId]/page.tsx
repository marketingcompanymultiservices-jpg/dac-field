"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { ProgressBar } from "@/components/ProgressBar";
import { getImagesByActivityId } from "@/lib/imageStorage";
import { getProgressStatus } from "@/lib/progress";
import { useProjectStore } from "@/lib/project-store";
import type { DailyPhoto } from "@/types";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-CO");

export default function ActivityDetailPage({ params }: { params: { projectId: string; activityId: string } }) {
  const { project, budgetItems, progressItems, activities, commitments, photos } = useProjectStore();
  const [photoPreviews, setPhotoPreviews] = useState<Array<{ photo: DailyPhoto; dataUrl: string }>>([]);
  const activityItem = decodeURIComponent(params.activityId);
  const budgetItem = budgetItems.find((item) => item.item === activityItem || item.id === activityItem);
  const progressItem = progressItems.find((item) => item.item === budgetItem?.item);
  const history = activities
    .filter((activity) => activity.budgetItemId === budgetItem?.item)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const activityCommitments = commitments.filter((commitment) => commitment.budgetItemId === budgetItem?.item);
  const activityPhotos = useMemo(() => photos.filter((photo) => photo.activityId === budgetItem?.item), [budgetItem?.item, photos]);

  useEffect(() => {
    let active = true;

    async function loadActivityPhotos() {
      if (!budgetItem?.item) {
        setPhotoPreviews([]);
        return;
      }
      const entries = await getImagesByActivityId(budgetItem.item, photos);
      if (active) setPhotoPreviews(entries);
    }

    loadActivityPhotos();
    return () => {
      active = false;
    };
  }, [activityPhotos, budgetItem?.item, photos]);

  if (!budgetItem) {
    return (
      <PageShell activeItem="Presupuesto" projectId={params.projectId} backHref={"/projects/" + params.projectId + "/budget"} backLabel="Volver a Presupuesto">
        <section className="rounded-lg border border-dac-primary/15 bg-white p-6 shadow-panel">
          <h1 className="text-2xl font-black text-dac-primary">Actividad no encontrada</h1>
          <p className="mt-2 text-sm font-semibold text-dac-text/70">El item solicitado no existe en el presupuesto maestro actual.</p>
        </section>
      </PageShell>
    );
  }

  const progress = progressItem?.progress ?? 0;
  const executedQuantity = progressItem?.executedQuantity ?? 0;
  const pendingQuantity = progressItem?.pendingQuantity ?? budgetItem.quantity;
  const executedValue = budgetItem.totalValue * (progress / 100);
  const lastUpdate = history[0] ? history[0].date + " " + history[0].time : "Sin ejecuciones";
  const photoCount = activityPhotos.length + history.reduce((sum, item) => sum + (item.photoCount ?? 0), 0);

  return (
    <PageShell activeItem="Presupuesto" projectId={project.id} backHref={"/projects/" + project.id + "/budget"} backLabel="Volver a Presupuesto">
      <ModuleHeader
        eyebrow={"Ficha de actividad " + budgetItem.item}
        title={budgetItem.description}
        meta={budgetItem.chapter + " / " + budgetItem.subchapter}
        aside={<HeaderMetric label="Avance" value={progress.toFixed(1) + " %"} detail={<ProgressBar value={progress} />} />}
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Estado" value={getProgressStatus(progress)} />
        <Metric label="Cantidad ejecutada" value={numberFormatter.format(executedQuantity) + " " + budgetItem.unit} />
        <Metric label="Cantidad pendiente" value={numberFormatter.format(pendingQuantity) + " " + budgetItem.unit} />
        <Metric label="Valor ejecutado" value={currencyFormatter.format(executedValue)} />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        <article className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel lg:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-dac-primary">Informacion tecnica</h2>
              <p className="mt-1 text-sm font-semibold text-dac-text/65">Presupuesto maestro como fuente oficial.</p>
            </div>
            <Link href={"/projects/" + project.id + "/daily-report"} className="focus-ring rounded-md bg-dac-primary px-4 py-2 text-sm font-black text-white hover:bg-dac-secondary">
              Registrar avance
            </Link>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="ITEM" value={budgetItem.item} />
            <Info label="Unidad" value={budgetItem.unit} />
            <Info label="Cantidad contratada" value={numberFormatter.format(budgetItem.quantity)} />
            <Info label="Valor unitario" value={currencyFormatter.format(budgetItem.unitValue)} />
            <Info label="Valor total" value={currencyFormatter.format(budgetItem.totalValue)} />
            <Info label="Ultima actualizacion" value={lastUpdate} />
            <Info label="Fotografias registradas" value={String(photoCount)} />
            <Info label="Compromisos asociados" value={String(activityCommitments.length)} />
          </dl>
        </article>

        <article className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
          <h2 className="text-xl font-black text-dac-primary">Resumen</h2>
          <ProgressBar value={progress} className="mt-4" />
          <div className="mt-5 grid gap-3">
            <Info label="Ejecutado acumulado" value={numberFormatter.format(executedQuantity) + " " + budgetItem.unit} />
            <Info label="Pendiente" value={numberFormatter.format(pendingQuantity) + " " + budgetItem.unit} />
            <Info label="Valor pendiente" value={currencyFormatter.format(Math.max(budgetItem.totalValue - executedValue, 0))} />
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-lg border border-dac-primary/15 bg-white shadow-panel">
        <div className="border-b border-dac-primary/10 p-5">
          <h2 className="text-xl font-black text-dac-primary">Historico de ejecuciones</h2>
          <p className="mt-1 text-sm font-semibold text-dac-text/65">Cada registro diario agrega una entrada. Nada se sobrescribe.</p>
        </div>
        <div className="grid gap-3 p-5">
          {history.length === 0 && <p className="rounded-md border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60">Sin ejecuciones registradas para esta actividad.</p>}
          {history.map((item) => (
            <article key={item.id} className="rounded-lg border border-dac-primary/10 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-black text-dac-primary">{item.date} - {item.quantity} {item.unit}</p>
                  <p className="mt-1 text-sm font-semibold text-dac-text/70">{item.owner || "Sin responsable"} - {item.workFront || "Sin frente"}</p>
                </div>
                <p className="text-sm font-black text-dac-alert">{item.startTime || item.time} - {item.endTime || "Sin cierre"}</p>
              </div>
              <p className="mt-3 text-sm text-dac-text/75">{item.observation || "Sin observacion."}</p>
              <p className="mt-2 text-sm font-semibold text-dac-primary">Fotos: {item.photoCount ?? 0}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-dac-primary/15 bg-white shadow-panel">
        <div className="border-b border-dac-primary/10 p-5">
          <h2 className="text-xl font-black text-dac-primary">Registro fotografico</h2>
          <p className="mt-1 text-sm font-semibold text-dac-text/65">Fotos reales asociadas desde Registro Diario.</p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {photoPreviews.length === 0 && <p className="rounded-md border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60 sm:col-span-2 lg:col-span-4">Sin fotografias asociadas a esta actividad.</p>}
          {photoPreviews.map(({ photo, dataUrl }, index) => (
            <figure key={photo.id} className="rounded-lg border border-dac-primary/10 p-3">
              <img src={dataUrl} alt={photo.description || photo.name} className="h-40 w-full rounded-md object-cover" />
              <figcaption className="mt-2 text-xs font-semibold text-dac-text/70">
                Foto {index + 1}: {photo.description || photo.name}
              </figcaption>
              <p className="mt-1 text-xs font-bold text-dac-primary">{photo.date} - {photo.time}</p>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-dac-primary/15 bg-white shadow-panel">
        <div className="border-b border-dac-primary/10 p-5">
          <h2 className="text-xl font-black text-dac-primary">Compromisos asociados</h2>
        </div>
        <div className="grid gap-3 p-5">
          {activityCommitments.length === 0 && <p className="rounded-md border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60">Sin compromisos asociados.</p>}
          {activityCommitments.map((commitment) => (
            <article key={commitment.id} className="rounded-lg border border-dac-primary/10 p-4">
              <p className="font-black text-dac-primary">{commitment.description}</p>
              <p className="mt-1 text-sm font-semibold text-dac-text/70">{commitment.owner} - {commitment.priority} - {commitment.status}</p>
              <p className="mt-1 text-sm font-semibold text-dac-alert">Fecha limite: {commitment.dueDate}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-dac-text/60">{label}</p>
      <p className="mt-2 text-2xl font-black text-dac-primary">{value}</p>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-dac-primary/[0.04] p-3">
      <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
      <dd className="mt-1 text-sm font-black text-dac-primary">{value}</dd>
    </div>
  );
}
