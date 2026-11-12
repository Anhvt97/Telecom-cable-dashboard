import { supabase } from '../lib/supabaseClient';
import type { ConstructionTask } from '../types/construction';
import { normalizeStatusCategory } from '../utils/csvParser';

export interface CableProgressRow {
  id: string;
  updated_at: string;
  stt: number;
  task_name: string;
  route_segment: string;
  design_volume: number;
  actual_volume: number;
  plan_start: string | null;
  plan_end: string | null;
  actual_start: string | null;
  status: string;
  team_in_charge: string;
  blockers: string | null;
}

export interface CableProgressPayload {
  stt: number;
  task_name: string;
  route_segment: string;
  design_volume: number;
  actual_volume: number;
  plan_start: string | null;
  plan_end: string | null;
  actual_start: string | null;
  status: string;
  team_in_charge: string;
  blockers: string | null;
}

export interface UserEditablePayload {
  actual_volume: number;
  status: string;
  blockers: string | null;
}

export function mapRowToTask(row: CableProgressRow): ConstructionTask {
  const design = Number(row.design_volume) || 0;
  const actual = Number(row.actual_volume) || 0;
  const progress =
    design > 0 ? Math.max(0, Math.min(100, (actual / design) * 100)) : 0;
  const statusCategory = normalizeStatusCategory(row.status ?? '');
  const updatedDateOnly = row.updated_at ? row.updated_at.slice(0, 10) : '';

  return {
    id: row.id,
    ngayCapNhat: updatedDateOnly,
    stt: Number(row.stt) || 0,
    hangMuc: row.task_name ?? '',
    tuyenDoan: row.route_segment ?? '',
    khoiLuongThietKe: design,
    khoiLuongThucTe: actual,
    tienDo: progress,
    batDauKeHoach: row.plan_start ?? '',
    ketThucKeHoach: row.plan_end ?? '',
    batDauThucTe: row.actual_start ?? '',
    trangThaiRaw: row.status ?? '',
    statusCategory,
    phuTrach: row.team_in_charge ?? '',
    vanDeTonDong: row.blockers ?? '',
  };
}

export async function fetchCableProgress(): Promise<ConstructionTask[]> {
  const { data, error } = await supabase
    .from('cable_progress')
    .select('*')
    .order('stt', { ascending: true });

  if (error) {
    throw new Error(`Không thể tải dữ liệu từ Supabase: ${error.message}`);
  }

  return ((data as CableProgressRow[] | null) ?? []).map(mapRowToTask);
}

export async function createCableTask(
  payload: CableProgressPayload
): Promise<ConstructionTask> {
  const { data, error } = await supabase
    .from('cable_progress')
    .insert({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Không thể thêm đầu việc: ${error.message}`);
  }

  return mapRowToTask(data as CableProgressRow);
}

export async function updateCableTaskAdmin(
  id: string,
  payload: Partial<CableProgressPayload>
): Promise<ConstructionTask> {
  const { data, error } = await supabase
    .from('cable_progress')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Không thể cập nhật đầu việc: ${error.message}`);
  }

  return mapRowToTask(data as CableProgressRow);
}

export async function updateCableTaskUser(
  id: string,
  payload: UserEditablePayload
): Promise<ConstructionTask> {
  const { data, error } = await supabase
    .from('cable_progress')
    .update({
      actual_volume: payload.actual_volume,
      status: payload.status,
      blockers: payload.blockers,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(
      `Không thể cập nhật tiến độ (kiểm tra quyền đơn vị): ${error.message}`
    );
  }

  return mapRowToTask(data as CableProgressRow);
}

export async function deleteCableTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('cable_progress')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Không thể xóa đầu việc: ${error.message}`);
  }
}

export async function syncFromGoogleSheets(tasks: ConstructionTask[]): Promise<ConstructionTask[]> {
  if (tasks.length === 0) {
    throw new Error('Không có dữ liệu từ Google Sheets để đồng bộ.');
  }

  // 1. Delete old rows
  const { error: deleteError } = await supabase
    .from('cable_progress')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    throw new Error(`Lỗi xóa dữ liệu cũ khi đồng bộ: ${deleteError.message}`);
  }

  // 2. Insert new rows parsed from Google Sheets
  const rowsToInsert = tasks.map((t) => ({
    stt: t.stt,
    task_name: t.hangMuc,
    route_segment: t.tuyenDoan,
    design_volume: t.khoiLuongThietKe,
    actual_volume: t.khoiLuongThucTe,
    plan_start: t.batDauKeHoach || null,
    plan_end: t.ketThucKeHoach || null,
    actual_start: t.batDauThucTe || null,
    status: t.trangThaiRaw || 'Chưa bắt đầu',
    team_in_charge: t.phuTrach,
    blockers: t.vanDeTonDong || null,
    updated_at: new Date().toISOString(),
  }));

  const { data, error: insertError } = await supabase
    .from('cable_progress')
    .insert(rowsToInsert)
    .select('*')
    .order('stt', { ascending: true });

  if (insertError) {
    throw new Error(`Lỗi chèn dữ liệu mới từ Google Sheets: ${insertError.message}`);
  }

  return ((data as CableProgressRow[] | null) ?? []).map(mapRowToTask);
}

export function subscribeCableProgress(onChange: () => void): () => void {
  const channel = supabase
    .channel('cable_progress_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cable_progress' },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
