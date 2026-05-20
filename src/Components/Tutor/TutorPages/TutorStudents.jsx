import { useState, useEffect } from "react";
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

function getPrimaryResume(resumeList) {
  if (!resumeList || resumeList.length === 0) return null;
  const saved = localStorage.getItem("primaryResumeId");
  if (saved) {
    const found = resumeList.find((r) => String(r.resumeId) === saved);
    if (found) return found;
  }
  return resumeList[0];
}

function TutorStudents() {
  const [students,         setStudents]         = useState([]);
  const [jobs,             setJobs]             = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");
  const [departmentName,   setDepartmentName]   = useState("");
  const [selectedStudent,  setSelectedStudent]  = useState(null);
  const [selectedJob,      setSelectedJob]      = useState("");
  const [search,           setSearch]           = useState("");
  const [filterStatus,     setFilterStatus]     = useState("");
  const [predicting,       setPredicting]       = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError,  setPredictionError]  = useState("");
  const [usedResumeName,   setUsedResumeName]   = useState("");
  // ── NEW: Set of "studentId_jobPostId" already assigned by this tutor
  const [assignedSet,      setAssignedSet]      = useState(new Set());

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  };

  const fetchStudents = async () => {
    try {
      setLoading(true); setError("");
      const loggedInEmail = getEmailFromToken();
      const tutorRes  = await axios.get(rest.tutor, header);
      const tutorList = tutorRes.data?.data || tutorRes.data || [];
      const allTutors = Array.isArray(tutorList) ? tutorList : [tutorList];
      const tutor = allTutors.find((t) => (t.email || "").toLowerCase() === loggedInEmail) || allTutors[0];
      const tutorDeptId   = tutor?.departmentModel?.departmentId || tutor?.departmentId;
      const tutorDeptName = tutor?.departmentModel?.departmentName || "";
      if (!tutorDeptId) { setError("Tutor department not found."); return; }
      setDepartmentName(tutorDeptName);
      const studentRes  = await axios.get(rest.students, header);
      const allStudents = studentRes.data?.data || studentRes.data || [];
      const deptStudents = (Array.isArray(allStudents) ? allStudents : []).filter(
        (s) => String(s?.departmentModel?.departmentId || s?.departmentId) === String(tutorDeptId)
      );
      setStudents(deptStudents);
    } catch (err) {
      console.error("fetchStudents error:", err);
      setError("Failed to load students.");
    } finally { setLoading(false); }
  };

  const fetchJobs = async () => {
    try {
      const res  = await axios.get(rest.jobPost, header);
      const list = res.data?.data || res.data || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch (err) { console.error("fetchJobs error:", err); }
  };

  
  const fetchExistingAssignments = async () => {
    try {
      const res  = await axios.get(rest.jobSuggestions, header);
      const list = res.data?.data || res.data || [];
      const arr  = Array.isArray(list) ? list : [];
      const keys = new Set(
        arr.map((s) => {
          const sid = s.studentModel?.studentId || s.studentId;
          const jid = s.jobPostModel?.jobPostId  || s.jobPostId;
          return `${sid}_${jid}`;
        })
      );
      setAssignedSet(keys);
    } catch (err) {
      // Non-fatal
      console.error("fetchExistingAssignments error:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchJobs();
    fetchExistingAssignments();
  }, []);

  const closeModal = () => {
    setSelectedStudent(null);
    setSelectedJob("");
    setPredictionResult(null);
    setPredictionError("");
    setUsedResumeName("");
  };

  const assignJob = async () => {
    if (!selectedStudent || !selectedJob) return;
    const sid = selectedStudent.studentId || selectedStudent.id;
    const jid = Number(selectedJob);
    const key = `${sid}_${jid}`;

    if (assignedSet.has(key)) return;

    try {
      await axios.post(rest.jobSuggestions, { studentId: sid, jobPostId: jid }, header);
      setAssignedSet((prev) => new Set([...prev, key]));
      alert("Student assigned to job successfully!");
      closeModal();
    } catch (err) {
      alert("Failed to assign: " + (err.response?.data?.message || err.message));
    }
  };

  const selectedJobData = jobs.find((j) => String(j.jobPostId) === String(selectedJob));

  // ── Whether the currently selected student+job combo is already assigned
  const isCurrentComboAssigned = (() => {
    if (!selectedStudent || !selectedJob) return false;
    const sid = selectedStudent.studentId || selectedStudent.id;
    return assignedSet.has(`${sid}_${Number(selectedJob)}`);
  })();

  const runPrediction = async () => {
    if (!selectedStudent || !selectedJobData) return;
    setPredicting(true); setPredictionResult(null); setPredictionError(""); setUsedResumeName("");
    try {
      const sid = selectedStudent.studentId || selectedStudent.id;
      const resumeRes  = await axios.get(`${rest.studentResume}/${sid}`, header);
      const resumeList = resumeRes.data?.data || resumeRes.data || [];
      const allResumes = Array.isArray(resumeList) ? resumeList : [];
      const primaryResume = getPrimaryResume(allResumes);
      if (!primaryResume?.resume2) {
        setPredictionError("No resume found for this student."); return;
      }
      setUsedResumeName(primaryResume.resumeTitle || "Primary Resume");
      const b64  = primaryResume.resume2.startsWith("data:") ? primaryResume.resume2.split(",")[1] : primaryResume.resume2;
      const bin  = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const file = new File([new Blob([bytes], { type: "application/pdf" })],
        (primaryResume.resumeTitle || "resume") + ".pdf", { type: "application/pdf" });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("job_description", selectedJobData.description || selectedJobData.tiitle || "");
      const res = await axios.post("http://localhost:8081/placement-prediction", fd, {
        headers: { Authorization: `Bearer ${Cookies.get("token")}` },
      });
      setPredictionResult(res.data);
    } catch (err) {
      if (err.code === "ERR_NETWORK")        setPredictionError("Flask API not running on port 8081.");
      else if (err.response?.status === 401) setPredictionError("Unauthorized. Please log in again.");
      else if (err.response?.status === 404) setPredictionError("No resume found for this student.");
      else setPredictionError("Prediction failed: " + (err.response?.data?.error || err.message));
    } finally { setPredicting(false); }
  };

  const filtered = students.filter((s) => {
    const term        = search.toLowerCase();
    const matchSearch = !search || s.name?.toLowerCase().includes(term) || s.rollNumber?.includes(search);
    const matchStatus = !filterStatus || (
  filterStatus.toUpperCase() === "UNPLACED"
    ? (s.workingStatus || "").toUpperCase() !== "PLACED"
    : (s.workingStatus || "").toUpperCase() === filterStatus.toUpperCase()
);
    return matchSearch && matchStatus;
  });

  const total    = students.length;
  const placed   = students.filter((s) => (s.workingStatus || "").toUpperCase() === "PLACED").length;
  const unplaced = total - placed;
  const cgpaColor = (p) => p >= 8 ? "var(--success)" : p >= 6 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">My Students</h2>
          <p className="fs-p9 text-secondary">
            {departmentName ? `Department: ${departmentName}` : "Loading..."}
          </p>
        </div>
      </div>

      {error && <div className="alert-danger mb-4">{error}</div>}

      {/* Stats — clickable to filter */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Students", value: total,    color: "var(--primary)", status: ""         },
          { label: "Placed",         value: placed,   color: "var(--success)", status: "PLACED"   },
          { label: "Unplaced",       value: unplaced, color: "var(--warning)", status: "UNPLACED" },
        ].map((stat, i) => (
          <div className="col-4 p-2" key={i}>
            <div className="card p-3 stat-card text-center"
              style={{
                borderTop: `3px solid ${stat.color}`, cursor: "pointer",
                opacity: filterStatus && filterStatus !== stat.status && stat.status ? 0.6 : 1,
              }}
              onClick={() => setFilterStatus((filterStatus || "").toUpperCase() === (stat.status || "").toUpperCase() ? "" : stat.status)}>
              <h3 className="bold" style={{ color: stat.color }}>{stat.value}</h3>
              <p className="fs-p8 text-secondary mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="row mb-4" style={{ gap: 12 }}>
        <div className="w-40">
          <input type="text" className="form-control"
            placeholder="Search by name or roll number..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 180 }}>
          <select className="form-control" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Students</option>
            <option value="PLACED">Placed Only</option>
            <option value="UNPLACED">Unplaced Only</option>
          </select>
        </div>
      </div>

      {/* Student Cards */}
      {loading ? (
        <p className="text-secondary p-4">Loading students...</p>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No students found</p>
          <p className="fs-p9 text-secondary mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {filtered.map((student, idx) => {
            const isPlaced = (student.workingStatus || "").toUpperCase() === "PLACED";
            const pct      = parseFloat(student.percentage) || 0;
            return (
              <div key={student.studentId || student.id || idx} className="card p-4"
                style={{
                  borderTop: `3px solid ${isPlaced ? "var(--success)" : "var(--gray-300)"}`,
                  // ── Placed cards are visually dimmed
                  opacity: isPlaced ? 0.75 : 1,
                }}>

                <div className="row space-between items-center mb-3">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="bg-primary text-white br-circle bold" style={{
                      width: 38, height: 38,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.9rem", flexShrink: 0,
                    }}>
                      {student.name?.charAt(0) || "S"}
                    </div>
                    <div>
                      <p className="bold fs-p9">{student.name}</p>
                      <p className="fs-p8 text-secondary">{student.rollNumber || "—"}</p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 700,
                    padding: "3px 10px", borderRadius: 20,
                    background: isPlaced ? "rgba(22,163,74,0.12)" : "rgba(107,114,128,0.1)",
                    color: isPlaced ? "var(--success)" : "var(--gray-500)",
                    border: `1px solid ${isPlaced ? "rgba(22,163,74,0.3)" : "rgba(107,114,128,0.2)"}`,
                    flexShrink: 0,
                  }}>
                    {isPlaced ? "✓ Placed" : "Unplaced"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: "var(--gray-100)", borderRadius: 6, padding: "6px 10px" }}>
                    <p className="fs-p8 text-secondary">CGPA</p>
                    <p className="bold fs-p9" style={{ color: cgpaColor(pct) }}>{student.percentage || "—"}</p>
                  </div>
                  <div style={{ background: "var(--gray-100)", borderRadius: 6, padding: "6px 10px" }}>
                    <p className="fs-p8 text-secondary">Year</p>
                    <p className="bold fs-p9">{student.year ? `Year ${student.year}` : "—"}</p>
                  </div>
                </div>

                {isPlaced && student.companyName && (
                  <div style={{
                    background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)",
                    borderRadius: 6, padding: "6px 10px", marginBottom: 10,
                  }}>
                    <p className="fs-p8 text-secondary">Placed at</p>
                    <p className="bold fs-p9" style={{ color: "var(--success)" }}>{student.companyName}</p>
                  </div>
                )}

                {/* ── Placed: disabled button with tooltip. Unplaced: normal Assign Job button ── */}
                {isPlaced ? (
                  <button
                    className="btn w-100"
                    disabled
                    style={{
                      padding: "8px", fontSize: "0.82rem", borderRadius: 8,
                      background: "rgba(22,163,74,0.08)",
                      color: "var(--success)",
                      border: "1px solid rgba(22,163,74,0.25)",
                      cursor: "not-allowed",
                    }}
                  >
                    ✓ Already Placed
                  </button>
                ) : (
                  <button className="btn btn-primary w-100"
                    style={{ padding: "8px", fontSize: "0.82rem", borderRadius: 8 }}
                    onClick={() => {
                      setSelectedStudent(student);
                      setPredictionResult(null);
                      setPredictionError("");
                      setUsedResumeName("");
                    }}>
                    Assign Job
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal — only opens for unplaced students ── */}
      {selectedStudent && (() => {
        const isPlaced = (selectedStudent.workingStatus || "").toUpperCase() === "PLACED";
        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="card p-5"
              style={{ width: 560, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}>

              {/* Modal header */}
              <div className="row space-between items-center mb-4">
                <div className="row items-center g-3">
                  <div className="bg-primary text-white br-circle bold" style={{
                    width: 48, height: 48,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.2rem", flexShrink: 0,
                  }}>
                    {selectedStudent.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <h3 className="fs-4 bold">{selectedStudent.name}</h3>
                    <p className="fs-p8 text-secondary">{selectedStudent.email}</p>
                  </div>
                </div>
                <span className="cursor-pointer fs-4 text-secondary" onClick={closeModal}>✖</span>
              </div>

              {/* Placement status banner */}
              <div className="mb-4 p-3 text-center" style={{
                borderRadius: 10,
                background: isPlaced ? "rgba(22,163,74,0.08)" : "rgba(107,114,128,0.08)",
                border: `1px solid ${isPlaced ? "rgba(22,163,74,0.3)" : "rgba(107,114,128,0.2)"}`,
              }}>
                <p className="bold fs-p9" style={{ color: isPlaced ? "var(--success)" : "var(--gray-500)" }}>
                  {isPlaced ? "✓ Placed Student" : "Not Yet Placed"}
                </p>
                {isPlaced && selectedStudent.companyName && (
                  <p className="fs-p8 mt-1" style={{ color: "var(--success)" }}>
                    Placed at: {selectedStudent.companyName}
                  </p>
                )}
                {isPlaced && (
                  <p className="fs-p8 mt-1 text-secondary">
                    This student has already been placed and cannot be assigned to another job.
                  </p>
                )}
              </div>

              {/* Student details grid */}
              <div className="row g-3 mb-4">
                {[
                  { label: "Department", value: selectedStudent.departmentModel?.departmentName || departmentName },
                  { label: "CGPA",       value: selectedStudent.percentage },
                  { label: "Roll No",    value: selectedStudent.rollNumber },
                  { label: "Phone",      value: selectedStudent.phone },
                ].filter((f) => f.value).map((f) => (
                  <div className="col-6" key={f.label}>
                    <div className="card p-2">
                      <p className="fs-p8 text-secondary">{f.label}</p>
                      <p className="bold fs-p9 mt-1">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Job assignment section — only for unplaced students ── */}
              {!isPlaced && (
                <>
                  <div className="form-group mb-3">
                    <label className="form-control-label mb-1">Select Job to Assign</label>
                    <select className="form-control" value={selectedJob}
                      onChange={(e) => {
                        setSelectedJob(e.target.value);
                        setPredictionResult(null);
                        setPredictionError("");
                        setUsedResumeName("");
                      }}>
                      <option value="">Choose a job...</option>
                      {jobs.map((j) => {
                        const sid      = selectedStudent.studentId || selectedStudent.id;
                        const alreadyA = assignedSet.has(`${sid}_${j.jobPostId}`);
                        return (
                          <option key={j.jobPostId} value={j.jobPostId}>
                            {alreadyA ? "✓ " : ""}{j.companyModel?.companyName} — {j.title || j.tiitle}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedJobData && (
                    <div className="mb-3 p-3" style={{
                      background: "rgba(50,85,99,0.04)", border: "1px solid rgba(50,85,99,0.15)", borderRadius: 8,
                    }}>
                      <p className="bold fs-p9">{selectedJobData.companyModel?.companyName}</p>
                      <p className="fs-p8 text-secondary mb-2">{selectedJobData.title || selectedJobData.tiitle}</p>
                      <div className="row g-2" style={{ flexWrap: "wrap" }}>
                        {selectedJobData.eligiblePercentage && (
                          <span style={{ background: "rgba(50,85,99,0.08)", color: "var(--primary)", borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem" }}>
                            Eligibility: {selectedJobData.eligiblePercentage}%
                          </span>
                        )}
                        {selectedJobData.lastDateToApply && (
                          <span style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem" }}>
                            Deadline: {selectedJobData.lastDateToApply}
                          </span>
                        )}
                        {selectedJobData.requiredCandidate && (
                          <span style={{ background: "rgba(22,163,74,0.08)", color: "var(--success)", borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem" }}>
                            Openings: {selectedJobData.requiredCandidate}
                          </span>
                        )}
                      </div>

                      {/* ── Show "already assigned" notice inline under job details ── */}
                      {isCurrentComboAssigned && (
                        <div className="mt-2" style={{
                          background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)",
                          borderRadius: 6, padding: "6px 10px",
                        }}>
                          <p className="fs-p8" style={{ color: "var(--success)", fontWeight: 600 }}>
                            ✓ You have already assigned this student to this job.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skill match button — hidden if already assigned */}
                  {selectedJob && !isCurrentComboAssigned && (
                    <div className="mb-3">
                      <button onClick={runPrediction} disabled={predicting} style={{
                        width: "100%", padding: "10px", borderRadius: 8,
                        background: predicting ? "var(--gray-200)" : "rgba(50,85,99,0.1)",
                        color: "var(--primary)", border: "1px solid rgba(50,85,99,0.3)",
                        fontWeight: 600, fontSize: "0.85rem",
                        cursor: predicting ? "not-allowed" : "pointer",
                      }}>
                        {predicting ? "Analyzing primary resume..." : "⭐ Check Skill Match (Primary Resume)"}
                      </button>
                    </div>
                  )}

                  {predictionError && (
                    <div className="alert-danger mb-3">
                      <p className="fs-p9 text-danger">{predictionError}</p>
                    </div>
                  )}

                  {predictionResult && (
                    <div className="mb-3 p-3" style={{
                      background: "rgba(50,85,99,0.04)", border: "1px solid rgba(50,85,99,0.15)", borderRadius: 8,
                    }}>
                      <div className="row space-between items-center mb-3">
                        <p className="bold fs-p9">Skill Match Result</p>
                        {usedResumeName && (
                          <span style={{
                            fontSize: "0.72rem", padding: "2px 10px", borderRadius: 12,
                            background: "rgba(50,85,99,0.1)", color: "var(--primary)", fontWeight: 600,
                          }}>
                            ⭐ {usedResumeName}
                          </span>
                        )}
                      </div>
                      {["technical_skills", "soft_skills"].map((key) => {
                        const data  = predictionResult[key];
                        const label = key === "technical_skills" ? "Technical Skills" : "Soft Skills";
                        return (
                          <div key={key} className="mb-3">
                            <div className="row space-between items-center mb-2">
                              <p className="fs-p9 bold">{label}</p>
                              {data?.match_percentage != null ? (
                                <span className="bold fs-p9" style={{
                                  padding: "2px 12px", borderRadius: 12,
                                  background: data.match_percentage >= 70 ? "rgba(22,163,74,0.12)" : data.match_percentage >= 40 ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.10)",
                                  color: data.match_percentage >= 70 ? "var(--success)" : data.match_percentage >= 40 ? "var(--warning)" : "var(--danger)",
                                }}>{data.match_percentage}%</span>
                              ) : <span className="fs-p8 text-secondary">No data</span>}
                            </div>
                            {data?.matched?.length > 0 && (
                              <div className="mb-2">
                                <p className="fs-p8 text-secondary mb-1">Matched</p>
                                <div className="row g-1" style={{ flexWrap: "wrap" }}>
                                  {data.matched.map((sk) => (
                                    <span key={sk} style={{ background: "rgba(22,163,74,0.1)", color: "var(--success)", borderRadius: 20, padding: "2px 10px", fontSize: "0.78rem" }}>{sk}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {data?.missing?.length > 0 && (
                              <div>
                                <p className="fs-p8 text-secondary mb-1">Missing</p>
                                <div className="row g-1" style={{ flexWrap: "wrap" }}>
                                  {data.missing.map((sk) => (
                                    <span key={sk} style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", borderRadius: 20, padding: "2px 10px", fontSize: "0.78rem" }}>{sk}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {key === "technical_skills" && <div style={{ borderTop: "1px solid var(--border-color)", margin: "12px 0" }} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Modal footer buttons */}
              <div className="row g-2">
                {!isPlaced && (
                  // ── Assign Job button: disabled + style change if already assigned
                  isCurrentComboAssigned ? (
                    <button className="btn w-auto" disabled style={{
                      padding: "8px 20px",
                      background: "rgba(22,163,74,0.1)",
                      color: "var(--success)",
                      border: "1px solid rgba(22,163,74,0.3)",
                      borderRadius: 8, fontWeight: 600, cursor: "not-allowed",
                    }}>
                      ✓ Already Assigned
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={assignJob} disabled={!selectedJob}>
                      Assign Job
                    </button>
                  )
                )}
                <button className="btn btn-muted" onClick={closeModal}>Close</button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default TutorStudents;