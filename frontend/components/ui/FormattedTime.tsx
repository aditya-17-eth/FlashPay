"use client";

import { useEffect, useState } from "react";

interface FormattedTimeProps {
  date: string;
  type?: "time" | "date" | "datetime";
  className?: string;
}

export function FormattedTime({ date, type = "time", className }: FormattedTimeProps) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    const d = new Date(date);
    
    if (type === "time") {
      setFormatted(
        d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } else if (type === "date") {
      setFormatted(d.toLocaleDateString());
    } else {
      setFormatted(`${d.toLocaleDateString()} ${d.toLocaleTimeString()}`);
    }
  }, [date, type]);

  // Render a placeholder or empty string during SSR to avoid hydration mismatch
  if (!formatted) {
    return <span className={`${className} opacity-0`}>--:--:--</span>;
  }

  return <span className={className}>{formatted}</span>;
}
