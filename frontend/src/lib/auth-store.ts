import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setRole: (role: string | null) => void;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  role: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (loading) => set({ loading }),
  setRole: (role) => set({ role }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, role: null });
  },
  initialize: () => {
    set({ loading: true });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        set({ session, user: session?.user ?? null });
        
        if (session?.user) {
          setTimeout(async () => {
            const { data } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();
            
            set({ role: data?.role ?? 'operator', loading: false });
          }, 0);
        } else {
          set({ role: null, loading: false });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null });
      
      if (session?.user) {
        setTimeout(async () => {
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          set({ role: data?.role ?? 'operator', loading: false });
        }, 0);
      } else {
        set({ loading: false });
      }
    });

    return () => subscription.unsubscribe();
  },
}));
