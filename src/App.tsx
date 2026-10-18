import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { supabase } from "./integrations/supabase/client";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SetupPage = lazy(() => import("./pages/SetupPage"));
const InterviewPage = lazy(() => import("./pages/InterviewPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const InterviewDetailPage = lazy(() => import("./pages/InterviewDetailPage"));
const LearningPage = lazy(() => import("./pages/LearningPage"));
const LearningDetailPage = lazy(() => import("./pages/LearningDetailPage"));
const LearningContentPage = lazy(() => import("./pages/LearningContentPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const JobRolesPage = lazy(() => import("./pages/JobRolesPage"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setAuthenticated(Boolean(session));
        setCheckingSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setAuthenticated(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="prepzo-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/roles" element={<JobRolesPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
              <Route path="/interview" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
              <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
              <Route path="/interview/:id" element={<ProtectedRoute><InterviewDetailPage /></ProtectedRoute>} />
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/learning/:id" element={<ProtectedRoute><LearningDetailPage /></ProtectedRoute>} />
              <Route path="/learning/:id/content" element={<ProtectedRoute><LearningContentPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
