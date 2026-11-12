import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import {
  deleteUserAccount,
  fetchAllProfiles,
  setUserApproval,
  updateUserRole,
} from '../services/userManagementService';
import type { UserProfile, UserRole } from '../types/auth';

interface UserManagementSectionProps {
  currentUserId: string;
  onPendingCountChange?: (count: number) => void;
}

type ApprovalFilter = 'ALL' | 'PENDING' | 'APPROVED';

export function UserManagementSection({
  currentUserId,
  onPendingCountChange,
}: UserManagementSectionProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('ALL');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const list = await fetchAllProfiles();
      setUsers(list);
      onPendingCountChange?.(list.filter((u) => !u.is_approved).length);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách tài khoản.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const stats = useMemo(() => {
    const total = users.length;
    const pending = users.filter((u) => !u.is_approved).length;
    const approved = total - pending;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total, pending, approved, admins };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (approvalFilter === 'PENDING' && u.is_approved) return false;
      if (approvalFilter === 'APPROVED' && !u.is_approved) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        u.team_name.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, approvalFilter]);

  const handleToggleApproval = async (target: UserProfile) => {
    setBusyId(target.id);
    setErrorMessage(null);
    const nextApproved = !target.is_approved;
    try {
      await setUserApproval(target.id, nextApproved);
      const nextList = users.map((u) =>
        u.id === target.id ? { ...u, is_approved: nextApproved } : u
      );
      setUsers(nextList);
      onPendingCountChange?.(nextList.filter((u) => !u.is_approved).length);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái duyệt.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async (target: UserProfile, nextRole: UserRole) => {
    if (target.role === nextRole) return;
    setBusyId(target.id);
    setErrorMessage(null);
    try {
      await updateUserRole(target.id, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, role: nextRole } : u))
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi thay đổi vai trò.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (target: UserProfile) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa tài khoản "${target.email}"? Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    setBusyId(target.id);
    setErrorMessage(null);
    try {
      await deleteUserAccount(target.id);
      const nextList = users.filter((u) => u.id !== target.id);
      setUsers(nextList);
      onPendingCountChange?.(nextList.filter((u) => !u.is_approved).length);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể xóa tài khoản.'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top User Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tổng tài khoản
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Đang chờ duyệt
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Đã phê duyệt
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">
            {stats.approved}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-blue-200/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Quản trị (Admin)
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-700 tabular-nums">
            {stats.admins}
          </p>
        </div>
      </div>

      {/* User List Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Quản lý Người dùng & Phê duyệt Tài khoản
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phê duyệt tài khoản mới đăng ký, phân quyền Admin / User hoặc xóa
              tài khoản không hợp lệ
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm email, tên, đơn vị..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <select
              value={approvalFilter}
              onChange={(e) =>
                setApprovalFilter(e.target.value as ApprovalFilter)
              }
              className="px-3 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả ({stats.total})</option>
              <option value="PENDING">Chờ duyệt ({stats.pending})</option>
              <option value="APPROVED">Đã duyệt ({stats.approved})</option>
            </select>

            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
              Làm mới
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Không có tài khoản nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto dashboard-scroll">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-3">Người dùng / Đơn vị</th>
                  <th className="py-3.5 px-3">Email</th>
                  <th className="py-3.5 px-3">Vai trò (Role)</th>
                  <th className="py-3.5 px-3">Trạng thái duyệt</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUserId;
                  const isBusy = busyId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        !u.is_approved
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-4 pl-6 pr-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{u.full_name || 'Chưa cập nhật tên'}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {u.team_name || 'Chưa gán đơn vị'}
                        </div>
                      </td>

                      <td className="py-4 px-3 text-xs font-medium text-slate-700">
                        {u.email}
                      </td>

                      <td className="py-4 px-3">
                        <select
                          value={u.role}
                          disabled={isSelf || isBusy}
                          onChange={(e) =>
                            void handleRoleChange(u, e.target.value as UserRole)
                          }
                          aria-label={`Vai trò của ${u.email}`}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                            u.role === 'admin'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          } ${isSelf ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <option value="user">User (Đội trưởng)</option>
                          <option value="admin">Admin (Chỉ huy)</option>
                        </select>
                      </td>

                      <td className="py-4 px-3">
                        {u.is_approved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Chờ duyệt
                          </span>
                        )}
                      </td>

                      <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          {!u.is_approved ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleToggleApproval(u)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Phê duyệt
                            </button>
                          ) : (
                            !isSelf && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleToggleApproval(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 text-xs font-medium cursor-pointer"
                                title="Thu hồi quyền truy cập"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                Hủy duyệt
                              </button>
                            )
                          )}

                          {!isSelf && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleDelete(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 disabled:opacity-50 text-red-600 text-xs font-medium cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Xóa
                            </button>
                          )}

                          {isSelf && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 px-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                              Đang đăng nhập
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
