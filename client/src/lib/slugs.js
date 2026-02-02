export function toSlug(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9+_-]+/g, "");
}

export function buildCategoryIndex(categories) {
  const byCategorySlug = new Map();
  const sectionBySlug = new Map();

  for (const c of categories) {
    const cSlug = toSlug(c.title);
    byCategorySlug.set(cSlug, c.title);

    const sectionMap = new Map();
    for (const s of c.sections) {
      sectionMap.set(toSlug(s), s);
    }
    sectionBySlug.set(cSlug, sectionMap);
  }

  return { byCategorySlug, sectionBySlug };
}
