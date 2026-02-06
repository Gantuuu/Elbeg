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