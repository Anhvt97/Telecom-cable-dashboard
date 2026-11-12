import Papa from 'papaparse';
import type {
  ConstructionTask,
  KpiSummary,
  RouteVolumeSummary,
  StatusCategory,
  StatusMeta,
} from '../types/construction';

export const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS59Leq11w_Oal2D1R2qyTsXBxZre8UXS1bxCrrNBSUC6KfX-s18VuZwNwTKTyDTmg5xjSzcdIkBNJO/pub?gid=0&single=true&output=csv';

export const STATUS_ORDER: StatusCategory[] = [
  'COMPLETED',
  'IN_PROGRESS',
  'NOT_STARTED',
  'BLOCKED',
];

export const STATUS_META: Record<StatusCategory, StatusMeta> = {
  COMPLETED: {
    category: 'COMPLETED',
    label: 'Hoàn thành',
    shortLabel: 'Hoàn thành',
    colorHex: '#10b981', // emerald-500
    trackHex: '#d1fae5',
    badgeClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    dotClass: 'bg-emerald-500',
    progressBarClass: 'bg-emerald-500',
  },
  IN_PROGRESS: {
    category: 'IN_PROGRESS',
    label: 'Đang thi công',
    shortLabel: 'Đang thi công',
    colorHex: '#2563eb', // corporate blue-600
    trackHex: '#dbeafe',
    badgeClasses: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
    dotClass: 'bg-blue-600',
    progressBarClass: 'bg-blue-600',
  },
  NOT_STARTED: {
    category: 'NOT_STARTED',
    label: 'Chưa bắt đầu',
    shortLabel: 'Chưa bắt đầu',
    colorHex: '#64748b', // slate-500
    trackHex: '#e2e8f0',
    badgeClasses: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10',
    dotClass: 'bg-slate-400',
    progressBarClass: 'bg-slate-400',
  },
  BLOCKED: {
    category: 'BLOCKED',
    label: 'Tạm dừng/Vướng mắc',
    shortLabel: 'Tạm dừng',
    colorHex: '#ef4444', // red-500
    trackHex: '#fee2e2',
    badgeClasses: 'bg-red-50 text-red-700 border-red-200 ring-red-500/10',
    dotClass: 'bg-red-500',
    progressBarClass: 'bg-red-500',
  },
};

/**
 * Parses numbers exported from Google Sheets (supports both Vietnamese
 * thousands-dot format like "5.000" / "1.200,5" and English "5,000.5").
 */
