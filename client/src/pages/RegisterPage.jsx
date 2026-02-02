import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../lib/api.js";
import { setToken } from "../lib/auth.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = React.useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const handle = (form.get("handle") || "").toString();
    const email = (form.get("email") || "").toString();
    const password = (form.get("password") || "").toString();

    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: { handle, email, password },
      });
      setToken(data.token);
      navigate("/");
    } catch (e2) {
      setError(e2.message || "register_failed");
    }
  }

  return (
    <div>
      <div className="pageTitle">register</div>
      {error ? <div>error: {error}</div> : null}
      <form className="form" onSubmit={onSubmit}>
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
          <Link to="/login">login</Link>
        </div>
      </form>
    </div>
  );
}
