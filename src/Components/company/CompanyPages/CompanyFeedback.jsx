import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const getHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

const baseJob = rest.jobApplications.replace("/job-applications", "");

// ── Rating config ─────────────────────────────────────────
const RATINGS = ["Excellent", "Good", "Average", "Needs Improvement"];

const ratingCfg = (r) => ({
  Excellent:           { bg: "rgba(22,163,74,0.1)",  color: "#16a34a" },
  Good:                { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
  Average:             { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  "Needs Improvement": { bg: "rgba(220,38,38,0.1)",  color: "#dc2626" },
}[r] || { bg: "rgba(107,114,128,0.1)", color: "#6b7280" });

// ── Feedback string: "[Rating]||sName:X||tName:Y||text:Z" ─
const buildFb = (rating, text, sName, tName) =>
  `[${rating}]||sName:${sName}||tName:${tName}||text:${text}`;

const parseFb = (fb) => {
  const raw = fb.feedback || "";
  if (raw.includes("||sName:")) {
    return {
      rating:      (raw.match(/^\[(.+?)\]/) || [])[1]          || "Good",
      studentName: (raw.match(/\|\|sName:(.+?)\|\|/) || [])[1] || "—",
      tutorName:   (raw.match(/\|\|tName:(.+?)\|\|/) || [])[1] || "—",
      text:        (raw.match(/\|\|text:(.+)$/s) || [])[1]     || "",
    };
  }
  return {
    rating:      (raw.match(/^\[(.+?)\]/) || [])[1] || "Good",
    studentName: "—", tutorName: "—",
    text: raw.replace(/^\[.+?\]\s*/, ""),
  };
};

const emptyForm = { studentId: "", tutorId: "", rating: "Good", text: "" };

// ─────────────────────────────────────────────────────────────────────────────
function CompanyFeedback() {
  const [feedbacks,    setFeedbacks]    = useState([]);
  const [interviews,   setInterviews]   = useState([]); // interviewed students
  const [tutors,       setTutors]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [form,         setForm]         = useState(emptyForm);
  const [submitting,   setSubmitting]   = useState(false);
  const [msg,          setMsg]          = useState({ text: "", type: "" });
  const [filterRating, setFilterRating] = useState("");

  useEffect(() => { init(); }, []);

  const init = async () => {
    setLoading(true);
    try {
      // 1. Tutors + job applications (for student list) + existing feedbacks
      const [tutorRes, appsRes, fbRes] = await Promise.all([
        axios.get(rest.tutor,           getHeaders()),
        axios.get(rest.jobApplications, getHeaders()),
        axios.get(rest.feedback,        getHeaders()),
      ]);

      // tutors
      const tList = tutorRes.data?.data || tutorRes.data || [];
      setTutors(Array.isArray(tList) ? tList : []);
      console.log("TUTORS:", tList);

      // feedbacks this company sent
      const fbList = fbRes.data?.data || fbRes.data || [];
      const myFbs  = (Array.isArray(fbList) ? fbList : []).filter(
        (f) => f.feedback_by_role === "COMPANY" && f.feedback_to_role === "TUTOR"
      );
      setFeedbacks(myFbs);
      console.log("FEEDBACKS:", myFbs);

      // applications → interviews to get student list
      const apps = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                 : Array.isArray(appsRes.data)        ? appsRes.data : [];

      const invArrays = await Promise.all(
        apps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res  = await axios.get(`${baseJob}/job-application/${appId}/interview`, getHeaders());
            const data = res.data?.data || res.data;
            const list = Array.isArray(data) ? data : data ? [data] : [];
            return list.map((inv) => ({ ...inv, _app: app }));
          } catch { return []; }
        })
      );
      setInterviews(invArrays.flat());
      console.log("INTERVIEWS:", invArrays.flat().length);

    } catch (err) {
      console.error("CompanyFeedback init:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Unique interviewed students
  const studentOptions = (() => {
    const seen = new Set();
    return interviews.reduce((acc, inv) => {
      const stu = inv._app?.jobSuggestionModel?.studentModel
               || inv._app?.resumeModel?.studentModel;
      if (!stu) return acc;
      const sid = String(stu.studentId || stu.id || "");
      if (!sid || seen.has(sid)) return acc;
      seen.add(sid);
      acc.push({ studentId: sid, name: stu.name || stu.studentName || `Student #${sid}` });
      return acc;
    }, []);
  })();

  const selStudent = studentOptions.find((s) => s.studentId === form.studentId);
  const selTutor   = tutors.find((t) => String(t.tutorId || t.id) === form.tutorId);

  const handleSubmit = async () => {
    if (!form.studentId)    { setMsg({ text: "Please select a student.", type: "error" }); return; }
    if (!form.tutorId)      { setMsg({ text: "Please select a tutor.",   type: "error" }); return; }
    if (!form.text.trim())  { setMsg({ text: "Please enter feedback.",   type: "error" }); return; }

    setSubmitting(true); setMsg({ text: "", type: "" });

    const payload = {
      feedback:         buildFb(form.rating, form.text.trim(), selStudent?.name || "—", selTutor?.tutorName || selTutor?.name || "—"),
      feedbackTo:       Number(form.tutorId),
      feedback_by_role: "COMPANY",
      feedback_to_role: "TUTOR",
    };
    console.log("POST feedback payload:", payload);

    try {
      await axios.post(rest.feedback, payload, getHeaders());
      // Refresh feedbacks
      const fbRes  = await axios.get(rest.feedback, getHeaders());
      const fbList = fbRes.data?.data || fbRes.data || [];
      setFeedbacks((Array.isArray(fbList) ? fbList : []).filter(
        (f) => f.feedback_by_role === "COMPANY" && f.feedback_to_role === "TUTOR"
      ));
      setShowModal(false);
      setForm(emptyForm);
      setMsg({ text: "Feedback submitted successfully!", type: "success" });
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error("Submit error:", err.response?.data || err.message);
      setMsg({ text: err.response?.data?.message || "Failed to submit feedback.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered     = feedbacks.filter((f) => !filterRating || parseFb(f).rating === filterRating);
  const countRating  = (r) => feedbacks.filter((f) => parseFb(f).rating === r).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Student Feedback</h2>
          <p className="fs-p9 text-secondary">Send performance feedback about students to their tutors</p>
        </div>
        <button
          className="btn btn-primary w-auto"
          style={{ padding: "10px 22px" }}
          onClick={() => { setShowModal(true); setMsg({ text: "", type: "" }); }}
        >
          + Give Feedback
        </button>
      </div>

      {/* Flash msg */}
      {msg.text && !showModal && (
        <div className="mb-3 p-3 fs-p9" style={{
          borderRadius: 8,
          background: msg.type === "success" ? "rgba(22,163,74,0.1)"  : "rgba(220,38,38,0.1)",
          border:     `1px solid ${msg.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
          color:      msg.type === "success" ? "#16a34a" : "#dc2626",
        }}>{msg.text}</div>
      )}

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 12 }}>
        {[
          { label: "Total Sent",        value: feedbacks.length,              color: "#325563" },
          { label: "Excellent",         value: countRating("Excellent"),       color: "#16a34a" },
          { label: "Good",              value: countRating("Good"),            color: "#0ea5e9" },
          { label: "Needs Improvement", value: countRating("Needs Improvement"), color: "#dc2626" },
        ].map((s, i) => (
          <div className="col p-0" key={i}>
            <div className="card p-3 text-center">
              <h2 className="bold" style={{ color: s.color, fontSize: "1.8rem" }}>
                {loading ? "…" : s.value}
              </h2>
              <p className="fs-p8 text-secondary mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="row space-between items-center mb-3">
        <h4 className="bold">Feedback History</h4>
        <div style={{ width: 200 }}>
          <select className="form-control" value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}>
            <option value="">All Ratings</option>
            {RATINGS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary fs-p9">Loading...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No feedback submitted yet</p>
          <p className="text-secondary fs-p9 mt-1">Click "+ Give Feedback" to send feedback about a student to their tutor</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="text-secondary fs-p9">No feedback matches the selected filter</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((fb, i) => {
            const { rating, studentName, tutorName, text } = parseFb(fb);
            const { bg, color } = ratingCfg(rating);
            return (
              <div key={fb.feedbackId || i} className="card p-4"
                style={{ borderLeft: `4px solid ${color}` }}>
                <div className="row space-between items-center mb-2">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Student initial */}
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "0.85rem",
                    }}>
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="bold fs-p9">{studentName}</p>
                      <p className="fs-p8 text-secondary">Tutor: {tutorName}</p>
                    </div>
                  </div>
                  <span style={{
                    background: bg, color, fontWeight: 600,
                    padding: "3px 12px", borderRadius: 20, fontSize: "0.75rem",
                  }}>
                    {rating}
                  </span>
                </div>
                <p className="fs-p9" style={{ color: "#374151", lineHeight: 1.6 }}>{text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ GIVE FEEDBACK MODAL ══ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="card p-5" style={{ width: 520, maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="row space-between items-center mb-4">
              <h3 className="bold">Give Feedback</h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setShowModal(false)}>x</span>
            </div>

            {/* Student */}
            <div className="form-group mb-3">
              <label className="form-control-label">Student <span style={{ color: "var(--danger)" }}>*</span></label>
              {studentOptions.length === 0 ? (
                <div className="p-3 fs-p9" style={{
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
                  color: "#f59e0b", borderRadius: 8,
                }}>
                  No interviewed students found. Students appear once interviews are scheduled.
                </div>
              ) : (
                <select className="form-control" value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value, tutorId: "" })}>
                  <option value="">-- Select a student --</option>
                  {studentOptions.map((s) => (
                    <option key={s.studentId} value={s.studentId}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Tutor */}
            <div className="form-group mb-3">
              <label className="form-control-label">Tutor <span style={{ color: "var(--danger)" }}>*</span></label>
              <select className="form-control" value={form.tutorId}
                onChange={(e) => setForm({ ...form, tutorId: e.target.value })}
                disabled={tutors.length === 0}>
                <option value="">-- Select the student's tutor --</option>
                {tutors.map((t) => (
                  <option key={t.tutorId || t.id} value={String(t.tutorId || t.id)}>
                    {t.tutorName || t.name || `Tutor #${t.tutorId || t.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Confirmation banner */}
            {form.studentId && form.tutorId && (
              <div className="mb-3 p-3" style={{
                background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.25)",
                borderRadius: 8,
              }}>
                <p className="fs-p9" style={{ color: "#16a34a" }}>
                  Sending feedback for <strong>{selStudent?.name}</strong> to tutor <strong>{selTutor?.tutorName || selTutor?.name}</strong>
                </p>
              </div>
            )}

            {/* Rating */}
            <div className="form-group mb-3">
              <label className="form-control-label">Rating</label>
              <select className="form-control" value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}>
                {RATINGS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Text */}
            <div className="form-group mb-4">
              <label className="form-control-label">Feedback <span style={{ color: "var(--danger)" }}>*</span></label>
              <textarea className="form-control" rows={4}
                placeholder="Describe the student's performance, attitude, technical skills..."
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Error in modal */}
            {msg.text && showModal && (
              <div className="mb-3 p-2 fs-p9" style={{
                color: "#dc2626", background: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6,
              }}>{msg.text}</div>
            )}

            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSubmit}
                disabled={submitting || !form.studentId || !form.tutorId || !form.text.trim()}>
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
              <button className="btn btn-muted"
                onClick={() => { setShowModal(false); setMsg({ text: "", type: "" }); }}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CompanyFeedback;