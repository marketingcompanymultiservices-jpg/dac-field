"use client";

import { BudgetImportCard } from "@/components/BudgetImportCard";
import { BudgetSummary } from "@/components/BudgetSummary";
import { BudgetTable } from "@/components/BudgetTable";
import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { useProjectStore } from "@/lib/project-store";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

export default function ProjectBudgetPage() {
  const { project, budgetItems, budgetVersion, progressItems, manualProgressChanges, budgetQuantityChanges, importBudget, updateManualProgress, updateBudgetQuantity } = useProjectStore();
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.totalValue, 0);

  return (
    <PageShell activeItem="Presupuesto" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Modulo: Presupuesto"
        title={project.name}
        meta={"Estado: " + project.status}
        aside={<HeaderMetric label="Valor total presupuesto" value={currencyFormatter.format(totalBudget)} detail="Fuente maestra para control fisico y financiero." />}
      />

      <div className="mt-6">
        <BudgetImportCard budgetVersion={budgetVersion} onImportBudget={importBudget} />
      </div>

      <div className="mt-6">
        <BudgetSummary items={budgetItems} />
      </div>

      <div className="mt-6">
        <BudgetTable
          items={budgetItems}
          progressItems={progressItems}
          manualProgressChanges={manualProgressChanges}
          budgetQuantityChanges={budgetQuantityChanges}
          projectId={project.id}
          onUpdateManualProgress={updateManualProgress}
          onUpdateBudgetQuantity={updateBudgetQuantity}
        />
      </div>
    </PageShell>
  );
}
