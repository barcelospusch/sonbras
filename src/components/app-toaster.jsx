"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: "var(--surface-raised)",
          color: "var(--text)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 13,
        },
        success: {
          iconTheme: { primary: "var(--accent-text)", secondary: "var(--surface)" },
        },
        error: { duration: 5000 },
      }}
    />
  );
}
