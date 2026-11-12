import type { StatusCategory } from '../types/construction';
import { STATUS_META, formatPercent } from '../utils/csvParser';

interface StatusBadgeProps {
  statusCategory: StatusCategory;
  rawLabel?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({
  statusCategory,
  rawLabel,
  size = 'sm',
}: StatusBadgeProps) {
  const meta = STATUS_META[statusCategory];
  const displayLabel = rawLabel?.trim() || meta.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap ring-1 ring-inset ${
        meta.badgeClasses
      } ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1 text-xs'}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`}
        aria-hidden="true"
      />
      <span>{displayLabel}</span>
    </span>
  );
}

interface ProgressBarCellProps {
  percent: number;
  statusCategory: StatusCategory;
}

export function ProgressBarCell({
  percent,
  statusCategory,
}: ProgressBarCellProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const meta = STATUS_META[statusCategory];

  return (
    <div className="flex items-center gap-2.5 min-w-[125px]">
      <div
        className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden ring-1 ring-inset ring-slate-200/70"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${meta.progressBarClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 tabular-nums w-11 text-right">
        {formatPercent(clamped)}%
      </span>
    </div>
  );
}
