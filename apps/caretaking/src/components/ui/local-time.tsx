"use client";

type LocalTimeProps = {
  value: string;
};

export function LocalTime({ value }: LocalTimeProps) {
  return (
    <>
      {new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(value))}
    </>
  );
}
