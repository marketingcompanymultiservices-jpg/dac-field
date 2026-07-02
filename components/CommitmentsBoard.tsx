"use client";

import { useMemo, useState } from "react";
import { CommitmentCard } from "@/components/CommitmentCard";
import { CommitmentFilter, CommitmentFilters, matchesPriorityFilter } from "@/components/CommitmentFilters";
import { CommitmentForm } from "@/components/CommitmentForm";
import { CommitmentSummary } from "@/components/CommitmentSummary";
import { useProjectStore } from "@/lib/project-store";

export function CommitmentsBoard() {
  const { commitments, addCommitment, updateCommitmentStatus } = useProjectStore();
  const [activeFilter, setActiveFilter] = useState<CommitmentFilter>("Todos");

  const filteredCommitments = useMemo(() => {
    if (activeFilter === "Todos") return commitments;
    if (activeFilter === "Alta / Critica") {
      return commitments.filter((commitment) => matchesPriorityFilter(commitment.priority));
    }
    return commitments.filter((commitment) => commitment.status === activeFilter);
  }, [activeFilter, commitments]);

  return (
    <div className="mt-6 grid gap-6">
      <CommitmentSummary commitments={commitments} />
      <CommitmentFilters activeFilter={activeFilter} onChange={setActiveFilter} />
      <CommitmentForm onAdd={addCommitment} />

      <section className="grid gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Listado</p>
            <h2 className="text-xl font-black text-dac-primary">Compromisos de obra</h2>
          </div>
          <p className="text-sm font-semibold text-dac-text/60">{filteredCommitments.length} visibles</p>
        </div>

        {filteredCommitments.length > 0 ? (
          filteredCommitments.map((commitment) => (
            <CommitmentCard key={commitment.id} commitment={commitment} onStatusChange={updateCommitmentStatus} />
          ))
        ) : (
          <p className="rounded-lg border border-dac-primary/10 bg-white p-5 text-sm font-semibold text-dac-text/60">
            No hay compromisos para este filtro.
          </p>
        )}
      </section>
    </div>
  );
}
