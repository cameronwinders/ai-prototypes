import { z } from "zod";

export const creatorProfileFieldNames = [
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

const creatorEditableFieldNames = [
  "name",
  "brand_name",
  "creator_handle",
  "primary_platform",
  "audience_size_range",
  "niche",
  "current_monetization",
  "rough_app_idea"
] as const;

const demoStatusValues = ["not_assigned", "shared", "reviewing", "live"] as const;

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

export const creatorProfileSchema = z.object({
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

export const creatorEditableSchema = creatorProfileSchema.omit({
  email: true
});

export const adminAccountSchema = z.object({
  account_id: z.string().uuid("Missing account reference."),
  primary_demo_url: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().url("Please enter a valid demo URL.").max(500).optional()
  ),
  demo_label: optionalText(120),
  demo_status: z.enum(demoStatusValues, {
    error: "Please choose a valid demo status."
  }),
  admin_notes: optionalText(2000)
});

export type CreatorProfileFieldName = (typeof creatorProfileFieldNames)[number];
export type CreatorEditableFieldName = (typeof creatorEditableFieldNames)[number];
export type CreatorProfileValues = z.infer<typeof creatorProfileSchema>;
export type CreatorEditableValues = z.infer<typeof creatorEditableSchema>;
export type AdminAccountValues = z.infer<typeof adminAccountSchema>;
export type DemoStatus = (typeof demoStatusValues)[number];

export type LeadFieldName = CreatorProfileFieldName;
export type LeadFormValues = CreatorProfileValues;

export function parseLeadForm(formData: FormData) {
  return creatorProfileSchema.safeParse({
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

export function parseCreatorProfileUpdateForm(formData: FormData, email: string) {
  return creatorProfileSchema.safeParse({
    name: formData.get("name"),
    email,
    brand_name: formData.get("brand_name"),
    creator_handle: formData.get("creator_handle"),
    primary_platform: formData.get("primary_platform"),
    audience_size_range: formData.get("audience_size_range"),
    niche: formData.get("niche"),
    current_monetization: formData.get("current_monetization"),
    rough_app_idea: formData.get("rough_app_idea")
  });
}

export function parseAdminAccountForm(formData: FormData) {
  return adminAccountSchema.safeParse({
    account_id: formData.get("account_id"),
    primary_demo_url: formData.get("primary_demo_url"),
    demo_label: formData.get("demo_label"),
    demo_status: formData.get("demo_status"),
    admin_notes: formData.get("admin_notes")
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

export function mapCreatorProfileFieldErrors(error: z.ZodError<CreatorProfileValues>) {
  const fieldErrors: Partial<Record<CreatorProfileFieldName, string>> = {};

  for (const issue of error.issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName === "string" && !(fieldName in fieldErrors)) {
      fieldErrors[fieldName as CreatorProfileFieldName] = issue.message;
    }
  }

  return fieldErrors;
}

export function mapAdminFieldErrors(error: z.ZodError<AdminAccountValues>) {
  const fieldErrors: Partial<Record<keyof AdminAccountValues, string>> = {};

  for (const issue of error.issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName === "string" && !(fieldName in fieldErrors)) {
      fieldErrors[fieldName as keyof AdminAccountValues] = issue.message;
    }
  }

  return fieldErrors;
}
