import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const emptyForm = {
  studentId:    "",
  companyName:  "",
  feedbackText: "",
  rating:       "Good",
  suggestions:  "",
};

function TutorFeedback() {
  const [feedbacks,     setFeedbacks]     = useState([]);
  const [students,      setStudents]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [form,          setForm]          = useState(emptyForm);
  const [submitting,    setSubmitting]    = useState(false);
  const [filterStudent, setFilterStudent] = useState("");
  const [message,       setMessage]       = useState("");
  const [msgType,       setMsgType]       = useState("");

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── Fetch students (tutor's dept) ──────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [tutorRes, stuRes] = await Promise.all([
          axios.get(rest.tutor,    header),
          axios.get(rest.students, header),
        ]);

        const tutorList  = tutorRes.data?.data || tutorRes.data || [];
        const tutor      = Array.isArray(tutorList) ? tutorList[0] : tutorList;
        const tutorDeptId = tutor?.departmentModel?.departmentId || tutor?.departmentId;

        const allStudents = stuRes.data?.data || stuRes.data || [];
        const stuList     = Array.isArray(allStudents) ? allStudents : [];

        // Filter to tutor's department
        const myStudents = tutorDeptId
          ? stuList.filter((s) => {
              const sd = s?.departmentModel?.departmentId || s?.departmentId;
              return String(sd) === String(tutorDeptId);
            })
          : stuList;

        setStudents(myStudents);
      } catch (err) {
        console.error("TutorFeedback init:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const ratingMeta = (r) => ({
    Excellent:         { bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
    Good:              { bg: "rgba(14,165,233,0.1)",   color: "#0ea5e9" },
    Average:           { bg: "rgba(245,158,11,0.1)",   color: "#f59e0b" },
    "Needs Improvement":{ bg: "rgba(220,38,38,0.1)",  color: "#dc2626" },
  }[r] || { bg: "rgba(107,114,128,0.1)", color: "#6b7280" });

  const getStudentName = (id) => {
    const s = students.find(
      (s) => String(s.studentId || s.id) === String(id)
    );
    return s ? (s.name || s.studentName) : id;
  };

  // ── Add feedback (local state) ─────────────────────────
  const handleSubmit = () => {
    if (!form.studentId || !form.companyName || !form.feedbackText) {
      setMessage("Student, company name, and feedback are required.");
      setMsgType("error");
      return;
    }
    setSubmitting(true);
    setMessage("");

    const newFb = {
      feedbackId:   Date.now(),
      ...form,
      studentName:  getStudentName(form.studentId),
      createdAt:    new Date().toLocaleDateString("en-IN"),
    };

    setTimeout(() => {
      setFeedbacks((prev) => [newFb, ...prev]);
      setShowModal(false);
      setForm(emptyForm);
      setMessage("Feedback recorded successfully!");
      setMsgType("success");
      setSubmitting(false);
      setTimeout(() => setMessage(""), 3000);
    }, 400);
  };

  const filtered = feedbacks.filter((f) =>
    !filterStudent ||
    f.studentId === filterStudent ||
    f.studentName?.toLowerCase().includes(filterStudent.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Student Feedback</h2>
          <p className="fs-p9 text-secondary">
            Record company feedback about your students' performance
          </p>
        </div>
        <button
          className="btn btn-primary w-auto"
          onClick={() => { setShowModal(true); setMessage(""); }}
        >
          + Add Feedback
        </button>
      </div>

      {/* ── Global message ── */}
      {message && !showModal && (
        <div
          className="p-2 br-md mb-3 fs-p9"
          style={{
            background: msgType === "success" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
            border:     `1px solid ${msgType === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
            color:      msgType === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {message}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="row mb-4">
        {[
          { label: "Total Feedback",   value: feedbacks.length,                                        color: "#325563" },
          { label: "Excellent",        value: feedbacks.filter((f) => f.rating === "Excellent").length, color: "#16a34a" },
          { label: "Good",             value: feedbacks.filter((f) => f.rating === "Good").length,      color: "#0ea5e9" },
          { label: "Needs Improvement",value: feedbacks.filter((f) => f.rating === "Needs Improvement").length, color: "#dc2626" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-3 stat-card text-center">
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter ── */}
      <div className="row space-between items-center mb-3">
        <h4>💬 Feedback Records</h4>
        <div className="w-30">
          <select
            className="form-control"
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
          >
            <option value="">All Students</option>
            {students.map((s) => (
              <option key={s.studentId || s.id} value={String(s.studentId || s.id)}>
                {s.name || s.studentName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Feedback Cards ── */}
      {feedbacks.length === 0 ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>💬</p>
          <p className="bold mt-2">No feedback recorded yet</p>
          <p className="text-secondary fs-p9">
            Click "+ Add Feedback" to record company feedback about a student
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="text-secondary">No feedback for the selected student</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filtered.map((fb) => {
            const { bg, color } = ratingMeta(fb.rating);
            return (
              <div
                key={fb.feedbackId}
                className="card p-4"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div className="row space-between items-center mb-2">
                  <div>
                    <span className="bold">{fb.studentName}</span>
                    <span className="fs-p8 text-secondary ms-2">• from {fb.companyName}</span>
                  </div>
                  <div className="row items-center" style={{ gap: "8px" }}>
                    <span
                      className="status-item fs-p8"
                      style={{ background: bg, color }}
                    >
                      {fb.rating}
                    </span>
                    <span className="fs-p8 text-secondary">{fb.createdAt}</span>
                  </div>
                </div>

                <p className="fs-p9 mb-2">{fb.feedbackText}</p>

                {fb.suggestions && (
                  <div
                    className="p-2 br-md"
                    style={{ background: "#f9fafb", border: "1px solid var(--border-color)" }}
                  >
                    <p className="fs-p8 text-secondary">
                      💡 <strong>Suggestions:</strong> {fb.suggestions}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Feedback Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card p-5"
            style={{ width: "500px", maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-3">
              <h3>💬 Add Feedback</h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setShowModal(false)}>✕</span>
            </div>

            {/* Student */}
            <div className="form-group mb-3">
              <label className="form-control-label">Student *</label>
              <select
                className="form-control"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                <option value="">Select student</option>
                {loading ? (
                  <option disabled>Loading...</option>
                ) : (
                  students.map((s) => (
                    <option key={s.studentId || s.id} value={String(s.studentId || s.id)}>
                      {s.name || s.studentName}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Company Name */}
            <div className="form-group mb-3">
              <label className="form-control-label">Company Name *</label>
              <input
                className="form-control"
                placeholder="e.g. TechCorp"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>

            {/* Rating */}
            <div className="form-group mb-3">
              <label className="form-control-label">Rating</label>
              <select
                className="form-control"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              >
                <option>Excellent</option>
                <option>Good</option>
                <option>Average</option>
                <option>Needs Improvement</option>
              </select>
            </div>

            {/* Feedback */}
            <div className="form-group mb-3">
              <label className="form-control-label">Feedback *</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Describe the company's feedback about the student..."
                value={form.feedbackText}
                onChange={(e) => setForm({ ...form, feedbackText: e.target.value })}
              />
            </div>

            {/* Suggestions */}
            <div className="form-group mb-4">
              <label className="form-control-label">
                Improvement Suggestions{" "}
                <span className="fs-p8 text-secondary" style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Any areas the student should improve..."
                value={form.suggestions}
                onChange={(e) => setForm({ ...form, suggestions: e.target.value })}
              />
            </div>

            {message && showModal && (
              <div className="fs-p9 mb-3" style={{ color: "#dc2626" }}>{message}</div>
            )}

            <div className="row" style={{ gap: "10px" }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "💾 Save Feedback"}
              </button>
              <button className="btn btn-muted" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorFeedback;