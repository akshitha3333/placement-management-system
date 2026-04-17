import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function StudentDashboard() {
  const navigate = useNavigate();
  const [jobs,        setJobs]        = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${Cookies.get("token")}`,
    },
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [jobRes, sugRes, stuRes] = await Promise.all([
          axios.get(rest.jobPost,        header),
          axios.get(rest.jobSuggestions, header),
          axios.get(rest.students,       header),
        ]);

        const jobList = jobRes.data?.data || jobRes.data || [];
        setJobs(Array.isArray(jobList) ? jobList : []);

        const sugList = sugRes.data?.data || sugRes.data || [];
        setSuggestions(Array.isArray(sugList) ? sugList : []);

        const stuList = stuRes.data?.data || stuRes.data || [];
        const me      = Array.isArray(stuList) ? stuList[0] : stuList;
        setProfile(me);
      } catch (err) {
        console.error("StudentDashboard init:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const activeJobs = jobs.filter(
    (j) => !j.lastDateToApply || new Date(j.lastDateToApply) >= new Date()
  );

  const recentJobs = jobs.slice(0, 3);

  const name   = profile?.name || profile?.studentName || "Student";
  const cgpa   = profile?.cgpa || profile?.marks || "—";
  const dept   = profile?.departmentModel?.departmentName || "—";
  const skills = profile?.skills ? profile.skills.split(",").filter(Boolean) : [];

  // Profile completion score
  const profileChecks = [
    { label: "Basic Info",     done: !!(profile?.name) },
    { label: "Department Set", done: !!(profile?.departmentModel?.departmentId) },
    { label: "Skills Added",   done: skills.length > 0 },
    { label: "CGPA Set",       done: !!(profile?.cgpa || profile?.marks) },
  ];
  const completedCount = profileChecks.filter((c) => c.done).length;
  const profilePct     = Math.round((completedCount / profileChecks.length) * 100);

  const stats = [
    { label: "Available Jobs",    value: activeJobs.length,   icon: "💼", color: "#325563", path: "/student-page/job-posts"          },
    { label: "Recommended Jobs",  value: suggestions.length,  icon: "⭐", color: "#0ea5e9", path: "/student-page/student-recommended" },
    { label: "Interviews",        value: "→",                 icon: "📅", color: "#f59e0b", path: "/student-page/interviews"         },
    { label: "Offers",            value: "→",                 icon: "🎯", color: "#16a34a", path: "/student-page/offers"             },
  ];

  return (
    <div>
      {/* ── Welcome Banner ── */}
      <div
        className="card p-5 mb-4"
        style={{ background: "linear-gradient(135deg, #0b2e40, #325563)", color: "white", border: "none" }}
      >
        <div className="row space-between items-center">
          <div>
            <h2 className="bold mb-1">
              👋 Welcome back, {loading ? "…" : name}!
            </h2>
            <p className="fs-p9" style={{ opacity: 0.85 }}>
              {dept} &nbsp;·&nbsp; CGPA: {cgpa} &nbsp;·&nbsp; Your placement journey is on track!
            </p>
          </div>
          <button
            className="btn w-auto"
            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", padding: "8px 20px" }}
            onClick={() => navigate("/student-page/profile")}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="row mb-4">
        {stats.map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4 stat-card cursor-pointer" onClick={() => navigate(s.path)}>
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

      {/* ── Recent Jobs + Profile ── */}
      <div className="row">
        <div className="col-8 p-2">
          <div className="card p-4">
            <div className="row space-between items-center mb-3">
              <h4>💼 Recent Job Posts</h4>
              <button
                className="btn btn-primary w-auto"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => navigate("/student-page/job-posts")}
              >
                View All
              </button>
            </div>

            {loading ? (
              <p className="text-secondary fs-p9">Loading...</p>
            ) : recentJobs.length === 0 ? (
              <div className="text-center p-4">
                <p style={{ fontSize: "2rem" }}>💼</p>
                <p className="bold mt-2">No job posts yet</p>
                <p className="text-secondary fs-p9">Check back soon!</p>
              </div>
            ) : (
              recentJobs.map((job, i) => {
                const jid    = job.jobPostId || job.id;
                const title  = job.title || job.tiitle;
                const isOpen = !job.lastDateToApply || new Date(job.lastDateToApply) >= new Date();
                return (
                  <div
                    key={jid || i}
                    className="p-3 mb-2 hover-bg"
                    style={{ border: "1px solid var(--border-color)", borderRadius: "10px" }}
                  >
                    <div className="row space-between items-center">
                      <div>
                        <div className="bold">{title}</div>
                        <div className="fs-p8 text-secondary">
                          Min: {job.eligiblePercentage || "—"}% &nbsp;·&nbsp;
                          Seats: {job.requiredCandidate || "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="fs-p8 text-secondary mb-1">
                          Deadline: {job.lastDateToApply || "Open"}
                        </div>
                        {isOpen ? (
                          <button
                            className="btn btn-primary w-auto"
                            style={{ padding: "5px 14px", fontSize: "0.8rem" }}
                            onClick={() => navigate("/student-page/student-recommended")}
                          >
                            Apply →
                          </button>
                        ) : (
                          <span
                            className="status-item fs-p8"
                            style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}
                          >
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-4 p-2">
          {/* Profile Strength */}
          <div className="card p-4 mb-3">
            <h4 className="mb-3">👤 Profile Strength</h4>
            <div
              style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 16px" }}
            >
              <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", width: "80px", height: "80px" }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#325563" strokeWidth="3"
                  strokeDasharray={`${profilePct} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position:  "absolute",
                  top:       "50%",
                  left:      "50%",
                  transform: "translate(-50%,-50%)",
                  fontWeight:"bold",
                  fontSize:  "1rem",
                }}
              >
                {profilePct}%
              </div>
            </div>

            {profileChecks.map((item, i) => (
              <div key={i} className="row items-center mb-1" style={{ gap: "8px" }}>
                <span style={{ color: item.done ? "#16a34a" : "#dc2626" }}>
                  {item.done ? "✅" : "⭕"}
                </span>
                <span className="fs-p9" style={{ color: item.done ? "inherit" : "#6b7280" }}>
                  {item.label}
                </span>
              </div>
            ))}

            <button
              className="btn btn-primary mt-3"
              style={{ fontSize: "0.8rem", padding: "8px" }}
              onClick={() => navigate("/student-page/profile")}
            >
              Complete Profile
            </button>
          </div>

          {/* Skills mini card */}
          {skills.length > 0 && (
            <div className="card p-4" style={{ background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)", border: "none" }}>
              <h4 className="mb-2">🛠️ Your Skills</h4>
              <div className="row" style={{ flexWrap: "wrap", gap: "6px" }}>
                {skills.slice(0, 6).map((sk, i) => (
                  <span
                    key={i}
                    className="fs-p8"
                    style={{ background: "white", borderRadius: "12px", padding: "3px 10px", border: "1px solid var(--border-color)" }}
                  >
                    {sk.trim()}
                  </span>
                ))}
                {skills.length > 6 && (
                  <span className="fs-p8 text-secondary">+{skills.length - 6} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;