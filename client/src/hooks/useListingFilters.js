import { useState, useEffect, useMemo } from "react";

export function toNum(s) {
  return Number(String(s || "").replace(/[^0-9.]/g, "")) || 0;
}

/**
 * Base filter state shared by all category Results components.
 *
 * Returns:
 *   sectionPosts  — section-filtered + sorted, no text query applied
 *                   Use this when you need custom query logic (e.g. titlesOnly)
 *   basePosts     — full pipeline: section + query + sort
 *                   Use this for simple Results components
 */
export function useListingFilters(posts, sectionTitle) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedSection, setSelectedSection] = useState(sectionTitle || "all");

  useEffect(() => {
    setSelectedSection(sectionTitle || "all");
  }, [sectionTitle]);

  const sectionCounts = useMemo(() => {
    const map = new Map();
    for (const p of posts) {
      const k = p.section || "";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [posts]);

  const sectionPosts = useMemo(() => {
    let out = posts.slice();
    if (selectedSection && selectedSection !== "all") {
      out = out.filter((p) => p.section === selectedSection);
    }
    if (sort === "newest") out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (sort === "price") out.sort((a, b) => toNum(a.price) - toNum(b.price));
    return out;
  }, [posts, selectedSection, sort]);

  const basePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sectionPosts;
    return sectionPosts.filter((p) =>
      `${p.title || ""} ${p.location || ""} ${p.section || ""}`.toLowerCase().includes(q)
    );
  }, [sectionPosts, query]);

  return {
    query, setQuery,
    sort, setSort,
    selectedSection, setSelectedSection,
    sectionCounts,
    sectionPosts,
    basePosts,
  };
}
