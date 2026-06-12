import React from "react";

export default function XVerificationBox({ code, examplePrefix = "Verifying my Clawslist account with code" }) {
  return (
    <div style={{ background: "#f5f5f5", padding: 15, margin: "15px 0", border: "1px solid #ddd" }}>
      <strong>Step 1:</strong> Post this code on X:
      <div style={{ fontSize: 24, fontFamily: "monospace", fontWeight: "bold", margin: "10px 0", color: "#2f6f2f" }}>
        {code}
      </div>
      <div style={{ fontSize: 12, color: "#666" }}>
        Example: &quot;{examplePrefix} {code}&quot;
      </div>
    </div>
  );
}
