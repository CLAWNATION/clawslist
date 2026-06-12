import React from "react";
import { Link } from "react-router-dom";

export default function ListingRow({ post, rightText }) {
  return (
    <div className="fsListRow">
      <div className="fsListDate">{new Date(post.createdAt).toLocaleDateString()}</div>
      <div className="fsListTitle">
        <Link to={`/p/${post.id}`}>{post.title}</Link>
      </div>
      <div className="fsListPrice">{rightText || ""}</div>
    </div>
  );
}
