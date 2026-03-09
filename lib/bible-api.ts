// Bible text API - bible-api.com (free). NKJV/Amplified not available (copyrighted).
// Available: kjv, web, asv, bbe, darby, dra
const BIBLE_API = "https://bible-api.com";
const TRANSLATION = "asv"; // American Standard Version (closest to NKJV available)

export function bibleChapterUrl(book: string, chapter: number): string {
  const ref = `${book} ${chapter}`;
  return `${BIBLE_API}/${encodeURIComponent(ref)}?translation=${TRANSLATION}`;
}

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapterResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_name: string;
}

export async function fetchChapter(
  book: string,
  chapter: number
): Promise<BibleChapterResponse | null> {
  try {
    const res = await fetch(bibleChapterUrl(book, chapter));
    if (!res.ok) return null;
    const data = await res.json();
    return {
      reference: data.reference ?? `${book} ${chapter}`,
      verses: (data.verses ?? []).map((v: { verse: number; text: string }) => ({
        verse: v.verse,
        text: v.text,
      })),
      text: data.text ?? "",
      translation_name: data.translation_name ?? "Bible",
    };
  } catch {
    return null;
  }
}
