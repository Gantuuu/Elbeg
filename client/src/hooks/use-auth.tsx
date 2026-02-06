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
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return null;

      // Fetch user profile from public table using email
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return profile as User;
    },
    staleTime: Infinity, // Rely on auth state changes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // We assume username field contains email for Supabase Auth
      // If it's not an email, this might fail unless we implement username lookup
      const email = credentials.username.includes('@')
        ? credentials.username
        : undefined; // Fail if not email for now, or implement logic to find email by username

      if (!email) {
        throw new Error("Please use your email to log in.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      });

      if (error) throw error;

      // Fetch the user profile to return it
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) throw profileError;

      return profile as User;
    },
    onSuccess: (user) => {
      const name = user.name || user.username;
      toast({
        title: t.toast.loginSuccess,
        description: name ? `${t.toast.loginSuccessWelcome}, ${name}!` : t.toast.loginSuccessDesc,
      });
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            name: userData.username, // Default name to username
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      // 2. Create profile in public users table
      // Note: In production, this is safer in a Postgres Trigger
      const newUserProfile = {
        username: userData.username,
        email: userData.email,
        password: "hashed_by_supabase", // We don't need the real password here
        name: userData.username,
        phone: userData.phone,
        is_admin: false
      };

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([newUserProfile])
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, we should probably delete the auth user or handle it
        console.error("Profile creation failed:", profileError);
        throw new Error("Failed to create user profile");
      }

      return profile as User;
    },
    onSuccess: (user) => {
      toast({
        title: t.toast.registerSuccess,
        description: t.toast.registerSuccessDesc,
      });
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: t.toast.registerFailed,
        description: error.message,
        variant: "default",
        className: "bg-[#02C75A] text-white border-[#02C75A]",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
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

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
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