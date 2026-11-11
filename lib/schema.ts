import { z } from "zod";

export const TEAMS = ["Sporting CP", "Manchester United", "Real Madrid", "Juventus", "Al Nassr", "Portugal"] as const;
export type Team = (typeof TEAMS)[number];

export const GOAL_TYPES = ["penalty", "free-kick", "header", "open-play"] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export const GoalSchema = z.object({
  id: z.string().min(1),
  n: z.number().int().positive(),
  date: isoDate,
  mmdd: z.string().regex(/^\d{2}-\d{2}$/),
  team: z.enum(TEAMS),
  opponent: z.string().min(1),
  competition: z.string().min(1),
  stage: z.string().optional(),
  venue: z.enum(["H", "A", "N"]).nullable(),
  minute: z
    .string()
    .regex(/^\d{1,3}(\+\d{1,2})?$/)
    .nullable(),
  scoreAfter: z.string().nullable(),
  result: z.string().nullable(),
  type: z.enum(GOAL_TYPES).nullable(),
  matchId: z.string().min(1),
  sources: z.array(z.string()).min(1),
  notes: z.string().optional(),
});
export type Goal = z.infer<typeof GoalSchema>;
export const GoalsSchema = z.array(GoalSchema);

/** A goal before career numbering / ids are assigned. */
export const RawGoalSchema = GoalSchema.omit({ id: true, n: true, mmdd: true, matchId: true });
export type RawGoal = z.infer<typeof RawGoalSchema>;

export const MatchVideoSchema = z.object({
  matchId: z.string(),
  youtubeId: z
    .string()
    .regex(/^[A-Za-z0-9_-]{11}$/)
    .nullable(),
  title: z.string().optional(),
  channel: z.string().optional(),
  channelId: z.string().optional(),
  startSeconds: z.number().int().nonnegative().optional(),
  status: z.enum(["verified", "auto", "missing", "rejected"]),
  confidence: z.number().optional(),
  checkedAt: z.string().optional(),
  /** YouTube `snippet.publishedAt` (ISO 8601 with time zone), used as VideoObject.uploadDate. */
  publishedAt: z.string().optional(),
  goalOverrides: z
    .record(z.string(), z.object({ youtubeId: z.string(), startSeconds: z.number().int().optional() }))
    .optional(),
});
export type MatchVideo = z.infer<typeof MatchVideoSchema>;
export const VideosSchema = z.record(z.string(), MatchVideoSchema);
export type Videos = z.infer<typeof VideosSchema>;

export const ExpectedSchema = z.object({
  total: z.number().int(),
  perTeam: z.record(z.enum(TEAMS), z.number().int()),
  latestGoalDate: isoDate,
  checkedAt: isoDate,
  sources: z.array(z.string()),
  notes: z.array(z.string()).optional(),
});
export type Expected = z.infer<typeof ExpectedSchema>;

export const ByDateSchema = z.record(z.string().regex(/^\d{2}-\d{2}$/), z.array(z.string()));
