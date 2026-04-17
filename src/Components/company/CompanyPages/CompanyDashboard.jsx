import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function CompanyDashboard() {
  const navigate = useNavigate();
  const [jobs,        setJobs]        = useState([]);
  const [company,     setCompany]     = useState(null);
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
        // Fetch job posts
        const jobRes  = await axios.get(rest.jobPost, header);
        const jobList = jobRes.data?.data || jobRes.data || [];
        setJobs(Array.isArray(jobList) ? jobList : []);

        // Fetch company profile
        const compRes  = await axios.get(rest.companys, header);
        const compList = compRes.data?.data || compRes.data || [];
        const me       = Array.isArray(compList) ? compList[0] : compList;
        setCompany(me);
      } catch (err) {
        console.error("Dashboard init:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const quickActions = [
    { label: "Post New Job",       icon: "➕", path: "/company-page/job-posts",    color: "#325563" },
    { label: "View Shortlisted",   icon: "✅", path: "/company-page/shortlisted",  color: "#16a34a" },
    { label: "Schedule Interview", icon: "📅", path: "/company-page/interviews",   color: "#0ea5e9" },
    { label: "Release Offer",      icon: "🎯", path: "/company-page/offers",       color: "#f59e0b" },
  ];

  const activeJobs  = jobs.filter((j) => {
    const last = j.lastDateToApply;
    return !last || new Date(last) >= new Date();
  });

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
              🏢 {loading ? "Welcome!" : (company?.companyName || "Welcome!")}
            </h2>
            <p className="fs-p9" style={{ opacity: 0.85 }}>
              Manage your recruitment pipeline from here
            </p>
          </div>
          <button
            className="btn w-auto"
            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", padding: "8px 20px" }}
            onClick={() => navigate("/company-page/profile")}
          >
            View Profile
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="row mb-4">
        {[
          { title: "Total Job Posts",  value: jobs.length,        sub: `${activeJobs.length} active`, icon: "💼", path: "/company-page/job-posts",   color: "#325563" },
          { title: "Applications",     value: "—",                sub: "Across all posts",            icon: "📄", path: "/company-page/applications", color: "#0ea5e9" },
          { title: "Interviews",       value: "—",                sub: "Scheduled",                   icon: "📅", path: "/company-page/interviews",   color: "#f59e0b" },
          { title: "Offers Released",  value: "—",                sub: "Track in Offers",             icon: "🎯", path: "/company-page/offers",       color: "#16a34a" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4 stat-card cursor-pointer" onClick={() => navigate(s.path)}>
              <div className="row space-between items-center mb-2">
                <p className="fs-p9 text-secondary">{s.title}</p>
                <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
              </div>
              <h2 className="bold" style={{ color: s.color }}>{loading ? "…" : s.value}</h2>
              <p className="fs-p9 text-secondary">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Job Posts + Quick Actions ── */}
      <div className="row">
        <div className="col-8 p-2">
          <div className="card p-4">
            <div className="row space-between items-center mb-3">
              <h4>💼 Recent Job Posts</h4>
              <button
                className="btn btn-primary w-auto"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => navigate("/company-page/job-posts")}
              >
                View All
              </button>
            </div>

            {loading ? (
              <p className="text-secondary fs-p9">Loading...</p>
            ) : jobs.length === 0 ? (
              <div className="text-center p-4">
                <p style={{ fontSize: "2rem" }}>📋</p>
                <p className="bold mt-2">No job posts yet</p>
                <button
                  className="btn btn-primary w-auto mt-2"
                  style={{ padding: "8px 20px", fontSize: "0.85rem" }}
                  onClick={() => navigate("/company-page/job-posts")}
                >
                  Create First Job Post
                </button>
              </div>
            ) : (
              jobs.slice(0, 4).map((job, i) => {
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
                          Required: {job.requiredCandidate || "—"} candidates &nbsp;·&nbsp;
                          Min %: {job.eligiblePercentage || "—"}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="fs-p8 text-secondary mb-1">
                          Closes: {job.lastDateToApply || "Open"}
                        </div>
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
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-4 p-2">
          {/* Quick Actions */}
          <div className="card p-4 mb-3">
            <h4 className="mb-3">⚡ Quick Actions</h4>
            {quickActions.map((a, i) => (
              <div
                key={i}
                className="p-2 mb-2 hover-bg cursor-pointer br-md"
                style={{ border: "1px solid var(--border-color)", borderRadius: "10px" }}
                onClick={() => navigate(a.path)}
              >
                <div className="row items-center" style={{ gap: "10px" }}>
                  <span style={{ fontSize: "1.3rem" }}>{a.icon}</span>
                  <span className="fs-p9 bold" style={{ color: a.color }}>{a.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Company info mini card */}
          {company && (
            <div className="card p-4" style={{ background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)", border: "none" }}>
              <h4 className="mb-2">🏢 Company Info</h4>
              <p className="fs-p9 bold">{company.companyName}</p>
              <p className="fs-p8 text-secondary mt-1">
                📧 {company.userModel?.email || company.email || "—"}
              </p>
              <p className="fs-p8 text-secondary mt-1">
                🏭 {company.departmentModel?.departmentName || "—"}
              </p>
              <button
                className="btn btn-primary mt-3"
                style={{ padding: "8px", fontSize: "0.8rem" }}
                onClick={() => navigate("/company-page/profile")}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanyDashboard;