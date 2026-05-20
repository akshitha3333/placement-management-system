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
  const [suggestions, setSuggestions] = useState([]);
  const [apps,        setApps]        = useState([]);
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [sugRes, appRes, profileRes] = await Promise.allSettled([
          axios.get(rest.jobSuggestions, getHeader()),
          axios.get(rest.jobApplications, getHeader()),
          axios.get(rest.students.replace("students", "student-profile"), getHeader()),
        ]);

        if (sugRes.status === "fulfilled") {
          const d = sugRes.value.data?.data || sugRes.value.data || [];
          setSuggestions(Array.isArray(d) ? d : []);
        }
        if (appRes.status === "fulfilled") {
          const d = appRes.value.data?.data || appRes.value.data || [];
          setApps(Array.isArray(d) ? d : []);
        }
        if (profileRes.status === "fulfilled") {
          const d = profileRes.value.data?.data || profileRes.value.data;
          const me = Array.isArray(d) ? d[0] : d;
          setProfile(me);
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
  const email      = profile?.userModel?.email || profile?.email || "—";

  const checks = [
    { label: "Name",       done: !!profile?.name       },
    { label: "Department", done: !!profile?.departmentModel?.departmentId },
    { label: "Phone",      done: !!profile?.phone      },
    { label: "Percentage", done: !!profile?.percentage },
    { label: "Roll No",    done: !!profile?.rollNumber },
  ];
  const profilePct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

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
              {dept} · Roll No: {rollNo} · {percentage !== "—" ? `${percentage}%` : ""} · {email}
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
          { label: "Recommended",     value: suggestions.length, sub: "by your tutor",       color: "#0ea5e9",        path: "/student-page/student-recommended" },
          { label: "My Applications", value: apps.length,        sub: "submitted",           color: "var(--warning)", path: "/student-page/applications"        },
          { label: "Offers",          value: "View",             sub: "check offer letters", color: "var(--success)", path: "/student-page/offers"              },
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

      {/* Profile completion + Quick links */}
      <div className="row" style={{ gap: 12 }}>

        {/* Profile strength */}
        <div style={{ flex: 1 }}>
          <div className="card p-4">
            <h4 className="bold mb-3">Profile Strength</h4>

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
        </div>

        {/* Quick links */}
        <div style={{ flex: 1 }}>
          <div className="card p-4">
            <h4 className="bold mb-3">Quick Access</h4>
            {[
              { label: "My Interviews", path: "/student-page/interviews", color: "var(--warning)" },
              { label: "My Offers",     path: "/student-page/offers",     color: "var(--success)" },
              { label: "Meetings",      path: "/student-page/meetings",   color: "#0ea5e9"        },
              { label: "My Resume",     path: "/student-page/profile",    color: "var(--primary)" },
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