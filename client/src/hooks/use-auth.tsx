import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, loginSchema, signupSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { z } from "zod";

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

  // Query to fetch the current user
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1,         // Retry once in case of network issues
    retryDelay: 1000, // 1 second delay between retries
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log("API Request: POST /api/login");
        console.log("Request data:", credentials);
        console.log("Sending fetch request...");

        // apiRequest already handles JSON parsing
        const response = await apiRequest("POST", "/api/login", credentials);
        console.log("Response data:", response);

        return response;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (response: any) => {
      console.log("Login successful:", response);
      const user = response.user || response;

      // Update user data in the cache
      queryClient.setQueryData(["/api/user"], user);

      // Invalidate and refetch user data to ensure we have the latest state
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        refetchUser();
        console.log("Refetching user data after login");
      }, 300);

      toast({
        title: t.toast.loginSuccess,
        description: response.message || (user.name ? `${t.toast.loginSuccessWelcome}, ${user.name}!` : t.toast.loginSuccessDesc),
      });
    },
    onError: (error: Error) => {
      console.error("API Request error:", error);

      toast({
        title: "Login Error (Debug)",
        description: `Raw: ${error.message}`, // Force raw message
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        console.log("API Request: POST /api/register");
        console.log("Request data:", userData);
        console.log("Sending fetch request...");

        // apiRequest already handles JSON parsing
        const response = await apiRequest("POST", "/api/register", userData);
        console.log("Response data:", response);

        return response;
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (response: any) => {
      console.log("Registration successful:", response);
      const user = response.user || response;

      // Update user data in the cache
      queryClient.setQueryData(["/api/user"], user);

      // Invalidate and refetch user data to ensure we have the latest state
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        refetchUser();
        console.log("Refetching user data after registration");
      }, 300);

      toast({
        title: t.toast.registerSuccess,
        description: response.message || t.toast.registerSuccessDesc,
      });
    },
    onError: (error: Error) => {
      console.error("API Request error:", error);
      toast({
        title: t.toast.registerFailed,
        description: error.message || t.toast.registerFailedDesc,
        variant: "default",
        className: "bg-[#02C75A] text-white border-[#02C75A]",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("API Request: POST /api/logout");
        console.log("Sending logout request...");
        await apiRequest("POST", "/api/logout");
        console.log("Logout request successful");
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Logout successful, clearing all cache data");

      // Clear the user data in cache
      queryClient.setQueryData(["/api/user"], null);

      // Invalidate all queries to ensure fresh data on login
      queryClient.removeQueries({ queryKey: ["/api/user"] });
      queryClient.removeQueries({ queryKey: ["/api/user/orders"] });
      queryClient.removeQueries({ queryKey: ["/api/generated-meal-kits"] });

      // Clear the entire cache to prevent any stale data
      queryClient.clear();

      toast({
        title: t.toast.logoutSuccess,
        description: t.toast.logoutSuccessDesc,
      });
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      toast({
        title: t.toast.logoutFailed,
        description: error.message || t.toast.logoutFailedDesc,
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