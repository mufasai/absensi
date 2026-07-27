import React from "react";

export default function Avatar({ initials, src, size = 40 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={initials || "Avatar"}
        className="rounded-full object-cover shrink-0"
        style={{
          width: size,
          height: size,
          border: "2px solid rgba(240,146,61,0.5)",
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full font-display font-bold shrink-0 overflow-hidden"
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
