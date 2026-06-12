import React from "react";

export default function SectionNav({ categoryTitle, sections, selected, counts, totalCount, onSelect }) {
  return (
    <div className="fsSectionList">
      <button
        type="button"
        className={selected === "all" ? "fsSectionLink active" : "fsSectionLink"}
        onClick={() => onSelect("all")}
      >
        <span>all {categoryTitle}</span>
        <span className="fsSectionCount">{totalCount}</span>
      </button>
      {(sections || []).map((s) => (
        <button
          key={s}
          type="button"
          className={selected === s ? "fsSectionLink active" : "fsSectionLink"}
          onClick={() => onSelect(s)}
        >
          <span>{s}</span>
          <span className="fsSectionCount">{counts.get(s) || 0}</span>
        </button>
      ))}
    </div>
  );
}
