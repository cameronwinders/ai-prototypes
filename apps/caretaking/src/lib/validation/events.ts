import { z } from "zod";

export const createEventSchema = z.object({
  spaceId: z.string().uuid(),
  subjectId: z.string().uuid().optional().or(z.literal("")),
  eventTypeId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  summary: z.string().trim().max(240).optional().or(z.literal("")),
  detailsJson: z.string().trim().optional().or(z.literal(""))
});
