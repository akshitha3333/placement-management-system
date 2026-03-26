 import { useState } from "react";
import { useNavigate } from "react-router-dom";

function TutorDashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: "My Students", value: 45, icon: "👨‍🎓", color: "#325563", path: "/tutor-page/students" },
    { label: "Placed Students", value: 18, icon: "✅", color: "#16a34a", path: "/tutor-page/placement-report" },
    { label: "Pending Feedback", value: 6, icon: "💬", color: "#f59e0b", path: "/tutor-page/feedback" },
    { label: "Meetings Today", value: 2, icon: "📹", color: "#0ea5e9", path: "/tutor-page/meetings" },
  ];

  const recentFeedback = [
    { student: "Arjun Kumar", company: "TechCorp", status: "Positive", text: "Good technical skills, needs communication improvement." },
    { student: "Priya Sharma", company: "InfoSys", status: "Positive", text: "Excellent problem-solving, recommend for placement." },
    { student: "Rahul Mehta", company: "DataHub", status: "Needs Work", text: "Needs more preparation on data structures." },
  ];

  const upcomingInterviews = [
    { student: "Sneha Reddy", company: "CloudTech", date: "Mar 26", dept: "CSE" },
    { student: "Vijay Patel", company: "TechCorp", date: "Mar 27", dept: "IT" },
    { student: "Ananya Singh", company: "InfoSys", date: "Mar 28", dept: "ECE" },
  ];

  return (
    <div>
      <h2 className="fs-5 bold mb-1">Tutor Dashboard</h2>
      <p className="fs-p9 text-secondary mb-4">Monitor your students' placement progress</p>

      {/* Stats */}
      <div className="row mb-5">
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

      <div className="row">
        {/* Recent Feedback */}
        <div className="col-7 p-2">
          <div className="card p-4">
            <div className="row space-between items-center mb-3">
              <h4>💬 Recent Company Feedback</h4>
              <button className="btn btn-primary w-auto" style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => navigate("/tutor-page/feedback")}>View All</button>
            </div>
            {recentFeedback.map((fb, i) => (
              <div key={i} className="p-3 mb-2" style={{ border: "1px solid var(--border-color)", borderRadius: "10px", borderLeft: `3px solid ${fb.status === "Positive" ? "#16a34a" : "#f59e0b"}` }}>
                <div className="row space-between items-center mb-1">
                  <span className="bold">{fb.student}</span>
                  <span className="fs-p8" style={{ color: fb.status === "Positive" ? "#16a34a" : "#f59e0b" }}>{fb.status}</span>
                </div>
                <p className="fs-p8 text-secondary">From: {fb.company}</p>
                <p className="fs-p9 mt-1">{fb.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="col-5 p-2">
          <div className="card p-4">
            <h4 className="mb-3">📅 Students' Upcoming Interviews</h4>
            {upcomingInterviews.map((inv, i) => (
              <div key={i} className="row space-between items-center p-2 mb-1 hover-bg br-md">
                <div>
                  <div className="bold fs-p9">{inv.student}</div>
                  <div className="fs-p8 text-secondary">{inv.dept} • {inv.company}</div>
                </div>
                <span className="status-item fs-p8" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>{inv.date}</span>
              </div>
            ))}
          </div>

          {/* Placement Rate */}
          <div className="card p-4 mt-3" style={{ background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)" }}>
            <h4 className="mb-2">📈 Placement Rate</h4>
            <div style={{ position: "relative" }}>
              <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "5px" }}>
                <div style={{ width: "40%", height: "10px", background: "#325563", borderRadius: "5px" }} />
              </div>
              <p className="fs-p9 mt-1 text-secondary">18 of 45 students placed <span className="bold" style={{ color: "#325563" }}>(40%)</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorDashboard;