export function parseLocaleNumber(raw: unknown): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : 0;
  }
  if (raw === null || raw === undefined) return 0;

  const cleaned = String(raw).trim().replace(/\s+/g, '');
  if (!cleaned) return 0;

  // Vietnamese thousands separator pattern: e.g. "5.000", "12.500.000"
  if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, '')) || 0;
  }

  // English thousands separator pattern: e.g. "5,000", "12,500,000"
  if (/^-?\d{1,3}(,\d{3})+$/.test(cleaned)) {
    return Number(cleaned.replace(/,/g, '')) || 0;
  }

  // Mixed separators: whichever separator appears last is the decimal separator
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // e.g. "1.200,5"
      return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }
    // e.g. "1,200.5"
    return Number(cleaned.replace(/,/g, '')) || 0;
  }

  // Single comma (likely decimal in Vietnamese, e.g. "65,5")
  if (lastComma !== -1) {
    return Number(cleaned.replace(',', '.')) || 0;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Parses percentage strings such as "100,0%", "65,0%", "24.5%", or "65".
 */
export function parsePercent(raw: unknown, fallbackActual = 0, fallbackDesign = 0): number {
  const rawStr = raw === null || raw === undefined ? '' : String(raw).trim();
  if (!rawStr) {
    return fallbackDesign > 0 ? Math.min(100, (fallbackActual / fallbackDesign) * 100) : 0;
  }

  const withoutSymbol = rawStr.replace(/%/g, '').trim();
  const value = parseLocaleNumber(withoutSymbol);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function normalizeStatusCategory(rawStatus: string): StatusCategory {
  const normalized = rawStatus.trim().toLowerCase();
  if (normalized.includes('hoàn thành')) return 'COMPLETED';
  if (normalized.includes('tạm dừng') || normalized.includes('vướng mắc')) return 'BLOCKED';
  if (normalized.includes('đang thi công')) return 'IN_PROGRESS';
  if (normalized.includes('chưa bắt đầu')) return 'NOT_STARTED';
  return 'NOT_STARTED';
}

const REQUIRED_HEADERS = [
  'Hạng mục / Đầu việc',
  'Tuyến / Đoạn',
  'Khối lượng Thiết kế (m)',
  'Trạng thái',
];

type RawCsvRow = Record<string, string | undefined>;

/**
 * Fetches and parses the telecom construction CSV directly from Google Sheets using PapaParse.
 */
export function fetchConstructionData(bustCache = false): Promise<ConstructionTask[]> {
  const url = bustCache
    ? `${GOOGLE_SHEET_CSV_URL}&_t=${Date.now()}`
    : GOOGLE_SHEET_CSV_URL;

  return new Promise((resolve, reject) => {
    Papa.parse<RawCsvRow>(url, {
      download: true,
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const fields = results.meta.fields ?? [];
        const missingHeaders = REQUIRED_HEADERS.filter((h) => !fields.includes(h));

        if (missingHeaders.length > 0) {
          reject(
            new Error(
              `Không tìm thấy các cột dữ liệu hợp lệ (${missingHeaders.join(', ')}). Vui lòng kiểm tra lại liên kết Google Sheets CSV.`
            )
          );
          return;
        }

        if (results.errors.length > 0 && results.data.length === 0) {
          reject(
            new Error(
              `Lỗi phân tích cú pháp CSV: ${results.errors[0]?.message ?? 'Không rõ nguyên nhân'}`
            )
          );
          return;
        }

        const tasks: ConstructionTask[] = results.data
          .filter((row) => {
            const hangMuc = (row['Hạng mục / Đầu việc'] ?? '').trim();
            const tuyen = (row['Tuyến / Đoạn'] ?? '').trim();
            return hangMuc.length > 0 || tuyen.length > 0;
          })
          .map((row, idx) => {
            const design = parseLocaleNumber(row['Khối lượng Thiết kế (m)']);
            const actual = parseLocaleNumber(row['Khối lượng Thực tế lũy kế (m)']);
            const progress = parsePercent(row['Tiến độ (%)'], actual, design);
            const trangThaiRaw = (row['Trạng thái'] ?? '').trim();
            const statusCategory = normalizeStatusCategory(trangThaiRaw);
            const sttParsed = parseLocaleNumber(row['STT']);

            return {
              id: `${sttParsed || idx + 1}-${idx}`,
              ngayCapNhat: (row['Ngày cập nhật'] ?? '').trim(),
              stt: sttParsed || idx + 1,
              hangMuc: (row['Hạng mục / Đầu việc'] ?? '').trim(),
              tuyenDoan: (row['Tuyến / Đoạn'] ?? '').trim(),
              khoiLuongThietKe: design,
              khoiLuongThucTe: actual,
              tienDo: progress,
              batDauKeHoach: (row['Bắt đầu (Kế hoạch)'] ?? '').trim(),
              ketThucKeHoach: (row['Kết thúc (Kế hoạch)'] ?? '').trim(),
              batDauThucTe: (row['Bắt đầu (Thực tế)'] ?? '').trim(),
              trangThaiRaw: trangThaiRaw || STATUS_META[statusCategory].label,
              statusCategory,
              phuTrach: (row['Phụ trách / Đơn vị'] ?? '').trim(),
              vanDeTonDong: (row['Vấn đề tồn đọng'] ?? '').trim(),
            };
          });

        if (tasks.length === 0) {
          reject(new Error('Tệp CSV không có dòng dữ liệu thi công nào.'));
          return;
        }

        resolve(tasks);
      },
      error: (err) => {
        reject(
          new Error(
            err?.message
              ? `Không thể tải dữ liệu từ Google Sheets: ${err.message}`
              : 'Không thể kết nối tới đường dẫn Google Sheets CSV.'
          )
        );
      },
    });
  });
}

export function computeKpiSummary(tasks: ConstructionTask[]): KpiSummary {
  let totalDesignLength = 0;
  let totalActualLength = 0;
  let bottleneckCount = 0;
  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let latestUpdateDate = '';

  for (const task of tasks) {
    totalDesignLength += task.khoiLuongThietKe;
    totalActualLength += task.khoiLuongThucTe;

    if (task.statusCategory === 'BLOCKED') bottleneckCount += 1;
    else if (task.statusCategory === 'COMPLETED') completedCount += 1;
    else if (task.statusCategory === 'IN_PROGRESS') inProgressCount += 1;
    else notStartedCount += 1;

    if (task.ngayCapNhat && task.ngayCapNhat > latestUpdateDate) {
      latestUpdateDate = task.ngayCapNhat;
    }
  }

  const remainingLength = Math.max(0, totalDesignLength - totalActualLength);
  const overallProgress =
    totalDesignLength > 0 ? (totalActualLength / totalDesignLength) * 100 : 0;

  return {
    totalDesignLength,
    totalActualLength,
    remainingLength,
    overallProgress,
    bottleneckCount,
    totalTasks: tasks.length,
    completedCount,
    inProgressCount,
    notStartedCount,
    latestUpdateDate,
  };
}

export function aggregateByRoute(tasks: ConstructionTask[]): RouteVolumeSummary[] {
  const map = new Map<
    string,
    { design: number; actual: number; count: number }
  >();

  for (const task of tasks) {
    const key = task.tuyenDoan || 'Chưa phân tuyến';
    const existing = map.get(key) ?? { design: 0, actual: 0, count: 0 };
    existing.design += task.khoiLuongThietKe;
    existing.actual += task.khoiLuongThucTe;
    existing.count += 1;
    map.set(key, existing);
  }

  return Array.from(map.entries()).map(([tuyenDoan, agg]) => {
    const remaining = Math.max(0, agg.design - agg.actual);
    const excess = Math.max(0, agg.actual - agg.design);
    const progressPercent = agg.design > 0 ? (agg.actual / agg.design) * 100 : 0;

    return {
      tuyenDoan,
      shortName: shortenLabel(tuyenDoan, 24),
      designLength: agg.design,
      actualLength: agg.actual,
      remainingLength: remaining,
      excessLength: excess,
      progressPercent,
      taskCount: agg.count,
    };
  });
}

export function shortenLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trimEnd()}…`;
}

export function formatMeters(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Parses YYYY-MM-DD (or DD/MM/YYYY) into UTC midnight milliseconds so day math
 * is immune to browser timezone / DST shifts.
 */
export function parseUtcDateMs(dateStr: string): number | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return Date.UTC(Number(y), Number(m) - 1, Number(d));
  }

  const vnMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (vnMatch) {
    const [, d, m, y] = vnMatch;
    return Date.UTC(Number(y), Number(m) - 1, Number(d));
  }

  const fallback = Date.parse(trimmed);
  return Number.isNaN(fallback) ? null : fallback;
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '—';
  const ms = parseUtcDateMs(dateStr);
  if (ms === null) return dateStr;
  const d = new Date(ms);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatShortDateFromMs(ms: number): string {
  const d = new Date(ms);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
