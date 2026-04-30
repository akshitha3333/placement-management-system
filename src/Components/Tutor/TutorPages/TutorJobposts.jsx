import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

/* ── Shimmer placeholder while prediction loads ────────── */
function Shimmer() {
  return (
    <div className="card p-2 row items-center g-2 mb-2"
      style={{ border: "1px solid var(--border-color)" }}>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--gray-200)", animation: "shimmer 1.4s ease-in-out infinite" }} />
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gray-200)", animation: "shimmer 1.4s ease-in-out infinite" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 10, borderRadius: 4, background: "var(--gray-200)", width: "50%", marginBottom: 6, animation: "shimmer 1.4s ease-in-out infinite" }} />
        <div style={{ height: 8, borderRadius: 4, background: "var(--gray-200)", width: "70%", animation: "shimmer 1.4s ease-in-out infinite" }} />
      </div>
      <div style={{ width: 70 }}>
        <div style={{ height: 10, borderRadius: 4, background: "var(--gray-200)", width: "60%", marginBottom: 6, marginLeft: "auto", animation: "shimmer 1.4s ease-in-out infinite" }} />
        <div style={{ height: 5, borderRadius: 999, background: "var(--gray-200)", animation: "shimmer 1.4s ease-in-out infinite" }} />
      </div>
      <div style={{ width: 80, height: 28, borderRadius: 6, background: "var(--gray-200)", animation: "shimmer 1.4s ease-in-out infinite" }} />
    </div>
  );
}

