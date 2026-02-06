import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { queryClient } from "@/lib/queryClient";

export default function AuthCallback() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        const handleAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.user) {
                    console.log("No session found in callback, redirecting to auth");
                    setLocation("/auth");
                    return;
                }

                const email = session.user.email;
                if (!email) {
                    setLocation("/auth");
                    return;
                }

                // Check if user profile exists
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .maybeSingle();

                if (profileError) {
                    console.error("Error checking profile in callback:", profileError);
                    setLocation("/");
                    return;
                }

                if (!profile) {
                    console.log("Creating new user profile for Google user:", email);
                    // Create profile for new Google user
                    const username = session.user.user_metadata.full_name || email.split('@')[0];
                    const { error: insertError } = await supabase
                        .from('users')
                        .insert([{
                            username: username,
                            email: email,
                            name: session.user.user_metadata.full_name || username,
                            password: 'oauth_user',
                            is_admin: false
                        }]);

                    if (insertError) {
                        console.error("Error creating profile:", insertError);
                    }
                }

                // Invalidate user query to pick up new profile or updated session
                await queryClient.invalidateQueries({ queryKey: ["/api/user"] });

                console.log("Auth callback successful, redirecting home");
                setLocation("/");
            } catch (err) {
                console.error("Callback error:", err);
                setLocation("/auth");
            }
        };

        handleAuth();
    }, [setLocation]);

    return <LoadingScreen text="Authenticating..." />;
}
