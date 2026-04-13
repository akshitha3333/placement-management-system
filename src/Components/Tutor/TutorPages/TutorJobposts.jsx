import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function TutorJobPosts() {

  // ── State ──────────────────────────────────────────────
  const [jobs,           setJobs]           = useState([]);
  const [students,       setStudents]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [departmentName, setDepartmentName] = useState("");

  // ── Auth Header ────────────────────────────────────────
  const header = {
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}` },
  };

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

  // ── Fetch: Tutor dept → match → filter students ────────
  const fetchStudents = async () => {
    try {
      // Step 1: GET /api/actors/tutors → find tutor's departmentId
      const tutorRes  = await axios.get(rest.tutor, header);
      const tutorList = tutorRes.data?.data || tutorRes.data || [];
      const tutor     = Array.isArray(tutorList) ? tutorList[0] : tutorList;

      const tutorDeptId   = tutor?.departmentModel?.departmentId || tutor?.departmentId;
      const tutorDeptName = tutor?.departmentModel?.departmentName || "";

      if (!tutorDeptId) {
        setError("Tutor department not found. Please contact admin.");
        return;
      }

      setDepartmentName(tutorDeptName);

      // Step 2: GET /api/actors/students → all students
      const studentRes  = await axios.get(rest.students, header);
      const allStudents = studentRes.data?.data || studentRes.data || [];

      // Step 3: Keep only students whose departmentId matches tutor's departmentId
      const matched = allStudents.filter((student) => {
        const studentDeptId = student?.departmentModel?.departmentId || student?.departmentId;
        return String(studentDeptId) === String(tutorDeptId);
      });

      setStudents(matched);

    } catch (err) {
      console.error("fetchStudents error:", err);
      setError("Failed to load students.");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchStudents()]);
      setLoading(false);
    };
    init();
  }, []);

  // ── Recommend: POST /api/job/job-suggestions ──────────
  const recommendStudent = async (student, job) => {
    try {
      await axios.post(
        rest.jobSuggestions,
        {
          studentId: student.studentId || student.id,
          jobPostId: job.jobPostId,
        },
        header
      );
      alert(`✅ ${student.name} recommended for "${job.title || job.tiitle}" successfully!`);
    } catch (err) {
      console.error("recommendStudent error:", err);
      alert("Failed to recommend student. Please try again.");
    }
  };

  // ── Compute match % for a student against a job ────────
  const computeMatch = (student, job) => {
    // CGPA contributes 70% of score
    const cgpaScore = Math.min(70, ((student.percentage || 0) / 10) * 70);

    // Skills keyword match contributes 30% of score
    const jobKeywords   = `${job.title || job.tiitle || ""} ${job.description || ""}`.toLowerCase();
    const studentSkills = (student.skills || "").split(",").map((s) => s.trim().toLowerCase());
    const matchedSkills = studentSkills.filter((sk) => sk && jobKeywords.includes(sk));
    const skillScore    = Math.min(30, (matchedSkills.length / Math.max(studentSkills.length, 1)) * 30);

    return Math.round(cgpaScore + skillScore);
  };

  // ── Get eligible + ranked students for a job ──────────
  const getRankedStudents = (job) => {
    const minPct = parseFloat(job.eligiblePercentage) || 0;
    return students
      .filter((s) => (parseFloat(s.percentage) || 0) >= minPct)   // eligibility filter
      .map((s)    => ({ ...s, match: computeMatch(s, job) }))      // compute match %
      .sort((a, b) => b.match - a.match)                           // rank by match
      .slice(0, 5);                                                 // top 5 only
  };

  // ── Search filter ──────────────────────────────────────
  const filteredJobs = jobs.filter((job) =>
    job.companyModel?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    (job.title || job.tiitle)?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Stats ──────────────────────────────────────────────
  const totalJobs  = jobs.length;
  const totalOpen  = jobs.filter((j) => j.requiredCandidate > 0).length;
  const myStudents = students.length;

  // ── Helpers ───────────────────────────────────────────
  const matchColor = (m) =>
    m >= 80 ? "var(--success)" : m >= 60 ? "var(--warning)" : "var(--danger)";

  const rankColor = (i) =>
    ["#f59e0b", "#9ca3af", "#b45309", "#e5e7eb", "#e5e7eb"][i] ?? "#e5e7eb";

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* ── Page Title ── */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">💼 Job Posts</h2>
          <p className="fs-p9 text-secondary">
            {departmentName
              ? `Recommending students from: ${departmentName}`
              : "View job posts and recommend your department students"}
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
          { label: "Total Jobs",     value: totalJobs,  icon: "💼", color: "var(--primary)" },
          { label: "Open Positions", value: totalOpen,  icon: "🟢", color: "var(--success)" },
          { label: "My Students",    value: myStudents, icon: "👨‍🎓", color: "var(--info)"    },
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

      {/* ── Job List ── */}
      {loading ? (
        <p className="text-secondary p-4">Loading job posts...</p>
      ) : filteredJobs.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="fs-4">📭</p>
          <p className="bold mt-2">No jobs found</p>
          <p className="fs-p9 text-secondary">Try a different search term</p>
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
            <div className="col-2 text-center">Last Date</div>
            <div className="col-1 text-center">Action</div>
          </div>

          {/* ── Job Rows ── */}
          {filteredJobs.map((job) => {
            const isOpen      = expandedId === job.jobPostId;
            const jobStudents = isOpen ? getRankedStudents(job) : [];

            return (
              <div key={job.jobPostId}>

                {/* ── Collapsed Row ── */}
                <div className="row items-center"
                  style={{ padding: "12px 16px", borderBottom: isOpen ? "none" : "1px solid var(--border-color)", background: isOpen ? "rgba(50,85,99,0.03)" : "#fff" }}>

                  {/* Job Title */}
                  <div className="col-3 bold fs-p9">{job.title || job.tiitle || "—"}</div>

                  {/* Company */}
                  <div className="col-2 fs-p9 text-secondary">{job.companyModel?.companyName || "—"}</div>

                  {/* Location */}
                  <div className="col-2 fs-p9 text-secondary">📍 {job.companyModel?.location || "—"}</div>

                  {/* Openings */}
                  <div className="col-1 text-center fs-p9">👥 {job.requiredCandidate || "—"}</div>

                  {/* Eligibility */}
                  <div className="col-1 text-center fs-p9">
                    {job.eligiblePercentage ? `${job.eligiblePercentage}%` : "—"}
                  </div>

                  {/* Last Date */}
                  <div className="col-2 text-center fs-p8 text-secondary">{job.lastDateToApply || "—"}</div>

                  {/* View / Close */}
                  <div className="col-1 text-center">
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
                            { icon: "📅", label: "Posted",      value: job.postedDate        },
                            { icon: "⏰", label: "Last Date",   value: job.lastDateToApply   },
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

                      {/* RIGHT — Recommended Students */}
                      <div className="col-6">
                        <div className="row space-between items-center mb-1">
                          <h5 className="bold">🎯 Recommended Students</h5>
                          <span className="status-item fs-p8 bold"
                            style={{ background: "rgba(50,85,99,0.1)", color: "var(--primary)" }}>
                            {departmentName} Dept
                          </span>
                        </div>

                        <p className="fs-p8 text-secondary mb-3">
                          Eligible students ranked by CGPA + skill match — top 5 shown
                        </p>

                        {/* Student Cards */}
                        {jobStudents.length === 0 ? (
                          <div className="card p-3 text-center">
                            <p className="fs-p8 text-secondary">
                              No eligible students in your department for this job.
                            </p>
                          </div>
                        ) : (
                          jobStudents.map((student, idx) => (
                            <div key={student.studentId || idx}
                              className="card p-2 row items-center g-2 mb-2">

                              {/* Rank Badge */}
                              <div className="br-circle"
                                style={{ width: 26, height: 26, background: rankColor(idx), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.72rem", flexShrink: 0 }}>
                                {idx + 1}
                              </div>

                              {/* Avatar */}
                              <div className="bg-primary text-white br-circle bold"
                                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem", flexShrink: 0 }}>
                                {student.name?.charAt(0) || "S"}
                              </div>

                              {/* Name + Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p className="bold fs-p9">{student.name}</p>
                                <p className="fs-p8 text-secondary">
                                  {student.departmentModel?.departmentName || departmentName} • CGPA: {student.percentage || "—"}
                                </p>

                                {/* Skills */}
                                {student.skills && (
                                  <div className="row g-1 mt-1">
                                    {student.skills.split(",").slice(0, 3).map((sk) => (
                                      <span key={sk} className="fs-p7 br-md"
                                        style={{ background: "var(--gray-200)", padding: "1px 8px", color: "var(--gray-700)" }}>
                                        {sk.trim()}
                                      </span>
                                    ))}
                                    {student.skills.split(",").length > 3 && (
                                      <span className="fs-p7 text-secondary">
                                        +{student.skills.split(",").length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Match % + Bar */}
                              <div style={{ width: 70, textAlign: "right", flexShrink: 0 }}>
                                <p className="bold fs-p9" style={{ color: matchColor(student.match) }}>
                                  {student.match}%
                                </p>
                                <div style={{ height: 5, background: "var(--gray-200)", borderRadius: 999, marginTop: 4, overflow: "hidden" }}>
                                  <div style={{ width: `${student.match}%`, height: "100%", background: matchColor(student.match), borderRadius: 999 }} />
                                </div>
                              </div>

                              {/* Recommend Button → POST /api/job/job-suggestions */}
                              <button
                                className="btn btn-primary w-auto"
                                style={{ padding: "5px 10px", fontSize: "0.76rem", flexShrink: 0 }}
                                onClick={() => recommendStudent(student, job)}
                              >
                                Recommend
                              </button>

                            </div>
                          ))
                        )}

                        {/* Info Note */}
                        <div className="alert-info mt-3">
                          <p className="fs-p8 text-info">
                            🤖 <strong>Match Score:</strong> CGPA (70%) + skill keyword overlap (30%).
                            Only <strong>{departmentName}</strong> students shown.
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

    </div>
  );
}

export default TutorJobPosts;