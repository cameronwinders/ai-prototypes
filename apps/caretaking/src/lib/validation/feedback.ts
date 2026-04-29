import { z } from "zod";

const feedbackTypeSchema = z.enum(["bug", "feature_request", "general_feedback"]);
const feedbackSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const submitFeedbackSchema = z
  .object({
    type: feedbackTypeSchema,
    subject: z.string().trim().min(3, "Add a short summary.").max(140, "Keep the subject under 140 characters."),
    description: z
      .string()
      .trim()
      .max(2000, "Keep the description under 2000 characters.")
      .optional()
      .transform((value) => value || ""),
    route: z.string().trim().min(1, "Route context is missing.").max(300),
    severity: z.string().optional(),
    contactAllowed: z.boolean(),
    spaceId: z
      .string()
      .trim()
      .uuid("Invalid space context.")
      .optional()
      .or(z.literal("")),
    pageContext: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    if (value.type === "bug") {
      const severityCheck = feedbackSeveritySchema.safeParse(value.severity);

      if (!severityCheck.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["severity"],
          message: "Choose how urgent the bug feels."
        });
      }
    }
  })
  .transform((value) => ({
    ...value,
    description: value.description || "",
    severity: value.type === "bug" ? (value.severity as z.infer<typeof feedbackSeveritySchema>) : null,
    spaceId: value.spaceId || null,
    pageContext: value.pageContext || "{}"
  }));
