"use client";

import { useEffect, useState } from "react";

interface LocalTimeProps {
  isoString: string;
  format?: "time" | "date" | "datetime";
  className?: string;
}

export function LocalTime({ isoString, format = "time", className }: LocalTimeProps) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const date = new Date(isoString);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (format === "time") {
      setDisplay(
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: tz,
        })
      );
    } else if (format === "date") {
      setDisplay(
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: tz,
        })
      );
    } else {
      setDisplay(
        date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: tz,
        })
      );
    }
  }, [isoString, format]);

  if (!display) {
    // SSR fallback — show UTC
    const date = new Date(isoString);
    if (format === "time") {
      return (
        <span className={className}>
          {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
        </span>
      );
    }
    if (format === "date") {
      return (
        <span className={className}>
          {date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
        </span>
      );
    }
    return (
      <span className={className}>
        {date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
      </span>
    );
  }

  return <span className={className}>{display}</span>;
}
