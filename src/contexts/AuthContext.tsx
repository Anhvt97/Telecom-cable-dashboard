import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile, UserRole } from '../types/auth';

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  teamName: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAuthLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildFallbackProfile(user: User): UserProfile {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawRole = meta.role === 'admin' ? 'admin' : 'user';
  return {
    id: user.id,
    email: user.email ?? '',
    full_name:
      typeof meta.full_name === 'string' && meta.full_name.trim()
        ? meta.full_name.trim()
        : user.email?.split('@')[0] ?? 'Người dùng',
    role: rawRole as UserRole,
    team_name:
      typeof meta.team_name === 'string' ? meta.team_name.trim() : '',
    is_approved: false,
  };
}

async function loadUserProfile(user: User): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, team_name, is_approved, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    return buildFallbackProfile(user);
  }

  return {
    id: data.id as string,
    email: (data.email as string) || user.email || '',
    full_name:
      (data.full_name as string) ||
      buildFallbackProfile(user).full_name,
    role: data.role === 'admin' ? 'admin' : 'user',
    team_name: (data.team_name as string) || '',
    is_approved: Boolean(data.is_approved),
    created_at: data.created_at as string | undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const syncSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    const nextUser = nextSession?.user ?? null;
    setUser(nextUser);

    if (nextUser) {
      const loaded = await loadUserProfile(nextUser);
      setProfile(loaded);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        await syncSession(data.session ?? null);
      })
      .finally(() => {
        if (mounted) setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession).finally(() => {
        if (mounted) setIsAuthLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      throw new Error(translateAuthError(error.message));
    }
  }, []);

  const signUp = useCallback(
    async ({ email, password, fullName, teamName }: SignUpParams) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            team_name: teamName.trim(),
          },
        },
      });

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      return {
        needsEmailConfirm: !data.session,
      };
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(translateAuthError(error.message));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const loaded = await loadUserProfile(user);
    setProfile(loaded);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAuthLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return ctx;
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không chính xác.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư đến.';
  }
  if (lower.includes('user already registered')) {
    return 'Email này đã được đăng ký trước đó.';
  }
  if (lower.includes('password should be at least')) {
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  }
  return message;
}
