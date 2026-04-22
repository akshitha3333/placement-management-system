import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

// ── Auth headers ──────────────────────────────────────────────────────────────
const getHeaders = () => {
  const token = Cookies.get("token") || localStorage.getItem("token") || "";
  return { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } };
};

// ── Base URL ──────────────────────────────────────────────────────────────────
const baseApi = () => rest.jobApplications.replace(/\/job-applications.*$/, "");

// ── URL builders ──────────────────────────────────────────────────────────────
const interviewByAppUrl  = (appId) => `${baseApi()}/job-application/${appId}/interview`;
const markSelectedUrl    = (id)    => `${baseApi()}/interview-schedule/${id}/markAsSelected`;
const markNotSelectedUrl = (id)    => `${baseApi()}/interview-schedule/${id}/not-selected`;

// ── Status config ─────────────────────────────────────────────────────────────
const INTERVIEW_STATUS = {
  Scheduled:           { label: "Scheduled",            bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9" },
  Accepted:            { label: "Attending",            bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
  Rejected_By_Student: { label: "Reschedule Requested", bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
  Not_Attending:       { label: "Not Attending",        bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
  Rescheduled:         { label: "Rescheduled",          bg: "rgba(139,92,246,0.1)",  color: "#7c3aed" },
  Selected:            { label: "Selected",             bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
  Rejected:            { label: "Not Selected",         bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
  Cancelled:           { label: "Cancelled",            bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
};

// ── Data accessors ────────────────────────────────────────────────────────────
// Backend sends "InterviewDateTime" with capital I — read both forms
const getDateTime    = (inv) => inv?.InterviewDateTime || inv?.interviewDateTime        || null;

const getApp         = (inv) => inv?.jobApplicationModel                                || {};
const getResumeModel = (inv) => getApp(inv)?.resumeModel                                || {};
const getStudent     = (inv) => getResumeModel(inv)?.studentModel
                             || getApp(inv)?.jobSuggestionModel?.studentModel           || {};
const getSuggest     = (inv) => getApp(inv)?.jobSuggestionModel                        || {};
const getJobPost     = (inv) => getSuggest(inv)?.jobPostModel                          || {};

const getName        = (inv) => getStudent(inv)?.name                                  || "Student";
const getEmail       = (inv) => getStudent(inv)?.email                                 || "—";
const getPhone       = (inv) => getStudent(inv)?.phone                                 || "—";
const getRollNo      = (inv) => getStudent(inv)?.rollNumber                            || "—";
const getYear        = (inv) => getStudent(inv)?.year                                  || "—";
const getPercent     = (inv) => getStudent(inv)?.percentage                            || "—";
const getWorking     = (inv) => getStudent(inv)?.workingStatus                         || "—";
const getDept        = (inv) => getStudent(inv)?.departmentModel?.departmentName       || "—";
const getResTitle    = (inv) => getResumeModel(inv)?.resumeTitle
                             || `Resume #${getResumeModel(inv)?.resumeId || "—"}`;
const getTutor       = (inv) => getSuggest(inv)?.tutorModel?.tutorName                 || "—";
const getJobTitle    = (inv) => getJobPost(inv)?.tiitle || getJobPost(inv)?.title      || "—";
const getInitial     = (inv) => getName(inv).charAt(0).toUpperCase();

const formatDT = (dt) => {
  if (dt === null || dt === undefined || dt === "") return "—";
  try {
    let date;
    // Handle array format from Java backends: [2024, 5, 10, 14, 30, 0]
    if (Array.isArray(dt)) {
      // months in JS are 0-indexed, Java LocalDateTime months are 1-indexed
      const [year, month, day, hour = 0, minute = 0, second = 0] = dt;
      date = new Date(year, month - 1, day, hour, minute, second);
    } else if (typeof dt === "number") {
      // epoch millis or epoch seconds
      date = new Date(dt > 1e10 ? dt : dt * 1000);
    } else {
      // string — normalise space-separated datetime to ISO
      date = new Date(String(dt).replace(" ", "T"));
    }
    if (isNaN(date.getTime())) return String(dt);
    return date.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return String(dt);
  }
};

const openResume = (resumeModel) => {
  if (!resumeModel) return;
  const base64 = resumeModel.resume2 || resumeModel.resume;
  if (!base64) { alert("No resume available."); return; }
  const src = base64.startsWith("data:")
    ? base64.replace(/^data:[^;]+;base64,/, "data:application/pdf;base64,")
    : `data:application/pdf;base64,${base64}`;
  const win = window.open();
  if (win) {
    win.document.write(`<iframe src="${src}" style="width:100%;height:100vh;border:none;"></iframe>`);
    win.document.title = resumeModel.resumeTitle || "Resume";
  }
};

// ── Sub-components ────────────────────────────────────────────────────────────
function Pill({ status }) {
  const c = INTERVIEW_STATUS[status] || { label: status || "—", bg: "rgba(107,114,128,0.1)", color: "#6b7280" };
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
      background: c.bg, color: c.color, display: "inline-flex", alignItems: "center", gap: 4,
    }}>{c.label}</span>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: "10px 12px", background: "var(--bg-color)" }}>
      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>{value || "—"}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.06em", color: "var(--primary)", marginBottom: 10, marginTop: 4,
    }}>{children}</p>
  );
}

