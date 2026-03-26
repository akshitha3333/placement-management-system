import { useState, useEffect } from "react";
import axios from "axios";

function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const header = { headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` } };

  useEffect(() => {
    axios.get("/api/student/applications", header)
      .then(res => { setApplications(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusColor = (s) => ({
    Applied: ["rgba(14,165,233,0.1)", "#0ea5e9"],
    Shortlisted: ["rgba(245,158,11,0.1)", "#f59e0b"],
    Interviewed: ["rgba(101,163,13,0.1)", "#65a30d"],
    Selected: ["rgba(22,163,74,0.1)", "#16a34a"],
    Rejected: ["rgba(220,38,38,0.1)", "#dc2626"],
  }[s] || ["rgba(107,114,128,0.1)", "#6b7280"]);

  const statusSteps = ["Applied", "Shortlisted", "Interviewed", "Selected"];

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">My Applications</h2>
      <p className="fs-p9 text-secondary mb-4">Track the status of your job applications</p>

      {/* Quick Stats */}
      <div className="row mb-4">
        {[
          { label: "Total Applied", value: applications.length, color: "#325563" },
          { label: "Shortlisted", value: applications.filter(a => a.status === "Shortlisted").length, color: "#f59e0b" },
          { label: "Interviewed", value: applications.filter(a => a.status === "Interviewed").length, color: "#65a30d" },
          { label: "Selected", value: applications.filter(a => a.status === "Selected").length, color: "#16a34a" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-3 stat-card text-center">
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? <p>Loading...</p> : applications.length === 0 ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>📄</p>
          <p className="bold mt-2">No applications yet</p>
          <p className="text-secondary fs-p9">Browse jobs and apply to get started</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {applications.map(app => {
            const [bg, color] = statusColor(app.status);
            const stepIndex = statusSteps.indexOf(app.status);
            return (
              <div key={app.id} className="card p-4">
                <div className="row space-between items-center mb-3">
                  <div>
                    <h4 className="bold">{app.jobTitle}</h4>
                    <p className="fs-p9 text-secondary">{app.companyName} • Applied on {app.appliedDate}</p>
                  </div>
                  <span className="status-item" style={{ background: bg, color, fontWeight: 600 }}>{app.status}</span>
                </div>

                {/* Progress Steps */}
                {app.status !== "Rejected" && (
                  <div className="row items-center mb-2" style={{ gap: "0" }}>
                    {statusSteps.map((step, i) => (
                      <div key={i} className="row items-center" style={{ flex: 1 }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: i <= stepIndex ? "#325563" : "#e5e7eb",
                          color: i <= stepIndex ? "white" : "#9ca3af",
                          fontWeight: "bold", fontSize: "0.75rem", flexShrink: 0
                        }}>{i < stepIndex ? "✓" : i + 1}</div>
                        <div className="fs-p8 ms-1" style={{ color: i <= stepIndex ? "#325563" : "#9ca3af", fontWeight: i === stepIndex ? "bold" : "normal" }}>{step}</div>
                        {i < statusSteps.length - 1 && (
                          <div style={{ flex: 1, height: "2px", background: i < stepIndex ? "#325563" : "#e5e7eb", margin: "0 8px" }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {app.status === "Rejected" && (
                  <div className="p-2 br-md" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)" }}>
                    <p className="fs-p9 text-danger">This application was not shortlisted. Keep applying to other opportunities!</p>
                  </div>
                )}

                <div className="row mt-2" style={{ gap: "8px" }}>
                  <span className="fs-p8 text-secondary">Package: {app.package} LPA</span>
                  {app.interviewDate && <span className="fs-p8 text-secondary">• Interview: {app.interviewDate}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentApplications;