function TutorJobPosts() {

  // ── State ──────────────────────────────────────────────
  const [jobs,           setJobs]           = useState([]);
  const [students,       setStudents]       = useState([]);
  const [allApps,        setAllApps]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [departmentName, setDepartmentName] = useState("");
  // predictions[key] = { status: "loading"|"done"|"error", tech, soft, msg }
  const [predictions,    setPredictions]    = useState({});
  const runningRef = useRef(new Set());

  // ── Auth Header ────────────────────────────────────────
  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── Fetch jobs ─────────────────────────────────────────
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

  // ── Fetch tutor dept → filter students ────────────────
  const fetchStudents = async () => {
    try {
      const tutorRes  = await axios.get(rest.tutor, header);
      const tutorList = tutorRes.data?.data || tutorRes.data || [];
      const tutor     = Array.isArray(tutorList) ? tutorList[0] : tutorList;

      const tutorDeptId   = tutor?.departmentModel?.departmentId || tutor?.departmentId;
      const tutorDeptName = tutor?.departmentModel?.departmentName || "";

      if (!tutorDeptId) { setError("Tutor department not found."); return; }
      setDepartmentName(tutorDeptName);

      const studentRes  = await axios.get(rest.students, header);
      const allStudents = studentRes.data?.data || studentRes.data || [];

      setStudents(
        (Array.isArray(allStudents) ? allStudents : []).filter((s) =>
          String(s?.departmentModel?.departmentId || s?.departmentId) === String(tutorDeptId)
        )
      );
    } catch (err) {
      console.error("fetchStudents error:", err);
      setError("Failed to load students.");
    }
  };

  // ── Fetch all job applications once (to get resumes) ──
  const fetchApps = async () => {
    try {
      const res  = await axios.get(rest.jobApplications, header);
      const list = res.data?.data || res.data || [];
      setAllApps(Array.isArray(list) ? list : []);
    } catch { /* non-fatal */ }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchStudents(), fetchApps()]);
      setLoading(false);
    };
    init();
  }, []);

  // ── Auto-run predictions when a job is expanded ────────
  useEffect(() => {
    if (!expandedId || allApps.length === 0) return;
    const job = jobs.find((j) => j.jobPostId === expandedId);
    if (!job) return;
    getEligibleStudents(job).forEach((s) => triggerPrediction(s, job));
  }, [expandedId, allApps]);

  // ── Build a File object from a student's resume ────────
  const getResumeFile = (studentId) => {
    const sid = String(studentId);
    const app = allApps.find((a) => {
      const i1 = String(a.resumeModel?.studentModel?.studentId || a.resumeModel?.studentModel?.id || "");
      const i2 = String(a.jobSuggestionModel?.studentModel?.studentId || a.jobSuggestionModel?.studentModel?.id || "");
      return (i1 === sid || i2 === sid) && !!a.resumeModel?.resume2;
    });
    if (!app) return null;
    const rm  = app.resumeModel;
    const b64 = rm.resume2.startsWith("data:") ? rm.resume2.split(",")[1] : rm.resume2;
    try {
      const bin   = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new File(
        [new Blob([bytes], { type: "application/pdf" })],
        (rm.resumeTitle || "resume") + ".pdf",
        { type: "application/pdf" }
      );
    } catch { return null; }
  };

  // ── Run prediction for one student+job (idempotent) ───
  const triggerPrediction = async (student, job) => {
    const sid = student.studentId || student.id;
    const key = `${sid}_${job.jobPostId}`;
    if (runningRef.current.has(key)) return;

    setPredictions((prev) => {
      if (prev[key]?.status === "done" || prev[key]?.status === "loading") return prev;
      return { ...prev, [key]: { status: "loading", tech: null, soft: null, msg: "" } };
    });

    runningRef.current.add(key);
    try {
      const file = getResumeFile(sid);
      if (!file) {
        setPredictions((prev) => ({
          ...prev,
          [key]: { status: "error", tech: null, soft: null, msg: "No resume uploaded yet." },
        }));
        return;
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("job_description", job.description || job.title || job.tiitle || "");

      const res = await axios.post("http://localhost:8081/placement-prediction", fd, {
        headers: { Authorization: `Bearer ${Cookies.get("token")}` },
      });

      const { technical_skills: tech, soft_skills: soft } = res.data;
      setPredictions((prev) => ({
        ...prev,
        [key]: { status: "done", tech, soft, msg: "" },
      }));
    } catch (err) {
      let msg = "Prediction failed.";
      if (err.code === "ERR_NETWORK")        msg = "Flask API not running on port 8081.";
      else if (err.response?.status === 401) msg = "Unauthorized. Re-login.";
      else if (err.response?.data?.error)    msg = err.response.data.error;
      setPredictions((prev) => ({
        ...prev,
        [key]: { status: "error", tech: null, soft: null, msg },
      }));
    } finally {
      runningRef.current.delete(key);
    }
  };

  // ── Recommend student → POST job-suggestions ──────────
  const recommendStudent = async (student, job) => {
    try {
      await axios.post(
        rest.jobSuggestions,
        { studentId: student.studentId || student.id, jobPostId: Number(job.jobPostId) },
        header
      );
      alert(`✅ ${student.name} recommended for "${job.title || job.tiitle}" successfully!`);
    } catch (err) {
      console.error("recommendStudent error:", err);
      alert("Failed to recommend student. Please try again.");
    }
  };

  // ── Get eligible students for a job ───────────────────
  const getEligibleStudents = (job) => {
    const minPct = parseFloat(job.eligiblePercentage) || 0;
    return students.filter((s) => (parseFloat(s.percentage) || 0) >= minPct);
  };

  // ── Search filter ──────────────────────────────────────
  const filteredJobs = jobs.filter((job) =>
    job.companyModel?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    (job.title || job.tiitle)?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Helpers ────────────────────────────────────────────
  const matchColor = (m) =>
    m >= 80 ? "var(--success)" : m >= 60 ? "var(--warning)" : "var(--danger)";

  const rankColor = (i) =>
    ["#f59e0b", "#9ca3af", "#b45309", "#e5e7eb", "#e5e7eb"][i] ?? "#e5e7eb";

  const predKey   = (s, j) => `${s.studentId || s.id}_${j.jobPostId}`;

  // ── Overall match % = avg of tech + soft ──────────────
  const overallMatch = (pred) => {
    if (!pred || pred.status !== "done") return null;
    const t = pred.tech?.match_percentage;
    const s = pred.soft?.match_percentage;
    if (t != null && s != null) return Math.round((t + s) / 2);
    if (t != null) return Math.round(t);
    if (s != null) return Math.round(s);
    return 0;
  };

  const totalJobs  = jobs.length;
  const totalOpen  = jobs.filter((j) => j.requiredCandidate > 0).length;
  const myStudents = students.length;

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Page Title */}
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

      {error && <div className="alert-danger mb-4">⚠️ {error}</div>}

      {/* Stats Row */}
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

      {/* Search */}
      <div className="w-40 mb-3">
        <input type="text" className="form-control"
          placeholder="🔍 Search by company or job title..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Job List */}
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

          {/* Table Header */}
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

          {/* Job Rows */}
          {filteredJobs.map((job) => {
            const isOpen      = expandedId === job.jobPostId;
            const eligible    = isOpen ? getEligibleStudents(job) : [];

            return (
              <div key={job.jobPostId}>

                {/* Collapsed Row */}
                <div className="row items-center"
                  style={{ padding: "12px 16px", borderBottom: isOpen ? "none" : "1px solid var(--border-color)", background: isOpen ? "rgba(50,85,99,0.03)" : "#fff" }}>
                  <div className="col-3 bold fs-p9">{job.title || job.tiitle || "—"}</div>
                  <div className="col-2 fs-p9 text-secondary">{job.companyModel?.companyName || "—"}</div>
                  <div className="col-2 fs-p9 text-secondary">📍 {job.companyModel?.location || "—"}</div>
                  <div className="col-1 text-center fs-p9">👥 {job.requiredCandidate || "—"}</div>
                  <div className="col-1 text-center fs-p9">
                    {job.eligiblePercentage ? `${job.eligiblePercentage}%` : "—"}
                  </div>
                  <div className="col-2 text-center fs-p8 text-secondary">{job.lastDateToApply || "—"}</div>
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

                {/* Expanded Panel */}
                {isOpen && (
                  <div style={{ background: "rgba(50,85,99,0.02)", borderTop: "1px dashed var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "20px" }}>
                    <div className="row g-5">

                      {/* LEFT — Job Details */}
                      <div className="col-6">
                        <h4 className="bold mb-1">{job.title || job.tiitle}</h4>
                        <p className="fs-p9 text-secondary mb-3">
                          🏢 {job.companyModel?.companyName} &nbsp;|&nbsp; 📍 {job.companyModel?.location}
                        </p>

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
                          Eligible students with AI skill match — auto-analyzed on open
                        </p>

                        {eligible.length === 0 ? (
                          <div className="card p-3 text-center">
                            <p className="fs-p8 text-secondary">
                              No eligible students in your department for this job.
                            </p>
                          </div>
                        ) : (
                          eligible.map((student, idx) => {
                            const key   = predKey(student, job);
                            const pred  = predictions[key];
                            const match = overallMatch(pred);

                            // show shimmer while loading
                            if (!pred || pred.status === "loading") return <Shimmer key={key} />;

                            return (
                              <div key={student.studentId || student.id || idx}>

                                {/* Student row — same UI as code 2 */}
                                <div className="card p-2 row items-center g-2 mb-2">

                                  {/* Rank badge */}
                                  <div className="br-circle"
                                    style={{ width: 26, height: 26, background: rankColor(idx), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.72rem", flexShrink: 0 }}>
                                    {idx + 1}
                                  </div>

                                  {/* Avatar */}
                                  <div className="bg-primary text-white br-circle bold"
                                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem", flexShrink: 0 }}>
                                    {student.name?.charAt(0) || "S"}
                                  </div>

                                  {/* Name + info */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="bold fs-p9">{student.name}</p>
                                    <p className="fs-p8 text-secondary">
                                      {student.departmentModel?.departmentName || departmentName} • CGPA: {student.percentage || "—"}
                                    </p>
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

                                  {/* Match % + bar (real AI score) */}
                                  <div style={{ width: 70, textAlign: "right", flexShrink: 0 }}>
                                    {pred.status === "error" ? (
                                      <p className="fs-p8" style={{ color: "var(--danger)" }}>—</p>
                                    ) : (
                                      <>
                                        <p className="bold fs-p9" style={{ color: matchColor(match) }}>
                                          {match}%
                                        </p>
                                        <div style={{ height: 5, background: "var(--gray-200)", borderRadius: 999, marginTop: 4, overflow: "hidden" }}>
                                          <div style={{ width: `${match}%`, height: "100%", background: matchColor(match), borderRadius: 999, transition: "width 0.8s ease" }} />
                                        </div>
                                        {/* tech / soft breakdown below bar */}
                                        <p className="fs-p7 text-secondary" style={{ marginTop: 3 }}>
                                          T:{pred.tech?.match_percentage ?? "—"}% S:{pred.soft?.match_percentage ?? "—"}%
                                        </p>
                                      </>
                                    )}
                                  </div>

                                  {/* Recommend button */}
                                  <button className="btn btn-primary w-auto"
                                    style={{ padding: "5px 10px", fontSize: "0.76rem", flexShrink: 0 }}
                                    onClick={() => recommendStudent(student, job)}>
                                    Recommend
                                  </button>
                                </div>

                                {/* Error message if prediction failed */}
                                {pred.status === "error" && (
                                  <div className="br-md p-2 mb-2"
                                    style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", marginTop: -6 }}>
                                    <p className="fs-p7" style={{ color: "var(--danger)" }}>⚠️ {pred.msg}</p>
                                  </div>
                                )}

                              </div>
                            );
                          })
                        )}

                        {/* Info note
                        <div className="alert-info mt-3">
                          <p className="fs-p8 text-info">
                            🤖 <strong>Match Score:</strong> AI-analyzed from student resume vs job description.
                            T = Technical · S = Soft Skills. Only <strong>{departmentName}</strong> students shown.
                          </p>
                        </div> */}

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