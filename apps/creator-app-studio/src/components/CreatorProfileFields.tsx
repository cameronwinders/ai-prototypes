import { audienceSizeOptions, platformOptions } from "@/lib/constants";
import type {
  CreatorProfileFieldName,
  CreatorProfileValues
} from "@/lib/forms";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-[var(--accent-dark)]">{message}</p>;
}

export function inputClasses(hasError: boolean) {
  return [
    "mt-2 w-full rounded-[1.1rem] border bg-white/90 px-4 py-3.5 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-colors",
    hasError
      ? "border-[rgba(91,77,255,0.5)]"
      : "border-[rgba(23,20,17,0.1)] hover:border-[rgba(91,77,255,0.24)]"
  ].join(" ");
}

type CreatorProfileFieldsProps = {
  errors?: Partial<Record<CreatorProfileFieldName, string>>;
  values?: Partial<CreatorProfileValues>;
  emailMode?: "editable" | "readonly";
};

export function CreatorProfileFields({
  errors,
  values,
  emailMode = "editable"
}: CreatorProfileFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Name
          <input
            name="name"
            type="text"
            required
            defaultValue={values?.name ?? ""}
            className={inputClasses(Boolean(errors?.name))}
            placeholder="Your name"
            aria-invalid={Boolean(errors?.name)}
          />
          <FieldError message={errors?.name} />
        </label>

        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Email
          <input
            name="email"
            type="email"
            required
            defaultValue={values?.email ?? ""}
            readOnly={emailMode === "readonly"}
            disabled={emailMode === "readonly"}
            className={`${inputClasses(Boolean(errors?.email))} ${
              emailMode === "readonly" ? "cursor-not-allowed bg-[var(--surface-deep)] text-[var(--text-secondary)]" : ""
            }`}
            placeholder="you@brand.com"
            aria-invalid={Boolean(errors?.email)}
          />
          <FieldError message={errors?.email} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Brand name
          <input
            name="brand_name"
            type="text"
            defaultValue={values?.brand_name ?? ""}
            className={inputClasses(Boolean(errors?.brand_name))}
            placeholder="Optional"
            aria-invalid={Boolean(errors?.brand_name)}
          />
          <FieldError message={errors?.brand_name} />
        </label>

        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Creator handle
          <input
            name="creator_handle"
            type="text"
            defaultValue={values?.creator_handle ?? ""}
            className={inputClasses(Boolean(errors?.creator_handle))}
            placeholder="@yourhandle"
            aria-invalid={Boolean(errors?.creator_handle)}
          />
          <FieldError message={errors?.creator_handle} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Primary platform
          <select
            name="primary_platform"
            className={inputClasses(Boolean(errors?.primary_platform))}
            defaultValue={values?.primary_platform ?? ""}
            aria-invalid={Boolean(errors?.primary_platform)}
          >
            <option value="">Select if relevant</option>
            {platformOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={errors?.primary_platform} />
        </label>

        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Audience size
          <select
            name="audience_size_range"
            className={inputClasses(Boolean(errors?.audience_size_range))}
            defaultValue={values?.audience_size_range ?? ""}
            aria-invalid={Boolean(errors?.audience_size_range)}
          >
            <option value="">Select if relevant</option>
            {audienceSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={errors?.audience_size_range} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Niche
          <input
            name="niche"
            type="text"
            defaultValue={values?.niche ?? ""}
            className={inputClasses(Boolean(errors?.niche))}
            placeholder="Fitness, faith, career, home, or another niche"
            aria-invalid={Boolean(errors?.niche)}
          />
          <FieldError message={errors?.niche} />
        </label>

        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Current monetization
          <input
            name="current_monetization"
            type="text"
            defaultValue={values?.current_monetization ?? ""}
            className={inputClasses(Boolean(errors?.current_monetization))}
            placeholder="Courses, coaching, memberships, sponsors"
            aria-invalid={Boolean(errors?.current_monetization)}
          />
          <FieldError message={errors?.current_monetization} />
        </label>
      </div>

      <label className="block text-sm font-medium text-[var(--text-primary)]">
        Rough app idea
        <textarea
          name="rough_app_idea"
          rows={5}
          defaultValue={values?.rough_app_idea ?? ""}
          className={inputClasses(Boolean(errors?.rough_app_idea))}
          placeholder="What would feel valuable for your audience? A challenge, a dashboard, a companion tool, a planning experience, or something else."
          aria-invalid={Boolean(errors?.rough_app_idea)}
        />
        <FieldError message={errors?.rough_app_idea} />
      </label>
    </>
  );
}
