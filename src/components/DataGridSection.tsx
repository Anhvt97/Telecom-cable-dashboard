import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  Eye,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import type { UserRole } from '../types/auth';
import type { ConstructionTask, StatusCategory } from '../types/construction';
import {
  STATUS_META,
  STATUS_ORDER,
  formatDateVN,
  formatMeters,
  formatPercent,
  parseUtcDateMs,
} from '../utils/csvParser';
import { ProgressBarCell, StatusBadge } from './StatusBadge';

interface DataGridSectionProps {
  tasks: ConstructionTask[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: StatusCategory | 'ALL';
  onStatusFilterChange: (status: StatusCategory | 'ALL') => void;
  onSelectTask: (task: ConstructionTask) => void;
  userRole: UserRole;
  userTeamName: string;
  onAddNew?: () => void;
  onEditTask: (task: ConstructionTask) => void;
  onDeleteTask?: (task: ConstructionTask) => void;
}

export function canUserEditTask(
  task: ConstructionTask,
  userRole: UserRole,
  userTeamName: string
): boolean {
  if (userRole === 'admin') return true;
  const normalizedTeam = userTeamName.trim().toLowerCase();
  if (!normalizedTeam) return false;
  return task.phuTrach.trim().toLowerCase() === normalizedTeam;
}

type SortField =
  | 'stt'
  | 'khoiLuongThietKe'
  | 'khoiLuongThucTe'
  | 'tienDo'
  | 'batDauKeHoach';
type SortDirection = 'asc' | 'desc';

export function DataGridSection({
  tasks,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectTask,
  userRole,
  userTeamName,
  onAddNew,
  onEditTask,
  onDeleteTask,
}: DataGridSectionProps) {
  const [sortField, setSortField] = useState<SortField>('stt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const statusCounts = useMemo(() => {
    const counts: Record<StatusCategory, number> = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      NOT_STARTED: 0,
      BLOCKED: 0,
    };
    for (const t of tasks) {
      counts[t.statusCategory] += 1;
    }
    return counts;
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      const matchesStatus =
        statusFilter === 'ALL' || task.statusCategory === statusFilter;
      if (!matchesStatus) return false;

      if (!q) return true;
      return (
        task.hangMuc.toLowerCase().includes(q) ||
        task.tuyenDoan.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'batDauKeHoach') {
        const msA = parseUtcDateMs(a.batDauKeHoach) ?? 0;
        const msB = parseUtcDateMs(b.batDauKeHoach) ?? 0;
        cmp = msA - msB;
      } else {
        cmp = a[sortField] - b[sortField];
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [tasks, searchQuery, statusFilter, sortField, sortDirection]);

  const filteredTotals = useMemo(() => {
    let design = 0;
    let actual = 0;
    for (const t of filteredAndSortedTasks) {
      design += t.khoiLuongThietKe;
      actual += t.khoiLuongThucTe;
    }
    const progress = design > 0 ? (actual / design) * 100 : 0;
    return { design, actual, progress };
  }, [filteredAndSortedTasks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const hasActiveFilter = searchQuery.trim() !== '' || statusFilter !== 'ALL';

  const resetFilters = () => {
    onSearchChange('');
    onStatusFilterChange('ALL');
  };

  return (
    <section
      id="data-grid-section"
      aria-label="Bảng dữ liệu chi tiết tiến độ"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
    >
      {/* Toolbar Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Table2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Bảng dữ liệu Chi tiết Tiến độ Thi công
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tabular-nums border border-blue-100">
              {filteredAndSortedTasks.length} / {tasks.length} hạng mục
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Nhấp vào từng dòng để xem đầy đủ thông số, tiến độ và ghi chú hiện trường
          </p>
        </div>

        {/* Search & Status Dropdown Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm Hạng mục hoặc Tuyến/Đoạn..."
              aria-label="Tìm kiếm theo Hạng mục hoặc Tuyến/Đoạn"
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown Filter */}
          <div className="relative sm:w-56">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) =>
                onStatusFilterChange(e.target.value as StatusCategory | 'ALL')
              }
              aria-label="Lọc theo Trạng thái"
              className="w-full appearance-none pl-9 pr-9 py-2 text-sm font-medium bg-slate-50/80 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái ({tasks.length})</option>
              {STATUS_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {STATUS_META[cat].label} ({statusCounts[cat]})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại
            </button>
          )}

          {userRole === 'admin' && onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/20 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm mới đầu việc
            </button>
          )}
        </div>
      </div>

