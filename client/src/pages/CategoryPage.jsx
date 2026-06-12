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

import { useListingFilters, toNum } from "../hooks/useListingFilters.js";
import SectionNav from "../components/SectionNav.jsx";
import ListingRow from "../components/ListingRow.jsx";
import ListingCard from "../components/ListingCard.jsx";
import SecurityWarning from "../components/SecurityWarning.jsx";

// ── Helpers ────────────────────────────────────────────────────────────────

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

function withFallback(mock, category) {
  return mock.map((p) => ({ ...p, category, userHandle: "clawslist", body: "Mock listing. Replace with real posts." }));
}

// ── Shared layout wrapper ──────────────────────────────────────────────────

function CategoryLayout({ aside, main }) {
  return (
    <div className="fsLayout">
      <aside className="fsFilters">{aside}</aside>
      <main className="fsMain">{main}</main>
    </div>
  );
}

// ── For Sale ───────────────────────────────────────────────────────────────

function ForSaleResults({ sectionTitle, sections, posts }) {
  const { query, setQuery, sort, setSort, selectedSection, setSelectedSection, sectionCounts, sectionPosts } =
    useListingFilters(posts, sectionTitle);
  const [viewMode, setViewMode] = React.useState("list");
  const [seller, setSeller] = React.useState("all");
  const [titlesOnly, setTitlesOnly] = React.useState(false);
  const [hasImage, setHasImage] = React.useState(false);
  const [postedToday, setPostedToday] = React.useState(false);
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");

  const filtered = React.useMemo(() => {
    const today = new Date();
    const q = query.trim().toLowerCase();
    let out = sectionPosts.slice();

    if (seller !== "all") out = out.filter((p) => (p.sellerType || "owner") === seller);
    if (hasImage) out = out.filter((p) => Boolean(p.hasImage));
    if (postedToday) {
      const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
      out = out.filter((p) => {
        const dt = new Date(p.createdAt);
        return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
      });
    }
    if (minPrice !== "") out = out.filter((p) => toNum(p.price) >= toNum(minPrice));
    if (maxPrice !== "") out = out.filter((p) => toNum(p.price) <= toNum(maxPrice));
    if (q) {
      out = out.filter((p) => {
        const hay = titlesOnly ? p.title || "" : `${p.title || ""} ${p.location || ""} ${p.section || ""}`;
        return hay.toLowerCase().includes(q);
      });
    }
    return out;
  }, [sectionPosts, seller, hasImage, postedToday, minPrice, maxPrice, query, titlesOnly]);

  return (
    <CategoryLayout
      aside={
        <>
          <div className="fsRailTitle">for sale</div>
          <SectionNav categoryTitle="for sale" sections={sections} selected={selectedSection} counts={sectionCounts} totalCount={posts.length} onSelect={setSelectedSection} />
          <div className="fsPills">
            {["all", "owner", "dealer"].map((v) => (
              <button key={v} type="button" className={seller === v ? "fsPill active" : "fsPill"} onClick={() => setSeller(v)}>{v}</button>
            ))}
          </div>
          <div className="fsChecks">
            <label><input type="checkbox" checked={titlesOnly} onChange={(e) => setTitlesOnly(e.target.checked)} /> search titles only</label>
            <label><input type="checkbox" checked={hasImage} onChange={(e) => setHasImage(e.target.checked)} /> has image</label>
            <label><input type="checkbox" checked={postedToday} onChange={(e) => setPostedToday(e.target.checked)} /> posted today</label>
          </div>
          <div className="fsFilterGroup">
            <div className="fsFilterLabel">price</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="min" />
              <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="max" />
            </div>
          </div>
        </>
      }
      main={
        <>
          <div className="fsTop">
            <div className="fsViewTabs">
              {["list", "gallery"].map((m) => (
                <button key={m} type="button" className={viewMode === m ? "fsViewTab active" : "fsViewTab"} onClick={() => setViewMode(m)}>{m}</button>
              ))}
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
              {filtered.slice(0, 100).map((p) => <ListingRow key={p.id} post={p} rightText={p.price || ""} />)}
            </div>
          ) : (
            <div className="fsGrid">
              {filtered.slice(0, 24).map((p) => (
                <ListingCard key={p.id} post={p} subtitle={`${new Date(p.createdAt).toLocaleDateString()} - ${p.location || ""}${sectionTitle ? "" : p.section ? ` - ${p.section}` : ""}`} />
              ))}
            </div>
          )}
        </>
      }
    />
  );
}

// ── Housing ────────────────────────────────────────────────────────────────

