import React from "react";

export default function FloatingReactions({ reactions = [] }) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="floating-reactions-overlay" pointer-events="none">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="floating-reaction-item"
          style={{
            left: `${r.x}%`,
          }}
        >
          <span className="reaction-emoji">{r.emoji}</span>
          {r.username && <span className="reaction-user">{r.username}</span>}
        </div>
      ))}
    </div>
  );
}
