import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  type BarShapeProps,
} from 'recharts';
import { CalendarRange } from 'lucide-react';
import type { ConstructionTask } from '../types/construction';
import {
  DAY_MS,
  STATUS_META,
  STATUS_ORDER,
  formatDateVN,
  formatPercent,
  formatShortDateFromMs,
  parseUtcDateMs,
  shortenLabel,
} from '../utils/csvParser';

interface TimelineGanttChartProps {
  tasks: ConstructionTask[];
  latestUpdateDate?: string;
  onSelectTask?: (task: ConstructionTask) => void;
}

interface GanttRowDatum {
  task: ConstructionTask;
  label: string;
  offsetDays: number;
  durationDays: number;
  actualStartOffsetDays: number | null;
  plannedStartMs: number;
  plannedEndMs: number;
  colorHex: string;
  trackHex: string;
}

function CustomGanttTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: GanttRowDatum }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  const { task, durationDays, colorHex } = item;
  const meta = STATUS_META[task.statusCategory];

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-3.5 text-xs max-w-sm">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="font-semibold text-slate-900">
          #{task.stt} · {task.hangMuc}
        </span>
      </div>
      <p className="text-slate-500 mb-2.5">{task.tuyenDoan}</p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 tabular-nums border-t border-slate-100 pt-2">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">
            Bắt đầu (KH)
          </span>
          <strong className="text-slate-800">
            {formatDateVN(task.batDauKeHoach)}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">
            Kết thúc (KH)
          </span>
          <strong className="text-slate-800">
            {formatDateVN(task.ketThucKeHoach)}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">
            Bắt đầu (Thực tế)
          </span>
          <strong className="text-slate-800">
            {task.batDauThucTe ? formatDateVN(task.batDauThucTe) : 'Chưa bắt đầu'}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">
            Thời gian KH
          </span>
          <strong className="text-slate-800">{durationDays} ngày</strong>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colorHex }}
          />
          {task.trangThaiRaw || meta.label}
        </span>
        <span className="font-semibold text-blue-700 tabular-nums">
          Tiến độ: {formatPercent(task.tienDo)}%
        </span>
      </div>
    </div>
  );
}

