import { Link } from "wouter";
import { ArrowRight, Shield, Eye, CheckCircle, TrendingUp, Globe } from "lucide-react";
import { useGetFeaturedProblems, useGetOverviewStats } from "@workspace/api-client-react";
import { ProblemCard } from "@/components/ProblemCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import heroImage from "@/assets/hero-community.png";

const steps = [
  {
    number: "01",
    title: "Post Problem",
    description: "Report any local issue with details, photos, and estimated costs. Takes 2 minutes.",
  },
  {
    number: "02",
    title: "People Join",
    description: "Community members rally around the issue, verify it, and pledge their support.",
  },
  {
    number: "03",
    title: "Fund & Plan",
    description: "Crowdfund the solution transparently. Every rupee tracked and accounted for.",
  },
  {
    number: "04",
    title: "Track Progress",
    description: "Follow real-time updates with photos and milestones until the problem is solved.",
  },
];

const trustFeatures = [
  {
    icon: Shield,
    title: "Track every rupee",
    description: "Full financial transparency. Know exactly where your money goes and how it's spent on each problem.",
  },
  {
    icon: Eye,
    title: "See real progress",
    description: "Photo updates, milestone tracking, and community verification at every stage of resolution.",
  },
  {
    icon: CheckCircle,
    title: "Community verified updates",
    description: "Updates are voted on and verified by community members. No fake progress reports.",
  },
];

export function Home() {
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedProblems();
  const { data: stats } = useGetOverviewStats();

  return (
    <div>
      <section className="relative bg-secondary text-white overflow-hidden">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/95 via-secondary/85 to-secondary/70 pointer-events-none" />
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-6">
              <TrendingUp className="w-3.5 h-3.5" />
              {stats ? `${stats.problemsSolved} problems solved so far` : "Making impact together"}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 tracking-tight">
              Stop Waiting for <span className="text-primary">Someone.</span>
              <br />
              Be the Someone.
            </h1>
            <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl">
              Report problems, gather people, track real impact.
              <br />
              <span className="text-slate-400 text-sm md:text-base">Your community needs you — and now it has you.</span>
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Report a Problem
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all"
              >
                Explore Issues
              </Link>
            </div>

            {stats && (
              <div className="flex flex-wrap gap-8 mt-12 pt-6 border-t border-white/10">
                <div>
                  <div className="text-3xl font-bold text-primary">
                    <AnimatedCounter value={stats.totalProblems} />+
                  </div>
                  <div className="text-slate-400 text-sm mt-1">Problems reported</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    Rs.{" "}
                    <AnimatedCounter
                      value={stats.totalFundingRaised}
                      format={(n) => `${(n / 100000).toFixed(1)}L`}
                    />+
                  </div>
                  <div className="text-slate-400 text-sm mt-1">Funds raised</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    <AnimatedCounter value={stats.volunteersJoined} />+
                  </div>
                  <div className="text-slate-400 text-sm mt-1">Volunteers active</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    <AnimatedCounter value={stats.activeCommunities} />
                  </div>
                  <div className="text-slate-400 text-sm mt-1">Active communities</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Four simple steps from frustrated citizen to celebrated change-maker.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div key={step.number} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/40 to-transparent z-0 translate-x-[-50%]" />
                )}
                <div className="relative bg-card border border-card-border rounded-xl p-6 hover:border-primary/40 transition-colors group">
                  <div className="text-4xl font-extrabold text-primary mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Featured Problems</h2>
              <p className="text-muted-foreground mt-2">Real issues, real communities, real impact.</p>
            </div>
            <Link
              href="/explore"
              className="hidden md:inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-card-border rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 6).map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">No problems posted yet.</p>
              <p className="text-sm mt-1">Be the first to report an issue in your community.</p>
              <Link href="/create" className="mt-4 inline-flex items-center gap-2 text-primary font-medium hover:underline">
                Report a Problem <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link href="/explore" className="inline-flex items-center gap-2 text-primary font-medium">
              View all problems <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built on Trust</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Every mechanism of ImpactBridge is designed to make your trust irrefutable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/8 transition-colors text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-5">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Your community is waiting.
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of citizens who are done complaining and started changing things.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Join ImpactBridge
            </Link>
            <Link
              href="/explore"
              className="px-8 py-4 rounded-xl border border-border text-foreground font-semibold text-lg hover:bg-muted transition-all"
            >
              Browse Issues
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
