import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const STATUS_CONFIG = {
  APPLIED:             { label: "Applied",             color: "#325563", bg: "rgba(50,85,99,0.1)",   border: "rgba(50,85,99,0.3)",   icon: "📨" },
  CANCELLED:           { label: "Cancelled",           color: "#dc2626", bg: "rgba(220,38,38,0.1)",  border: "rgba(220,38,38,0.3)",  icon: "❌" },
  REJECTED:            { label: "Rejected",            color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: "🚫" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "#0ea5e9", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.3)", icon: "📅" },
  SELECTED:            { label: "Selected 🎉",         color: "#16a34a", bg: "rgba(22,163,74,0.1)",  border: "rgba(22,163,74,0.3)",  icon: "🎉" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status || "—", color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "var(--gray-300)", icon: "•",
  };
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function CompanyApplications() {

  const [jobs,            setJobs]            = useState([]);
  const [applications,    setApplications]    = useState([]);
  const [selectedJob,     setSelectedJob]     = useState(null);
  const [search,          setSearch]          = useState("");
  const [filterStatus,    setFilterStatus]    = useState("ALL");
  const [viewApp,         setViewApp]         = useState(null);
  const [loadingJobs,     setLoadingJobs]     = useState(true);
  const [loadingApps,     setLoadingApps]     = useState(true);

  // ── Interview modal state ──────────────────────────────
  const [showInterview,   setShowInterview]   = useState(false);
  const [interviewForm,   setInterviewForm]   = useState({
    interviewInstructions: "",
    interviewMode:         "",
    interviewDateTime:     "",
    latitude:              "",
    longitude:             "",
  });
  const [scheduling,      setScheduling]      = useState(false);
  const [scheduleError,   setScheduleError]   = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  // ── Auth header ────────────────────────────────────────
  const header = {
    headers: {
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── 1. Fetch company job posts ─────────────────────────
  useEffect(() => {
    axios.get(rest.jobPost, header)
      .then((res) => {
        console.log("✅ JOBS:", res.data);
        setJobs(res.data?.data || []);
      })
      .catch((err) => console.error("❌ JOB ERROR:", err))
      .finally(() => setLoadingJobs(false));
  }, []);

  // ── 2. Fetch ALL applications once ────────────────────
  useEffect(() => {
    axios.get(rest.jobApplications, header)
      .then((res) => {
        console.log("🔥 RAW APPLICATIONS:", res.data);
        const data = res.data?.data || [];
        const normalized = data.map((app) => ({
          ...app,
          jobPostModel: app.jobSuggestionModel?.jobPostModel || null,
          studentModel: app.resumeModel?.studentModel || app.jobSuggestionModel?.studentModel || null,
        }));
        setApplications(normalized);
      })
      .catch((err) => console.error("❌ APP ERROR:", err))
      .finally(() => setLoadingApps(false));
  }, []);

  // ── 3. Select job ──────────────────────────────────────
  const selectJob = (job) => {
    setSelectedJob(job);
    setSearch("");
    setFilterStatus("ALL");
  };

  // ── 4. Schedule interview ──────────────────────────────
  const scheduleInterview = async () => {
    if (!interviewForm.interviewMode || !interviewForm.interviewDateTime) {
      setScheduleError("⚠️ Interview mode and date/time are required.");
      return;
    }
    setScheduling(true);
    setScheduleError("");
    try {
      const payload = {
        interviewInstructions: interviewForm.interviewInstructions,
        interviewMode:         interviewForm.interviewMode,
        interviewDateTime:     new Date(interviewForm.interviewDateTime).toISOString(),
        latitude:              interviewForm.latitude  || null,
        longitude:             interviewForm.longitude || null,
        status:                "Scheduled",
        jobApplicationId:      viewApp.jobApplicationId,
      };
      console.log("📅 Scheduling interview payload:", payload);
      await axios.post(
        `${rest.jobApplications.replace("/job-applications", "")}/job-application/${viewApp.jobApplicationId}/interview`,
        payload,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${Cookies.get("token")}` } }
      );
      setScheduleSuccess(true);
      setApplications((prev) =>
        prev.map((a) =>
          a.jobApplicationId === viewApp.jobApplicationId
            ? { ...a, status: "INTERVIEW_SCHEDULED" }
            : a
        )
      );
    } catch (err) {
      console.error("scheduleInterview error:", err.response?.data);
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to schedule interview.";
      setScheduleError(msg);
    } finally {
      setScheduling(false);
    }
  };

  const openInterviewModal = () => {
    setInterviewForm({ interviewInstructions: "", interviewMode: "", interviewDateTime: "", latitude: "", longitude: "" });
    setScheduleError("");
    setScheduleSuccess(false);
    setShowInterview(true);
  };

  const closeInterviewModal = () => {
    setShowInterview(false);
    setScheduleError("");
    setScheduleSuccess(false);
  };

  // ── Helper: open resume from base64 ──────────────────
  const openResume = (app) => {
    const r = app?.resumeModel;
    if (!r) return;
    // resume2 contains the base64 PDF data
    const base64 = r.resume2;
    if (!base64) {
      alert("No resume available for this applicant.");
      return;
    }
    // Fix prefix — backend may send image/jpeg mime but it's actually a PDF
    const pdfBase64 = base64.startsWith("data:")
      ? base64.replace(/^data:[^;]+;base64,/, "data:application/pdf;base64,")
      : `data:application/pdf;base64,${base64}`;
    // Open in new tab
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${pdfBase64}" style="width:100%;height:100vh;border:none;"></iframe>`
      );
      win.document.title = r.resumeTitle || "Resume";
    }
  };

  // ── Filter apps ────────────────────────────────────────
  const filteredApps = applications.filter((app) => {
    const belongsToJob = app.jobPostModel?.jobPostId === selectedJob?.jobPostId;
    if (!belongsToJob) return false;
    const s      = app.studentModel || {};
    const q      = search.toLowerCase();
    const matchQ = !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.departmentModel?.departmentName?.toLowerCase().includes(q);
    const matchS = filterStatus === "ALL" || app.status === filterStatus;
    return matchQ && matchS;
  });

  const jobApps = applications.filter((app) => app.jobPostModel?.jobPostId === selectedJob?.jobPostId);

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, key) => {
    acc[key] = jobApps.filter((a) => a.status === key).length;
    return acc;
  }, {});

  // ── Helpers ────────────────────────────────────────────
  const getStudent  = (app) => app.studentModel || {};
  const getName     = (app) => getStudent(app)?.name       || "—";
  const getEmail    = (app) => getStudent(app)?.email      || "—";
  const getPhone    = (app) => getStudent(app)?.phone      || "—";
  const getRollNo   = (app) => getStudent(app)?.rollNumber || "—";
  const getPercent  = (app) => getStudent(app)?.percentage || "—";
  const getYear     = (app) => getStudent(app)?.year       || "—";
  const getDept     = (app) => getStudent(app)?.departmentModel?.departmentName || "—";
  const getWorking  = (app) => getStudent(app)?.workingStatus || "—";
  const getResume   = (app) => app?.resumeModel?.resumeTitle || (app?.resumeId ? `Resume #${app.resumeId}` : "—");
  const getTutor    = (app) => app?.jobSuggestionModel?.tutorModel?.tutorName || "—";

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Header */}
      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">📄 Job Applications</h2>
        <p className="fs-p9 text-secondary">View students who applied to your jobs</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total",     value: jobApps.length,                                          color: "var(--primary)", icon: "📄" },
          { label: "Applied",   value: statusCounts.APPLIED || 0,                               color: "#325563",        icon: "📨" },
          { label: "Interview", value: statusCounts.INTERVIEW_SCHEDULED || 0,                   color: "#0ea5e9",        icon: "📅" },
          { label: "Selected",  value: statusCounts.SELECTED || 0,                              color: "var(--success)", icon: "🎉" },
          { label: "Rejected",  value: (statusCounts.REJECTED||0)+(statusCounts.CANCELLED||0), color: "var(--danger)",  icon: "🚫" },
        ].map((s, i) => (
          <div className="col p-2" key={i}>
            <div className="card p-3 row items-center g-3">
              <div className="fs-4">{s.icon}</div>
              <div>
                <p className="fs-p8 text-secondary">{s.label}</p>
                <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Job Post Selector */}
      <div className="card p-4 mb-4">
        <h4 className="bold mb-3">📋 Your Job Posts</h4>
        {loadingJobs ? (
          <p className="text-secondary fs-p9">Loading job posts...</p>
        ) : jobs.length === 0 ? (
          <p className="text-secondary fs-p9">No job posts found.</p>
        ) : (
          <div className="row g-2" style={{ flexWrap: "wrap" }}>
            {jobs.map((job) => {
              const isActive = selectedJob?.jobPostId === job.jobPostId;
              return (
                <div
                  key={job.jobPostId}
                  onClick={() => selectJob(job)}
                  style={{
                    minWidth: 180, flex: "0 0 auto",
                    border:       `2px solid ${isActive ? "var(--primary)" : "var(--border-color)"}`,
                    borderRadius: 10, padding: "10px 16px",
                    background:   isActive ? "var(--primary)" : "#fff",
                    color:        isActive ? "#fff" : "inherit",
                    cursor:       "pointer", transition: "all 0.15s",
                  }}
                >
                  <p className="bold fs-p9">{job.tiitle || job.title || "Untitled"}</p>
                  <p className="fs-p8 mt-1" style={{ opacity: 0.75 }}>Deadline: {job.lastDateToApply || "—"}</p>
                  <span style={{
                    fontSize: "0.65rem", padding: "2px 8px", borderRadius: 10,
                    marginTop: 6, display: "inline-block",
                    background: isActive ? "rgba(255,255,255,0.2)" : "rgba(22,163,74,0.1)",
                    color:      isActive ? "#fff" : "#16a34a",
                  }}>
                    ● {job.status || "Active"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Applications Panel */}
      {!selectedJob ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>📋</p>
          <p className="bold mt-2">Select a job post above</p>
          <p className="text-secondary fs-p9">to view its applications</p>
        </div>

      ) : loadingApps ? (
        <div className="card p-5 text-center">
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>⏳</div>
          <p className="text-secondary">Loading applications...</p>
        </div>

      ) : (
        <>
          {/* Search + Filter */}
          <div className="row space-between items-center mb-3">
            <h4 className="bold">
              📑 <span style={{ color: "var(--primary)" }}>{selectedJob.tiitle || selectedJob.title}</span>
              <span className="fs-p9 text-secondary" style={{ fontWeight: 400 }}>
                {" "}— {jobApps.length} applicant{jobApps.length !== 1 ? "s" : ""}
              </span>
            </h4>
            <div className="row g-2">
              <input
                type="text"
                className="form-control"
                style={{ width: 220 }}
                placeholder="🔍 Search name, email, dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="form-control"
                style={{ width: 180 }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card p-0" style={{ overflow: "hidden" }}>
            {filteredApps.length === 0 ? (
              <div className="p-5 text-center">
                <p style={{ fontSize: "2.5rem" }}>🔍</p>
                <p className="bold mt-2">
                  {jobApps.length === 0 ? "No applications yet" : "No results match your filters"}
                </p>
                <p className="text-secondary fs-p9">
                  {jobApps.length === 0
                    ? "Students haven't applied to this job post yet."
                    : "Try adjusting the search or status filter."}
                </p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="row items-center" style={{
                  background: "var(--gray-100)", padding: "10px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
                }}>
                  <div style={{ width: 36 }}>#</div>
                  <div className="col-3">Candidate</div>
                  <div className="col-2">Department</div>
                  <div className="col-1 text-center">CGPA %</div>
                  <div className="col-2">Resume</div>
                  <div className="col-1 text-center">Applied On</div>
                  <div className="col-2 text-center">Status</div>
                  <div className="col-1 text-center">Action</div>
                </div>

                {/* Rows */}
                {filteredApps.map((app, idx) => (
                  <div
                    key={app.jobApplicationId || idx}
                    className="row items-center"
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border-color)",
                      background: "#fff", transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(50,85,99,0.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                  >
                    <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>

                    {/* Candidate */}
                    <div className="col-3">
                      <div className="row items-center g-2">
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                          background: "var(--primary)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "0.85rem",
                        }}>
                          {getName(app).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="bold fs-p9">{getName(app)}</p>
                          <p className="fs-p8 text-secondary">{getEmail(app)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Department */}
                    <div className="col-2">
                      <span style={{
                        fontSize: "0.72rem", padding: "2px 10px", borderRadius: 10,
                        background: "rgba(50,85,99,0.08)", color: "var(--primary)",
                      }}>
                        {getDept(app)}
                      </span>
                    </div>

                    {/* CGPA */}
                    <div className="col-1 text-center bold fs-p9" style={{
                      color: parseFloat(getPercent(app)) >= 70 ? "var(--success)"
                           : parseFloat(getPercent(app)) >= 50 ? "#f59e0b"
                           : "var(--danger)",
                    }}>
                      {getPercent(app)}
                    </div>

                    {/* Resume — click to open PDF */}
                    <div className="col-2">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          onClick={() => openResume(app)}
                          title="Click to view resume"
                          style={{
                            width: 26, height: 26, borderRadius: 5, flexShrink: 0,
                            background: "#325563", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.55rem", fontWeight: 700,
                            cursor: "pointer", transition: "opacity 0.15s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.75"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                          PDF
                        </div>
                        <p
                          className="fs-p9"
                          style={{
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            color: "#325563", cursor: "pointer", textDecoration: "underline",
                          }}
                          onClick={() => openResume(app)}
                        >
                          {getResume(app)}
                        </p>
                      </div>
                    </div>

                    {/* Applied On */}
                    <div className="col-1 text-center fs-p8 text-secondary">
                      {app.appliedOn || "—"}
                    </div>

                    {/* Status */}
                    <div className="col-2 text-center">
                      <StatusBadge status={app.status} />
                    </div>

                    {/* View Button */}
                    <div className="col-1 text-center">
                      <button
                        onClick={() => setViewApp(app)}
                        style={{
                          padding: "5px 14px", fontSize: "0.78rem", borderRadius: 6,
                          background: "var(--primary)", color: "#fff",
                          border: "none", cursor: "pointer", fontWeight: 600,
                        }}
                      >
                        👁 View
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════
          STUDENT DETAIL MODAL
      ════════════════════════════════════════════════════ */}
      {viewApp && !showInterview && (
        <div className="modal-overlay" onClick={() => setViewApp(null)}>
          <div
            className="card p-5"
            style={{ width: 580, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="row space-between items-center mb-4">
              <div className="row items-center g-3">
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "var(--primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.3rem", fontWeight: 700, flexShrink: 0,
                }}>
                  {getName(viewApp).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="bold">{getName(viewApp)}</h3>
                  <p className="fs-p9 text-secondary">{getEmail(viewApp)}</p>
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setViewApp(null)}>✕</span>
            </div>

            {/* Status Banner */}
            <div className="mb-4 text-center" style={{
              background: STATUS_CONFIG[viewApp.status]?.bg || "var(--gray-100)",
              border: `1px solid ${STATUS_CONFIG[viewApp.status]?.border || "#ccc"}`,
              borderRadius: 8, padding: "10px",
            }}>
              <StatusBadge status={viewApp.status} />
            </div>

            {/* Student Details */}
            <p className="fs-p8 bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)" }}>
              🎓 Student Details
            </p>
            <div className="row g-3 mb-4">
              {[
                { label: "Full Name",      value: getName(viewApp)    },
                { label: "Email",          value: getEmail(viewApp)   },
                { label: "Phone",          value: getPhone(viewApp)   },
                { label: "Roll Number",    value: getRollNo(viewApp)  },
                { label: "Department",     value: getDept(viewApp)    },
                { label: "Year",           value: getYear(viewApp)    },
                { label: "Percentage",     value: getPercent(viewApp) },
                { label: "Working Status", value: getWorking(viewApp) },
              ].map((f) => (
                <div className="col-6" key={f.label}>
                  <div className="card p-2" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                    <p className="fs-p8 text-secondary">{f.label}</p>
                    <p className="bold fs-p9 mt-1">{f.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Resume — clickable card to download */}
            <p className="fs-p8 bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)" }}>
              📄 Resume
            </p>
            <div
              className="card p-3 mb-4"
              onClick={() => openResume(viewApp)}
              title="Click to view resume"
              style={{
                background: "var(--gray-100)", boxShadow: "none",
                cursor: "pointer", transition: "background 0.15s",
                border: "1px solid rgba(50,85,99,0.3)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(50,85,99,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--gray-100)"}
            >
              <div className="row items-center g-3">
                <div style={{
                  width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                  background: "#325563", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 700,
                }}>
                  PDF
                </div>
                <div>
                  <p className="bold fs-p9" style={{ color: "#325563" }}>
                    {viewApp.resumeModel?.resumeTitle || `Resume #${viewApp.resumeId}`} 👁️
                  </p>
                  <p className="fs-p8 text-secondary">
                    Click to view resume · Uploaded: {viewApp.resumeModel?.date || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Application Info */}
            <p className="fs-p8 bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)" }}>
              📋 Application Info
            </p>
            <div className="row g-3 mb-4">
              {[
                { label: "Applied On",      value: viewApp.appliedOn },
                { label: "Recommended By",  value: getTutor(viewApp) },
                { label: "Application ID",  value: `#${viewApp.jobApplicationId}` },
                { label: "Suggestion Date", value: viewApp.jobSuggestionModel?.date || "—" },
              ].map((f) => (
                <div className="col-6" key={f.label}>
                  <div className="card p-2" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                    <p className="fs-p8 text-secondary">{f.label}</p>
                    <p className="bold fs-p9 mt-1">{f.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="row g-2">
              <button
                onClick={openInterviewModal}
                style={{
                  flex: 1, padding: "10px", fontSize: "0.88rem", borderRadius: 8,
                  background: "#0ea5e9", color: "#fff",
                  border: "none", cursor: "pointer", fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                📅 Schedule Interview
              </button>
              <button
                className="btn btn-muted"
                style={{ flex: 1 }}
                onClick={() => setViewApp(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          SCHEDULE INTERVIEW MODAL
      ════════════════════════════════════════════════════ */}
      {viewApp && showInterview && (
        <div className="modal-overlay" onClick={closeInterviewModal}>
          <div
            className="card p-5"
            style={{ width: 520, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="row space-between items-center mb-4">
              <div>
                <h3 className="bold">📅 Schedule Interview</h3>
                <p className="fs-p9 text-secondary mt-1">
                  For <strong>{getName(viewApp)}</strong>
                </p>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={closeInterviewModal}>✕</span>
            </div>

            {/* Success State */}
            {scheduleSuccess ? (
              <div className="text-center" style={{ padding: "20px 0" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🎉</div>
                <h4 className="bold mb-2" style={{ color: "var(--success)" }}>Interview Scheduled!</h4>
                <p className="fs-p9 text-secondary mb-4">
                  Interview has been scheduled for <strong>{getName(viewApp)}</strong>.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => { closeInterviewModal(); setViewApp(null); }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Error */}
                {scheduleError && (
                  <div className="alert-danger mb-3">
                    <p className="fs-p9">{scheduleError}</p>
                  </div>
                )}

                {/* Student Summary */}
                <div style={{
                  background: "rgba(50,85,99,0.05)", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 20,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "var(--primary)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "1rem", flexShrink: 0,
                  }}>
                    {getName(viewApp).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="bold fs-p9">{getName(viewApp)}</p>
                    <p className="fs-p8 text-secondary">{getEmail(viewApp)} · {getDept(viewApp)}</p>
                  </div>
                </div>

                {/* Interview Mode */}
                <div className="form-group mb-3">
                  <label className="form-control-label">
                    🎯 Interview Mode <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={interviewForm.interviewMode}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewMode: e.target.value })}
                  >
                    <option value="">Select mode...</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline / In-Person</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>

                {/* Date & Time */}
                <div className="form-group mb-3">
                  <label className="form-control-label">
                    📅 Interview Date & Time <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={interviewForm.interviewDateTime}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewDateTime: e.target.value })}
                  />
                </div>

                {/* Instructions */}
                <div className="form-group mb-3">
                  <label className="form-control-label">📝 Instructions / Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Join via Google Meet. Bring your resume..."
                    value={interviewForm.interviewInstructions}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewInstructions: e.target.value })}
                    style={{ resize: "vertical" }}
                  />
                </div>

                {/* Location — only for Offline */}
                {interviewForm.interviewMode === "Offline" && (
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-control-label">📍 Latitude</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 17.3850"
                        value={interviewForm.latitude}
                        onChange={(e) => setInterviewForm({ ...interviewForm, latitude: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-control-label">📍 Longitude</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 78.4867"
                        value={interviewForm.longitude}
                        onChange={(e) => setInterviewForm({ ...interviewForm, longitude: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="row g-2 mt-4">
                  <button
                    onClick={scheduleInterview}
                    disabled={scheduling}
                    style={{
                      flex: 1, padding: "10px", fontSize: "0.88rem", borderRadius: 8,
                      background: scheduling ? "var(--gray-400)" : "#0ea5e9",
                      color: "#fff", border: "none",
                      cursor: scheduling ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {scheduling ? "⏳ Scheduling..." : "📅 Confirm Schedule"}
                  </button>
                  <button
                    className="btn btn-muted"
                    style={{ flex: 1 }}
                    onClick={closeInterviewModal}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default CompanyApplications;