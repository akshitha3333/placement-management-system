import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const getToken = () => Cookies.get("token") || localStorage.getItem("token") || "";
const header = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  },
});

function AdminDashboard() {
  const [students,     setStudents]     = useState([]);
  const [companies,    setCompanies]    = useState([]);
  const [jobPosts,     setJobPosts]     = useState([]);
  const [suggestions,  setSuggestions]  = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [studRes, compRes, jobRes, sugRes] = await Promise.allSettled([
          axios.get(rest.students,        header()),
          axios.get(rest.companys,        header()),
          axios.get(rest.jobPost,         header()),
          axios.get(rest.jobSuggestions,  header()),
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
      } catch (err) {
        console.error("AdminDashboard fetchAll:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Derived stats ──────────────────────────────────────
  const totalStudents    = students.length;
  const verifiedStudents = students.filter((s) => s.workingStatus === "VERIFIED").length;
  const placedStudents   = students.filter((s) => s.workingStatus === "Placed").length;
  const totalCompanies   = companies.length;
  const verifiedCompanies= companies.filter((c) => (c.status || "").toUpperCase() === "VERIFIED").length;
  const activeJobs       = jobPosts.filter((j) => (j.status || "").toUpperCase() === "ACTIVE").length;
  const totalSuggestions = suggestions.length;

  // ── Department-wise student count ─────────────────────
  const deptMap = {};
  students.forEach((s) => {
    const name = s.departmentModel?.departmentName || "Other";
    if (!deptMap[name]) deptMap[name] = { total: 0, verified: 0 };
    deptMap[name].total += 1;
    if (s.workingStatus === "VERIFIED") deptMap[name].verified += 1;
  });
  const deptList = Object.entries(deptMap).map(([name, v]) => ({ name, ...v }));

  // ── Recent job posts (last 5) ─────────────────────────
  const recentJobs = [...jobPosts]
    .sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0))
    .slice(0, 5);

  // ── Company industry breakdown ─────────────────────────
  const industryMap = {};
  companies.forEach((c) => {
    const k = c.industryType || "Other";
    industryMap[k] = (industryMap[k] || 0) + 1;
  });
  const industries = Object.entries(industryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⏳</div>
        <p className="text-secondary">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* ── Header ── */}
      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">📊 Admin Dashboard</h2>
        <p className="fs-p9 text-secondary">Real-time placement analytics for all batches</p>
      </div>

      {/* ── Top Stats ── */}
      <div className="row mb-4">
        {[
          { icon: "👨‍🎓", title: "Total Students",     value: totalStudents,     sub: `${verifiedStudents} verified`,   color: "var(--primary)"  },
          { icon: "🏢", title: "Companies",           value: totalCompanies,    sub: `${verifiedCompanies} verified`,  color: "#0ea5e9"          },
          { icon: "💼", title: "Active Job Posts",    value: activeJobs,        sub: `${jobPosts.length} total posts`, color: "var(--success)"  },
          { icon: "🎯", title: "Job Suggestions",     value: totalSuggestions,  sub: "from tutors",                    color: "#f59e0b"          },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="row items-center g-3 mb-2">
                <span style={{ fontSize: "1.8rem" }}>{s.icon}</span>
                <p className="fs-p9 text-secondary">{s.title}</p>
              </div>
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p8 text-secondary mt-1">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mid Row ── */}
      <div className="row mb-4">

        {/* Department Breakdown */}
        <div className="col-6 p-2">
          <div className="card p-4 h-100">
            <h4 className="bold mb-3">🏫 Students by Department</h4>
            {deptList.length === 0 ? (
              <p className="text-secondary fs-p9">No student data available.</p>
            ) : (
              <table className="w-100">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th style={{ textAlign: "center" }}>Total</th>
                    <th style={{ textAlign: "center" }}>Verified</th>
                    <th style={{ textAlign: "center" }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {deptList.map((d, i) => {
                    const rate = d.total > 0 ? Math.round((d.verified / d.total) * 100) : 0;
                    return (
                      <tr key={i} className="hover-bg">
                        <td className="bold fs-p9">{d.name}</td>
                        <td style={{ textAlign: "center" }} className="fs-p9">{d.total}</td>
                        <td style={{ textAlign: "center" }} className="fs-p9 bold" style={{ color: "var(--success)" }}>{d.verified}</td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                              flex: 1, height: 6, borderRadius: 3, background: "var(--gray-200)", overflow: "hidden",
                            }}>
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

        {/* Industry Breakdown */}
        <div className="col-6 p-2">
          <div className="card p-4 h-100">
            <h4 className="bold mb-3">🏭 Company Industries</h4>
            {industries.length === 0 ? (
              <p className="text-secondary fs-p9">No company data available.</p>
            ) : (
              <>
                {industries.map(([industry, count], i) => {
                  const pct = Math.round((count / totalCompanies) * 100);
                  const colors = ["#325563", "#0ea5e9", "#f59e0b", "#16a34a", "#dc2626"];
                  return (
                    <div key={i} className="mb-3">
                      <div className="row space-between items-center mb-1">
                        <span className="fs-p9 bold">{industry}</span>
                        <span className="fs-p8 text-secondary">{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "var(--gray-200)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: colors[i % colors.length], borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Summary counts */}
            <div className="row mt-4" style={{ gap: 10 }}>
              {[
                { label: "Verified",   value: verifiedCompanies,              color: "var(--success)" },
                { label: "Unverified", value: totalCompanies - verifiedCompanies, color: "var(--warning)" },
              ].map((s, i) => (
                <div key={i} className="card p-2 text-center" style={{ flex: 1, boxShadow: "none" }}>
                  <p className="bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="fs-p8 text-secondary">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Job Posts ── */}
      <div className="card p-4 mb-4">
        <div className="row space-between items-center mb-3">
          <h4 className="bold">💼 Recent Job Posts</h4>
          <span className="fs-p8 text-secondary">{activeJobs} active / {jobPosts.length} total</span>
        </div>
        {recentJobs.length === 0 ? (
          <p className="text-secondary fs-p9 p-3 text-center">No job posts yet.</p>
        ) : (
          <table className="w-100">
            <thead>
              <tr>
                <th>Title</th>
                <th>Company</th>
                <th>Openings</th>
                <th>Posted</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((job, i) => {
                const isActive = (job.status || "").toUpperCase() === "ACTIVE";
                return (
                  <tr key={job.jobPostId || i} className="hover-bg">
                    <td className="bold fs-p9">{job.tiitle || job.title || "—"}</td>
                    <td className="fs-p9 text-secondary">
                      {job.companyModel?.companyName || "—"}
                    </td>
                    <td className="fs-p9" style={{ textAlign: "center" }}>
                      {job.requiredCandidate || "—"}
                    </td>
                    <td className="fs-p9 text-secondary">{job.postedDate || "—"}</td>
                    <td className="fs-p9 text-secondary">{job.lastDateToApply || "—"}</td>
                    <td>
                      <span className="status-item fs-p8" style={{
                        background: isActive ? "rgba(22,163,74,0.1)"  : "rgba(107,114,128,0.1)",
                        color:      isActive ? "var(--success)"        : "var(--gray-500)",
                      }}>
                        {isActive ? "✅ Active" : "⏸ Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Quick Overview ── */}
      <div className="row mb-4">
        {[
          {
            icon: "📨", label: "Total Suggestions", value: totalSuggestions,
            sub: "Tutor-recommended job matches for students",
            color: "#f59e0b", bg: "rgba(245,158,11,0.07)",
          },
          {
            icon: "✅", label: "Verified Students", value: verifiedStudents,
            sub: `Out of ${totalStudents} registered students`,
            color: "var(--success)", bg: "rgba(22,163,74,0.07)",
          },
          {
            icon: "🏢", label: "Verified Companies", value: verifiedCompanies,
            sub: `${totalCompanies - verifiedCompanies} pending verification`,
            color: "var(--primary)", bg: "rgba(50,85,99,0.07)",
          },
        ].map((c, i) => (
          <div className="col-4 p-2" key={i}>
            <div className="card p-4" style={{ background: c.bg, border: "none" }}>
              <div className="row items-center g-3 mb-2">
                <span style={{ fontSize: "1.6rem" }}>{c.icon}</span>
                <p className="fs-p9 bold text-secondary">{c.label}</p>
              </div>
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