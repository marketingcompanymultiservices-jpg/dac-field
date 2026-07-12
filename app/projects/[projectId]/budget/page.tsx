"use client";

import { BudgetImportCard } from "@/components/BudgetImportCard";
import { BudgetSummary } from "@/components/BudgetSummary";
import { BudgetTable } from "@/components/BudgetTable";
import { BudgetVersionsPanel } from "@/components/BudgetVersionsPanel";
import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { useProjectStore } from "@/lib/project-store";
import { useState } from "react";

export default function ProjectBudgetPage() {
  const { project, budgetItems, budgetVersion, manualProgressChanges, budgetQuantityChanges, importBudget, updateManualProgress, updateBudgetQuantity } = useProjectStore();
  const [activeTab, setActiveTab] = useState<"Oficial" | "Versiones">("Oficial");

  return (
    <PageShell activeItem="Presupuesto" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Módulo: Presupuesto"
        title={project.name}
        meta={"Estado: " + project.status}
        aside={<HeaderMetric label="Versión Oficial" value={budgetVersion ? "V" + budgetVersion.versionNumber : "Sin versión"} detail="Consolidado financiero del proyecto." />}
      />

      <div className="mt-6 flex flex-wrap gap-2 rounded-lg border border-dac-primary/10 bg-white p-2 shadow-sm">
        {(["Oficial", "Versiones"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={getTabClass(activeTab === tab)}
          >
            {tab === "Oficial" ? "Presupuesto Oficial" : "Versiones"}
          </button>
        ))}
      </div>

      {activeTab === "Oficial" ? (
        <>
          <div className="mt-6">
            <BudgetImportCard budgetVersion={budgetVersion} onImportBudget={importBudget} />
          </div>

          <div className="mt-6">
            <BudgetSummary budgetVersion={budgetVersion} />
          </div>

          <div className="mt-6">
            <BudgetTable
              items={budgetItems}
              manualProgressChanges={manualProgressChanges}
              budgetQuantityChanges={budgetQuantityChanges}
              projectId={project.id}
              onUpdateManualProgress={updateManualProgress}
              onUpdateBudgetQuantity={updateBudgetQuantity}
            />
          </div>
        </>
      ) : (
        <div className="mt-6">
          <BudgetVersionsPanel projectId={project.id} />
        </div>
      )}
    </PageShell>
  );
}

function getTabClass(active: boolean) {
  return active
    ? "focus-ring rounded-md bg-dac-primary px-4 py-2 text-sm font-black text-white shadow-sm"
    : "focus-ring rounded-md px-4 py-2 text-sm font-black text-dac-primary hover:bg-dac-secondary/10";
}
