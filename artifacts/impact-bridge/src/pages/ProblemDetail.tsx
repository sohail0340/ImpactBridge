import { useState } from "react";
import { useRoute, Link } from "wouter";
import { MapPin, Calendar, User, Users, CheckCircle, ThumbsUp, ThumbsDown, ArrowLeft, Send, Upload, Handshake, Clock, X } from "lucide-react";
import {
  useGetProblem,
  useGetProblemUpdates,
  useGetProblemComments,
  useVoteProblem,
  useCreateComment,
  getGetProblemQueryKey,
} from "@workspace/api-client-react";
import { ProgressStages } from "@/components/ProgressStages";
import { UpdatesSection } from "@/components/UpdatesSection";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  joinProblem, leaveProblem, solveAsNgo, submitContribution, uploadImage, fetchMyStats,
  type PaymentMethod, type SolveAsNgoPlan,
} from "@/services/domain";

export function ProblemDetail() {
  const [, params] = useRoute("/problems/:id");
  const id = parseInt(params?.id ?? "0");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const [comment, setComment] = useState("");
  const [showContribute, setShowContribute] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [votedLocally, setVotedLocally] = useState<"verify" | "dispute" | null>(null);

  const { data: problem, isLoading } = useGetProblem(id);
  const { data: comments } = useGetProblemComments(id);
  useGetProblemUpdates(id);

  const { data: myStats } = useQuery({
    queryKey: ["me-stats"],
    queryFn: fetchMyStats,
    enabled: !!user,
    staleTime: 15000,
  });

  const isJoined = !!(problem as { isJoined?: boolean } | undefined)?.isJoined;

  const invalidateProblem = () => queryClient.invalidateQueries({ queryKey: getGetProblemQueryKey(id) });

  const joinMut = useMutation({
    mutationFn: () => joinProblem(id),
    onSuccess: (r) => {
      if (r.alreadyMember) toast({ title: "Already joined", description: "You're already part of this problem." });
      else toast({ title: "Joined!", description: "You're now part of this problem." });
      invalidateProblem();
      queryClient.invalidateQueries({ queryKey: ["me-stats"] });
      queryClient.invalidateQueries({ queryKey: ["my-joined"] });
    },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  const leaveMut = useMutation({
    mutationFn: () => leaveProblem(id),
    onSuccess: () => {
      toast({ title: "Left problem" });
      invalidateProblem();
      queryClient.invalidateQueries({ queryKey: ["me-stats"] });
      queryClient.invalidateQueries({ queryKey: ["my-joined"] });
    },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  const solveMut = useMutation({
    mutationFn: (plan: SolveAsNgoPlan) => solveAsNgo(id, plan),
    onSuccess: (r) => { toast({ title: "Taken!", description: r.message }); invalidateProblem(); setShowSolveModal(false); },
    onError: (e) => toast({ title: "Not allowed", description: (e as Error).message, variant: "destructive" }),
  });

  const { mutate: voteProblem } = useVoteProblem({
    mutation: {
      onSuccess: (_, vars) => {
        const body = (vars as { data: { vote: "verify" | "dispute" } }).data;
        setVotedLocally(body.vote);
        invalidateProblem();
      },
    },
  });

  const { mutate: createComment } = useCreateComment({
    mutation: {
      onSuccess: () => { setComment(""); queryClient.invalidateQueries({ queryKey: ["getProblemComments", id] }); },
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-lg font-medium">Problem not found.</p>
        <Link href="/explore" className="mt-4 inline-flex items-center gap-2 text-primary">
          <ArrowLeft className="w-4 h-4" /> Back to Explore
        </Link>
      </div>
    );
  }

  const progress = Math.min(100, Math.round(problem.progressPercent));
  const isApprovedNgo = user?.role === "ngo" && myStats?.ngoStatus === "approved";
  const canSolve = isApprovedNgo || user?.role === "admin";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/explore" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{problem.category}</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent-foreground border border-accent/20">
                {problem.urgency.charAt(0).toUpperCase() + problem.urgency.slice(1)} urgency
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{problem.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span>{problem.location}</span></div>
              <div className="flex items-center gap-1.5"><User className="w-4 h-4" /><span>Posted by {problem.postedBy}</span></div>
              <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{new Date(problem.createdAt).toLocaleDateString()}</span></div>
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /><span>{problem.joinedCount} joined</span></div>
            </div>
          </div>

          {problem.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-card-border">
              <img src={problem.imageUrl} alt={problem.title} className="w-full h-72 object-cover" />
            </div>
          )}

          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6">Progress Tracker</h2>
            <ProgressStages workProgressPercent={problem.workProgressPercent ?? 0} status={problem.status} />
          </div>

          <UpdatesSection problemId={id} />

          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Community Verification</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {(problem.verifiedCount ?? 0) + (votedLocally === "verify" ? 1 : 0)} verified
                </span>
              </div>
              <span className="text-muted-foreground text-sm">by community members</span>
            </div>
            {user && !votedLocally ? (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Is this a genuine problem that needs attention?</p>
                <div className="flex gap-3">
                  <button onClick={() => voteProblem({ id, data: { vote: "verify" } })} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-sm font-medium">
                    <ThumbsUp className="w-4 h-4" /> Yes, verify it
                  </button>
                  <button onClick={() => voteProblem({ id, data: { vote: "dispute" } })} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground border border-border hover:bg-muted/80 text-sm font-medium">
                    <ThumbsDown className="w-4 h-4" /> Dispute
                  </button>
                </div>
              </div>
            ) : !user ? (
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">Sign in</Link> to verify or dispute this problem.
              </p>
            ) : (
              <p className="text-sm text-primary font-medium">
                {votedLocally === "verify" ? "Thank you for verifying!" : "Your dispute has been recorded."}
              </p>
            )}
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Comments ({comments?.length ?? 0})</h2>
            <div className="space-y-4 mb-4">
              {comments?.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {c.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{c.author}</span>
                      <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.content}</p>
                  </div>
                </div>
              ))}
              {(!comments || comments.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>}
            </div>
            {user ? (
              <div className="flex gap-2">
                <input type="text" placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={(e) => { if (e.key === "Enter" && comment.trim()) createComment({ id, data: { content: comment } }); }} />
                <button onClick={() => comment.trim() && createComment({ id, data: { content: comment } })}
                  className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90"><Send className="w-4 h-4" /></button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground"><Link href="/login" className="text-primary hover:underline">Sign in</Link> to comment.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-6 sticky top-24 space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-3">Fund This Problem</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Raised</span>
                <span className="font-semibold text-primary">Rs. {problem.fundingRaised.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}% funded</span>
                <span>Goal: Rs. {problem.fundingGoal.toLocaleString()}</span>
              </div>
            </div>

            {user ? (
              showContribute ? (
                <ContributionForm problemId={id} onDone={() => { setShowContribute(false); queryClient.invalidateQueries({ queryKey: ["me-stats"] }); }} onCancel={() => setShowContribute(false)} />
              ) : (
                <button onClick={() => setShowContribute(true)} className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">
                  Contribute Funds
                </button>
              )
            ) : (
              <Link href="/login" className="block w-full text-center py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">
                Sign in to contribute
              </Link>
            )}

            <div className="pt-4 border-t border-border space-y-2">
              {user?.role === "ngo" || user?.role === "admin" ? (
                isJoined ? (
                  <button onClick={() => leaveMut.mutate()} disabled={leaveMut.isPending}
                    className="w-full py-2.5 rounded-lg bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> You've joined this problem · Leave
                  </button>
                ) : (
                  <button onClick={() => joinMut.mutate()} disabled={joinMut.isPending}
                    className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/10 flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" /> Join Problem
                  </button>
                )
              ) : user ? null : (
                <Link href="/login" className="block w-full text-center py-2.5 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/10">
                  Sign in to join
                </Link>
              )}

              {user?.role === "ngo" && (
                canSolve ? (
                  <button onClick={() => setShowSolveModal(true)} disabled={solveMut.isPending || problem.status === "in_progress"}
                    className="w-full py-2.5 rounded-lg bg-secondary text-white font-medium text-sm hover:bg-secondary/90 disabled:opacity-60 flex items-center justify-center gap-2">
                    <Handshake className="w-4 h-4" /> {problem.status === "in_progress" ? "Being solved" : "Solve as NGO"}
                  </button>
                ) : (
                  <div className="w-full text-center py-2 px-3 rounded-lg bg-muted text-muted-foreground text-xs flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> NGO profile awaiting admin approval
                  </div>
                )
              )}
            </div>

            {showSolveModal && (
              <SolveNgoModal
                problemTitle={problem.title}
                isSubmitting={solveMut.isPending}
                onClose={() => setShowSolveModal(false)}
                onSubmit={(plan) => solveMut.mutate(plan)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SolveNgoModal({ problemTitle, isSubmitting, onClose, onSubmit }: {
  problemTitle: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (plan: SolveAsNgoPlan) => void;
}) {
  const [plan, setPlan] = useState<SolveAsNgoPlan>({
    planDescription: "",
    estimatedCost: 0,
    timelineValue: 1,
    timelineUnit: "months",
    requiredResources: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(plan);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Commit to solve this problem</h2>
            <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">{problemTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Solution plan <span className="text-destructive">*</span></label>
            <textarea
              className="input min-h-[100px] w-full"
              required
              placeholder="Describe how your organisation plans to solve this specific problem."
              value={plan.planDescription}
              onChange={(e) => setPlan({ ...plan, planDescription: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Estimated cost (Rs.)</label>
              <input
                type="number" min={0} className="input w-full"
                value={plan.estimatedCost || ""}
                onChange={(e) => setPlan({ ...plan, estimatedCost: Number(e.target.value) })}
                placeholder="50000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Estimated timeline</label>
              <div className="flex gap-2">
                <input
                  type="number" min={1} className="input flex-1"
                  value={plan.timelineValue}
                  onChange={(e) => setPlan({ ...plan, timelineValue: Number(e.target.value) })}
                />
                <select
                  className="input flex-1"
                  value={plan.timelineUnit}
                  onChange={(e) => setPlan({ ...plan, timelineUnit: e.target.value as "days" | "months" })}
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Required resources</label>
            <textarea
              className="input min-h-[70px] w-full"
              placeholder="E.g. volunteers, equipment, permits."
              value={plan.requiredResources}
              onChange={(e) => setPlan({ ...plan, requiredResources: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 disabled:opacity-60 flex items-center justify-center gap-2">
              <Handshake className="w-4 h-4" /> {isSubmitting ? "Committing…" : "Commit to solve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContributionForm({ problemId, onDone, onCancel }: { problemId: number; onDone: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("jazzcash");
  const [methodOther, setMethodOther] = useState("");
  const [txnId, setTxnId] = useState("");
  const [proofUrl, setProofUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);

  const mut = useMutation({
    mutationFn: () => submitContribution({
      problemId, amount: Number(amount), paymentMethod: method,
      paymentMethodOther: method === "other" ? methodOther : undefined,
      transactionId: txnId, proofImageUrl: proofUrl,
    }),
    onSuccess: () => {
      toast({ title: "Submitted for review", description: "An admin will verify and credit your contribution shortly." });
      onDone();
    },
    onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
  });

  const uploadProof = async (f: File) => {
    setUploading(true);
    try { setProofUrl(await uploadImage(f)); }
    catch (e) { toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" }); }
    finally { setUploading(false); }
  };

  const canSubmit = Number(amount) > 0 && txnId.trim() && (method !== "other" || methodOther.trim());

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Amount (Rs.)</label>
        <input type="number" min={1} placeholder="e.g. 1000" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Payment method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
          <option value="jazzcash">JazzCash</option>
          <option value="easypaisa">EasyPaisa</option>
          <option value="bank">Bank transfer</option>
          <option value="other">Other</option>
        </select>
      </div>

      {method === "other" && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Specify method</label>
          <input placeholder="e.g. PayPal, Wise..." value={methodOther} onChange={(e) => setMethodOther(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Transaction ID</label>
        <input placeholder="Reference from your payment app" value={txnId} onChange={(e) => setTxnId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Proof of transaction (screenshot)</label>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background cursor-pointer hover:border-primary/50 text-sm text-muted-foreground">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : proofUrl ? "Replace image" : "Upload image"}
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProof(f); }} />
        </label>
        {proofUrl && <p className="mt-1 text-xs text-primary flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Proof uploaded</p>}
      </div>

      <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-foreground">
        Your contribution will be reviewed by an admin. Funds will apply to the problem once approved.
      </div>

      <button onClick={() => mut.mutate()} disabled={mut.isPending || !canSubmit}
        className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50">
        {mut.isPending ? "Submitting..." : "Submit for review"}
      </button>
      <button onClick={onCancel} className="w-full py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted">
        Cancel
      </button>
    </div>
  );
}
