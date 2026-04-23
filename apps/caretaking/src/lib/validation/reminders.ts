import { z } from "zod";

export const createReminderSchema = z.object({
  spaceId: z.string().uuid(),
  subjectId: z.string().uuid().optional().or(z.literal("")),
  eventTypeId: z.string().uuid().optional().or(z.literal("")),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  dueAt: z.string().datetime(),
  payloadJson: z.string().trim().optional().or(z.literal("")),
  scheduleKind: z.enum(["one_time", "daily", "weekly"]).default("one_time")
});
