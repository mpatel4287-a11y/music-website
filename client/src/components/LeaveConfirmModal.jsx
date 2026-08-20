import React from "react";
import { LogOut, AlertTriangle, X } from "lucide-react";

export default function LeaveConfirmModal({ isOpen, onClose, onConfirm, roomId }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay modal-backdrop-blur">
      <div className="confirm-modal-card pixel-confirm-card" style={{ maxWidth: "420px", width: "90%", padding: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444" }}>
            <AlertTriangle size={22} />
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#000000" }}>
              Exit Room Confirmation
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#000000" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem", lineHeight: "1.5" }}>
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#333333", fontWeight: "600" }}>
            Are you sure you want to exit room <strong style={{ color: "#000000" }}>#{roomId}</strong>?
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#666666" }}>
            You will stop listening to the live synchronized audio and return to the main Musync Dashboard.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "10px",
              border: "2px solid #000000",
              background: "#ffffff",
              color: "#000000",
              fontWeight: "700",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "10px",
              border: "2px solid #000000",
              background: "#ef4444",
              color: "#ffffff",
              fontWeight: "800",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            }}
          >
            <LogOut size={16} />
            <span>Yes, Exit Room</span>
          </button>
        </div>
      </div>
    </div>
  );
}
