"use client";

import { useState, useEffect } from "react";
import { Plus, Copy, Trash2, Loader2, CheckCircle, Link } from "lucide-react";
import { cn } from "@/lib/utils";

interface Invite {
  id: string;
  invite_code: string;
  email: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  async function fetchInvites() {
    const res = await fetch("/api/admin/invites");
    const data = await res.json();
    setInvites(data.invites ?? []);
    setLoading(false);
  }

  async function createInvite() {
    setCreating(true);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() || null }),
    });

    if (res.ok) {
      setEmail("");
      fetchInvites();
    }
    setCreating(false);
  }

  async function deleteInvite(id: string) {
    await fetch("/api/admin/invites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInvites(invites.filter((i) => i.id !== id));
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/signup/teacher?invite=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const active = invites.filter((i) => !i.used_by && new Date(i.expires_at) > new Date());
  const used = invites.filter((i) => i.used_by);
  const expired = invites.filter((i) => !i.used_by && new Date(i.expires_at) <= new Date());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
        Teacher Invites
      </h1>

      {/* Create new invite */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Generate New Invite
        </h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Teacher email (optional)"
            className="flex-1 bg-white/5 rounded-xl border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition"
          />
          <button
            onClick={createInvite}
            disabled={creating}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition",
              "bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
            )}
          >
            {creating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Generate
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 size={24} className="animate-spin text-text-muted mx-auto" />
        </div>
      ) : (
        <>
          {/* Active invites */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              Active ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="text-sm text-text-muted py-4">No active invites</p>
            ) : (
              active.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-bg-secondary rounded-xl border border-border p-4 flex items-center justify-between"
                >
                  <div>
                    <code className="text-sm font-mono text-accent font-bold">
                      {invite.invite_code}
                    </code>
                    {invite.email && (
                      <span className="ml-2 text-xs text-text-muted">
                        for {invite.email}
                      </span>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      Expires{" "}
                      {new Date(invite.expires_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(invite.invite_code)}
                      className="p-2 rounded-lg hover:bg-white/10 transition text-text-secondary"
                      title="Copy invite link"
                    >
                      {copied === invite.invite_code ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <Link size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => copyLink(invite.invite_code)}
                      className="p-2 rounded-lg hover:bg-white/10 transition text-text-secondary"
                      title="Copy code"
                    >
                      {copied === invite.invite_code ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => deleteInvite(invite.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition text-text-muted hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Used invites */}
          {used.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                Used ({used.length})
              </h2>
              {used.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-bg-secondary/50 rounded-xl border border-border/50 p-4 flex items-center justify-between opacity-60"
                >
                  <div>
                    <code className="text-sm font-mono text-text-secondary">
                      {invite.invite_code}
                    </code>
                    <p className="text-xs text-text-muted mt-1">
                      Used on{" "}
                      {new Date(invite.used_at!).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                    Used
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Expired invites */}
          {expired.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                Expired ({expired.length})
              </h2>
              {expired.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-bg-secondary/30 rounded-xl border border-border/30 p-4 flex items-center justify-between opacity-40"
                >
                  <div>
                    <code className="text-sm font-mono text-text-muted">
                      {invite.invite_code}
                    </code>
                  </div>
                  <span className="text-xs text-text-muted">Expired</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
