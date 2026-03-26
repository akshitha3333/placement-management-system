import { useState, useEffect } from "react";
import axios from "axios";

function CompanyShortlisted() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ date: "", time: "", mode: "Online", link: "", notes: "" });

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("companyToken")}` } };

  useEffect(() => {
    axios.get("/api/company/applications?status=Shortlisted", header)
      .then(res => { setCandidates(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openSchedule = (candidate) => {
    setSelectedCandidate(candidate);
    setShowScheduleModal(true);
  };

  const handleSchedule = () => {
    const payload = { applicationId: selectedCandidate.id, ...interviewForm };
    axios.post("/api/company/interviews", payload, header)
      .then(() => {
        setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, interviewScheduled: true } : c));
        setShowScheduleModal(false);
        setInterviewForm({ date: "", time: "", mode: "Online", link: "", notes: "" });
      })
      .catch(console.error);
  };

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">Shortlisted Candidates</h2>
      <p className="fs-p9 text-secondary mb-4">Schedule interviews for shortlisted students</p>

      {loading ? <p>Loading...</p> : (
        <div className="row" style={{ gap: "16px" }}>
          {candidates.length === 0 ? (
            <div className="card p-5 w-100 text-center">
              <p style={{ fontSize: "3rem" }}>✅</p>
              <p className="bold mt-2">No shortlisted candidates yet</p>
              <p className="text-secondary fs-p9">Go to Applications and shortlist candidates</p>
            </div>
          ) : candidates.map(c => (
            <div key={c.id} className="card p-4 stat-card" style={{ width: "calc(33% - 16px)" }}>
              {/* Avatar */}
              <div className="row items-center mb-3" style={{ gap: "12px" }}>
                <div className="bg-primary text-white br-circle" style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.1rem", flexShrink: 0 }}>
                  {c.studentName?.charAt(0) || "S"}
                </div>
                <div>
                  <div className="bold">{c.studentName}</div>
                  <div className="fs-p8 text-secondary">{c.department}</div>
                </div>
              </div>

              <p className="fs-p9 mb-1">📧 {c.email}</p>
              <p className="fs-p9 mb-1">🎓 CGPA: <span className="bold">{c.cgpa}</span></p>
              <p className="fs-p9 mb-1">💼 Applied: {c.jobTitle}</p>

              {c.skills && (
                <div className="mt-2 mb-3" style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {c.skills.split(",").map((s, i) => (
                    <span key={i} className="fs-p8" style={{ background: "#e5e7eb", borderRadius: "12px", padding: "2px 8px" }}>{s.trim()}</span>
                  ))}
                </div>
              )}

              {c.interviewScheduled ? (
                <span className="status-item" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>📅 Interview Scheduled</span>
              ) : (
                <button className="btn btn-primary" style={{ padding: "8px", fontSize: "0.85rem" }} onClick={() => openSchedule(c)}>
                  📅 Schedule Interview
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedCandidate && (
        <div className="modal-overlay">
          <div className="card p-5" style={{ width: "460px", maxWidth: "95%" }}>
            <h3 className="mb-1">Schedule Interview</h3>
            <p className="fs-p9 text-secondary mb-3">for {selectedCandidate.studentName}</p>

            <div className="row mb-2" style={{ gap: "10px" }}>
              <div className="col-6 p-0">
                <label className="form-control-label">Date *</label>
                <input type="date" className="form-control" value={interviewForm.date} onChange={e => setInterviewForm({ ...interviewForm, date: e.target.value })} />
              </div>
              <div className="col-6 p-0">
                <label className="form-control-label">Time *</label>
                <input type="time" className="form-control" value={interviewForm.time} onChange={e => setInterviewForm({ ...interviewForm, time: e.target.value })} />
              </div>
            </div>

            <div className="form-group mb-2">
              <label className="form-control-label">Mode</label>
              <select className="form-control" value={interviewForm.mode} onChange={e => setInterviewForm({ ...interviewForm, mode: e.target.value })}>
                <option>Online</option><option>In-person</option><option>Phone</option>
              </select>
            </div>

            {interviewForm.mode === "Online" && (
              <div className="form-group mb-2">
                <label className="form-control-label">Meeting Link</label>
                <input className="form-control" placeholder="https://meet.google.com/..." value={interviewForm.link} onChange={e => setInterviewForm({ ...interviewForm, link: e.target.value })} />
              </div>
            )}

            <div className="form-group mb-3">
              <label className="form-control-label">Notes for Candidate</label>
              <textarea className="form-control" rows="2" value={interviewForm.notes} onChange={e => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
            </div>

            <div className="row" style={{ gap: "10px" }}>
              <button className="btn btn-primary" onClick={handleSchedule}>Schedule</button>
              <button className="btn btn-muted" onClick={() => setShowScheduleModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyShortlisted;
