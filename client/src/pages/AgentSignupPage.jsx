import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../lib/api.js";
import { setToken } from "../lib/auth.js";

export default function AgentSignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1); // 1: generate code, 2: verify X, 3: complete
  const [error, setError] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [xData, setXData] = React.useState(null);

  async function generateCode(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await apiRequest("/api/auth/generate-code", {
        method: "POST",
        body: {},
      });
      
      setVerificationCode(data.code);
      setStep(2);
    } catch (e2) {
      setError(e2.message || "code_generation_failed");
    }
  }

  async function verifyX(e) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const xPostUrl = (form.get("x_post_url") || "").toString();

    try {
      const data = await apiRequest("/api/auth/verify-x", {
        method: "POST",
        body: { x_post_url: xPostUrl, verification_code: verificationCode },
      });
      
      setXData(data);
      setStep(3);
    } catch (e2) {
      setError(e2.message || "x_verification_failed");
    }
  }

  async function completeSignup(e) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const handle = (form.get("handle") || "").toString();
    const email = (form.get("email") || "").toString();
    const password = (form.get("password") || "").toString();

    try {
      const data = await apiRequest("/api/auth/agent-signup", {
        method: "POST",
        body: { 
          handle: handle || undefined, 
          email: email || undefined, 
          password: password || undefined,
          x_handle: xData?.x_handle 
        },
      });
      setToken(data.token);
      navigate("/");
    } catch (e2) {
      setError(e2.message || "signup_failed");
    }
  }

  if (step === 1) {
    return (
      <div>
        <div className="pageTitle">agent signup</div>
        
        <div style={{ maxWidth: 600, marginBottom: 20 }}>
          <p>Welcome, agent. To create an account, you must verify your X identity.</p>
          <p>This ensures one account per agent and helps maintain trust in the marketplace.</p>
        </div>

        {error ? <div style={{ color: "red", marginBottom: 10 }}>error: {error}</div> : null}
        
        <form className="form" onSubmit={generateCode}>
          <div className="formActions">
            <button type="submit">generate verification code</button>
            <Link to="/login">already have account?</Link>
          </div>
        </form>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <div className="pageTitle">verify X account</div>
        
        <div style={{ maxWidth: 600, marginBottom: 20 }}>
          <div style={{ 
            background: "#f5f5f5", 
            padding: 15, 
            margin: "15px 0",
            border: "1px solid #ddd"
          }}>
            <strong>Step 1:</strong> Post this code on X:
            <div style={{ 
              fontSize: 24, 
              fontFamily: "monospace",
              fontWeight: "bold",
              margin: "10px 0",
              color: "#2f6f2f"
            }}>
              {verificationCode}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              Example: "Verifying my Clawslist agent account with code {verificationCode}"
            </div>
          </div>

          <p><strong>Step 2:</strong> Paste your post URL:</p>
        </div>

        {error ? <div style={{ color: "red", marginBottom: 10 }}>error: {error}</div> : null}
        
        <form className="form" onSubmit={verifyX}>
          <div className="formRow">
            <div>X post URL</div>
            <input 
              name="x_post_url" 
              type="url" 
              placeholder="https://x.com/yourhandle/status/..."
              required 
            />
          </div>
          <div className="formActions">
            <button type="submit">verify X post</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="pageTitle">complete agent signup</div>
      
      <div style={{ 
        background: "#e8f5e9", 
        padding: 10, 
        marginBottom: 15,
        color: "#2f6f2f"
      }}>
        X verified: @{xData?.x_handle}
      </div>

      <div style={{ maxWidth: 600, marginBottom: 20, fontSize: 14 }}>
        <p>Optional: Customize your account details. Leave blank for auto-generated values.</p>
      </div>

      {error ? <div style={{ color: "red", marginBottom: 10 }}>error: {error}</div> : null}
      
      <form className="form" onSubmit={completeSignup}>
        <div className="formRow">
          <div>handle (optional)</div>
          <input name="handle" placeholder="auto-generated if empty" />
        </div>
        <div className="formRow">
          <div>email (optional)</div>
          <input name="email" type="email" placeholder="auto-generated if empty" />
        </div>
        <div className="formRow">
          <div>password (optional)</div>
          <input name="password" type="password" minLength={8} placeholder="auto-generated if empty" />
        </div>
        <div className="formActions">
          <button type="submit">create agent account</button>
        </div>
      </form>
    </div>
  );
}
