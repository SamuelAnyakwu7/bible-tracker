"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadGroup, getMemberStats, type GroupMember } from "@/lib/group";
import { TOTAL_CHAPTERS } from "@/lib/bible";

export default function GroupPage() {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [mounted, setMounted] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setMembers(loadGroup());
    setMounted(true);
  }, []);

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const next: GroupMember[] = [
      ...members,
      {
        id: crypto.randomUUID(),
        name,
        completed: [],
      },
    ];
    localStorage.setItem("bible-tracker-group", JSON.stringify(next));
    setMembers(next);
    setNewName("");
    setShowForm(false);
  };

  const removeMember = (id: string) => {
    if (!confirm("Remove this member?")) return;
    const next = members.filter((m) => m.id !== id);
    localStorage.setItem("bible-tracker-group", JSON.stringify(next));
    setMembers(next);
  };

  if (!mounted) {
    return (
      <main className="min-h-screen p-6 max-w-4xl mx-auto flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto pb-24">
      <header className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:underline mb-2 inline-block"
          >
            ← My progress
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Group
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Track your group&apos;s reading progress
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 text-sm"
        >
          Add member
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={addMember}
          className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-2"
        >
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => (setShowForm(false), setNewName(""))}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Cards (mobile) */}
      <div className="grid gap-4 sm:hidden mb-6">
        {members.map((m) => {
          const { chaptersRead, pct, booksDone, lastRead } = getMemberStats(m);
          return (
            <Link
              key={m.id}
              href={`/group/${m.id}`}
              className="block p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="font-medium text-slate-800 dark:text-slate-100 mb-3">
                {m.name}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  % Progress
                </span>
                <span className="text-slate-800 dark:text-slate-100">
                  {pct}%
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Chapters
                </span>
                <span className="text-slate-800 dark:text-slate-100">
                  {chaptersRead} / {TOTAL_CHAPTERS}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Books done
                </span>
                <span className="text-slate-800 dark:text-slate-100">
                  {booksDone} / 66
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Last read
                </span>
                <span className="text-slate-800 dark:text-slate-100 truncate">
                  {lastRead}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Table (desktop) */}
      <div className="hidden sm:block rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                Name
              </th>
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                % Progress
              </th>
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                Chapters Read
              </th>
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                Books Done
              </th>
              <th className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                Last Read
              </th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {members.map((m) => {
              const { chaptersRead, pct, booksDone, lastRead } =
                getMemberStats(m);
              return (
                <tr
                  key={m.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/group/${m.id}`}
                      className="font-medium text-slate-800 dark:text-slate-100 hover:underline"
                    >
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {pct}%
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {chaptersRead} / {TOTAL_CHAPTERS}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {booksDone} / 66
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                    {lastRead}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeMember(m.id);
                      }}
                      className="text-slate-400 hover:text-red-500 text-sm"
                      title="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {members.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
            No members yet. Add one to get started.
          </p>
        )}
      </div>
    </main>
  );
}
