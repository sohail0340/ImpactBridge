import { Link } from "wouter";
import { TrendingUp, Users, FileText, Bell, CheckCircle, Clock, AlertCircle, MapPin } from "lucide-react";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyJoinedProblems } from "@/services/domain";

export function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: joined } = useQuery({ queryKey: ["my-joined"], queryFn: fetchMyJoinedProblems });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const notificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-primary" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-accent" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Track your impact and contributions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Contributions",
            value: `Rs. ${(stats?.totalContributions ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Problems Joined",
            value: stats?.problemsJoined ?? 0,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Problems Created",
            value: stats?.problemsCreated ?? 0,
            icon: FileText,
            color: "text-accent",
            bg: "bg-accent/10",
          },
          {
            label: "Reputation Score",
            value: stats?.reputationScore ?? 0,
            icon: CheckCircle,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-card-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Problems I've Joined</h2>
          <Link href="/explore" className="text-sm text-primary hover:underline font-medium">Explore more</Link>
        </div>
        {joined && joined.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {joined.map((p) => (
              <Link key={p.id} href={`/problems/${p.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{p.location}
                  </p>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, p.progressPercent)}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-8 h-8 mx-auto text-muted-foreground opacity-40 mb-2" />
            <p className="text-sm text-muted-foreground">You haven't joined any problems yet.</p>
            <Link href="/explore" className="text-sm text-primary hover:underline mt-2 block">Find problems near you</Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">My Problems</h2>
            <Link href="/create" className="text-sm text-primary hover:underline font-medium">+ New</Link>
          </div>
          {stats?.myProblems && stats.myProblems.length > 0 ? (
            <div className="space-y-3">
              {stats.myProblems.map((p) => (
                <Link
                  key={p.id}
                  href={`/problems/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.location}</p>
                  </div>
                  <div className="ml-3">
                    <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${p.progressPercent}%` }} />
                    </div>
                    <p className="text-xs text-right text-muted-foreground mt-0.5">{Math.round(p.progressPercent)}%</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 mx-auto text-muted-foreground opacity-40 mb-2" />
              <p className="text-sm text-muted-foreground">No problems created yet.</p>
              <Link href="/create" className="text-sm text-primary hover:underline mt-2 block">Report your first problem</Link>
            </div>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">My Contributions</h2>
          {stats?.myContributions && stats.myContributions.length > 0 ? (
            <div className="space-y-3">
              {stats.myContributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.problemTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-3 text-sm font-bold text-primary">
                    Rs. {c.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground opacity-40 mb-2" />
              <p className="text-sm text-muted-foreground">No contributions yet.</p>
              <Link href="/explore" className="text-sm text-primary hover:underline mt-2 block">Find problems to support</Link>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-bold">Notifications</h2>
          {stats?.notifications && stats.notifications.filter((n) => !n.read).length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium">
              {stats.notifications.filter((n) => !n.read).length}
            </span>
          )}
        </div>
        {stats?.notifications && stats.notifications.length > 0 ? (
          <div className="space-y-2">
            {stats.notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${!n.read ? "bg-primary/5 border border-primary/10" : "border border-border"}`}
              >
                {notificationIcon(n.type)}
                <div className="flex-1">
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="w-8 h-8 mx-auto text-muted-foreground opacity-40 mb-2" />
            <p className="text-sm text-muted-foreground">All caught up! No new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