export function TimelineGanttChart({
  tasks,
  latestUpdateDate,
  onSelectTask,
}: TimelineGanttChartProps) {
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const datedTasks = tasks
    .map((task) => {
      const startMs = parseUtcDateMs(task.batDauKeHoach);
      const endMs = parseUtcDateMs(task.ketThucKeHoach);
      const actualStartMs = parseUtcDateMs(task.batDauThucTe);
      return { task, startMs, endMs, actualStartMs };
    })
    .filter(
      (
        item
      ): item is {
        task: ConstructionTask;
        startMs: number;
        endMs: number;
        actualStartMs: number | null;
      } => item.startMs !== null && item.endMs !== null
    );

  if (datedTasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CalendarRange className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Tiến độ Thời gian Thi công (Timeline / Gantt Chart)
          </h2>
        </div>
        <p className="text-sm text-slate-500 py-8 text-center">
          Chưa có dữ liệu ngày bắt đầu / kết thúc kế hoạch hợp lệ để hiển thị biểu đồ Gantt.
        </p>
      </div>
    );
  }

  const minMs = Math.min(...datedTasks.map((d) => d.startMs));
  const maxMs = Math.max(...datedTasks.map((d) => Math.max(d.startMs, d.endMs)));
  const totalDays = Math.max(1, Math.round((maxMs - minMs) / DAY_MS) + 2);

  const updateMs = latestUpdateDate ? parseUtcDateMs(latestUpdateDate) : null;
  const updateOffsetDays =
    updateMs !== null ? (updateMs - minMs) / DAY_MS : null;
  const showUpdateLine =
    updateOffsetDays !== null &&
    updateOffsetDays >= 0 &&
    updateOffsetDays <= totalDays;

  const ganttData: GanttRowDatum[] = datedTasks.map(
    ({ task, startMs, endMs, actualStartMs }) => {
      const offsetDays = Math.max(0, Math.round((startMs - minMs) / DAY_MS));
      const durationDays = Math.max(
        1,
        Math.round((Math.max(startMs, endMs) - startMs) / DAY_MS) + 1
      );
      const actualStartOffsetDays =
        actualStartMs !== null ? (actualStartMs - minMs) / DAY_MS : null;
      const meta = STATUS_META[task.statusCategory];

      return {
        task,
        label: `#${task.stt} ${shortenLabel(task.hangMuc, isCompact ? 16 : 26)}`,
        offsetDays,
        durationDays,
        actualStartOffsetDays,
        plannedStartMs: startMs,
        plannedEndMs: endMs,
        colorHex: meta.colorHex,
        trackHex: meta.trackHex,
      };
    }
  );

  // Compute balanced date ticks across the timeline
  const tickCount = Math.min(8, Math.max(4, Math.floor(totalDays / 4)));
  const step = Math.max(1, Math.ceil(totalDays / tickCount));
  const xTicks: number[] = [];
  for (let d = 0; d <= totalDays; d += step) {
    xTicks.push(d);
  }

  const chartHeight = Math.max(250, ganttData.length * 56 + 64);

  const renderGanttBar = (props: BarShapeProps) => {
    const { x, y, width, height, payload, isActive } = props;
    const datum = payload as GanttRowDatum | undefined;
    if (!datum || width <= 0 || height <= 0) {
      return <g />;
    }

    const barHeight = Math.min(26, Math.max(18, height - 6));
    const barY = y + (height - barHeight) / 2;
    const progressRatio = Math.max(0, Math.min(1, datum.task.tienDo / 100));
    const fillWidth = width * progressRatio;
    const radius = 6;
    const clipId = `gantt-clip-${datum.task.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    // Pixel X for Actual Start marker
    let actualMarkerX: number | null = null;
    if (datum.actualStartOffsetDays !== null && datum.durationDays > 0) {
      const rel =
        (datum.actualStartOffsetDays - datum.offsetDays) / datum.durationDays;
      actualMarkerX = x + rel * width;
    }

    return (
      <g
        style={{ cursor: onSelectTask ? 'pointer' : 'default' }}
        onClick={() => onSelectTask?.(datum.task)}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={x} y={barY} width={width} height={barHeight} rx={radius} />
          </clipPath>
        </defs>

        {/* Planned schedule background track */}
        <rect
          x={x}
          y={barY}
          width={width}
          height={barHeight}
          rx={radius}
          fill={datum.trackHex}
          stroke={datum.colorHex}
          strokeWidth={isActive ? 2 : 1.25}
          strokeOpacity={isActive ? 1 : 0.75}
        />

        {/* Progress fill inside planned bar */}
        {fillWidth > 0 && (
          <g clipPath={`url(#${clipId})`}>
            <rect
              x={x}
              y={barY}
              width={fillWidth}
              height={barHeight}
              fill={datum.colorHex}
              fillOpacity={0.9}
            />
          </g>
        )}

        {/* Actual Start Diamond Marker */}
        {actualMarkerX !== null && (
          <g transform={`translate(${actualMarkerX}, ${barY + barHeight / 2})`}>
            <polygon
              points="0,-4 4,0 0,4 -4,0"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth={1.25}
            />
          </g>
        )}

        {/* Percentage / Duration label next to bar */}
        <text
          x={x + width + 8}
          y={barY + barHeight / 2 + 4}
          fill="#475569"
          fontSize={11}
          fontWeight={600}
        >
          {formatPercent(datum.task.tienDo)}%
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Biểu đồ Tiến độ Thời gian Thi công (Timeline / Gantt Chart)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Khung kế hoạch (Bắt đầu – Kết thúc KH), phần tô đậm thể hiện % tiến độ
            lũy kế và mốc ◆ là ngày bắt đầu thực tế
          </p>
        </div>

        {/* Status color key */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          {STATUS_ORDER.map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: STATUS_META[cat].colorHex }}
              />
              <span>{STATUS_META[cat].shortLabel}</span>
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 pl-1 border-l border-slate-200">
            <span className="inline-block w-2 h-2 rotate-45 bg-slate-900" />
            <span>Bắt đầu thực tế</span>
          </span>
        </div>
      </div>

      <div className="w-full" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ganttData}
            layout="vertical"
            margin={{ top: 18, right: 56, left: 8, bottom: 8 }}
            barSize={26}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={true}
              stroke="#e2e8f0"
            />
            <XAxis
              type="number"
              domain={[0, totalDays]}
              ticks={xTicks}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(dayOffset: number) =>
                formatShortDateFromMs(minMs + dayOffset * DAY_MS)
              }
            />
            <YAxis
              type="category"
              dataKey="label"
              width={isCompact ? 128 : 220}
              tickMargin={8}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#1e293b', fontSize: isCompact ? 10.5 : 11.5, fontWeight: 500 }}
            />
            <Tooltip
              content={<CustomGanttTooltip />}
              cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
            />
            {showUpdateLine && updateOffsetDays !== null && (
              <ReferenceLine
                x={updateOffsetDays}
                stroke="#1d4ed8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{
                  value: `Cập nhật ${formatShortDateFromMs(updateMs!)}`,
                  position: 'top',
                  fill: '#1d4ed8',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}
            <Bar
              dataKey="offsetDays"
              stackId="gantt"
              fill="transparent"
              isAnimationActive={false}
            />
            <Bar
              dataKey="durationDays"
              stackId="gantt"
              shape={renderGanttBar}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
