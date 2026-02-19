"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  key,
} from "@/lib/bible";

const STORAGE_KEY = "bible-tracker-chapters";

function loadEntries(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(entries)]));
}

export default function DashboardPage() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Genesis"]));

  useEffect(() => {
    setCompleted(loadEntries());
    setMounted(true);
  }, []);

  const toggle = useCallback((book: string, chapter: number) => {
    const k = key(book, chapter);
    const current = loadEntries();
    const has = current.includes(k);
    const next = has ? current.filter((e) => e !== k) : [...current, k];
    saveEntries(next);
    setCompleted(next);
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

  const completedCount = completed.length;
  const pct =
    TOTAL_CHAPTERS === 0 ? 0 : Math.round((completedCount / TOTAL_CHAPTERS) * 100);

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto pb-24">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Bible Tracker
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Track each chapter you&apos;ve read
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
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Chapters
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {completedCount} / {TOTAL_CHAPTERS}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Progress
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {pct}%
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Books done
          </p>
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
        Click a book to expand. Click chapters to mark read or unmark.
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
