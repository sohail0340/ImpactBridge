import { Link } from "wouter";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Users, TrendingUp, CheckCircle, Clock, X, Handshake, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { submitNgoApplication, getMyNgoApplication, type SubmitNgoApplicationBody } from "@/services/domain";

interface Problem {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  imageUrl?: string;
  fundingGoal: number;
  fundingRaised: number;
  progressPercent: number;
  joinedCount: number;
  urgency: string;
  isJoined?: boolean;
}

interface ProblemCardProps {
  problem: Problem;
}

const urgencyColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const statusConfig = {
  pending: { label: "Application pending", icon: Clock, cls: "text-amber-600 bg-amber-50 border-amber-200" },
  accepted: { label: "Application accepted", icon: CheckCircle, cls: "text-green-600 bg-green-50 border-green-200" },
  rejected: { label: "Application rejected", icon: XCircle, cls: "text-red-600 bg-red-50 border-red-200" },
};

export function ProblemCard({ problem }: ProblemCardProps) {
  const progress = Math.min(100, Math.round(problem.progressPercent));
  const [imgFailed, setImgFailed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  useEffect(() => { setImgFailed(false); }, [problem.imageUrl]);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isNgo = user?.role === "ngo";

  const { data: appData, isLoading: appLoading } = useQuery({
    queryKey: ["ngo-application", problem.id],
    queryFn: () => getMyNgoApplication(problem.id),
    enabled: isNgo,
    staleTime: 30000,
  });

  const application = appData?.application ?? null;

  const submitMut = useMutation({
    mutationFn: (body: SubmitNgoApplicationBody) => submitNgoApplication(problem.id, body),
    onSuccess: () => {
      toast({
        title: "Application submitted successfully!",
        description: "Your application is now pending admin review. You can track the status in your Profile.",
        duration: 6000,
      });
      qc.invalidateQueries({ queryKey: ["ngo-application", problem.id] });
      qc.invalidateQueries({ queryKey: ["my-ngo-applications"] });
      setShowForm(false);
    },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
      <div className="relative h-44 overflow-hidden bg-muted">
        {problem.imageUrl && !imgFailed ? (
          <img
            src={problem.imageUrl}
            alt={problem.title}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 gap-2">
            <TrendingUp className="w-10 h-10 text-primary/60" />
            <span className="text-xs font-medium text-primary/70 uppercase tracking-wide">{problem.category}</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${urgencyColors[problem.urgency] || urgencyColors.medium}`}>
            {problem.urgency.charAt(0).toUpperCase() + problem.urgency.slice(1)}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary/80 text-white border border-white/10">
            {problem.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2 mb-2">{problem.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{problem.description}</p>

        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <MapPin className="w-3 h-3" /><span>{problem.location}</span>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Rs. {problem.fundingRaised.toLocaleString()} raised</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">Goal: Rs. {problem.fundingGoal.toLocaleString()}</div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Users className="w-3 h-3" /><span>{problem.joinedCount} joined</span>
          </div>
          <div className="flex items-center gap-2">
            {isNgo && !appLoading && (
              application ? (
                (() => {
                  const cfg = statusConfig[application.status as keyof typeof statusConfig] ?? statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${cfg.cls}`}>
                      <Icon className="w-3.5 h-3.5" /> {cfg.label}
                    </span>
                  );
                })()
              ) : (
                <button onClick={() => setShowForm(true)}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10">
                  Join Problem
                </button>
              )
            )}
            <Link href={`/problems/${problem.id}`} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90">
              View Details
            </Link>
          </div>
        </div>

        {isNgo && application?.status === "rejected" && application.rejectionReason && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            Rejection reason: {application.rejectionReason}
          </p>
        )}
      </div>

      {showForm && createPortal(
        <NgoApplicationForm
          problem={{ id: problem.id, title: problem.title, category: problem.category }}
          isSubmitting={submitMut.isPending}
          onClose={() => setShowForm(false)}
          onSubmit={(body) => submitMut.mutate(body)}
        />,
        document.body
      )}
    </div>
  );
}

function NgoApplicationForm({ problem, isSubmitting, onClose, onSubmit }: {
  problem: { id: number; title: string; category: string };
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (body: SubmitNgoApplicationBody) => void;
}) {
  const [form, setForm] = useState<SubmitNgoApplicationBody>({
    planDescription: "",
    estimatedCost: 0,
    timelineValue: 1,
    timelineUnit: "months",
    requiredResources: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 rounded-t-2xl flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Handshake className="w-5 h-5 text-secondary flex-shrink-0" />
              Apply to join problem
            </h2>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{problem.title}</p>
            <span className="inline-block mt-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-semibold">
              Category: {problem.category}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground flex-shrink-0 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pending notice */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
          After submitting, your application will be reviewed by an admin. You can track approval status in your <strong>&nbsp;Profile&nbsp;</strong>.
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Solution plan */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">
              Your solution plan <span className="text-destructive">*</span>
            </label>
            <textarea
              className="input min-h-[130px] w-full resize-y text-sm"
              required
              placeholder={`Describe how your NGO plans to address this ${problem.category} problem…`}
              value={form.planDescription}
              onChange={(e) => setForm({ ...form, planDescription: e.target.value })}
            />
          </div>

          {/* Cost */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Estimated cost (Rs.)</label>
            <input
              type="number" min={0}
              className="input w-full text-sm"
              value={form.estimatedCost || ""}
              onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })}
              placeholder="e.g. 50000"
            />
          </div>

          {/* Timeline — full row, clear layout */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Timeline</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                <input
                  type="number" min={1}
                  className="input w-full text-sm"
                  value={form.timelineValue}
                  onChange={(e) => setForm({ ...form, timelineValue: Number(e.target.value) })}
                  placeholder="e.g. 3"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                <select
                  className="input w-full text-sm bg-background"
                  value={form.timelineUnit}
                  onChange={(e) => setForm({ ...form, timelineUnit: e.target.value as "days" | "months" })}
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
          </div>

          {/* Required resources */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Required resources</label>
            <textarea
              className="input min-h-[90px] w-full resize-y text-sm"
              placeholder="E.g. volunteers, equipment, permits, funding…"
              value={form.requiredResources}
              onChange={(e) => setForm({ ...form, requiredResources: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              <Handshake className="w-4 h-4" />
              {isSubmitting ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
