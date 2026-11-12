import { useState } from 'react';
import {
  Building2,
  Cable,
  Clock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function PendingApprovalPage() {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      await refreshProfile();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Top Corporate Accent */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-4 flex items-center gap-3 text-white">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Cable className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-100">
              Tiến độ Thi công Tuyến cáp Viễn thông
            </p>
            <h1 className="text-sm font-bold tracking-tight">
              Xác nhận Phê duyệt Tài khoản
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5">
            <Clock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Tài khoản đang chờ phê duyệt
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Đăng ký thành công! Tài khoản của bạn hiện đang ở trạng thái{' '}
            <strong className="text-amber-700">Chờ duyệt</strong>. Vui lòng liên
            hệ <strong>Chỉ huy trưởng (Admin)</strong> để kích hoạt quyền truy
            cập vào Dashboard.
          </p>

          {/* Account Info Summary */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-left space-y-2.5 mb-6 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email:
              </span>
              <strong className="text-slate-900 truncate">
                {profile?.email || user?.email || '—'}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                Họ và tên:
              </span>
              <strong className="text-slate-900 truncate">
                {profile?.full_name || '—'}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Đơn vị:
              </span>
              <strong className="text-slate-900 truncate">
                {profile?.team_name || 'Chưa cập nhật'}
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => void handleCheckStatus()}
              disabled={isChecking}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`}
              />
              {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra lại trạng thái'}
            </button>

            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
