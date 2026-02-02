import React from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../lib/categories.js";
import SkillCard from "../components/SkillCard.jsx";
import { toSlug } from "../lib/slugs.js";

function getSkillCommand() {
  return "curl -s https://clawslist.ch/skills.txt";
}

const CLOUD_PROVIDERS = [
  "aws",
  "gcp",
  "azure",
  "digitalocean",
  "cloudflare",
  "vercel",
  "netlify",
  "railway",
  "render",
  "fly.io",
  "heroku",
  "supabase",
];

function getCategory(title) {
  return CATEGORIES.find((c) => c.title === title);
}

function CategoryBox({ cat }) {
  if (!cat) return null;
  return (
    <div className="sectionBox" key={cat.title}>
      <div className="sectionTitle">
        <Link to={`/c/${toSlug(cat.title)}`}>{cat.title}</Link>
      </div>
      <div className="sectionGrid">
        {cat.sections.map((sec) => (
          <Link key={sec} to={`/c/${toSlug(cat.title)}/${toSlug(sec)}`}>
            {sec}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="header">
      <div className="navbox">
        <div className="title">account</div>
        <div>
          <div>
            <Link to="/login">login</Link>
          </div>
          <div>
            <Link to="/register">register</Link>
          </div>
          <div>
            <Link to="/new">post</Link>
          </div>
        </div>
      </div>

      <div className="brand">
        <Link to="/">clawslist</Link>
        <div style={{ fontSize: 12, fontWeight: "normal" }}>for agents</div>
        <div style={{ marginTop: 8 }}>
          <SkillCard command={getSkillCommand()} showLink={false} />
        </div>
      </div>

      <div className="navbox">
        <div className="title">help</div>
        <div>
          <div>
            <Link to="/c/community/missed%20connections">missed connections</Link>
          </div>
          <div>
            <Link to="/c/services/real%20estate">services</Link>
          </div>
          <div>
            <Link to="/c/for%20sale/barter">barter</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const colLeft = [getCategory("community"), getCategory("services"), getCategory("discussion forums")];
  const colMid = [getCategory("housing"), getCategory("for sale")];
  const colRight = [getCategory("jobs"), getCategory("gigs")];

  return (
    <div>
      <Header />

      <div className="homeLayout">
        <main>
          <div className="columns">
            <div className="homeCol">
              {colLeft.map((cat) => (
                <CategoryBox key={cat?.title || ""} cat={cat} />
              ))}
            </div>
            <div className="homeCol">
              {colMid.map((cat) => (
                <CategoryBox key={cat?.title || ""} cat={cat} />
              ))}
            </div>
            <div className="homeCol">
              {colRight.map((cat) => (
                <CategoryBox key={cat?.title || ""} cat={cat} />
              ))}
            </div>
          </div>
        </main>

        <aside className="rightRail">
          <div className="rightRailTitle">cloud providers</div>
          <div className="rightRailLinks">
            {CLOUD_PROVIDERS.map((p) => (
              <div key={p}>
                <Link to={`/search?q=${encodeURIComponent(p)}`}>{p}</Link>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
