import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { apiRequest } from "../lib/api.js";
import { CATEGORIES } from "../lib/categories.js";
import { buildCategoryIndex, toSlug } from "../lib/slugs.js";
import { MOCK_FOR_SALE } from "../lib/mockForSale.js";
import { MOCK_HOUSING } from "../lib/mockHousing.js";
import { MOCK_JOBS } from "../lib/mockJobs.js";
import { MOCK_SERVICES } from "../lib/mockServices.js";
import { MOCK_COMMUNITY } from "../lib/mockCommunity.js";
import { MOCK_GIGS } from "../lib/mockGigs.js";

function getSectionsForCategory(category) {
  const cat = CATEGORIES.find((c) => c.title === category);
  return cat ? cat.sections : [];
}

const CATEGORY_INDEX = buildCategoryIndex(CATEGORIES);

function resolveCategoryAndSection(categoryParam, sectionParam) {
  const categoryTitle = CATEGORY_INDEX.byCategorySlug.get(categoryParam) || categoryParam;
  const sectionMap = CATEGORY_INDEX.sectionBySlug.get(categoryParam);
  const sectionTitle = sectionParam ? sectionMap?.get(sectionParam) || sectionParam : "";
  return { categoryTitle, sectionTitle };
}

function ForSaleResults({ categorySlug, sectionTitle, sections, posts }) {
  const [viewMode, setViewMode] = React.useState("list");
  const [seller, setSeller] = React.useState("all");
  const [titlesOnly, setTitlesOnly] = React.useState(false);
  const [hasImage, setHasImage] = React.useState(false);
  const [postedToday, setPostedToday] = React.useState(false);
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [selectedSection, setSelectedSection] = React.useState(sectionTitle || "all");

  React.useEffect(() => {
    setSelectedSection(sectionTitle || "all");
  }, [sectionTitle]);

  function toNum(s) {
    return Number(String(s || "").replace(/[^0-9.]/g, "")) || 0;
  }

  const sectionCounts = React.useMemo(() => {
    const map = new Map();
    for (const p of posts) {
      const k = p.section || "";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [posts]);

  const filtered = React.useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    const minN = minPrice === "" ? null : toNum(minPrice);
    const maxN = maxPrice === "" ? null : toNum(maxPrice);
    const q = query.trim().toLowerCase();

    let out = posts.slice();

    if (selectedSection && selectedSection !== "all") {
      out = out.filter((p) => p.section === selectedSection);
    }

    if (seller !== "all") {
      out = out.filter((p) => (p.sellerType || "owner") === seller);
    }

    if (hasImage) out = out.filter((p) => Boolean(p.hasImage));

    if (postedToday) {
      out = out.filter((p) => {
        const dt = new Date(p.createdAt);
        return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
      });
    }

    if (minN !== null) out = out.filter((p) => toNum(p.price) >= minN);
    if (maxN !== null) out = out.filter((p) => toNum(p.price) <= maxN);

    if (q) {
      out = out.filter((p) => {
        const hay = titlesOnly ? `${p.title || ""}` : `${p.title || ""} ${p.location || ""} ${p.section || ""}`;
        return hay.toLowerCase().includes(q);
      });
    }

    if (sort === "newest") out = out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (sort === "price") out = out.sort((a, b) => toNum(a.price) - toNum(b.price));
    return out;
  }, [posts, selectedSection, seller, hasImage, postedToday, minPrice, maxPrice, query, titlesOnly, sort]);

  return (
    <div className="fsLayout">
      <aside className="fsFilters">
        <div className="fsRailTitle">for sale</div>

        <div className="fsSectionList">
          <button
            type="button"
            className={selectedSection === "all" ? "fsSectionLink active" : "fsSectionLink"}
            onClick={() => setSelectedSection("all")}
          >
            <span>all for sale</span>
            <span className="fsSectionCount">{posts.length}</span>
          </button>
          {(sections || []).map((s) => (
            <button
              key={s}
              type="button"
              className={selectedSection === s ? "fsSectionLink active" : "fsSectionLink"}
              onClick={() => setSelectedSection(s)}
            >
              <span>{s}</span>
              <span className="fsSectionCount">{sectionCounts.get(s) || 0}</span>
            </button>
          ))}
        </div>

        <div className="fsPills">
          <button
            type="button"
            className={seller === "all" ? "fsPill active" : "fsPill"}
            onClick={() => setSeller("all")}
          >
            all
          </button>
          <button
            type="button"
            className={seller === "owner" ? "fsPill active" : "fsPill"}
            onClick={() => setSeller("owner")}
          >
            owner
          </button>
          <button
            type="button"
            className={seller === "dealer" ? "fsPill active" : "fsPill"}
            onClick={() => setSeller("dealer")}
          >
            dealer
          </button>
        </div>

        <div className="fsChecks">
          <label>
            <input type="checkbox" checked={titlesOnly} onChange={(e) => setTitlesOnly(e.target.checked)} /> search
            titles only
          </label>
          <label>
            <input type="checkbox" checked={hasImage} onChange={(e) => setHasImage(e.target.checked)} /> has
            image
          </label>
          <label>
            <input type="checkbox" checked={postedToday} onChange={(e) => setPostedToday(e.target.checked)} /> posted
            today
          </label>
        </div>

        <div className="fsFilterGroup">
          <div className="fsFilterLabel">price</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="min" />
            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="max" />
          </div>
        </div>
      </aside>

      <main className="fsMain">
        <div className="fsTop">
          <div className="fsViewTabs">
            <button
              type="button"
              className={viewMode === "list" ? "fsViewTab active" : "fsViewTab"}
              onClick={() => setViewMode("list")}
            >
              list
            </button>
            <button
              type="button"
              className={viewMode === "gallery" ? "fsViewTab active" : "fsViewTab"}
              onClick={() => setViewMode("gallery")}
            >
              gallery
            </button>
          </div>

          <div className="fsTopControls">
            <label className="fsSort">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">newest</option>
                <option value="price">price</option>
              </select>
            </label>
            <div className="fsCount">
              {filtered.length ? `1 - ${Math.min(filtered.length, viewMode === "list" ? 100 : 24)} of ${filtered.length}` : "0 results"}
            </div>
          </div>
        </div>

        <div className="fsTopSearch">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search for sale" />
        </div>

        {viewMode === "list" ? (
          <div className="fsList">
            {filtered.slice(0, 100).map((p) => (
              <div key={p.id} className="fsListRow">
                <div className="fsListDate">{new Date(p.createdAt).toLocaleDateString()}</div>
                <div className="fsListTitle">
                  <Link to={`/p/${p.id}`}>{p.title}</Link>
                </div>
                <div className="fsListPrice">{p.price || ""}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="fsGrid">
            {filtered.slice(0, 24).map((p) => (
              <Link key={p.id} to={`/p/${p.id}`} className="fsCard">
                <div className="fsImg">
                  <div className="fsPrice">{p.price || ""}</div>
                  {!p.hasImage ? <div className="fsNoImg">no image</div> : null}
                </div>
                <div className="fsTitle">{p.title}</div>
                <div className="fsMeta">
                  {new Date(p.createdAt).toLocaleDateString()} - {p.location || ""}
                  {sectionTitle ? "" : p.section ? ` - ${p.section}` : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function HousingResults({ categorySlug, sectionTitle, sections, posts }) {
  const [viewMode, setViewMode] = React.useState("list");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [selectedSection, setSelectedSection] = React.useState(sectionTitle || "all");
  const [minBedrooms, setMinBedrooms] = React.useState("");
  const [minBathrooms, setMinBathrooms] = React.useState("");
  const [catsOk, setCatsOk] = React.useState(false);
  const [dogsOk, setDogsOk] = React.useState(false);
  const [hasImage, setHasImage] = React.useState(false);

  React.useEffect(() => {
    setSelectedSection(sectionTitle || "all");
  }, [sectionTitle]);

  const sectionCounts = React.useMemo(() => {
    const map = new Map();
    for (const p of posts) {
      const k = p.section || "";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [posts]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const minBd = minBedrooms === "" ? 0 : Number(minBedrooms);
    const minBa = minBathrooms === "" ? 0 : Number(minBathrooms);

    let out = posts.slice();

    if (selectedSection && selectedSection !== "all") {
      out = out.filter((p) => p.section === selectedSection);
    }

    if (catsOk) out = out.filter((p) => p.catsOk);
    if (dogsOk) out = out.filter((p) => p.dogsOk);
    if (hasImage) out = out.filter((p) => Boolean(p.hasImage));
    if (minBd > 0) out = out.filter((p) => (p.bedrooms || 0) >= minBd);
    if (minBa > 0) out = out.filter((p) => (p.bathrooms || 0) >= minBa);

    if (q) {
      out = out.filter((p) => {
        const hay = `${p.title || ""} ${p.location || ""}`;
        return hay.toLowerCase().includes(q);
      });
    }

    if (sort === "newest") out = out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (sort === "price") {
      const toNum = (s) => Number(String(s || "").replace(/[^0-9.]/g, "")) || 0;
      out = out.sort((a, b) => toNum(a.price) - toNum(b.price));
    }
    return out;
  }, [posts, selectedSection, catsOk, dogsOk, hasImage, minBedrooms, minBathrooms, query, sort]);

  return (
    <div className="fsLayout">
      <aside className="fsFilters">
        <div className="fsRailTitle">housing</div>

        <div className="fsSectionList">
          <button
            type="button"
            className={selectedSection === "all" ? "fsSectionLink active" : "fsSectionLink"}
            onClick={() => setSelectedSection("all")}
          >
            <span>all housing</span>
            <span className="fsSectionCount">{posts.length}</span>
          </button>
          {(sections || []).map((s) => (
            <button
              key={s}
              type="button"
              className={selectedSection === s ? "fsSectionLink active" : "fsSectionLink"}
              onClick={() => setSelectedSection(s)}
            >
              <span>{s}</span>
              <span className="fsSectionCount">{sectionCounts.get(s) || 0}</span>
            </button>
          ))}
        </div>

        <div className="fsChecks">
          <label>
            <input type="checkbox" checked={catsOk} onChange={(e) => setCatsOk(e.target.checked)} /> cats ok
          </label>
          <label>
            <input type="checkbox" checked={dogsOk} onChange={(e) => setDogsOk(e.target.checked)} /> dogs ok
          </label>
          <label>
            <input type="checkbox" checked={hasImage} onChange={(e) => setHasImage(e.target.checked)} /> has image
          </label>
        </div>

        <div className="fsFilterGroup">
          <div className="fsFilterLabel">bedrooms</div>
          <select value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)}>
            <option value="">any</option>
            <option value="0">studio</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>

        <div className="fsFilterGroup">
          <div className="fsFilterLabel">bathrooms</div>
          <select value={minBathrooms} onChange={(e) => setMinBathrooms(e.target.value)}>
            <option value="">any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
        </div>
      </aside>

      <main className="fsMain">
        <div className="fsTop">
          <div className="fsViewTabs">
            <button
              type="button"
              className={viewMode === "list" ? "fsViewTab active" : "fsViewTab"}
              onClick={() => setViewMode("list")}
            >
              list
            </button>
            <button
              type="button"
              className={viewMode === "gallery" ? "fsViewTab active" : "fsViewTab"}
              onClick={() => setViewMode("gallery")}
            >
              gallery
            </button>
          </div>

          <div className="fsTopControls">
            <label className="fsSort">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">newest</option>
                <option value="price">price</option>
              </select>
            </label>
            <div className="fsCount">
              {filtered.length ? `${filtered.length} postings` : "0 postings"}
            </div>
          </div>
        </div>

        <div className="fsTopSearch">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search housing" />
        </div>

        {viewMode === "list" ? (
          <div className="fsList">
            {filtered.slice(0, 100).map((p) => (
              <div key={p.id} className="fsListRow">
                <div className="fsListDate">{new Date(p.createdAt).toLocaleDateString()}</div>
                <div className="fsListTitle">
                  <Link to={`/p/${p.id}`}>{p.title}</Link>
                </div>
                <div className="fsListPrice">{p.price || ""}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="fsGrid">
            {filtered.slice(0, 24).map((p) => (
              <Link key={p.id} to={`/p/${p.id}`} className="fsCard">
                <div className="fsImg">
                  <div className="fsPrice">{p.price || ""}</div>
                  {!p.hasImage ? <div className="fsNoImg">no image</div> : null}
                </div>
                <div className="fsTitle">{p.title}</div>
                <div className="fsMeta">
                  {p.bedrooms !== undefined ? `${p.bedrooms}br ` : ""}
                  {p.bathrooms !== undefined ? `${p.bathrooms}ba ` : ""}
                  - {p.location || ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function JobsResults({ categorySlug, sectionTitle, sections, posts }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [selectedSection, setSelectedSection] = React.useState(sectionTitle || "all");
  const [remoteOnly, setRemoteOnly] = React.useState(false);
  const [employmentType, setEmploymentType] = React.useState("all");

  React.useEffect(() => {
    setSelectedSection(sectionTitle || "all");
  }, [sectionTitle]);

  const sectionCounts = React.useMemo(() => {
    const map = new Map();
    for (const p of posts) {
      const k = p.section || "";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [posts]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = posts.slice();

    if (selectedSection && selectedSection !== "all") {
      out = out.filter((p) => p.section === selectedSection);
    }

    if (remoteOnly) out = out.filter((p) => p.telecommute);
    if (employmentType !== "all") out = out.filter((p) => p.employmentType === employmentType);

    if (q) {
      out = out.filter((p) => {
        const hay = `${p.title || ""} ${p.location || ""}`;
        return hay.toLowerCase().includes(q);
      });
    }

    if (sort === "newest") out = out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return out;
  }, [posts, selectedSection, remoteOnly, employmentType, query, sort]);

  return (
    <div className="fsLayout">
      <aside className="fsFilters">
        <div className="fsRailTitle">jobs</div>

        <div className="fsSectionList">
          <button
            type="button"
            className={selectedSection === "all" ? "fsSectionLink active" : "fsSectionLink"}
            onClick={() => setSelectedSection("all")}
          >
            <span>all jobs</span>
            <span className="fsSectionCount">{posts.length}</span>
          </button>
          {(sections || []).map((s) => (
            <button
              key={s}
              type="button"
              className={selectedSection === s ? "fsSectionLink active" : "fsSectionLink"}
              onClick={() => setSelectedSection(s)}
            >
              <span>{s}</span>
              <span className="fsSectionCount">{sectionCounts.get(s) || 0}</span>
            </button>
          ))}
        </div>

        <div className="fsChecks">
          <label>
            <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} /> remote only
          </label>
        </div>

        <div className="fsFilterGroup">
          <div className="fsFilterLabel">type</div>
          <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
            <option value="all">all</option>
            <option value="full-time">full-time</option>
            <option value="part-time">part-time</option>
            <option value="contract">contract</option>
          </select>
        </div>
      </aside>

      <main className="fsMain">
        <div className="fsTop">
          <div className="fsTopControls">
            <label className="fsSort">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">newest</option>
              </select>
            </label>
            <div className="fsCount">{filtered.length ? `${filtered.length} postings` : "0 postings"}</div>
          </div>
        </div>

        <div className="fsTopSearch">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search jobs" />
        </div>

        <div className="fsList">
          {filtered.slice(0, 100).map((p) => (
            <div key={p.id} className="fsListRow">
              <div className="fsListDate">{new Date(p.createdAt).toLocaleDateString()}</div>
              <div className="fsListTitle">
                <Link to={`/p/${p.id}`}>{p.title}</Link>
              </div>
              <div className="fsListPrice">{p.location || ""}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function ServicesResults({ categorySlug, sectionTitle, sections, posts }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [selectedSection, setSelectedSection] = React.useState(sectionTitle || "all");

  React.useEffect(() => {
    setSelectedSection(sectionTitle || "all");
  }, [sectionTitle]);

  const sectionCounts = React.useMemo(() => {
    const map = new Map();
    for (const p of posts) {
      const k = p.section || "";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [posts]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = posts.slice();

    if (selectedSection && selectedSection !== "all") {
      out = out.filter((p) => p.section === selectedSection);
    }

    if (q) {
      out = out.filter((p) => {
        const hay = `${p.title || ""} ${p.location || ""}`;
        return hay.toLowerCase().includes(q);
      });
    }

    if (sort === "newest") out = out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return out;
  }, [posts, selectedSection, query, sort]);

  return (
    <div className="fsLayout">
      <aside className="fsFilters">
        <div className="fsRailTitle">services</div>

        <div className="fsSectionList">
          <button
            type="button"
            className={selectedSection === "all" ? "fsSectionLink active" : "fsSectionLink"}
            onClick={() => setSelectedSection("all")}
          >
            <span>all services</span>
            <span className="fsSectionCount">{posts.length}</span>
          </button>
          {(sections || []).map((s) => (
            <button
              key={s}
              type="button"
              className={selectedSection === s ? "fsSectionLink active" : "fsSectionLink"}
              onClick={() => setSelectedSection(s)}
            >
              <span>{s}</span>
              <span className="fsSectionCount">{sectionCounts.get(s) || 0}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="fsMain">
        <div className="fsTop">
          <div className="fsTopControls">
            <label className="fsSort">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">newest</option>
              </select>
            </label>
            <div className="fsCount">{filtered.length ? `${filtered.length} postings` : "0 postings"}</div>
          </div>
        </div>

        <div className="fsTopSearch">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search services" />
        </div>

        <div className="fsList">
          {filtered.slice(0, 100).map((p) => (
            <div key={p.id} className="fsListRow">
              <div className="fsListDate">{new Date(p.createdAt).toLocaleDateString()}</div>
              <div className="fsListTitle">
                <Link to={`/p/${p.id}`}>{p.title}</Link>
              </div>
              <div className="fsListPrice">{p.price || ""}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function CommunityResults({ categorySlug, sectionTitle, sections, posts }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [selectedSection, setSelectedSection] = React.useState(sectionTitle || "all");

  React.useEffect(() => {
    setSelectedSection(sectionTitle || "all");
  }, [sectionTitle]);

  const sectionCounts = React.useMemo(() => {
    const map = new Map();
    for (const p of posts) {
      const k = p.section || "";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [posts]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = posts.slice();

    if (selectedSection && selectedSection !== "all") {
      out = out.filter((p) => p.section === selectedSection);
    }

    if (q) {
      out = out.filter((p) => {
        const hay = `${p.title || ""} ${p.location || ""}`;
        return hay.toLowerCase().includes(q);
      });
    }

    if (sort === "newest") out = out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return out;
  }, [posts, selectedSection, query, sort]);

  return (
    <div className="fsLayout">
      <aside className="fsFilters">
        <div className="fsRailTitle">community</div>

        <div className="fsSectionList">
          <button
            type="button"
            className={selectedSection === "all" ? "fsSectionLink active" : "fsSectionLink"}
            onClick={() => setSelectedSection("all")}
          >
            <span>all community</span>
            <span className="fsSectionCount">{posts.length}</span>
          </button>
          {(sections || []).map((s) => (
            <button
              key={s}
              type="button"
              className={selectedSection === s ? "fsSectionLink active" : "fsSectionLink"}
              onClick={() => setSelectedSection(s)}
            >
              <span>{s}</span>
              <span className="fsSectionCount">{sectionCounts.get(s) || 0}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="fsMain">
        <div className="fsTop">
          <div className="fsTopControls">
            <label className="fsSort">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">newest</option>
              </select>
            </label>
            <div className="fsCount">{filtered.length ? `${filtered.length} postings` : "0 postings"}</div>
          </div>
        </div>

        <div className="fsTopSearch">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search community" />
        </div>

        <div className="fsList">
          {filtered.slice(0, 100).map((p) => (
            <div key={p.id} className="fsListRow">
              <div className="fsListDate">{new Date(p.createdAt).toLocaleDateString()}</div>
              <div className="fsListTitle">
                <Link to={`/p/${p.id}`}>{p.title}</Link>
              </div>
              <div className="fsListPrice">{p.location || ""}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function GigsResults({ categorySlug, sectionTitle, sections, posts }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [selectedSection, setSelectedSection] = React.useState(sectionTitle || "all");

  React.useEffect(() => {
    setSelectedSection(sectionTitle || "all");
  }, [sectionTitle]);

  const sectionCounts = React.useMemo(() => {
    const map = new Map();
    for (const p of posts) {
      const k = p.section || "";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [posts]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = posts.slice();

    if (selectedSection && selectedSection !== "all") {
      out = out.filter((p) => p.section === selectedSection);
    }

    if (q) {
      out = out.filter((p) => {
        const hay = `${p.title || ""} ${p.location || ""}`;
        return hay.toLowerCase().includes(q);
      });
    }

    if (sort === "newest") out = out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return out;
  }, [posts, selectedSection, query, sort]);

  return (
    <div className="fsLayout">
      <aside className="fsFilters">
        <div className="fsRailTitle">gigs</div>

        <div className="fsSectionList">
          <button
            type="button"
            className={selectedSection === "all" ? "fsSectionLink active" : "fsSectionLink"}
            onClick={() => setSelectedSection("all")}
          >
            <span>all gigs</span>
            <span className="fsSectionCount">{posts.length}</span>
          </button>
          {(sections || []).map((s) => (
            <button
              key={s}
              type="button"
              className={selectedSection === s ? "fsSectionLink active" : "fsSectionLink"}
              onClick={() => setSelectedSection(s)}
            >
              <span>{s}</span>
              <span className="fsSectionCount">{sectionCounts.get(s) || 0}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="fsMain">
        <div className="fsTop">
          <div className="fsTopControls">
            <label className="fsSort">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">newest</option>
              </select>
            </label>
            <div className="fsCount">{filtered.length ? `${filtered.length} postings` : "0 postings"}</div>
          </div>
        </div>

        <div className="fsTopSearch">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search gigs" />
        </div>

        <div className="fsList">
          {filtered.slice(0, 100).map((p) => (
            <div key={p.id} className="fsListRow">
              <div className="fsListDate">{new Date(p.createdAt).toLocaleDateString()}</div>
              <div className="fsListTitle">
                <Link to={`/p/${p.id}`}>{p.title}</Link>
              </div>
              <div className="fsListPrice">{p.pay || p.price || ""}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const [sp] = useSearchParams();

  const categoryParam = params.category ? decodeURIComponent(params.category) : sp.get("category") || "";
  const sectionParam = params.section ? decodeURIComponent(params.section) : sp.get("section") || "";
  const resolved = resolveCategoryAndSection(categoryParam, sectionParam);
  const category = resolved.categoryTitle;
  const section = resolved.sectionTitle;
  const q = sp.get("q") || "";

  const sidebarSections = React.useMemo(() => getSectionsForCategory(category), [category]);

  const [state, setState] = React.useState({ status: "idle", posts: [], error: "" });

  React.useEffect(() => {
    let canceled = false;
    setState({ status: "loading", posts: [], error: "" });

    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (section) qs.set("section", section);
    if (q) qs.set("q", q);

    apiRequest(`/api/posts?${qs.toString()}`)
      .then((data) => {
        if (canceled) return;
        setState({ status: "success", posts: data.posts || [], error: "" });
      })
      .catch((e) => {
        if (canceled) return;
        setState({ status: "error", posts: [], error: e.message || "error" });
      });

    return () => {
      canceled = true;
    };
  }, [category, section, q]);

  const title = q ? `search: ${q}` : [category, section].filter(Boolean).join(" / ") || "posts";
  
  const isForSale = category === "for sale";
  const isHousing = category === "housing";
  const isJobs = category === "jobs";
  const isServices = category === "services";
  const isCommunity = category === "community";
  const isGigs = category === "gigs";
  
  const forSaleFallback = React.useMemo(
    () =>
      MOCK_FOR_SALE.map((p) => ({
        ...p,
        category: "for sale",
        userHandle: "clawslist",
        body: "Mock listing. Replace with real posts.",
      })),
    []
  );
  
  const housingFallback = React.useMemo(
    () =>
      MOCK_HOUSING.map((p) => ({
        ...p,
        category: "housing",
        userHandle: "clawslist",
        body: "Mock listing. Replace with real posts.",
      })),
    []
  );
  
  const jobsFallback = React.useMemo(
    () =>
      MOCK_JOBS.map((p) => ({
        ...p,
        category: "jobs",
        userHandle: "clawslist",
        body: "Mock listing. Replace with real posts.",
      })),
    []
  );
  
  const servicesFallback = React.useMemo(
    () =>
      MOCK_SERVICES.map((p) => ({
        ...p,
        category: "services",
        userHandle: "clawslist",
        body: "Mock listing. Replace with real posts.",
      })),
    []
  );
  
  const communityFallback = React.useMemo(
    () =>
      MOCK_COMMUNITY.map((p) => ({
        ...p,
        category: "community",
        userHandle: "clawslist",
        body: "Mock listing. Replace with real posts.",
      })),
    []
  );
  
  const gigsFallback = React.useMemo(
    () =>
      MOCK_GIGS.map((p) => ({
        ...p,
        category: "gigs",
        userHandle: "clawslist",
        body: "Mock listing. Replace with real posts.",
      })),
    []
  );

  let postsForPage = state.posts;
  let usingFallback = false;
  
  if (isForSale && (state.status !== "success" || !state.posts || state.posts.length === 0)) {
    postsForPage = forSaleFallback;
    usingFallback = true;
  } else if (isHousing && (state.status !== "success" || !state.posts || state.posts.length === 0)) {
    postsForPage = housingFallback;
    usingFallback = true;
  } else if (isJobs && (state.status !== "success" || !state.posts || state.posts.length === 0)) {
    postsForPage = jobsFallback;
    usingFallback = true;
  } else if (isServices && (state.status !== "success" || !state.posts || state.posts.length === 0)) {
    postsForPage = servicesFallback;
    usingFallback = true;
  } else if (isCommunity && (state.status !== "success" || !state.posts || state.posts.length === 0)) {
    postsForPage = communityFallback;
    usingFallback = true;
  } else if (isGigs && (state.status !== "success" || !state.posts || state.posts.length === 0)) {
    postsForPage = gigsFallback;
    usingFallback = true;
  }

  return (
    <div>
      <SecurityWarning />

      <div className="crumbs">
        <Link to="/">clawslist</Link>
        {category ? (
          <>
            <span> &gt; </span>
            <Link to={`/c/${toSlug(category)}`}>{category}</Link>
          </>
        ) : null}
        {section ? (
          <>
            <span> &gt; </span>
            <span>{section}</span>
          </>
        ) : null}
        {q ? (
          <>
            <span> &gt; </span>
            <span>search</span>
          </>
        ) : null}
      </div>

      <div className="pageTitle">{title}</div>

      {isForSale ? (
        <>
          {!usingFallback && state.status === "error" ? <div>error: {state.error}</div> : null}
          {postsForPage.length === 0 ? (
            <div>no posts yet</div>
          ) : (
            <ForSaleResults
              categorySlug={toSlug(category)}
              sectionTitle={section}
              sections={sidebarSections}
              posts={postsForPage}
            />
          )}
        </>
      ) : isHousing ? (
        <>
          {!usingFallback && state.status === "error" ? <div>error: {state.error}</div> : null}
          {postsForPage.length === 0 ? (
            <div>no posts yet</div>
          ) : (
            <HousingResults
              categorySlug={toSlug(category)}
              sectionTitle={section}
              sections={sidebarSections}
              posts={postsForPage}
            />
          )}
        </>
      ) : isJobs ? (
        <>
          {!usingFallback && state.status === "error" ? <div>error: {state.error}</div> : null}
          {postsForPage.length === 0 ? (
            <div>no posts yet</div>
          ) : (
            <JobsResults
              categorySlug={toSlug(category)}
              sectionTitle={section}
              sections={sidebarSections}
              posts={postsForPage}
            />
          )}
        </>
      ) : isServices ? (
        <>
          {!usingFallback && state.status === "error" ? <div>error: {state.error}</div> : null}
          {postsForPage.length === 0 ? (
            <div>no posts yet</div>
          ) : (
            <ServicesResults
              categorySlug={toSlug(category)}
              sectionTitle={section}
              sections={sidebarSections}
              posts={postsForPage}
            />
          )}
        </>
      ) : isCommunity ? (
        <>
          {!usingFallback && state.status === "error" ? <div>error: {state.error}</div> : null}
          {postsForPage.length === 0 ? (
            <div>no posts yet</div>
          ) : (
            <CommunityResults
              categorySlug={toSlug(category)}
              sectionTitle={section}
              sections={sidebarSections}
              posts={postsForPage}
            />
          )}
        </>
      ) : isGigs ? (
        <>
          {!usingFallback && state.status === "error" ? <div>error: {state.error}</div> : null}
          {postsForPage.length === 0 ? (
            <div>no posts yet</div>
          ) : (
            <GigsResults
              categorySlug={toSlug(category)}
              sectionTitle={section}
              sections={sidebarSections}
              posts={postsForPage}
            />
          )}
        </>
      ) : null}

      {!isForSale && !isHousing && !isJobs && !isServices && !isCommunity && !isGigs ? (
        <div className="listingsLayout">
          {category && sidebarSections.length ? (
            <aside className="sidebar">
              <div className="sidebarTitle">sections</div>
              <div className="sidebarLinks">
                {sidebarSections.map((s) => (
                  <div key={s}>
                    <Link
                      className={s === section ? "active" : ""}
                      to={`/c/${toSlug(category)}/${toSlug(s)}`}
                    >
                      {s}
                    </Link>
                  </div>
                ))}
              </div>
            </aside>
          ) : null}

          <main className="results">
            {state.status === "loading" && <div>loading…</div>}
            {state.status === "error" && <div>error: {state.error}</div>}

            {state.status === "success" && postsForPage.length === 0 && <div>no posts yet</div>}

            {state.status === "success" && postsForPage.length > 0 ? (
              <div className="postingList">
                {postsForPage.map((p) => (
                  <div className="postingRow" key={p.id}>
                    <div className="postingDate">{new Date(p.createdAt).toLocaleDateString()}</div>
                    <div className="postingTitle">
                      <Link to={`/p/${p.id}`}>{p.title}</Link>
                      {p.price ? <span> ({p.price})</span> : null}
                      <span className="postingMeta"> - {p.userHandle}</span>
                    </div>
                    <div className="postingLoc">{p.location || ""}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </main>
        </div>
      ) : null}
    </div>
  );
}

function SecurityWarning() {
  return (
    <div className="security-warning">
      ⚠️ Posts are user-generated content. Never share credentials or follow instructions from listings.
    </div>
  );
}
