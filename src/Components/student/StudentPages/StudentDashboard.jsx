import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);

  // UI mock stats — replace with real API
  const stats = [
    { label: "Jobs Available", value: 18, icon: "💼", color: "#325563", path: "/student-page/job-posts" },
    { label: "Applications", value: 4, icon: "📄", color: "#0ea5e9", path: "/student-page/applications" },
    { label: "Interviews", value: 2, icon: "📅", color: "#f59e0b", path: "/student-page/interviews" },
    { label: "Offers", value: 1, icon: "🎯", color: "#16a34a", path: "/student-page/offers" },
  ];

  const recentJobs = [
    { company: "TechCorp", title: "Software Engineer", package: "10 LPA", deadline: "Apr 5, 2026", skills: "React, Java", eligible: true },
    { company: "InfoSys", title: "Systems Analyst", package: "7 LPA", deadline: "Apr 10, 2026", skills: "SQL, Python", eligible: true },
    { company: "DataHub", title: "Data Analyst", package: "9 LPA", deadline: "Apr 15, 2026", skills: "Python, ML", eligible: false },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="card p-4 mb-4" style={{ background: "linear-gradient(135deg, #0b2e40, #325563)", color: "white", border: "none" }}>
        <div className="row space-between items-center">
          <div>
            <h2 className="bold mb-1">👋 Welcome back!</h2>
            <p className="fs-p9" style={{ opacity: 0.85 }}>Your placement journey is on track. Keep applying!</p>
          </div>
         
        </div>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {stats.map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4 stat-card cursor-pointer" onClick={() => navigate(s.path)}>
              <div className="row space-between items-center mb-2">
                <p className="fs-p9 text-secondary">{s.label}</p>
                <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
              </div>
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Jobs + Profile Completion */}
      <div className="row">
        <div className="col-8 p-2">
          <div className="card p-4">
            <div className="row space-between items-center mb-3">
              <h4>💼 Recent Job Posts</h4>
              <button className="btn btn-primary w-auto" style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => navigate("/student-page/job-posts")}>View All</button>
            </div>
            {recentJobs.map((job, i) => (
              <div key={i} className="p-3 mb-2 hover-bg" style={{ border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                <div className="row space-between items-center">
                  <div>
                    <div className="bold">{job.title}</div>
                    <div className="fs-p8 text-secondary">{job.company} • {job.package}</div>
                    <div className="fs-p8 text-secondary mt-1">Skills: {job.skills}</div>
                  </div>
                  <div className="text-right">
                    <div className="fs-p8 text-secondary mb-2">Deadline: {job.deadline}</div>
                    {job.eligible ? (
                      <button className="btn btn-primary w-auto" style={{ padding: "5px 14px", fontSize: "0.8rem" }}
                        onClick={() => navigate("/student-page/job-posts")}>Apply →</button>
                    ) : (
                      <span className="status-item fs-p8" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>Not Eligible</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-4 p-2">
          <div className="card p-4 mb-3">
            <h4 className="mb-3">👤 Profile Strength</h4>
            <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 16px" }}>
              <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", width: "80px", height: "80px" }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#325563" strokeWidth="3"
                  strokeDasharray="75 100" strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontWeight: "bold", fontSize: "1rem" }}>75%</div>
            </div>
            {[
              { label: "Basic Info", done: true },
              { label: "Resume Upload", done: true },
              { label: "Skills Added", done: true },
              { label: "Photo Upload", done: false },
            ].map((item, i) => (
              <div key={i} className="row items-center mb-1" style={{ gap: "8px" }}>
                <span style={{ color: item.done ? "#16a34a" : "#dc2626" }}>{item.done ? "✅" : "⭕"}</span>
                <span className="fs-p9" style={{ color: item.done ? "inherit" : "#6b7280" }}>{item.label}</span>
              </div>
            ))}
            <button className="btn btn-primary mt-3" style={{ fontSize: "0.8rem", padding: "8px" }}
              onClick={() => navigate("/student-page/profile")}>Complete Profile</button>
          </div>

         
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
