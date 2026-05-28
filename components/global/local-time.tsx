"use client";

import { useEffect, useState } from "react";

type Props = {
  value?: Date | string | null;
  empty?: string;
  mode?: "dateTime" | "time" | "date";
  prefix?: string;
};

const FORMAT_OPTIONS: Record<NonNullable<Props["mode"]>, Intl.DateTimeFormatOptions> = {
  dateTime: {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  time: {
    hour: "2-digit",
    minute: "2-digit",
  },
  date: {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
};

export default function LocalTime({ value, empty = "None yet", mode = "dateTime", prefix }: Props) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!value) {
      setLabel(empty);
      return;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      setLabel(empty);
      return;
    }

    setLabel(date.toLocaleString(undefined, FORMAT_OPTIONS[mode]));
  }, [empty, mode, value]);

  return (
    <time dateTime={value ? new Date(value).toISOString() : undefined} suppressHydrationWarning>
      {prefix && label ? `${prefix} ` : ""}
      {label || empty}
    </time>
  );
}
