import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

// ── Status config matching InterviewModel.status enum ──
const INTERVIEW_STATUS = {
  Scheduled:           { label: "Scheduled",           bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9",  icon: "📅" },
  Accepted:            { label: "Accepted",            bg: "rgba(22,163,74,0.1)",   color: "#16a34a",  icon: "✅" },
  Rejected_By_Student: { label: "Declined by You",     bg: "rgba(245,158,11,0.1)",  color: "#f59e0b",  icon: "↩️" },
  Selected:            { label: "Selected 🎉",         bg: "rgba(22,163,74,0.1)",   color: "#16a34a",  icon: "🎉" },
  Rejected:            { label: "Not Selected",        bg: "rgba(220,38,38,0.1)",   color: "#dc2626",  icon: "🚫" },
};

function StatusPill({ status }) {
  const cfg = INTERVIEW_STATUS[status] || {
    label: status || "—", bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: "•",
  };
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
      background: cfg.bg, color: cfg.color, display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StudentInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [activeTab,  setActiveTab]  = useState("upcoming"); // "upcoming" | "past"

  const header = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || localStorage.getItem("token") || ""}`,
    },
  });

  // ── Fetch flow:
  // 1. GET /api/job/job-suggestions          → list of suggestions for this student
  // 2. For each → GET /api/job/job-suggestions/{id}/job-applications
  // 3. For each app → GET /api/job/job-application/{id}/interview
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");

        // Step 1 – suggestions
        const sugRes  = await axios.get(rest.jobSuggestions, header());
        const sugList = sugRes.data?.data || sugRes.data || [];
        const sugs    = Array.isArray(sugList) ? sugList : [];

        // Step 2 – applications for each suggestion
        const appArrays = await Promise.all(
          sugs.map(async (sug) => {
            const sugId = sug.jobSuggestionId || sug.id;
            try {
              const res  = await axios.get(
                `${rest.jobSuggestions}/${sugId}/job-applications`,
                header()
              );
              const apps = res.data?.data || res.data || [];
              return Array.isArray(apps)
                ? apps.map((a) => ({ ...a, _sug: sug }))
                : [];
            } catch {
              return [];
            }
          })
        );
        const allApps = appArrays.flat();

        // Step 3 – interview for each application
        const invArrays = await Promise.all(
          allApps.map(async (app) => {
            const appId = app.jobApplicationId || app.id;
            try {
              const res  = await axios.get(
                `${rest.jobApplications}/${appId}/interview`,
                header()
              );
              const inv  = res.data?.data || res.data;
              const list = Array.isArray(inv) ? inv : inv ? [inv] : [];
              return list.map((i) => ({ ...i, _app: app, _sug: app._sug }));
            } catch {
              return [];
            }
          })
        );

        setInterviews(invArrays.flat());
      } catch (err) {
        console.error("StudentInterviews fetchAll:", err);
        setError("Failed to load your interviews. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ── Helpers ────────────────────────────────────────────
  const getCompany = (inv) =>
    inv._sug?.jobPostModel?.companyModel?.companyName ||
    inv._app?.jobSuggestionModel?.jobPostModel?.companyModel?.companyName ||
    "Company";

  const getJobTitle = (inv) =>
    inv._sug?.jobPostModel?.tiitle ||
    inv._sug?.jobPostModel?.title  ||
    inv._app?.jobSuggestionModel?.jobPostModel?.tiitle ||
    "Job";

  const getCompanyLocation = (inv) =>
    inv._sug?.jobPostModel?.companyModel?.location || "—";

  const getCompanyLogo = (inv) =>
    inv._sug?.jobPostModel?.companyModel?.logo || null;

  const formatDT = (dt) => {
    if (!dt) return "—";
    try {
      return new Date(dt).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return dt; }
  };

  const isUpcoming = (inv) =>
    !inv.status || inv.status === "Scheduled" || inv.status === "Accepted";

  const upcoming = interviews.filter(isUpcoming);
  const past     = interviews.filter((i) => !isUpcoming(i));

  // Stats
  const scheduled = interviews.filter((i) => i.status === "Scheduled").length;
  const accepted  = interviews.filter((i) => i.status === "Accepted").length;
  const selected  = interviews.filter((i) => i.status === "Selected").length;
  const rejected  = interviews.filter((i) => i.status === "Rejected").length;

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* ── Header ── */}
      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">📅 My Interviews</h2>
        <p className="fs-p9 text-secondary">
          View your scheduled and completed interview results
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="row mb-4">
        {[
          { icon: "📅", label: "Scheduled",  value: scheduled, color: "#0ea5e9"          },
          { icon: "✅", label: "Accepted",   value: accepted,  color: "var(--success)"   },
          { icon: "🎉", label: "Selected",   value: selected,  color: "var(--success)"   },
          { icon: "🚫", label: "Rejected",   value: rejected,  color: "var(--danger)"    },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-3 text-center">
              <p style={{ fontSize: "1.6rem" }}>{s.icon}</p>
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p8 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "2rem" }}>⏳</p>
          <p className="text-secondary mt-2">Loading your interviews...</p>
        </div>
      ) : error ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      ) : interviews.length === 0 ? (
        <>
          <div className="card p-5 text-center mb-4">
            <p style={{ fontSize: "3rem" }}>📭</p>
            <p className="bold mt-2">No interviews yet</p>
            <p className="text-secondary fs-p9 mt-1">
              Apply to jobs from your Recommendations tab and wait for companies to schedule interviews.
            </p>
          </div>
          <InterviewTips />
        </>
      ) : (
        <>
          {/* ── Tabs ── */}
          <div className="row mb-4" style={{ gap: 10 }}>
            {[
              { key: "upcoming", label: `📅 Upcoming (${upcoming.length})` },
              { key: "past",     label: `📋 Past (${past.length})`         },
            ].map((t) => (
              <button
                key={t.key}
                className={`btn w-auto ${activeTab === t.key ? "btn-primary" : "btn-muted"}`}
                style={{ padding: "8px 22px" }}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── UPCOMING ── */}
          {activeTab === "upcoming" && (
            <>
              {upcoming.length === 0 ? (
                <div className="card p-5 text-center mb-4">
                  <p style={{ fontSize: "2.5rem" }}>🎊</p>
                  <p className="bold mt-2">No upcoming interviews right now</p>
                  <p className="text-secondary fs-p9">Check the Past tab to see completed interviews.</p>
                </div>
              ) : (
                <div className="row mb-4" style={{ gap: 16, flexWrap: "wrap" }}>
                  {upcoming.map((inv, idx) => (
                    <UpcomingCard
                      key={inv.interviewId || idx}
                      inv={inv}
                      getCompany={getCompany}
                      getJobTitle={getJobTitle}
                      getCompanyLocation={getCompanyLocation}
                      formatDT={formatDT}
                    />
                  ))}
                </div>
              )}
              <InterviewTips />
            </>
          )}

          {/* ── PAST ── */}
          {activeTab === "past" && (
            <>
              {past.length === 0 ? (
                <div className="card p-5 text-center">
                  <p style={{ fontSize: "2.5rem" }}>📂</p>
                  <p className="bold mt-2">No past interviews yet</p>
                  <p className="text-secondary fs-p9">Completed interviews will appear here.</p>
                </div>
              ) : (
                <div className="card p-2" style={{ overflow: "hidden" }}>
                  <table className="w-100">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Company</th>
                        <th>Job Role</th>
                        <th>Mode</th>
                        <th>Date & Time</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {past.map((inv, idx) => (
                        <tr key={inv.interviewId || idx} className="hover-bg">
                          <td className="fs-p9 text-secondary">{idx + 1}</td>
                          <td>
                            <div className="bold fs-p9">{getCompany(inv)}</div>
                            <div className="fs-p8 text-secondary">{getCompanyLocation(inv)}</div>
                          </td>
                          <td className="fs-p9">{getJobTitle(inv)}</td>
                          <td className="fs-p9">{inv.interviewMode || "—"}</td>
                          <td className="fs-p9 text-secondary">{formatDT(inv.interviewDateTime)}</td>
                          <td>
                            <StatusPill status={inv.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Upcoming Interview Card ────────────────────────────
function UpcomingCard({ inv, getCompany, getJobTitle, getCompanyLocation, formatDT }) {
  const cfg = INTERVIEW_STATUS[inv.status] || INTERVIEW_STATUS.Scheduled;

  return (
    <div
      className="card p-4"
      style={{
        width: "calc(48% - 8px)", minWidth: 300,
        borderLeft: `4px solid ${cfg.color}`,
      }}
    >
      {/* Top row */}
      <div className="row space-between items-center mb-3">
        <div>
          <h4 className="bold">{getCompany(inv)}</h4>
          <p className="fs-p9 text-secondary">💼 {getJobTitle(inv)}</p>
        </div>
        <StatusPill status={inv.status} />
      </div>

      {/* Details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { icon: "🕐", label: "Date & Time", value: formatDT(inv.interviewDateTime) },
          { icon: "📱", label: "Mode",        value: inv.interviewMode || "—"         },
          { icon: "📍", label: "Location",    value: getCompanyLocation(inv)           },
          { icon: "🎫", label: "Interview ID", value: `#${inv.interviewId || "—"}`    },
        ].map((d, i) => (
          <div key={i} style={{
            background: "var(--gray-100)", borderRadius: 8, padding: "8px 10px",
          }}>
            <p className="fs-p8 text-secondary">{d.icon} {d.label}</p>
            <p className="bold fs-p9">{d.value}</p>
          </div>
        ))}
      </div>

      {/* Instructions */}
      {inv.interviewInstructions && (
        <div style={{
          background: "rgba(50,85,99,0.05)", borderRadius: 8, padding: "10px 12px",
          border: "1px solid rgba(50,85,99,0.12)", marginBottom: 12,
        }}>
          <p className="fs-p8 text-secondary mb-1">📝 Instructions from Company</p>
          <p className="fs-p9">{inv.interviewInstructions}</p>
        </div>
      )}

      {/* Map link if lat/lng provided */}
      {inv.latitude && inv.longitude && (
        <a
          href={`https://www.google.com/maps?q=${inv.latitude},${inv.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-muted w-auto"
          style={{
            padding: "7px 16px", fontSize: "0.8rem",
            textDecoration: "none", display: "inline-block",
          }}
        >
          📍 View on Map
        </a>
      )}
    </div>
  );
}

// ── Interview Tips ─────────────────────────────────────
function InterviewTips() {
  return (
    <div className="card p-4 mb-4" style={{
      background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)",
      border: "none",
    }}>
      <h4 className="bold mb-3">💡 Interview Tips</h4>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        {[
          "Research the company thoroughly before your interview",
          "Practice common technical and HR questions in advance",
          "Keep your resume and certificates ready to share",
          "Test your audio/video at least 10 minutes before the call",
          "Dress professionally even for online interviews",
          "Arrive 10 minutes early to show punctuality",
        ].map((tip, i) => (
          <div key={i} style={{
            background: "#fff", flex: "1 1 calc(48% - 5px)",
            border: "1px solid var(--border-color)", borderRadius: 8, padding: "10px 14px",
            fontSize: "0.82rem",
          }}>
            ✅ {tip}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentInterviews;