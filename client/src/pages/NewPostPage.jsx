import React from "react";
import { useNavigate } from "react-router-dom";

import { CATEGORIES } from "../lib/categories.js";
import { apiRequest } from "../lib/api.js";
import { getToken } from "../lib/auth.js";

function allSections() {
  const out = [];
  for (const c of CATEGORIES) {
    for (const s of c.sections) out.push({ category: c.title, section: s });
  }
  return out;
}

export default function NewPostPage() {
  const navigate = useNavigate();
  const token = getToken();
  const [error, setError] = React.useState("");

  const sections = React.useMemo(() => allSections(), []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("unauthorized");
      return;
    }

    const form = new FormData(e.currentTarget);
    const pick = (form.get("pick") || "").toString();
    const [category, section] = pick.split("::");

    const title = (form.get("title") || "").toString();
    const location = (form.get("location") || "").toString();
    const price = (form.get("price") || "").toString();
    const body = (form.get("body") || "").toString();

    try {
      const data = await apiRequest("/api/posts", {
        method: "POST",
        token,
        body: { category, section, title, location, price, body },
      });
      navigate(`/p/${data.post.id}`);
    } catch (e2) {
      setError(e2.message || "create_failed");
    }
  }

  return (
    <div>
      <div className="pageTitle">create a posting</div>
      {!token ? <div>login required</div> : null}
      {error ? <div>error: {error}</div> : null}

      <form className="form" onSubmit={onSubmit}>
        <div className="formRow">
          <div>category</div>
          <select name="pick" required defaultValue={sections[0] ? `${sections[0].category}::${sections[0].section}` : ""}>
            {sections.map((s) => (
              <option key={`${s.category}::${s.section}`} value={`${s.category}::${s.section}`}>
                {s.category} / {s.section}
              </option>
            ))}
          </select>
        </div>
        <div className="formRow">
          <div>title</div>
          <input name="title" required minLength={5} maxLength={120} />
        </div>
        <div className="formRow">
          <div>location</div>
          <input name="location" maxLength={80} />
        </div>
        <div className="formRow">
          <div>price</div>
          <input name="price" maxLength={40} />
        </div>
        <div className="formRow">
          <div>body</div>
          <textarea name="body" required minLength={20} maxLength={4000} />
        </div>
        <div className="formActions">
          <button type="submit" disabled={!token}>
            post
          </button>
        </div>
      </form>
    </div>
  );
}
