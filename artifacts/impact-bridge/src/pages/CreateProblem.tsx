import { useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle, Upload, AlertCircle, Lock, LogIn, X, Loader2, ImagePlus } from "lucide-react";
import { useCreateProblem } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { setReturnTo } from "@/components/ProtectedRoute";
import { uploadImage } from "@/services/uploads";

const categories = ["Infrastructure", "Environment", "Education", "Health", "Safety", "Water", "Roads", "Sanitation", "Other"];
const urgencyLevels = ["low", "medium", "high", "critical"];

export function CreateProblem() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    imageUrl: "",
    fundingGoal: "",
    urgency: "medium",
  });

  const { mutate: createProblem, isPending } = useCreateProblem({
    mutation: {
      onSuccess: (data) => {
        setSubmitted(true);
        setTimeout(() => navigate(`/problems/${data.id}`), 2000);
      },
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.category) errs.category = "Category is required";
    if (!form.location.trim()) errs.location = "Location is required";
    if (!form.fundingGoal || isNaN(Number(form.fundingGoal)) || Number(form.fundingGoal) <= 0) {
      errs.fundingGoal = "Enter a valid funding goal";
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    createProblem({
      data: {
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        imageUrl: form.imageUrl || undefined,
        fundingGoal: Number(form.fundingGoal),
        urgency: form.urgency,
      },
    });
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file (JPEG, PNG, WEBP, or GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5 MB or smaller.");
      return;
    }
    try {
      setUploading(true);
      const { url } = await uploadImage(file);
      update("imageUrl", url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    update("imageUrl", "");
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Problem Posted!</h2>
        <p className="text-muted-foreground">Your problem has been successfully reported. Redirecting you to the problem page...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Report a Problem</h1>
        <p className="text-muted-foreground">Describe the issue clearly so your community can rally around it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Problem Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Broken streetlights on MG Road causing accidents"
              className={`w-full px-3 py-2.5 rounded-lg border ${errors.title ? "border-destructive" : "border-border"} bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the problem in detail — what's happening, how long, what impact it's causing..."
              className={`w-full px-3 py-2.5 rounded-lg border ${errors.description ? "border-destructive" : "border-border"} bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border ${errors.category ? "border-destructive" : "border-border"} bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer`}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Urgency Level</label>
              <div className="flex gap-2">
                {urgencyLevels.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => update("urgency", u)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                      form.urgency === u
                        ? "bg-primary text-white"
                        : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Location <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. MG Road, Bangalore, Karnataka"
              className={`w-full px-3 py-2.5 rounded-lg border ${errors.location ? "border-destructive" : "border-border"} bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.location && (
              <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.location}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Photo <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {form.imageUrl ? (
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
                <img src={form.imageUrl} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 text-foreground text-xs font-medium hover:bg-white transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !isAuthenticated}
                className="w-full rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-colors px-4 py-8 text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Uploading…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Click to upload a photo</p>
                    <p className="text-xs">JPEG, PNG, WEBP or GIF · up to 5 MB</p>
                  </div>
                )}
              </button>
            )}
            {uploadError && (
              <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {uploadError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Estimated Cost (Rs.) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              value={form.fundingGoal}
              onChange={(e) => update("fundingGoal", e.target.value)}
              placeholder="e.g. 50000"
              min="1"
              className={`w-full px-3 py-2.5 rounded-lg border ${errors.fundingGoal ? "border-destructive" : "border-border"} bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.fundingGoal && (
              <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.fundingGoal}
              </p>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Please login to post a problem</p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                You need an account to report problems and rally your community.
              </p>
              <Link
                href="/login"
                onClick={() => setReturnTo("/create")}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign in to continue
              </Link>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !isAuthenticated}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Posting..." : isAuthenticated ? "Post Problem" : "Login required to post"}
        </button>
        <p className="text-xs text-center text-muted-foreground">
          By posting, you confirm this is a genuine community problem.
        </p>
      </form>
    </div>
  );
}
