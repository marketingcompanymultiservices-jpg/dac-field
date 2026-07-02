"use client";

import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { ProgrammedVsExecuted } from "@/components/ProgrammedVsExecuted";
import { ProductivityPanel } from "@/components/ProductivityPanel";
import { ProgressSummary } from "@/components/ProgressSummary";
import { ProgressTable } from "@/components/ProgressTable";
import { useProjectStore } from "@/lib/project-store";

export default function ProjectProgressPage() {
  const { activities, alerts, budgetItems, commitments, planningItems, project, progressItems, progressSummary } = useProjectStore();
  const { totalBudget, executedValue, pendingValue, generalProgress, completedCount, activeCount, pendingCount } = progressSummary;

  return (
    <PageShell activeItem="Avance" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Modulo: Avance de Obra"
        title={project.name}
        meta={"Estado: " + project.status}
        aside={<HeaderMetric label="Avance general ponderado" value={generalProgress.toFixed(1) + " %"} detail="Calculado por cantidad registrada en Registro Diario." />}
      />

      <div className="mt-6">
        <ProgressSummary
          generalProgress={generalProgress}
          totalBudget={totalBudget}
          executedValue={executedValue}
          pendingValue={pendingValue}
          completedCount={completedCount}
          activeCount={activeCount}
          pendingCount={pendingCount}
        />
      </div>

      <div className="mt-6">
        <ProgressTable items={progressItems} />
      </div>

      <div className="mt-6">
        <ProgrammedVsExecuted activities={activities} budgetItems={budgetItems} planningItems={planningItems} />
      </div>

      <div className="mt-6">
        <ProductivityPanel activities={activities} alerts={alerts} budgetItems={budgetItems} commitments={commitments} />
      </div>
    </PageShell>
  );
}
