export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={"h-3 overflow-hidden rounded-full bg-dac-primary/10 " + className} aria-label={"Avance " + normalizedValue + "%"}>
      <div className="h-full rounded-full bg-dac-secondary" style={{ width: normalizedValue + "%" }} />
    </div>
  );
}
