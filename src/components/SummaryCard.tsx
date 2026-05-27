interface Row {
  key: string;
  value: string;
  accent?: boolean;
  blue?: boolean;
}

export function SummaryCard({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
      <div className="border-b border-border px-3.5 py-3 font-syne text-[13px] font-bold uppercase tracking-wide text-muted2">
        {title}
      </div>
      {rows.map((row, i) => (
        <div
          key={row.key}
          className={`flex items-center justify-between px-3.5 py-2.5 ${
            i < rows.length - 1 ? "border-b border-border" : ""
          }`}
        >
          <span className="text-[13px] text-muted2">{row.key}</span>
          <span
            className={`font-syne text-[13px] font-bold ${
              row.accent
                ? "text-accent"
                : row.blue
                  ? "text-blue"
                  : "text-text"
            }`}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
