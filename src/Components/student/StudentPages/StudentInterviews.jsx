import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

// Base API URL: http://localhost:2026/api/job
const baseJob = rest.jobApplications.replace("/job-applications", "");

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${Cookies.get("token")}`,
    "Content-Type": "application/json",
  },
});

// ── Status config ──────────────────────────────────────────
const INTERVIEW_STATUS = {
  Scheduled:           { label: "Scheduled",              bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9" },
  Accepted:            { label: "Confirmed Attending",     bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
  Rejected_By_Student: { label: "Reschedule Requested",   bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
  Not_Attending:       { label: "Not Attending",          bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
  Rescheduled:         { label: "Rescheduled by Company", bg: "rgba(139,92,246,0.1)",  color: "#7c3aed" },
  Selected:            { label: "Selected",               bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
  Rejected:            { label: "Not Selected",           bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
  Cancelled:           { label: "Cancelled",              bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
};

function StatusPill({ status }) {
  const cfg = INTERVIEW_STATUS[status] || { label: status || "—", bg: "rgba(107,114,128,0.1)", color: "#6b7280" };
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

const canRespond = (status) => status === "Scheduled" || status === "Rescheduled";

// ── Date format — handles both interviewDateTime and InterviewDateTime ──
const formatDT = (inv) => {
  // Backend field is capital-I: InterviewDateTime
  const dt = inv.InterviewDateTime || inv.interviewDateTime;
  console.log("RAW datetime value:", dt, "| from inv keys:", Object.keys(inv));
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return String(dt); }
};

function StudentInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [activeTab,  setActiveTab]  = useState("upcoming");
  const [viewInv,    setViewInv]    = useState(null);

  // action modal state
  const [actionInv,  setActionInv]  = useState(null);
  const [actionType, setActionType] = useState(""); // "accept" | "reject" | "reschedule"
  const [reason,     setReason]     = useState("");
  const [acting,     setActing]     = useState(false);
  const [actionMsg,  setActionMsg]  = useState({ text: "", type: "" });

  useEffect(() => { fetchAll(); }, []);

  // ── Fetch all interviews ──────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true); setError("");

      // Step 1: GET /api/job/job-applications
      const appsRes = await axios.get(rest.jobApplications, getHeaders());
      console.log("STEP 1 — raw applications response:", appsRes.data);

      const apps = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                 : Array.isArray(appsRes.data)        ? appsRes.data : [];
      console.log("STEP 1 — parsed apps array:", apps);

      if (apps.length === 0) { setInterviews([]); return; }

      // Step 2: GET /api/job/job-application/{appId}/interview  — for each app
      const allInterviews = [];
      for (const app of apps) {
        const appId = app.jobApplicationId || app.id;
        try {
          const invRes = await axios.get(
            `${baseJob}/job-application/${appId}/interview`,
            getHeaders()
          );
          console.log(`STEP 2 — interviews for app #${appId}:`, invRes.data);

          const raw  = invRes.data?.data || invRes.data;
          const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

          console.log(`STEP 2 — parsed list for app #${appId}:`, list);
          list.forEach((inv) => allInterviews.push({ ...inv, _app: app }));
        } catch (e) {
          console.warn(`STEP 2 — no interviews for app #${appId}, status:`, e.response?.status);
        }
      }

      console.log("STEP 3 — ALL interviews collected:", allInterviews);
      // Log first interview keys so we can see exact field names
      if (allInterviews.length > 0) {
        console.log("STEP 3 — First interview field keys:", Object.keys(allInterviews[0]));
        console.log("STEP 3 — First interview full object:", allInterviews[0]);
      }

      setInterviews(allInterviews);
    } catch (err) {
      console.error("fetchAll error:", err.response?.data || err.message);
      setError("Failed to load your interviews. Please try again.");
    } finally { setLoading(false); }
  };

  // ── Optimistic status update ─────────────────────────────
  const updateStatus = (interviewId, newStatus, newReason) => {
    setInterviews((prev) =>
      prev.map((i) => i.interviewId === interviewId
        ? { ...i, status: newStatus, ...(newReason !== undefined ? { reason: newReason } : {}) }
        : i)
    );
    if (viewInv?.interviewId === interviewId)
      setViewInv((v) => ({ ...v, status: newStatus, ...(newReason !== undefined ? { reason: newReason } : {}) }));
  };

  // ── Accept ────────────────────────────────────────────────
  const handleAccept = async () => {
    setActing(true); setActionMsg({ text: "", type: "" });
    try {
      const res = await axios.get(
        `${baseJob}/interview-schedule/${actionInv.interviewId}/acceptInterview`,
        getHeaders()
      );
      console.log("Accept response:", res.data);
      setActionMsg({ text: "Interview accepted! The company has been notified.", type: "success" });
      updateStatus(actionInv.interviewId, "Accepted");
      setTimeout(closeActionModal, 1800);
    } catch (err) {
      console.error("Accept error:", err.response?.data || err.message);
      setActionMsg({ text: err.response?.data?.message || "Failed to accept. Please try again.", type: "error" });
    } finally { setActing(false); }
  };

  // ── Reject ────────────────────────────────────────────────
  const handleReject = async () => {
    if (!reason.trim()) { setActionMsg({ text: "Please provide a reason.", type: "error" }); return; }
    setActing(true); setActionMsg({ text: "", type: "" });
    try {
      const res = await axios.get(
        `${baseJob}/interview-schedule/${actionInv.interviewId}/rejectInterview`,
        { ...getHeaders(), params: { reason: reason.trim() } }
      );
      console.log("Reject response:", res.data);
      setActionMsg({ text: "Interview rejected. The company has been notified.", type: "success" });
      updateStatus(actionInv.interviewId, "Not_Attending", reason.trim());
      setTimeout(closeActionModal, 1800);
    } catch (err) {
      console.error("Reject error:", err.response?.data || err.message);
      setActionMsg({ text: err.response?.data?.message || "Failed to reject. Please try again.", type: "error" });
    } finally { setActing(false); }
  };

  // ── Reschedule (same reject endpoint, different status) ───
  const handleReschedule = async () => {
    if (!reason.trim()) { setActionMsg({ text: "Please provide a reason.", type: "error" }); return; }
    setActing(true); setActionMsg({ text: "", type: "" });
    try {
      const res = await axios.get(
        `${baseJob}/interview-schedule/${actionInv.interviewId}/rejectInterview`,
        { ...getHeaders(), params: { reason: reason.trim() } }
      );
      console.log("Reschedule response:", res.data);
      setActionMsg({ text: "Reschedule request sent! The company will review it.", type: "success" });
      updateStatus(actionInv.interviewId, "Rejected_By_Student", reason.trim());
      setTimeout(closeActionModal, 1800);
    } catch (err) {
      console.error("Reschedule error:", err.response?.data || err.message);
      setActionMsg({ text: err.response?.data?.message || "Failed to send request. Please try again.", type: "error" });
    } finally { setActing(false); }
  };

  const openAction = (inv, type) => {
    setActionInv(inv); setActionType(type); setReason(""); setActionMsg({ text: "", type: "" });
  };
  const closeActionModal = () => {
    setActionInv(null); setActionType(""); setReason(""); setActionMsg({ text: "", type: "" });
  };

  // ── Data helpers ──────────────────────────────────────────
  const getJobTitle = (inv) => inv._app?.jobSuggestionModel?.jobPostModel?.tiitle
                            || inv._app?.jobSuggestionModel?.jobPostModel?.title || "Job";
  const getCompany  = (inv) => inv._app?.jobSuggestionModel?.jobPostModel?.companyModel?.companyName || "Company";
  const getLocation = (inv) => inv._app?.jobSuggestionModel?.jobPostModel?.companyModel?.location || "—";
  const getInitial  = (inv) => getCompany(inv).charAt(0).toUpperCase();

  const upcoming = interviews.filter((i) => canRespond(i.status));
  const past     = interviews.filter((i) => !canRespond(i.status));

  const stats = {
    scheduled:   interviews.filter((i) => i.status === "Scheduled").length,
    accepted:    interviews.filter((i) => i.status === "Accepted").length,
    selected:    interviews.filter((i) => i.status === "Selected").length,
    rescheduled: interviews.filter((i) => i.status === "Rescheduled").length,
  };

  // ── Response buttons ──────────────────────────────────────
  const ResponseButtons = ({ inv, fromModal = false }) => {
    const open = (type) => { if (fromModal) setViewInv(null); openAction(inv, type); };
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => open("accept")}
          disabled={inv.status === "Accepted"}
          style={{
            flex: 1, minWidth: 100, padding: "9px 10px", borderRadius: 8,
            fontSize: "0.82rem", fontWeight: 600,
            border: "2px solid #16a34a",
            background: inv.status === "Accepted" ? "#16a34a" : "#fff",
            color:      inv.status === "Accepted" ? "#fff"    : "#16a34a",
            cursor:     inv.status === "Accepted" ? "default" : "pointer",
            opacity:    inv.status === "Accepted" ? 0.85 : 1,
          }}
        >
          {inv.status === "Accepted" ? "Accepted" : "Accept"}
        </button>

        <button
          onClick={() => open("reject")}
          disabled={inv.status === "Not_Attending"}
          style={{
            flex: 1, minWidth: 100, padding: "9px 10px", borderRadius: 8,
            fontSize: "0.82rem", fontWeight: 600,
            border: "2px solid #dc2626",
            background: inv.status === "Not_Attending" ? "#dc2626" : "#fff",
            color:      inv.status === "Not_Attending" ? "#fff"    : "#dc2626",
            cursor:     inv.status === "Not_Attending" ? "default" : "pointer",
            opacity:    inv.status === "Not_Attending" ? 0.85 : 1,
          }}
        >
          {inv.status === "Not_Attending" ? "Rejected" : "Reject"}
        </button>

        <button
          onClick={() => open("reschedule")}
          disabled={inv.status === "Rejected_By_Student"}
          style={{
            flex: 1, minWidth: 100, padding: "9px 10px", borderRadius: 8,
            fontSize: "0.82rem", fontWeight: 600,
            border: "2px solid #f59e0b",
            background: inv.status === "Rejected_By_Student" ? "#f59e0b" : "#fff",
            color:      inv.status === "Rejected_By_Student" ? "#fff"    : "#f59e0b",
            cursor:     inv.status === "Rejected_By_Student" ? "default" : "pointer",
            opacity:    inv.status === "Rejected_By_Student" ? 0.85 : 1,
          }}
        >
          {inv.status === "Rejected_By_Student" ? "Reschedule Req. Sent" : "Reschedule"}
        </button>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">My Interviews</h2>
        <p className="fs-p9 text-secondary">View your scheduled interviews and respond to them</p>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Scheduled",  value: stats.scheduled,   color: "#0ea5e9"        },
          { label: "Confirmed",  value: stats.accepted,    color: "var(--success)" },
          { label: "Selected",   value: stats.selected,    color: "var(--success)" },
          { label: "Rescheduled",value: stats.rescheduled, color: "#7c3aed"        },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-3 text-center">
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p8 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <div style={{
          background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.25)",
          borderRadius: 10, padding: "12px 18px", marginBottom: 20,
        }}>
          <p className="bold fs-p9" style={{ color: "#0ea5e9" }}>Response Pending</p>
          <p className="fs-p9 text-secondary">
            You have <strong>{upcoming.length}</strong> interview{upcoming.length > 1 ? "s" : ""} awaiting your response.
          </p>
        </div>
      )}

      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary mt-2">Loading your interviews...</p>
        </div>
      ) : error ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button className="btn btn-primary mt-3 w-auto" style={{ padding: "8px 20px" }} onClick={fetchAll}>Retry</button>
        </div>
      ) : interviews.length === 0 ? (
        <div className="card p-5 text-center mb-4">
          <p className="bold mt-2">No interviews yet</p>
          <p className="text-secondary fs-p9 mt-1">Apply to jobs and wait for companies to schedule interviews.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="row mb-4" style={{ gap: 10 }}>
            {[
              { key: "upcoming", label: `Upcoming (${upcoming.length})` },
              { key: "past",     label: `Past (${past.length})`         },
            ].map((t) => (
              <button key={t.key}
                className={`btn w-auto ${activeTab === t.key ? "btn-primary" : "btn-muted"}`}
                style={{ padding: "8px 22px" }}
                onClick={() => setActiveTab(t.key)}
              >{t.label}</button>
            ))}
          </div>

          {/* UPCOMING TAB */}
          {activeTab === "upcoming" && (
            upcoming.length === 0 ? (
              <div className="card p-5 text-center mb-4">
                <p className="bold mt-2">No upcoming interviews right now</p>
                <p className="text-secondary fs-p9">Check the Past tab for completed interviews.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                {upcoming.map((inv, idx) => {
                  const cfg = INTERVIEW_STATUS[inv.status] || INTERVIEW_STATUS.Scheduled;
                  return (
                    <div key={inv.interviewId || idx} className="card p-0"
                      style={{ borderLeft: `4px solid ${cfg.color}`, overflow: "hidden" }}>

                      {/* Card header */}
                      <div style={{
                        padding: "16px 20px", borderBottom: "1px solid var(--border-color)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{
                            width: 46, height: 46, borderRadius: 10, flexShrink: 0,
                            background: cfg.color, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "1.1rem",
                          }}>
                            {getInitial(inv)}
                          </div>
                          <div>
                            <h4 className="bold">{getCompany(inv)}</h4>
                            <p className="fs-p9 text-secondary">{getJobTitle(inv)}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <StatusPill status={inv.status} />
                          <button onClick={() => setViewInv(inv)} style={{
                            padding: "6px 14px", fontSize: "0.78rem", borderRadius: 6,
                            background: "var(--primary)", color: "#fff", border: "none",
                            cursor: "pointer", fontWeight: 600,
                          }}>Details</button>
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: "16px 20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                          {[
                            { label: "Date & Time", value: formatDT(inv) },
                            { label: "Mode",        value: inv.interviewMode || "—" },
                            { label: "Location",    value: getLocation(inv) },
                          ].map((d, i) => (
                            <div key={i} style={{ background: "var(--gray-100)", borderRadius: 8, padding: "10px 12px" }}>
                              <p className="fs-p8 text-secondary">{d.label}</p>
                              <p className="bold fs-p9">{d.value}</p>
                            </div>
                          ))}
                        </div>

                        {inv.interviewInstructions && (
                          <div style={{
                            background: "rgba(50,85,99,0.05)", borderRadius: 8, padding: "10px 12px",
                            border: "1px solid rgba(50,85,99,0.12)", marginBottom: 16,
                          }}>
                            <p className="fs-p8 text-secondary mb-1">Instructions</p>
                            <p className="fs-p9">{inv.interviewInstructions}</p>
                          </div>
                        )}

                        {inv.status === "Rescheduled" && (
                          <div style={{
                            background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.25)",
                            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                          }}>
                            <p className="fs-p9" style={{ color: "#7c3aed" }}>
                              The company rescheduled this interview. Please review the new time and respond.
                            </p>
                          </div>
                        )}

                        {inv.latitude && inv.longitude && (
                          <a href={`https://www.google.com/maps?q=${inv.latitude},${inv.longitude}`}
                            target="_blank" rel="noreferrer"
                            className="btn btn-muted w-auto"
                            style={{ padding: "7px 16px", fontSize: "0.8rem", textDecoration: "none", display: "inline-block", marginBottom: 14 }}
                          >View on Map</a>
                        )}

                        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 14 }}>
                          <p className="fs-p8 text-secondary mb-2">Your Response:</p>
                          <ResponseButtons inv={inv} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* PAST TAB */}
          {activeTab === "past" && (
            past.length === 0 ? (
              <div className="card p-5 text-center">
                <p className="bold mt-2">No past interviews yet</p>
              </div>
            ) : (
              <div className="card p-0" style={{ overflow: "hidden" }}>
                <div className="row items-center" style={{
                  background: "var(--gray-100)", padding: "10px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
                }}>
                  <div style={{ width: 36 }}>#</div>
                  <div style={{ flex: 2 }}>Company</div>
                  <div style={{ flex: 2 }}>Job Role</div>
                  <div style={{ flex: 1, textAlign: "center" }}>Mode</div>
                  <div style={{ flex: 2 }}>Date & Time</div>
                  <div style={{ flex: 2, textAlign: "center" }}>Result</div>
                </div>
                {past.map((inv, idx) => (
                  <div key={inv.interviewId || idx} className="row items-center"
                    style={{
                      padding: "12px 16px", borderBottom: "1px solid var(--border-color)",
                      background: "#fff", cursor: "pointer",
                    }}
                    onClick={() => setViewInv(inv)}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(50,85,99,0.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                  >
                    <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>
                    <div style={{ flex: 2 }}>
                      <p className="bold fs-p9">{getCompany(inv)}</p>
                      <p className="fs-p8 text-secondary">{getLocation(inv)}</p>
                    </div>
                    <div style={{ flex: 2 }} className="fs-p9">{getJobTitle(inv)}</div>
                    <div style={{ flex: 1, textAlign: "center" }} className="fs-p9">{inv.interviewMode || "—"}</div>
                    <div style={{ flex: 2 }} className="fs-p9 text-secondary">{formatDT(inv)}</div>
                    <div style={{ flex: 2, textAlign: "center" }}><StatusPill status={inv.status} /></div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* DETAIL MODAL */}
      {viewInv && (
        <div className="modal-overlay" onClick={() => setViewInv(null)}>
          <div className="card p-5"
            style={{ width: 580, maxWidth: "96%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-4">
              <div className="row items-center g-3">
                <div style={{
                  width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
                  background: INTERVIEW_STATUS[viewInv.status]?.color || "var(--primary)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.3rem", fontWeight: 700,
                }}>{getInitial(viewInv)}</div>
                <div>
                  <h3 className="bold">{getCompany(viewInv)}</h3>
                  <p className="fs-p9 text-secondary">{getJobTitle(viewInv)}</p>
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setViewInv(null)}>x</span>
            </div>

            {/* Status banner */}
            <div style={{
              background: INTERVIEW_STATUS[viewInv.status]?.bg || "var(--gray-100)",
              borderLeft: `4px solid ${INTERVIEW_STATUS[viewInv.status]?.color || "#ccc"}`,
              borderRadius: 8, padding: "12px 16px", marginBottom: 20,
            }}>
              <p className="fs-p8 text-secondary mb-1">Interview Status</p>
              <StatusPill status={viewInv.status} />
            </div>

            {viewInv.reason && (
              <div style={{
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              }}>
                <p className="fs-p8 bold mb-1" style={{ color: "#f59e0b" }}>Your reason:</p>
                <p className="fs-p9 text-secondary" style={{ fontStyle: "italic" }}>"{viewInv.reason}"</p>
              </div>
            )}

            <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)", marginBottom: 10 }}>
              Interview Details
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
              {[
                { label: "Date & Time", value: formatDT(viewInv) },
                { label: "Mode",        value: viewInv.interviewMode || "—" },
                { label: "Location",    value: getLocation(viewInv) },
                { label: "Company",     value: getCompany(viewInv) },
              ].map((f) => (
                <div key={f.label} style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: "10px 12px", background: "var(--bg-color)" }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: 4 }}>{f.label}</p>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>{f.value}</p>
                </div>
              ))}
            </div>

            {viewInv.interviewInstructions && (
              <div style={{
                background: "rgba(50,85,99,0.05)", borderRadius: 8, padding: "12px 14px",
                border: "1px solid rgba(50,85,99,0.12)", marginBottom: 18,
              }}>
                <p className="fs-p8 text-secondary mb-1">Instructions</p>
                <p className="fs-p9">{viewInv.interviewInstructions}</p>
              </div>
            )}

            {viewInv.latitude && viewInv.longitude && (
              <a href={`https://www.google.com/maps?q=${viewInv.latitude},${viewInv.longitude}`}
                target="_blank" rel="noreferrer"
                className="btn btn-muted w-auto"
                style={{ padding: "7px 16px", fontSize: "0.8rem", textDecoration: "none", display: "inline-block", marginBottom: 18 }}
              >View on Map</a>
            )}

            {canRespond(viewInv.status) && (
              <>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)", marginBottom: 10 }}>
                  Your Response
                </p>
                <div style={{ marginBottom: 20 }}>
                  <ResponseButtons inv={viewInv} fromModal={true} />
                </div>
              </>
            )}

            <button className="btn btn-muted" onClick={() => setViewInv(null)}>Close</button>
          </div>
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {actionInv && (
        <div className="modal-overlay" onClick={closeActionModal}>
          <div className="card p-5" style={{ width: 480, maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-3">
              <h3 className="bold">
                {actionType === "accept"     && "Accept Interview"}
                {actionType === "reject"     && "Reject Interview"}
                {actionType === "reschedule" && "Request Reschedule"}
              </h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={closeActionModal}>x</span>
            </div>

            {/* Interview summary */}
            <div style={{
              background: "rgba(50,85,99,0.05)", borderRadius: 8,
              padding: "12px 14px", marginBottom: 20,
              border: "1px solid rgba(50,85,99,0.12)",
            }}>
              <p className="bold fs-p9">{getCompany(actionInv)}</p>
              <p className="fs-p9 text-secondary">{getJobTitle(actionInv)}</p>
              <p className="fs-p9 text-secondary mt-1">{formatDT(actionInv)}</p>
              <p className="fs-p9 text-secondary">{actionInv.interviewMode || "—"}</p>
            </div>

            {actionType === "accept" && (
              <div style={{
                background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)",
                borderRadius: 8, padding: "12px 14px", marginBottom: 20,
              }}>
                <p className="fs-p9" style={{ color: "#16a34a" }}>
                  You are confirming you will attend this interview. The company will be notified immediately.
                </p>
              </div>
            )}

            {(actionType === "reject" || actionType === "reschedule") && (
              <div className="form-group mb-4">
                <label className="form-control-label">
                  {actionType === "reject" ? "Reason for Rejection" : "Reason for Reschedule Request"}
                  <span style={{ color: "var(--danger)" }}> *</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder={
                    actionType === "reject"
                      ? "e.g. I have accepted another offer."
                      : "e.g. I have an exam that day, can we please reschedule to next week?"
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ resize: "vertical" }}
                />
                <p className="fs-p8 text-secondary mt-1">Your reason will be shared with the company.</p>
              </div>
            )}

            {actionMsg.text && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem",
                background: actionMsg.type === "success" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                border: `1px solid ${actionMsg.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                color: actionMsg.type === "success" ? "#16a34a" : "#dc2626",
              }}>{actionMsg.text}</div>
            )}

            <div className="row g-2">
              <button
                onClick={
                  actionType === "accept"     ? handleAccept    :
                  actionType === "reject"     ? handleReject    :
                  handleReschedule
                }
                disabled={acting}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                  border: "none", cursor: acting ? "not-allowed" : "pointer", color: "#fff",
                  background: acting          ? "var(--gray-400)"
                    : actionType === "accept" ? "#16a34a"
                    : actionType === "reject" ? "#dc2626"
                    : "#f59e0b",
                }}
              >
                {acting ? "Submitting..." : (
                  actionType === "accept"     ? "Confirm Acceptance"      :
                  actionType === "reject"     ? "Confirm Rejection"       :
                  "Send Reschedule Request"
                )}
              </button>
              <button className="btn btn-muted" style={{ flex: 1 }} onClick={closeActionModal} disabled={acting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentInterviews;