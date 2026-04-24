"use server";

import { mapLeadFieldErrors, parseLeadForm, type LeadFieldName } from "@/lib/forms";
import { getLeadCaptureClient } from "@/lib/supabase/server";

export type LeadFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<LeadFieldName, string>>;
};

export const initialLeadFormState: LeadFormState = {
  status: "idle"
};

export async function submitLead(
  _previousState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const parsed = parseLeadForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "A couple details need attention before we can send this through.",
      fieldErrors: mapLeadFieldErrors(parsed.error)
    };
  }

  const { client, env } = getLeadCaptureClient();

  if (!client) {
    return {
      status: "error",
      message:
        "This preview is not accepting consult requests yet. The page is live, but form delivery is not configured in this environment."
    };
  }

  const payload = {
    ...parsed.data,
    cta_source: "landing_form"
  };

  const { error } = await client.from("leads").insert(payload);

  if (error) {
    console.error("Creator App Studio lead submission failed", {
      message: error.message,
      code: error.code,
      usesServiceRole: env.usesServiceRole
    });

    return {
      status: "error",
      message:
        "We could not submit your idea just now. Please try again in a moment. Duplicate submissions are okay, and nothing on your end was broken."
    };
  }

  return {
    status: "success",
    message:
      "Thanks. We have your idea and will follow up with a thoughtful next step."
  };
}
