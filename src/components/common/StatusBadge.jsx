import React from "react";
import { STATUS_META } from "../../constants/dummyData";

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  const Icon = meta.Icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-body shrink-0"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}
