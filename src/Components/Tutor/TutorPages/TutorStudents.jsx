import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

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

  const header = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Cookies.get("token")}`,
    },
  };

  const fetchStudents = async () => {
    try {
      setLoading(true); setError("");
      const tutorRes  = await axios.get(rest.tutor, header);
      const tutorList = tutorRes.data?.data || tutorRes.data || [];
      const tutor     = Array.isArray(tutorList) ? tutorList[0] : tutorList;
      const tutorDeptId   = tutor?.departmentModel?.departmentId || tutor?.departmentId;
      const tutorDeptName = tutor?.departmentModel?.departmentName || "";
      if (!tutorDeptId) { setError("Tutor department not found. Please contact admin."); return; }
      setDepartmentName(tutorDeptName);
      const studentRes  = await axios.get(rest.students, header);
      const allStudents = studentRes.data?.data || studentRes.data || [];
      console.log("Students loaded:", allStudents);
      setStudents(Array.isArray(allStudents) ? allStudents : []);
    } catch (err) {
      console.error("fetchStudents error:", err);
      setError("Failed to load students. Please try again.");
    } finally { setLoading(false); }
  };

  const fetchJobs = async () => {
    try {
      const res  = await axios.get(rest.jobPost, header);
      const list = res.data?.data || res.data || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch (err) { console.error("fetchJobs error:", err); }
  };

  useEffect(() => { fetchStudents(); fetchJobs(); }, []);

  const closeModal = () => {
    setSelectedStudent(null);
    setSelectedJob("");
    setPredictionResult(null);
    setPredictionError("");
  };

  const assignJob = async () => {
    if (!selectedStudent || !selectedJob) return;
    try {
      const studentId = selectedStudent.studentId || selectedStudent.id;
      const jobPostId = Number(selectedJob);
      console.log("Assigning job:", { studentId, jobPostId });
      await axios.post(rest.jobSuggestions, { studentId, jobPostId }, header);
      alert("Student assigned to job successfully!");
      closeModal();
    } catch (err) {
      console.error("assignJob error:", err.response?.data || err.message);
      alert("Failed to assign: " + (err.response?.data?.message || err.response?.data || err.message));
    }
  };

  const runPrediction = async () => {
    if (!selectedStudent || !selectedJobData) return;
    setPredicting(true); setPredictionResult(null); setPredictionError("");
    try {
      const studentId = selectedStudent.studentId || selectedStudent.id;
      const appsRes = await axios.get(rest.jobApplications, header);
      const apps    = appsRes.data?.data || appsRes.data || [];
      const appList = Array.isArray(apps) ? apps : [];
      const studentApp = appList.find((app) => {
        const appStudentId =
          app.resumeModel?.studentModel?.studentId ||
          app.resumeModel?.studentModel?.id         ||
          app.jobSuggestionModel?.studentModel?.studentId ||
          app.jobSuggestionModel?.studentModel?.id;
        return String(appStudentId) === String(studentId) && app.resumeModel?.resume2;
      });
      if (!studentApp?.resumeModel?.resume2) {
        setPredictionError("No resume found. The student must apply for at least one job with a resume first.");
        return;
      }
      const resumeModel = studentApp.resumeModel;
      const raw    = resumeModel.resume2.startsWith("data:") ? resumeModel.resume2.split(",")[1] : resumeModel.resume2;
      const binary = atob(raw);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const file = new File([blob], (resumeModel.resumeTitle || "resume") + ".pdf", { type: "application/pdf" });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("job_description", selectedJobData.description || selectedJobData.tiitle || "");
      const res = await axios.post("http://localhost:8081/placement-prediction", fd, {
        headers: { Authorization: `Bearer ${Cookies.get("token")}` },
      });
      setPredictionResult(res.data);
    } catch (err) {
      console.error("Prediction error:", err.response?.data || err.message);
      if (err.code === "ERR_NETWORK" || err.message?.includes("Network"))
        setPredictionError("Cannot reach prediction API. Make sure Flask is running on port 8081.");
      else if (err.response?.status === 401)
        setPredictionError("Unauthorized. Please log in again.");
      else
        setPredictionError("Prediction failed: " + (err.response?.data?.error || err.message));
    } finally { setPredicting(false); }
  };

  const filtered = students.filter((s) => {
    const term        = search.toLowerCase();
    const matchSearch = !search || s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term) || s.rollNumber?.includes(search);
    const matchStatus = !filterStatus || s.workingStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const total    = students.length;
  const placed   = students.filter((s) => s.workingStatus === "Placed").length;
  const unplaced = total - placed;

  const selectedJobData = jobs.find((j) => String(j.jobPostId) === String(selectedJob));

  // ── CGPA color helper ──
  const cgpaColor = (p) => p >= 8 ? "var(--success)" : p >= 6 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">My Students</h2>
          <p className="fs-p9 text-secondary">
            {departmentName ? `Department: ${departmentName}` : "Loading..."}
          </p>
        </div>
      </div>

      {error && <div className="alert-danger mb-4">{error}</div>}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Students", value: total,    color: "var(--primary)"  },
          { label: "Placed",         value: placed,   color: "var(--success)"  },
          { label: "Unplaced",       value: unplaced, color: "var(--warning)"  },
        ].map((stat, i) => (
          <div className="col-4 p-2" key={i}>
            <div className="card p-3 stat-card text-center">
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
            placeholder="Search by name, email, roll number..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 180 }}>
          <select className="form-control" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Placed">Placed</option>
            <option value="Unplaced">Unplaced</option>
          </select>
        </div>
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <p className="text-secondary p-4">Loading students...</p>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No students found</p>
          <p className="fs-p9 text-secondary mt-1">
            {students.length === 0 ? "No students in your department." : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}>
          {filtered.map((student, idx) => {
            const isPlaced = student.workingStatus === "Placed";
            const pct      = parseFloat(student.percentage) || 0;
            return (
              <div key={student.studentId || student.id || idx} className="card p-4"
                style={{ borderTop: `3px solid ${isPlaced ? "var(--success)" : "var(--gray-300)"}` }}>

                {/* Top row — avatar + status */}
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
                      <p className="fs-p8 text-secondary" style={{ wordBreak: "break-all" }}>{student.email}</p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 700,
                    padding: "3px 10px", borderRadius: 20,
                    background: isPlaced ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
                    color: isPlaced ? "var(--success)" : "var(--gray-500)",
                    flexShrink: 0,
                  }}>
                    {isPlaced ? "Placed" : "Unplaced"}
                  </span>
                </div>

                {/* Info row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: "var(--gray-100)", borderRadius: 6, padding: "6px 10px" }}>
                    <p className="fs-p8 text-secondary">CGPA</p>
                    <p className="bold fs-p9" style={{ color: cgpaColor(pct) }}>{student.percentage || "—"}</p>
                  </div>
                  <div style={{ background: "var(--gray-100)", borderRadius: 6, padding: "6px 10px" }}>
                    <p className="fs-p8 text-secondary">Roll No</p>
                    <p className="bold fs-p9">{student.rollNumber || "—"}</p>
                  </div>
                </div>

                {/* Skills */}
                {student.skills ? (
                  <div className="row g-1 mb-3" style={{ flexWrap: "wrap" }}>
                    {student.skills.split(",").slice(0, 3).map((sk) => (
                      <span key={sk} style={{
                        background: "var(--gray-200)", color: "var(--gray-700)",
                        borderRadius: 20, padding: "2px 8px", fontSize: "0.68rem",
                      }}>{sk.trim()}</span>
                    ))}
                    {student.skills.split(",").length > 3 && (
                      <span className="fs-p7 text-secondary">+{student.skills.split(",").length - 3} more</span>
                    )}
                  </div>
                ) : (
                  <p className="fs-p8 text-secondary mb-3">No skills listed</p>
                )}

                {/* Action */}
                <button className="btn btn-primary w-100"
                  style={{ padding: "8px", fontSize: "0.82rem", borderRadius: 8 }}
                  onClick={() => { setSelectedStudent(student); setPredictionResult(null); setPredictionError(""); }}>
                  Assign Job
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ASSIGN JOB MODAL ── */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="card p-5"
            style={{ width: 560, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
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
              <span className="cursor-pointer fs-4 text-secondary" onClick={closeModal}>x</span>
            </div>

            {/* Student Info Grid */}
            <div className="row g-3 mb-4">
              {[
                { label: "Department", value: selectedStudent.departmentModel?.departmentName || departmentName },
                { label: "Percentage", value: selectedStudent.percentage  },
                { label: "Roll No",    value: selectedStudent.rollNumber  },
                { label: "Phone",      value: selectedStudent.phone       },
              ].filter((f) => f.value).map((f) => (
                <div className="col-6" key={f.label}>
                  <div className="card p-2">
                    <p className="fs-p8 text-secondary">{f.label}</p>
                    <p className="bold fs-p9 mt-1">{f.value}</p>
                  </div>
                </div>
              ))}
              {selectedStudent.skills && (
                <div className="col-12">
                  <div className="card p-2">
                    <p className="fs-p8 text-secondary mb-2">Skills</p>
                    <div className="row g-1" style={{ flexWrap: "wrap" }}>
                      {selectedStudent.skills.split(",").map((sk) => (
                        <span key={sk} style={{
                          background: "rgba(50,85,99,0.08)", color: "var(--primary)",
                          borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem",
                        }}>{sk.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Job Selector */}
            <div className="form-group mb-3">
              <label className="form-control-label mb-1">Select Job to Assign</label>
              <select className="form-control" value={selectedJob}
                onChange={(e) => { setSelectedJob(e.target.value); setPredictionResult(null); setPredictionError(""); }}>
                <option value="">Choose a job...</option>
                {jobs.map((j) => (
                  <option key={j.jobPostId} value={j.jobPostId}>
                    {j.companyModel?.companyName} — {j.title || j.tiitle}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Preview */}
            {selectedJobData && (
              <div className="mb-3 p-3" style={{
                background: "rgba(50,85,99,0.04)", border: "1px solid rgba(50,85,99,0.15)",
                borderRadius: 8,
              }}>
                <p className="bold fs-p9">{selectedJobData.companyModel?.companyName}</p>
                <p className="fs-p8 text-secondary mb-2">{selectedJobData.title || selectedJobData.tiitle}</p>
                {selectedJobData.description && (
                  <p className="fs-p8 text-secondary mb-2" style={{ fontStyle: "italic", lineHeight: 1.6 }}>
                    {selectedJobData.description.slice(0, 180)}{selectedJobData.description.length > 180 ? "…" : ""}
                  </p>
                )}
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
              </div>
            )}

            {/* Check Skill Match button */}
            {selectedJob && (
              <div className="mb-3">
                <button
                  onClick={runPrediction}
                  disabled={predicting}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 8,
                    background: predicting ? "var(--gray-200)" : "rgba(50,85,99,0.1)",
                    color: "var(--primary)",
                    border: "1px solid rgba(50,85,99,0.3)",
                    fontWeight: 600, fontSize: "0.85rem",
                    cursor: predicting ? "not-allowed" : "pointer",
                  }}>
                  {predicting ? "Analyzing resume..." : "Check Skill Match"}
                </button>
              </div>
            )}

            {/* Prediction Error */}
            {predictionError && (
              <div className="alert-danger mb-3">
                <p className="fs-p9 text-danger">{predictionError}</p>
              </div>
            )}

            {/* Prediction Result */}
            {predictionResult && (
              <div className="mb-3 p-3" style={{
                background: "rgba(50,85,99,0.04)", border: "1px solid rgba(50,85,99,0.15)",
                borderRadius: 8,
              }}>
                <p className="bold fs-p9 mb-3">Skill Match Result</p>

                {/* Technical Skills */}
                <div className="mb-3">
                  <div className="row space-between items-center mb-2">
                    <p className="fs-p9 bold">Technical Skills</p>
                    {predictionResult.technical_skills?.match_percentage != null ? (
                      <span className="bold fs-p9" style={{
                        padding: "2px 12px", borderRadius: 12,
                        background: predictionResult.technical_skills.match_percentage >= 70 ? "rgba(22,163,74,0.12)"
                          : predictionResult.technical_skills.match_percentage >= 40 ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.10)",
                        color: predictionResult.technical_skills.match_percentage >= 70 ? "var(--success)"
                          : predictionResult.technical_skills.match_percentage >= 40 ? "var(--warning)" : "var(--danger)",
                      }}>
                        {predictionResult.technical_skills.match_percentage}%
                      </span>
                    ) : <span className="fs-p8 text-secondary">No skills in job description</span>}
                  </div>
                  {predictionResult.technical_skills?.matched?.length > 0 && (
                    <div className="mb-2">
                      <p className="fs-p8 text-secondary mb-1">Matched</p>
                      <div className="row g-1" style={{ flexWrap: "wrap" }}>
                        {predictionResult.technical_skills.matched.map((sk) => (
                          <span key={sk} style={{ background: "rgba(22,163,74,0.1)", color: "var(--success)", borderRadius: 20, padding: "2px 10px", fontSize: "0.78rem" }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {predictionResult.technical_skills?.missing?.length > 0 && (
                    <div>
                      <p className="fs-p8 text-secondary mb-1">Missing</p>
                      <div className="row g-1" style={{ flexWrap: "wrap" }}>
                        {predictionResult.technical_skills.missing.map((sk) => (
                          <span key={sk} style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", borderRadius: 20, padding: "2px 10px", fontSize: "0.78rem" }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", marginBottom: 12 }} />

                {/* Soft Skills */}
                <div>
                  <div className="row space-between items-center mb-2">
                    <p className="fs-p9 bold">Soft Skills</p>
                    {predictionResult.soft_skills?.match_percentage != null ? (
                      <span className="bold fs-p9" style={{
                        padding: "2px 12px", borderRadius: 12,
                        background: predictionResult.soft_skills.match_percentage >= 70 ? "rgba(22,163,74,0.12)"
                          : predictionResult.soft_skills.match_percentage >= 40 ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.10)",
                        color: predictionResult.soft_skills.match_percentage >= 70 ? "var(--success)"
                          : predictionResult.soft_skills.match_percentage >= 40 ? "var(--warning)" : "var(--danger)",
                      }}>
                        {predictionResult.soft_skills.match_percentage}%
                      </span>
                    ) : <span className="fs-p8 text-secondary">No skills in job description</span>}
                  </div>
                  {predictionResult.soft_skills?.matched?.length > 0 && (
                    <div className="mb-2">
                      <p className="fs-p8 text-secondary mb-1">Matched</p>
                      <div className="row g-1" style={{ flexWrap: "wrap" }}>
                        {predictionResult.soft_skills.matched.map((sk) => (
                          <span key={sk} style={{ background: "rgba(22,163,74,0.1)", color: "var(--success)", borderRadius: 20, padding: "2px 10px", fontSize: "0.78rem" }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {predictionResult.soft_skills?.missing?.length > 0 && (
                    <div>
                      <p className="fs-p8 text-secondary mb-1">Missing</p>
                      <div className="row g-1" style={{ flexWrap: "wrap" }}>
                        {predictionResult.soft_skills.missing.map((sk) => (
                          <span key={sk} style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", borderRadius: 20, padding: "2px 10px", fontSize: "0.78rem" }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="row g-2">
              <button className="btn btn-primary" onClick={assignJob} disabled={!selectedJob}>
                Assign Job
              </button>
              <button className="btn btn-muted" onClick={closeModal}>Cancel</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default TutorStudents;