      {/* Empty Search / Filter State */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">
            Không tìm thấy hạng mục phù hợp
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Xem tất cả dữ liệu
          </button>
        </div>
      ) : (
        <>
          {/* Desktop / Tablet Data Grid */}
          <div className="hidden md:block overflow-x-auto dashboard-scroll">
            <table className="w-full text-left border-collapse min-w-[1140px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-3 w-16">
                    <button
                      type="button"
                      onClick={() => handleSort('stt')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      STT
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-3 min-w-[210px]">
                    Hạng mục / Đầu việc
                  </th>
                  <th className="py-3.5 px-3 min-w-[180px]">Tuyến / Đoạn</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('khoiLuongThietKe')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer ml-auto"
                    >
                      Thiết kế (m)
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('khoiLuongThucTe')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer ml-auto"
                    >
                      Thực tế (m)
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-3 min-w-[155px]">
                    <button
                      type="button"
                      onClick={() => handleSort('tienDo')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Tiến độ (%)
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('batDauKeHoach')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Kế hoạch / Thực tế
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3.5 px-3 min-w-[165px]">
                    Phụ trách / Đơn vị
                  </th>
                  <th className="py-3.5 px-3 min-w-[200px]">
                    Vấn đề tồn đọng
                  </th>
                  <th className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAndSortedTasks.map((task) => {
                  const isBlocked = task.statusCategory === 'BLOCKED';
                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`group transition-colors cursor-pointer ${
                        isBlocked
                          ? 'bg-red-50/25 hover:bg-red-50/60'
                          : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <td className="py-4 pl-6 pr-3 align-top">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-800 text-xs font-bold text-slate-700 tabular-nums transition-colors">
                          {task.stt}
                        </span>
                      </td>
                      <td className="py-4 px-3 align-top">
                        <div className="font-semibold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                          {task.hangMuc}
                        </div>
                        {task.ngayCapNhat && (
                          <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                            Cập nhật: {formatDateVN(task.ngayCapNhat)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-3 align-top text-xs text-slate-600 leading-relaxed">
                        {task.tuyenDoan}
                      </td>
                      <td className="py-4 px-3 align-top text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatMeters(task.khoiLuongThietKe)}
                      </td>
                      <td className="py-4 px-3 align-top text-right font-semibold text-blue-700 tabular-nums whitespace-nowrap">
                        {formatMeters(task.khoiLuongThucTe)}
                      </td>
                      <td className="py-4 px-3 align-top">
                        <div className="pt-0.5">
                          <ProgressBarCell
                            percent={task.tienDo}
                            statusCategory={task.statusCategory}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-3 align-top text-xs tabular-nums whitespace-nowrap">
                        <div className="text-slate-700 font-medium">
                          {formatDateVN(task.batDauKeHoach)} →{' '}
                          {formatDateVN(task.ketThucKeHoach)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          TT:{' '}
                          <span
                            className={
                              task.batDauThucTe
                                ? 'text-slate-600 font-medium'
                                : 'text-slate-400 italic'
                            }
                          >
                            {task.batDauThucTe
                              ? formatDateVN(task.batDauThucTe)
                              : 'Chưa bắt đầu'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 align-top">
                        <StatusBadge
                          statusCategory={task.statusCategory}
                          rawLabel={task.trangThaiRaw}
                        />
                      </td>
                      <td className="py-4 px-3 align-top text-xs text-slate-600 leading-relaxed">
                        {task.phuTrach || '—'}
                      </td>
                      <td className="py-4 px-3 align-top">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs leading-relaxed line-clamp-2 ${
                              isBlocked
                                ? 'text-red-700 font-medium'
                                : 'text-slate-500'
                            }`}
                            title={task.vanDeTonDong}
                          >
                            {isBlocked && (
                              <AlertCircle className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-red-500" />
                            )}
                            {task.vanDeTonDong || '—'}
                          </p>
                        </div>
                      </td>
                      <td
                        className="py-4 pl-3 pr-6 align-top text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectTask(task)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canUserEditTask(task, userRole, userTeamName) && (
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              title={
                                userRole === 'admin'
                                  ? 'Chỉnh sửa đầu việc'
                                  : 'Cập nhật tiến độ đơn vị'
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>{userRole === 'admin' ? 'Sửa' : 'Cập nhật'}</span>
                            </button>
                          )}
                          {userRole === 'admin' && onDeleteTask && (
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task)}
                              title="Xóa đầu việc"
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Card List */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredAndSortedTasks.map((task) => {
              const isBlocked = task.statusCategory === 'BLOCKED';
              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`p-4 space-y-3 cursor-pointer active:bg-slate-50 ${
                    isBlocked ? 'bg-red-50/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 tabular-nums">
                          #{task.stt}
                        </span>
                        <StatusBadge
                          statusCategory={task.statusCategory}
                          rawLabel={task.trangThaiRaw}
                        />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                        {task.hangMuc}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {task.tuyenDoan}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-2.5 tabular-nums">
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Thiết kế
                      </span>
                      <strong className="text-slate-900">
                        {formatMeters(task.khoiLuongThietKe)} m
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Thực tế lũy kế
                      </span>
                      <strong className="text-blue-700">
                        {formatMeters(task.khoiLuongThucTe)} m
                      </strong>
                    </div>
                    <div className="col-span-2 pt-1">
                      <ProgressBarCell
                        percent={task.tienDo}
                        statusCategory={task.statusCategory}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between gap-2 tabular-nums">
                      <span className="text-slate-400">Kế hoạch:</span>
                      <span className="font-medium">
                        {formatDateVN(task.batDauKeHoach)} →{' '}
                        {formatDateVN(task.ketThucKeHoach)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 shrink-0">Đơn vị:</span>
                      <span className="text-right truncate">{task.phuTrach}</span>
                    </div>
                  </div>

                  {task.vanDeTonDong && (
                    <div
                      className={`text-xs rounded-xl px-3 py-2 ${
                        isBlocked
                          ? 'bg-red-50 text-red-700 border border-red-100 font-medium'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {task.vanDeTonDong}
                    </div>
                  )}

                  {(canUserEditTask(task, userRole, userTeamName) ||
                    (userRole === 'admin' && onDeleteTask)) && (
                    <div
                      className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canUserEditTask(task, userRole, userTeamName) && (
                        <button
                          type="button"
                          onClick={() => onEditTask(task)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {userRole === 'admin' ? 'Sửa' : 'Cập nhật'}
                        </button>
                      )}
                      {userRole === 'admin' && onDeleteTask && (
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Filtered Summary Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 tabular-nums">
            <div>
              Đang hiển thị{' '}
              <strong className="text-slate-900">
                {filteredAndSortedTasks.length}
              </strong>{' '}
              hạng mục
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Tổng Thiết kế:{' '}
                <strong className="text-slate-900">
                  {formatMeters(filteredTotals.design)} m
                </strong>
              </span>
              <span>
                Tổng Thực tế:{' '}
                <strong className="text-blue-700">
                  {formatMeters(filteredTotals.actual)} m
                </strong>
              </span>
              <span>
                Tỷ lệ đạt:{' '}
                <strong className="text-slate-900">
                  {formatPercent(filteredTotals.progress)}%
                </strong>
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
