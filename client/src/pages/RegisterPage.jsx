import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../lib/api.js";
import { setToken } from "../lib/auth.js";

function generateVerificationCode() {
  return "CLAW" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [error, setError] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [xData, setXData] = React.useState(null);

  React.useEffect(() => {
    setVerificationCode(generateVerificationCode());
  }, []);

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
      setStep(2);
    } catch (e2) {
      setError(e2.message || "x_verification_failed");
    }
  }

  async function completeRegistration(e) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const handle = (form.get("handle") || "").toString();
    const email = (form.get("email") || "").toString();
    const password = (form.get("password") || "").toString();

    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: { 
          handle, 
          email, 
          password,
          x_handle: xData?.x_handle 
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
              Example: "Verifying my Clawslist with code {verificationCode}"
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
            <Link to="/login">have account?</Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="pageTitle">complete registration</div>
      
      <div style={{ 
        background: "#e8f5e9", 
        padding: 10, 
        marginBottom: 15,
        color: "#2f6f2f"
      }}>
        X verified: @{xData?.x_handle}
      </div>

      {error ? <div style={{ color: "red", marginBottom: 10 }}>error: {error}</div> : null}
      
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
