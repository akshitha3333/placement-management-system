import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const getHeader = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

function AdminDashboard() {
  const [students,    setStudents]    = useState([]);
  const [companies,   setCompanies]   = useState([]);
  const [jobPosts,    setJobPosts]    = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [studRes, compRes, jobRes, sugRes] = await Promise.allSettled([
          axios.get(rest.students,       getHeader()),
          axios.get(rest.companys,       getHeader()),
          axios.get(rest.jobPost,        getHeader()),
          axios.get(rest.jobSuggestions, getHeader()),
        ]);
        if (studRes.status === "fulfilled") {
          const d = studRes.value.data?.data || studRes.value.data || [];
          setStudents(Array.isArray(d) ? d : []);
        }
        if (compRes.status === "fulfilled") {
          const d = compRes.value.data?.data || compRes.value.data || [];
          setCompanies(Array.isArray(d) ? d : []);
        }
        if (jobRes.status === "fulfilled") {
          const d = jobRes.value.data?.data || jobRes.value.data || [];
          setJobPosts(Array.isArray(d) ? d : []);
        }
        if (sugRes.status === "fulfilled") {
          const d = sugRes.value.data?.data || sugRes.value.data || [];
          setSuggestions(Array.isArray(d) ? d : []);
        }
        console.log("Admin dashboard loaded");
      } catch (err) {
        console.error("AdminDashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalStudents     = students.length;
  const verifiedStudents  = students.filter((s) => s.workingStatus === "VERIFIED").length;
  const totalCompanies    = companies.length;
  const verifiedCompanies = companies.filter((c) => (c.status || "").toUpperCase() === "VERIFIED").length;
  const activeJobs        = jobPosts.filter((j) => (j.status || "").toUpperCase() === "ACTIVE").length;
  const totalSuggestions  = suggestions.length;

  const deptMap = {};
  students.forEach((s) => {
    const name = s.departmentModel?.departmentName || "Other";
    if (!deptMap[name]) deptMap[name] = { total: 0, verified: 0 };
    deptMap[name].total += 1;
    if (s.workingStatus === "VERIFIED") deptMap[name].verified += 1;
  });
  const deptList = Object.entries(deptMap).map(([name, v]) => ({ name, ...v }));

  const industryMap = {};
  companies.forEach((c) => {
    const k = c.industryType || "Other";
    industryMap[k] = (industryMap[k] || 0) + 1;
  });
  const industries = Object.entries(industryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recentJobs = [...jobPosts]
    .sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0))
    .slice(0, 5);

  const barColors = ["var(--primary)", "#0ea5e9", "var(--warning)", "var(--success)", "var(--danger)"];

  if (loading) {
    return <div className="p-5 text-center"><p className="text-secondary">Loading dashboard...</p></div>;
  }

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Header */}
      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">Admin Dashboard</h2>
        <p className="fs-p9 text-secondary">Placement system overview</p>
      </div>

      <div className="row mb-4" style={{ gap: 12 }}>
        {[
          { label: "Total Students",   value: totalStudents,    sub: `${verifiedStudents} verified`,    color: "var(--primary)" },
          { label: "Companies",        value: totalCompanies,   sub: `${verifiedCompanies} verified`,   color: "#0ea5e9"         },
          { label: "Active Job Posts", value: activeJobs,       sub: `${jobPosts.length} total`,        color: "var(--success)"  },
          { label: "Job Suggestions",  value: totalSuggestions, sub: "from tutors",                     color: "var(--warning)"  },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div className="card p-4" style={{ borderLeft: `4px solid ${s.color}` }}>
              <p className="fs-p9 text-secondary mb-2">{s.label}</p>
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p8 text-secondary mt-1">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row — dept table + industry bars */}
      <div className="row mb-4" style={{ gap: 12 }}>

        {/* Department breakdown */}
        <div style={{ flex: 1 }}>
          <div className="card p-4">
            <h4 className="bold mb-3">Students by Department</h4>
            {deptList.length === 0 ? (
              <p className="text-secondary fs-p9">No student data.</p>
            ) : (
              <table className="w-100">
                <thead>
                  <tr>
                    <th className="fs-p8 text-secondary">Department</th>
                    <th className="fs-p8 text-secondary" style={{ textAlign: "center" }}>Total</th>
                    <th className="fs-p8 text-secondary" style={{ textAlign: "center" }}>Verified</th>
                    <th className="fs-p8 text-secondary">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {deptList.map((d, i) => {
                    const rate = d.total > 0 ? Math.round((d.verified / d.total) * 100) : 0;
                    return (
                      <tr key={i} className="hover-bg">
                        <td className="bold fs-p9">{d.name}</td>
                        <td className="fs-p9" style={{ textAlign: "center" }}>{d.total}</td>
                        <td className="fs-p9 bold" style={{ textAlign: "center", color: "var(--success)" }}>{d.verified}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--gray-200)", overflow: "hidden" }}>
                              <div style={{ width: `${rate}%`, height: "100%", background: "var(--primary)", borderRadius: 3 }} />
                            </div>
                            <span className="fs-p8 text-secondary">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="card p-4">
            <h4 className="bold mb-3">Company Industries</h4>
            {industries.length === 0 ? (
              <p className="text-secondary fs-p9">No company data.</p>
            ) : (
              <>
                {industries.map(([industry, count], i) => {
                  const pct = totalCompanies > 0 ? Math.round((count / totalCompanies) * 100) : 0;
                  return (
                    <div key={i} className="mb-3">
                      <div className="row space-between items-center mb-1">
                        <span className="fs-p9 bold">{industry}</span>
                        <span className="fs-p8 text-secondary">{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "var(--gray-200)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: barColors[i % barColors.length], borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}

                <div className="row mt-3" style={{ gap: 10 }}>
                  {[
                    { label: "Verified",   value: verifiedCompanies,                 color: "var(--success)" },
                    { label: "Unverified", value: totalCompanies - verifiedCompanies, color: "var(--warning)" },
                  ].map((s, i) => (
                    <div key={i} className="card p-2 text-center" style={{ flex: 1, boxShadow: "none" }}>
                      <p className="bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="fs-p8 text-secondary">{s.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent job posts table */}
      <div className="card p-4 mb-4">
        <div className="row space-between items-center mb-3">
          <h4 className="bold">Recent Job Posts</h4>
          <span className="fs-p8 text-secondary">{activeJobs} active / {jobPosts.length} total</span>
        </div>
        {recentJobs.length === 0 ? (
          <p className="text-secondary fs-p9 text-center p-3">No job posts yet.</p>
        ) : (
          <table className="w-100">
            <thead>
              <tr>
                <th className="fs-p8 text-secondary">Title</th>
                <th className="fs-p8 text-secondary">Company</th>
                <th className="fs-p8 text-secondary" style={{ textAlign: "center" }}>Openings</th>
                <th className="fs-p8 text-secondary">Posted</th>
                <th className="fs-p8 text-secondary">Deadline</th>
                <th className="fs-p8 text-secondary">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((job, i) => {
                const isActive = (job.status || "").toUpperCase() === "ACTIVE";
                return (
                  <tr key={job.jobPostId || i} className="hover-bg">
                    <td className="bold fs-p9">{job.tiitle || job.title || "—"}</td>
                    <td className="fs-p9 text-secondary">{job.companyModel?.companyName || "—"}</td>
                    <td className="fs-p9" style={{ textAlign: "center" }}>{job.requiredCandidate || "—"}</td>
                    <td className="fs-p9 text-secondary">{job.postedDate || "—"}</td>
                    <td className="fs-p9 text-secondary">{job.lastDateToApply || "—"}</td>
                    <td>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                        background: isActive ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
                        color:      isActive ? "var(--success)"      : "var(--gray-500)",
                      }}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary bottom cards */}
      <div className="row" style={{ gap: 12 }}>
        {[
          { label: "Total Suggestions", value: totalSuggestions,  sub: "Tutor-recommended job matches", color: "var(--warning)", bg: "rgba(245,158,11,0.06)"  },
          { label: "Verified Students", value: verifiedStudents,   sub: `of ${totalStudents} registered`,color: "var(--success)", bg: "rgba(22,163,74,0.06)"   },
          { label: "Verified Companies",value: verifiedCompanies,  sub: `${totalCompanies - verifiedCompanies} pending`,color: "var(--primary)", bg: "rgba(50,85,99,0.06)" },
        ].map((c, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div className="card p-4" style={{ background: c.bg, border: "none" }}>
              <p className="fs-p9 text-secondary bold mb-2">{c.label}</p>
              <h2 className="bold mb-1" style={{ color: c.color }}>{c.value}</h2>
              <p className="fs-p8 text-secondary">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default AdminDashboard;