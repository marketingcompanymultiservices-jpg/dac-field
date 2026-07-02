"use client";

import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { PlanningForm } from "@/components/PlanningForm";
import { PlanningSummary } from "@/components/PlanningSummary";
import { PlanningTable } from "@/components/PlanningTable";
import { useProjectStore } from "@/lib/project-store";

export default function ProjectPlanningPage() {
  const { activities, duplicateWeeklyPlanning, project, budgetItems, planningItems, progressItems, upsertActivityPlanning } = useProjectStore();

  return (
    <PageShell activeItem="Planificación" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Modulo: Planificacion Semanal"
        title={project.name}
        meta={"Estado: " + project.status}
        aside={<HeaderMetric label="Actividades presupuestales" value={String(budgetItems.length)} detail="Programacion semanal desde presupuesto maestro." />}
      />

      <div className="mt-6">
        <PlanningSummary activities={activities} planningItems={planningItems} />
      </div>

      <div className="mt-6">
        <PlanningForm budgetItems={budgetItems} planningItems={planningItems} onSave={upsertActivityPlanning} />
      </div>

      <div className="mt-6">
        <PlanningTable activities={activities} budgetItems={budgetItems} planningItems={planningItems} progressItems={progressItems} onDuplicateWeek={duplicateWeeklyPlanning} />
      </div>
    </PageShell>
  );
}
