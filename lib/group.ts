import { BIBLE_BOOKS, TOTAL_CHAPTERS, key } from "./bible";

export interface GroupMember {
  id: string;
  name: string;
  completed: { key: string; at: number }[];
}

const STORAGE_KEY = "bible-tracker-group";

export function loadGroup(): GroupMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as GroupMember[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveGroup(members: GroupMember[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

export function getMemberStats(m: GroupMember) {
  const keys = [...new Set(m.completed.map((c) => c.key))];
  const chaptersRead = keys.length;
  const pct =
    TOTAL_CHAPTERS === 0 ? 0 : Math.round((chaptersRead / TOTAL_CHAPTERS) * 100);
  const booksDone = BIBLE_BOOKS.filter((book) =>
    Array.from({ length: book.chapters }, (_, i) => i + 1).every((ch) =>
      keys.includes(key(book.name, ch))
    )
  ).length;
  const lastEntry =
    m.completed.length === 0
      ? null
      : m.completed.reduce((best, c) => (c.at > best.at ? c : best), m.completed[0]);
  const lastRead =
    lastEntry?.key && lastEntry?.at
      ? lastEntry.key.replace("|", " ")
      : "—";
  return { chaptersRead, pct, booksDone, lastRead };
}
