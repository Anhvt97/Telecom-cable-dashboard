export type StatusCategory =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'NOT_STARTED'
  | 'BLOCKED';

export interface StatusMeta {
  category: StatusCategory;
  label: string;
  shortLabel: string;
  colorHex: string;
  trackHex: string;
  badgeClasses: string;
  dotClass: string;
  progressBarClass: string;
}

export interface ConstructionTask {
  id: string;
  ngayCapNhat: string;
  stt: number;
  hangMuc: string;
  tuyenDoan: string;
  khoiLuongThietKe: number;
  khoiLuongThucTe: number;
  tienDo: number;
  batDauKeHoach: string;
  ketThucKeHoach: string;
  batDauThucTe: string;
  trangThaiRaw: string;
  statusCategory: StatusCategory;
  phuTrach: string;
  vanDeTonDong: string;
}

export interface KpiSummary {
  totalDesignLength: number;
  totalActualLength: number;
  remainingLength: number;
  overallProgress: number;
  bottleneckCount: number;
  totalTasks: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  latestUpdateDate: string;
}

export interface RouteVolumeSummary {
  tuyenDoan: string;
  shortName: string;
  designLength: number;
  actualLength: number;
  remainingLength: number;
  excessLength: number;
  progressPercent: number;
  taskCount: number;
}
