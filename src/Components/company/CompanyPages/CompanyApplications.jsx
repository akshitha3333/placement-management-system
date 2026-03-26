import { useState, useEffect } from "react";
import axios from "axios";

function CompanyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJob, setFilterJob] = useState("");
  const [jobs, setJobs] = useState([]);

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("companyToken")}` } };

  useEffect(() => {
    axios.get("/api/company/job-posts", header)
      .then(res => setJobs(res.data.data || res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get("/api/company/applications", { ...header, params: { status: filterStatus, jobId: filterJob } })
      .then(res => { setApplications(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterStatus, filterJob]);

  const updateStatus = (id, status) => {
    axios.patch(`/api/company/applications/${id}/status`, { status }, header)
      .then(() => setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a)))
      .catch(console.error);
  };

  const statusColor = (s) => ({
    Applied: ["rgba(14,165,233,0.1)", "#0ea5e9"],
    Shortlisted: ["rgba(245,158,11,0.1)", "#f59e0b"],
    Interviewed: ["rgba(101,163,13,0.1)", "#65a30d"],
    Selected: ["rgba(22,163,74,0.1)", "#16a34a"],
    Rejected: ["rgba(220,38,38,0.1)", "#dc2626"],
  }[s] || ["rgba(107,114,128,0.1)", "#6b7280"]);

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Applications</h2>
          <p className="fs-p9 text-secondary">Review and manage candidate applications</p>
        </div>
        <div className="row" style={{ gap: "10px" }}>
          <select className="form-control w-20" value={filterJob} onChange={e => setFilterJob(e.target.value)}>
            <option value="">All Jobs</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <select className="form-control w-20" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Applied</option><option>Shortlisted</option>
            <option>Interviewed</option><option>Selected</option><option>Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Total", value: applications.length, color: "#325563" },
          { label: "Shortlisted", value: applications.filter(a => a.status === "Shortlisted").length, color: "#f59e0b" },
          { label: "Selected", value: applications.filter(a => a.status === "Selected").length, color: "#16a34a" },
          { label: "Rejected", value: applications.filter(a => a.status === "Rejected").length, color: "#dc2626" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-3 stat-card text-center">
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-2">
        {loading ? <p className="text-center p-4">Loading...</p> : (
          <table className="w-100">
            <thead>
              <tr>
                <th>Candidate</th><th>Department</th><th>Job Applied</th>
                <th>CGPA</th><th>Applied On</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-4">No applications found</td></tr>
              ) : applications.map(app => {
                const [bg, color] = statusColor(app.status);
                return (
                  <tr key={app.id} className="hover-bg">
                    <td>
                      <div className="bold">{app.studentName}</div>
                      <div className="fs-p8 text-secondary">{app.email}</div>
                    </td>
                    <td>{app.department}</td>
                    <td>{app.jobTitle}</td>
                    <td className="bold">{app.cgpa}</td>
                    <td className="fs-p9">{app.appliedDate}</td>
                    <td><span className="status-item" style={{ background: bg, color }}>{app.status}</span></td>
                    <td>
                      <div className="row" style={{ gap: "6px" }}>
                        <span className="cursor-pointer" title="View Profile">👁️</span>
                        {app.status === "Applied" && (
                          <span className="cursor-pointer text-success bold" title="Shortlist"
                            onClick={() => updateStatus(app.id, "Shortlisted")}>✅</span>
                        )}
                        {(app.status === "Applied" || app.status === "Shortlisted") && (
                          <span className="cursor-pointer text-danger bold" title="Reject"
                            onClick={() => updateStatus(app.id, "Rejected")}>✖</span>
                        )}
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
  );
}

export default CompanyApplications;
