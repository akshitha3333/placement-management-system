import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

// ── Status badge config matching InterviewModel ────────
const INTERVIEW_STATUS = {
  Scheduled:          { label: "Scheduled",           bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9"  },
  Accepted:           { label: "Accepted",            bg: "rgba(22,163,74,0.1)",   color: "#16a34a"  },
  Rejected_By_Student:{ label: "Declined by Student", bg: "rgba(245,158,11,0.1)",  color: "#f59e0b"  },
  Selected:           { label: "Selected ✅",         bg: "rgba(22,163,74,0.1)",   color: "#16a34a"  },
  Rejected:           { label: "Rejected",            bg: "rgba(220,38,38,0.1)",   color: "#dc2626"  },
};

const APPLICATION_STATUS = {
  APPLIED:             { label: "Applied",             bg: "rgba(50,85,99,0.1)",   color: "#325563"  },
  CANCELLED:           { label: "Cancelled",           bg: "rgba(220,38,38,0.1)",  color: "#dc2626"  },
  REJECTED:            { label: "Rejected",            bg: "rgba(220,38,38,0.1)",  color: "#dc2626"  },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", bg: "rgba(14,165,233,0.1)", color: "#0ea5e9"  },
  SELECTED:            { label: "Selected",            bg: "rgba(22,163,74,0.1)",  color: "#16a34a"  },
};

function StatusPill({ status, map }) {
  const cfg = map[status] || { label: status || "—", bg: "rgba(107,114,128,0.1)", color: "#6b7280" };
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
      background: cfg.bg, color: cfg.color, display: "inline-block",
    }}>
      {cfg.label}
    </span>
  );
}

