import {
  PieChart,
  Pie,
  Sector,
  Tooltip,
  ResponsiveContainer,
  type PieSectorShapeProps,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { ConstructionTask, StatusCategory } from '../types/construction';
import { STATUS_META, STATUS_ORDER, formatPercent } from '../utils/csvParser';

interface StatusDonutChartProps {
  tasks: ConstructionTask[];
  activeStatus: StatusCategory | 'ALL';
  onSelectStatus: (status: StatusCategory | 'ALL') => void;
}

interface DonutDatum {
  category: StatusCategory;
  name: string;
  shortLabel: string;
  value: number;
  percent: number;
  colorHex: string;
}

function CustomDonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: DonutDatum }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.colorHex }}
        />
        <span>{item.name}</span>
      </div>
      <div className="text-slate-600 tabular-nums">
        Số lượng: <strong className="text-slate-900">{item.value}</strong> hạng mục (
        <strong className="text-slate-900">{formatPercent(item.percent)}%</strong>)
      </div>
    </div>
  );
}

export function StatusDonutChart({
  tasks,
  activeStatus,
  onSelectStatus,
}: StatusDonutChartProps) {
  const total = tasks.length;

  const counts: Record<StatusCategory, number> = {
    COMPLETED: 0,
    IN_PROGRESS: 0,
    NOT_STARTED: 0,
    BLOCKED: 0,
  };

  for (const task of tasks) {
    counts[task.statusCategory] += 1;
  }

  const allStatusData: DonutDatum[] = STATUS_ORDER.map((category) => ({
    category,
    name: STATUS_META[category].label,
    shortLabel: STATUS_META[category].shortLabel,
    value: counts[category],
    percent: total > 0 ? (counts[category] / total) * 100 : 0,
    colorHex: STATUS_META[category].colorHex,
  }));

  const nonZeroData = allStatusData.filter((d) => d.value > 0);

  const handleToggle = (category: StatusCategory) => {
    onSelectStatus(activeStatus === category ? 'ALL' : category);
  };

  const renderSector = (props: PieSectorShapeProps) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      payload,
      isActive,
    } = props;
    const datum = payload as DonutDatum | undefined;
    const isSelected = datum && activeStatus === datum.category;
    const isDimmed =
      datum && activeStatus !== 'ALL' && activeStatus !== datum.category;

    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={isActive || isSelected ? (outerRadius ?? 80) + 5 : outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={datum?.colorHex ?? '#2563eb'}
        fillOpacity={isDimmed ? 0.35 : 1}
        stroke="#ffffff"
        strokeWidth={2}
        style={{ cursor: 'pointer', transition: 'all 180ms ease' }}
      />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Phân bổ Tỷ lệ Trạng thái
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhấp vào trạng thái để lọc nhanh bảng chi tiết
          </p>
        </div>
        {activeStatus !== 'ALL' && (
          <button
            type="button"
            onClick={() => onSelectStatus('ALL')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg cursor-pointer shrink-0"
          >
            Bỏ lọc
          </button>
        )}
      </div>

      {/* Donut Chart Canvas */}
      <div className="relative h-56 w-full my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={nonZeroData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={nonZeroData.length > 1 ? 3 : 0}
              shape={renderSector}
              isAnimationActive={false}
              onClick={(_data, idx) => {
                const clicked = nonZeroData[idx];
                if (clicked) handleToggle(clicked.category);
              }}
            />
            <Tooltip content={<CustomDonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center KPI summary inside Donut */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
            {activeStatus === 'ALL' ? total : counts[activeStatus]}
          </span>
          <span className="text-[11px] font-medium text-slate-500 mt-1 px-4 line-clamp-1">
            {activeStatus === 'ALL'
              ? 'Tổng hạng mục'
              : STATUS_META[activeStatus].shortLabel}
          </span>
        </div>
      </div>

      {/* Custom Interactive Semantic Legend */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
        {allStatusData.map((item) => {
          const isSelected = activeStatus === item.category;
          return (
            <button
              key={item.category}
              type="button"
              onClick={() => handleToggle(item.category)}
              className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-300 bg-blue-50/70 ring-1 ring-blue-500/20'
                  : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.colorHex }}
                />
                <span className="text-xs font-medium text-slate-700 truncate">
                  {item.shortLabel}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-900 tabular-nums shrink-0">
                {item.value}
                <span className="text-[10px] font-normal text-slate-500 ml-0.5">
                  ({Math.round(item.percent)}%)
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
