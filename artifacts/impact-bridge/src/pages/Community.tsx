import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  LogIn,
  Send,
  Loader2,
  UserPlus,
  UserMinus,
  MessageCircle,
} from "lucide-react";
import {
  useListCommunityGroups,
  useListCommunityTasks,
  useListCommunityGroupMessages,
  usePostCommunityGroupMessage,
  useJoinCommunityGroup,
  useLeaveCommunityGroup,
  getListCommunityGroupMessagesQueryKey,
  getListCommunityGroupsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { setReturnTo } from "@/components/ProtectedRoute";

const statusIcon = (status: string) => {
  switch (status) {
    case "done": return <CheckCircle className="w-4 h-4 text-primary" />;
    case "in_progress": return <Clock className="w-4 h-4 text-accent" />;
    default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "done": return "Done";
    case "in_progress": return "In Progress";
    default: return "Pending";
  }
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Community() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const { data: groups, isLoading: groupsLoading } = useListCommunityGroups();
  const { data: allTasks, isLoading: tasksLoading } = useListCommunityTasks();

  // Default-select the first group the user is a member of, otherwise the first group.
  useEffect(() => {
    if (selectedId !== null || !groups || groups.length === 0) return;
    const firstMember = groups.find((g) => g.isMember);
    setSelectedId(firstMember?.id ?? groups[0].id);
  }, [groups, selectedId]);

  const selectedGroup = useMemo(
    () => groups?.find((g) => g.id === selectedId) ?? null,
    [groups, selectedId],
  );

  const tasks = useMemo(() => {
    if (!allTasks || !selectedId) return [];
    return (allTasks as (typeof allTasks[0] & { communityId?: number })[])
      .filter((t) => t.communityId === selectedId);
  }, [allTasks, selectedId]);

  const isMember = !!(isAuthenticated && selectedGroup?.isMember);

  const { data: messages, isLoading: messagesLoading } = useListCommunityGroupMessages(
    selectedId ?? 0,
    {
      query: {
        queryKey: ["listCommunityGroupMessages", selectedId ?? 0],
        enabled: !!selectedId && isMember,
        refetchInterval: 3000,
        refetchIntervalInBackground: false,
      },
    },
  );

  const { mutate: postMessage, isPending: sending } = usePostCommunityGroupMessage({
    mutation: {
      onSuccess: () => {
        setMessage("");
        if (selectedId) {
          queryClient.invalidateQueries({
            queryKey: getListCommunityGroupMessagesQueryKey(selectedId),
          });
        }
      },
    },
  });

  const { mutate: joinGroup, isPending: joining } = useJoinCommunityGroup({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
        if (selectedId) {
          queryClient.invalidateQueries({
            queryKey: getListCommunityGroupMessagesQueryKey(selectedId),
          });
        }
      },
    },
  });

  const { mutate: leaveGroup, isPending: leaving } = useLeaveCommunityGroup({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommunityGroupsQueryKey() });
      },
    },
  });

  // Reset message draft and scroll on group change.
  useEffect(() => {
    setMessage("");
  }, [selectedId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length, selectedId, isMember]);

  const sendMessage = () => {
    const text = message.trim();
    if (!text || sending || !isAuthenticated || !selectedId || !isMember) return;
    postMessage({ id: selectedId, data: { message: text } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Community</h1>
        <p className="text-muted-foreground">
          Join a community to chat with its members and collaborate on local impact.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: group list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Active Groups</h2>
            {isAuthenticated && groups && (
              <span className="text-xs text-muted-foreground">
                Joined {groups.filter((g) => g.isMember).length} / {groups.length}
              </span>
            )}
          </div>

          {groupsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((group) => {
                const isSelected = group.id === selectedId;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedId(group.id)}
                    className={`w-full text-left bg-card border rounded-xl p-4 transition-colors ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-card-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        group.isMember ? "bg-primary text-white" : "bg-primary/10 text-primary"
                      }`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{group.name}</h3>
                          {group.isMember && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 flex-shrink-0">
                              Member
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{group.description}</p>
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{group.memberCount} members</span>
                          <span>{group.problemCount} problems</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No groups yet.</p>
            </div>
          )}
        </div>

        {/* RIGHT: details + chat */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            {selectedGroup ? (
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border bg-muted/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-foreground">{selectedGroup.name}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{selectedGroup.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {selectedGroup.memberCount} members
                        </span>
                        <span>{selectedGroup.problemCount} problems</span>
                        <span className="capitalize">{selectedGroup.category}</span>
                      </div>
                    </div>
                    {isAuthenticated ? (
                      selectedGroup.isMember ? (
                        <button
                          type="button"
                          disabled={leaving}
                          onClick={() => leaveGroup({ id: selectedGroup.id })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-60"
                        >
                          {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                          Leave
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={joining}
                          onClick={() => joinGroup({ id: selectedGroup.id })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                        >
                          {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                          Join community
                        </button>
                      )
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setReturnTo("/community")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" /> Sign in to join
                      </Link>
                    )}
                  </div>
                </div>

                {/* Chat sub-header */}
                <div className="px-5 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {isMember
                      ? `${messages?.length ?? 0} message${(messages?.length ?? 0) === 1 ? "" : "s"} · auto-refreshes every 3s`
                      : "Members-only chat"}
                  </p>
                  {isMember && user && (
                    <span className="text-xs text-primary font-medium px-2 py-1 rounded-md bg-primary/10">
                      Signed in as {user.name.split(" ")[0]}
                    </span>
                  )}
                </div>

                {/* Chat body */}
                <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3">
                  {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2">
                      <Lock className="w-8 h-8 opacity-40" />
                      <p className="text-sm max-w-xs">Sign in and join this community to read and post messages with its members.</p>
                    </div>
                  ) : !isMember ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
                      <UserPlus className="w-8 h-8 opacity-40" />
                      <p className="text-sm max-w-xs">
                        You haven't joined <span className="font-semibold text-foreground">{selectedGroup.name}</span> yet.
                        Members can chat in real-time and collaborate on local problems.
                      </p>
                      <button
                        type="button"
                        disabled={joining}
                        onClick={() => joinGroup({ id: selectedGroup.id })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                      >
                        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Join {selectedGroup.name}
                      </button>
                    </div>
                  ) : messagesLoading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading messages…
                    </div>
                  ) : messages && messages.length > 0 ? (
                    messages.map((msg) => {
                      const mine = !!(user && msg.userId === user.id);
                      return (
                        <div key={msg.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                          {msg.userAvatar ? (
                            <img
                              src={msg.userAvatar}
                              alt=""
                              className={`w-8 h-8 rounded-full flex-shrink-0 object-cover border ${
                                mine ? "border-primary/30" : "border-border"
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
                                mine ? "bg-primary" : "bg-secondary"
                              }`}
                            >
                              {initials(msg.userName)}
                            </div>
                          )}
                          <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                            <span className={`text-xs text-muted-foreground mb-1 ${mine ? "text-right" : ""}`}>
                              {mine ? "You" : msg.userName} · {formatTime(msg.createdAt as unknown as string)}
                            </span>
                            <div
                              className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap break-words ${
                                mine
                                  ? "bg-primary text-white rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              }`}
                            >
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No messages in {selectedGroup.name} yet — start the conversation.</p>
                    </div>
                  )}
                </div>

                {/* Composer */}
                {isMember ? (
                  <div className="p-3 border-t border-border">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        maxLength={2000}
                        placeholder={`Message ${selectedGroup.name}…`}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !message.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <Users className="w-10 h-10 opacity-40 mb-2" />
                <p className="text-sm">Select a community on the left to view its details and chat.</p>
              </div>
            )}
          </div>

          {/* Tasks filtered by selected community */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h2 className="text-lg font-bold mb-1">
              {selectedGroup ? `${selectedGroup.name} — Tasks` : "Community Tasks"}
            </h2>
            {selectedGroup && (
              <p className="text-xs text-muted-foreground mb-4">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to this community
              </p>
            )}
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
                    <div className="mt-0.5">{statusIcon(task.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                          {statusLabel(task.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                      {(task.assignedTo || task.problemTitle) && (
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          {task.assignedTo && (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                              <span className="w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                                {task.assignedToAvatar ?? task.assignedTo.charAt(0)}
                              </span>
                              {task.assignedTo}
                            </span>
                          )}
                          {task.problemTitle && (
                            <span className="text-muted-foreground">· {task.problemTitle}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tasks yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
