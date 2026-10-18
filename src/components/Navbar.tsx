import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Brain, User, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User as AuthUser } from "@supabase/supabase-js";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/roles", label: "Job Roles" },
  { to: "/learning", label: "Resources" },
  { to: "/setup", label: "Practice" },
  { to: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: prof } = await supabase
          .from("profiles")
          .select("avatar_url, display_name")
          .eq("id", user.id)
          .maybeSingle();
        if (prof) {
          setAvatarUrl(prof.avatar_url);
          setDisplayName(prof.display_name || user.email?.split("@")[0] || "");
        }
      }
    };
    load();
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-background/85 shadow-sm backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-[4.5rem]">
        <Link to="/" className="flex items-center gap-2">
          <span className="gradient-bg flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">Prepzo</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm ${isActive(link.to) ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {(displayName || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button variant="secondary" size="sm">Log in</Button>
              </Link>
              <Link to="/signup" className="hidden sm:block">
                <Button variant="hero" size="sm">Get Started</Button>
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-navigation" className="md:hidden border-t border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-xl">
          <div className="space-y-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${isActive(link.to) ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
          </div>
          {user && (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/profile") ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  <User className="h-4 w-4 mr-2" /> Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive"
                onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </>
          )}
          {!user && (
            <div className="flex gap-2 border-t border-border pt-3 sm:hidden">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">Log in</Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button variant="default" size="sm" className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
