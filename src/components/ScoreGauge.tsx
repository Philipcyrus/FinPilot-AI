import { scoreColor, scoreLabel } from "@/lib/utils";

export function ScoreGauge({
  score,
  size = 160,
  label,
  sublabel,
  thickness = 12,
}: {
  score: number;
  size?: number;
  label?: string;
  sublabel?: string;
  thickness?: number;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  // 270° arc (gauge style)
  const arc = 0.75;
  const dash = circumference * arc;
  const offset = dash * (1 - clamped / 100);
  const color = scoreColor(clamped);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="num text-4xl font-bold tracking-tight" style={{ color }}>
          {Math.round(clamped)}
        </span>
        <span className="text-xs font-medium" style={{ color }}>
          {label ?? scoreLabel(clamped)}
        </span>
        {sublabel && <span className="mt-0.5 text-[10px] text-[var(--muted)]">{sublabel}</span>}
      </div>
    </div>
  );
}

export function MiniGauge({ score, size = 56 }: { score: number; size?: number }) {
  const thickness = 6;
  const radius = (size - thickness) / 2;
  const c = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const color = scoreColor(clamped);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="num absolute text-sm font-bold" style={{ color }}>
        {Math.round(clamped)}
      </span>
    </div>
  );
}
