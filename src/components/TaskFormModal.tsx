import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Lock, Save, X } from 'lucide-react';
import type { UserRole } from '../types/auth';
import type { ConstructionTask } from '../types/construction';
import type {
  CableProgressPayload,
  UserEditablePayload,
} from '../services/cableProgressService';

const STATUS_OPTIONS = [
  'Chưa bắt đầu',
  'Đang thi công',
  'Tạm dừng/Vướng mắc',
  'Hoàn thành',
];

interface TaskFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  userRole: UserRole;
  initialTask: ConstructionTask | null;
  nextStt: number;
  onClose: () => void;
  onSaveAdmin: (
    payload: CableProgressPayload,
    taskId?: string
  ) => Promise<void>;
  onSaveUser: (taskId: string, payload: UserEditablePayload) => Promise<void>;
}

export function TaskFormModal({
  isOpen,
  mode,
  userRole,
  initialTask,
  nextStt,
  onClose,
  onSaveAdmin,
  onSaveUser,
}: TaskFormModalProps) {
  const isAdmin = userRole === 'admin';
  const isUserRestricted = !isAdmin && mode === 'edit';

  const [stt, setStt] = useState<string>('1');
  const [taskName, setTaskName] = useState<string>('');
  const [routeSegment, setRouteSegment] = useState<string>('');
  const [designVolume, setDesignVolume] = useState<string>('0');
  const [actualVolume, setActualVolume] = useState<string>('0');
  const [planStart, setPlanStart] = useState<string>('');
  const [planEnd, setPlanEnd] = useState<string>('');
  const [actualStart, setActualStart] = useState<string>('');
  const [status, setStatus] = useState<string>('Chưa bắt đầu');
  const [teamInCharge, setTeamInCharge] = useState<string>('');
  const [blockers, setBlockers] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);

    if (mode === 'edit' && initialTask) {
      setStt(String(initialTask.stt));
      setTaskName(initialTask.hangMuc);
      setRouteSegment(initialTask.tuyenDoan);
      setDesignVolume(String(initialTask.khoiLuongThietKe));
      setActualVolume(String(initialTask.khoiLuongThucTe));
      setPlanStart(initialTask.batDauKeHoach);
      setPlanEnd(initialTask.ketThucKeHoach);
      setActualStart(initialTask.batDauThucTe);
      setStatus(initialTask.trangThaiRaw || 'Chưa bắt đầu');
      setTeamInCharge(initialTask.phuTrach);
      setBlockers(initialTask.vanDeTonDong);
    } else {
      setStt(String(nextStt));
      setTaskName('');
      setRouteSegment('');
      setDesignVolume('0');
      setActualVolume('0');
      setPlanStart('');
      setPlanEnd('');
      setActualStart('');
      setStatus('Chưa bắt đầu');
      setTeamInCharge('');
      setBlockers('');
    }
  }, [isOpen, mode, initialTask, nextStt]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedActual = Number(actualVolume);
    if (!Number.isFinite(parsedActual) || parsedActual < 0) {
      setErrorMessage('Khối lượng thực tế phải là số không âm.');
      return;
    }

    setIsSaving(true);
    try {
      if (isUserRestricted && initialTask) {
        await onSaveUser(initialTask.id, {
          actual_volume: parsedActual,
          status,
          blockers: blockers.trim() || null,
        });
      } else {
        const parsedDesign = Number(designVolume);
        const parsedStt = Number(stt);
        if (!taskName.trim() || !routeSegment.trim() || !teamInCharge.trim()) {
          setErrorMessage(
            'Vui lòng nhập đầy đủ Hạng mục, Tuyến/Đoạn và Đơn vị phụ trách.'
          );
          setIsSaving(false);
          return;
        }
        if (!Number.isFinite(parsedDesign) || parsedDesign < 0) {
          setErrorMessage('Khối lượng thiết kế phải là số không âm.');
          setIsSaving(false);
          return;
        }

        await onSaveAdmin(
          {
            stt: Number.isFinite(parsedStt) && parsedStt > 0 ? parsedStt : nextStt,
            task_name: taskName.trim(),
            route_segment: routeSegment.trim(),
            design_volume: parsedDesign,
            actual_volume: parsedActual,
            plan_start: planStart || null,
            plan_end: planEnd || null,
            actual_start: actualStart || null,
            status,
            team_in_charge: teamInCharge.trim(),
            blockers: blockers.trim() || null,
          },
          mode === 'edit' ? initialTask?.id : undefined
        );
      }
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể lưu dữ liệu.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputBase =
    'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
  const readonlyInput =
    'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === 'create'
                ? 'Thêm mới Đầu việc Thi công'
                : isUserRestricted
                  ? 'Cập nhật Tiến độ Đơn vị'
                  : 'Chỉnh sửa Đầu việc Thi công'}
            </h3>
            {isUserRestricted && (
              <p className="text-xs text-blue-700 mt-0.5 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Quyền Đội trưởng: Chỉ được cập nhật Khối lượng thực tế, Trạng
                thái và Vấn đề tồn đọng.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  STT
                </label>
                <input
                  type="number"
                  min={1}
                  value={stt}
                  onChange={(e) => setStt(e.target.value)}
                  disabled={isUserRestricted}
                  className={isUserRestricted ? readonlyInput : inputBase}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hạng mục / Đầu việc *
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  disabled={isUserRestricted}
                  required
                  className={isUserRestricted ? readonlyInput : inputBase}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tuyến / Đoạn *
                </label>
                <input
                  type="text"
                  value={routeSegment}
                  onChange={(e) => setRouteSegment(e.target.value)}
                  disabled={isUserRestricted}
                  required
                  className={isUserRestricted ? readonlyInput : inputBase}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phụ trách / Đơn vị *
                </label>
                <input
                  type="text"
                  value={teamInCharge}
                  onChange={(e) => setTeamInCharge(e.target.value)}
                  disabled={isUserRestricted}
                  required
                  className={isUserRestricted ? readonlyInput : inputBase}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Khối lượng Thiết kế (m)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={designVolume}
                  onChange={(e) => setDesignVolume(e.target.value)}
                  disabled={isUserRestricted}
                  className={isUserRestricted ? readonlyInput : inputBase}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-700 mb-1">
                  Khối lượng Thực tế lũy kế (m) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={actualVolume}
                  onChange={(e) => setActualVolume(e.target.value)}
                  required
                  className={`${inputBase} border-blue-300 bg-blue-50/20 font-semibold`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-700 mb-1">
                  Trạng thái *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`${inputBase} border-blue-300 bg-blue-50/20 font-medium`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bắt đầu (Kế hoạch)
                </label>
                <input
                  type="date"
                  value={planStart}
                  onChange={(e) => setPlanStart(e.target.value)}
                  disabled={isUserRestricted}
                  className={isUserRestricted ? readonlyInput : inputBase}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kết thúc (Kế hoạch)
                </label>
                <input
                  type="date"
                  value={planEnd}
                  onChange={(e) => setPlanEnd(e.target.value)}
                  disabled={isUserRestricted}
                  className={isUserRestricted ? readonlyInput : inputBase}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bắt đầu (Thực tế)
                </label>
                <input
                  type="date"
                  value={actualStart}
                  onChange={(e) => setActualStart(e.target.value)}
                  disabled={isUserRestricted}
                  className={isUserRestricted ? readonlyInput : inputBase}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">
                Vấn đề tồn đọng / Ghi chú hiện trường
              </label>
              <textarea
                rows={3}
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Ghi nhận vướng mắc mặt bằng, vật tư hoặc tiến độ..."
                className={`${inputBase} border-blue-300 bg-blue-50/20`}
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
