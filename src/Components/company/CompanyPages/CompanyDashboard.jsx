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

function CompanyDashboard() {
  const navigate = useNavigate();
  const [jobs,        setJobs]        = useState([]);
  const [apps,        setApps]        = useState([]);
  const [company,     setCompany]     = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [jobRes, compRes, appRes] = await Promise.allSettled([
          axios.get(rest.jobPost,        getHeader()),
          axios.get(rest.companys,       getHeader()),
          axios.get(rest.jobApplications,getHeader()),
        ]);

        if (jobRes.status === "fulfilled") {
          const d = jobRes.value.data?.data || jobRes.value.data || [];
          setJobs(Array.isArray(d) ? d : []);
          console.log("Company jobs:", d.length, d);
        }
        if (compRes.status === "fulfilled") {
          const d = compRes.value.data?.data || compRes.value.data || [];
          const me = Array.isArray(d) ? d[0] : d;
          setCompany(me);
          console.log("Company profile:", me);
        }
        if (appRes.status === "fulfilled") {
          const d = appRes.value.data?.data || appRes.value.data || [];
          setApps(Array.isArray(d) ? d : []);
          console.log("Applications:", d.length);
        }
      } catch (err) {
        console.error("CompanyDashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const activeJobs   = jobs.filter((j) => !j.lastDateToApply || new Date(j.lastDateToApply) >= new Date());
  const recentJobs   = jobs.slice(0, 5);
  const isVerified   = (company?.status || "").toUpperCase() === "VERIFIED";

  const quickNav = [
    { label: "Post New Job",       path: "/company-page/job-posts",    color: "var(--primary)" },
    { label: "View Applications",  path: "/company-page/applications", color: "#0ea5e9"         },
    { label: "Interviews",         path: "/company-page/interviews",   color: "var(--warning)"  },
    { label: "Offer Letters",      path: "/company-page/offers",       color: "var(--success)"  },
    { label: "Meetings",           path: "/company-page/meetings",     color: "var(--secondary)"},
  ];

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Welcome banner */}
      <div className="card p-4 mb-4" style={{
        background: "linear-gradient(135deg, #0b2e40, #325563)",
        color: "#fff", border: "none",
      }}>
        <div className="row space-between items-center">
          <div>
            <h2 className="bold mb-1">
              {loading ? "Welcome!" : (company?.companyName || "Welcome!")}
            </h2>
            <p className="fs-p9" style={{ opacity: 0.8 }}>
              {company?.industryType || ""}{company?.location ? ` · ${company.location}` : ""}
            </p>
            {/* Verification status */}
            <span style={{
              display: "inline-block", marginTop: 8,
              fontSize: "0.72rem", fontWeight: 600,
              padding: "3px 10px", borderRadius: 10,
              background: isVerified ? "rgba(22,163,74,0.25)" : "rgba(245,158,11,0.25)",
              color: isVerified ? "#86efac" : "#fcd34d",
            }}>
              {isVerified ? "Verified" : "Pending Verification"}
            </span>
          </div>
          <button
            style={{
              padding: "8px 20px", borderRadius: 8,
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer",
              fontWeight: 600, fontSize: "0.85rem",
            }}
            onClick={() => navigate("/company-page/profile")}
          >
            View Profile
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="row mb-4" style={{ gap: 12 }}>
        {[
          { label: "Total Job Posts",  value: jobs.length,       sub: `${activeJobs.length} active`,  color: "var(--primary)", path: "/company-page/job-posts"    },
          { label: "Applications",     value: apps.length,       sub: "received",                      color: "#0ea5e9",        path: "/company-page/applications"  },
          { label: "Shortlisted",      value: "—",               sub: "view in Shortlisted",           color: "var(--warning)", path: "/company-page/shortlisted"   },
          { label: "Offer Letters",    value: "—",               sub: "sent",                          color: "var(--success)", path: "/company-page/offers"        },
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

      {/* Job posts + Quick nav */}
      <div className="row" style={{ gap: 12 }}>

        {/* Recent job posts */}
        <div style={{ flex: 2 }}>
          <div className="card p-4">
            <div className="row space-between items-center mb-3">
              <h4 className="bold">Recent Job Posts</h4>
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
            ) : recentJobs.length === 0 ? (
              <div className="text-center p-4">
                <p className="bold mt-2">No job posts yet</p>
                <button
                  className="btn btn-primary w-auto mt-2"
                  style={{ padding: "8px 20px" }}
                  onClick={() => navigate("/company-page/job-posts")}
                >
                  Create First Job Post
                </button>
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
                          {job.requiredCandidate || "—"} openings · Min {job.eligiblePercentage || "—"}%
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className="fs-p8 text-secondary">Deadline: {job.lastDateToApply || "Open"}</p>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                          background: isOpen ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
                          color:      isOpen ? "var(--success)"      : "var(--gray-500)",
                        }}>
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

        {/* Quick navigation */}
        <div style={{ flex: 1 }}>
          <div className="card p-4 mb-3">
            <h4 className="bold mb-3">Quick Navigation</h4>
            {quickNav.map((a, i) => (
              <div
                key={i}
                className="hover-bg"
                onClick={() => navigate(a.path)}
                style={{
                  padding: "10px 14px", marginBottom: 8,
                  border: "1px solid var(--border-color)", borderRadius: 8,
                  cursor: "pointer", borderLeft: `3px solid ${a.color}`,
                }}
              >
                <p className="fs-p9 bold" style={{ color: a.color }}>{a.label}</p>
              </div>
            ))}
          </div>

          {/* Company info */}
          {company && (
            <div className="card p-4" style={{ background: "var(--gray-100)", border: "none" }}>
              <h4 className="bold mb-3">Company Info</h4>
              <p className="fs-p9 bold">{company.companyName}</p>
              <p className="fs-p8 text-secondary mt-1">{company.email || "—"}</p>
              <p className="fs-p8 text-secondary mt-1">{company.phone || "—"}</p>
              <p className="fs-p8 text-secondary mt-1">{company.location || "—"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanyDashboard;