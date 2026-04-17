import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const APP_STATUS = {
  APPLIED:             { label: "Applied",             bg: "rgba(50,85,99,0.1)",   color: "#325563", icon: "📨" },
  CANCELLED:           { label: "Cancelled",           bg: "rgba(220,38,38,0.1)",  color: "#dc2626", icon: "❌" },
  REJECTED:            { label: "Rejected",            bg: "rgba(220,38,38,0.1)",  color: "#dc2626", icon: "🚫" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", bg: "rgba(14,165,233,0.1)", color: "#0ea5e9", icon: "📅" },
  SELECTED:            { label: "Selected",            bg: "rgba(22,163,74,0.1)",  color: "#16a34a", icon: "🎉" },
};

function StatusPill({ status }) {
  const cfg = APP_STATUS[status] || { label: status || "—", bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: "•" };
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
      background: cfg.bg, color: cfg.color, display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function CompanyApplications() {
  const [jobs,         setJobs]         = useState([]);
  const [selectedJob,  setSelectedJob]  = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingApps,  setLoadingApps]  = useState(false);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [viewApp,      setViewApp]      = useState(null);

  const header = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || localStorage.getItem("token") || ""}`,
    },
  });

  // ── Fetch all job posts ────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res  = await axios.get(rest.jobPost, header());
        const list = res.data?.data || res.data || [];
        setJobs(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("fetchJobs:", err);
        setError("Failed to load job posts.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── GET /api/job/job-post/{jobPostId}/job-applications ─
  const loadApplications = async (job) => {
    const jobPostId = job.jobPostId || job.id;
    setSelectedJob(job);
    setApplications([]);
    setSearch("");
    setFilterStatus("ALL");
    setError("");
    setLoadingApps(true);
    try {
      const res  = await axios.get(
        `${rest.jobPost}/${jobPostId}/job-applications`,
        header()
      );
      const list = res.data?.data || res.data || [];
      setApplications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("loadApplications:", err);
      setError("Failed to load applications for this job.");
    } finally {
      setLoadingApps(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────
  const getName  = (app) =>
    app?.resumeModel?.studentModel?.name ||
    app?.jobSuggestionModel?.studentModel?.name ||
    "Student";

  const getEmail = (app) =>
    app?.resumeModel?.studentModel?.email ||
    app?.jobSuggestionModel?.studentModel?.email ||
    "—";

  const getDept  = (app) =>
    app?.resumeModel?.studentModel?.departmentModel?.departmentName ||
    app?.jobSuggestionModel?.studentModel?.departmentModel?.departmentName ||
    "—";

  const getPhone = (app) =>
    app?.resumeModel?.studentModel?.phone ||
    app?.jobSuggestionModel?.studentModel?.phone ||
    "—";

  const getPercent = (app) =>
    app?.resumeModel?.studentModel?.percentage ||
    app?.jobSuggestionModel?.studentModel?.percentage ||
    "—";

  const getRollNo  = (app) =>
    app?.resumeModel?.studentModel?.rollNumber ||
    app?.jobSuggestionModel?.studentModel?.rollNumber ||
    "—";

  const getResume  = (app) => app?.resumeModel?.resumeTitle || `Resume #${app?.resumeId}` || "—";

  // ── Filter ─────────────────────────────────────────────
  const filtered = applications.filter((app) => {
    const q = search.toLowerCase();
    const matchesQ =
      !q ||
      getName(app).toLowerCase().includes(q)  ||
      getEmail(app).toLowerCase().includes(q) ||
      getDept(app).toLowerCase().includes(q);
    const matchesSt = filterStatus === "ALL" || app.status === filterStatus;
    return matchesQ && matchesSt;
  });

  // Stats
  const statCounts = Object.keys(APP_STATUS).reduce((acc, k) => {
    acc[k] = applications.filter((a) => a.status === k).length;
    return acc;
  }, {});

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* ── Header ── */}
      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">📄 Applications</h2>
        <p className="fs-p9 text-secondary">
          Select a job post to review and manage its applicants
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="row mb-4">
        {[
          { label: "Total",     value: applications.length,              color: "var(--primary)", icon: "📄" },
          { label: "Applied",   value: statCounts.APPLIED || 0,          color: "#325563",        icon: "📨" },
          { label: "Interview", value: statCounts.INTERVIEW_SCHEDULED||0, color: "#0ea5e9",       icon: "📅" },
          { label: "Selected",  value: statCounts.SELECTED || 0,         color: "var(--success)", icon: "🎉" },
          { label: "Rejected",  value: (statCounts.REJECTED || 0) + (statCounts.CANCELLED || 0), color: "var(--danger)", icon: "🚫" },
        ].map((s, i) => (
          <div className="col p-2" key={i}>
            <div className="card p-3 text-center">
              <p style={{ fontSize: "1.4rem" }}>{s.icon}</p>
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p8 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Job Post Selector ── */}
      <div className="card p-4 mb-4">
        <h4 className="bold mb-3">📋 Select Job Post</h4>
        {loading ? (
          <p className="text-secondary fs-p9">Loading job posts...</p>
        ) : jobs.length === 0 ? (
          <p className="text-secondary fs-p9">No job posts found. Create one first.</p>
        ) : (
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            {jobs.map((job) => {
              const jid      = job.jobPostId || job.id;
              const isActive = selectedJob && (selectedJob.jobPostId || selectedJob.id) === jid;
              const jobStatus = (job.status || "").toUpperCase();
              return (
                <div
                  key={jid}
                  onClick={() => loadApplications(job)}
                  className="cursor-pointer"
                  style={{
                    border:       `2px solid ${isActive ? "var(--primary)" : "var(--border-color)"}`,
                    borderRadius: 10, padding: "10px 16px",
                    background:   isActive ? "var(--primary)" : "var(--card-bg)",
                    color:        isActive ? "#fff" : "inherit",
                    minWidth: 180, flex: "0 0 auto", transition: "all 0.15s",
                  }}
                >
                  <p className="bold fs-p9">{job.tiitle || job.title || "Untitled"}</p>
                  <p className={`fs-p8 ${isActive ? "" : "text-secondary"}`}>
                    Deadline: {job.lastDateToApply || "—"}
                  </p>
                  <span style={{
                    fontSize: "0.65rem", padding: "2px 8px", borderRadius: 10, marginTop: 4,
                    display: "inline-block",
                    background: jobStatus === "ACTIVE"
                      ? (isActive ? "rgba(255,255,255,0.25)" : "rgba(22,163,74,0.1)")
                      : "rgba(107,114,128,0.1)",
                    color: jobStatus === "ACTIVE"
                      ? (isActive ? "#fff" : "#16a34a")
                      : "#6b7280",
                  }}>
                    {jobStatus === "ACTIVE" ? "● Active" : "● Inactive"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Applications Panel ── */}
      {!selectedJob ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>📄</p>
          <p className="bold mt-2">Select a job post above</p>
          <p className="text-secondary fs-p9">to view its applications</p>
        </div>
      ) : loadingApps ? (
        <div className="card p-5 text-center">
          <p className="text-secondary">Loading applications...</p>
        </div>
      ) : error ? (
        <div className="card p-4">
          <p style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Search + Filter row */}
          <div className="row space-between items-center mb-3">
            <h4 className="bold">
              📑{" "}
              <span style={{ color: "var(--primary)" }}>
                {selectedJob.tiitle || selectedJob.title}
              </span>
              <span className="fs-p9 text-secondary" style={{ fontWeight: 400 }}>
                {" "}— {applications.length} applicant{applications.length !== 1 ? "s" : ""}
              </span>
            </h4>
            <div className="row" style={{ gap: 10 }}>
              <input
                type="text"
                className="form-control"
                style={{ width: 220 }}
                placeholder="🔍 Search name, email, dept…"
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
                {Object.entries(APP_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card p-0" style={{ overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div className="p-5 text-center">
                <p style={{ fontSize: "2.5rem" }}>🔍</p>
                <p className="bold mt-2">
                  {applications.length === 0 ? "No applications yet" : "No results match your filters"}
                </p>
                <p className="text-secondary fs-p9">
                  {applications.length === 0
                    ? "Students haven't applied to this job post yet."
                    : "Try adjusting the search or status filter."}
                </p>
              </div>
            ) : (
              <table className="w-100">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Candidate</th>
                    <th>Department</th>
                    <th>CGPA / %</th>
                    <th>Applied On</th>
                    <th>Resume</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app, idx) => (
                    <tr key={app.jobApplicationId || idx} className="hover-bg">
                      <td className="fs-p9 text-secondary">{idx + 1}</td>

                      <td>
                        <div className="bold fs-p9">{getName(app)}</div>
                        <div className="fs-p8 text-secondary">{getEmail(app)}</div>
                      </td>

                      <td>
                        <span style={{
                          fontSize: "0.72rem", padding: "3px 10px", borderRadius: 10,
                          background: "rgba(50,85,99,0.08)", color: "var(--primary)",
                        }}>
                          {getDept(app)}
                        </span>
                      </td>

                      <td className="bold fs-p9" style={{
                        color: parseFloat(getPercent(app)) >= 70
                          ? "var(--success)"
                          : parseFloat(getPercent(app)) >= 50
                          ? "#f59e0b"
                          : "var(--danger)",
                      }}>
                        {getPercent(app)}
                      </td>

                      <td className="fs-p9 text-secondary">{app.appliedOn || "—"}</td>

                      <td className="fs-p9">{getResume(app)}</td>

                      <td>
                        <StatusPill status={app.status} />
                      </td>

                      <td>
                        <button
                          className="btn btn-muted w-auto"
                          style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                          onClick={() => setViewApp(app)}
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ════ Detail Modal ════ */}
      {viewApp && (
        <div className="modal-overlay" onClick={() => setViewApp(null)}>
          <div
            className="card p-5"
            style={{ width: 520, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="row space-between items-center mb-4">
              <div className="row items-center g-3">
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", background: "var(--primary)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.2rem", fontWeight: 700, flexShrink: 0,
                }}>
                  {getName(viewApp).charAt(0)}
                </div>
                <div>
                  <h3 className="bold">{getName(viewApp)}</h3>
                  <p className="fs-p9 text-secondary">{getEmail(viewApp)}</p>
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setViewApp(null)}>✕</span>
            </div>

            {/* Status banner */}
            <div className="mb-4 p-2 text-center" style={{
              background: APP_STATUS[viewApp.status]?.bg || "var(--gray-100)",
              border: `1px solid ${APP_STATUS[viewApp.status]?.color || "#ccc"}33`,
              borderRadius: 8,
            }}>
              <StatusPill status={viewApp.status} />
            </div>

            {/* Info Grid */}
            <div className="row g-3 mb-4">
              {[
                { label: "Department",  value: getDept(viewApp)    },
                { label: "Phone",       value: getPhone(viewApp)   },
                { label: "Percentage",  value: getPercent(viewApp) },
                { label: "Roll No",     value: getRollNo(viewApp)  },
                { label: "Applied On",  value: viewApp.appliedOn   },
                { label: "Resume",      value: getResume(viewApp)  },
              ].filter((f) => f.value && f.value !== "—").map((f) => (
                <div className="col-6" key={f.label}>
                  <div className="card p-2" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                    <p className="fs-p8 text-secondary">{f.label}</p>
                    <p className="bold fs-p9 mt-1">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestion info */}
            {viewApp.jobSuggestionModel && (
              <div style={{
                background: "rgba(50,85,99,0.05)", borderRadius: 8, padding: "12px 16px", marginBottom: 16,
                border: "1px solid rgba(50,85,99,0.15)",
              }}>
                <p className="fs-p8 text-secondary mb-1">📋 Job Suggestion</p>
                <p className="fs-p9">
                  Suggested on: <strong>{viewApp.jobSuggestionModel.date || "—"}</strong>
                </p>
                {viewApp.jobSuggestionModel.tutorModel && (
                  <p className="fs-p9 mt-1">
                    By Tutor:{" "}
                    <strong>{viewApp.jobSuggestionModel.tutorModel.tutorName}</strong>
                  </p>
                )}
              </div>
            )}

            <button className="btn btn-muted" onClick={() => setViewApp(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyApplications;