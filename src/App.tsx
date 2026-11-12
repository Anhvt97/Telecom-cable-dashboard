import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Cable,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { AuthPage } from './components/AuthPage';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import {
  DataGridSection,
  canUserEditTask,
} from './components/DataGridSection';
import { ErrorBoundary, FetchErrorCard } from './components/ErrorBoundary';
import { KpiCards } from './components/KpiCards';
import { PendingApprovalPage } from './components/PendingApprovalPage';
import { RouteStackedBarChart } from './components/RouteStackedBarChart';
import { StatusDonutChart } from './components/StatusDonutChart';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskFormModal } from './components/TaskFormModal';
import { TimelineGanttChart } from './components/TimelineGanttChart';
import { UserManagementSection } from './components/UserManagementSection';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchAllProfiles } from './services/userManagementService';
import {
  createCableTask,
  deleteCableTask,
  fetchCableProgress,
  subscribeCableProgress,
  updateCableTaskAdmin,
  updateCableTaskUser,
  type CableProgressPayload,
  type UserEditablePayload,
} from './services/cableProgressService';
import type { ConstructionTask, StatusCategory } from './types/construction';
import { computeKpiSummary, formatDateVN } from './utils/csvParser';

function TelecomDashboard() {
  const { profile, user, signOut } = useAuth();
  const userRole = profile?.role ?? 'user';
  const userTeamName = profile?.team_name ?? '';
  const displayName =
    profile?.full_name || user?.email || 'Người dùng';

  const [tasks, setTasks] = useState<ConstructionTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusCategory | 'ALL'>(
    'ALL'
  );
  const [selectedTask, setSelectedTask] = useState<ConstructionTask | null>(
    null
  );

  // Admin active view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');
  const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);

  // Create / Edit modal state
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = useState<ConstructionTask | null>(null);

  useEffect(() => {
    if (userRole !== 'admin') return;
    let active = true;
    fetchAllProfiles()
      .then((list) => {
        if (active) {
          setPendingUsersCount(list.filter((u) => !u.is_approved).length);
        }
      })
      .catch(() => {
        // Ignore badge count error
      });
    return () => {
      active = false;
    };
  }, [userRole]);

  const loadTasksFromSupabase = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const data = await fetchCableProgress();
      setTasks(data);
      setLastSyncedAt(new Date());
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Lỗi không xác định khi tải dữ liệu từ Supabase.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchCableProgress()
      .then((data) => {
        if (!active) return;
        setTasks(data);
        setLastSyncedAt(new Date());
        setErrorMessage(null);
      })
      .catch((err) => {
        if (!active) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Lỗi không xác định khi tải dữ liệu từ Supabase.';
        setErrorMessage(msg);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const unsubscribe = subscribeCableProgress(() => {
      if (!active) return;
      void fetchCableProgress()
        .then((data) => {
          if (!active) return;
          setTasks(data);
          setLastSyncedAt(new Date());
        })
        .catch(() => {
          // Ignore transient realtime background errors
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const kpiSummary = useMemo(() => computeKpiSummary(tasks), [tasks]);

  const nextStt = useMemo(() => {
    if (tasks.length === 0) return 1;
    return Math.max(...tasks.map((t) => t.stt)) + 1;
  }, [tasks]);

  const handleToggleBottlenecks = () => {
    setStatusFilter((prev) => (prev === 'BLOCKED' ? 'ALL' : 'BLOCKED'));
    const el = document.getElementById('data-grid-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingTask(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (task: ConstructionTask) => {
    setFormMode('edit');
    setEditingTask(task);
    setFormModalOpen(true);
  };

  const handleSaveAdmin = async (
    payload: CableProgressPayload,
    taskId?: string
  ) => {
    if (taskId) {
      const updated = await updateCableTaskAdmin(taskId, payload);
      setTasks((prev) =>
        prev
          .map((t) => (t.id === updated.id ? updated : t))
          .sort((a, b) => a.stt - b.stt)
      );
    } else {
      const created = await createCableTask(payload);
      setTasks((prev) => [...prev, created].sort((a, b) => a.stt - b.stt));
    }
    setLastSyncedAt(new Date());
  };

  const handleSaveUser = async (
    taskId: string,
    payload: UserEditablePayload
  ) => {
    const updated = await updateCableTaskUser(taskId, payload);
    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    setLastSyncedAt(new Date());
  };

  const handleDeleteTask = async (task: ConstructionTask) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa đầu việc #${task.stt} "${task.hangMuc}"?`
    );
    if (!confirmed) return;

    try {
      await deleteCableTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setLastSyncedAt(new Date());
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'Không thể xóa đầu việc.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Corporate Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                  Supabase Realtime
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hệ thống theo dõi khối lượng, tiến độ và cảnh báo điểm nghẽn
                hiện trường
              </p>
            </div>
          </div>

          {/* Right User Info, Sync & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {kpiSummary.latestUpdateDate && !isLoading && !errorMessage && (
              <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 text-xs text-slate-700 tabular-nums">
                <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Cập nhật:{' '}
                  <strong className="font-semibold text-slate-900">
                    {formatDateVN(kpiSummary.latestUpdateDate)}
                  </strong>
                </span>
              </div>
            )}

            {lastSyncedAt && !errorMessage && (
              <span className="hidden 2xl:inline text-[11px] text-slate-400 tabular-nums">
                Đồng bộ{' '}
                {lastSyncedAt.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}

            {/* Authenticated User & Role Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  userRole === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {userRole === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 max-w-[130px] truncate">
                    {displayName}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      userRole === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {userRole === 'admin' ? 'Admin' : 'User'}
                  </span>
                </div>
                {userTeamName && (
                  <span className="text-[10px] text-slate-500 block max-w-[180px] truncate">
                    {userTeamName}
                  </span>
                )}
              </div>
            </div>

            {userRole === 'admin' && (
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Tiến độ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Quản lý người dùng</span>
                  {pendingUsersCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none tabular-nums">
                      {pendingUsersCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {userRole === 'admin' && activeTab === 'dashboard' && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thêm đầu việc</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void loadTasksFromSupabase(true)}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {userRole === 'admin' && activeTab === 'users' ? (
          <UserManagementSection
            currentUserId={user?.id ?? ''}
            onPendingCountChange={setPendingUsersCount}
          />
        ) : isLoading ? (
          <DashboardSkeleton />
        ) : errorMessage ? (
          <FetchErrorCard
            message={errorMessage}
            onRetry={() => void loadTasksFromSupabase(true)}
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
              <div className="lg:col-span-5 xl:col-span-4">
                <StatusDonutChart
                  tasks={tasks}
                  activeStatus={statusFilter}
                  onSelectStatus={setStatusFilter}
                />
              </div>

              <div className="lg:col-span-7 xl:col-span-8">
                <RouteStackedBarChart tasks={tasks} />
              </div>

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
              userRole={userRole}
              userTeamName={userTeamName}
              onAddNew={userRole === 'admin' ? handleOpenCreate : undefined}
              onEditTask={handleOpenEdit}
              onDeleteTask={
                userRole === 'admin' ? handleDeleteTask : undefined
              }
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
            Xác thực & Lưu trữ thời gian thực trên Supabase
          </span>
        </div>
      </footer>

      {/* Task Detail Inspection Modal */}
      <TaskDetailModal
        task={selectedTask}
        canEdit={
          selectedTask
            ? canUserEditTask(selectedTask, userRole, userTeamName)
            : false
        }
        onEdit={handleOpenEdit}
        onClose={() => setSelectedTask(null)}
      />

      {/* Create / Edit Task Modal */}
      <TaskFormModal
        isOpen={formModalOpen}
        mode={formMode}
        userRole={userRole}
        initialTask={editingTask}
        nextStt={nextStt}
        onClose={() => setFormModalOpen(false)}
        onSaveAdmin={handleSaveAdmin}
        onSaveUser={handleSaveUser}
      />
    </div>
  );
}

function AuthGate() {
  const { session, profile, isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading || typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (!session && path !== '/login' && path !== '/register') {
      window.history.replaceState(null, '', '/login');
    } else if (session && (path === '/login' || path === '/register')) {
      window.history.replaceState(null, '', '/');
    }
  }, [session, isAuthLoading]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 mb-4 animate-pulse">
          <Cable className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-600">
          Đang kiểm tra phiên đăng nhập...
        </p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (!profile?.is_approved) {
    return <PendingApprovalPage />;
  }

  return <TelecomDashboard />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ErrorBoundary>
  );
}
