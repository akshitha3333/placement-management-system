import { useState, useEffect } from "react";
import axios from "axios";

function CompanyInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("companyToken")}` } };

  useEffect(() => {
    axios.get("/api/company/interviews", header)
      .then(res => { setInterviews(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markResult = (id, result) => {
    axios.patch(`/api/company/interviews/${id}/result`, { result }, header)
      .then(() => setInterviews(prev => prev.map(i => i.id === id ? { ...i, result } : i)))
      .catch(console.error);
  };

  const upcoming = interviews.filter(i => !i.result);
  const completed = interviews.filter(i => i.result);

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">Interviews</h2>
      <p className="fs-p9 text-secondary mb-4">Manage scheduled interviews and mark results</p>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Upcoming", value: upcoming.length, color: "#0ea5e9" },
          { label: "Selected", value: interviews.filter(i => i.result === "Selected").length, color: "#16a34a" },
          { label: "Rejected", value: interviews.filter(i => i.result === "Rejected").length, color: "#dc2626" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4 stat-card text-center">
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-3">📅 Upcoming Interviews</h4>
          <div className="row" style={{ gap: "16px" }}>
            {upcoming.map(inv => (
              <div key={inv.id} className="card p-4 stat-card" style={{ width: "calc(48% - 16px)" }}>
                <div className="row space-between items-center mb-2">
                  <span className="bold">{inv.studentName}</span>
                  <span className="status-item fs-p8" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>{inv.date}</span>
                </div>
                <p className="fs-p9 text-secondary">{inv.department} • {inv.jobTitle}</p>
                <p className="fs-p9 mt-1">🕐 {inv.time} &nbsp;|&nbsp; 📱 {inv.mode || "Online"}</p>
                {inv.link && <a href={inv.link} target="_blank" rel="noreferrer" className="fs-p9 text-link">🔗 Join Meeting</a>}
                <div className="row mt-3" style={{ gap: "8px" }}>
                  <button className="btn btn-primary w-auto" style={{ padding: "6px 16px", fontSize: "0.8rem" }}
                    onClick={() => markResult(inv.id, "Selected")}>✔ Select</button>
                  <button className="btn btn-danger w-auto" style={{ padding: "6px 16px", fontSize: "0.8rem" }}
                    onClick={() => markResult(inv.id, "Rejected")}>✖ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      <h4 className="mb-3">📋 Completed Interviews</h4>
      <div className="card p-2">
        {loading ? <p className="text-center p-4">Loading...</p> : completed.length === 0 ? (
          <p className="text-center p-4 text-secondary">No completed interviews yet</p>
        ) : (
          <table className="w-100">
            <thead>
              <tr><th>Student</th><th>Department</th><th>Job</th><th>Date</th><th>Result</th></tr>
            </thead>
            <tbody>
              {completed.map(inv => (
                <tr key={inv.id} className="hover-bg">
                  <td><div className="bold">{inv.studentName}</div></td>
                  <td>{inv.department}</td>
                  <td>{inv.jobTitle}</td>
                  <td className="fs-p9">{inv.date}</td>
                  <td>
                    <span className="status-item" style={{
                      background: inv.result === "Selected" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                      color: inv.result === "Selected" ? "#16a34a" : "#dc2626"
                    }}>{inv.result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default CompanyInterviews;
