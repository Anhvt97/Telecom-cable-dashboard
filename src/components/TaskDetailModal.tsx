import { useEffect } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  MapPin,
  Ruler,
  X,
} from 'lucide-react';
import type { ConstructionTask } from '../types/construction';
import { formatDateVN, formatMeters } from '../utils/csvParser';
import { ProgressBarCell, StatusBadge } from './StatusBadge';

interface TaskDetailModalProps {
  task: ConstructionTask | null;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, onClose]);

  if (!task) return null;

  const isBlocked = task.statusCategory === 'BLOCKED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 tabular-nums">
                STT #{task.stt}
              </span>
              <StatusBadge
                statusCategory={task.statusCategory}
                rawLabel={task.trangThaiRaw}
                size="md"
              />
              {task.ngayCapNhat && (
                <span className="text-xs text-slate-500">
                  Cập nhật: {formatDateVN(task.ngayCapNhat)}
                </span>
              )}
            </div>
            <h3
              id="task-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
            >
              {task.hangMuc}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            aria-label="Đóng cửa sổ chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Route & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Tuyến / Đoạn
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {task.tuyenDoan || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Phụ trách / Đơn vị
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {task.phuTrach || '—'}
              </p>
            </div>
          </div>

          {/* Volume & Progress */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Ruler className="w-3.5 h-3.5 text-blue-600" />
              Khối lượng & Tiến độ
            </div>
            <div className="grid grid-cols-3 gap-3 tabular-nums">
              <div>
                <span className="text-xs text-slate-500 block">Thiết kế</span>
                <span className="text-base font-bold text-slate-900">
                  {formatMeters(task.khoiLuongThietKe)} m
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Thực tế lũy kế</span>
                <span className="text-base font-bold text-blue-700">
                  {formatMeters(task.khoiLuongThucTe)} m
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Còn lại</span>
                <span className="text-base font-bold text-slate-700">
                  {formatMeters(
                    Math.max(0, task.khoiLuongThietKe - task.khoiLuongThucTe)
                  )}{' '}
                  m
                </span>
              </div>
            </div>
            <div className="pt-1">
              <ProgressBarCell
                percent={task.tienDo}
                statusCategory={task.statusCategory}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Mốc thời gian thi công
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm tabular-nums">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-500 block">
                  Bắt đầu (Kế hoạch)
                </span>
                <span className="font-semibold text-slate-900">
                  {formatDateVN(task.batDauKeHoach)}
                </span>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-500 block">
                  Kết thúc (Kế hoạch)
                </span>
                <span className="font-semibold text-slate-900">
                  {formatDateVN(task.ketThucKeHoach)}
                </span>
              </div>
              <div className="bg-blue-50/60 rounded-lg px-3 py-2 border border-blue-100">
                <span className="text-xs text-blue-700 block">
                  Bắt đầu (Thực tế)
                </span>
                <span className="font-semibold text-blue-950">
                  {task.batDauThucTe
                    ? formatDateVN(task.batDauThucTe)
                    : 'Chưa triển khai'}
                </span>
              </div>
            </div>
          </div>

          {/* Issues / Notes */}
          <div
            className={`rounded-xl border p-4 ${
              isBlocked
                ? 'bg-red-50/70 border-red-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isBlocked ? 'text-red-700' : 'text-slate-500'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Vấn đề tồn đọng / Ghi chú hiện trường
            </div>
            <p
              className={`text-sm leading-relaxed ${
                isBlocked ? 'text-red-900 font-medium' : 'text-slate-700'
              }`}
            >
              {task.vanDeTonDong || 'Không có vấn đề tồn đọng.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
