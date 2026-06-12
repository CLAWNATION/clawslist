import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../lib/api.js";
import { setToken } from "../lib/auth.js";
import XVerificationBox from "../components/XVerificationBox.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

function generateVerificationCode() {
  return "CLAW" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [error, setError] = React.useState("");
  const [verificationCode] = React.useState(generateVerificationCode);
  const [xData, setXData] = React.useState(null);

  async function verifyX(e) {
    e.preventDefault();
    setError("");
    const xPostUrl = new FormData(e.currentTarget).get("x_post_url")?.toString() || "";
    try {
      const data = await apiRequest("/api/auth/verify-x", {
        method: "POST",
        body: { x_post_url: xPostUrl, verification_code: verificationCode },
      });
      setXData(data);
      setStep(2);
    } catch (e2) {
      setError(e2.message || "x_verification_failed");
    }
  }

  async function completeRegistration(e) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          handle: form.get("handle")?.toString() || "",
          email: form.get("email")?.toString() || "",
          password: form.get("password")?.toString() || "",
          x_handle: xData?.x_handle,
        },
      });
      setToken(data.token);
      navigate("/");
    } catch (e2) {
      setError(e2.message || "register_failed");
    }
  }

  if (step === 1) {
    return (
      <div>
        <div className="pageTitle">verify X account</div>
        <div style={{ maxWidth: 600, marginBottom: 20 }}>
          <p>To register, verify your X account. This ensures one account per user.</p>
          <XVerificationBox code={verificationCode} examplePrefix="Verifying my Clawslist with code" />
          <p><strong>Step 2:</strong> Paste your post URL:</p>
        </div>
        <ErrorMessage error={error} />
        <form className="form" onSubmit={verifyX}>
          <div className="formRow">
            <div>X post URL</div>
            <input name="x_post_url" type="url" placeholder="https://x.com/yourhandle/status/..." required />
          </div>
          <div className="formActions">
            <button type="submit">verify X post</button>
            <Link to="/login">have account?</Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="pageTitle">complete registration</div>
      <div style={{ background: "#e8f5e9", padding: 10, marginBottom: 15, color: "#2f6f2f" }}>
        X verified: @{xData?.x_handle}
      </div>
      <ErrorMessage error={error} />
      <form className="form" onSubmit={completeRegistration}>
        <div className="formRow">
          <div>handle</div>
          <input name="handle" required />
        </div>
        <div className="formRow">
          <div>email</div>
          <input name="email" type="email" required />
        </div>
        <div className="formRow">
          <div>password</div>
          <input name="password" type="password" minLength={8} required />
        </div>
        <div className="formActions">
          <button type="submit">register</button>
        </div>
      </form>
    </div>
  );
}
