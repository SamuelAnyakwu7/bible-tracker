"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  key,
} from "@/lib/bible";
import { fetchChapter, type BibleChapterResponse } from "@/lib/bible-api";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Genesis"]));
  const [loadingDay, setLoadingDay] = useState<string | null>(null);
  const [readingChapter, setReadingChapter] = useState<{
    book: string;
    chapter: number;
    data: BibleChapterResponse | null;
    loading: boolean;
  } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      let { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        await supabase.auth.signInAnonymously();
        const { data: { user: anon } } = await supabase.auth.getUser();
        u = anon;
      }
      setUser(u ? { id: u.id } : null);
      setMounted(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setDisplayName(data?.display_name ?? null));
    supabase
      .from("chapter_entries")
      .select("chapter_key")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setCompleted((data ?? []).map((r) => r.chapter_key));
      });
  }, [user]);

  const saveName = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const name = nameInput.trim();
      if (!name || !user) return;
      await supabase
        .from("profiles")
        .update({ display_name: name })
        .eq("id", user.id);
      setDisplayName(name);
    },
    [user, nameInput]
  );

  const toggle = useCallback(
    async (book: string, chapter: number) => {
      if (!user) return;
      const k = key(book, chapter);
      const has = completed.includes(k);
      setLoadingDay(k);
      if (has) {
        await supabase
          .from("chapter_entries")
          .delete()
          .eq("user_id", user.id)
          .eq("chapter_key", k);
      } else {
        await supabase.from("chapter_entries").insert({
          user_id: user.id,
          chapter_key: k,
        });
      }
      setCompleted((prev) =>
        has ? prev.filter((e) => e !== k) : [...prev, k]
      );
      setLoadingDay(null);
    },
    [user, completed]
  );

  const openChapter = useCallback(async (book: string, chapter: number) => {
    setReadingChapter({ book, chapter, data: null, loading: true });
    const data = await fetchChapter(book, chapter);
    setReadingChapter((prev) =>
      prev ? { ...prev, data, loading: false } : null
    );
  }, []);

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
      <main className="min-h-screen p-6 max-w-3xl mx-auto flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen p-6 max-w-3xl mx-auto flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </main>
    );
  }

  if (displayName === null || displayName === "") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Add your name
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
          Enter your name to start tracking your Bible reading. No sign-up required.
        </p>
        <form onSubmit={saveName} className="w-full max-w-sm flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            required
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900"
          >
            Start tracking
          </button>
        </form>
        <Link href="/group" className="mt-6 text-sm text-slate-500 hover:underline">
          View group progress →
        </Link>
      </main>
    );
  }

  const completedCount = completed.length;
  const pct =
    TOTAL_CHAPTERS === 0 ? 0 : Math.round((completedCount / TOTAL_CHAPTERS) * 100);

  return (
    <>
      <main className="min-h-screen p-6 max-w-3xl mx-auto pb-24">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Bible Tracker
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              {displayName} · Click a chapter to read, then mark complete
            </p>
          </div>
          <Link
            href="/group"
            className="text-sm text-slate-600 dark:text-slate-400 hover:underline"
          >
            Group →
          </Link>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">Chapters</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {completedCount} / {TOTAL_CHAPTERS}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">Progress</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {pct}%
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">Books done</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {BIBLE_BOOKS.filter((b) =>
                Array.from({ length: b.chapters }, (_, i) => i + 1).every(
                  (ch) => completed.includes(key(b.name, ch))
                )
              ).length}{" "}
              / 66
            </p>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
          Click a chapter to read it, then mark complete when done.
        </p>

        <div className="space-y-2">
          {BIBLE_BOOKS.map((book) => {
            const isExpanded = expanded.has(book.name);
            const bookCompleted = Array.from(
              { length: book.chapters },
              (_, i) => i + 1
            ).filter((ch) => completed.includes(key(book.name, ch))).length;
            const bookTotal = book.chapters;
            const bookDone = bookCompleted === bookTotal;

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
                    {bookCompleted}/{bookTotal}
                    {bookDone && " ✓"}
                  </span>
                </button>
                {isExpanded && (
                  <div className="p-3 pt-0 grid grid-cols-10 sm:grid-cols-12 gap-1.5">
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(
                      (ch) => {
                        const k = key(book.name, ch);
                        const done = completed.includes(k);
                        const loading = loadingDay === k;
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => openChapter(book.name, ch)}
                            disabled={loading}
                            className={`
                              py-2 rounded text-xs font-medium transition
                              ${
                                done
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                              }
                              ${loading ? "opacity-70" : ""}
                            `}
                          >
                            {loading ? "…" : done ? "✓" : ch}
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

      {readingChapter && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setReadingChapter(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                {readingChapter.book} {readingChapter.chapter}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await toggle(
                      readingChapter!.book,
                      readingChapter!.chapter
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500"
                >
                  {completed.includes(
                    key(readingChapter!.book, readingChapter!.chapter)
                  )
                    ? "Unmark"
                    : "Mark complete"}
                </button>
                <button
                  type="button"
                  onClick={() => setReadingChapter(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {readingChapter.loading ? (
                <p className="text-slate-500">Loading…</p>
              ) : readingChapter.data ? (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-xs text-slate-500 mb-4">
                    {readingChapter.data.translation_name}
                  </p>
                  {readingChapter.data.verses.map((v) => (
                    <p key={v.verse} className="mb-2">
                      <span className="text-slate-400 text-sm mr-2">
                        {v.verse}
                      </span>
                      {v.text}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  Could not load this chapter. Try another.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
