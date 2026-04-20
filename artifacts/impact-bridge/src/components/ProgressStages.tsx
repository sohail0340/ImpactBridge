import { Check } from "lucide-react";

const stages = [
  { label: "Reported", minPct: 0 },
  { label: "Community Joined", minPct: 20 },
  { label: "Funding Started", minPct: 40 },
  { label: "Work in Progress", minPct: 60 },
  { label: "Completed", minPct: 80 },
];

interface ProgressStagesProps {
  workProgressPercent?: number;
  status?: string;
}

function resolveCurrentIdx(workProgressPercent?: number, status?: string): number {
  if (typeof workProgressPercent === "number") {
    let idx = 0;
    for (let i = 0; i < stages.length; i++) {
      if (workProgressPercent >= stages[i].minPct) idx = i;
    }
    return idx;
  }
  const legacyMap: Record<string, number> = {
    reported: 0, community_joined: 1, funding_started: 2, in_progress: 3, completed: 4,
  };
  return legacyMap[status ?? ""] ?? 0;
}

export function ProgressStages({ workProgressPercent, status }: ProgressStagesProps) {
  const currentIdx = resolveCurrentIdx(workProgressPercent, status);

  return (
    <div className="w-full">
      {typeof workProgressPercent === "number" && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Work completed</span>
            <span className="font-semibold text-primary">{workProgressPercent}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${workProgressPercent}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                  idx < currentIdx
                    ? "bg-primary border-primary text-white"
                    : idx === currentIdx
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                {idx < currentIdx ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-xs mt-1.5 text-center max-w-[70px] leading-tight ${
                  idx <= currentIdx ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {idx < stages.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${
                  idx < currentIdx ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
