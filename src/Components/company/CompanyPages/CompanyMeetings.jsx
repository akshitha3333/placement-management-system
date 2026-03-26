import { useState, useEffect } from "react";
import axios from "axios";

function CompanyMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", meetingDate: "", meetingTime: "", link: "", participants: "", notes: "" });

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("companyToken")}` } };

  useEffect(() => {
    axios.get("/api/company/meetings", header)
      .then(res => { setMeetings(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = () => {
    axios.post("/api/company/meetings", form, header)
      .then(res => { setMeetings(prev => [...prev, res.data.data || res.data]); setShowModal(false); setForm({ title: "", meetingDate: "", meetingTime: "", link: "", participants: "", notes: "" }); })
      .catch(console.error);
  };

  const upcoming = meetings.filter(m => new Date(`${m.meetingDate} ${m.meetingTime}`) >= new Date());
  const past = meetings.filter(m => new Date(`${m.meetingDate} ${m.meetingTime}`) < new Date());

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Meetings</h2>
          <p className="fs-p9 text-secondary">Schedule meetings with students and placement team</p>
        </div>
        <button className="btn btn-primary w-auto" onClick={() => setShowModal(true)}>+ Schedule Meeting</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-3">📅 Upcoming Meetings</h4>
              <div className="row" style={{ gap: "16px" }}>
                {upcoming.map((m, i) => (
                  <div key={m.id || i} className="card p-4 stat-card" style={{ width: "calc(48% - 16px)", borderLeft: "4px solid #325563" }}>
                    <div className="row space-between items-center mb-2">
                      <span className="bold fs-3">{m.title}</span>
                      <span className="status-item fs-p8" style={{ background: "rgba(50,85,99,0.1)", color: "#325563" }}>{m.meetingDate}</span>
                    </div>
                    <p className="fs-p9 text-secondary">🕐 {m.meetingTime} &nbsp;|&nbsp; 👥 {m.participants || "All invited"}</p>
                    {m.notes && <p className="fs-p9 text-secondary mt-1">{m.notes}</p>}
                    {m.link && (
                      <a href={m.link} target="_blank" rel="noreferrer"
                        className="btn btn-primary w-auto mt-2" style={{ padding: "6px 16px", fontSize: "0.85rem", textDecoration: "none", display: "inline-block" }}>
                        🔗 Join Meeting
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h4 className="mb-3">🕐 Past Meetings</h4>
              <div className="card p-2">
                <table className="w-100">
                  <thead><tr><th>Title</th><th>Date</th><th>Time</th><th>Participants</th></tr></thead>
                  <tbody>
                    {past.map((m, i) => (
                      <tr key={m.id || i} className="hover-bg">
                        <td className="bold">{m.title}</td>
                        <td>{m.meetingDate}</td>
                        <td>{m.meetingTime}</td>
                        <td className="fs-p9 text-secondary">{m.participants || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {meetings.length === 0 && (
            <div className="card p-5 text-center">
              <p style={{ fontSize: "3rem" }}>📹</p>
              <p className="bold mt-2">No meetings scheduled</p>
              <p className="text-secondary fs-p9">Click "Schedule Meeting" to create one</p>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card p-5" style={{ width: "460px", maxWidth: "95%" }}>
            <h3 className="mb-3">Schedule Meeting</h3>
            <div className="form-group mb-2">
              <label className="form-control-label">Title</label>
              <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Pre-Placement Talk" />
            </div>
            <div className="row mb-2" style={{ gap: "10px" }}>
              <div className="col-6 p-0">
                <label className="form-control-label">Date</label>
                <input type="date" className="form-control" value={form.meetingDate} onChange={e => setForm({ ...form, meetingDate: e.target.value })} />
              </div>
              <div className="col-6 p-0">
                <label className="form-control-label">Time</label>
                <input type="time" className="form-control" value={form.meetingTime} onChange={e => setForm({ ...form, meetingTime: e.target.value })} />
              </div>
            </div>
            <div className="form-group mb-2">
              <label className="form-control-label">Meeting Link</label>
              <input className="form-control" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://meet.google.com/..." />
            </div>
            <div className="form-group mb-2">
              <label className="form-control-label">Participants</label>
              <input className="form-control" value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} placeholder="CSE Students, HR Team..." />
            </div>
            <div className="form-group mb-3">
              <label className="form-control-label">Notes</label>
              <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="row" style={{ gap: "10px" }}>
              <button className="btn btn-primary" onClick={handleSubmit}>Schedule</button>
              <button className="btn btn-muted" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyMeetings;
