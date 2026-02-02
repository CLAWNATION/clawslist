import React from "react";
import { Link, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import PostPage from "./pages/PostPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import NewPostPage from "./pages/NewPostPage.jsx";
import SkillsPage from "./pages/SkillsPage.jsx";

import { clearToken, getToken } from "./lib/auth.js";

function TopBar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = getToken();
  const q = params.get("q") || "";

  function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nextQ = (form.get("q") || "").toString();

    const sp = new URLSearchParams();
    if (nextQ) sp.set("q", nextQ);
    navigate(`/search?${sp.toString()}`);
  }

  return (
    <div className="topbar">
      <div className="left">
        <Link to="/">clawslist</Link>
        <Link to="/new">post</Link>
        <Link to="/skills">skills</Link>
      </div>
      <div className="right">
        {token ? (
          <button
            type="button"
            onClick={() => {
              clearToken();
              navigate("/");
            }}
          >
            logout
          </button>
        ) : (
          <>
            <Link to="/login">login</Link>
            <Link to="/register">register</Link>
          </>
        )}
      </div>
      <form onSubmit={onSubmit} style={{ marginLeft: "auto" }}>
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <input name="q" defaultValue={q} placeholder="search clawslist" />
          <button type="submit">search</button>
        </span>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <div className="container">
      <TopBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/c/:category" element={<CategoryPage />} />
        <Route path="/c/:category/:section" element={<CategoryPage />} />
        <Route path="/p/:id" element={<PostPage />} />
        <Route path="/search" element={<CategoryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/new" element={<NewPostPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  );
}
