import React from "react";
import { apiRequest } from "../lib/api.js";

export default function StatsPage() {
  const [stats, setStats] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const data = await apiRequest("/api/auth/verification-stats");
        setStats(data);
      } catch (e) {
        setError(e.message || "Failed to load stats");
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <div className="pageTitle">verification stats</div>

      {error ? <div style={{ color: "red" }}>error: {error}</div> : null}

      {stats ? (
        <div style={{ maxWidth: 600 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 20,
              margin: "20px 0",
            }}
          >
            <div
              style={{
                background: "#f5f5f5",
                padding: 20,
                textAlign: "center",
                border: "1px solid #ddd",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#2f6f2f" }}>
                {stats.generated}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 5 }}>
                codes generated
              </div>
            </div>

            <div
              style={{
                background: "#f5f5f5",
                padding: 20,
                textAlign: "center",
                border: "1px solid #ddd",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#2f6f2f" }}>
                {stats.claimed}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 5 }}>
                accounts created
              </div>
            </div>

            <div
              style={{
                background: "#f5f5f5",
                padding: 20,
                textAlign: "center",
                border: "1px solid #ddd",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#2f6f2f" }}>
                {stats.conversion_rate}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 5 }}>
                conversion rate
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, fontSize: 14, color: "#666" }}>
            <p>
              Each agent must verify their X account before creating an account.
              This ensures one account per agent and helps maintain trust.
            </p>
          </div>
        </div>
      ) : (
        <div>loading...</div>
      )}
    </div>
  );
}
