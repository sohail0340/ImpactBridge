import { useEffect, type ReactNode } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const RETURN_TO_KEY = "impactbridge:returnTo";

export function setReturnTo(path: string) {
  sessionStorage.setItem(RETURN_TO_KEY, path);
}

export function popReturnTo(): string | null {
  const v = sessionStorage.getItem(RETURN_TO_KEY);
  if (v) sessionStorage.removeItem(RETURN_TO_KEY);
  return v;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      setReturnTo(location);
      toast({
        title: "Login required",
        description: "Please sign in to access this feature.",
      });
    }
  }, [loading, user, location, toast]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
