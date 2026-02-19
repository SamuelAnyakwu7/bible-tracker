"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function MemberPage() {
  const params = useParams();
  const id = params.id as string;
  const [member, setMember] = useState<GroupMember | null>(null);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Genesis"]));

  useEffect(() => {
    const m = loadGroup().find((x) => x.id === id) ?? null;
    setMember(m);
    setMounted(true);
  }, [id]);

  const toggle = useCallback(
    (book: string, chapter: number) => {
      if (!member) return;
      const k = key(book, chapter);
      const has = member.completed.some((c) => c.key === k);
      const next: GroupMember = {
        ...member,
        completed: has
          ? member.completed.filter((c) => c.key !== k)
          : [...member.completed, { key: k, at: Date.now() }],
      };
      saveGroup(
        loadGroup().map((m) => (m.id === id ? next : m))
      );
      setMember(next);
    },
    [member, id]
  );

  const toggleBook = useCallback((book: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(book)) next.delete(book);
      else next.add(book);
      return next;
    });
  }, []);

  if (!mounted || !member) {
    return (
      <main className="min-h-screen p-6 max-w-3xl mx-auto flex items-center justify-center">
        <p className="text-slate-500">
          {!mounted ? "Loading…" : "Member not found."}
        </p>
      </main>
    );
  }

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
                  {Array.from(
                    { length: book.chapters },
                    (_, i) => i + 1
                  ).filter((ch) => completedSet.has(key(book.name, ch))).length}
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
                          onClick={() => toggle(book.name, ch)}
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
