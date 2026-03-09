"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  key,
} from "@/lib/bible";
import { createClient } from "@/lib/supabase/client";

interface DbMember {
  id: string;
  display_name: string | null;
  entries: { chapter_key: string; created_at: string }[];
}

function getMemberStats(m: DbMember) {
  const keys = [...new Set(m.entries.map((e) => e.chapter_key))];
  const chaptersRead = keys.length;
  const pct =
    TOTAL_CHAPTERS === 0 ? 0 : Math.round((chaptersRead / TOTAL_CHAPTERS) * 100);
  const booksDone = BIBLE_BOOKS.filter((book) =>
    Array.from({ length: book.chapters }, (_, i) => i + 1).every((ch) =>
      keys.includes(key(book.name, ch))
    )
  ).length;
  const sorted = m.entries
    .filter((e, i, arr) => arr.findIndex((x) => x.chapter_key === e.chapter_key) === i)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const lastRead = sorted[0]?.chapter_key
    ? sorted[0].chapter_key.replace("|", " ")
    : "—";
  return { chaptersRead, pct, booksDone, lastRead };
}

function GroupPageContent() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get("member") ?? undefined;
  const [members, setMembers] = useState<DbMember[]>([]);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Genesis"]));
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name");
      const { data: entries } = await supabase
        .from("chapter_entries")
        .select("user_id, chapter_key, created_at");

      const byUser = new Map<string, DbMember>();
      for (const p of profiles ?? []) {
        byUser.set(p.id, {
          id: p.id,
          display_name: p.display_name,
          entries: [],
        });
      }
      for (const e of entries ?? []) {
        const m = byUser.get(e.user_id);
        if (m) m.entries.push({ chapter_key: e.chapter_key, created_at: e.created_at });
      }
      setMembers(Array.from(byUser.values()));
      setMounted(true);
    }
    load();
  }, []);

  const member = memberId
    ? (members.find((m) => m.id === memberId) ?? null)
    : null;

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
    const completedSet = new Set(member.entries.map((e) => e.chapter_key));
    const name = member.display_name || "Unknown";

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
            {name}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {chaptersRead} / {TOTAL_CHAPTERS} chapters ({pct}%) · {booksDone} / 66
            books · Read-only view
          </p>
        </header>

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
                          <span
                            key={ch}
                            className={`
                              py-2 rounded text-xs font-medium text-center
                              ${
                                done
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                              }
                            `}
                          >
                            {done ? "✓" : ch}
                          </span>
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
      <header className="mb-8">
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
          Everyone who has signed up. Click a name to see their progress.
        </p>
      </header>

      <div className="grid gap-4 sm:hidden mb-6">
        {members.map((m) => {
          const { chaptersRead, pct, booksDone, lastRead } = getMemberStats(m);
          const name = m.display_name || "Unknown";
          return (
            <Link
              key={m.id}
              href={`/group?member=${m.id}`}
              className="block p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="font-medium text-slate-800 dark:text-slate-100 mb-3">
                {name}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {members.map((m) => {
              const { chaptersRead, pct, booksDone, lastRead } =
                getMemberStats(m);
              const name = m.display_name || "Unknown";
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
                      {name}
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
                </tr>
              );
            })}
          </tbody>
        </table>
        {members.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
            No one has signed up yet. Sign up to be the first.
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
