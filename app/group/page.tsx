"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  key,
} from "@/lib/bible";
import {
  loadGroup,
  saveGroup,
  getMemberStats,
  type GroupMember,
} from "@/lib/group";

function GroupPageContent() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get("member") ?? undefined;
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [mounted, setMounted] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Genesis"]));

  useEffect(() => {
    setMembers(loadGroup());
    setMounted(true);
  }, []);

  const member = memberId
    ? (members.find((m) => m.id === memberId) ?? null)
    : null;

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
    if (memberId === id) window.history.replaceState({}, "", "/group");
  };

  const toggleChapter = useCallback(
    (m: GroupMember, book: string, chapter: number) => {
      const k = key(book, chapter);
      const has = m.completed.some((c) => c.key === k);
      const next: GroupMember = {
        ...m,
        completed: has
          ? m.completed.filter((c) => c.key !== k)
          : [...m.completed, { key: k, at: Date.now() }],
      };
      const updated = members.map((x) => (x.id === m.id ? next : x));
      saveGroup(updated);
      setMembers(updated);
    },
    [members]
  );

  const toggleBook = useCallback((book: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(book)) next.delete(book);
      else next.add(book);
      return next;
    });
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen p-6 max-w-4xl mx-auto flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </main>
    );
  }

  if (member) {
    const { chaptersRead, pct, booksDone } = getMemberStats(member);
    const completedSet = new Set(member.completed.map((c) => c.key));

    return (
      <main className="min-h-screen p-6 max-w-3xl mx-auto pb-24">
        <header className="mb-8">
          <Link
            href="/group"
            className="text-sm text-slate-500 hover:underline mb-2 inline-block"
          >
            ← Group
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {member.name}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {chaptersRead} / {TOTAL_CHAPTERS} chapters ({pct}%) · {booksDone} / 66
            books
          </p>
        </header>

        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
          Click chapters to mark read or unmark.
        </p>

        <div className="space-y-2">
          {BIBLE_BOOKS.map((book) => {
            const isExpanded = expanded.has(book.name);
            return (
              <div
                key={book.name}
                className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleBook(book.name)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {book.name}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).filter(
                      (ch) => completedSet.has(key(book.name, ch))
                    ).length}
                    /{book.chapters}
                  </span>
                </button>
                {isExpanded && (
                  <div className="p-3 pt-0 grid grid-cols-10 sm:grid-cols-12 gap-1.5">
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(
                      (ch) => {
                        const k = key(book.name, ch);
                        const done = completedSet.has(k);
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => toggleChapter(member, book.name, ch)}
                            className={`
                              py-2 rounded text-xs font-medium transition
                              ${
                                done
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                              }
                            `}
                          >
                            {done ? "✓" : ch}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

      <div className="grid gap-4 sm:hidden mb-6">
        {members.map((m) => {
          const { chaptersRead, pct, booksDone, lastRead } = getMemberStats(m);
          return (
            <Link
              key={m.id}
              href={`/group?member=${m.id}`}
              className="block p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="font-medium text-slate-800 dark:text-slate-100 mb-3">
                {m.name}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  % Progress
                </span>
                <span className="text-slate-800 dark:text-slate-100">{pct}%</span>
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
                      href={`/group?member=${m.id}`}
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

export default function GroupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-6 max-w-4xl mx-auto flex items-center justify-center">
          <p className="text-slate-500">Loading…</p>
        </main>
      }
    >
      <GroupPageContent />
    </Suspense>
  );
}
