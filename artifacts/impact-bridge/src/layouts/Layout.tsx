import { Navbar } from "@/components/Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <footer className="bg-secondary text-slate-400 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <span className="text-white font-bold text-lg">ImpactBridge</span>
              <p className="mt-2 text-sm">
                Connecting communities with real problems to real solutions. Every contribution tracked, every rupee accountable.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/explore" className="hover:text-white transition-colors">Explore Problems</a></li>
                <li><a href="/create" className="hover:text-white transition-colors">Report a Problem</a></li>
                <li><a href="/community" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Trust</h4>
              <ul className="space-y-2 text-sm">
                <li>100% fund transparency</li>
                <li>Community verified updates</li>
                <li>Real-time progress tracking</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs">
            © 2026 ImpactBridge. Built by <span className="text-primary font-medium">Learndev</span> — Sohail Ahmad &amp; Haris Ahmad.
          </div>
        </div>
      </footer>
    </div>
  );
}
