import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Zap, LogOut, ChevronDown, Star, FileText, CheckCircle, TrendingUp, Users, Mail, Shield, Handshake, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchMyStats } from "@/services/domain";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: stats } = useQuery({
    queryKey: ["me-stats"],
    queryFn: fetchMyStats,
    enabled: !!user,
    staleTime: 15000,
  });

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/create", label: "Report Problem", auth: true, hideForNgo: true },
    { href: "/community", label: "Community" },
    { href: "/dashboard", label: "Dashboard", auth: true },
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ].filter((l) => !l.auth || !!user).filter((l) => !(l as { hideForNgo?: boolean }).hideForNgo || user?.role !== "ngo");

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
    setOpen(false);
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";
  const activeCommunities = stats?.activeCommunities ?? 0;
  const problemsJoined = stats?.problemsJoined ?? 0;
  const totalContributed = stats?.totalContributed ?? user?.totalContributed ?? 0;
  const problemsCreated = stats?.problemsCreated ?? user?.problemsCreated ?? 0;
  const problemsSolved = stats?.problemsSolved ?? user?.problemsSolved ?? 0;
  const reputationScore = stats?.reputationScore ?? user?.reputationScore ?? 0;

  return (
    <nav className="sticky top-0 z-50 bg-secondary/95 backdrop-blur-sm border-b border-border shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ImpactBridge</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-primary text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="ml-3 relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-white text-sm font-medium pr-1">{user.name.split(" ")[0]}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-card-border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/5 border-b border-border">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white border-2 border-primary/20">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{user.email}</span>
                          </p>
                        </div>
                      </div>
                      {user.role === "ngo" && stats?.ngoStatus && (
                        <div className={`mt-3 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                          stats.ngoStatus === "approved" ? "bg-primary/15 text-primary" :
                          stats.ngoStatus === "rejected" ? "bg-destructive/15 text-destructive" :
                          "bg-accent/15 text-accent-foreground"
                        }`}>
                          <Handshake className="w-3 h-3" /> NGO · {stats.ngoStatus}
                        </div>
                      )}
                      {user.role === "admin" && (
                        <div className="mt-3 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 bg-secondary text-white">
                          <Shield className="w-3 h-3" /> Administrator
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-border">
                      <StatCell icon={Users} label="Communities joined" value={activeCommunities} color="text-blue-600" />
                      <StatCell icon={TrendingUp} label="Total contributed" value={`Rs. ${totalContributed.toLocaleString()}`} color="text-primary" />
                      <StatCell icon={CheckCircle} label="Problems joined" value={problemsJoined} color="text-purple-600" />
                      <StatCell icon={FileText} label="Problems created" value={problemsCreated} color="text-secondary-foreground" />
                      <StatCell icon={CheckCircle} label="Problems solved" value={problemsSolved} color="text-primary" />
                      <StatCell icon={Star} label="Reputation" value={reputationScore} color="text-accent" />
                    </div>

                    <div className="p-2 bg-card flex flex-col gap-1">
                      <Link href="/profile" className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        View profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-3 px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-secondary/98 backdrop-blur-sm px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === link.href
                  ? "bg-primary text-white"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10 mt-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-white/5">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <MobileStat label="Communities" value={activeCommunities} />
                  <MobileStat label="Problems joined" value={problemsJoined} />
                  <MobileStat label="Contributed" value={`Rs. ${totalContributed.toLocaleString()}`} />
                  <MobileStat label="Created" value={problemsCreated} />
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full block px-3 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors text-center"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors text-center"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-card p-3 flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="px-3 py-2 rounded-md bg-white/5">
      <p className="text-white text-sm font-semibold">{value}</p>
      <p className="text-slate-400 text-[11px]">{label}</p>
    </div>
  );
}
