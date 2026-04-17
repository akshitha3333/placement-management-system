import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function StudentJobPosts() {

  // ── State ──────────────────────────────────────────────
  const [jobs,           setJobs]           = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [myProfile,      setMyProfile]      = useState(null);
  const [myResumes,      setMyResumes]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [filterCat,      setFilterCat]      = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [applied,        setApplied]        = useState({});
  const [applying,       setApplying]       = useState(null);
  const [showModal,      setShowModal]      = useState(null);
  const [selectedResume, setSelectedResume] = useState("");
  const [coverLetter,    setCoverLetter]    = useState("");

  // ── Auth Header ────────────────────────────────────────
  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  };

  console.log("token:", Cookies.get("token"));
  console.log("all cookies:", document.cookie);
  // ── Fetch: GET /api/job/job-post ───────────────────────
  const fetchJobs = async () => {
    try {
      const res     = await axios.get(rest.jobPost, header);
      const jobList = res.data?.data || res.data || [];
      setJobs(Array.isArray(jobList) ? jobList : []);
    } catch (err) {
      console.error("fetchJobs error:", err);
      setError("Failed to load job posts.");
    }
  };

  // ── Fetch: GET /api/classification/job-category ───────
  const fetchCategories = async () => {
    try {
      const res     = await axios.get(rest.jobCategory, header);
      const catList = res.data?.data || res.data || [];
      setCategories(Array.isArray(catList) ? catList : []);
    } catch (err) {
      console.error("fetchCategories error:", err);
    }
  };

  // ── Fetch: GET /api/actors/students → own profile ─────
  const fetchProfile = async () => {
    try {
      const res     = await axios.get(rest.students, header);
      const stuList = res.data?.data || res.data || [];
      const me      = Array.isArray(stuList) ? stuList[0] : stuList;
      setMyProfile(me);
      if (me?.resumes) setMyResumes(me.resumes);
    } catch (err) {
      console.error("fetchProfile error:", err);
    }
  };

  // ── Fetch: GET /api/job/job-suggestions → mark applied ─
  const fetchApplied = async () => {
    try {
      const res  = await axios.get(rest.jobSuggestions, header);
      const list = res.data?.data || res.data || [];
      const alreadyApplied = {};
      list.forEach((s) => {
        if (s.applied || s.jobApplications?.length > 0) {
          alreadyApplied[s.jobPostModel?.jobPostId] = true;
        }
      });
      setApplied(alreadyApplied);
    } catch (err) {
      console.error("fetchApplied error:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchCategories(), fetchProfile(), fetchApplied()]);
      setLoading(false);
    };
    init();
  }, []);

  // ── Apply: POST /api/job/job-suggestions/{id}/job-applications ──
  const applyToJob = async () => {
    if (!showModal) return;
    const { jobPostId } = showModal;
    setApplying(jobPostId);
    try {
      // Try to find existing suggestion for this job, apply through it
      const sugRes  = await axios.get(rest.jobSuggestions, header);
      const sugList = sugRes.data?.data || sugRes.data || [];
      const sug     = sugList.find((s) => s.jobPostModel?.jobPostId === jobPostId);

      if (sug) {
        await axios.post(
          `${rest.jobSuggestions}/${sug.jobSuggestionId}/job-applications`,
          { coverLetter, resumeId: selectedResume },
          header
        );
      } else {
        // Fallback: direct application
        await axios.post(
          rest.jobApplications,
          { jobPostId, coverLetter, resumeId: selectedResume },
          header
        );
      }

      setApplied((prev) => ({ ...prev, [jobPostId]: true }));
      setShowModal(null);
      setCoverLetter("");
      setSelectedResume("");
      alert(`✅ Application submitted successfully!`);
    } catch (err) {
      console.error("applyToJob error:", err);
      alert("Failed to submit application. Please try again.");
    } finally {
      setApplying(null);
    }
  };

  // ── Eligibility check ──────────────────────────────────
  const isEligible = (job) => {
    if (!myProfile) return true;
    const minPct = parseFloat(job.eligiblePercentage) || 0;
    const myPct  = parseFloat(myProfile.percentage)   || 0;
    return myPct >= minPct;
  };

  // ── Days left until deadline ───────────────────────────
  const daysLeft = (dateStr) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  };

  // ── Search + category filter ───────────────────────────
  const filteredJobs = jobs.filter((job) => {
    const q          = search.toLowerCase();
    const titleMatch = (job.title || job.tiitle || "").toLowerCase().includes(q);
    const compMatch  = (job.companyModel?.companyName || "").toLowerCase().includes(q);
    const catMatch   = filterCat
      ? String(job.jobCategoryModel?.jobCategoryId) === String(filterCat)
      : true;
    return (titleMatch || compMatch) && catMatch;
  });

  // ── Stats ──────────────────────────────────────────────
  const totalJobs    = jobs.length;
  const eligibleJobs = jobs.filter(isEligible).length;
  const totalApplied = Object.keys(applied).length;

  // ── Helpers ────────────────────────────────────────────
  const deadlineColor = (days) =>
    days == null ? "var(--gray-400)" : days <= 3 ? "var(--danger)" : days <= 7 ? "var(--warning)" : "var(--success)";

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* ── Page Title ── */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">🏢 Browse Jobs</h2>
          <p className="fs-p9 text-secondary">
            Explore all open positions across companies and apply directly
          </p>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="alert-danger mb-4">⚠️ {error}</div>
      )}

      {/* ── Stats Row ── */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Jobs",      value: totalJobs,    icon: "💼", color: "var(--primary)" },
          { label: "You're Eligible", value: eligibleJobs, icon: "✅", color: "var(--success)" },
          { label: "Applied",         value: totalApplied, icon: "📨", color: "var(--info)"    },
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

      {/* ── Search + Category Filter ── */}
      <div className="row g-3 mb-3 items-center">
        <div className="w-40">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search by company or job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width: "200px" }}>
          <select className="form-control" value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.jobCategoryId} value={c.jobCategoryId}>
                {c.jobCategoryName || c.name}
              </option>
            ))}
          </select>
        </div>
        {(search || filterCat) && (
          <button className="btn btn-muted w-auto"
            style={{ padding: "8px 14px", fontSize: "0.85rem" }}
            onClick={() => { setSearch(""); setFilterCat(""); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Job List ── */}
      {loading ? (
        <p className="text-secondary p-4">Loading job posts...</p>
      ) : filteredJobs.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="fs-4">📭</p>
          <p className="bold mt-2">No jobs found</p>
          <p className="fs-p9 text-secondary">Try a different search term or category</p>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>

          {/* ── Table Header ── */}
          <div className="row items-center"
            style={{ background: "var(--gray-100)", padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            <div className="col-3">Job Title</div>
            <div className="col-2">Company</div>
            <div className="col-2">Location</div>
            <div className="col-1 text-center">Openings</div>
            <div className="col-1 text-center">Eligibility</div>
            <div className="col-1 text-center">Deadline</div>
            <div className="col-2 text-center">Action</div>
          </div>

          {/* ── Job Rows ── */}
          {filteredJobs.map((job) => {
            const isOpen    = expandedId === job.jobPostId;
            const eligible  = isEligible(job);
            const days      = daysLeft(job.lastDateToApply);
            const isApplied = applied[job.jobPostId];

            return (
              <div key={job.jobPostId}>

                {/* ── Collapsed Row ── */}
                <div className="row items-center"
                  style={{ padding: "12px 16px", borderBottom: isOpen ? "none" : "1px solid var(--border-color)", background: isOpen ? "rgba(50,85,99,0.03)" : "#fff", opacity: !eligible ? 0.75 : 1 }}>

                  {/* Job Title */}
                  <div className="col-3">
                    <p className="bold fs-p9">{job.title || job.tiitle || "—"}</p>
                    {job.jobCategoryModel?.jobCategoryName && (
                      <span style={{ fontSize: "0.7rem", background: "var(--gray-100)", color: "var(--gray-600)", padding: "1px 7px", borderRadius: 10 }}>
                        {job.jobCategoryModel.jobCategoryName}
                      </span>
                    )}
                  </div>

                  {/* Company */}
                  <div className="col-2 fs-p9 text-secondary">{job.companyModel?.companyName || "—"}</div>

                  {/* Location */}
                  <div className="col-2 fs-p9 text-secondary">📍 {job.companyModel?.location || "—"}</div>

                  {/* Openings */}
                  <div className="col-1 text-center fs-p9">👥 {job.requiredCandidate || "—"}</div>

                  {/* Eligibility */}
                  <div className="col-1 text-center">
                    <span className="fs-p9" style={{ fontWeight: 600, color: eligible ? "var(--success)" : "var(--danger)" }}>
                      {job.eligiblePercentage ? `${job.eligiblePercentage}%` : "—"} {eligible ? "✓" : "✗"}
                    </span>
                  </div>

                  {/* Deadline */}
                  <div className="col-1 text-center">
                    {days != null ? (
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: deadlineColor(days) }}>
                        {days > 0 ? `${days}d left` : "Closed"}
                      </span>
                    ) : (
                      <span className="fs-p8 text-secondary">{job.lastDateToApply || "—"}</span>
                    )}
                  </div>

                  {/* Action */}
                  <div className="col-2 row items-center justify-center g-2">
                    {isApplied ? (
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: "rgba(22,163,74,0.12)", color: "var(--success)", border: "1px solid rgba(22,163,74,0.3)" }}>
                        Applied
                      </span>
                    ) : eligible && days > 0 ? (
                      <button
                        className="btn btn-success w-auto"
                        style={{ padding: "5px 10px", fontSize: "0.76rem", background: "var(--success)", color: "#fff", border: "none" }}
                        onClick={() => { setShowModal(job); setCoverLetter(""); setSelectedResume(""); }}
                      >
                        Apply
                      </button>
                    ) : null}
                    <button
                      className={`btn w-auto ${isOpen ? "btn-muted" : "btn-primary"}`}
                      style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                      onClick={() => setExpandedId(isOpen ? null : job.jobPostId)}
                    >
                      {isOpen ? "✕ Close" : "👁 View"}
                    </button>
                  </div>
                </div>

                {/* ── Expanded Panel ── */}
                {isOpen && (
                  <div style={{ background: "rgba(50,85,99,0.02)", borderTop: "1px dashed var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "20px" }}>
                    <div className="row g-5">

                      {/* LEFT — Job Details */}
                      <div className="col-6">
                        <h4 className="bold mb-1">{job.title || job.tiitle}</h4>
                        <p className="fs-p9 text-secondary mb-3">
                          🏢 {job.companyModel?.companyName} &nbsp;|&nbsp; 📍 {job.companyModel?.location}
                        </p>

                        {/* Company Card */}
                        {job.companyModel && (
                          <div className="card p-3 mb-3 row items-center g-3" style={{ background: "var(--gray-100)" }}>
                            <div className="bg-primary text-white br-circle bold"
                              style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>
                              {job.companyModel.companyName?.charAt(0) || "C"}
                            </div>
                            <div>
                              <p className="bold fs-p9">{job.companyModel.companyName}</p>
                              {job.companyModel.email && (
                                <p className="fs-p8 text-secondary">{job.companyModel.email}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {job.description && (
                          <div className="card p-3 mb-3" style={{ background: "var(--gray-100)" }}>
                            <p className="fs-p8 bold mb-1">📄 Job Description</p>
                            <p className="fs-p9" style={{ lineHeight: 1.7 }}>{job.description}</p>
                          </div>
                        )}

                        {/* Job Meta Cards */}
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

                      {/* RIGHT — Eligibility + Apply */}
                      <div className="col-6">
                        <div className="row space-between items-center mb-1">
                          <h5 className="bold">🎓 Your Eligibility</h5>
                          <span className="status-item fs-p8 bold"
                            style={{ background: eligible ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.08)", color: eligible ? "var(--success)" : "var(--danger)" }}>
                            {eligible ? "✅ Eligible" : "✗ Not Eligible"}
                          </span>
                        </div>

                        <p className="fs-p8 text-secondary mb-3">
                          Eligibility is based on your academic percentage / CGPA
                        </p>

                        {/* Eligibility Comparison */}
                        <div className="card p-3 mb-3">
                          {[
                            { label: "Required %",  value: job.eligiblePercentage || "—" },
                            { label: "Your %",       value: myProfile?.percentage  || "—", highlight: true },
                          ].map((row) => (
                            <div key={row.label} className="row space-between items-center"
                              style={{ padding: "6px 0", borderBottom: "1px solid var(--border-color)" }}>
                              <p className="fs-p9 text-secondary">{row.label}</p>
                              <p className="bold fs-p9" style={{ color: row.highlight ? (eligible ? "var(--success)" : "var(--danger)") : "inherit" }}>
                                {row.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* My Skills */}
                        {myProfile?.skills && (
                          <div className="card p-3 mb-3">
                            <p className="fs-p8 bold mb-2">🛠️ Your Skills</p>
                            <div className="row g-1" style={{ flexWrap: "wrap" }}>
                              {myProfile.skills.split(",").slice(0, 4).map((sk) => (
                                <span key={sk} className="fs-p7 br-md"
                                  style={{ background: "var(--gray-200)", padding: "2px 10px", color: "var(--gray-700)" }}>
                                  {sk.trim()}
                                </span>
                              ))}
                              {myProfile.skills.split(",").length > 4 && (
                                <span className="fs-p7 text-secondary">
                                  +{myProfile.skills.split(",").length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Apply / Applied / Not Eligible */}
                        {isApplied ? (
                          <div className="alert-success">
                            <p className="fs-p9 bold" style={{ color: "var(--success)" }}>
                              ✅ Application already submitted for this job.
                            </p>
                          </div>
                        ) : eligible && days > 0 ? (
                          <button
                            className="btn btn-primary"
                            style={{ marginTop: 8 }}
                            onClick={() => {
                              setShowModal(job);
                              setCoverLetter("");
                              setSelectedResume("");
                            }}
                          >
                            🚀 Apply Now
                          </button>
                        ) : !eligible ? (
                          <div className="alert-danger">
                            <p className="fs-p9" style={{ color: "var(--danger)" }}>
                              ✗ You do not meet the eligibility criteria for this job.
                            </p>
                          </div>
                        ) : (
                          <div className="alert-danger">
                            <p className="fs-p9" style={{ color: "var(--danger)" }}>
                              ❌ Application deadline has passed.
                            </p>
                          </div>
                        )}

                        {/* Deadline Warning */}
                        {days != null && days <= 7 && days > 0 && (
                          <div className="alert-info mt-3">
                            <p className="fs-p8 text-info">
                              ⏰ Only <strong>{days} day{days !== 1 ? "s" : ""}</strong> left to apply!
                            </p>
                          </div>
                        )}

                        {/* Info Note */}
                        <div className="alert-info mt-3">
                          <p className="fs-p8 text-info">
                            💡 <strong>Tip:</strong> Upload your latest resume in Profile to improve your application.
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
        <div className="modal-overlay">
          <div className="card modal-box p-5" style={{ width: 480, maxWidth: "95%" }}>

            <div className="row space-between items-center mb-3">
              <h4 className="bold">🚀 Apply for Job</h4>
              <span className="cursor-pointer fs-4 text-secondary"
                onClick={() => setShowModal(null)}>✕</span>
            </div>

            <p className="bold fs-p9 mb-1">
              {showModal.title || showModal.tiitle}
            </p>
            <p className="fs-p8 text-secondary mb-4">
              🏢 {showModal.companyModel?.companyName}
            </p>

            {/* Resume Select */}
            {myResumes.length > 0 ? (
              <div className="form-group mb-3">
                <label className="form-control-label">Select Resume</label>
                <select className="form-control" value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}>
                  <option value="">-- Choose a resume --</option>
                  {myResumes.map((r, i) => (
                    <option key={r.resumeId || i} value={r.resumeId || i}>
                      {r.fileName || r.name || `Resume ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="alert-info mb-3">
                <p className="fs-p8 text-info">
                  💡 No resumes uploaded yet. Go to your Profile to upload one.
                </p>
              </div>
            )}

            {/* Cover Letter */}
            <div className="form-group mb-4">
              <label className="form-control-label">Cover Letter (optional)</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Briefly describe why you're a good fit..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="row g-2">
              <button
                className="btn btn-primary"
                onClick={applyToJob}
                disabled={applying === showModal.jobPostId}
              >
                {applying === showModal.jobPostId ? "Submitting..." : "✅ Submit Application"}
              </button>
              <button className="btn btn-muted" onClick={() => setShowModal(null)}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default StudentJobPosts;