import { useState, useEffect } from "react";
import axios from "axios";

function StudentInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const header = { headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` } };

  useEffect(() => {
    axios.get("/api/student/interviews", header)
      .then(res => { setInterviews(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const upcoming = interviews.filter(i => !i.result);
  const completed = interviews.filter(i => i.result);

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">My Interviews</h2>
      <p className="fs-p9 text-secondary mb-4">View your scheduled and past interviews</p>

      {loading ? <p>Loading...</p> : (
        <>
          {/* Upcoming */}
          <h4 className="mb-3">📅 Upcoming Interviews</h4>
          {upcoming.length === 0 ? (
            <div className="card p-4 mb-4 text-center">
              <p className="text-secondary">No upcoming interviews scheduled</p>
            </div>
          ) : (
            <div className="row mb-4" style={{ gap: "16px" }}>
              {upcoming.map(inv => (
                <div key={inv.id} className="card p-4 stat-card" style={{ width: "calc(48% - 16px)", borderLeft: "4px solid #325563" }}>
                  <div className="row space-between items-center mb-2">
                    <h4 className="bold">{inv.companyName}</h4>
                    <span className="status-item fs-p8" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>Upcoming</span>
                  </div>
                  <p className="fs-p9 text-secondary mb-1">💼 {inv.jobTitle}</p>
                  <p className="fs-p9 mb-1">📅 {inv.date} &nbsp;|&nbsp; 🕐 {inv.time}</p>
                  <p className="fs-p9 mb-2">📱 Mode: {inv.mode || "Online"}</p>

                  {inv.notes && (
                    <div className="p-2 br-md mb-2" style={{ background: "rgba(50,85,99,0.05)", border: "1px solid rgba(50,85,99,0.15)" }}>
                      <p className="fs-p8 text-secondary">📝 {inv.notes}</p>
                    </div>
                  )}

                  {inv.link && (
                    <a href={inv.link} target="_blank" rel="noreferrer"
                      className="btn btn-primary w-auto" style={{ padding: "8px 20px", fontSize: "0.85rem", textDecoration: "none", display: "inline-block" }}>
                      🔗 Join Interview
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          <div className="card p-4 mb-4" style={{ background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)", border: "none" }}>
            <h4 className="mb-2">💡 Interview Tips</h4>
            <div className="row" style={{ gap: "12px" }}>
              {["Research the company before the interview", "Practice common technical & HR questions", "Keep your resume and documents ready", "Test your audio/video 10 mins before"].map((tip, i) => (
                <div key={i} className="fs-p9 p-2 br-md" style={{ background: "white", flex: "1 1 calc(48% - 6px)", border: "1px solid var(--border-color)" }}>
                  ✅ {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Completed */}
          <h4 className="mb-3">📋 Past Interviews</h4>
          <div className="card p-2">
            {completed.length === 0 ? (
              <p className="text-center p-4 text-secondary">No past interviews yet</p>
            ) : (
              <table className="w-100">
                <thead><tr><th>Company</th><th>Job</th><th>Date</th><th>Result</th></tr></thead>
                <tbody>
                  {completed.map(inv => (
                    <tr key={inv.id} className="hover-bg">
                      <td className="bold">{inv.companyName}</td>
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
        </>
      )}
    </div>
  );
}

export default StudentInterviews;
