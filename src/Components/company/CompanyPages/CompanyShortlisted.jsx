import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const emptyForm = { interviewDate: "", interviewTime: "", mode: "Online", link: "", notes: "" };

function CompanyShortlisted() {
  const [jobs,              setJobs]              = useState([]);
  const [applications,      setApplications]      = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState("");
  const [selectedJob,       setSelectedJob]       = useState(null);
  const [showModal,         setShowModal]         = useState(false);
  const [selectedApp,       setSelectedApp]       = useState(null);
  const [form,              setForm]              = useState(emptyForm);
  const [submitting,        setSubmitting]        = useState(false);
  const [message,           setMessage]           = useState("");
  const [msgType,           setMsgType]           = useState("");
  const [scheduledSet,      setScheduledSet]      = useState(new Set());

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── Fetch all job posts ────────────────────────────────
  const fetchJobs = async () => {
    try {
      const res  = await axios.get(rest.jobPost, header);
      const list = res.data?.data || res.data || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("fetchJobs error:", err);
      setError("Failed to load job posts.");
    }
  };

  // ── Fetch applications for a specific job post ─────────
  // GET /api/job/job-post/{jobPostId}/job-applications
  const fetchApplicationsForJob = async (jobPostId) => {
    try {
      setLoading(true);
      setError("");
      const res  = await axios.get(`${rest.jobPost}/${jobPostId}/job-applications`, header);
      const list = res.data?.data || res.data || [];
      setApplications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("fetchApplications error:", err);
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchJobs();
      setLoading(false);
    };
    init();
  }, []);

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setApplications([]);
    fetchApplicationsForJob(job.jobPostId || job.id);
  };

  const openSchedule = (app) => {
    setSelectedApp(app);
    setForm(emptyForm);
    setMessage("");
    setShowModal(true);
  };

  // ── POST /api/job/job-application/{jobApplicationId}/interview ──
  const handleSchedule = async () => {
    if (!form.interviewDate || !form.interviewTime) {
      setMessage("Date and time are required.");
      setMsgType("error");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const jobApplicationId = selectedApp.jobApplicationId || selectedApp.id;
      await axios.post(
        `${rest.jobApplications}/${jobApplicationId}/interview`,
        {
          interviewDate: form.interviewDate,
          interviewTime: form.interviewTime,
          mode:          form.mode,
          link:          form.link,
          notes:         form.notes,
        },
        header
      );
      setScheduledSet(prev => new Set([...prev, jobApplicationId]));
      setMessage("Interview scheduled successfully!");
      setMsgType("success");
      setTimeout(() => { setShowModal(false); setMessage(""); }, 1500);
    } catch (err) {
      console.error("schedule error:", err);
      setMessage(err.response?.data?.message || "Failed to schedule interview.");
      setMsgType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const isScheduled = (app) =>
    scheduledSet.has(app.jobApplicationId || app.id) || app.interviewScheduled;

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "S");

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">Shortlisted Candidates</h2>
      <p className="fs-p9 text-secondary mb-4">
        Select a job post to view shortlisted applicants and schedule interviews
      </p>

      {/* ── Job Post Selector ── */}
      <div className="card p-4 mb-4">
        <h4 className="mb-3">📋 Select Job Post</h4>
        {jobs.length === 0 ? (
          <p className="text-secondary fs-p9">No job posts found.</p>
        ) : (
          <div className="row" style={{ gap: "10px", flexWrap: "wrap" }}>
            {jobs.map((job) => {
              const jid = job.jobPostId || job.id;
              const isActive = selectedJob && (selectedJob.jobPostId || selectedJob.id) === jid;
              return (
                <div
                  key={jid}
                  className={`p-3 br-md cursor-pointer ${isActive ? "bg-primary text-white" : "hover-bg"}`}
                  style={{
                    border: `1px solid ${isActive ? "var(--primary)" : "var(--border-color)"}`,
                    borderRadius: "10px",
                    minWidth: "180px",
                    flex: "0 0 auto",
                  }}
                  onClick={() => handleJobSelect(job)}
                >
                  <div className="bold fs-p9">{job.title || job.tiitle}</div>
                  <div className={`fs-p8 ${isActive ? "" : "text-secondary"}`}>
                    Last date: {job.lastDateToApply || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Applications Panel ── */}
      {!selectedJob ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>👆</p>
          <p className="bold mt-2">Select a job post above</p>
          <p className="text-secondary fs-p9">to view its shortlisted applicants</p>
        </div>
      ) : loading ? (
        <div className="card p-5 text-center"><p>Loading applications...</p></div>
      ) : error ? (
        <div className="card p-4"><p className="text-danger">{error}</p></div>
      ) : applications.length === 0 ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>✅</p>
          <p className="bold mt-2">No applications yet</p>
          <p className="text-secondary fs-p9">
            No one has applied to "{selectedJob.title || selectedJob.tiitle}" yet.
          </p>
        </div>
      ) : (
        <>
          <div className="row space-between items-center mb-3">
            <h4>
              📑 Applications for: <span style={{ color: "var(--primary)" }}>{selectedJob.title || selectedJob.tiitle}</span>
            </h4>
            <span className="status-item" style={{ background: "rgba(50,85,99,0.1)", color: "var(--primary)" }}>
              {applications.length} applicant{applications.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="row" style={{ gap: "16px", flexWrap: "wrap" }}>
            {applications.map((app) => {
              const appId    = app.jobApplicationId || app.id;
              const student  = app.studentModel || app;
              const name     = student.name || student.studentName || "Student";
              const email    = student.email || student.userModel?.email || "—";
              const dept     = student.departmentModel?.departmentName || student.department || "—";
              const cgpa     = student.cgpa || student.marks || "—";
              const skills   = student.skills || "";
              const scheduled = isScheduled(app);

              return (
                <div
                  key={appId}
                  className="card p-4 stat-card"
                  style={{ width: "calc(33% - 16px)", minWidth: "260px" }}
                >
                  {/* Avatar + Name */}
                  <div className="row items-center mb-3" style={{ gap: "12px" }}>
                    <div
                      className="bg-primary text-white br-circle"
                      style={{
                        width: "44px", height: "44px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: "bold", fontSize: "1.1rem", flexShrink: 0,
                      }}
                    >
                      {getInitial(name)}
                    </div>
                    <div>
                      <div className="bold">{name}</div>
                      <div className="fs-p8 text-secondary">{dept}</div>
                    </div>
                  </div>

                  <p className="fs-p9 mb-1">📧 {email}</p>
                  <p className="fs-p9 mb-1">
                    🎓 CGPA / Marks: <span className="bold">{cgpa}</span>
                  </p>

                  {app.resumeModel?.resumeUrl && (
                    <p className="fs-p9 mb-1">
                      📎{" "}
                      <a
                        href={app.resumeModel.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                      >
                        View Resume
                      </a>
                    </p>
                  )}

                  {skills && (
                    <div className="mt-2 mb-3" style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {skills.split(",").map((s, i) => (
                        <span
                          key={i}
                          className="fs-p8"
                          style={{ background: "#e5e7eb", borderRadius: "12px", padding: "2px 8px" }}
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {scheduled ? (
                    <span
                      className="status-item"
                      style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}
                    >
                      📅 Interview Scheduled
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ padding: "8px", fontSize: "0.85rem" }}
                      onClick={() => openSchedule(app)}
                    >
                      📅 Schedule Interview
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Schedule Interview Modal ── */}
      {showModal && selectedApp && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card p-5"
            style={{ width: "480px", maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-1">
              <h3>📅 Schedule Interview</h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setShowModal(false)}>✕</span>
            </div>

            <p className="fs-p9 text-secondary mb-4">
              for{" "}
              <strong>
                {(selectedApp.studentModel?.name || selectedApp.studentName || "Candidate")}
              </strong>
            </p>

            {/* Date & Time */}
            <div className="row mb-3" style={{ gap: "12px" }}>
              <div className="col-6 p-0">
                <label className="form-control-label">Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.interviewDate}
                  onChange={(e) => setForm({ ...form, interviewDate: e.target.value })}
                />
              </div>
              <div className="col-6 p-0">
                <label className="form-control-label">Time *</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.interviewTime}
                  onChange={(e) => setForm({ ...form, interviewTime: e.target.value })}
                />
              </div>
            </div>

            {/* Mode */}
            <div className="form-group mb-3">
              <label className="form-control-label">Interview Mode</label>
              <select
                className="form-control"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
              >
                <option>Online</option>
                <option>In-person</option>
                <option>Phone</option>
              </select>
            </div>

            {/* Meeting Link */}
            {form.mode === "Online" && (
              <div className="form-group mb-3">
                <label className="form-control-label">Meeting Link</label>
                <input
                  className="form-control"
                  placeholder="https://meet.google.com/..."
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                />
              </div>
            )}

            {/* Notes */}
            <div className="form-group mb-4">
              <label className="form-control-label">Notes for Candidate</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Any specific instructions or documents to bring..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className="p-2 br-md mb-3 fs-p9"
                style={{
                  background: msgType === "success" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                  color:      msgType === "success" ? "#16a34a"             : "#dc2626",
                  border:     `1px solid ${msgType === "success" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
                }}
              >
                {message}
              </div>
            )}

            <div className="row" style={{ gap: "10px" }}>
              <button
                className="btn btn-primary"
                onClick={handleSchedule}
                disabled={submitting}
              >
                {submitting ? "Scheduling..." : "✅ Confirm Schedule"}
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

export default CompanyShortlisted;