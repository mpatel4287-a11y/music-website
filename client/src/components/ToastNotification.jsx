import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function ToastNotification({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = Info;
        if (toast.type === "success") Icon = CheckCircle2;
        if (toast.type === "error" || toast.type === "warning") Icon = AlertCircle;

        return (
          <div key={toast.id} className={`toast-item ${toast.type || "info"}`}>
            <Icon size={16} className="toast-icon" />
            <span className="toast-message">{toast.message}</span>
            {onDismiss && (
              <button
                type="button"
                className="toast-close-btn"
                onClick={() => onDismiss(toast.id)}
              >
                <X size={13} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
