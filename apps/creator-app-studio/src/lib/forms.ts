import { z } from "zod";

const leadFieldNames = [
  "name",
  "email",
  "brand_name",
  "creator_handle",
  "primary_platform",
  "audience_size_range",
  "niche",
  "current_monetization",
  "rough_app_idea"
] as const;

const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().max(maxLength, `Please keep this under ${maxLength} characters.`).optional()
  );

export const leadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please tell us your name.")
    .max(120, "Please keep your name under 120 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Please share the best email for a reply.")
    .max(240, "Please keep your email under 240 characters.")
    .email("Please enter a valid email address."),
  brand_name: optionalText(140),
  creator_handle: optionalText(120),
  primary_platform: optionalText(80),
  audience_size_range: optionalText(80),
  niche: optionalText(140),
  current_monetization: optionalText(180),
  rough_app_idea: optionalText(2000)
});

export type LeadFieldName = (typeof leadFieldNames)[number];
export type LeadFormValues = z.infer<typeof leadFormSchema>;

export function parseLeadForm(formData: FormData) {
  return leadFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    brand_name: formData.get("brand_name"),
    creator_handle: formData.get("creator_handle"),
    primary_platform: formData.get("primary_platform"),
    audience_size_range: formData.get("audience_size_range"),
    niche: formData.get("niche"),
    current_monetization: formData.get("current_monetization"),
    rough_app_idea: formData.get("rough_app_idea")
  });
}

export function mapLeadFieldErrors(error: z.ZodError<LeadFormValues>) {
  const fieldErrors: Partial<Record<LeadFieldName, string>> = {};

  for (const issue of error.issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName === "string" && !(fieldName in fieldErrors)) {
      fieldErrors[fieldName as LeadFieldName] = issue.message;
    }
  }

  return fieldErrors;
}
