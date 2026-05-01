export const HANDICAP_OPTIONS = ["0-5", "6-10", "11-18", "19+"] as const;
export const FEEDBACK_TYPES = ["bug", "feature", "general", "course-addition"] as const;
export const FRIENDSHIP_STATUSES = ["pending", "accepted"] as const;
export const EDITORIAL_LISTS = [
  { key: "golf-digest-public", label: "Golf Digest", sourceName: "Golf Digest Public" },
  { key: "golf-top-100", label: "GOLF.com", sourceName: "GOLF Top 100" },
  { key: "golfweek-you-can-play", label: "Golfweek", sourceName: "Golfweek You Can Play" }
] as const;

export type HandicapBand = (typeof HANDICAP_OPTIONS)[number];
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];
export type EditorialKey = (typeof EDITORIAL_LISTS)[number]["key"];

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
  seed_rank: number;
  seed_score: number;
  seed_source: {
    lists?: string[];
    editorial_ranks?: Partial<Record<EditorialKey, number>>;
    notes?: string;
    seed_tier?: string;
    [key: string]: unknown;
  } | null;
  editorialLists?: string[];
  editorialRanks?: Partial<Record<EditorialKey, number>>;
  leaderboard_rank?: number | null;
  is_early?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type CourseAggregateRecord = {
  course_id: string;
  score: number;
  normalized_score: number;
  rank: number;
  crowd_score: number;
  wins: number;
  losses: number;
  num_signals: number;
  num_unique_golfers: number;
  is_early: boolean;
  last_refreshed_at: string;
};

export type PlayedCourseRecord = {
  user_id: string;
  course_id: string;
  note: string | null;
  played_at: string;
  created_at: string;
  updated_at: string;
};

export type RankedCourse = CourseRecord & {
  rankPosition: number;
  note: string | null;
  playedAt: string;
};

export type PlayedCourse = CourseRecord & {
  note: string | null;
  playedAt: string;
  rankPosition: number | null;
};

export type LeaderboardCourse = CourseRecord & {
  leaderboardRank: number;
  normalizedScore: number;
  score: number;
  crowdScore: number;
  numSignals: number;
  numUniqueGolfers: number;
  wins: number;
  losses: number;
  isEarly: boolean;
};

export type ViewerContext = {
  user: {
    id: string;
    email: string | null;
  } | null;
  profile: UserProfile | null;
  isConfigured: boolean;
  hasServiceRole: boolean;
  isAdmin: boolean;
};

export type CourseAiSummary = {
  loves: string[];
  complaints: string[];
  disclaimer: string;
  fit: string | null;
  hasEnoughData: boolean;
};

export type CourseDetail = {
  course: CourseRecord;
  aggregate: CourseAggregateRecord | null;
  aiSummary: CourseAiSummary;
  viewerPlayed: PlayedCourse | null;
};

export type FriendshipRecord = {
  id: string;
  requester_user_id: string;
  addressee_user_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
};

export type FriendCard = {
  profile: UserProfile;
  overlapCount: number;
  rankedCount: number;
  friendshipId: string;
};

export type PendingFriendRequest = {
  id: string;
  direction: "incoming" | "outgoing";
  profile: UserProfile;
  created_at: string;
};

export type FriendsPageData = {
  accepted: FriendCard[];
  incoming: PendingFriendRequest[];
  outgoing: PendingFriendRequest[];
};

export type CompareCourse = {
  id: string;
  name: string;
  city: string;
  state: string;
  selfRank: number;
  friendRank: number;
  delta: number;
};

export type CompareOverview = {
  friend: UserProfile;
  overlap: CompareCourse[];
  selfOnlyCount: number;
  friendOnlyCount: number;
};

export type FeedbackRecord = {
  id: string;
  user_id: string | null;
  feedback_type: FeedbackType;
  screen_name: string;
  current_url: string;
  message: string;
  browser_context: Record<string, unknown> | null;
  client_submission_id: string | null;
  created_at: string;
  viewer_email?: string | null;
};
