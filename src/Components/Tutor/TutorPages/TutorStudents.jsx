import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function TutorStudents() {

  // ── State ──────────────────────────────────────────────
  const [students,         setStudents]         = useState([]);
  const [jobs,             setJobs]             = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");
  const [departmentName,   setDepartmentName]   = useState("");
  const [selectedStudent,  setSelectedStudent]  = useState(null);
  const [selectedJob,      setSelectedJob]      = useState("");
  const [search,           setSearch]           = useState("");
  const [filterStatus,     setFilterStatus]     = useState("");

  // ── Prediction State ───────────────────────────────────
  const [predicting,       setPredicting]       = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError,  setPredictionError]  = useState("");

  // ── Auth Header ────────────────────────────────────────
  const header = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── Fetch: Tutor → students ────────────────────────────
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

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

      const studentRes  = await axios.get(rest.students, header);
      const allStudents = studentRes.data?.data || studentRes.data || [];
      console.log("Students loaded:", allStudents);
      setStudents(Array.isArray(allStudents) ? allStudents : []);

    } catch (err) {
      console.error("fetchStudents error:", err);
      setError("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch: Jobs ────────────────────────────────────────
  const fetchJobs = async () => {
    try {
      const res  = await axios.get(rest.jobPost, header);
      const list = res.data?.data || res.data || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("fetchJobs error:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchJobs();
  }, []);

  // ── Close modal helper (resets all modal state) ────────
  const closeModal = () => {
    setSelectedStudent(null);
    setSelectedJob("");
    setPredictionResult(null);
    setPredictionError("");
  };

  // ── Assign student to job ──────────────────────────────
  const assignJob = async () => {
    if (!selectedStudent || !selectedJob) return;
    try {
      const studentId = selectedStudent.studentId || selectedStudent.id;
      const jobPostId = Number(selectedJob);

      console.log("Assigning job:", { studentId, jobPostId });

      await axios.post(
        rest.jobSuggestions,
        { studentId, jobPostId },
        header
      );
      alert("Student assigned to job successfully!");
      closeModal();
    } catch (err) {
      console.error("assignJob error:", err.response?.data || err.message);
      alert("Failed to assign: " + (err.response?.data?.message || err.response?.data || err.message));
    }
  };

  const runPrediction = async () => {
    if (!selectedStudent || !selectedJobData) return;

    setPredicting(true);
    setPredictionResult(null);
    setPredictionError("");

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

      const raw    = resumeModel.resume2.startsWith("data:")
        ? resumeModel.resume2.split(",")[1]
        : resumeModel.resume2;
      const binary = atob(raw);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const file = new File(
        [blob],
        (resumeModel.resumeTitle || "resume") + ".pdf",
        { type: "application/pdf" }
      );

      const fd = new FormData();
      fd.append("file", file);
      fd.append("job_description", selectedJobData.description || selectedJobData.tiitle || "");

      const res = await axios.post(
        "http://localhost:8081/placement-prediction",
        fd,
        { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
      );

      setPredictionResult(res.data);
    } catch (err) {
      console.error("Prediction error:", err.response?.data || err.message);
      if (err.code === "ERR_NETWORK" || err.message?.includes("Network")) {
        setPredictionError("Cannot reach prediction API. Make sure Flask is running on port 8081.");
      } else if (err.response?.status === 401) {
        setPredictionError("Unauthorized. Please log in again.");
      } else {
        setPredictionError("Prediction failed: " + (err.response?.data?.error || err.message));
      }
    } finally {
      setPredicting(false);
    }
  };

  const filtered = students.filter((s) => {
    const term        = search.toLowerCase();
    const matchSearch = !search
      || s.name?.toLowerCase().includes(term)
      || s.email?.toLowerCase().includes(term)
      || s.rollNumber?.includes(search);
    const matchStatus = !filterStatus || s.workingStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const total    = students.length;
  const placed   = students.filter((s) => s.workingStatus === "Placed").length;
  const unplaced = total - placed;

  const selectedJobData = jobs.find((j) => String(j.jobPostId) === String(selectedJob));

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">👨‍🎓 My Students</h2>
          <p className="fs-p9 text-secondary">
            {departmentName ? `Department: ${departmentName}` : "Loading..."}
          </p>
        </div>
      </div>

      {error && <div className="alert-danger mb-4">⚠️ {error}</div>}

      <div className="row g-3 mb-4">
        {[
          { label: "Total Students", value: total,    icon: "👨‍🎓", color: "var(--primary)"  },
          { label: "Placed",         value: placed,   icon: "✅",   color: "var(--success)" },
          { label: "Unplaced",       value: unplaced, icon: "⏳",   color: "var(--warning)" },
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

      <div className="row mb-3" style={{ gap: "12px" }}>
        <div className="w-40">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search by name, email, roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-3 p-0">
          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Placed">Placed</option>
            <option value="Unplaced">Unplaced</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-secondary p-4">Loading students...</p>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>
          <table className="w-100">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Department</th>
                <th>CGPA</th>
                <th>Roll No</th>
                <th>Skills</th>
                <th>Placement</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-5">
                    <p className="fs-4">📭</p>
                    <p className="bold mt-1">No students found</p>
                    <p className="fs-p8 text-secondary">
                      {students.length === 0
                        ? "No students in your department."
                        : "Try a different search or filter."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((student, idx) => {
                  const isPlaced = student.workingStatus === "Placed";
                  return (
                    <tr key={student.studentId || student.id || idx} className="hover-bg">
                      <td className="fs-p9 text-secondary">{idx + 1}</td>

                      <td>
                        <div className="row items-center g-2">
                          <div className="bg-primary text-white br-circle bold"
                            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>
                            {student.name?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="bold fs-p9">{student.name}</p>
                            <p className="fs-p8 text-secondary">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="fs-p9 br-md"
                          style={{ background: "rgba(50,85,99,0.08)", color: "var(--primary)", padding: "3px 10px" }}>
                          {student.departmentModel?.departmentName || departmentName || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="bold fs-p9" style={{
                          color: student.percentage >= 8 ? "var(--success)"
                               : student.percentage >= 6 ? "var(--warning)"
                               : "var(--danger)"
                        }}>
                          {student.percentage || "—"}
                        </span>
                      </td>

                      <td><span className="fs-p9">{student.rollNumber || "—"}</span></td>

                      <td>
                        {student.skills ? (
                          <div className="row g-1 flex-wrap">
                            {student.skills.split(",").slice(0, 2).map((sk) => (
                              <span key={sk} className="fs-p8 br-md"
                                style={{ background: "var(--gray-200)", padding: "2px 8px", color: "var(--gray-700)" }}>
                                {sk.trim()}
                              </span>
                            ))}
                            {student.skills.split(",").length > 2 && (
                              <span className="fs-p7 text-secondary">
                                +{student.skills.split(",").length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="fs-p8 text-secondary">—</span>
                        )}
                      </td>

                      <td>
                        <span className="status-item fs-p8 bold"
                          style={{
                            background: isPlaced ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
                            color:      isPlaced ? "var(--success)"       : "var(--gray-500)",
                          }}>
                          {isPlaced ? "Placed" : "Unplaced"}
                        </span>
                      </td>

                      <td>
                        <button className="btn btn-primary w-auto"
                          style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                          onClick={() => { setSelectedStudent(student); setPredictionResult(null); setPredictionError(""); }}>
                          💼 Assign Job
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="card p-5"
            style={{ width: 560, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="row space-between items-center mb-4">
              <div className="row items-center g-3">
                <div className="bg-primary text-white br-circle bold"
                  style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                  {selectedStudent.name?.charAt(0) || "S"}
                </div>
                <div>
                  <h3 className="fs-4 bold">{selectedStudent.name}</h3>
                  <p className="fs-p8 text-secondary">{selectedStudent.email}</p>
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={closeModal}>✖</span>
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
                    <p className="fs-p8 text-secondary mb-2">🛠️ Skills</p>
                    <div className="row g-1 flex-wrap">
                      {selectedStudent.skills.split(",").map((sk) => (
                        <span key={sk} className="fs-p8 br-md"
                          style={{ background: "rgba(50,85,99,0.08)", color: "var(--primary)", padding: "3px 10px" }}>
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Job Selector */}
            <div className="form-group mb-3">
              <label className="form-control-label mb-1">💼 Select Job to Assign</label>
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
              <div className="br-md mb-3 p-3"
                style={{ background: "rgba(50,85,99,0.05)", border: "1px solid rgba(50,85,99,0.15)" }}>
                <p className="bold fs-p9">{selectedJobData.companyModel?.companyName}</p>
                <p className="fs-p8 text-secondary mb-2">{selectedJobData.title || selectedJobData.tiitle}</p>
                {selectedJobData.description && (
                  <p className="fs-p8 text-secondary mb-2" style={{ fontStyle: "italic" }}>
                    {selectedJobData.description.slice(0, 120)}{selectedJobData.description.length > 120 ? "..." : ""}
                  </p>
                )}
                <div className="row g-2">
                  {selectedJobData.eligiblePercentage && (
                    <span className="fs-p8 br-md"
                      style={{ background: "rgba(50,85,99,0.08)", color: "var(--primary)", padding: "3px 10px" }}>
                      📊 Eligibility: {selectedJobData.eligiblePercentage}%
                    </span>
                  )}
                  {selectedJobData.lastDateToApply && (
                    <span className="fs-p8 br-md"
                      style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", padding: "3px 10px" }}>
                      📅 Deadline: {selectedJobData.lastDateToApply}
                    </span>
                  )}
                  {selectedJobData.requiredCandidate && (
                    <span className="fs-p8 br-md"
                      style={{ background: "rgba(22,163,74,0.08)", color: "var(--success)", padding: "3px 10px" }}>
                      👥 Openings: {selectedJobData.requiredCandidate}
                    </span>
                  )}
                </div>
              </div>
            )}

            {selectedJob && (
              <div className="mb-3">
                <button
                  className="btn w-100"
                  style={{
                    background: predicting ? "var(--gray-200)" : "rgba(50,85,99,0.1)",
                    color: "var(--primary)",
                    border: "1px solid rgba(50,85,99,0.3)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    padding: "10px",
                    borderRadius: 8,
                    cursor: predicting ? "not-allowed" : "pointer",
                  }}
                  onClick={runPrediction}
                  disabled={predicting}
                >
                  {predicting ? "⏳ Analyzing resume..." : "🎯 Check Skill Match"}
                </button>
              </div>
            )}

            {/* Prediction Error */}
            {predictionError && (
              <div className="br-md p-3 mb-3"
                style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="fs-p9" style={{ color: "var(--danger)" }}>⚠️ {predictionError}</p>
              </div>
            )}

            {/* Prediction Result */}
            {predictionResult && (
              <div className="br-md p-3 mb-3"
                style={{ background: "rgba(50,85,99,0.04)", border: "1px solid rgba(50,85,99,0.15)" }}>
                <p className="bold fs-p9 mb-3">📊 Skill Match Result</p>

                {/* Technical Skills */}
                <div className="mb-3">
                  <div className="row space-between items-center mb-2">
                    <p className="fs-p9 bold">Technical Skills</p>
                    {predictionResult.technical_skills?.match_percentage != null ? (
                      <span className="bold fs-p9" style={{
                        padding: "2px 12px", borderRadius: 12,
                        background: predictionResult.technical_skills.match_percentage >= 70
                          ? "rgba(22,163,74,0.12)" : predictionResult.technical_skills.match_percentage >= 40
                          ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.10)",
                        color: predictionResult.technical_skills.match_percentage >= 70
                          ? "var(--success)" : predictionResult.technical_skills.match_percentage >= 40
                          ? "var(--warning)" : "var(--danger)",
                      }}>
                        {predictionResult.technical_skills.match_percentage}%
                      </span>
                    ) : (
                      <span className="fs-p8 text-secondary">No skills in job description</span>
                    )}
                  </div>

                  {predictionResult.technical_skills?.matched?.length > 0 && (
                    <div className="mb-2">
                      <p className="fs-p8 text-secondary mb-1">✅ Matched</p>
                      <div className="row g-1 flex-wrap">
                        {predictionResult.technical_skills.matched.map((sk) => (
                          <span key={sk} className="fs-p8 br-md"
                            style={{ background: "rgba(22,163,74,0.1)", color: "var(--success)", padding: "2px 10px" }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {predictionResult.technical_skills?.missing?.length > 0 && (
                    <div>
                      <p className="fs-p8 text-secondary mb-1">❌ Missing</p>
                      <div className="row g-1 flex-wrap">
                        {predictionResult.technical_skills.missing.map((sk) => (
                          <span key={sk} className="fs-p8 br-md"
                            style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", padding: "2px 10px" }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid var(--border-color)", marginBottom: 12 }} />

                {/* Soft Skills */}
                <div>
                  <div className="row space-between items-center mb-2">
                    <p className="fs-p9 bold">Soft Skills</p>
                    {predictionResult.soft_skills?.match_percentage != null ? (
                      <span className="bold fs-p9" style={{
                        padding: "2px 12px", borderRadius: 12,
                        background: predictionResult.soft_skills.match_percentage >= 70
                          ? "rgba(22,163,74,0.12)" : predictionResult.soft_skills.match_percentage >= 40
                          ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.10)",
                        color: predictionResult.soft_skills.match_percentage >= 70
                          ? "var(--success)" : predictionResult.soft_skills.match_percentage >= 40
                          ? "var(--warning)" : "var(--danger)",
                      }}>
                        {predictionResult.soft_skills.match_percentage}%
                      </span>
                    ) : (
                      <span className="fs-p8 text-secondary">No skills in job description</span>
                    )}
                  </div>

                  {predictionResult.soft_skills?.matched?.length > 0 && (
                    <div className="mb-2">
                      <p className="fs-p8 text-secondary mb-1">✅ Matched</p>
                      <div className="row g-1 flex-wrap">
                        {predictionResult.soft_skills.matched.map((sk) => (
                          <span key={sk} className="fs-p8 br-md"
                            style={{ background: "rgba(22,163,74,0.1)", color: "var(--success)", padding: "2px 10px" }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {predictionResult.soft_skills?.missing?.length > 0 && (
                    <div>
                      <p className="fs-p8 text-secondary mb-1">❌ Missing</p>
                      <div className="row g-1 flex-wrap">
                        {predictionResult.soft_skills.missing.map((sk) => (
                          <span key={sk} className="fs-p8 br-md"
                            style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", padding: "2px 10px" }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer Buttons */}
            <div className="row g-2">
              <button className="btn btn-primary" onClick={assignJob} disabled={!selectedJob}>
                ✅ Assign Job
              </button>
              <button className="btn btn-muted" onClick={closeModal}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default TutorStudents;