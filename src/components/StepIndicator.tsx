export function StepIndicator({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-1 px-5 pb-3.5">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div
            key={step}
            className={`h-[3px] flex-1 rounded-sm transition-colors ${
              done
                ? "bg-accent"
                : active
                  ? "bg-accent/45"
                  : "bg-surface2"
            }`}
          />
        );
      })}
    </div>
  );
}