function CompanyInterviews() {
  const [jobs,         setJobs]         = useState([]);
  const [selectedJob,  setSelectedJob]  = useState(null);
  const [applications, setApplications] = useState([]);   // raw apps for selected job
  const [interviews,   setInterviews]   = useState([]);   // { ...interviewModel, _app }
  const [loading,      setLoading]      = useState(true);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [error,        setError]        = useState("");

  // ── Schedule modal state ───────────────────────────────
  const [showModal,   setShowModal]   = useState(false);
  const [scheduleApp, setScheduleApp] = useState(null);   // app to schedule for
  const [form,        setForm]        = useState({
    interviewInstructions: "",
    interviewMode:         "Online",
    latitude:              "",
    longitude:             "",
    interviewDateTime:     "",
    status:                "Scheduled",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg,        setMsg]        = useState({ text: "", type: "" });

  const header = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || localStorage.getItem("token") || ""}`,
    },
  });

  // ── Fetch all company job posts ────────────────────────
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

  // ── Load applications + interviews for selected job ────
  // GET /api/job/job-post/{jobPostId}/job-applications
  // then for each → GET /api/job/job-application/{id}/interview
  const loadForJob = async (job) => {
    const jobPostId = job.jobPostId || job.id;
    setSelectedJob(job);
    setApplications([]);
    setInterviews([]);
    setError("");
    setLoadingPanel(true);

    try {
      // Step 1 – applications
      const appsRes = await axios.get(
        `${rest.jobPost}/${jobPostId}/job-applications`,
        header()
      );
      const appList = appsRes.data?.data || appsRes.data || [];
      const apps    = Array.isArray(appList) ? appList : [];
      setApplications(apps);

      // Step 2 – interview for each application
      const invRows = await Promise.all(
        apps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res   = await axios.get(
              `${rest.jobApplications}/${appId}/interview`,
              header()
            );
            const inv   = res.data?.data || res.data;
            const list  = Array.isArray(inv) ? inv : inv ? [inv] : [];
            return list.map((i) => ({ ...i, _app: app }));
          } catch {
            return [];
          }
        })
      );
      setInterviews(invRows.flat());
    } catch (err) {
      console.error("loadForJob:", err);
      setError("Failed to load data for this job post.");
    } finally {
      setLoadingPanel(false);
    }
  };

  // ── Open schedule modal for an application ─────────────
  const openModal = (app) => {
    setScheduleApp(app);
    setForm({
      interviewInstructions: "",
      interviewMode:         "Online",
      latitude:              "",
      longitude:             "",
      interviewDateTime:     "",
      status:                "Scheduled",
    });
    setMsg({ text: "", type: "" });
    setShowModal(true);
  };

  // ── POST /api/job/job-application/{id}/interview ────────
  const handleSchedule = async () => {
    if (!form.interviewDateTime) {
      setMsg({ text: "Interview date & time is required.", type: "error" });
      return;
    }
    setSubmitting(true);
    setMsg({ text: "", type: "" });
    try {
      const appId = scheduleApp.jobApplicationId || scheduleApp.id;
      const res   = await axios.post(
        `${rest.jobApplications}/${appId}/interview`,
        {
          interviewInstructions: form.interviewInstructions,
          interviewMode:         form.interviewMode,
          latitude:              form.latitude,
          longitude:             form.longitude,
          interviewDateTime:     form.interviewDateTime,
          status:                form.status,
          jobApplicationId:      appId,
        },
        header()
      );
      const newInv = res.data?.data || res.data;
      setInterviews((prev) => [...prev, { ...newInv, _app: scheduleApp }]);
      setMsg({ text: "✅ Interview scheduled successfully!", type: "success" });
      setTimeout(() => {
        setShowModal(false);
        setMsg({ text: "", type: "" });
      }, 1500);
    } catch (err) {
      console.error("schedule:", err);
      setMsg({
        text: err.response?.data?.message || "Failed to schedule interview.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────
  const getName = (app) =>
    app?.resumeModel?.studentModel?.name ||
    app?.studentModel?.name ||
    "Student";

  const getDept = (app) =>
    app?.resumeModel?.studentModel?.departmentModel?.departmentName ||
    app?.studentModel?.departmentModel?.departmentName ||
    "—";

  const getEmail = (app) =>
    app?.resumeModel?.studentModel?.email ||
    app?.studentModel?.email ||
    "—";

  const formatDT = (dt) => {
    if (!dt) return "—";
    try {
      return new Date(dt).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return dt; }
  };

  // Applications that don't yet have an interview scheduled
  const scheduledAppIds = new Set(
    interviews.map((i) => i.jobApplicationId || i._app?.jobApplicationId)
  );
  const pendingApps = applications.filter(
    (a) => !scheduledAppIds.has(a.jobApplicationId || a.id)
  );

  // Stats
  const scheduled  = interviews.filter((i) => i.status === "Scheduled").length;
  const selected   = interviews.filter((i) => i.status === "Selected").length;
  const rejected   = interviews.filter((i) => i.status === "Rejected").length;

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* ── Page Header ── */}
      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">📅 Interview Management</h2>
        <p className="fs-p9 text-secondary">
          Select a job post to view applications and manage interviews
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="row mb-4">
        {[
          { label: "Total Interviews", value: interviews.length, color: "var(--primary)" },
          { label: "Scheduled",        value: scheduled,         color: "#0ea5e9"         },
          { label: "Selected",         value: selected,          color: "var(--success)"  },
          { label: "Rejected",         value: rejected,          color: "var(--danger)"   },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4 text-center">
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
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
              return (
                <div
                  key={jid}
                  onClick={() => loadForJob(job)}
                  className="cursor-pointer"
                  style={{
                    border:     `2px solid ${isActive ? "var(--primary)" : "var(--border-color)"}`,
                    borderRadius: 10, padding: "10px 16px",
                    background: isActive ? "var(--primary)" : "var(--card-bg)",
                    color:      isActive ? "#fff" : "inherit",
                    minWidth: 180, flex: "0 0 auto", transition: "all 0.15s",
                  }}
                >
                  <p className="bold fs-p9">{job.tiitle || job.title || "Untitled"}</p>
                  <p className={`fs-p8 ${isActive ? "" : "text-secondary"}`}>
                    Deadline: {job.lastDateToApply || "—"}
                  </p>
                  <p className={`fs-p8 ${isActive ? "" : "text-secondary"}`}>
                    {job.requiredCandidate || "—"} openings
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Panel ── */}
      {!selectedJob ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>📅</p>
          <p className="bold mt-2">Select a job post above</p>
          <p className="text-secondary fs-p9">to manage its interviews</p>
        </div>
      ) : loadingPanel ? (
        <div className="card p-5 text-center">
          <p className="text-secondary">Loading data...</p>
        </div>
      ) : error ? (
        <div className="card p-4">
          <p style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      ) : (
        <>
          <div className="row space-between items-center mb-3">
            <h4 className="bold">
              Showing:{" "}
              <span style={{ color: "var(--primary)" }}>
                {selectedJob.tiitle || selectedJob.title}
              </span>
            </h4>
            <span className="fs-p9 text-secondary">
              {applications.length} applicants · {interviews.length} interviews scheduled
            </span>
          </div>

          {/* ── Pending Applications (no interview yet) ── */}
          {pendingApps.length > 0 && (
            <div className="mb-5">
              <h5 className="bold mb-3" style={{ color: "#f59e0b" }}>
                ⏳ Applications Awaiting Interview ({pendingApps.length})
              </h5>
              <div className="card p-2">
                <table className="w-100">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Department</th>
                      <th>Applied On</th>
                      <th>App Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApps.map((app, idx) => (
                      <tr key={app.jobApplicationId || idx} className="hover-bg">
                        <td>
                          <div className="bold fs-p9">{getName(app)}</div>
                          <div className="fs-p8 text-secondary">{getEmail(app)}</div>
                        </td>
                        <td className="fs-p9">{getDept(app)}</td>
                        <td className="fs-p9 text-secondary">{app.appliedOn || "—"}</td>
                        <td>
                          <StatusPill status={app.status} map={APPLICATION_STATUS} />
                        </td>
                        <td>
                          <button
                            className="btn btn-primary w-auto"
                            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                            onClick={() => openModal(app)}
                          >
                            📅 Schedule Interview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Scheduled Interviews ── */}
          {interviews.length > 0 && (
            <div className="mb-5">
              <h5 className="bold mb-3" style={{ color: "var(--primary)" }}>
                📅 Scheduled Interviews ({interviews.length})
              </h5>
              <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
                {interviews.map((inv, idx) => {
                  const cfg = INTERVIEW_STATUS[inv.status] || INTERVIEW_STATUS.Scheduled;
                  return (
                    <div
                      key={inv.interviewId || idx}
                      className="card p-4"
                      style={{
                        width: "calc(48% - 8px)", minWidth: 280,
                        borderLeft: `4px solid ${cfg.color}`,
                      }}
                    >
                      {/* Header row */}
                      <div className="row space-between items-center mb-3">
                        <div>
                          <p className="bold fs-p9">{getName(inv._app)}</p>
                          <p className="fs-p8 text-secondary">{getDept(inv._app)}</p>
                        </div>
                        <StatusPill status={inv.status} map={INTERVIEW_STATUS} />
                      </div>

                      {/* Details */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        {[
                          { icon: "🕐", label: "Date & Time",  value: formatDT(inv.interviewDateTime) },
                          { icon: "📱", label: "Mode",         value: inv.interviewMode || "—"         },
                          { icon: "📍", label: "Latitude",     value: inv.latitude || "—"              },
                          { icon: "📍", label: "Longitude",    value: inv.longitude || "—"             },
                        ].map((d, i) => (
                          <div key={i}>
                            <p className="fs-p8 text-secondary">{d.icon} {d.label}</p>
                            <p className="fs-p9 bold">{d.value}</p>
                          </div>
                        ))}
                      </div>

                      {inv.interviewInstructions && (
                        <div style={{
                          background: "rgba(50,85,99,0.05)", borderRadius: 8,
                          padding: "8px 12px", border: "1px solid rgba(50,85,99,0.1)",
                        }}>
                          <p className="fs-p8 text-secondary mb-1">📝 Instructions</p>
                          <p className="fs-p9">{inv.interviewInstructions}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Empty state ── */}
          {applications.length === 0 && (
            <div className="card p-5 text-center">
              <p style={{ fontSize: "3rem" }}>📭</p>
              <p className="bold mt-2">No applications for this job post yet</p>
              <p className="text-secondary fs-p9">Applications will appear here once students apply.</p>
            </div>
          )}
          {applications.length > 0 && interviews.length === 0 && pendingApps.length === 0 && (
            <div className="card p-5 text-center">
              <p style={{ fontSize: "3rem" }}>📋</p>
              <p className="bold mt-2">No interviews scheduled yet</p>
              <p className="text-secondary fs-p9">Use the buttons above to schedule interviews for applicants.</p>
            </div>
          )}
        </>
      )}

      {/* ════ Schedule Modal ════ */}
      {showModal && scheduleApp && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card p-5"
            style={{ width: 500, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="row space-between items-center mb-1">
              <h3 className="bold">📅 Schedule Interview</h3>
              <span
                className="cursor-pointer fs-4 text-secondary"
                onClick={() => setShowModal(false)}
              >
                ✕
              </span>
            </div>
            <p className="fs-p9 text-secondary mb-4">
              for <strong>{getName(scheduleApp)}</strong> ·{" "}
              <span style={{ color: "var(--primary)" }}>{getDept(scheduleApp)}</span>
            </p>

            {/* Date & Time */}
            <div className="form-group mb-3">
              <label className="form-control-label">
                Interview Date & Time <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="datetime-local"
                className="form-control"
                value={form.interviewDateTime}
                onChange={(e) => setForm({ ...form, interviewDateTime: e.target.value })}
              />
            </div>

            {/* Mode */}
            <div className="form-group mb-3">
              <label className="form-control-label">Interview Mode</label>
              <select
                className="form-control"
                value={form.interviewMode}
                onChange={(e) => setForm({ ...form, interviewMode: e.target.value })}
              >
                <option value="Online">Online</option>
                <option value="In-Person">In-Person</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Phone">Phone</option>
              </select>
            </div>

            {/* Location (lat/lng) — shown for In-Person */}
            {(form.interviewMode === "In-Person" || form.interviewMode === "Hybrid") && (
              <div className="row mb-3" style={{ gap: 12 }}>
                <div className="col-6 p-0">
                  <label className="form-control-label">Latitude</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 17.3850"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>
                <div className="col-6 p-0">
                  <label className="form-control-label">Longitude</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 78.4867"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="form-group mb-3">
              <label className="form-control-label">Instructions for Candidate</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="e.g. Bring your laptop, 3 copies of resume…"
                value={form.interviewInstructions}
                onChange={(e) => setForm({ ...form, interviewInstructions: e.target.value })}
              />
            </div>

            {/* Status */}
            <div className="form-group mb-4">
              <label className="form-control-label">Initial Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Accepted">Accepted</option>
              </select>
            </div>

            {/* Feedback message */}
            {msg.text && (
              <div
                className="p-2 br-md mb-3 fs-p9"
                style={{
                  background: msg.type === "success" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                  color:      msg.type === "success" ? "#16a34a"             : "#dc2626",
                  border:     `1px solid ${msg.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                  borderRadius: 8,
                }}
              >
                {msg.text}
              </div>
            )}

            <div className="row" style={{ gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={handleSchedule}
                disabled={submitting}
              >
                {submitting ? "⏳ Scheduling..." : "✅ Confirm Schedule"}
              </button>
              <button className="btn btn-muted" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyInterviews;