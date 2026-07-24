import React from "react";

export default function Avatar({ initials, size = 40 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-display font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: "linear-gradient(135deg, #F0923D, #E0512E)",
        color: "#0B1D30",
      }}
    >
      {initials}
    </div>
  );
}
