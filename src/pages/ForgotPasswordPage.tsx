import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAuthRedirectUrl } from "@/lib/auth-redirect";
import ThemeToggle from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getAuthRedirectUrl("reset-password"),
    });
    setLoading(false);
    if (error) {
      if (error.status === 429 || error.message.toLowerCase().includes("rate limit")) {
        setCooldown(60);
        toast.error("Supabase email limit reached. Please wait before trying again.");
      } else if (error.status === 500) {
        toast.error("Recovery email could not be sent. Check Supabase email settings and redirect URLs.");
      } else {
        toast.error(error.message);
      }
    } else {
      setSent(true);
      setCooldown(60);
      toast.success("Password reset link sent to your email!");
    }
  };

  return (
    <div className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
      <ThemeToggle className="absolute right-4 top-4 z-20 border-border bg-card/90 text-foreground shadow-md hover:bg-muted sm:right-6 sm:top-6" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="mb-7 text-center sm:mb-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <div className="gradient-bg flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Prepzo</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">We'll send you a link to reset it</p>
        </div>

        <div className="auth-card p-5 sm:p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">Check your email</h3>
              <p className="mb-6 text-sm text-muted-foreground">We sent a password reset link to <span className="text-foreground">{email}</span></p>
              <Link to="/login">
                <Button variant="heroOutline" size="lg" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset}>
              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" className="h-12 w-full rounded-xl border border-input bg-background/70 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full py-5 mb-4" disabled={loading || cooldown > 0}>
                {loading ? "Sending..." : cooldown > 0 ? `Try again in ${cooldown}s` : "Send Reset Link"} {!loading && cooldown === 0 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
