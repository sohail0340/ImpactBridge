import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, LayoutDashboard, Users, Handshake, AlertCircle, Globe,
  DollarSign, CheckCircle, XCircle, ExternalLink, Search, ChevronRight,
  Trash2, UserCog, Plus, X, TrendingUp, Clock, Activity, Building2,
  MapPin, Tag, Menu, Pencil, ListTodo, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  adminGetStats, adminListUsers, adminChangeUserRole, adminDeleteUser,
  adminListNgos, adminApproveNgo, adminRejectNgo,
  adminListProblems, adminApproveProblem, adminRejectProblem, adminDeleteProblem, adminCreateProblem,
  adminListCommunities, adminCreateCommunity, adminUpdateCommunity, adminDeleteCommunity,
  adminCreateTask, adminUpdateTask, adminDeleteTask,
  adminListContributions, adminApproveContribution, adminRejectContribution,
  adminListNgoApplications, adminAcceptNgoApplication, adminRejectNgoApplication,
  adminUpdateWorkProgress,
} from "@/services/domain";
import type { AdminUser, AdminNgo, AdminProblem, AdminCommunity, AdminCommunityTask, AdminContribution, AdminNgoApplication } from "@/services/domain";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Section = "dashboard" | "users" | "ngos" | "problems" | "communities" | "contributions" | "ngo-applications";

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "ngos", label: "NGO Verification", icon: Handshake },
  { id: "ngo-applications", label: "NGO Applications", icon: Activity },
  { id: "problems", label: "Problems", icon: AlertCircle },
  { id: "communities", label: "Communities", icon: Globe },
  { id: "contributions", label: "Contributions", icon: DollarSign },
];

