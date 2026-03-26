import { useState, useEffect } from "react";
import axios from "axios";

function TutorFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStudent, setFilterStudent] = useState("");
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId: "", companyName: "", feedbackText: "", rating: "Good", suggestions: "" });

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("tutorToken")}` } };

  useEffect(() => {
    Promise.all([
      axios.get("/api/tutor/feedback", header),
      axios.get("/api/tutor/students", header),
    ]).then(([fb, s]) => {
      setFeedbacks(fb.data.data || fb.data || []);
      setStudents(s.data.data || s.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = () => {
    axios.post("/api/tutor/feedback", form, header)
      .then(res => {
        setFeedbacks(prev => [...prev, res.data.data || res.data]);
        setShowModal(false);
        setForm({ studentId: "", companyName: "", feedbackText: "", rating: "Good", suggestions: "" });
      })
      .catch(console.error);
  };

  const ratingColor = (r) => ({
    Excellent: ["rgba(22,163,74,0.1)", "#16a34a"],
    Good: ["rgba(14,165,233,0.1)", "#0ea5e9"],
    Average: ["rgba(245,158,11,0.1)", "#f59e0b"],
    "Needs Improvement": ["rgba(220,38,38,0.1)", "#dc2626"],
  }[r] || ["rgba(107,114,128,0.1)", "#6b7280"]);

  const filtered = feedbacks.filter(f =>
    !filterStudent || f.studentId === filterStudent || f.studentName?.toLowerCase().includes(filterStudent.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Student Feedback</h2>
          <p className="fs-p9 text-secondary">Company feedback about your students' performance</p>
        </div>
        <button className="btn btn-primary w-auto" onClick={() => setShowModal(true)}>+ Add Feedback</button>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Total Feedback", value: feedbacks.length, color: "#325563" },
          { label: "Excellent", value: feedbacks.filter(f => f.rating === "Excellent").length, color: "#16a34a" },
          { label: "Good", value: feedbacks.filter(f => f.rating === "Good").length, color: "#0ea5e9" },
          { label: "Needs Work", value: feedbacks.filter(f => f.rating === "Needs Improvement").length, color: "#dc2626" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-3 stat-card text-center">
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="row mb-4" style={{ gap: "12px" }}>
        <div className="col-4 p-0">
          <select className="form-control" value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
            <option value="">All Students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Feedback Cards */}
      {loading ? <p>Loading...</p> : filtered.length === 0 ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>💬</p>
          <p className="bold mt-2">No feedback yet</p>
          <p className="text-secondary fs-p9">Feedback from companies will appear here</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.map((fb, i) => {
            const [bg, color] = ratingColor(fb.rating);
            return (
              <div key={fb.id || i} className="card p-4" style={{ borderLeft: `4px solid ${color}` }}>
                <div className="row space-between items-center mb-2">
                  <div className="row items-center" style={{ gap: "12px" }}>
                    <div className="bg-primary text-white br-circle" style={{ width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>
                      {fb.studentName?.charAt(0) || "S"}
                    </div>
                    <div>
                      <div className="bold">{fb.studentName}</div>
                      <div className="fs-p8 text-secondary">{fb.department}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="status-item" style={{ background: bg, color }}>{fb.rating}</span>
                    <p className="fs-p8 text-secondary mt-1">🏢 {fb.companyName}</p>
                  </div>
                </div>

                <div className="p-3 br-md mb-2" style={{ background: "#f9fafb" }}>
                  <p className="fs-p9">"{fb.feedbackText}"</p>
                </div>

                {fb.suggestions && (
                  <div className="p-2 br-md" style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.2)" }}>
                    <p className="fs-p9">💡 <span className="bold">Suggestions:</span> {fb.suggestions}</p>
                  </div>
                )}

                <p className="fs-p8 text-secondary mt-2">Received: {fb.date || fb.createdAt || "—"}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Feedback Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card p-5" style={{ width: "480px", maxWidth: "95%" }}>
            <h3 className="mb-3">Add Company Feedback</h3>

            <div className="form-group mb-2">
              <label className="form-control-label">Student</label>
              <select className="form-control" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                <option value="">Select student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.department}</option>)}
              </select>
            </div>

            <div className="form-group mb-2">
              <label className="form-control-label">Company Name</label>
              <input className="form-control" placeholder="e.g. TechCorp Pvt Ltd" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
            </div>

            <div className="form-group mb-2">
              <label className="form-control-label">Rating</label>
              <select className="form-control" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })}>
                <option>Excellent</option>
                <option>Good</option>
                <option>Average</option>
                <option>Needs Improvement</option>
              </select>
            </div>

            <div className="form-group mb-2">
              <label className="form-control-label">Feedback</label>
              <textarea className="form-control" rows="3" placeholder="Describe the company's feedback about this student..." value={form.feedbackText} onChange={e => setForm({ ...form, feedbackText: e.target.value })} />
            </div>

            <div className="form-group mb-3">
              <label className="form-control-label">Suggestions for Improvement</label>
              <textarea className="form-control" rows="2" placeholder="Areas where the student can improve..." value={form.suggestions} onChange={e => setForm({ ...form, suggestions: e.target.value })} />
            </div>

            <div className="row" style={{ gap: "10px" }}>
              <button className="btn btn-primary" onClick={handleSubmit}>Save Feedback</button>
              <button className="btn btn-muted" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorFeedback;
