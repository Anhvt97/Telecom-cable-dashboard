import { supabase } from '../lib/supabaseClient';
import type { UserProfile, UserRole } from '../types/auth';

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, team_name, is_approved, created_at')
    .order('is_approved', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Không thể tải danh sách người dùng: ${error.message}`);
  }

  return ((data as UserProfile[] | null) ?? []).map((row) => ({
    ...row,
    role: row.role === 'admin' ? 'admin' : 'user',
    is_approved: Boolean(row.is_approved),
    full_name: row.full_name ?? '',
    team_name: row.team_name ?? '',
  }));
}

export async function setUserApproval(
  userId: string,
  isApproved: boolean
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: isApproved })
    .eq('id', userId);

  if (error) {
    throw new Error(`Không thể cập nhật trạng thái duyệt: ${error.message}`);
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    throw new Error(`Không thể thay đổi vai trò: ${error.message}`);
  }
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const { error: rpcError } = await supabase.rpc('admin_delete_user', {
    target_user_id: userId,
  });

  if (!rpcError) return;

  // Fallback: delete from public.profiles if RPC has not been created yet
  const { error: fallbackError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (fallbackError) {
    throw new Error(
      `Không thể xóa tài khoản: ${rpcError.message || fallbackError.message}`
    );
  }
}
