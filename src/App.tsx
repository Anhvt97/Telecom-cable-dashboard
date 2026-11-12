import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Cable,
  CalendarClock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { DataGridSection } from './components/DataGridSection';
import { ErrorBoundary, FetchErrorCard } from './components/ErrorBoundary';
import { KpiCards } from './components/KpiCards';
import { RouteStackedBarChart } from './components/RouteStackedBarChart';
import { StatusDonutChart } from './components/StatusDonutChart';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TimelineGanttChart } from './components/TimelineGanttChart';
import type { ConstructionTask, StatusCategory } from './types/construction';
import {
  GOOGLE_SHEET_CSV_URL,
  computeKpiSummary,
  fetchConstructionData,
  formatDateVN,
} from './utils/csvParser';

function TelecomDashboard() {
  const [tasks, setTasks] = useState<ConstructionTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusCategory | 'ALL'>('ALL');
  const [selectedTask, setSelectedTask] = useState<ConstructionTask | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const parsed = await fetchConstructionData(true);
      setTasks(parsed);
      setLastSyncedAt(new Date());
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Lỗi không xác định khi tải dữ liệu CSV.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchConstructionData(false)
      .then((parsed) => {
        if (!active) return;
        setTasks(parsed);
        setLastSyncedAt(new Date());
        setErrorMessage(null);
      })
      .catch((err) => {
        if (!active) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Lỗi không xác định khi tải dữ liệu CSV.';
        setErrorMessage(msg);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const kpiSummary = useMemo(() => computeKpiSummary(tasks), [tasks]);

  const handleToggleBottlenecks = () => {
    setStatusFilter((prev) => (prev === 'BLOCKED' ? 'ALL' : 'BLOCKED'));
    const el = document.getElementById('data-grid-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Corporate Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-sm shadow-blue-600/25 flex items-center justify-center shrink-0">
              <Cable className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Báo cáo Tiến độ Thi công Tuyến cáp Viễn thông
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Google Sheets
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hệ thống theo dõi khối lượng, tiến độ và cảnh báo điểm nghẽn hiện trường
              </p>
            </div>
          </div>

          {/* Right Sync Metadata & Refresh Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {kpiSummary.latestUpdateDate && !isLoading && !errorMessage && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 text-xs text-slate-700 tabular-nums">
                <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Số liệu ngày:{' '}
                  <strong className="font-semibold text-slate-900">
                    {formatDateVN(kpiSummary.latestUpdateDate)}
                  </strong>
                </span>
              </div>
            )}

            {lastSyncedAt && !errorMessage && (
              <span className="hidden xl:inline text-[11px] text-slate-400 tabular-nums">
                Đồng bộ lúc{' '}
                {lastSyncedAt.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}

            <a
              href={GOOGLE_SHEET_CSV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              title="Tải nguồn dữ liệu CSV gốc"
            >
              <span>Nguồn CSV</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isRefreshing ? 'Đang đồng bộ...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {isLoading ? (
          <DashboardSkeleton />
        ) : errorMessage ? (
          <FetchErrorCard
            message={errorMessage}
            onRetry={() => void handleRefresh()}
            isRetrying={isRefreshing}
          />
        ) : (
          <>
            {/* 1. Top Level KPI Summary Cards */}
            <KpiCards
              summary={kpiSummary}
              onSelectBottlenecks={handleToggleBottlenecks}
              isFilteringBottlenecks={statusFilter === 'BLOCKED'}
            />

            {/* 2. Chart Section */}
            <section
              aria-label="Biểu đồ trực quan hóa tiến độ"
              className="grid grid-cols-1 lg:grid-cols-12 gap-5"
            >
              {/* Donut Chart: Status Distribution */}
              <div className="lg:col-span-5 xl:col-span-4">
                <StatusDonutChart
                  tasks={tasks}
                  activeStatus={statusFilter}
                  onSelectStatus={setStatusFilter}
                />
              </div>

              {/* Stacked Bar Chart: Design vs Actual by Route */}
              <div className="lg:col-span-7 xl:col-span-8">
                <RouteStackedBarChart tasks={tasks} />
              </div>

              {/* Timeline / Gantt Chart: Planned Schedule vs Progress */}
              <div className="lg:col-span-12">
                <TimelineGanttChart
                  tasks={tasks}
                  latestUpdateDate={kpiSummary.latestUpdateDate}
                  onSelectTask={setSelectedTask}
                />
              </div>
            </section>

            {/* 3. Data Grid Section */}
            <DataGridSection
              tasks={tasks}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onSelectTask={setSelectedTask}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Dashboard Báo cáo Tiến độ Thi công Tuyến cáp Viễn thông
          </span>
          <span>
            Dữ liệu đồng bộ trực tiếp từ Google Sheets CSV qua PapaParse
          </span>
        </div>
      </footer>

      {/* Task Detail Inspection Modal */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TelecomDashboard />
    </ErrorBoundary>
  );
}
