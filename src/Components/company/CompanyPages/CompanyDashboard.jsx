import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CompanyDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Mock data for UI (replace with real API calls)
  const stats = [
    { title: "Active Job Posts", value: 5, sub: "2 closing soon", icon: "💼" },
    { title: "Total Applications", value: 128, sub: "+12 this week", icon: "📄" },
    { title: "Shortlisted", value: 34, sub: "Pending review", icon: "✅" },
    { title: "Offers Released", value: 8, sub: "4 accepted", icon: "🎯" },
  ];

  const recentApplications = [
    { name: "Arjun Kumar", dept: "CSE", job: "Software Engineer", cgpa: 8.9, status: "Applied" },
    { name: "Priya Sharma", dept: "ECE", job: "Embedded Engineer", cgpa: 8.2, status: "Shortlisted" },
    { name: "Rahul Mehta", dept: "CSE", job: "Software Engineer", cgpa: 9.1, status: "Interviewed" },
    { name: "Sneha Reddy", dept: "IT", job: "DevOps Engineer", cgpa: 7.8, status: "Applied" },
  ];

  const statusColor = (s) => ({
    Applied: ["rgba(14,165,233,0.1)", "#0ea5e9"],
    Shortlisted: ["rgba(245,158,11,0.1)", "#f59e0b"],
    Interviewed: ["rgba(101,163,13,0.1)", "#65a30d"],
    Selected: ["rgba(22,163,74,0.1)", "#16a34a"],
    Rejected: ["rgba(220,38,38,0.1)", "#dc2626"],
  }[s] || ["rgba(107,114,128,0.1)", "#6b7280"]);

  return (
    <div>
      <h2 className="fs-5 bold mb-1">Company Dashboard</h2>
      <p className="fs-p9 text-secondary mb-4">Manage your recruitment pipeline</p>

      {/* Stats */}
      <div className="row mb-5">
        {stats.map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4 stat-card">
              <div className="row space-between items-center mb-2">
                <p className="fs-p9 text-secondary">{s.title}</p>
                <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
              </div>
              <h2 className="bold">{s.value}</h2>
              <p className="fs-p9 text-success">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="card p-4 mb-4">
        <div className="row space-between items-center mb-3">
          <h4>Recent Applications</h4>
          <button className="btn btn-primary w-auto" style={{ padding: "6px 16px", fontSize: "0.85rem" }}
            onClick={() => navigate("/company-page/applications")}>View All</button>
        </div>
        <table className="w-100">
          <thead>
            <tr><th>Candidate</th><th>Department</th><th>Applied For</th><th>CGPA</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {recentApplications.map((a, i) => {
              const [bg, color] = statusColor(a.status);
              return (
                <tr key={i} className="hover-bg">
                  <td><div className="bold">{a.name}</div></td>
                  <td>{a.dept}</td>
                  <td>{a.job}</td>
                  <td className="bold">{a.cgpa}</td>
                  <td><span className="status-item" style={{ background: bg, color }}>{a.status}</span></td>
                  <td><span className="cursor-pointer">👁️</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="row" style={{ gap: "16px" }}>
        {[
          { label: "Post New Job", icon: "➕", path: "/company-page/job-posts", color: "#325563" },
          { label: "View Shortlisted", icon: "✅", path: "/company-page/shortlisted", color: "#16a34a" },
          { label: "Schedule Interview", icon: "📅", path: "/company-page/interviews", color: "#0ea5e9" },
          { label: "Release Offer", icon: "🎯", path: "/company-page/offers", color: "#f59e0b" },
        ].map((a, i) => (
          <div key={i} className="card p-4 stat-card cursor-pointer text-center" style={{ flex: 1 }}
            onClick={() => navigate(a.path)}>
            <p style={{ fontSize: "2rem" }}>{a.icon}</p>
            <p className="fs-p9 bold mt-1" style={{ color: a.color }}>{a.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompanyDashboard;