function FeedbackMsg({ msg }) {
  if (!msg?.text) return null;
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem",
      background: msg.type === "success" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
      border: `1px solid ${msg.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
      color: msg.type === "success" ? "#16a34a" : "#dc2626",
    }}>{msg.text}</div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function CompanyInterviews() {
  const [interviews,   setInterviews]   = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [viewInv,      setViewInv]      = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Reschedule
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    interviewDateTime: "", interviewMode: "Online", interviewInstructions: "", latitude: "", longitude: "",
  });
  const [rescheduling,   setRescheduling]   = useState(false);
  const [rescheduleMsg,  setRescheduleMsg]  = useState({ text: "", type: "" });

  // Cancel
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg,  setCancelMsg]  = useState({ text: "", type: "" });

  // Select / Not-select
  const [showSelect, setShowSelect] = useState(false);
  const [selectType, setSelectType] = useState("");
  const [selecting,  setSelecting]  = useState(false);
  const [selectMsg,  setSelectMsg]  = useState({ text: "", type: "" });

  useEffect(() => { fetchInterviews(); }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchInterviews = async () => {
    setLoading(true); setError("");
    try {
      const appsRes = await axios.get(rest.jobApplications, getHeaders());
      const apps    = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                    : Array.isArray(appsRes.data)        ? appsRes.data : [];

      const invArrays = await Promise.all(
        apps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res  = await axios.get(interviewByAppUrl(appId), getHeaders());
            const data = res.data?.data || res.data;
            const list = Array.isArray(data) ? data : data ? [data] : [];
            return list.map((i) => ({ ...i, _appFallback: app }));
          } catch { return []; }
        })
      );
      const flat = invArrays.flat().filter(Boolean);
      console.log("Raw interview object sample:", flat[0]);
      setInterviews(flat);
    } catch (err) {
      setError("Failed to load interviews. Please try again.");
    } finally { setLoading(false); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateStatus = (interviewId, newStatus) => {
    setInterviews((prev) => prev.map((i) => i.interviewId === interviewId ? { ...i, status: newStatus } : i));
    setViewInv((v) => v?.interviewId === interviewId ? { ...v, status: newStatus } : v);
  };

  const getAppId = (inv) =>
    (inv?.jobApplicationModel || inv?._appFallback)?.jobApplicationId || inv?.jobApplicationId;

  const closeAll = () => {
    setViewInv(null);
    setShowReschedule(false); setRescheduleMsg({ text: "", type: "" });
    setShowCancel(false);     setCancelMsg({ text: "", type: "" });
    setShowSelect(false);     setSelectMsg({ text: "", type: "" });
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleReschedule = async () => {
    if (!rescheduleForm.interviewDateTime || !rescheduleForm.interviewMode) {
      setRescheduleMsg({ text: "Date/time and mode are required.", type: "error" }); return;
    }
    setRescheduling(true); setRescheduleMsg({ text: "", type: "" });
    try {
      const interviewId = viewInv.interviewId || viewInv.id;
      console.log("Rescheduling interviewId:", interviewId, "payload:", rescheduleForm);
      // Correct endpoint: POST /api/job/re-schedule-interview/{interviewId}
      await axios.post(
        `${baseApi()}/re-schedule-interview/${interviewId}`,
        {
          InterviewDateTime:     rescheduleForm.interviewDateTime, // backend field name is capital I
          interviewMode:         rescheduleForm.interviewMode,
          interviewInstructions: rescheduleForm.interviewInstructions || "",
          latitude:              rescheduleForm.latitude  || null,
          longitude:             rescheduleForm.longitude || null,
        },
        getHeaders()
      );
      setRescheduleMsg({ text: "Interview rescheduled successfully!", type: "success" });
      updateStatus(viewInv.interviewId, "Rescheduled");
      setTimeout(() => { setShowReschedule(false); setRescheduleMsg({ text: "", type: "" }); setViewInv(null); }, 1600);
    } catch (err) {
      setRescheduleMsg({ text: err.response?.data?.message || "Failed to reschedule.", type: "error" });
    } finally { setRescheduling(false); }
  };

  const handleCancel = async () => {
    setCancelling(true); setCancelMsg({ text: "", type: "" });
    try {
      const appId = getAppId(viewInv);
      await axios.post(interviewByAppUrl(appId), {
        status: "Cancelled", jobApplicationId: appId,
        interviewMode: viewInv.interviewMode || "Online",
        interviewDateTime: new Date().toISOString(),
        reason: "Cancelled by company.",
      }, getHeaders());
      setCancelMsg({ text: "Application cancelled.", type: "success" });
      updateStatus(viewInv.interviewId, "Cancelled");
      setTimeout(() => { setShowCancel(false); setCancelMsg({ text: "", type: "" }); setViewInv(null); }, 1600);
    } catch (err) {
      setCancelMsg({ text: err.response?.data?.message || "Failed to cancel.", type: "error" });
    } finally { setCancelling(false); }
  };

  const handleSelect = async () => {
    setSelecting(true); setSelectMsg({ text: "", type: "" });
    const url       = selectType === "selected" ? markSelectedUrl(viewInv.interviewId) : markNotSelectedUrl(viewInv.interviewId);
    const newStatus = selectType === "selected" ? "Selected" : "Rejected";
    try {
      await axios.get(url, getHeaders());
      setSelectMsg({
        text: selectType === "selected" ? "Student marked as Selected!" : "Student marked as Not Selected.",
        type: "success",
      });
      updateStatus(viewInv.interviewId, newStatus);
      setTimeout(() => { setShowSelect(false); setSelectMsg({ text: "", type: "" }); setViewInv(null); }, 1600);
    } catch (err) {
      setSelectMsg({ text: err.response?.data?.message || "Action failed.", type: "error" });
    } finally { setSelecting(false); }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const filtered = interviews.filter((inv) => {
    const q      = search.toLowerCase();
    const matchQ = !q
      || getName(inv).toLowerCase().includes(q)
      || getEmail(inv).toLowerCase().includes(q)
      || getDept(inv).toLowerCase().includes(q)
      || getJobTitle(inv).toLowerCase().includes(q);
    const matchS = filterStatus === "ALL" || inv.status === filterStatus;
    return matchQ && matchS;
  });

  const needsAction    = (inv) => inv.status === "Rejected_By_Student" || inv.status === "Not_Attending";
  const canReschedule  = (s)   => ["Scheduled", "Accepted", "Rejected_By_Student", "Rescheduled"].includes(s);
  const canCancel      = (s)   => !["Cancelled", "Selected", "Rejected"].includes(s);
  const canMarkSelect  = (s)   => ["Accepted", "Scheduled", "Rescheduled"].includes(s);

  const stats = {
    total:        interviews.length,
    scheduled:    interviews.filter((i) => i.status === "Scheduled").length,
    attending:    interviews.filter((i) => i.status === "Accepted").length,
    reschedule:   interviews.filter((i) => i.status === "Rejected_By_Student").length,
    notAttending: interviews.filter((i) => i.status === "Not_Attending").length,
    selected:     interviews.filter((i) => i.status === "Selected").length,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">Interview Management</h2>
        <p className="fs-p9 text-secondary">All interviews across your job applications</p>
      </div>

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Total",           value: stats.total,        color: "var(--primary)" },
          { label: "Scheduled",       value: stats.scheduled,    color: "#0ea5e9"        },
          { label: "Attending",       value: stats.attending,    color: "var(--success)" },
          { label: "Req. Reschedule", value: stats.reschedule,   color: "#f59e0b"        },
          { label: "Not Attending",   value: stats.notAttending, color: "var(--danger)"  },
          { label: "Selected",        value: stats.selected,     color: "#16a34a"        },
        ].map((s, i) => (
          <div key={i} style={{ flex: "1 1 120px" }}>
            <div className="card p-3 text-center">
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action-required banner */}
      {(stats.reschedule + stats.notAttending) > 0 && (
        <div style={{
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: 10, padding: "12px 18px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div>
            <p className="bold fs-p9" style={{ color: "#f59e0b" }}>Action Required</p>
            <p className="fs-p9 text-secondary">
              {stats.reschedule > 0 && `${stats.reschedule} student(s) requested reschedule. `}
              {stats.notAttending > 0 && `${stats.notAttending} student(s) not attending.`}
            </p>
          </div>
        </div>
      )}

      {/* Selected students info banner */}
      {stats.selected > 0 && (
        <div style={{
          background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.25)",
          borderRadius: 10, padding: "12px 18px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div>
            <p className="bold fs-p9" style={{ color: "#16a34a" }}>
              {stats.selected} student(s) selected.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="row space-between items-center mb-3" style={{ flexWrap: "wrap", gap: 10 }}>
        <div className="row g-2" style={{ flexWrap: "wrap" }}>
          <input type="text" className="form-control" style={{ width: 240 }}
            placeholder="Search name, email, dept, role..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="form-control" style={{ width: 210 }}
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {Object.entries(INTERVIEW_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <button onClick={fetchInterviews} style={{
          padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-color)",
          background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
        }}>Refresh</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary mt-2">Loading interviews...</p>
        </div>
      ) : error ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button className="btn btn-primary mt-3 w-auto" style={{ padding: "8px 20px" }} onClick={fetchInterviews}>Retry</button>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>
          <div className="row items-center" style={{
            background: "var(--gray-100)", padding: "10px 16px",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
          }}>
            <div style={{ width: 36 }}>#</div>
            <div style={{ flex: 3 }}>Candidate</div>
            <div style={{ flex: 2 }}>Department / Role</div>
            <div style={{ flex: 2 }}>Date & Time</div>
            <div style={{ flex: 1, textAlign: "center" }}>Mode</div>
            <div style={{ flex: 2, textAlign: "center" }}>Status</div>
            <div style={{ flex: 1, textAlign: "center" }}>View</div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-5 text-center">
              <p className="bold mt-2">{interviews.length === 0 ? "No interviews yet" : "No results"}</p>
              <p className="text-secondary fs-p9">
                {interviews.length === 0
                  ? "Interviews appear here once scheduled from Applications."
                  : "Try adjusting search or filters."}
              </p>
            </div>
          ) : filtered.map((inv, idx) => {
            const cfg    = INTERVIEW_STATUS[inv.status] || INTERVIEW_STATUS.Scheduled;
            const action = needsAction(inv);
            return (
              <div key={inv.interviewId || idx} className="row items-center" style={{
                padding: "12px 16px", borderBottom: "1px solid var(--border-color)",
                borderLeft: `4px solid ${action ? "#f59e0b" : cfg.color}`,
                background: action ? "rgba(245,158,11,0.02)" : "#fff", transition: "background 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = action ? "rgba(245,158,11,0.05)" : "rgba(50,85,99,0.02)"}
                onMouseLeave={(e) => e.currentTarget.style.background = action ? "rgba(245,158,11,0.02)" : "#fff"}
              >
                <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>
                <div style={{ flex: 3 }}>
                  <div className="row items-center g-2">
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: cfg.color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "0.85rem",
                    }}>{getInitial(inv)}</div>
                    <div>
                      <p className="bold fs-p9">{getName(inv)}</p>
                      <p className="fs-p8 text-secondary">{getEmail(inv)}</p>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 2 }}>
                  <p className="fs-p9 bold">{getDept(inv)}</p>
                  <p className="fs-p8 text-secondary">{getJobTitle(inv)}</p>
                </div>
                <div style={{ flex: 2 }}>
                  <p className="bold fs-p9">{formatDT(getDateTime(inv))}</p>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <span style={{
                    fontSize: "0.7rem", padding: "2px 8px", borderRadius: 8,
                    background: "rgba(14,165,233,0.1)", color: "#0ea5e9", fontWeight: 600,
                  }}>{inv.interviewMode || "—"}</span>
                </div>
                <div style={{ flex: 2, textAlign: "center" }}>
                  <Pill status={inv.status} />
                  {action && <p className="fs-p8 mt-1" style={{ color: "#f59e0b", fontWeight: 600 }}>Needs action</p>}
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <button onClick={() => setViewInv(inv)} style={{
                    padding: "6px 14px", fontSize: "0.78rem", borderRadius: 6,
                    background: action ? "#f59e0b" : "var(--primary)",
                    color: "#fff", border: "none", cursor: "pointer", fontWeight: 600,
                  }}>View</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewInv && !showReschedule && !showCancel && !showSelect && (
        <div className="modal-overlay" onClick={closeAll}>
          <div className="card p-5" style={{ width: 700, maxWidth: "96%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="row space-between items-center mb-4">
              <div className="row items-center g-3">
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                  background: INTERVIEW_STATUS[viewInv.status]?.color || "var(--primary)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem", fontWeight: 700,
                }}>{getInitial(viewInv)}</div>
                <div>
                  <h3 className="bold">{getName(viewInv)}</h3>
                  <p className="fs-p9 text-secondary">{getEmail(viewInv)} · {getDept(viewInv)}</p>
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={closeAll}>✕</span>
            </div>

            {/* Status banner */}
            <div style={{
              background: INTERVIEW_STATUS[viewInv.status]?.bg || "var(--gray-100)",
              borderLeft: `4px solid ${INTERVIEW_STATUS[viewInv.status]?.color || "#ccc"}`,
              borderRadius: 8, padding: "12px 16px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <p className="fs-p8 text-secondary mb-1">Interview Status</p>
                <Pill status={viewInv.status} />
              </div>
            </div>

            {/* Needs-action alert */}
            {needsAction(viewInv) && (
              <div style={{
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 10, padding: "14px 18px", marginBottom: 20,
              }}>
                <p className="bold fs-p9 mb-1" style={{ color: "#f59e0b" }}>
                  {viewInv.status === "Rejected_By_Student" ? "Student Requested Reschedule" : "Student Not Attending"}
                </p>
                {viewInv.reason && (
                  <div style={{ marginBottom: 12 }}>
                    <p className="fs-p8 text-secondary mb-1">Reason from student:</p>
                    <p className="fs-p9" style={{
                      background: "#fff", borderRadius: 8, padding: "10px 14px",
                      border: "1px solid rgba(245,158,11,0.25)", fontStyle: "italic",
                    }}>"{viewInv.reason}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <SectionTitle>Actions</SectionTitle>
            <div className="row g-2 mb-4" style={{ flexWrap: "wrap" }}>
              {canReschedule(viewInv.status) && (
                <button onClick={() => {
                  setRescheduleForm({
                    interviewDateTime: "", interviewMode: viewInv.interviewMode || "Online",
                    interviewInstructions: "", latitude: "", longitude: "",
                  });
                  setRescheduleMsg({ text: "", type: "" });
                  setShowReschedule(true);
                }} style={{
                  padding: "9px 18px", borderRadius: 8, fontSize: "0.85rem",
                  background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600,
                }}>Reschedule</button>
              )}
              {canMarkSelect(viewInv.status) && (
                <button onClick={() => { setSelectType("selected"); setSelectMsg({ text: "", type: "" }); setShowSelect(true); }}
                  style={{
                    padding: "9px 18px", borderRadius: 8, fontSize: "0.85rem",
                    background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600,
                  }}>Mark Selected</button>
              )}
              {canMarkSelect(viewInv.status) && (
                <button onClick={() => { setSelectType("not-selected"); setSelectMsg({ text: "", type: "" }); setShowSelect(true); }}
                  style={{
                    padding: "9px 18px", borderRadius: 8, fontSize: "0.85rem",
                    background: "#dc2626", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600,
                  }}>Not Selected</button>
              )}
              {canCancel(viewInv.status) && (
                <button onClick={() => { setCancelMsg({ text: "", type: "" }); setShowCancel(true); }}
                  style={{
                    padding: "9px 18px", borderRadius: 8, fontSize: "0.85rem",
                    background: "#6b7280", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600,
                  }}>Cancel</button>
              )}
              {viewInv.status === "Selected" && (
                <div style={{
                  padding: "9px 16px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
                  background: "rgba(22,163,74,0.08)", color: "#16a34a",
                  border: "1px solid rgba(22,163,74,0.25)",
                }}>
                  Student has been selected.
                </div>
              )}
            </div>

            {/* Interview details */}
            <SectionTitle>Interview Details</SectionTitle>
            <div className="row g-3 mb-4" style={{ flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 45%" }}><Field label="Date & Time" value={formatDT(getDateTime(viewInv))} /></div>
              <div style={{ flex: "1 1 45%" }}><Field label="Mode"        value={viewInv.interviewMode} /></div>
              {viewInv.latitude  && <div style={{ flex: "1 1 45%" }}><Field label="Latitude"  value={viewInv.latitude} /></div>}
              {viewInv.longitude && <div style={{ flex: "1 1 45%" }}><Field label="Longitude" value={viewInv.longitude} /></div>}
              {viewInv.reason    && <div style={{ flex: "1 1 95%" }}><Field label="Student Reason" value={viewInv.reason} /></div>}
            </div>

            {viewInv.interviewInstructions && (
              <div style={{
                background: "rgba(50,85,99,0.05)", borderRadius: 8, padding: "12px 14px",
                marginBottom: 20, border: "1px solid rgba(50,85,99,0.12)",
              }}>
                <p className="fs-p8 text-secondary mb-1">Instructions</p>
                <p className="fs-p9">{viewInv.interviewInstructions}</p>
              </div>
            )}

            {viewInv.latitude && viewInv.longitude && (
              <a href={`https://www.google.com/maps?q=${viewInv.latitude},${viewInv.longitude}`}
                target="_blank" rel="noreferrer" className="btn btn-muted w-auto"
                style={{ padding: "7px 16px", fontSize: "0.8rem", textDecoration: "none", display: "inline-block", marginBottom: 20 }}
              >View on Map</a>
            )}

            <SectionTitle>Student Details</SectionTitle>
            <div className="row g-3 mb-4" style={{ flexWrap: "wrap" }}>
              {[
                { label: "Name",           value: getName(viewInv)    },
                { label: "Email",          value: getEmail(viewInv)   },
                { label: "Phone",          value: getPhone(viewInv)   },
                { label: "Roll Number",    value: getRollNo(viewInv)  },
                { label: "Department",     value: getDept(viewInv)    },
                { label: "Year",           value: getYear(viewInv)    },
                { label: "Percentage",     value: getPercent(viewInv) },
                { label: "Working Status", value: getWorking(viewInv) },
              ].map((f) => (
                <div key={f.label} style={{ flex: "1 1 44%" }}><Field label={f.label} value={f.value} /></div>
              ))}
            </div>

            <SectionTitle>Resume</SectionTitle>
            <div onClick={() => openResume(getResumeModel(viewInv))} style={{
              background: "var(--gray-100)", borderRadius: 10, padding: "12px 16px", marginBottom: 20,
              border: "1px solid rgba(50,85,99,0.2)", display: "flex", alignItems: "center", gap: 14,
              cursor: "pointer", transition: "background 0.15s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(50,85,99,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--gray-100)"}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 8, background: "#325563",
                color: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0,
              }}>PDF</div>
              <div>
                <p className="bold fs-p9" style={{ color: "#325563" }}>{getResTitle(viewInv)} — Click to view</p>
                <p className="fs-p8 text-secondary">Uploaded: {getResumeModel(viewInv)?.date || "—"}</p>
              </div>
            </div>

            <SectionTitle>Application Info</SectionTitle>
            <div className="row g-3 mb-4" style={{ flexWrap: "wrap" }}>
              {[
                { label: "Applied On",      value: getApp(viewInv)?.appliedOn },
                { label: "Application ID",  value: `#${getApp(viewInv)?.jobApplicationId || "—"}` },
                { label: "Recommended By",  value: getTutor(viewInv) },
                { label: "App Status",      value: getApp(viewInv)?.status },
              ].map((f) => (
                <div key={f.label} style={{ flex: "1 1 44%" }}><Field label={f.label} value={f.value} /></div>
              ))}
            </div>

            {getJobPost(viewInv)?.jobPostId && (
              <>
                <SectionTitle>Job Post</SectionTitle>
                <div className="row g-3 mb-4" style={{ flexWrap: "wrap" }}>
                  {[
                    { label: "Title",    value: getJobPost(viewInv)?.tiitle             },
                    { label: "Deadline", value: getJobPost(viewInv)?.lastDateToApply    },
                    { label: "Openings", value: getJobPost(viewInv)?.requiredCandidate  },
                    { label: "Min %",    value: getJobPost(viewInv)?.eligiblePercentage },
                  ].map((f) => (
                    <div key={f.label} style={{ flex: "1 1 44%" }}><Field label={f.label} value={f.value} /></div>
                  ))}
                </div>
              </>
            )}

            <button className="btn btn-muted" onClick={closeAll}>Close</button>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {viewInv && showReschedule && (
        <div className="modal-overlay" onClick={() => setShowReschedule(false)}>
          <div className="card p-5" style={{ width: 500, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="row space-between items-center mb-1">
              <h3 className="bold">Reschedule Interview</h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setShowReschedule(false)}>✕</span>
            </div>
            <p className="fs-p9 text-secondary mb-4">for <strong>{getName(viewInv)}</strong> · {getDept(viewInv)}</p>

            {viewInv.reason && (
              <div style={{
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              }}>
                <p className="fs-p8 bold mb-1" style={{ color: "#f59e0b" }}>Student's reschedule reason:</p>
                <p className="fs-p9 text-secondary" style={{ fontStyle: "italic" }}>"{viewInv.reason}"</p>
              </div>
            )}

            <div className="form-group mb-3">
              <label className="form-control-label">Date & Time <span style={{ color: "var(--danger)" }}>*</span></label>
              <input type="datetime-local" className="form-control"
                value={rescheduleForm.interviewDateTime}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, interviewDateTime: e.target.value })} />
            </div>
            <div className="form-group mb-3">
              <label className="form-control-label">Mode <span style={{ color: "var(--danger)" }}>*</span></label>
              <select className="form-control" value={rescheduleForm.interviewMode}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, interviewMode: e.target.value })}>
                <option value="Online">Online</option>
                <option value="Offline">Offline / In-Person</option>
                <option value="Phone">Phone</option>
              </select>
            </div>

            {rescheduleForm.interviewMode === "Offline" && (
              <div className="row mb-3" style={{ gap: 12 }}>
                <div className="col-6 p-0">
                  <label className="form-control-label">Latitude</label>
                  <input type="text" className="form-control" placeholder="17.3850"
                    value={rescheduleForm.latitude}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, latitude: e.target.value })} />
                </div>
                <div className="col-6 p-0">
                  <label className="form-control-label">Longitude</label>
                  <input type="text" className="form-control" placeholder="78.4867"
                    value={rescheduleForm.longitude}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, longitude: e.target.value })} />
                </div>
              </div>
            )}

            <div className="form-group mb-4">
              <label className="form-control-label">Updated Instructions</label>
              <textarea className="form-control" rows={3}
                placeholder="Any updated instructions for the student..."
                value={rescheduleForm.interviewInstructions}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, interviewInstructions: e.target.value })}
                style={{ resize: "vertical" }} />
            </div>

            <FeedbackMsg msg={rescheduleMsg} />
            <div className="row g-2">
              <button onClick={handleReschedule} disabled={rescheduling} style={{
                flex: 1, padding: "10px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                background: rescheduling ? "var(--gray-400)" : "#7c3aed",
                color: "#fff", border: "none", cursor: rescheduling ? "not-allowed" : "pointer",
              }}>{rescheduling ? "Rescheduling..." : "Confirm Reschedule"}</button>
              <button className="btn btn-muted" style={{ flex: 1 }} onClick={() => setShowReschedule(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* MARK SELECTED MODAL */}
      {viewInv && showSelect && (
        <div className="modal-overlay" onClick={() => setShowSelect(false)}>
          <div className="card p-5 text-center" style={{ width: 440, maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="bold mb-2">{selectType === "selected" ? "Mark as Selected?" : "Mark as Not Selected?"}</h3>
            <p className="fs-p9 text-secondary mb-1">You are about to update the result for</p>
            <p className="bold mb-2">{getName(viewInv)}</p>
            <p className="fs-p9 text-secondary mb-4">
              {selectType === "selected"
                ? "The student will be notified of their selection."
                : "The student will be notified they were not selected."}
            </p>
            <FeedbackMsg msg={selectMsg} />
            <div className="row g-2">
              <button onClick={handleSelect} disabled={selecting} style={{
                flex: 1, padding: "10px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                background: selecting ? "var(--gray-400)" : selectType === "selected" ? "#16a34a" : "#dc2626",
                color: "#fff", border: "none", cursor: selecting ? "not-allowed" : "pointer",
              }}>
                {selecting ? "Submitting..." : selectType === "selected" ? "Confirm Selected" : "Confirm Not Selected"}
              </button>
              <button className="btn btn-muted" style={{ flex: 1 }} onClick={() => setShowSelect(false)}>Go Back</button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {viewInv && showCancel && (
        <div className="modal-overlay" onClick={() => setShowCancel(false)}>
          <div className="card p-5 text-center" style={{ width: 420, maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="bold mb-2">Cancel Application?</h3>
            <p className="fs-p9 text-secondary mb-1">You are about to cancel the application of</p>
            <p className="bold mb-2">{getName(viewInv)}</p>
            <p className="fs-p9 text-secondary mb-4">This action cannot be undone.</p>
            <FeedbackMsg msg={cancelMsg} />
            <div className="row g-2">
              <button onClick={handleCancel} disabled={cancelling} style={{
                flex: 1, padding: "10px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                background: cancelling ? "var(--gray-400)" : "#dc2626",
                color: "#fff", border: "none", cursor: cancelling ? "not-allowed" : "pointer",
              }}>{cancelling ? "Cancelling..." : "Yes, Cancel"}</button>
              <button className="btn btn-muted" style={{ flex: 1 }} onClick={() => setShowCancel(false)}>Go Back</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CompanyInterviews;