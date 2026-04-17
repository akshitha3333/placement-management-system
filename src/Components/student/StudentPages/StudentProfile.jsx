import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function StudentRecommended() {

  // ── State ──────────────────────────────────────────────
  const [suggestions,    setSuggestions]    = useState([]);
  const [resumes,        setResumes]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [appliedIds,     setAppliedIds]     = useState({});   // { jobSuggestionId: true }
  const [applying,       setApplying]       = useState(null);
  const [showModal,      setShowModal]      = useState(null); // sug object
  const [selectedResume, setSelectedResume] = useState(null);
  const [coverLetter,    setCoverLetter]    = useState("");
  const [submitError,    setSubmitError]    = useState("");

  // ── Auth Header ────────────────────────────────────────
  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── Fetch: GET /api/job/job-suggestions ───────────────
  const fetchSuggestions = async () => {
    try {
      const res  = await axios.get(rest.jobSuggestions, header);
      const list = res.data?.data || res.data || [];
      const arr  = Array.isArray(list) ? list : [];
      setSuggestions(arr);

      // Pre-mark applied suggestions from suggestions list
      const already = {};
      arr.forEach((s) => {
        if (s.applied || (s.jobApplications && s.jobApplications.length > 0)) {
          already[s.jobSuggestionId] = true;
        }
      });
      setAppliedIds(already);
      return arr;
    } catch (err) {
      console.error("fetchSuggestions:", err);
      setError("Failed to load recommended jobs.");
      return [];
    }
  };

  // ── Fetch: GET /api/actors/student-resume ─────────────
  const fetchResumes = async () => {
    try {
      const res  = await axios.get(rest.studentResume, header);
      const data = res.data?.data || res.data || [];
      setResumes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchResumes:", err);
    }
  };

  // ── Verify applied status per suggestion ──────────────
  // GET /api/job/job-suggestions/{id}/job-applications
  const verifyApplied = async (sugs) => {
    if (!sugs.length) return;
    const results = await Promise.all(
      sugs.map(async (sug) => {
        try {
          const res  = await axios.get(
            `${rest.jobSuggestions}/${sug.jobSuggestionId}/job-applications`,
            header
          );
          const apps = res.data?.data || res.data || [];
          return { id: sug.jobSuggestionId, applied: Array.isArray(apps) && apps.length > 0 };
        } catch {
          return { id: sug.jobSuggestionId, applied: false };
        }
      })
    );
    const extra = {};
    results.forEach((r) => { if (r.applied) extra[r.id] = true; });
    setAppliedIds((prev) => ({ ...prev, ...extra }));
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [sugs] = await Promise.all([fetchSuggestions(), fetchResumes()]);
      await verifyApplied(sugs);
      setLoading(false);
    };
    init();
  }, []);

  // ── POST /api/job/job-suggestions/{id}/job-applications ──
  const applyToJob = async () => {
    if (!showModal) return;
    if (!selectedResume) {
      setSubmitError("Please select a resume before submitting.");
      return;
    }
    setSubmitError("");
    const { jobSuggestionId } = showModal;
    setApplying(jobSuggestionId);

    try {
      const payload = { resumeId: selectedResume.resumeId };
      if (coverLetter.trim()) payload.coverLetter = coverLetter.trim();

      await axios.post(
        `${rest.jobSuggestions}/${jobSuggestionId}/job-applications`,
        payload,
        header
      );

      setAppliedIds((prev) => ({ ...prev, [jobSuggestionId]: true }));
      setShowModal(null);
      setCoverLetter("");
      setSelectedResume(null);
      alert("Application submitted successfully! View it in My Applications.");
    } catch (err) {
      console.error("applyToJob:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to submit application. Please try again.";
      setSubmitError(msg);
    } finally {
      setApplying(null);
    }
  };

  const openModal = (sug) => {
    setShowModal(sug);
    setCoverLetter("");
    setSelectedResume(null);
    setSubmitError("");
  };

  const closeModal = () => {
    setShowModal(null);
    setSubmitError("");
  };

  // ── Helpers ────────────────────────────────────────────
  const getTutorName = (sug) =>
    sug?.tutorModel?.tutorName ||
    sug?.tutorModel?.name ||
    sug?.tutorName ||
    sug?.recommendedBy ||
    "Your Tutor";

  const getJobTitle = (sug) =>
    sug?.jobPostModel?.title ||
    sug?.jobPostModel?.tiitle ||
    "—";

  const matchColor = (score) =>
    score >= 80 ? "var(--success)" : score >= 60 ? "var(--warning)" : "var(--danger)";

  const daysLeft = (dateStr) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  };

  // ── Search filter ──────────────────────────────────────
  const filtered = suggestions.filter((sug) => {
    const term    = search.toLowerCase();
    const company = (sug.jobPostModel?.companyModel?.companyName || "").toLowerCase();
    const title   = getJobTitle(sug).toLowerCase();
    return company.includes(term) || title.includes(term);
  });

  const totalApplied = Object.keys(appliedIds).length;
  const totalPending = suggestions.length - totalApplied;

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* ── Page Header ── */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">🎯 Recommended Jobs</h2>
          <p className="fs-p9 text-secondary">
            Jobs handpicked by your tutor — review and apply directly
          </p>
        </div>
      </div>

      {error && <div className="alert-danger mb-4">⚠️ {error}</div>}

      {/* ── Stats Row ── */}
      <div className="row g-3 mb-4">
        {[
          { label: "Recommended", value: suggestions.length, icon: "🎯", color: "var(--primary)" },
          { label: "Applied",     value: totalApplied,        icon: "✅", color: "var(--success)" },
          { label: "Pending",     value: totalPending,        icon: "⏳", color: "var(--warning)" },
        ].map((stat, i) => (
          <div className="col-4 p-2" key={i}>
            <div className="card p-3 stat-card row items-center g-3">
              <div className="fs-4">{stat.icon}</div>
              <div>
                <p className="fs-p8 text-secondary">{stat.label}</p>
                <h3 className="bold" style={{ color: stat.color }}>{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="w-40 mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search by company or job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary">Loading recommendations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="fs-4">📭</p>
          <p className="bold mt-2">No recommendations yet</p>
          <p className="fs-p9 text-secondary mt-1">
            Your tutor hasn't suggested any jobs yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>

          {/* ── Table Header ── */}
          <div
            className="row items-center"
            style={{
              background: "var(--gray-100)",
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-color)",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            <div className="col-3">Job Title</div>
            <div className="col-2">Company</div>
            <div className="col-2">Location</div>
            <div className="col-1 text-center">Openings</div>
            <div className="col-1 text-center">Match</div>
            <div className="col-1 text-center">Status</div>
            <div className="col-2 text-center">Deadline / Action</div>
          </div>

          {/* ── Rows ── */}
          {filtered.map((sug) => {
            const job       = sug.jobPostModel || {};
            const isOpen    = expandedId === sug.jobSuggestionId;
            const isApplied = !!appliedIds[sug.jobSuggestionId];
            const days      = daysLeft(job.lastDateToApply);
            const deadlineFmt =
              days == null
                ? (job.lastDateToApply || "—")
                : days > 0
                ? `${days}d left`
                : "Closed";
            const deadlineColor =
              days == null
                ? "var(--text-secondary)"
                : days <= 3
                ? "var(--danger)"
                : days <= 7
                ? "var(--warning)"
                : "var(--success)";

            return (
              <div key={sug.jobSuggestionId}>

                {/* ── Collapsed Row ── */}
                <div
                  className="row items-center"
                  style={{
                    padding: "12px 16px",
                    borderBottom: isOpen ? "none" : "1px solid var(--border-color)",
                    background: isOpen ? "rgba(50,85,99,0.03)" : "#fff",
                  }}
                >
                  <div className="col-3">
                    <p className="bold fs-p9">{getJobTitle(sug)}</p>
                    {sug.matchScore != null && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          background: "var(--gray-100)",
                          color: matchColor(sug.matchScore),
                          padding: "1px 7px",
                          borderRadius: 10,
                          fontWeight: 600,
                        }}
                      >
                        {sug.matchScore}% match
                      </span>
                    )}
                  </div>
                  <div className="col-2 fs-p9 text-secondary">
                    {job.companyModel?.companyName || "—"}
                  </div>
                  <div className="col-2 fs-p9 text-secondary">
                    📍 {job.companyModel?.location || "—"}
                  </div>
                  <div className="col-1 text-center fs-p9">
                    👥 {job.requiredCandidate || "—"}
                  </div>
                  <div className="col-1 text-center">
                    {sug.matchScore != null ? (
                      <span className="bold" style={{ fontSize: "0.78rem", color: matchColor(sug.matchScore) }}>
                        {sug.matchScore}%
                      </span>
                    ) : (
                      <span className="fs-p9 text-secondary">—</span>
                    )}
                  </div>
                  <div className="col-1 text-center">
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: isApplied ? "rgba(22,163,74,0.12)" : "rgba(50,85,99,0.1)",
                        color:      isApplied ? "var(--success)"        : "var(--primary)",
                        border:     `1px solid ${isApplied ? "rgba(22,163,74,0.3)" : "rgba(50,85,99,0.3)"}`,
                      }}
                    >
                      {isApplied ? "Applied" : "Pending"}
                    </span>
                  </div>
                  <div className="col-2 row items-center justify-center g-2">
                    <span className="fs-p8 bold" style={{ color: deadlineColor }}>
                      {deadlineFmt}
                    </span>
                    <button
                      className={`btn w-auto ${isOpen ? "btn-muted" : "btn-primary"}`}
                      style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                      onClick={() => setExpandedId(isOpen ? null : sug.jobSuggestionId)}
                    >
                      {isOpen ? "✕ Close" : "👁 View"}
                    </button>
                  </div>
                </div>

                {/* ── Expanded Panel ── */}
                {isOpen && (
                  <div
                    style={{
                      background: "rgba(50,85,99,0.02)",
                      borderTop: "1px dashed var(--border-color)",
                      borderBottom: "1px solid var(--border-color)",
                      padding: "20px",
                    }}
                  >
                    <div className="row g-5">

                      {/* LEFT — Job Details */}
                      <div className="col-6">
                        <h4 className="bold mb-1">{getJobTitle(sug)}</h4>
                        <p className="fs-p9 text-secondary mb-3">
                          🏢 {job.companyModel?.companyName || "—"} &nbsp;|&nbsp; 📍 {job.companyModel?.location || "—"}
                        </p>

                        {job.companyModel && (
                          <div className="card p-3 mb-3 row items-center g-3" style={{ background: "var(--gray-100)" }}>
                            <div
                              className="bg-primary text-white br-circle bold"
                              style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 }}
                            >
                              {(job.companyModel.companyName || "C").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="bold fs-p9">{job.companyModel.companyName}</p>
                              {job.companyModel.email && (
                                <p className="fs-p8 text-secondary">{job.companyModel.email}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {job.description && (
                          <div className="card p-3 mb-3" style={{ background: "var(--gray-100)" }}>
                            <p className="fs-p8 bold mb-1">📄 Job Description</p>
                            <p className="fs-p9" style={{ lineHeight: 1.7 }}>{job.description}</p>
                          </div>
                        )}

                        <div className="row g-2 flex-wrap">
                          {[
                            { icon: "👥", label: "Openings",    value: job.requiredCandidate },
                            { icon: "📊", label: "Eligibility", value: job.eligiblePercentage ? `${job.eligiblePercentage}%` : null },
                            { icon: "📅", label: "Posted",      value: job.postedDate },
                            { icon: "⏰", label: "Last Date",   value: job.lastDateToApply },
                          ].filter((m) => m.value).map((m) => (
                            <div key={m.label} className="card p-2" style={{ minWidth: 110, flex: 1 }}>
                              <p className="fs-p8 text-secondary">{m.icon} {m.label}</p>
                              <p className="bold fs-p8 mt-1">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ width: 1, background: "var(--border-color)" }} />

                      {/* RIGHT — Recommendation + Apply */}
                      <div className="col-6">

                        <div className="row space-between items-center mb-3">
                          <h5 className="bold">📋 Recommendation Details</h5>
                          <div
                            className="row items-center g-2"
                            style={{ background: "rgba(50,85,99,0.08)", borderRadius: 8, padding: "6px 12px" }}
                          >
                            <div
                              className="bg-primary text-white br-circle bold"
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}
                            >
                              {getTutorName(sug).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="fs-p8 text-secondary" style={{ lineHeight: 1 }}>Recommended by</p>
                              <p className="bold fs-p9" style={{ color: "var(--primary)" }}>{getTutorName(sug)}</p>
                            </div>
                          </div>
                        </div>

                        {sug.note && (
                          <div className="alert-info mb-3">
                            <p className="fs-p8 bold mb-1">💬 Tutor's Note</p>
                            <p className="fs-p9">{sug.note}</p>
                          </div>
                        )}

                        {sug.matchScore != null && (
                          <div className="card p-3 mb-3">
                            <div className="row space-between items-center mb-2">
                              <p className="fs-p9 bold">🤖 Match Score</p>
                              <p className="bold fs-3" style={{ color: matchColor(sug.matchScore) }}>
                                {sug.matchScore}%
                              </p>
                            </div>
                            <div style={{ height: 6, background: "var(--gray-200)", borderRadius: 999, overflow: "hidden" }}>
                              <div style={{ width: `${sug.matchScore}%`, height: "100%", background: matchColor(sug.matchScore), borderRadius: 999 }} />
                            </div>
                            <p className="fs-p8 text-secondary mt-2">Score based on your profile and skills overlap</p>
                          </div>
                        )}

                        {days != null && days <= 7 && days > 0 && (
                          <div className="alert-info mb-3">
                            <p className="fs-p8 text-info">
                              ⏰ Only <strong>{days} day{days !== 1 ? "s" : ""}</strong> left to apply!
                            </p>
                          </div>
                        )}

                        {isApplied ? (
                          <div className="alert-success">
                            <p className="fs-p9 bold" style={{ color: "var(--success)" }}>
                              ✅ Application submitted. Check <strong>My Applications</strong> for status updates.
                            </p>
                          </div>
                        ) : days !== null && days <= 0 ? (
                          <div className="alert-danger">
                            <p className="fs-p9" style={{ color: "var(--danger)" }}>
                              ❌ Application deadline has passed.
                            </p>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={{ marginTop: 8 }}
                            onClick={() => openModal(sug)}
                          >
                            🚀 Apply Now
                          </button>
                        )}

                        <div className="alert-info mt-3">
                          <p className="fs-p8 text-info">
                            🎯 Recommended by <strong>{getTutorName(sug)}</strong>. Apply before the deadline to maximise your chances.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Apply Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="card p-5"
            style={{ width: 520, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="row space-between items-center mb-2">
              <h4 className="bold">🚀 Apply for Job</h4>
              <span className="cursor-pointer fs-4 text-secondary" onClick={closeModal}>✕</span>
            </div>

            <p className="bold fs-p9 mb-1">{getJobTitle(showModal)}</p>
            <p className="fs-p8 text-secondary mb-1">
              🏢 {showModal.jobPostModel?.companyModel?.companyName || "—"}
            </p>

            <div
              className="row items-center g-2 mb-4"
              style={{ background: "rgba(50,85,99,0.06)", borderRadius: 8, padding: "8px 12px", display: "inline-flex" }}
            >
              <span className="fs-p8">👨‍🏫 Recommended by</span>
              <span className="bold fs-p8" style={{ color: "var(--primary)" }}>
                {getTutorName(showModal)}
              </span>
            </div>

            {/* ── Select Resume ── */}
            <div className="form-group mb-3">
              <label className="form-control-label mb-2">
                📄 Select Resume <span style={{ color: "var(--danger)" }}>*</span>
              </label>

              {resumes.length === 0 ? (
                <div className="alert-info">
                  <p className="fs-p9 text-info">
                    💡 No resumes found. Please upload one in <strong>My Profile</strong> first.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: 200, overflowY: "auto" }}>
                  {resumes.map((r) => (
                    <div
                      key={r.resumeId}
                      onClick={() => setSelectedResume(r)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: selectedResume?.resumeId === r.resumeId
                          ? "2px solid #325563"
                          : "1px solid var(--border-color)",
                        background: selectedResume?.resumeId === r.resumeId
                          ? "rgba(50,85,99,0.06)"
                          : "#fff",
                        transition: "all 0.15s",
                      }}
                    >
                      <div className="row space-between items-center">
                        <div>
                          <p className="bold fs-p9">
                            {r.resumeTitle || r.fileName || `Resume ${r.resumeId}`}
                          </p>
                          <p className="fs-p8 text-secondary">
                            {r.uploadedDate || r.date || r.createdAt || "Uploaded"}
                          </p>
                        </div>
                        {selectedResume?.resumeId === r.resumeId && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--success)" }}>
                            ✓ Selected
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Cover Letter ── */}
            <div className="form-group mb-4">
              <label className="form-control-label mb-1">
                ✍️ Cover Letter
                <span className="fs-p8 text-secondary" style={{ fontWeight: 400, marginLeft: 6 }}>(optional)</span>
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Hi, I'd love to apply for this role because..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                style={{ resize: "vertical" }}
              />
              <p className="fs-p8 text-secondary mt-1" style={{ textAlign: "right" }}>
                {coverLetter.length} characters
              </p>
            </div>

            {submitError && (
              <div className="alert-danger mb-3">
                <p className="fs-p9" style={{ color: "var(--danger)" }}>⚠️ {submitError}</p>
              </div>
            )}

            <div className="row g-2">
              <button
                className="btn btn-primary"
                onClick={applyToJob}
                disabled={applying === showModal.jobSuggestionId || !selectedResume}
                style={{ opacity: !selectedResume ? 0.6 : 1 }}
              >
                {applying === showModal.jobSuggestionId ? "Submitting..." : "✅ Submit Application"}
              </button>
              <button className="btn btn-muted" onClick={closeModal}>Cancel</button>
            </div>

            {!selectedResume && resumes.length > 0 && (
              <p className="fs-p8 mt-2" style={{ color: "var(--danger)" }}>
                ⚠️ Please select a resume to continue.
              </p>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default StudentRecommended;