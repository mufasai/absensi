import React from "react";
import { STATUS_META } from "../../constants/dummyData";
import { Clock } from "lucide-react";

export default function StatusBadge({ status }) {
  if (!status) return null;

  const key = String(status).trim();
  const meta =
    STATUS_META[key] ||
    STATUS_META[key.toLowerCase()] ||
    STATUS_META[key.toLowerCase().replace(/\s+/g, "_")] || {
      label: status,
      color: "#93A6BD",
      bg: "rgba(147,166,189,0.14)",
      Icon: Clock,
    };

  const Icon = meta.Icon || Clock;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-body shrink-0 transition-all"
      style={{ color: meta.color, backgroundColor: meta.bg, border: `1px solid ${meta.color}33` }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}
