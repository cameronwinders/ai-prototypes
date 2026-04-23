import { z } from "zod";

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(20)
});