export function Admin() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
        <h1 className="text-xl font-bold">Admin access required</h1>
        <p className="text-muted-foreground mt-1">You must be signed in as an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#1a2035] text-white flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Admin Panel</p>
              <p className="text-[11px] text-white/40">ImpactBridge</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setSection(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                section === id ? "bg-primary text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {section === id && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </button>
          ))}
        </nav>
        <div className="px-5 py-3 border-t border-white/10 text-xs text-white/40">
          {user.name}
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border lg:hidden bg-card">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <p className="font-semibold text-sm">{NAV.find((n) => n.id === section)?.label}</p>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
          {section === "dashboard" && <DashboardSection />}
          {section === "users" && <UsersSection />}
          {section === "ngos" && <NgosSection />}
          {section === "ngo-applications" && <NgoApplicationsSection />}
          {section === "problems" && <ProblemsSection />}
          {section === "communities" && <CommunitiesSection />}
          {section === "contributions" && <ContributionsSection />}
        </div>
      </main>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    reported: "bg-blue-100 text-blue-800 border-blue-200",
    in_progress: "bg-violet-100 text-violet-800 border-violet-200",
    funding_started: "bg-cyan-100 text-cyan-800 border-cyan-200",
    community_joined: "bg-indigo-100 text-indigo-800 border-indigo-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    done: "bg-emerald-100 text-emerald-800 border-emerald-200",
    user: "bg-slate-100 text-slate-700 border-slate-200",
    ngo: "bg-teal-100 text-teal-800 border-teal-200",
    admin: "bg-purple-100 text-purple-800 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ActionBtn({ onClick, variant, icon: Icon, label, disabled }: {
  onClick: () => void; variant: "approve" | "reject" | "danger" | "neutral";
  icon: React.ElementType; label: string; disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    approve: "bg-emerald-600 hover:bg-emerald-700 text-white",
    reject: "border border-red-300 text-red-600 hover:bg-red-50",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    neutral: "border border-border text-foreground hover:bg-muted",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${styles[variant]}`}>
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  );
}

function RejectDialog({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="mt-3 flex gap-2 items-center p-3 bg-red-50 rounded-lg border border-red-100">
      <input value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="Enter rejection reason…"
        className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-red-300" />
      <button disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}
        className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-40 hover:bg-red-700">
        Confirm
      </button>
      <button onClick={onCancel} className="p-2 rounded-lg hover:bg-red-100">
        <X className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );
}

function Skel({ rows = 3 }: { rows?: number }) {
  return <>{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse mb-2" />)}</>;
}
function Empty({ label }: { label: string }) {
  return <div className="text-center py-16 text-muted-foreground text-sm">{label}</div>;
}
function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">{k}</p>
      <p className="font-semibold text-sm mt-0.5 break-all">{v}</p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardSection() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: adminGetStats });

  const cards: { label: string; value: number | string; icon: React.ElementType; color: string }[] = stats ? [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "NGO Users", value: stats.totalNgos, icon: Building2, color: "text-teal-600 bg-teal-50" },
    { label: "Total Problems", value: stats.totalProblems, icon: AlertCircle, color: "text-violet-600 bg-violet-50" },
    { label: "Active Problems", value: stats.activeProblems, icon: Activity, color: "text-indigo-600 bg-indigo-50" },
    { label: "Communities", value: stats.totalCommunities, icon: Globe, color: "text-cyan-600 bg-cyan-50" },
    { label: "Funds Raised", value: `Rs. ${Number(stats.totalFundsRaised).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { label: "Pending NGO Apps", value: stats.pendingNgoApplications, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Pending Contribs", value: stats.pendingContributions, icon: DollarSign, color: "text-orange-600 bg-orange-50" },
  ] : [];

  return (
    <div>
      <SectionHeader title="Dashboard" subtitle="Platform overview and pending actions at a glance." />
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats && (stats.pendingNgoApplications > 0 || stats.pendingContributions > 0) && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-semibold text-amber-900 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" /> Pending actions required
          </p>
          <div className="mt-2 space-y-1 text-sm text-amber-800">
            {stats.pendingNgoApplications > 0 && (
              <p>• {stats.pendingNgoApplications} NGO application{stats.pendingNgoApplications !== 1 ? "s" : ""} awaiting review</p>
            )}
            {stats.pendingContributions > 0 && (
              <p>• {stats.pendingContributions} contribution{stats.pendingContributions !== 1 ? "s" : ""} awaiting approval</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

function UsersSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => adminListUsers({ search: search || undefined, role: roleFilter || undefined }),
    staleTime: 10000,
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminChangeUserRole(id, role),
    onSuccess: () => { toast({ title: "Role updated" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => adminDeleteUser(id),
    onSuccess: () => { toast({ title: "User deleted" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <div>
      <SectionHeader title="Users" subtitle="Manage all registered users and their platform roles." />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name or email…" />
        <FilterSelect value={roleFilter} onChange={setRoleFilter} options={[
          { value: "", label: "All roles" },
          { value: "user", label: "User" },
          { value: "ngo", label: "NGO" },
          { value: "admin", label: "Admin" },
        ]} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Reputation</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Activity</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6}><Skel /></td></tr>
              ) : !data || data.length === 0 ? (
                <tr><td colSpan={6}><Empty label="No users found" /></td></tr>
              ) : data.map((u) => (
                <UserRow key={u.id} u={u}
                  onChangeRole={(role) => changeRole.mutate({ id: u.id, role })}
                  onDelete={() => deleteUser.mutate(u.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, onChangeRole, onDelete }: { u: AdminUser; onChangeRole: (role: string) => void; onDelete: () => void }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img
            src={u.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email)}`}
            alt=""
            className="w-8 h-8 rounded-full bg-muted flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[180px]">{u.name}</p>
            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{u.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-sm">{u.reputationScore}</td>
      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{new Date(u.joinedAt).toLocaleDateString()}</td>
      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
        {u.problemsCreated} problems · Rs.{u.totalContributed.toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu((s) => !s)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
            >
              <UserCog className="w-3.5 h-3.5" /> Role
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-lg shadow-lg w-32 py-1">
                {["user", "ngo", "admin"].map((r) => (
                  <button key={r} onClick={() => { onChangeRole(r); setShowRoleMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${u.role === r ? "font-semibold text-primary" : ""}`}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { if (window.confirm(`Delete ${u.name}?`)) onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── NGOs ─────────────────────────────────────────────────────────────────────

function NgosSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ngos", status],
    queryFn: () => adminListNgos(status),
  });

  const approve = useMutation({
    mutationFn: (id: number) => adminApproveNgo(id),
    onSuccess: () => { toast({ title: "NGO approved" }); qc.invalidateQueries({ queryKey: ["admin-ngos"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminRejectNgo(id, reason),
    onSuccess: () => { toast({ title: "NGO rejected" }); qc.invalidateQueries({ queryKey: ["admin-ngos"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <div>
      <SectionHeader title="NGO Verification" subtitle="Review and verify NGO applications with their submitted documents." />
      <div className="mb-4">
        <FilterSelect value={status} onChange={(v) => setStatus(v as typeof status)} options={[
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ]} />
      </div>

      {isLoading ? <Skel /> : !data || data.length === 0 ? (
        <Empty label={`No ${status} NGO applications`} />
      ) : (
        <div className="space-y-4">
          {data.map((n) => (
            <NgoCard key={n.id} n={n} canAct={status === "pending"}
              onApprove={() => approve.mutate(n.id)}
              onReject={(reason) => reject.mutate({ id: n.id, reason })} />
          ))}
        </div>
      )}
    </div>
  );
}

function NgoCard({ n, canAct, onApprove, onReject }: { n: AdminNgo; canAct: boolean; onApprove: () => void; onReject: (r: string) => void }) {
  const [showReject, setShowReject] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-teal-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg">{n.organization}</h3>
              <p className="text-sm text-muted-foreground truncate">{n.userName} · {n.userEmail} · {n.contactNumber}</p>
            </div>
            <StatusBadge status={n.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kv k="Estimated Cost" v={`Rs. ${n.estimatedCost.toLocaleString()}`} />
            <Kv k="Timeline" v={`${n.timelineValue} ${n.timelineUnit}`} />
            <Kv k="Updates Agreed" v={n.agreedToProvideUpdates ? "Yes" : "No"} />
            <Kv k="Submitted" v={new Date(n.createdAt).toLocaleDateString()} />
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Plan Description</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.planDescription}</p>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Required Resources</p>
            <p className="text-sm whitespace-pre-wrap">{n.requiredResources}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {n.previousWorkUrl && (
              <a href={n.previousWorkUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> Previous Work
              </a>
            )}
            {n.certificateUrl && (
              <a href={n.certificateUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> Certificate / Document
              </a>
            )}
          </div>

          {n.status === "rejected" && n.rejectionReason && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              Rejected: {n.rejectionReason}
            </p>
          )}
        </div>
        {canAct && (
          <div className="flex gap-2 flex-shrink-0">
            <ActionBtn onClick={onApprove} variant="approve" icon={CheckCircle} label="Approve" />
            <ActionBtn onClick={() => setShowReject((s) => !s)} variant="reject" icon={XCircle} label="Reject" />
          </div>
        )}
      </div>
      {showReject && canAct && (
        <RejectDialog
          onConfirm={(reason) => { onReject(reason); setShowReject(false); }}
          onCancel={() => setShowReject(false)}
        />
      )}
    </div>
  );
}

// ─── Problems ─────────────────────────────────────────────────────────────────

const PROBLEM_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "reported", label: "Reported" },
  { value: "community_joined", label: "Community Joined" },
  { value: "in_progress", label: "In Progress" },
  { value: "funding_started", label: "Funding Started" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Hidden / Rejected" },
];

const CATEGORIES = ["Roads", "Water", "Safety", "Sanitation", "Education", "Environment", "Health", "Infrastructure", "Other"];
const URGENCIES = ["low", "medium", "high", "critical"];

function ProblemsSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-problems", search, statusFilter],
    queryFn: () => adminListProblems({ search: search || undefined, status: statusFilter || undefined }),
    staleTime: 10000,
  });

  const approve = useMutation({
    mutationFn: (id: number) => adminApproveProblem(id),
    onSuccess: () => { toast({ title: "Problem restored to visible" }); qc.invalidateQueries({ queryKey: ["admin-problems"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });
  const reject = useMutation({
    mutationFn: (id: number) => adminRejectProblem(id),
    onSuccess: () => { toast({ title: "Problem hidden from public" }); qc.invalidateQueries({ queryKey: ["admin-problems"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => adminDeleteProblem(id),
    onSuccess: () => { toast({ title: "Problem permanently deleted" }); qc.invalidateQueries({ queryKey: ["admin-problems"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Problems</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Review, moderate, or create community problems.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Problem
        </button>
      </div>

      {showCreate && (
        <CreateProblemForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ["admin-problems"] });
            qc.invalidateQueries({ queryKey: ["admin-stats"] });
          }}
        />
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search problems…" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={PROBLEM_STATUSES} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Problem</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Posted By</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Funding</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6}><Skel /></td></tr>
              ) : !data || data.length === 0 ? (
                <tr><td colSpan={6}><Empty label="No problems found" /></td></tr>
              ) : data.map((p) => (
                <ProblemRow key={p.id} p={p}
                  onApprove={() => approve.mutate(p.id)}
                  onReject={() => reject.mutate(p.id)}
                  onDelete={() => { if (window.confirm(`Permanently delete "${p.title}"?`)) remove.mutate(p.id); }} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProblemRow({ p, onApprove, onReject, onDelete, onProgressUpdate }: {
  p: AdminProblem; onApprove: () => void; onReject: () => void; onDelete: () => void; onProgressUpdate?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [workPct, setWorkPct] = useState(p.workProgressPercent ?? 0);
  const [saving, setSaving] = useState(false);
  const urgencyColor: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-600",
  };

  const saveProgress = async () => {
    setSaving(true);
    try {
      await adminUpdateWorkProgress(p.id, workPct);
      toast({ title: "Progress updated", description: `Work progress set to ${workPct}%` });
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
      onProgressUpdate?.();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <tr className="border-b border-border hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded((s) => !s)}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            {p.imageUrl && <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
            <div className="min-w-0">
              <p className="font-medium truncate max-w-[180px]">{p.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{p.category}</span>
                <span className={`text-[10px] font-semibold px-1.5 rounded-full ${urgencyColor[p.urgency] ?? "bg-muted text-muted-foreground"}`}>
                  {p.urgency}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{p.location}</span>
          </div>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground truncate max-w-[120px]">{p.postedByName}</td>
        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
        <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
          Rs.{p.fundingRaised.toLocaleString()} / {p.fundingGoal.toLocaleString()}
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1.5">
            {p.status === "rejected" ? (
              <ActionBtn onClick={onApprove} variant="approve" icon={CheckCircle} label="Restore" />
            ) : (
              <ActionBtn onClick={onReject} variant="reject" icon={XCircle} label="Hide" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Permanently delete "${p.title}"?`)) onDelete(); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border bg-muted/20">
          <td colSpan={6} className="px-5 py-4 space-y-4">
            <p className="text-sm leading-relaxed text-foreground">{p.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Posted by: <strong>{p.postedByName}</strong> ({p.postedByEmail})</span>
              <span>Created: {new Date(p.createdAt).toLocaleDateString()}</span>
              <span>{p.joinedCount} members joined</span>
              <span>{p.verifiedCount} verifications</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Work Progress Tracker</span>
                <span className="text-sm font-bold text-primary">{workPct}%</span>
              </div>
              <div className="space-y-1.5">
                <input
                  type="range" min={0} max={100} step={5}
                  value={workPct}
                  onChange={(e) => setWorkPct(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  {["0% Reported", "20% Community", "40% Funding", "60% Working", "80% Done"].map((l) => (
                    <span key={l} className="text-center">{l}</span>
                  ))}
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${workPct}%` }} />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); saveProgress(); }}
                  disabled={saving || workPct === (p.workProgressPercent ?? 0)}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? "Saving…" : "Save progress"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CreateProblemForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "", description: "", category: "Infrastructure",
    location: "", urgency: "medium", fundingGoal: "", imageUrl: "", status: "reported",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      toast({ title: "Title, description, and location are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await adminCreateProblem({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        urgency: form.urgency,
        fundingGoal: form.fundingGoal ? Number(form.fundingGoal) : 0,
        imageUrl: form.imageUrl.trim() || undefined,
        status: form.status,
      });
      toast({ title: "Problem created successfully" });
      onCreated();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Create New Problem</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Title *</Label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Problem title"
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="md:col-span-2">
          <Label>Description *</Label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
            placeholder="Describe the problem in detail"
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
        <div>
          <Label>Category</Label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label>Location *</Label>
          <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Area"
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <Label>Urgency</Label>
          <select value={form.urgency} onChange={(e) => set("urgency", e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
            {URGENCIES.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <Label>Funding Goal (Rs.)</Label>
          <input type="number" value={form.fundingGoal} onChange={(e) => set("fundingGoal", e.target.value)} placeholder="0"
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <Label>Initial Status</Label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
            {PROBLEM_STATUSES.filter((s) => s.value && s.value !== "rejected").map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Image URL (optional)</Label>
          <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…"
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-5">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
        <button onClick={submit} disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Creating…" : "Create Problem"}
        </button>
      </div>
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{children}</label>;
}

// ─── Communities ──────────────────────────────────────────────────────────────

const CAT_COLOR: Record<string, string> = {
  Roads: "bg-blue-100 text-blue-700",
  Environment: "bg-green-100 text-green-700",
  Water: "bg-cyan-100 text-cyan-700",
  Education: "bg-violet-100 text-violet-700",
  Health: "bg-red-100 text-red-700",
  Sanitation: "bg-yellow-100 text-yellow-700",
  Safety: "bg-orange-100 text-orange-700",
};

function CommunitiesSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["admin-communities"], queryFn: adminListCommunities });

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminCommunity | null>(null);

  const createMut = useMutation({
    mutationFn: adminCreateCommunity,
    onSuccess: () => { toast({ title: "Community created" }); qc.invalidateQueries({ queryKey: ["admin-communities"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); setShowCreate(false); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof adminUpdateCommunity>[1] }) => adminUpdateCommunity(id, input),
    onSuccess: () => { toast({ title: "Community updated" }); qc.invalidateQueries({ queryKey: ["admin-communities"] }); setEditTarget(null); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: adminDeleteCommunity,
    onSuccess: () => { toast({ title: "Community deleted" }); qc.invalidateQueries({ queryKey: ["admin-communities"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Communities</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Create, edit, and manage community groups with their tasks.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" /> New Community
        </button>
      </div>

      {isLoading ? <Skel rows={4} /> : !data || data.length === 0 ? (
        <Empty label="No communities found. Click 'New Community' to create one." />
      ) : (
        <div className="space-y-5">
          {data.map((c) => (
            <CommunityCard
              key={c.id} c={c}
              onEdit={() => setEditTarget(c)}
              onDelete={() => { if (confirm(`Delete "${c.name}"? This cannot be undone.`)) deleteMut.mutate(c.id); }}
            />
          ))}
        </div>
      )}

      {(showCreate || editTarget) && (
        <CommunityFormModal
          initial={editTarget ?? undefined}
          onClose={() => { setShowCreate(false); setEditTarget(null); }}
          onSubmit={(vals) => {
            if (editTarget) updateMut.mutate({ id: editTarget.id, input: vals });
            else createMut.mutate(vals as Parameters<typeof adminCreateCommunity>[0]);
          }}
          isSubmitting={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function CommunityFormModal({ initial, onClose, onSubmit, isSubmitting }: {
  initial?: AdminCommunity;
  onClose: () => void;
  onSubmit: (vals: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [cat, setCat] = useState(initial?.category ?? "Roads");
  const [members, setMembers] = useState(String(initial?.memberCount ?? 0));
  const [problems, setProblems] = useState(String(initial?.problemCount ?? 0));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-lg">{initial ? "Edit Community" : "Create Community"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold mb-1">Name *</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. UrbanPulse Collective" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Description *</label>
            <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this community about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Category *</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={active ? "active" : "inactive"} onChange={(e) => setActive(e.target.value === "active")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Member Count</label>
              <input type="number" min={0} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={members} onChange={(e) => setMembers(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Problem Count</label>
              <input type="number" min={0} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={problems} onChange={(e) => setProblems(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Image URL (optional)</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button
            disabled={isSubmitting || !name.trim() || !desc.trim()}
            onClick={() => onSubmit({ name: name.trim(), description: desc.trim(), category: cat, memberCount: Number(members) || 0, problemCount: Number(problems) || 0, imageUrl: imageUrl.trim() || undefined, active })}
            className="flex-1 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {isSubmitting ? "Saving…" : initial ? "Save Changes" : "Create Community"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommunityCard({ c, onEdit, onDelete }: { c: AdminCommunity; onEdit: () => void; onDelete: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tasksOpen, setTasksOpen] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState<AdminCommunityTask | null>(null);

  const createTaskMut = useMutation({
    mutationFn: (input: Parameters<typeof adminCreateTask>[1]) => adminCreateTask(c.id, input),
    onSuccess: () => { toast({ title: "Task created" }); qc.invalidateQueries({ queryKey: ["admin-communities"] }); setShowTaskForm(false); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });
  const updateTaskMut = useMutation({
    mutationFn: ({ taskId, input }: { taskId: number; input: Parameters<typeof adminUpdateTask>[2] }) => adminUpdateTask(c.id, taskId, input),
    onSuccess: () => { toast({ title: "Task updated" }); qc.invalidateQueries({ queryKey: ["admin-communities"] }); setEditTask(null); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });
  const deleteTaskMut = useMutation({
    mutationFn: (taskId: number) => adminDeleteTask(c.id, taskId),
    onSuccess: () => { toast({ title: "Task deleted" }); qc.invalidateQueries({ queryKey: ["admin-communities"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  const tasksByStatus = { done: 0, in_progress: 0, pending: 0 };
  c.tasks.forEach((t) => { if (t.status in tasksByStatus) tasksByStatus[t.status as keyof typeof tasksByStatus]++; });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <Globe className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base">{c.name}</h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLOR[c.category] ?? "bg-muted text-muted-foreground"}`}>{c.category}</span>
              {!c.active && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Inactive</span>}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit community">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors text-red-500" title="Delete community">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4 text-center text-sm">
          {[
            { val: c.memberCount, lbl: "Members" },
            { val: c.problemCount, lbl: "Problems" },
            { val: c.tasks.length, lbl: "Tasks" },
            { val: tasksByStatus.done, lbl: "Done" },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="bg-muted/50 rounded-lg py-2">
              <p className="font-bold text-lg leading-tight">{val}</p>
              <p className="text-[11px] text-muted-foreground">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks accordion */}
      <div className="border-t border-border">
        <button onClick={() => setTasksOpen((s) => !s)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold hover:bg-muted/40 transition-colors">
          <span className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-muted-foreground" />
            Tasks ({c.tasks.length})
            <span className="text-xs font-normal text-muted-foreground ml-1">
              {tasksByStatus.done} done · {tasksByStatus.in_progress} in progress · {tasksByStatus.pending} pending
            </span>
          </span>
          {tasksOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {tasksOpen && (
          <div className="px-5 pb-4">
            <div className="space-y-2 mb-3">
              {c.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No tasks yet.</p>
              ) : c.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-2.5">
                  <StatusBadge status={t.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.title}</p>
                    {t.assignedTo && <p className="text-xs text-muted-foreground truncate">Assigned to: {t.assignedTo}</p>}
                  </div>
                  {t.dueDate && <span className="text-xs text-muted-foreground flex-shrink-0">{t.dueDate}</span>}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditTask(t)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit task">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm("Delete this task?")) deleteTaskMut.mutate(t.id); }} className="p-1 rounded hover:bg-red-50 transition-colors text-red-400 hover:text-red-600" title="Delete task">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
        )}
      </div>

      {/* Task form modals */}
      {(showTaskForm || editTask) && (
        <TaskFormModal
          initial={editTask ?? undefined}
          onClose={() => { setShowTaskForm(false); setEditTask(null); }}
          onSubmit={(vals) => {
            if (editTask) updateTaskMut.mutate({ taskId: editTask.id, input: vals });
            else createTaskMut.mutate(vals as Parameters<typeof adminCreateTask>[1]);
          }}
          isSubmitting={createTaskMut.isPending || updateTaskMut.isPending}
        />
      )}
    </div>
  );
}

function TaskFormModal({ initial, onClose, onSubmit, isSubmitting }: {
  initial?: AdminCommunityTask;
  onClose: () => void;
  onSubmit: (vals: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? "");
  const [status, setStatus] = useState(initial?.status ?? "pending");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-lg">{initial ? "Edit Task" : "Add Task"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Title *</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Description *</label>
            <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe what needs to be done" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Assigned To</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Name or handle" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Due Date (optional)</label>
            <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button
            disabled={isSubmitting || !title.trim() || !desc.trim()}
            onClick={() => onSubmit({ title: title.trim(), description: desc.trim(), assignedTo: assignedTo.trim() || undefined, status, dueDate: dueDate || undefined })}
            className="flex-1 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {isSubmitting ? "Saving…" : initial ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Contributions ────────────────────────────────────────────────────────────

function ContributionsSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contribs", status],
    queryFn: () => adminListContributions(status),
  });

  const approve = useMutation({
    mutationFn: (id: number) => adminApproveContribution(id),
    onSuccess: () => { toast({ title: "Contribution approved" }); qc.invalidateQueries({ queryKey: ["admin-contribs"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminRejectContribution(id, reason),
    onSuccess: () => { toast({ title: "Contribution rejected" }); qc.invalidateQueries({ queryKey: ["admin-contribs"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <div>
      <SectionHeader title="Contributions" subtitle="Review and approve donation submissions with payment proof." />
      <div className="mb-4">
        <FilterSelect value={status} onChange={(v) => setStatus(v as typeof status)} options={[
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ]} />
      </div>

      {isLoading ? <Skel rows={4} /> : !data || data.length === 0 ? (
        <Empty label={`No ${status} contributions`} />
      ) : (
        <div className="space-y-3">
          {data.map((c) => (
            <ContributionCard key={c.id} c={c} canAct={status === "pending"}
              onApprove={() => approve.mutate(c.id)}
              onReject={(reason) => reject.mutate({ id: c.id, reason })} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContributionCard({ c, canAct, onApprove, onReject }: {
  c: AdminContribution; canAct: boolean; onApprove: () => void; onReject: (r: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-3">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.userEmail)}`}
              alt=""
              className="w-8 h-8 rounded-full bg-muted flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                {c.userName} <span className="text-muted-foreground font-normal text-xs">({c.userEmail})</span>
              </p>
              <p className="text-xs text-muted-foreground">
                contributed to <span className="font-medium text-foreground">{c.problemTitle}</span>
              </p>
            </div>
            <StatusBadge status={c.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kv k="Amount" v={`Rs. ${c.amount.toLocaleString()}`} />
            <Kv k="Method" v={c.paymentMethod === "other" ? `Other: ${c.paymentMethodOther ?? ""}` : c.paymentMethod} />
            <Kv k="Transaction ID" v={c.transactionId || "—"} />
            <Kv k="Date" v={new Date(c.createdAt).toLocaleDateString()} />
          </div>

          {c.proofImageUrl && (
            <div className="mt-3">
              <a href={c.proofImageUrl} target="_blank" rel="noreferrer">
                <img
                  src={c.proofImageUrl}
                  alt="Payment proof"
                  className="rounded-lg border border-border max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                />
              </a>
              <a href={c.proofImageUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> Open full image
              </a>
            </div>
          )}
          {c.status === "rejected" && c.rejectionReason && (
            <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              Rejected: {c.rejectionReason}
            </p>
          )}
        </div>
        {canAct && (
          <div className="flex gap-2 flex-shrink-0">
            <ActionBtn onClick={onApprove} variant="approve" icon={CheckCircle} label="Approve" />
            <ActionBtn onClick={() => setShowReject((s) => !s)} variant="reject" icon={XCircle} label="Reject" />
          </div>
        )}
      </div>
      {showReject && canAct && (
        <RejectDialog
          onConfirm={(reason) => { onReject(reason); setShowReject(false); }}
          onCancel={() => setShowReject(false)}
        />
      )}
    </div>
  );
}


function NgoApplicationsSection() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ngo-applications"],
    queryFn: adminListNgoApplications,
    staleTime: 15000,
  });

  const [rejectId, setRejectId] = useState<number | null>(null);

  const acceptMut = useMutation({
    mutationFn: (id: number) => adminAcceptNgoApplication(id),
    onSuccess: () => { toast({ title: "Application accepted" }); qc.invalidateQueries({ queryKey: ["admin-ngo-applications"] }); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => adminRejectNgoApplication(id, reason),
    onSuccess: () => { toast({ title: "Application rejected" }); qc.invalidateQueries({ queryKey: ["admin-ngo-applications"] }); setRejectId(null); },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  const apps = data?.applications ?? [];

  const statusBadge = (status: string) => {
    if (status === "accepted") return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3" />Accepted</span>;
    if (status === "rejected") return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200"><XCircle className="w-3 h-3" />Rejected</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />Pending</span>;
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">NGO Join Applications</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Review NGO applications to tackle specific problems.</p>
        </div>
        <span className="text-sm text-muted-foreground">{apps.length} total · {apps.filter((a) => a.status === "pending").length} pending</span>
      </div>

      {apps.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">No applications yet.</div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="border border-border rounded-xl p-5 space-y-3 bg-card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{app.ngoName ?? "Unknown NGO"}</span>
                    {statusBadge(app.status)}
                    {app.problemCategory && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium border border-secondary/20">{app.problemCategory}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Problem: <span className="font-medium text-foreground">{app.problemTitle ?? `#${app.problemId}`}</span>
                    {" · "}{new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {app.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => acceptMut.mutate(app.id)} disabled={acceptMut.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50">
                      <CheckCircle className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button onClick={() => setRejectId(app.id)} disabled={rejectMut.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground font-medium">Estimated cost</span>
                  <p className="mt-0.5 font-semibold">Rs. {app.estimatedCost.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground font-medium">Timeline</span>
                  <p className="mt-0.5 font-semibold">{app.timelineValue} {app.timelineUnit}</p>
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground font-medium">Resources needed</span>
                  <p className="mt-0.5 font-semibold truncate">{app.requiredResources || "—"}</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground text-xs font-medium mb-1">Solution plan</p>
                <p className="text-foreground leading-relaxed">{app.planDescription}</p>
              </div>

              {app.status === "rejected" && app.rejectionReason && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  Rejection reason: {app.rejectionReason}
                </p>
              )}

              {rejectId === app.id && (
                <RejectDialog
                  onConfirm={(reason) => rejectMut.mutate({ id: app.id, reason })}
                  onCancel={() => setRejectId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
