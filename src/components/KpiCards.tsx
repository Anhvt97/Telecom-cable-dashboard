import { AlertTriangle, CheckCircle2, Ruler, TrendingUp } from 'lucide-react';
import type { KpiSummary } from '../types/construction';
import { formatMeters, formatPercent } from '../utils/csvParser';

interface KpiCardsProps {
  summary: KpiSummary;
  onSelectBottlenecks?: () => void;
  isFilteringBottlenecks?: boolean;
}

export function KpiCards({
  summary,
  onSelectBottlenecks,
  isFilteringBottlenecks = false,
}: KpiCardsProps) {
  const hasBottlenecks = summary.bottleneckCount > 0;
  const kmTotal = (summary.totalDesignLength / 1000).toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section
      aria-label="Tổng quan chỉ số KPI dự án"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5"
    >
      {/* Card 1: Tổng chiều dài dự án */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng chiều dài dự án
            </p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-[28px] font-bold tracking-tight text-slate-900 tabular-nums">
                {formatMeters(summary.totalDesignLength)}
              </span>
              <span className="text-sm font-medium text-slate-500">m</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Ruler className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Quy đổi: <strong className="font-semibold text-slate-700">{kmTotal} km</strong></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium tabular-nums">
            {summary.totalTasks} hạng mục
          </span>
        </div>
      </div>

      {/* Card 2: Chiều dài đã hoàn thành */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Chiều dài đã hoàn thành
            </p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-[28px] font-bold tracking-tight text-slate-900 tabular-nums">
                {formatMeters(summary.totalActualLength)}
              </span>
              <span className="text-sm font-medium text-slate-500">m</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Còn lại:{' '}
            <strong className="font-semibold text-slate-700 tabular-nums">
              {formatMeters(summary.remainingLength)} m
            </strong>
          </span>
          <span className="text-emerald-700 font-medium tabular-nums">
            {summary.completedCount}/{summary.totalTasks} xong
          </span>
        </div>
      </div>

      {/* Card 3: Tiến độ tổng thể (%) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tiến độ tổng thể
            </p>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-2xl lg:text-[28px] font-bold tracking-tight text-blue-700 tabular-nums">
                {formatPercent(summary.overallProgress)}
              </span>
              <span className="text-base font-semibold text-blue-600">%</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, summary.overallProgress)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Lũy kế thực tế / Tổng khối lượng thiết kế
          </p>
        </div>
      </div>

      {/* Card 4: Số điểm nghẽn */}
      <button
        type="button"
        onClick={onSelectBottlenecks}
        disabled={!hasBottlenecks && !isFilteringBottlenecks}
        className={`text-left rounded-2xl border p-5 shadow-sm transition-all ${
          isFilteringBottlenecks
            ? 'bg-red-50/70 border-red-400 ring-2 ring-red-500/20'
            : hasBottlenecks
              ? 'bg-white border-red-200/90 hover:border-red-300 hover:shadow-md cursor-pointer'
              : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Số điểm nghẽn
            </p>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span
                className={`text-2xl lg:text-[28px] font-bold tracking-tight tabular-nums ${
                  hasBottlenecks ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {summary.bottleneckCount}
              </span>
              <span className="text-xs font-medium text-slate-500">
                hạng mục
              </span>
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
              hasBottlenecks
                ? 'bg-red-50 border-red-100 text-red-600'
                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className={hasBottlenecks ? 'text-red-700 font-medium' : 'text-slate-500'}>
            {hasBottlenecks
              ? 'Trạng thái: Tạm dừng/Vướng mắc'
              : 'Không có điểm nghẽn'}
          </span>
          {hasBottlenecks && (
            <span className="text-blue-600 font-semibold whitespace-nowrap">
              {isFilteringBottlenecks ? 'Đang lọc ×' : 'Xem chi tiết →'}
            </span>
          )}
        </div>
      </button>
    </section>
  );
}
