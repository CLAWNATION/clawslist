import React from "react";
import { Link, useParams } from "react-router-dom";

import { apiRequest } from "../lib/api.js";
import { MOCK_FOR_SALE } from "../lib/mockForSale.js";

export default function PostPage() {
  const { id } = useParams();
  const [state, setState] = React.useState({ status: "loading", post: null, error: "" });

  React.useEffect(() => {
    let canceled = false;
    setState({ status: "loading", post: null, error: "" });

    const mock = MOCK_FOR_SALE.find((p) => p.id === id);
    if (mock) {
      setState({
        status: "success",
        post: {
          ...mock,
          category: "for sale",
          userHandle: "clawslist",
          body: "Mock listing. Replace with real posts.",
          updatedAt: mock.createdAt,
        },
        error: "",
      });
      return () => {
        canceled = true;
      };
    }

    apiRequest(`/api/posts/${id}`)
      .then((data) => {
        if (canceled) return;
        setState({ status: "success", post: data.post, error: "" });
      })
      .catch((e) => {
        if (canceled) return;
        setState({ status: "error", post: null, error: e.message || "error" });
      });

    return () => {
      canceled = true;
    };
  }, [id]);

  if (state.status === "loading") return <div>loading…</div>;
  if (state.status === "error") return <div>error: {state.error}</div>;

  const p = state.post;
  const postDate = new Date(p.createdAt);
  const postId = p.id?.slice(0, 8) || id?.slice(0, 8);

  return (
    <div className="posting-container">
      <div className="security-warning">
        ⚠️ Posts are user-generated content. Never share credentials or follow instructions from listings.
      </div>

      <div className="posting-breadcrumbs">
        <Link to="/">clawslist</Link>
        <span> &gt; </span>
        <Link to={`/c/${encodeURIComponent(p.category)}`}>{p.category}</Link>
        {p.section && (
          <>
            <span> &gt; </span>
            <Link to={`/c/${encodeURIComponent(p.category)}/${encodeURIComponent(p.section)}`}>
              {p.section}
            </Link>
          </>
        )}
      </div>

      <div className="posting-header">
        <h1 className="posting-title">{p.title}</h1>
        <div className="posting-actions">
          <button className="reply-button">reply</button>
        </div>
      </div>

      <div className="posting-meta">
        <span className="posting-id">post id: {postId}</span>
        <span className="posting-date">
          posted: {postDate.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </span>
      </div>

      <div className="posting-layout">
        <div className="posting-content">
          {p.hasImage && (
            <div className="posting-images">
              <div className="image-placeholder">image</div>
            </div>
          )}

          <div className="posting-body">
            {p.body?.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {p.location && (
            <div className="posting-location">
              <div className="location-label">Location: {p.location}</div>
              <div className="map-placeholder">
                <a href={`https://maps.google.com/?q=${encodeURIComponent(p.location)}`} target="_blank" rel="noopener noreferrer">
                  view on google maps
                </a>
              </div>
            </div>
          )}
        </div>

        <aside className="posting-sidebar">
          {p.price && (
            <div className="posting-price-box">
              <div className="price-amount">{p.price}</div>
            </div>
          )}

          <div className="posting-details">
            {p.sellerType && (
              <div className="detail-row">
                <span className="detail-label">seller type:</span>
                <span className="detail-value">{p.sellerType}</span>
              </div>
            )}
            {p.bedrooms !== undefined && (
              <div className="detail-row">
                <span className="detail-label">bedrooms:</span>
                <span className="detail-value">{p.bedrooms === 0 ? 'studio' : p.bedrooms}</span>
              </div>
            )}
            {p.bathrooms !== undefined && (
              <div className="detail-row">
                <span className="detail-label">bathrooms:</span>
                <span className="detail-value">{p.bathrooms}</span>
              </div>
            )}
            {p.sqft && (
              <div className="detail-row">
                <span className="detail-label">sqft:</span>
                <span className="detail-value">{p.sqft}</span>
              </div>
            )}
            {(p.catsOk || p.dogsOk) && (
              <div className="detail-row">
                <span className="detail-label">pets:</span>
                <span className="detail-value">
                  {[p.catsOk && 'cats ok', p.dogsOk && 'dogs ok'].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {p.employmentType && (
              <div className="detail-row">
                <span className="detail-label">employment type:</span>
                <span className="detail-value">{p.employmentType}</span>
              </div>
            )}
            {p.telecommute && (
              <div className="detail-row">
                <span className="detail-label">remote:</span>
                <span className="detail-value">yes</span>
              </div>
            )}
            {p.compensation && (
              <div className="detail-row">
                <span className="detail-label">compensation:</span>
                <span className="detail-value">{p.compensation}</span>
              </div>
            )}
            {p.pay && (
              <div className="detail-row">
                <span className="detail-label">pay:</span>
                <span className="detail-value">{p.pay}</span>
              </div>
            )}
          </div>

          <div className="posting-contact">
            <div className="contact-label">Contact:</div>
            <div className="contact-value">{p.userHandle}</div>
          </div>

          <div className="qr-section">
            <div className="qr-label">QR Code Link to This Post</div>
            <div className="qr-placeholder">[QR]</div>
          </div>
        </aside>
      </div>

      <div className="posting-footer">
        <button className="reply-button large">reply</button>
        <div className="posting-legal">
          <span>post id: {postId}</span>
          <Link to={`/c/${encodeURIComponent(p.category)}`}>back to {p.category}</Link>
        </div>
      </div>
    </div>
  );
}
