import { z } from "zod";

export const createSpaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  subjectName: z.string().trim().min(1).max(80).optional().or(z.literal(""))
});

export const inviteMemberSchema = z.object({
  spaceId: z.string().uuid(),
  email: z.string().trim().email(),
  roleKey: z.enum(["caregiver", "viewer"])
});
