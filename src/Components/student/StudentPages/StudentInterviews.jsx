import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const INTERVIEW_STATUS = {
  Scheduled:           { label: "Scheduled",           bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9", icon: "📅" },
  Accepted:            { label: "Confirmed Attending",  bg: "rgba(22,163,74,0.1)",   color: "#16a34a", icon: "✅" },
  Rejected_By_Student: { label: "Reschedule Requested", bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", icon: "🔄" },
  Not_Attending:       { label: "Not Attending",        bg: "rgba(220,38,38,0.1)",   color: "#dc2626", icon: "❌" },
  Rescheduled:         { label: "Rescheduled",          bg: "rgba(139,92,246,0.1)",  color: "#7c3aed", icon: "📅" },
  Selected:            { label: "Selected 🎉",          bg: "rgba(22,163,74,0.1)",   color: "#16a34a", icon: "🎉" },
  Rejected:            { label: "Not Selected",         bg: "rgba(220,38,38,0.1)",   color: "#dc2626", icon: "🚫" },
  Cancelled:           { label: "Cancelled",            bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: "🗑️" },
};

function StatusPill({ status }) {
  const cfg = INTERVIEW_STATUS[status] || { label: status || "—", bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: "•" };
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
      background: cfg.bg, color: cfg.color, display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// Statuses where student can still respond
const canRespond = (status) => status === "Scheduled" || status === "Rescheduled";

function StudentInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [activeTab,  setActiveTab]  = useState("upcoming");

  // ── Response modal ─────────────────────────────────
  const [respondInv,    setRespondInv]    = useState(null);
  const [respondAction, setRespondAction] = useState(""); // "attend" | "reschedule" | "notattend"
  const [reason,        setReason]        = useState("");
  const [responding,    setResponding]    = useState(false);
  const [respondMsg,    setRespondMsg]    = useState({ text: "", type: "" });

  const header = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || localStorage.getItem("token") || ""}`,
    },
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true); setError("");

        // Step 1 — suggestions
        const sugRes  = await axios.get(rest.jobSuggestions, header());
        const sugList = sugRes.data?.data || sugRes.data || [];
        const sugs    = Array.isArray(sugList) ? sugList : [];

        // Step 2 — applications per suggestion
        const appArrays = await Promise.all(
          sugs.map(async (sug) => {
            const sugId = sug.jobSuggestionId || sug.id;
            try {
              const res  = await axios.get(`${rest.jobSuggestions}/${sugId}/job-applications`, header());
              const apps = res.data?.data || res.data || [];
              return Array.isArray(apps) ? apps.map((a) => ({ ...a, _sug: sug })) : [];
            } catch { return []; }
          })
        );
        const allApps = appArrays.flat();

        // Step 3 — interview per application
        const invArrays = await Promise.all(
          allApps.map(async (app) => {
            const appId = app.jobApplicationId || app.id;
            try {
              const res  = await axios.get(`${rest.jobApplications}/${appId}/interview`, header());
              const inv  = res.data?.data || res.data;
              const list = Array.isArray(inv) ? inv : inv ? [inv] : [];
              return list.map((i) => ({ ...i, _app: app, _sug: app._sug }));
            } catch { return []; }
          })
        );

        setInterviews(invArrays.flat());
      } catch (err) {
        console.error("StudentInterviews:", err);
        setError("Failed to load your interviews. Please try again.");
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // ── Student responds to interview ───────────────────
  const handleRespond = async () => {
    if ((respondAction === "reschedule" || respondAction === "notattend") && !reason.trim()) {
      setRespondMsg({ text: "Please provide a reason.", type: "error" }); return;
    }
    setResponding(true); setRespondMsg({ text: "", type: "" });

    const statusMap = {
      attend:     "Accepted",
      reschedule: "Rejected_By_Student",
      notattend:  "Not_Attending",
    };
    const newStatus = statusMap[respondAction];
    const appId     = respondInv._app?.jobApplicationId || respondInv.jobApplicationId;

    try {
      await axios.post(
        `${rest.jobApplications}/${appId}/interview`,
        {
          status:            newStatus,
          jobApplicationId:  appId,
          interviewMode:     respondInv.interviewMode     || "Online",
          interviewDateTime: respondInv.interviewDateTime || new Date().toISOString(),
          reason:            reason.trim() || null,
          interviewInstructions: respondInv.interviewInstructions || "",
          latitude:          respondInv.latitude  || null,
          longitude:         respondInv.longitude || null,
        },
        header()
      );
      setRespondMsg({ text: "Response submitted successfully!", type: "success" });
      setInterviews((prev) =>
        prev.map((i) => i.interviewId === respondInv.interviewId ? { ...i, status: newStatus, reason: reason.trim() } : i)
      );
      setTimeout(() => { setRespondInv(null); setRespondAction(""); setReason(""); setRespondMsg({ text: "", type: "" }); }, 1500);
    } catch (err) {
      setRespondMsg({ text: err.response?.data?.message || "Failed to submit response.", type: "error" });
    } finally { setResponding(false); }
  };

  // ── Helpers ────────────────────────────────────────
  const getCompany  = (inv) =>
    inv._sug?.jobPostModel?.companyModel?.companyName ||
    inv._app?.jobSuggestionModel?.jobPostModel?.companyModel?.companyName || "Company";

  const getJobTitle = (inv) =>
    inv._sug?.jobPostModel?.tiitle || inv._sug?.jobPostModel?.title ||
    inv._app?.jobSuggestionModel?.jobPostModel?.tiitle || "Job";

  const getLocation = (inv) => inv._sug?.jobPostModel?.companyModel?.location || "—";

  const formatDT = (dt) => {
    if (!dt) return "—";
    try {
      return new Date(dt).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return dt; }
  };

  const isUpcoming = (inv) => canRespond(inv.status);
  const upcoming   = interviews.filter(isUpcoming);
  const past       = interviews.filter((i) => !isUpcoming(i));

  const stats = {
    scheduled: interviews.filter((i) => i.status === "Scheduled").length,
    accepted:  interviews.filter((i) => i.status === "Accepted").length,
    selected:  interviews.filter((i) => i.status === "Selected").length,
    rejected:  interviews.filter((i) => ["Rejected", "Cancelled"].includes(i.status)).length,
  };

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">📅 My Interviews</h2>
        <p className="fs-p9 text-secondary">View your scheduled interviews and respond to them</p>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { icon: "📅", label: "Scheduled", value: stats.scheduled, color: "#0ea5e9"          },
          { icon: "✅", label: "Confirmed",  value: stats.accepted,  color: "var(--success)"   },
          { icon: "🎉", label: "Selected",   value: stats.selected,  color: "var(--success)"   },
          { icon: "🚫", label: "Rejected",   value: stats.rejected,  color: "var(--danger)"    },
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
            <p className="text-secondary fs-p9 mt-1">Apply to jobs and wait for companies to schedule interviews.</p>
          </div>
          <InterviewTips />
        </>
      ) : (
        <>
          {/* Tabs */}
          <div className="row mb-4" style={{ gap: 10 }}>
            {[
              { key: "upcoming", label: `📅 Upcoming (${upcoming.length})` },
              { key: "past",     label: `📋 Past (${past.length})`         },
            ].map((t) => (
              <button key={t.key}
                className={`btn w-auto ${activeTab === t.key ? "btn-primary" : "btn-muted"}`}
                style={{ padding: "8px 22px" }}
                onClick={() => setActiveTab(t.key)}
              >{t.label}</button>
            ))}
          </div>

          {/* ── UPCOMING ── */}
          {activeTab === "upcoming" && (
            <>
              {upcoming.length === 0 ? (
                <div className="card p-5 text-center mb-4">
                  <p style={{ fontSize: "2.5rem" }}>🎊</p>
                  <p className="bold mt-2">No upcoming interviews right now</p>
                  <p className="text-secondary fs-p9">Check the Past tab for completed interviews.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                  {upcoming.map((inv, idx) => {
                    const cfg = INTERVIEW_STATUS[inv.status] || INTERVIEW_STATUS.Scheduled;
                    return (
                      <div key={inv.interviewId || idx} className="card p-4" style={{ borderLeft: `4px solid ${cfg.color}` }}>

                        {/* Top row */}
                        <div className="row space-between items-center mb-3">
                          <div>
                            <h4 className="bold">{getCompany(inv)}</h4>
                            <p className="fs-p9 text-secondary">💼 {getJobTitle(inv)}</p>
                          </div>
                          <StatusPill status={inv.status} />
                        </div>

                        {/* Details grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                          {[
                            { icon: "🕐", label: "Date & Time", value: formatDT(inv.interviewDateTime) },
                            { icon: "📱", label: "Mode",        value: inv.interviewMode || "—"         },
                            { icon: "📍", label: "Location",    value: getLocation(inv)                  },
                          ].map((d, i) => (
                            <div key={i} style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 10px" }}>
                              <p className="fs-p8 text-secondary">{d.icon} {d.label}</p>
                              <p className="bold fs-p9">{d.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Instructions */}
                        {inv.interviewInstructions && (
                          <div style={{
                            background: "rgba(50,85,99,0.05)", borderRadius: 8, padding: "10px 12px",
                            border: "1px solid rgba(50,85,99,0.12)", marginBottom: 14,
                          }}>
                            <p className="fs-p8 text-secondary mb-1">📝 Instructions from Company</p>
                            <p className="fs-p9">{inv.interviewInstructions}</p>
                          </div>
                        )}

                        {/* Map link */}
                        {inv.latitude && inv.longitude && (
                          <a href={`https://www.google.com/maps?q=${inv.latitude},${inv.longitude}`}
                            target="_blank" rel="noreferrer"
                            className="btn btn-muted w-auto"
                            style={{ padding: "7px 16px", fontSize: "0.8rem", textDecoration: "none", display: "inline-block", marginBottom: 14 }}
                          >📍 View on Map</a>
                        )}

                        {/* ── 3 Action Buttons ── */}
                        <div style={{
                          borderTop: "1px solid var(--border-color)", paddingTop: 14,
                          display: "flex", gap: 10, flexWrap: "wrap",
                        }}>
                          <p className="fs-p8 text-secondary w-100 mb-1" style={{ width: "100%" }}>Your Response:</p>

                          {/* Attending */}
                          <button
                            onClick={() => { setRespondInv(inv); setRespondAction("attend"); setReason(""); setRespondMsg({ text: "", type: "" }); }}
                            style={{
                              padding: "9px 20px", borderRadius: 8, fontSize: "0.85rem",
                              background: inv.status === "Accepted" ? "#16a34a" : "#fff",
                              color: inv.status === "Accepted" ? "#fff" : "#16a34a",
                              border: "2px solid #16a34a", cursor: "pointer", fontWeight: 600,
                            }}
                          >
                            ✅ {inv.status === "Accepted" ? "Attending ✓" : "I'll Attend"}
                          </button>

                          {/* Request Reschedule */}
                          <button
                            onClick={() => { setRespondInv(inv); setRespondAction("reschedule"); setReason(""); setRespondMsg({ text: "", type: "" }); }}
                            style={{
                              padding: "9px 20px", borderRadius: 8, fontSize: "0.85rem",
                              background: inv.status === "Rejected_By_Student" ? "#f59e0b" : "#fff",
                              color: inv.status === "Rejected_By_Student" ? "#fff" : "#f59e0b",
                              border: "2px solid #f59e0b", cursor: "pointer", fontWeight: 600,
                            }}
                          >
                            🔄 {inv.status === "Rejected_By_Student" ? "Reschedule Requested ✓" : "Request Reschedule"}
                          </button>

                          {/* Not Attending */}
                          <button
                            onClick={() => { setRespondInv(inv); setRespondAction("notattend"); setReason(""); setRespondMsg({ text: "", type: "" }); }}
                            style={{
                              padding: "9px 20px", borderRadius: 8, fontSize: "0.85rem",
                              background: inv.status === "Not_Attending" ? "#dc2626" : "#fff",
                              color: inv.status === "Not_Attending" ? "#fff" : "#dc2626",
                              border: "2px solid #dc2626", cursor: "pointer", fontWeight: 600,
                            }}
                          >
                            ❌ {inv.status === "Not_Attending" ? "Not Attending ✓" : "Can't Attend"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <InterviewTips />
            </>
          )}

          {/* ── PAST ── */}
          {activeTab === "past" && (
            past.length === 0 ? (
              <div className="card p-5 text-center">
                <p style={{ fontSize: "2.5rem" }}>📂</p>
                <p className="bold mt-2">No past interviews yet</p>
                <p className="text-secondary fs-p9">Completed interviews will appear here.</p>
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
                  <div style={{ flex: 2, textAlign: "center" }}>Your Response</div>
                </div>
                {past.map((inv, idx) => (
                  <div key={inv.interviewId || idx} className="row items-center" style={{
                    padding: "12px 16px", borderBottom: "1px solid var(--border-color)",
                    background: "#fff", transition: "background 0.15s",
                  }}
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
                    <div style={{ flex: 2 }} className="fs-p9 text-secondary">{formatDT(inv.interviewDateTime)}</div>
                    <div style={{ flex: 2, textAlign: "center" }}><StatusPill status={inv.status} /></div>
                    <div style={{ flex: 2, textAlign: "center" }}>
                      {inv.reason
                        ? <span className="fs-p8 text-secondary" style={{ fontStyle: "italic" }}>"{inv.reason}"</span>
                        : <span className="fs-p8 text-secondary">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* ══ RESPOND MODAL ══ */}
      {respondInv && (
        <div className="modal-overlay" onClick={() => { setRespondInv(null); setRespondAction(""); setReason(""); }}>
          <div className="card p-5" style={{ width: 460, maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="row space-between items-center mb-3">
              <h3 className="bold">
                {respondAction === "attend"     && "✅ Confirm Attendance"}
                {respondAction === "reschedule" && "🔄 Request Reschedule"}
                {respondAction === "notattend"  && "❌ Can't Attend"}
              </h3>
              <span className="cursor-pointer fs-4 text-secondary"
                onClick={() => { setRespondInv(null); setRespondAction(""); setReason(""); }}>✕</span>
            </div>

            {/* Interview summary */}
            <div style={{
              background: "rgba(50,85,99,0.05)", borderRadius: 8, padding: "12px 14px", marginBottom: 20,
              border: "1px solid rgba(50,85,99,0.12)",
            }}>
              <p className="bold fs-p9">{getCompany(respondInv)}</p>
              <p className="fs-p9 text-secondary">💼 {getJobTitle(respondInv)}</p>
              <p className="fs-p9 text-secondary mt-1">🕐 {formatDT(respondInv.interviewDateTime)}</p>
              <p className="fs-p9 text-secondary">📱 {respondInv.interviewMode || "—"}</p>
            </div>

            {respondAction === "attend" && (
              <div style={{
                background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)",
                borderRadius: 8, padding: "12px 14px", marginBottom: 20,
              }}>
                <p className="fs-p9" style={{ color: "#16a34a" }}>
                  ✅ You are confirming that you will attend this interview. The company will be notified.
                </p>
              </div>
            )}

            {(respondAction === "reschedule" || respondAction === "notattend") && (
              <div className="form-group mb-4">
                <label className="form-control-label">
                  📝 {respondAction === "reschedule" ? "Reason for Reschedule" : "Reason for Not Attending"}
                  <span style={{ color: "var(--danger)" }}> *</span>
                </label>
                <textarea
                  className="form-control" rows={3}
                  placeholder={
                    respondAction === "reschedule"
                      ? "e.g. I have an exam on that day, can we reschedule to next week?"
                      : "e.g. I have a medical emergency and cannot attend."
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>
            )}

            {respondMsg.text && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem",
                background: respondMsg.type === "success" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                border: `1px solid ${respondMsg.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                color: respondMsg.type === "success" ? "#16a34a" : "#dc2626",
              }}>{respondMsg.text}</div>
            )}

            <div className="row g-2">
              <button
                onClick={handleRespond} disabled={responding}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                  border: "none", cursor: responding ? "not-allowed" : "pointer", color: "#fff",
                  background: responding ? "var(--gray-400)"
                    : respondAction === "attend"     ? "#16a34a"
                    : respondAction === "reschedule" ? "#f59e0b"
                    : "#dc2626",
                }}
              >
                {responding ? "⏳ Submitting..." : "Confirm"}
              </button>
              <button className="btn btn-muted" style={{ flex: 1 }}
                onClick={() => { setRespondInv(null); setRespondAction(""); setReason(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewTips() {
  return (
    <div className="card p-4 mb-4" style={{ background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)", border: "none" }}>
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
            border: "1px solid var(--border-color)", borderRadius: 8,
            padding: "10px 14px", fontSize: "0.82rem",
          }}>✅ {tip}</div>
        ))}
      </div>
    </div>
  );
}

export default StudentInterviews;