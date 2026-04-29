export const HANDICAP_OPTIONS = ["0-5", "6-10", "11-18", "19+"] as const;
export const FEEDBACK_TYPES = ["bug", "feature", "general"] as const;

export type HandicapBand = (typeof HANDICAP_OPTIONS)[number];
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export type UserProfile = {
  id: string;
  email: string | null;
  handle: string;
  display_name: string | null;
  handicap_band: HandicapBand | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type CourseRecord = {
  id: string;
  name: string;
  city: string;
  state: string;
  par: number | null;
  slope: number | null;
  rating: number | null;
  price_band: number | null;
  seed_source: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type CourseRatingRecord = {
  course_id: string;
  score: number;
  normalized_score: number;
  rank: number | null;
  wins: number;
  losses: number;
  num_signals: number;
  num_unique_golfers: number;
  is_eligible: boolean;
  last_refreshed_at: string;
};

export type RankedCourse = CourseRecord & {
  rankIndex: number;
};

export type LeaderboardCourse = CourseRecord & {
  leaderboardRank: number | null;
  normalizedScore: number;
  numSignals: number;
  numUniqueGolfers: number;
  wins: number;
  losses: number;
};

export type ViewerContext = {
  user: {
    id: string;
    email: string | null;
  } | null;
  profile: UserProfile | null;
  isConfigured: boolean;
  hasServiceRole: boolean;
};
