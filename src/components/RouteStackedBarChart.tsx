import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { ConstructionTask, RouteVolumeSummary } from '../types/construction';
import { aggregateByRoute, formatMeters, formatPercent } from '../utils/csvParser';

interface RouteStackedBarChartProps {
  tasks: ConstructionTask[];
}

function CustomWrappedTick(props: {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
}) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const text = (props.payload?.value ?? '').replace(/\s+-\s+/g, ' – ');

  // Split nicely into up to 2 balanced lines for readability
  const words = text.split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= 22) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === 1) break;
    }
  }
  if (current && lines.length < 2) {
    lines.push(current);
  }
  if (lines.length === 2 && words.join(' ').length > lines.join(' ').length + 2) {
    lines[1] = `${lines[1].slice(0, 19).trimEnd()}…`;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={12 + i * 14}
          textAnchor="middle"
          fill="#475569"
          fontSize={11}
          fontWeight={500}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function CustomStackedTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: RouteVolumeSummary }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-3.5 text-xs max-w-xs">
      <p className="font-semibold text-slate-900 mb-2 leading-snug">
        {item.tuyenDoan}
      </p>
      <div className="space-y-1.5 tabular-nums">
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-500">Tổng thiết kế:</span>
          <strong className="text-slate-900">
            {formatMeters(item.designLength)} m
          </strong>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-sm bg-blue-600" />
            Thực tế lũy kế:
          </span>
          <strong className="text-blue-700">
            {formatMeters(item.actualLength)} m
          </strong>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-sm bg-slate-300" />
            Còn lại (Thiết kế - Thực tế):
          </span>
          <strong className="text-slate-700">
            {formatMeters(item.remainingLength)} m
          </strong>
        </div>
        <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-slate-500">Hoàn thành:</span>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
            {formatPercent(item.progressPercent)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function RouteStackedBarChart({ tasks }: RouteStackedBarChartProps) {
  const routeData = aggregateByRoute(tasks);
  const hasExcess = routeData.some((r) => r.excessLength > 0);

  // Stacked breakdown: Thực tế (capped at Thiết kế if excess) + Phần còn lại = Tổng Thiết kế
  const chartData = routeData.map((r) => ({
    ...r,
    actualWithinDesign: Math.min(r.actualLength, r.designLength),
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Khối lượng Thiết kế vs Thực tế theo Tuyến / Đoạn
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng chiều cao cột thể hiện khối lượng thiết kế (m), phân tách phần đã
            thi công và phần còn lại
          </p>
        </div>
        <span className="self-start sm:self-center text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg tabular-nums">
          Đơn vị: mét (m)
        </span>
      </div>

      <div className="flex-1 min-h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 4, bottom: 26 }}
            barCategoryGap="24%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="tuyenDoan"
              interval={0}
              height={46}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={<CustomWrappedTick />}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val: number) =>
                val >= 1000 ? `${(val / 1000).toLocaleString('vi-VN')}k` : `${val}`
              }
            />
            <Tooltip
              content={<CustomStackedTooltip />}
              cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', color: '#475569' }}
            />
            <Bar
              dataKey="actualWithinDesign"
              name="Khối lượng Thực tế (m)"
              stackId="volume"
              fill="#2563eb"
              radius={[0, 0, 4, 4]}
              maxBarSize={64}
              isAnimationActive={false}
            />
            <Bar
              dataKey="remainingLength"
              name="Còn lại theo Thiết kế (m)"
              stackId="volume"
              fill="#cbd5e1"
              radius={[6, 6, 0, 0]}
              maxBarSize={64}
              isAnimationActive={false}
            />
            {hasExcess && (
              <Bar
                dataKey="excessLength"
                name="Vượt Thiết kế (m)"
                stackId="volume"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={64}
                isAnimationActive={false}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
