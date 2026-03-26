import { useState, useEffect } from "react";
import axios from "axios";

function StudentMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const header = { headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` } };

  useEffect(() => {
    axios.get("/api/student/meetings", header)
      .then(res => { setMeetings(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const upcoming = meetings.filter(m => new Date(`${m.meetingDate} ${m.meetingTime}`) >= new Date());
  const past = meetings.filter(m => new Date(`${m.meetingDate} ${m.meetingTime}`) < new Date());

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">Meetings</h2>
      <p className="fs-p9 text-secondary mb-4">View scheduled meetings from admin and companies</p>

      {loading ? <p>Loading...</p> : (
        <>
          <h4 className="mb-3">📅 Upcoming Meetings</h4>
          {upcoming.length === 0 ? (
            <div className="card p-4 mb-4 text-center">
              <p className="text-secondary">No upcoming meetings</p>
            </div>
          ) : (
            <div className="row mb-5" style={{ gap: "16px" }}>
              {upcoming.map((m, i) => (
                <div key={m.id || i} className="card p-4 stat-card" style={{ width: "calc(48% - 16px)", borderLeft: "4px solid #325563" }}>
                  <div className="row space-between items-center mb-2">
                    <span className="bold">{m.title}</span>
                    <span className="status-item fs-p8" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>
                      {m.meetingDate}
                    </span>
                  </div>
                  <p className="fs-p9 text-secondary">🕐 {m.meetingTime}</p>
                  {m.organizer && <p className="fs-p9 text-secondary mt-1">👤 By: {m.organizer}</p>}
                  {m.notes && <p className="fs-p9 mt-1">{m.notes}</p>}
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noreferrer"
                      className="btn btn-primary w-auto mt-2"
                      style={{ padding: "6px 16px", fontSize: "0.85rem", textDecoration: "none", display: "inline-block" }}>
                      🔗 Attend Meeting
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <>
              <h4 className="mb-3">🕐 Past Meetings</h4>
              <div className="card p-2">
                <table className="w-100">
                  <thead><tr><th>Title</th><th>Date</th><th>Time</th><th>By</th></tr></thead>
                  <tbody>
                    {past.map((m, i) => (
                      <tr key={m.id || i} className="hover-bg">
                        <td className="bold">{m.title}</td>
                        <td>{m.meetingDate}</td>
                        <td>{m.meetingTime}</td>
                        <td className="fs-p9 text-secondary">{m.organizer || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default StudentMeetings;
