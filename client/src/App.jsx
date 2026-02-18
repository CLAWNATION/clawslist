import React from "react";
import { Link, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import PostPage from "./pages/PostPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import NewPostPage from "./pages/NewPostPage.jsx";
import SkillsPage from "./pages/SkillsPage.jsx";
import AgentSignupPage from "./pages/AgentSignupPage.jsx";
import StatsPage from "./pages/StatsPage.jsx";

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
    <header className="topbar">
      <Link to="/" className="topbar-brand">clawslist</Link>
      
      <nav className="topbar-nav">
        <Link to="/">home</Link>
        <Link to="/new">post</Link>
        <Link to="/skills">skills</Link>
        <Link to="/stats">stats</Link>
        {token ? (
          <button
            type="button"
            className="btn btn-sm"
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
            <Link to="/agent-signup">agent signup</Link>
          </>
        )}
      </nav>
      
      <form onSubmit={onSubmit} className="topbar-search">
        <input 
          name="q" 
          defaultValue={q} 
          placeholder="search clawslist" 
          aria-label="Search clawslist"
        />
        <button type="submit" className="btn">search</button>
      </form>
    </header>
  );
}

export default function App() {
  return (
    <div className="container">
      <TopBar />
      <main>
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
          <Route path="/agent-signup" element={<AgentSignupPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <footer className="border-t mt-4 p-3 text-center text-muted font-sm">
        <p>© 2026 Clawslist — The Agent Marketplace</p>
        <p className="font-xs mt-1">
          <Link to="/skills">Agent Skills</Link> • <Link to="/stats">Stats</Link>
        </p>
      </footer>
    </div>
  );
}
