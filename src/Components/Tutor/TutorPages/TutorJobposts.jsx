import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const getEmailFromToken = () => {
  try {
    const token   = Cookies.get("token") || "";
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return (decoded.sub || decoded.email || "").toLowerCase();
  } catch { return ""; }
};

function Shimmer() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "var(--gray-100)", borderRadius: 8,
      padding: "10px 12px", marginBottom: 8,
      animation: "shimmer 1.4s ease-in-out infinite",
    }}>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gray-300)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 9, borderRadius: 4, background: "var(--gray-300)", width: "45%", marginBottom: 5 }} />
        <div style={{ height: 7, borderRadius: 4, background: "var(--gray-300)", width: "65%" }} />
      </div>
      <div style={{ width: 60, height: 9, borderRadius: 4, background: "var(--gray-300)" }} />
      <div style={{ width: 72, height: 26, borderRadius: 6, background: "var(--gray-300)" }} />
    </div>
  );
}

function TutorJobPosts() {
  const [jobs,           setJobs]           = useState([]);
  const [students,       setStudents]       = useState([]);
  const [allApps,        setAllApps]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [departmentName, setDepartmentName] = useState("");
  const [predictions,    setPredictions]    = useState({});
  const [descExpanded,   setDescExpanded]   = useState({});
  const runningRef = useRef(new Set());

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  };

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

  const fetchStudents = async () => {
    try {
      const loggedInEmail = getEmailFromToken();
      const tutorRes  = await axios.get(rest.tutor, header);
      const tutorList = tutorRes.data?.data || tutorRes.data || [];
      const allTutors = Array.isArray(tutorList) ? tutorList : [tutorList];
      const tutor = allTutors.find(
        (t) => (t.email || "").toLowerCase() === loggedInEmail
      ) || allTutors[0];

      console.log("Logged-in tutor email:", loggedInEmail);
      console.log("Matched tutor:", tutor);

      const tutorDeptId   = tutor?.departmentModel?.departmentId || tutor?.departmentId;
      const tutorDeptName = tutor?.departmentModel?.departmentName || "";

      if (!tutorDeptId) { setError("Tutor department not found."); return; }
      setDepartmentName(tutorDeptName);

      const studentRes  = await axios.get(rest.students, header);
      const allStudents = studentRes.data?.data || studentRes.data || [];

      const deptStudents = (Array.isArray(allStudents) ? allStudents : []).filter(
        (s) => String(s?.departmentModel?.departmentId || s?.departmentId) === String(tutorDeptId)
      );

      console.log(`Students loaded for dept ${tutorDeptName}:`, deptStudents.length, deptStudents);
      setStudents(deptStudents);
    } catch (err) {
      console.error("fetchStudents error:", err);
      setError("Failed to load students.");
    }
  };

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

  useEffect(() => {
    if (!expandedId || allApps.length === 0) return;
    const job = jobs.find((j) => j.jobPostId === expandedId);
    if (!job) return;
    getEligibleStudents(job).forEach((s) => triggerPrediction(s, job));
  }, [expandedId, allApps]);

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

  const recommendStudent = async (student, job) => {
    try {
      await axios.post(
        rest.jobSuggestions,
        { studentId: student.studentId || student.id, jobPostId: Number(job.jobPostId) },
        header
      );
      alert(`${student.name} recommended for "${job.title || job.tiitle}" successfully!`);
    } catch (err) {
      console.error("recommendStudent error:", err);
      alert("Failed to recommend student. Please try again.");
    }
  };

  const getEligibleStudents = (job) => {
    const minPct = parseFloat(job.eligiblePercentage) || 0;
    return students.filter((s) => (parseFloat(s.percentage) || 0) >= minPct);
  };

  const filteredJobs = jobs.filter((job) =>
    job.companyModel?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    (job.title || job.tiitle)?.toLowerCase().includes(search.toLowerCase())
  );

  const matchColor = (m) => m >= 80 ? "var(--success)" : m >= 60 ? "var(--warning)" : "var(--danger)";
  const rankColor  = (i) => ["#f59e0b", "#9ca3af", "#b45309"][i] ?? "var(--gray-300)";
  const predKey    = (s, j) => `${s.studentId || s.id}_${j.jobPostId}`;

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

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Job Posts</h2>
          <p className="fs-p9 text-secondary">
            {departmentName
              ? `Recommending students from: ${departmentName}`
              : "View job posts and recommend your department students"}
          </p>
        </div>
      </div>

      {error && <div className="alert-danger mb-4">{error}</div>}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Jobs",     value: totalJobs,  color: "var(--primary)" },
          { label: "Open Positions", value: totalOpen,  color: "var(--success)" },
          { label: "My Students",    value: myStudents, color: "var(--info)"    },
        ].map((stat, i) => (
          <div className="col-4 p-2" key={i}>
            <div className="card p-3 stat-card text-center">
              <h3 className="bold" style={{ color: stat.color }}>{stat.value}</h3>
              <p className="fs-p8 text-secondary mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="w-40 mb-3">
        <input type="text" className="form-control"
          placeholder="Search by company or job title..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Job List */}
      {loading ? (
        <p className="text-secondary p-4">Loading job posts...</p>
      ) : filteredJobs.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No jobs found</p>
          <p className="fs-p9 text-secondary">Try a different search term</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredJobs.map((job) => {
            const isOpen   = expandedId === job.jobPostId;
            const eligible = isOpen ? getEligibleStudents(job) : [];
            const desc     = job.description || "";
            const descKey  = job.jobPostId;
            const isDescExpanded = descExpanded[descKey];
            const descPreview = desc.length > 160 ? desc.slice(0, 160) + "…" : desc;

            return (
              <div key={job.jobPostId} className="card p-0" style={{
                overflow: "hidden",
                borderLeft: isOpen ? "4px solid var(--primary)" : "4px solid transparent",
                transition: "border-color 0.2s",
              }}>

                {/* ── Collapsed Job Card ── */}
                <div style={{
                  padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: 14,
                  background: isOpen ? "rgba(50,85,99,0.03)" : "#fff",
                  cursor: "pointer",
                }} onClick={() => setExpandedId(isOpen ? null : job.jobPostId)}>

                  {/* Company initial */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: "var(--primary)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "1rem",
                  }}>
                    {(job.companyModel?.companyName || "?").charAt(0).toUpperCase()}
                  </div>

                  {/* Title + company */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="bold fs-p9" style={{ marginBottom: 2 }}>{job.title || job.tiitle || "—"}</p>
                    <p className="fs-p8 text-secondary">
                      {job.companyModel?.companyName || "—"}
                      {job.companyModel?.location ? ` · ${job.companyModel.location}` : ""}
                    </p>
                  </div>

                  {/* Meta pills */}
                  <div className="row g-2 items-center" style={{ flexShrink: 0 }}>
                    {job.requiredCandidate && (
                      <span className="fs-p8" style={{
                        background: "rgba(14,165,233,0.1)", color: "var(--info)",
                        padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                      }}>
                        {job.requiredCandidate} openings
                      </span>
                    )}
                    {job.eligiblePercentage && (
                      <span className="fs-p8" style={{
                        background: "rgba(50,85,99,0.1)", color: "var(--primary)",
                        padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                      }}>
                        {job.eligiblePercentage}% eligible
                      </span>
                    )}
                    {job.lastDateToApply && (
                      <span className="fs-p8 text-secondary">
                        Due: {job.lastDateToApply}
                      </span>
                    )}
                    <span style={{
                      padding: "5px 14px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600,
                      background: isOpen ? "var(--primary)" : "var(--gray-200)",
                      color: isOpen ? "#fff" : "var(--gray-600)",
                    }}>
                      {isOpen ? "Close" : "View"}
                    </span>
                  </div>
                </div>

                {/* ── Expanded Panel ── */}
                {isOpen && (
                  <div style={{
                    borderTop: "1px dashed var(--border-color)",
                    display: "grid", gridTemplateColumns: "1fr 1px 1fr",
                    gap: 0,
                  }}>

                    {/* LEFT — Job Details */}
                    <div style={{ padding: "20px 20px 20px 22px" }}>
                      <p className="bold fs-p9 mb-3" style={{
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        color: "var(--primary)", fontSize: "0.7rem",
                      }}>
                        Job Details
                      </p>

                      {/* Meta grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                        {[
                          { label: "Openings",    value: job.requiredCandidate },
                          { label: "Eligibility", value: job.eligiblePercentage ? `${job.eligiblePercentage}%` : null },
                          { label: "Posted",      value: job.postedDate },
                          { label: "Last Date",   value: job.lastDateToApply },
                        ].filter((m) => m.value).map((m) => (
                          <div key={m.label} style={{
                            background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px",
                          }}>
                            <p className="fs-p8 text-secondary">{m.label}</p>
                            <p className="bold fs-p9 mt-1">{m.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Description — collapsible */}
                      {desc && (
                        <div style={{
                          background: "var(--gray-100)", borderRadius: 8,
                          padding: "12px 14px",
                          border: "1px solid var(--border-color)",
                        }}>
                          <p className="bold fs-p8 mb-2" style={{ color: "var(--gray-700)" }}>
                            Job Description
                          </p>
                          <p className="fs-p9" style={{ lineHeight: 1.75, color: "var(--gray-700)", wordBreak: "break-word" }}>
                            {isDescExpanded ? desc : descPreview}
                          </p>
                          {desc.length > 160 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDescExpanded((p) => ({ ...p, [descKey]: !p[descKey] })); }}
                              style={{
                                marginTop: 8, background: "none", border: "none",
                                color: "var(--primary)", cursor: "pointer",
                                fontSize: "0.78rem", fontWeight: 600, padding: 0,
                              }}
                            >
                              {isDescExpanded ? "Show less" : "Read more"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ background: "var(--border-color)" }} />

                    {/* RIGHT — Students */}
                    <div style={{ padding: "20px" }}>
                      <div className="row space-between items-center mb-1">
                        <p className="bold fs-p9" style={{
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          color: "var(--primary)", fontSize: "0.7rem",
                        }}>
                          Eligible Students
                        </p>
                        <span style={{
                          background: "rgba(50,85,99,0.1)", color: "var(--primary)",
                          fontSize: "0.72rem", fontWeight: 700,
                          padding: "2px 10px", borderRadius: 20,
                        }}>
                          {departmentName} · {eligible.length} students
                        </span>
                      </div>
                      <p className="fs-p8 text-secondary mb-3">
                        AI skill match auto-analyzed on open
                      </p>

                      {eligible.length === 0 ? (
                        <div className="card p-4 text-center">
                          <p className="fs-p9 text-secondary">No eligible students for this job.</p>
                        </div>
                      ) : (
                        /* Scrollable student list */
                        <div style={{
                          maxHeight: 340, overflowY: "auto",
                          display: "flex", flexDirection: "column", gap: 8,
                          paddingRight: 4,
                        }}>
                          {eligible.map((student, idx) => {
                            const key   = predKey(student, job);
                            const pred  = predictions[key];
                            const match = overallMatch(pred);

                            if (!pred || pred.status === "loading") return <Shimmer key={key} />;

                            return (
                              <div key={student.studentId || student.id || idx} style={{
                                background: "var(--gray-100)", borderRadius: 8,
                                padding: "10px 12px",
                                border: "1px solid var(--border-color)",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                                  {/* Rank */}
                                  <div style={{
                                    width: 22, height: 22, borderRadius: "50%",
                                    background: rankColor(idx), color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 700, fontSize: "0.68rem", flexShrink: 0,
                                  }}>{idx + 1}</div>

                                  {/* Avatar */}
                                  <div className="bg-primary text-white br-circle bold" style={{
                                    width: 30, height: 30,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "0.8rem", flexShrink: 0,
                                  }}>
                                    {student.name?.charAt(0) || "S"}
                                  </div>

                                  {/* Name + dept */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="bold fs-p9" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {student.name}
                                    </p>
                                    <p className="fs-p8 text-secondary">
                                      CGPA: {student.percentage || "—"}
                                    </p>
                                  </div>

                                  {/* Match score */}
                                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 52 }}>
                                    {pred.status === "error" ? (
                                      <p className="fs-p8" style={{ color: "var(--danger)" }}>—</p>
                                    ) : (
                                      <>
                                        <p className="bold fs-p9" style={{ color: matchColor(match) }}>{match}%</p>
                                        <div style={{
                                          height: 4, background: "var(--gray-300)",
                                          borderRadius: 999, marginTop: 3, overflow: "hidden", width: 52,
                                        }}>
                                          <div style={{
                                            width: `${match}%`, height: "100%",
                                            background: matchColor(match),
                                            borderRadius: 999, transition: "width 0.8s ease",
                                          }} />
                                        </div>
                                        <p className="fs-p7 text-secondary" style={{ marginTop: 2 }}>
                                          T:{pred.tech?.match_percentage ?? "—"} S:{pred.soft?.match_percentage ?? "—"}
                                        </p>
                                      </>
                                    )}
                                  </div>

                                  {/* Recommend */}
                                  <button className="btn btn-primary w-auto"
                                    style={{ padding: "5px 10px", fontSize: "0.74rem", flexShrink: 0 }}
                                    onClick={() => recommendStudent(student, job)}>
                                    Recommend
                                  </button>
                                </div>

                                {/* Skills row */}
                                {student.skills && (
                                  <div className="row g-1 mt-2" style={{ flexWrap: "wrap", paddingLeft: 62 }}>
                                    {student.skills.split(",").slice(0, 4).map((sk) => (
                                      <span key={sk} style={{
                                        background: "#fff", border: "1px solid var(--border-color)",
                                        borderRadius: 20, padding: "1px 8px",
                                        fontSize: "0.68rem", color: "var(--gray-600)",
                                      }}>{sk.trim()}</span>
                                    ))}
                                    {student.skills.split(",").length > 4 && (
                                      <span className="fs-p7 text-secondary">
                                        +{student.skills.split(",").length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {pred.status === "error" && (
                                  <p className="fs-p8 mt-1" style={{ color: "var(--danger)", paddingLeft: 62 }}>
                                    {pred.msg}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
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