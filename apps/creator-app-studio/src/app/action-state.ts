import type {
  AdminAccountValues,
  CreatorProfileFieldName,
  LeadFieldName
} from "@/lib/forms";

export type FormState<FieldName extends string = string> = {
  status: "idle" | "success" | "error" | "partial";
  message?: string;
  fieldErrors?: Partial<Record<FieldName, string>>;
};

export type LeadFormState = FormState<LeadFieldName>;
export type AccountFormState = FormState<CreatorProfileFieldName>;
export type AdminAccountFormState = FormState<keyof AdminAccountValues>;

export const initialLeadFormState: LeadFormState = {
  status: "idle"
};

export const initialAccountFormState: AccountFormState = {
  status: "idle"
};

export const initialAdminAccountFormState: AdminAccountFormState = {
  status: "idle"
};
