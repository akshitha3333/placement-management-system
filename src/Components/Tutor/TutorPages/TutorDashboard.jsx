import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function TutorDashboard() {
  const navigate = useNavigate();
  const [students,     setStudents]     = useState([]);
  const [jobs,         setJobs]         = useState([]);
  const [suggestions,  setSuggestions]  = useState([]);
  const [tutor,        setTutor]        = useState(null);
  const [loading,      setLoading]      = useState(true);

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${Cookies.get("token")}`,
    },
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [tutorRes, stuRes, jobRes, sugRes] = await Promise.all([
          axios.get(rest.tutor,           header),
          axios.get(rest.students,        header),
          axios.get(rest.jobPost,         header),
          axios.get(rest.jobSuggestions,  header),
        ]);

        const tutorList = tutorRes.data?.data || tutorRes.data || [];
        setTutor(Array.isArray(tutorList) ? tutorList[0] : tutorList);

        const stuList = stuRes.data?.data || stuRes.data || [];
        setStudents(Array.isArray(stuList) ? stuList : []);

        const jobList = jobRes.data?.data || jobRes.data || [];
        setJobs(Array.isArray(jobList) ? jobList : []);

        const sugList = sugRes.data?.data || sugRes.data || [];
        setSuggestions(Array.isArray(sugList) ? sugList : []);
      } catch (err) {
        console.error("TutorDashboard init:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const dept = tutor?.departmentModel?.departmentName || "";

  // Filter students in tutor's department
  const myStudents = students.filter((s) => {
    if (!tutor) return true;
    const tutorDeptId  = tutor?.departmentModel?.departmentId || tutor?.departmentId;
    const stuDeptId    = s?.departmentModel?.departmentId     || s?.departmentId;
    return !tutorDeptId || String(stuDeptId) === String(tutorDeptId);
  });

  // Count students who have at least one accepted application
  const assignedCount = suggestions.length;

  // Recent 4 students
  const recentStudents = myStudents.slice(0, 4);

  const stats = [
    { label: "My Students",     value: myStudents.length,  icon: "👨‍🎓", color: "#325563", path: "/tutor-page/students"         },
    { label: "Active Jobs",     value: jobs.length,        icon: "💼",  color: "#0ea5e9", path: "/tutor-page/job-posts"         },
    { label: "Assigned Jobs",   value: assignedCount,      icon: "✅",  color: "#16a34a", path: "/tutor-page/students"         },
    { label: "Placement Report",value: "→",                icon: "📈",  color: "#f59e0b", path: "/tutor-page/placement-report" },
  ];

  return (
    <div>
      {/* ── Welcome Banner ── */}
      <div
        className="card p-5 mb-4"
        style={{ background: "linear-gradient(135deg, #0b2e40, #325563)", color: "white", border: "none" }}
      >
        <h2 className="bold mb-1">
          👋 Welcome, {tutor?.name || "Tutor"}!
        </h2>
        <p className="fs-p9" style={{ opacity: 0.85 }}>
          {dept ? `Department: ${dept} — ` : ""}
          Monitor your students' placement progress
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="row mb-5">
        {stats.map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div
              className="card p-4 stat-card cursor-pointer"
              onClick={() => navigate(s.path)}
            >
              <div className="row space-between items-center mb-2">
                <p className="fs-p9 text-secondary">{s.label}</p>
                <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
              </div>
              <h2 className="bold" style={{ color: s.color }}>
                {loading ? "…" : s.value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Students + Job Posts ── */}
      <div className="row">
        {/* Students */}
        <div className="col-7 p-2">
          <div className="card p-4">
            <div className="row space-between items-center mb-3">
              <h4>👨‍🎓 My Students</h4>
              <button
                className="btn btn-primary w-auto"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => navigate("/tutor-page/students")}
              >
                View All
              </button>
            </div>

            {loading ? (
              <p className="text-secondary fs-p9">Loading...</p>
            ) : recentStudents.length === 0 ? (
              <p className="text-secondary fs-p9 text-center p-3">No students found in your department.</p>
            ) : (
              recentStudents.map((s, i) => {
                const name  = s.name || s.studentName || "Student";
                const dept2 = s.departmentModel?.departmentName || "—";
                const cgpa  = s.cgpa || s.marks || "—";
                const email = s.userModel?.email || s.email || "—";
                return (
                  <div
                    key={s.studentId || i}
                    className="p-3 mb-2 hover-bg"
                    style={{ border: "1px solid var(--border-color)", borderRadius: "10px" }}
                  >
                    <div className="row space-between items-center">
                      <div className="row items-center" style={{ gap: "10px" }}>
                        <div
                          className="bg-primary text-white br-circle"
                          style={{
                            width:          "36px",
                            height:         "36px",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            fontWeight:     "bold",
                            fontSize:       "0.9rem",
                            flexShrink:     0,
                          }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="bold fs-p9">{name}</div>
                          <div className="fs-p8 text-secondary">{dept2} &nbsp;·&nbsp; {email}</div>
                        </div>
                      </div>
                      <span
                        className="status-item fs-p8"
                        style={{ background: "rgba(50,85,99,0.1)", color: "#325563" }}
                      >
                        CGPA: {cgpa}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Job Posts */}
        <div className="col-5 p-2">
          <div className="card p-4 mb-3">
            <div className="row space-between items-center mb-3">
              <h4>💼 Job Posts</h4>
              <button
                className="btn btn-primary w-auto"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => navigate("/tutor-page/job-posts")}
              >
                View All
              </button>
            </div>
            {loading ? (
              <p className="fs-p9 text-secondary">Loading...</p>
            ) : jobs.length === 0 ? (
              <p className="fs-p9 text-secondary text-center p-3">No job posts available</p>
            ) : (
              jobs.slice(0, 4).map((job, i) => {
                const title  = job.title || job.tiitle;
                const isOpen = !job.lastDateToApply || new Date(job.lastDateToApply) >= new Date();
                return (
                  <div
                    key={job.jobPostId || i}
                    className="p-2 mb-2 hover-bg br-md"
                    style={{ border: "1px solid var(--border-color)", borderRadius: "8px" }}
                  >
                    <div className="row space-between items-center">
                      <div className="bold fs-p9">{title}</div>
                      <span
                        className="status-item fs-p8"
                        style={{
                          background: isOpen ? "rgba(22,163,74,0.1)"  : "rgba(220,38,38,0.1)",
                          color:      isOpen ? "#16a34a"               : "#dc2626",
                        }}
                      >
                        {isOpen ? "Active" : "Closed"}
                      </span>
                    </div>
                    <div className="fs-p8 text-secondary">
                      Deadline: {job.lastDateToApply || "Open"}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Placement Rate Card */}
          <div
            className="card p-4"
            style={{ background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)", border: "none" }}
          >
            <h4 className="mb-2">📈 Assignment Rate</h4>
            <div>
              <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "5px" }}>
                <div
                  style={{
                    width:        myStudents.length
                      ? `${Math.min(100, Math.round((assignedCount / myStudents.length) * 100))}%`
                      : "0%",
                    height:       "10px",
                    background:   "#325563",
                    borderRadius: "5px",
                    transition:   "width 0.4s",
                  }}
                />
              </div>
              <p className="fs-p9 mt-1 text-secondary">
                {assignedCount} of {myStudents.length} students assigned to jobs{" "}
                <span className="bold" style={{ color: "#325563" }}>
                  ({myStudents.length ? Math.round((assignedCount / myStudents.length) * 100) : 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorDashboard;