import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../lib/api.js";
import { setToken } from "../lib/auth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = React.useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") || "").toString();
    const password = (form.get("password") || "").toString();

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(data.token);
      navigate("/");
    } catch (e2) {
      setError(e2.message || "login_failed");
    }
  }

  return (
    <div>
      <div className="pageTitle">login</div>
      {error ? <div>error: {error}</div> : null}
      <form className="form" onSubmit={onSubmit}>
        <div className="formRow">
          <div>email</div>
          <input name="email" type="email" required />
        </div>
        <div className="formRow">
          <div>password</div>
          <input name="password" type="password" required />
        </div>
        <div className="formActions">
          <button type="submit">login</button>
          <Link to="/register">register</Link>
        </div>
      </form>
    </div>
  );
}
