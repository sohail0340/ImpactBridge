import { MapPin, Star, FileText, CheckCircle, TrendingUp, Clock, XCircle, Handshake, User } from "lucide-react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { getMyAllNgoApplications } from "@/services/domain";
import type { NgoJoinApplication } from "@/services/domain";
import { useAuth } from "@/hooks/useAuth";

const STATUS_CONFIG = {
  pending: {
    label: "Pending review",
    icon: Clock,
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  accepted: {
    label: "Approved",
    icon: CheckCircle,
    cls: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    cls: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
} as const;

function ApplicationCard({ app }: { app: NgoJoinApplication }) {
  const cfg = STATUS_CONFIG[app.status];
  const Icon = cfg.icon;
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground line-clamp-1">
            {app.problemTitle ?? `Problem #${app.problemId}`}
          </p>
          {app.problemCategory && (
            <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
              {app.problemCategory}
            </span>
          )}
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls} flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
          {cfg.label}
        </span>
      </div>

      <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {app.planDescription}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border pt-2.5">
        <span>Cost: <strong className="text-foreground">Rs. {app.estimatedCost?.toLocaleString()}</strong></span>
        <span>Timeline: <strong className="text-foreground">{app.timelineValue} {app.timelineUnit}</strong></span>
        <span>Submitted: <strong className="text-foreground">{new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
      </div>

      {app.status === "rejected" && app.rejectionReason && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
          <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span><strong>Reason:</strong> {app.rejectionReason}</span>
        </div>
      )}
    </div>
  );
}

export function Profile() {
  const { data: user, isLoading } = useGetCurrentUser();
  const { user: authUser } = useAuth();
  const isNgo = authUser?.role === "ngo";

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ["my-ngo-applications"],
    queryFn: getMyAllNgoApplications,
    enabled: isNgo,
    staleTime: 30000,
  });

  const applications = appsData?.applications ?? [];
  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const acceptedCount = applications.filter((a) => a.status === "accepted").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="flex gap-6">
            <div className="w-24 h-24 bg-muted rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-muted rounded w-48" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  const stats = [
    { label: "Contributions", value: `Rs. ${user.totalContributed.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
    { label: "Problems Created", value: user.problemsCreated, icon: FileText, color: "text-blue-600" },
    { label: "Problems Solved", value: user.problemsSolved, icon: CheckCircle, color: "text-primary" },
    { label: "Reputation", value: user.reputationScore, icon: Star, color: "text-accent" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Profile card */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center border-4 border-primary/20">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Star className="w-4 h-4 text-accent" fill="currentColor" />
                <span className="text-sm font-bold text-accent-foreground">{user.reputationScore}</span>
              </div>
            </div>
            {user.location && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-2">
                <MapPin className="w-4 h-4" />
                <span>{user.location}</span>
              </div>
            )}
            {user.bio && (
              <p className="text-foreground mt-3 text-sm leading-relaxed">{user.bio}</p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Member since {new Date(user.joinedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-card-border rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* NGO Applications Tracker — only for NGO users */}
      {isNgo && (
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Handshake className="w-5 h-5 text-secondary" />
              My Problem Applications
            </h2>
            <div className="flex items-center gap-3 text-xs font-semibold">
              {pendingCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> {pendingCount} pending
                </span>
              )}
              {acceptedCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle className="w-3.5 h-3.5" /> {acceptedCount} approved
                </span>
              )}
              {rejectedCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                  <XCircle className="w-3.5 h-3.5" /> {rejectedCount} rejected
                </span>
              )}
            </div>
          </div>

          {appsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Handshake className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">You haven't applied to any problems yet.</p>
              <p className="text-xs mt-1">Browse problems and click "Join Problem" to apply.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* About */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">About</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {user.bio ?? "No bio added yet. Edit your profile to add a bio."}
        </p>
        <button className="mt-4 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Edit Profile
        </button>
      </div>
    </div>
  );
}
