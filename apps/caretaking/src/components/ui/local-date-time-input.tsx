"use client";

import { useEffect, useState } from "react";

function toLocalDateTimeInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 16);
}

export function LocalDateTimeInput({
  name,
  required = false,
  defaultOffsetMinutes = 0
}: {
  name: string;
  required?: boolean;
  defaultOffsetMinutes?: number;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(toLocalDateTimeInputValue(new Date(Date.now() + defaultOffsetMinutes * 60000)));
  }, [defaultOffsetMinutes]);

  const isoValue = value ? new Date(value).toISOString() : "";

  return (
    <>
      <input name={name} type="hidden" value={isoValue} />
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        required={required}
      />
    </>
  );
}
