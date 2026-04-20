import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Zap, Eye, EyeOff, CheckCircle, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { popReturnTo } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { uploadImage, type NgoSignupFields } from "@/services/domain";

const emptyNgo: NgoSignupFields = {
  organization: "",
  contactNumber: "",
  previousWorkUrl: "",
  certificateUrl: "",
  agreedToProvideUpdates: false,
};

export function Signup() {
  const [, navigate] = useLocation();
  const { signup } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" as "user" | "ngo" });
  const [ngo, setNgo] = useState<NgoSignupFields>(emptyNgo);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<null | "previousWorkUrl" | "certificateUrl">(null);

  const uploadFor = async (key: "previousWorkUrl" | "certificateUrl", file: File) => {
    try {
      setUploadingKey(key);
      const url = await uploadImage(file);
      setNgo((n) => ({ ...n, [key]: url }));
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (form.role === "ngo") {
        if (!ngo.agreedToProvideUpdates) throw new Error("Please agree to provide updates and proof of work.");
      }
      await signup({ ...form, ngo: form.role === "ngo" ? ngo : undefined });
      const returnTo = popReturnTo();
      toast({
        title: "Account created!",
        description: form.role === "ngo"
          ? "Your NGO profile has been submitted for admin review."
          : "Welcome to ImpactBridge.",
      });
      navigate(returnTo ?? "/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold text-foreground">ImpactBridge</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Join the movement</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your account and start making a difference today</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                {(["user", "ngo"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r }))}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.role === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {r === "user" ? "Citizen" : "NGO / Organization"}
                  </button>
                ))}
              </div>
            </div>

            <Field label={form.role === "ngo" ? "Contact Person Name" : "Full Name"}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Priya Sharma"
                required
                className="input"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
                className="input"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {form.role === "ngo" && (
              <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">NGO details for admin review</p>

                <Field label="Organisation name">
                  <input className="input" required value={ngo.organization}
                    onChange={(e) => setNgo({ ...ngo, organization: e.target.value })} placeholder="Clean Cities Foundation" />
                </Field>

                <Field label="Contact number">
                  <input className="input" required value={ngo.contactNumber}
                    onChange={(e) => setNgo({ ...ngo, contactNumber: e.target.value })} placeholder="+92 300 0000000" />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <FileField label="Previous work (image)" url={ngo.previousWorkUrl} busy={uploadingKey === "previousWorkUrl"}
                    onFile={(f) => uploadFor("previousWorkUrl", f)} />
                  <FileField label="Proof of authenticity" url={ngo.certificateUrl} busy={uploadingKey === "certificateUrl"}
                    onFile={(f) => uploadFor("certificateUrl", f)} />
                </div>

                <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={ngo.agreedToProvideUpdates}
                    onChange={(e) => setNgo({ ...ngo, agreedToProvideUpdates: e.target.checked })} />
                  <span>I agree to provide updates and proof of work after each problem I take on.</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : form.role === "ngo" ? "Submit for review" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
      <style>{`.input{width:100%;padding:0.625rem 0.75rem;border-radius:0.5rem;border:1px solid hsl(var(--border));background:hsl(var(--background));color:hsl(var(--foreground));font-size:0.875rem;outline:none}.input:focus{box-shadow:0 0 0 2px hsl(var(--primary)/0.5)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function FileField({ label, url, onFile, busy }: { label: string; url?: string; onFile: (f: File) => void; busy: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background cursor-pointer hover:border-primary/50 text-sm text-muted-foreground">
        <Upload className="w-4 h-4" />
        {busy ? "Uploading..." : url ? "Replace" : "Upload image"}
        <input type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </label>
      {url && <CheckCircle className="inline w-4 h-4 text-primary mt-1" />}
    </div>
  );
}
