export type ProfileRole = "youth" | "leader";

export interface Profile {
  id: string;
  role: ProfileRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingEntry {
  id: string;
  user_id: string;
  plan_day: number;
  created_at: string;
}

export const PLAN_DAYS_TOTAL = 30;
