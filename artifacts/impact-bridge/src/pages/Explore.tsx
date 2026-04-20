import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useListProblems } from "@workspace/api-client-react";
import { ProblemCard } from "@/components/ProblemCard";

const categories = ["All", "Infrastructure", "Environment", "Education", "Health", "Safety", "Water", "Roads", "Sanitation"];
const statuses = ["All", "Reported", "Community Joined", "Funding Started", "In Progress", "Completed"];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "most_funded", label: "Most Funded" },
  { value: "most_urgent", label: "Most Urgent" },
];

export function Explore() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState<"newest" | "most_funded" | "most_urgent">("newest");
  const [location, setLocation] = useState("");

  const params: Record<string, string> = { sort };
  if (search) params.search = search;
  if (category !== "All") params.category = category;
  if (status !== "All") params.status = status.toLowerCase().replace(/ /g, "_");
  if (location) params.location = location;

  const { data: problems, isLoading } = useListProblems(params);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Community Problems</h1>
        <p className="text-muted-foreground">Discover real issues in communities across the country — join one, or help fund the fix.</p>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4 mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
          </div>
          <input
            type="text"
            placeholder="Location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-36"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <span className="text-sm font-medium text-muted-foreground self-center mr-1">Sort:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value as typeof sort)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sort === opt.value
                  ? "bg-primary text-white"
                  : "border border-border text-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      ) : problems && problems.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">Showing {problems.length} problem{problems.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-lg font-medium text-foreground">No problems found</p>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}
