import { useEffect, useState } from "react";
import { CheckCircle, ShieldCheck, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUpdates, addUpdate, verifyUpdate, type ProblemUpdate } from "@/services/updates";

export function UpdatesSection({ problemId }: { problemId: number }) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<ProblemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUpdates(problemId);
      setUpdates(data);
    } catch {
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [problemId, user?.id]);

  const handleVerify = async (updateId: number) => {
    if (!user) { window.location.href = `${import.meta.env.BASE_URL}login`; return; }
    setVerifyingId(updateId);
    try {
      const res = await verifyUpdate(problemId, updateId);
      setUpdates((prev) => prev.map((u) => u.id === updateId
        ? { ...u, verifiedCount: res.verifiedCount, verifiedByMe: true }
        : u));
    } catch (e) {
      const msg = (e as Error).message;
      if (!msg.includes("Already verified")) alert(msg);
    } finally {
      setVerifyingId(null);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = `${import.meta.env.BASE_URL}login`; return; }
    if (!content.trim()) return;
    setPosting(true);
    try {
      await addUpdate(problemId, content.trim(), imageUrl.trim() || undefined);
      setContent("");
      setImageUrl("");
      setShowForm(false);
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPosting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Progress Updates</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
        >
          <Plus className="w-4 h-4" /> Post update
        </button>
      </div>

      {showForm && (
        <form onSubmit={handlePost} className="mb-5 p-4 rounded-lg bg-muted/40 border border-border space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update on the progress..."
            rows={3}
            required
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Optional image URL"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={posting} className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
              {posting ? "Posting..." : "Post update"}
            </button>
          </div>
        </form>
      )}

      {updates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No updates yet. Be the first to share progress.</p>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div key={update.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{update.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(update.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{update.content}</p>
                {update.imageUrl && (
                  <img src={update.imageUrl} alt="" className="mt-2 rounded-lg h-32 object-cover" />
                )}
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleVerify(update.id)}
                    disabled={update.verifiedByMe || verifyingId === update.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      update.verifiedByMe
                        ? "bg-primary/10 text-primary cursor-default"
                        : "bg-muted hover:bg-primary/10 hover:text-primary text-foreground"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {update.verifiedByMe ? "Verified by you" : "Verify"}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {update.verifiedCount} {update.verifiedCount === 1 ? "verification" : "verifications"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
