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

function StudentDashboard() {
  const navigate = useNavigate();
  const [jobs,        setJobs]        = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [apps,        setApps]        = useState([]);
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [jobRes, sugRes, appRes, stuRes] = await Promise.allSettled([
          axios.get(rest.jobPost,        getHeader()),
          axios.get(rest.jobSuggestions, getHeader()),
          axios.get(rest.jobApplications,getHeader()),
          axios.get(rest.students,       getHeader()),
        ]);

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
        if (appRes.status === "fulfilled") {
          const d = appRes.value.data?.data || appRes.value.data || [];
          setApps(Array.isArray(d) ? d : []);
          console.log("Applications:", d.length);
        }
        if (stuRes.status === "fulfilled") {
          const d = stuRes.value.data?.data || stuRes.value.data || [];
          // students endpoint for STUDENT role returns only the logged-in student
          const me = Array.isArray(d) ? d[0] : d;
          setProfile(me);
          console.log("Student profile:", me);
        }
      } catch (err) {
        console.error("StudentDashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const name       = profile?.name || "Student";
  const dept       = profile?.departmentModel?.departmentName || "—";
  const percentage = profile?.percentage || "—";
  const rollNo     = profile?.rollNumber || "—";
  const phone      = profile?.phone || "—";

  const activeJobs  = jobs.filter((j) => !j.lastDateToApply || new Date(j.lastDateToApply) >= new Date());
  const recentJobs  = jobs.slice(0, 4);

  // Profile completion
  const checks = [
    { label: "Name",       done: !!profile?.name },
    { label: "Department", done: !!profile?.departmentModel?.departmentId },
    { label: "Phone",      done: !!profile?.phone },
    { label: "Percentage", done: !!profile?.percentage },
    { label: "Roll No",    done: !!profile?.rollNumber },
  ];
  const completedCount = checks.filter((c) => c.done).length;
  const profilePct     = Math.round((completedCount / checks.length) * 100);

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Welcome banner */}
      <div className="card p-4 mb-4" style={{
        background: "linear-gradient(135deg, #0b2e40, #325563)",
        color: "#fff", border: "none",
      }}>
        <div className="row space-between items-center">
          <div>
            <h2 className="bold mb-1">Welcome, {loading ? "..." : name}!</h2>
            <p className="fs-p9" style={{ opacity: 0.8 }}>
              {dept} · Roll No: {rollNo} · {percentage !== "—" ? `${percentage}%` : ""}
            </p>
          </div>
          <button
            style={{
              padding: "8px 20px", borderRadius: 8,
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer",
              fontWeight: 600, fontSize: "0.85rem",
            }}
            onClick={() => navigate("/student-page/profile")}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="row mb-4" style={{ gap: 12 }}>
        {[
          { label: "Available Jobs",   value: activeJobs.length,   sub: "open for application",    color: "var(--primary)", path: "/student-page/job-posts"          },
          { label: "Recommended",      value: suggestions.length,  sub: "by your tutor",           color: "#0ea5e9",        path: "/student-page/student-recommended" },
          { label: "My Applications",  value: apps.length,         sub: "submitted",               color: "var(--warning)", path: "/student-page/applications"        },
          { label: "Offers",           value: "View",              sub: "check offer letters",     color: "var(--success)", path: "/student-page/offers"              },
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

      {/* Job posts + Profile sidebar */}
      <div className="row" style={{ gap: 12 }}>

        {/* Recent job posts */}
        <div style={{ flex: 2 }}>
          <div className="card p-4">
            <div className="row space-between items-center mb-3">
              <h4 className="bold">Recent Job Posts</h4>
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
                <p className="bold">No job posts yet</p>
                <p className="text-secondary fs-p9 mt-1">Check back soon!</p>
              </div>
            ) : (
              recentJobs.map((job, i) => {
                const isOpen = !job.lastDateToApply || new Date(job.lastDateToApply) >= new Date();
                return (
                  <div key={job.jobPostId || i} className="p-3 mb-2 hover-bg" style={{
                    border: "1px solid var(--border-color)", borderRadius: 8,
                    borderLeft: `3px solid ${isOpen ? "var(--success)" : "var(--gray-400)"}`,
                  }}>
                    <div className="row space-between items-center">
                      <div>
                        <p className="bold fs-p9">{job.tiitle || job.title || "—"}</p>
                        <p className="fs-p8 text-secondary">
                          {job.companyModel?.companyName || "—"} · Min {job.eligiblePercentage || "—"}% · {job.requiredCandidate || "—"} seats
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className="fs-p8 text-secondary mb-1">Deadline: {job.lastDateToApply || "Open"}</p>
                        {isOpen ? (
                          <button
                            className="btn btn-primary w-auto"
                            style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                            onClick={() => navigate("/student-page/student-recommended")}
                          >
                            Apply
                          </button>
                        ) : (
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                            background: "rgba(220,38,38,0.1)", color: "var(--danger)",
                          }}>
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

        {/* Profile sidebar */}
        <div style={{ flex: 1 }}>

          {/* Profile strength */}
          <div className="card p-4 mb-3">
            <h4 className="bold mb-3">Profile Strength</h4>

            {/* Circle gauge */}
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 16px" }}>
              <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", width: 80, height: 80 }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--gray-200)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke="var(--primary)" strokeWidth="3"
                  strokeDasharray={`${profilePct} 100`} strokeLinecap="round" />
              </svg>
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                fontWeight: "bold", fontSize: "1rem",
              }}>
                {profilePct}%
              </div>
            </div>

            {checks.map((item, i) => (
              <div key={i} className="row items-center mb-2" style={{ gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                  background: item.done ? "var(--success)" : "var(--gray-300)",
                }} />
                <span className="fs-p9" style={{ color: item.done ? "var(--text-primary)" : "var(--gray-500)" }}>
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

          {/* Quick links */}
          <div className="card p-4">
            <h4 className="bold mb-3">Quick Access</h4>
            {[
              { label: "My Interviews",  path: "/student-page/interviews",         color: "var(--warning)"  },
              { label: "My Offers",      path: "/student-page/offers",             color: "var(--success)"  },
              { label: "Meetings",       path: "/student-page/meetings",           color: "#0ea5e9"          },
              { label: "My Resume",      path: "/student-page/student-resume",     color: "var(--primary)"  },
            ].map((a, i) => (
              <div
                key={i}
                className="hover-bg"
                onClick={() => navigate(a.path)}
                style={{
                  padding: "9px 12px", marginBottom: 6,
                  border: "1px solid var(--border-color)", borderRadius: 8,
                  cursor: "pointer", borderLeft: `3px solid ${a.color}`,
                }}
              >
                <p className="fs-p9 bold" style={{ color: a.color }}>{a.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;