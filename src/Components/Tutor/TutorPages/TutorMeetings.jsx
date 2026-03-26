import { useState, useEffect } from "react";
import axios from "axios";

function TutorMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", meetingDate: "", meetingTime: "", link: "", participants: "", notes: "", type: "Student" });

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("tutorToken")}` } };

  useEffect(() => {
    axios.get("/api/tutor/meetings", header)
      .then(res => { setMeetings(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = () => {
    axios.post("/api/tutor/meetings", form, header)
      .then(res => {
        setMeetings(prev => [...prev, res.data.data || res.data]);
        setShowModal(false);
        setForm({ title: "", meetingDate: "", meetingTime: "", link: "", participants: "", notes: "", type: "Student" });
      })
      .catch(console.error);
  };

  const upcoming = meetings.filter(m => new Date(`${m.meetingDate} ${m.meetingTime}`) >= new Date());
  const past = meetings.filter(m => new Date(`${m.meetingDate} ${m.meetingTime}`) < new Date());

  const typeColor = (t) => ({
    Student: ["rgba(50,85,99,0.1)", "#325563"],
    Company: ["rgba(84,95,57,0.1)", "#545F39"],
    Admin: ["rgba(245,158,11,0.1)", "#f59e0b"],
  }[t] || ["rgba(107,114,128,0.1)", "#6b7280"]);

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Meetings</h2>
          <p className="fs-p9 text-secondary">Schedule and attend meetings with students and companies</p>
        </div>
        <button className="btn btn-primary w-auto" onClick={() => setShowModal(true)}>+ Schedule Meeting</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          {/* Upcoming */}
          <h4 className="mb-3">📅 Upcoming Meetings ({upcoming.length})</h4>
          {upcoming.length === 0 ? (
            <div className="card p-4 mb-5 text-center">
              <p className="text-secondary">No upcoming meetings scheduled</p>
            </div>
          ) : (
            <div className="row mb-5" style={{ gap: "16px" }}>
              {upcoming.map((m, i) => {
                const [bg, color] = typeColor(m.type);
                return (
                  <div key={m.id || i} className="card p-4 stat-card" style={{ width: "calc(48% - 16px)", borderLeft: `4px solid ${color}` }}>
                    <div className="row space-between items-center mb-2">
                      <span className="bold">{m.title}</span>
                      <span className="status-item fs-p8" style={{ background: bg, color }}>{m.type || "Meeting"}</span>
                    </div>
                    <p className="fs-p9 text-secondary">📅 {m.meetingDate} &nbsp;|&nbsp; 🕐 {m.meetingTime}</p>
                    {m.participants && <p className="fs-p9 text-secondary mt-1">👥 {m.participants}</p>}
                    {m.notes && (
                      <div className="p-2 br-md mt-2" style={{ background: "#f9fafb" }}>
                        <p className="fs-p9">{m.notes}</p>
                      </div>
                    )}
                    {m.link && (
                      <a href={m.link} target="_blank" rel="noreferrer"
                        className="btn btn-primary w-auto mt-2"
                        style={{ padding: "6px 18px", fontSize: "0.85rem", textDecoration: "none", display: "inline-block" }}>
                        🔗 Join Meeting
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* All Meetings from Admin/Company (read-only) */}
          <h4 className="mb-3">🕐 Past Meetings</h4>
          {past.length === 0 ? (
            <div className="card p-4 text-center">
              <p className="text-secondary">No past meetings</p>
            </div>
          ) : (
            <div className="card p-2">
              <table className="w-100">
                <thead>
                  <tr><th>Title</th><th>Type</th><th>Date</th><th>Time</th><th>Participants</th></tr>
                </thead>
                <tbody>
                  {past.map((m, i) => {
                    const [bg, color] = typeColor(m.type);
                    return (
                      <tr key={m.id || i} className="hover-bg">
                        <td className="bold">{m.title}</td>
                        <td><span className="status-item fs-p8" style={{ background: bg, color }}>{m.type || "—"}</span></td>
                        <td>{m.meetingDate}</td>
                        <td>{m.meetingTime}</td>
                        <td className="fs-p9 text-secondary">{m.participants || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
              <input className="form-control" placeholder="e.g. Mock Interview Prep Session" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="form-group mb-2">
              <label className="form-control-label">Meeting Type</label>
              <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option>Student</option>
                <option>Company</option>
                <option>Admin</option>
              </select>
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
              <input className="form-control" placeholder="https://meet.google.com/..." value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} />
            </div>

            <div className="form-group mb-2">
              <label className="form-control-label">Participants</label>
              <input className="form-control" placeholder="e.g. CSE Batch 2024, Arjun, Priya..." value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} />
            </div>

            <div className="form-group mb-3">
              <label className="form-control-label">Agenda / Notes</label>
              <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="What will be covered in this meeting..." />
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

export default TutorMeetings;
