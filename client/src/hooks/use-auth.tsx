import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, loginSchema, signupSchema } from "@shared/schema";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { z } from "zod";
import { supabase } from "../lib/supabase";

// Types for our context
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  logoutMutation: UseMutationResult<void, Error, void>;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  googleLogin: () => Promise<void>;
};

// Types for login and registration data
type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof signupSchema>;

// Create the context
export const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useLanguage();

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } else if (event === 'SIGNED_OUT') {
        queryClient.setQueryData(["/api/user"], null);
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Query to fetch the current user
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      // CHECK FOR LOCAL ADMIN BYPASS FIRST (DEV ONLY)
      if (import.meta.env.DEV) {
        const isLocalAdmin = localStorage.getItem('mock_admin_session') === 'true';
        if (isLocalAdmin) {
          return {
            id: 999999,
            username: "admin",
            email: "admin@elbeg.com",
            isAdmin: true,
            role: "admin",
            name: "Local Admin",
            createdAt: new Date().toISOString(),
          } as any;
        }
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const email = session.user.email;
        if (!email) return null;

        // Fetch user profile from public table using email
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user profile:", error);
          return null;
        }

        if (!profile) {
          // If profile doesn't exist (e.g. just logged in via OAuth), 
          // we might need to create it here or handle it in callback
          return null;
        }

        // Map snake_case to camelCase for the User type
        return {
          ...profile,
          isAdmin: profile.is_admin,
          createdAt: profile.created_at,
          googleId: profile.google_id,
          profileImageUrl: profile.profile_image_url
        } as User;
      } catch (err) {
        console.error("Auth query error:", err);
        return null;
      }
    },
    staleTime: Infinity, // Rely on auth state changes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      // CHECK FOR LOCAL ADMIN BYPASS (DEV ONLY)
      if (import.meta.env.DEV && data.username === 'admin' && data.password === 'admin123') {
        localStorage.setItem('mock_admin_session', 'true');
        return {
          id: 999999,
          username: "admin",
          email: "admin@elbeg.com",
          isAdmin: true,
          role: "admin",
          name: "Local Admin",
          createdAt: new Date().toISOString(),
        } as any;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.username.includes('@') ? data.username : `${data.username}@placeholder.com`, // Support username if needed, but schema uses email
        password: data.password,
      });

      if (authError) throw authError;

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authData.user.email)
        .single();

      if (profileError) throw profileError;

      return {
        ...profile,
        isAdmin: profile.is_admin,
        createdAt: profile.created_at,
        googleId: profile.google_id,
        profileImageUrl: profile.profile_image_url
      } as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: t.toast.loginSuccess,
        description: t.toast.loginSuccessDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toast.loginFailed,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.name || data.username,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      // 2. Create profile in our public users table
      // We do this manually to ensure the users table is populated immediately
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([{
          username: data.username,
          password: 'hashed_in_auth', // Placeholder as password is managed by Supabase Auth
          email: data.email,
          name: data.name || null,
          phone: data.phone || null,
          is_admin: false
        }])
        .select()
        .single();

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        // If profile creation fails but auth succeeded, we might have a conflict or existing user
        // Try to fetch existing profile before failing
        const { data: existingProfile } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.email)
          .maybeSingle();

        if (existingProfile) return {
          ...existingProfile,
          isAdmin: existingProfile.is_admin,
          createdAt: existingProfile.created_at,
        } as User;

        throw profileError;
      }

      return {
        ...profile,
        isAdmin: profile.is_admin,
        createdAt: profile.created_at,
      } as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: t.toast.registerSuccess,
        description: t.toast.registerSuccessDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toast.registerFailed,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // CLEAR LOCAL ADMIN SESSION
      localStorage.removeItem('mock_admin_session');

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: t.toast.logoutSuccess,
        description: t.toast.logoutSuccessDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toast.logoutFailed,
        description: error.message,
        variant: "default",
        className: "bg-[#02C75A] text-white border-[#02C75A]",
      });
    },
  });

  // Google Login function
  const googleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast({
        title: "Google Login Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        logoutMutation,
        loginMutation,
        registerMutation,
        googleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}