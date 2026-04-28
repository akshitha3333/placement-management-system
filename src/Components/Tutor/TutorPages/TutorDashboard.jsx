import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const getHeader = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

function TutorDashboard() {
  const navigate = useNavigate();
  const [tutor,       setTutor]       = useState(null);
  const [students,    setStudents]    = useState([]);
  const [jobs,        setJobs]        = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [tutorRes, stuRes, jobRes, sugRes] = await Promise.allSettled([
          axios.get(rest.tutor,          getHeader()),
          axios.get(rest.students,       getHeader()),
          axios.get(rest.jobPost,        getHeader()),
          axios.get(rest.jobSuggestions, getHeader()),
        ]);

        if (tutorRes.status === "fulfilled") {
          const d = tutorRes.value.data?.data || tutorRes.value.data || [];
          const me = Array.isArray(d) ? d[0] : d;
          setTutor(me);
          console.log("Tutor profile:", me);
        }
        if (stuRes.status === "fulfilled") {
          const d = stuRes.value.data?.data || stuRes.value.data || [];
          setStudents(Array.isArray(d) ? d : []);
          console.log("Students:", d.length);
        }
        if (jobRes.status === "fulfilled") {
          const d = jobRes.value.data?.data || jobRes.value.data || [];
          setJobs(Array.isArray(d) ? d : []);
          console.log("Jobs:", d.length);
        }
        if (sugRes.status === "fulfilled") {
          const d = sugRes.value.data?.data || sugRes.value.data || [];
          setSuggestions(Array.isArray(d) ? d : []);
          console.log("Suggestions:", d.length);
        }
      } catch (err) {
        console.error("TutorDashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Tutor info — backend field is "tutorName" not "name"
  const tutorName  = tutor?.tutorName  || tutor?.name || "Tutor";
  const tutorDept  = tutor?.departmentModel?.departmentName || "—";
  const tutorDeptId = tutor?.departmentModel?.departmentId  || tutor?.departmentId;

  // Filter students in tutor's department
  const myStudents = students.filter((s) => {
    if (!tutorDeptId) return true;
    const stuDeptId = s?.departmentModel?.departmentId || s?.departmentId;
    return String(stuDeptId) === String(tutorDeptId);
  });

  const activeJobs     = jobs.filter((j) => !j.lastDateToApply || new Date(j.lastDateToApply) >= new Date());
  const recentStudents = myStudents.slice(0, 5);
  const recentJobs     = jobs.slice(0, 4);
  const assignedCount  = suggestions.length;

  const assignRate = myStudents.length > 0
    ? Math.min(100, Math.round((assignedCount / myStudents.length) * 100))
    : 0;

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Welcome banner */}
      <div className="card p-4 mb-4" style={{
        background: "linear-gradient(135deg, #0b2e40, #325563)",
        color: "#fff", border: "none",
      }}>
        <div className="row space-between items-center">
          <div>
            <h2 className="bold mb-1">Welcome, {loading ? "..." : tutorName}!</h2>
            <p className="fs-p9" style={{ opacity: 0.8 }}>
              Department: {tutorDept} · {myStudents.length} students assigned
            </p>
          </div>
          <button
            style={{
              padding: "8px 20px", borderRadius: 8,
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer",
              fontWeight: 600, fontSize: "0.85rem",
            }}
            onClick={() => navigate("/tutor-page/placement-report")}
          >
            Placement Report
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="row mb-4" style={{ gap: 12 }}>
        {[
          { label: "My Students",      value: myStudents.length,  sub: `in ${tutorDept}`,          color: "var(--primary)", path: "/tutor-page/students"          },
          { label: "Active Jobs",      value: activeJobs.length,  sub: `${jobs.length} total`,     color: "#0ea5e9",        path: "/tutor-page/job-posts"          },
          { label: "Suggestions Made", value: assignedCount,      sub: "jobs recommended",         color: "var(--success)", path: "/tutor-page/students"           },
          { label: "Meetings",         value: "View",             sub: "scheduled meetings",       color: "var(--warning)", path: "/tutor-page/meetings"           },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div
              className="card p-4 stat-card"
              style={{ borderLeft: `4px solid ${s.color}`, cursor: "pointer" }}
              onClick={() => navigate(s.path)}
            >
              <p className="fs-p9 text-secondary mb-2">{s.label}</p>
              <h2 className="bold" style={{ color: s.color }}>{loading ? "..." : s.value}</h2>
              <p className="fs-p9 text-secondary mt-1">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Students list + Jobs + Progress */}
      <div className="row" style={{ gap: 12 }}>

        {/* My Students */}
        <div style={{ flex: 2 }}>
          <div className="card p-4">
            <div className="row space-between items-center mb-3">
              <h4 className="bold">My Students</h4>
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
              <p className="text-secondary fs-p9 text-center p-3">
                No students found in your department.
              </p>
            ) : (
              recentStudents.map((s, i) => {
                const sName  = s.name || s.studentName || "Student";
                const sDept  = s.departmentModel?.departmentName || "—";
                const sPct   = s.percentage || "—";
                const sEmail = s.email || s.userModel?.email || "—";
                return (
                  <div key={s.studentId || i} className="p-3 mb-2 hover-bg" style={{
                    border: "1px solid var(--border-color)", borderRadius: 8,
                  }}>
                    <div className="row space-between items-center">
                      <div className="row items-center" style={{ gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                          background: "var(--primary)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "0.85rem",
                        }}>
                          {sName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="bold fs-p9">{sName}</p>
                          <p className="fs-p8 text-secondary">{sDept} · {sEmail}</p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                        background: "rgba(50,85,99,0.1)", color: "var(--primary)",
                      }}>
                        {sPct !== "—" ? `${sPct}%` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column — Jobs + Progress */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Recent Job Posts */}
          <div className="card p-4">
            <div className="row space-between items-center mb-3">
              <h4 className="bold">Job Posts</h4>
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
            ) : recentJobs.length === 0 ? (
              <p className="fs-p9 text-secondary text-center p-2">No job posts available.</p>
            ) : (
              recentJobs.map((job, i) => {
                const isOpen = !job.lastDateToApply || new Date(job.lastDateToApply) >= new Date();
                return (
                  <div key={job.jobPostId || i} className="p-2 mb-2 hover-bg" style={{
                    border: "1px solid var(--border-color)", borderRadius: 8,
                    borderLeft: `3px solid ${isOpen ? "var(--success)" : "var(--gray-400)"}`,
                  }}>
                    <div className="row space-between items-center">
                      <div>
                        <p className="bold fs-p9">{job.tiitle || job.title || "—"}</p>
                        <p className="fs-p8 text-secondary">
                          {job.companyModel?.companyName || "—"}
                        </p>
                      </div>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                        background: isOpen ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
                        color:      isOpen ? "var(--success)"      : "var(--gray-500)",
                      }}>
                        {isOpen ? "Active" : "Closed"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Assignment rate card */}
          <div className="card p-4" style={{ background: "var(--gray-100)", border: "none" }}>
            <h4 className="bold mb-3">Assignment Rate</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <h2 className="bold" style={{ color: "var(--primary)" }}>{assignRate}%</h2>
              <p className="fs-p9 text-secondary">
                {assignedCount} of {myStudents.length} students assigned
              </p>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--gray-200)", overflow: "hidden" }}>
              <div style={{
                width: `${assignRate}%`, height: "100%",
                background: "var(--primary)", borderRadius: 4,
                transition: "width 0.4s",
              }} />
            </div>

            {/* Quick nav */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Feedback",         path: "/tutor-page/feedback"          },
                { label: "Student Location",  path: "/tutor-page/student-location" },
                { label: "Meetings",          path: "/tutor-page/meetings"         },
              ].map((a, i) => (
                <div
                  key={i}
                  className="hover-bg"
                  onClick={() => navigate(a.path)}
                  style={{
                    padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid var(--border-color)", background: "#fff",
                  }}
                >
                  <p className="fs-p9 bold" style={{ color: "var(--primary)" }}>{a.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TutorDashboard;