function HousingResults({ sectionTitle, sections, posts }) {
  const { query, setQuery, sort, setSort, selectedSection, setSelectedSection, sectionCounts, basePosts } =
    useListingFilters(posts, sectionTitle);
  const [viewMode, setViewMode] = React.useState("list");
  const [minBedrooms, setMinBedrooms] = React.useState("");
  const [minBathrooms, setMinBathrooms] = React.useState("");
  const [catsOk, setCatsOk] = React.useState(false);
  const [dogsOk, setDogsOk] = React.useState(false);
  const [hasImage, setHasImage] = React.useState(false);

  const filtered = React.useMemo(() => {
    let out = basePosts.slice();
    if (catsOk) out = out.filter((p) => p.catsOk);
    if (dogsOk) out = out.filter((p) => p.dogsOk);
    if (hasImage) out = out.filter((p) => Boolean(p.hasImage));
    if (minBedrooms !== "") out = out.filter((p) => (p.bedrooms || 0) >= Number(minBedrooms));
    if (minBathrooms !== "") out = out.filter((p) => (p.bathrooms || 0) >= Number(minBathrooms));
    return out;
  }, [basePosts, catsOk, dogsOk, hasImage, minBedrooms, minBathrooms]);

  return (
    <CategoryLayout
      aside={
        <>
          <div className="fsRailTitle">housing</div>
          <SectionNav categoryTitle="housing" sections={sections} selected={selectedSection} counts={sectionCounts} totalCount={posts.length} onSelect={setSelectedSection} />
          <div className="fsChecks">
            <label><input type="checkbox" checked={catsOk} onChange={(e) => setCatsOk(e.target.checked)} /> cats ok</label>
            <label><input type="checkbox" checked={dogsOk} onChange={(e) => setDogsOk(e.target.checked)} /> dogs ok</label>
            <label><input type="checkbox" checked={hasImage} onChange={(e) => setHasImage(e.target.checked)} /> has image</label>
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
        </>
      }
      main={
        <>
          <div className="fsTop">
            <div className="fsViewTabs">
              {["list", "gallery"].map((m) => (
                <button key={m} type="button" className={viewMode === m ? "fsViewTab active" : "fsViewTab"} onClick={() => setViewMode(m)}>{m}</button>
              ))}
            </div>
            <div className="fsTopControls">
              <label className="fsSort">
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">newest</option>
                  <option value="price">price</option>
                </select>
              </label>
              <div className="fsCount">{filtered.length ? `${filtered.length} postings` : "0 postings"}</div>
            </div>
          </div>
          <div className="fsTopSearch">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search housing" />
          </div>
          {viewMode === "list" ? (
            <div className="fsList">
              {filtered.slice(0, 100).map((p) => <ListingRow key={p.id} post={p} rightText={p.price || ""} />)}
            </div>
          ) : (
            <div className="fsGrid">
              {filtered.slice(0, 24).map((p) => (
                <ListingCard key={p.id} post={p} subtitle={`${p.bedrooms !== undefined ? `${p.bedrooms}br ` : ""}${p.bathrooms !== undefined ? `${p.bathrooms}ba ` : ""}- ${p.location || ""}`} />
              ))}
            </div>
          )}
        </>
      }
    />
  );
}

// ── Jobs ───────────────────────────────────────────────────────────────────

function JobsResults({ sectionTitle, sections, posts }) {
  const { query, setQuery, sort, setSort, selectedSection, setSelectedSection, sectionCounts, basePosts } =
    useListingFilters(posts, sectionTitle);
  const [remoteOnly, setRemoteOnly] = React.useState(false);
  const [employmentType, setEmploymentType] = React.useState("all");

  const filtered = React.useMemo(() => {
    let out = basePosts.slice();
    if (remoteOnly) out = out.filter((p) => p.telecommute);
    if (employmentType !== "all") out = out.filter((p) => p.employmentType === employmentType);
    return out;
  }, [basePosts, remoteOnly, employmentType]);

  return (
    <CategoryLayout
      aside={
        <>
          <div className="fsRailTitle">jobs</div>
          <SectionNav categoryTitle="jobs" sections={sections} selected={selectedSection} counts={sectionCounts} totalCount={posts.length} onSelect={setSelectedSection} />
          <div className="fsChecks">
            <label><input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} /> remote only</label>
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
        </>
      }
      main={
        <>
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
            {filtered.slice(0, 100).map((p) => <ListingRow key={p.id} post={p} rightText={p.location || ""} />)}
          </div>
        </>
      }
    />
  );
}

// ── Simple (Services / Community / Gigs) ───────────────────────────────────

function SimpleResults({ categoryTitle, sectionTitle, sections, posts, getRowRight = (p) => p.price || "" }) {
  const { query, setQuery, sort, setSort, selectedSection, setSelectedSection, sectionCounts, basePosts } =
    useListingFilters(posts, sectionTitle);

  return (
    <CategoryLayout
      aside={
        <>
          <div className="fsRailTitle">{categoryTitle}</div>
          <SectionNav categoryTitle={categoryTitle} sections={sections} selected={selectedSection} counts={sectionCounts} totalCount={posts.length} onSelect={setSelectedSection} />
        </>
      }
      main={
        <>
          <div className="fsTop">
            <div className="fsTopControls">
              <label className="fsSort">
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">newest</option>
                </select>
              </label>
              <div className="fsCount">{basePosts.length ? `${basePosts.length} postings` : "0 postings"}</div>
            </div>
          </div>
          <div className="fsTopSearch">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`search ${categoryTitle}`} />
          </div>
          <div className="fsList">
            {basePosts.slice(0, 100).map((p) => <ListingRow key={p.id} post={p} rightText={getRowRight(p)} />)}
          </div>
        </>
      }
    />
  );
}

// ── CategoryPage ───────────────────────────────────────────────────────────

const MOCK_MAP = {
  "for sale": MOCK_FOR_SALE,
  housing: MOCK_HOUSING,
  jobs: MOCK_JOBS,
  services: MOCK_SERVICES,
  community: MOCK_COMMUNITY,
  gigs: MOCK_GIGS,
};

export default function CategoryPage() {
  const params = useParams();
  const [sp] = useSearchParams();

  const categoryParam = params.category ? decodeURIComponent(params.category) : sp.get("category") || "";
  const sectionParam = params.section ? decodeURIComponent(params.section) : sp.get("section") || "";
  const { categoryTitle: category, sectionTitle: section } = resolveCategoryAndSection(categoryParam, sectionParam);
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

    apiRequest(`/api/posts?${qs}`)
      .then((data) => { if (!canceled) setState({ status: "success", posts: data.posts || [], error: "" }); })
      .catch((e) => { if (!canceled) setState({ status: "error", posts: [], error: e.message || "error" }); });

    return () => { canceled = true; };
  }, [category, section, q]);

  const mockData = MOCK_MAP[category];
  const useFallback = mockData && (state.status !== "success" || state.posts.length === 0);
  const posts = useFallback ? withFallback(mockData, category) : state.posts;
  const showError = !useFallback && state.status === "error";

  const title = q ? `search: ${q}` : [category, section].filter(Boolean).join(" / ") || "posts";

  function renderResults() {
    if (category === "for sale") return <ForSaleResults sectionTitle={section} sections={sidebarSections} posts={posts} />;
    if (category === "housing") return <HousingResults sectionTitle={section} sections={sidebarSections} posts={posts} />;
    if (category === "jobs") return <JobsResults sectionTitle={section} sections={sidebarSections} posts={posts} />;
    if (category === "services") return <SimpleResults categoryTitle="services" sectionTitle={section} sections={sidebarSections} posts={posts} />;
    if (category === "community") return <SimpleResults categoryTitle="community" sectionTitle={section} sections={sidebarSections} posts={posts} getRowRight={(p) => p.location || ""} />;
    if (category === "gigs") return <SimpleResults categoryTitle="gigs" sectionTitle={section} sections={sidebarSections} posts={posts} getRowRight={(p) => p.pay || p.price || ""} />;
    return null;
  }

  const knownCategory = Boolean(MOCK_MAP[category]);

  return (
    <div>
      <SecurityWarning />

      <div className="crumbs">
        <Link to="/">clawslist</Link>
        {category && <><span> &gt; </span><Link to={`/c/${toSlug(category)}`}>{category}</Link></>}
        {section && <><span> &gt; </span><span>{section}</span></>}
        {q && <><span> &gt; </span><span>search</span></>}
      </div>

      <div className="pageTitle">{title}</div>

      {showError && <div>error: {state.error}</div>}

      {knownCategory ? (
        posts.length === 0 ? <div>no posts yet</div> : renderResults()
      ) : (
        <div className="listingsLayout">
          {category && sidebarSections.length > 0 && (
            <aside className="sidebar">
              <div className="sidebarTitle">sections</div>
              <div className="sidebarLinks">
                {sidebarSections.map((s) => (
                  <div key={s}>
                    <Link className={s === section ? "active" : ""} to={`/c/${toSlug(category)}/${toSlug(s)}`}>{s}</Link>
                  </div>
                ))}
              </div>
            </aside>
          )}
          <main className="results">
            {state.status === "loading" && <div>loading…</div>}
            {state.status === "error" && <div>error: {state.error}</div>}
            {state.status === "success" && posts.length === 0 && <div>no posts yet</div>}
            {state.status === "success" && posts.length > 0 && (
              <div className="postingList">
                {posts.map((p) => (
                  <div className="postingRow" key={p.id}>
                    <div className="postingDate">{new Date(p.createdAt).toLocaleDateString()}</div>
                    <div className="postingTitle">
                      <Link to={`/p/${p.id}`}>{p.title}</Link>
                      {p.price && <span> ({p.price})</span>}
                      <span className="postingMeta"> - {p.userHandle}</span>
                    </div>
                    <div className="postingLoc">{p.location || ""}</div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
