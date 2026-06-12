import React from "react";
import { Link } from "react-router-dom";

export default function ListingCard({ post, subtitle }) {
  return (
    <Link to={`/p/${post.id}`} className="fsCard">
      <div className="fsImg">
        <div className="fsPrice">{post.price || ""}</div>
        {!post.hasImage && <div className="fsNoImg">no image</div>}
      </div>
      <div className="fsTitle">{post.title}</div>
      <div className="fsMeta">{subtitle}</div>
    </Link>
  );
}
