import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const baseInteractions = rest.jobApplications.replace("/job/job-applications", "/interactions");

const getHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

function TutorMeetings() {
  const [meetings,   setMeetings]   = useState([]);
  const [students,   setStudents]   = useState([]);
  const [companies,  setCompanies]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(null); // { success, failed }
  const [error,      setError]      = useState("");
  const [formError,  setFormError]  = useState("");
  const [stuSearch,  setStuSearch]  = useState("");

  const emptyForm = {
    meetingTitle:       "",
    meetingDescription: "",
    startTime:          "",
    endTime:            "",
    selectedStudents:   [], // array of studentId numbers
    companyId:          "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [meetRes, stuRes, coRes] = await Promise.all([
        axios.get(`${baseInteractions}/meetings`, getHeaders()),
        axios.get(rest.students,  getHeaders()),
        axios.get(rest.companys,  getHeaders()),
      ]);
      const meetData = meetRes.data?.data || meetRes.data || [];
      const stuData  = stuRes.data?.data  || stuRes.data  || [];
      const coData   = coRes.data?.data   || coRes.data   || [];
      console.log("Meetings:", meetData);
      console.log("Students:", stuData);
      console.log("Companies:", coData);
      setMeetings(Array.isArray(meetData) ? meetData : []);
      setStudents(Array.isArray(stuData)  ? stuData  : []);
      setCompanies(Array.isArray(coData)  ? coData   : []);
    } catch (err) {
      console.error("fetchAll error:", err.response?.data || err.message);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  // Students visible after search filter
  const filteredStudents = students.filter((s) => {
    const q = stuSearch.toLowerCase();
    return !q
      || (s.name  || "").toLowerCase().includes(q)
      || (s.email || "").toLowerCase().includes(q)
      || (s.departmentModel?.departmentName || "").toLowerCase().includes(q);
  });

  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => form.selectedStudents.includes(s.studentId));

  // Toggle one student
  const toggleStudent = (id) => {
    setForm((prev) => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(id)
        ? prev.selectedStudents.filter((s) => s !== id)
        : [...prev.selectedStudents, id],
    }));
  };

  // Select / deselect all visible
  const toggleAll = () => {
    const visibleIds = filteredStudents.map((s) => s.studentId);
    if (allVisibleSelected) {
      setForm((prev) => ({
        ...prev,
        selectedStudents: prev.selectedStudents.filter((id) => !visibleIds.includes(id)),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        selectedStudents: [...new Set([...prev.selectedStudents, ...visibleIds])],
      }));
    }
  };

  // POST one meeting per selected student
  const handleSubmit = async () => {
    if (!form.meetingTitle || !form.startTime || !form.endTime || !form.companyId) {
      setFormError("Title, company and times are required.");
      return;
    }
    if (form.selectedStudents.length === 0) {
      setFormError("Please select at least one student.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    setSubmitDone(null);

    let success = 0;
    let failed  = 0;

    for (const studentId of form.selectedStudents) {
      const payload = {
        meetingTitle:       form.meetingTitle,
        meetingDescription: form.meetingDescription,
        startTime:          form.startTime,
        endTime:            form.endTime,
        studentId:          Number(studentId),
        companyId:          Number(form.companyId),
      };
      console.log(`Posting meeting — studentId ${studentId}:`, payload);
      try {
        const res = await axios.post(`${baseInteractions}/meetings`, payload, getHeaders());
        console.log(`Success studentId ${studentId}:`, res.data);
        success++;
      } catch (err) {
        console.error(`Failed studentId ${studentId}:`, err.response?.data || err.message);
        failed++;
      }
    }

    console.log(`Done — success: ${success}, failed: ${failed}`);
    setSubmitDone({ success, failed });
    setSubmitting(false);

    if (success > 0) {
      setForm(emptyForm);
      setStuSearch("");
      fetchAll();
      setTimeout(() => { setShowModal(false); setSubmitDone(null); }, 2000);
    }
  };

  const openModal = () => {
    setForm(emptyForm);
    setStuSearch("");
    setFormError("");
    setSubmitDone(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setFormError("");
    setSubmitDone(null);
  };

  const formatTime = (t) => {
    if (!t) return "—";
    try {
      if (Array.isArray(t)) {
        const [h, m] = t;
        const d = new Date(); d.setHours(h, m, 0);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      }
      const [h, m] = String(t).split(":");
      const d = new Date(); d.setHours(Number(h), Number(m), 0);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch { return t; }
  };

  const getStudentName = (m) => m.studentModel?.name        || `Student #${m.studentId || "—"}`;
  const getCompanyName = (m) => m.companyModel?.companyName || `Company #${m.companyId || "—"}`;

  if (loading) {
    return <div className="p-4"><p className="text-secondary">Loading meetings...</p></div>;
  }

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Meetings</h2>
          <p className="fs-p9 text-secondary">Schedule meetings between students and companies</p>
        </div>
        <button className="btn btn-primary w-auto" style={{ padding: "8px 20px" }} onClick={openModal}>
          + Schedule Meeting
        </button>
      </div>

      {error && (
        <div className="alert-danger mb-4">
          <p className="fs-p9" style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10 }}>
        {[
          { label: "Total Meetings", value: meetings.length,  color: "var(--primary)"  },
          { label: "Students",       value: students.length,  color: "#0ea5e9"         },
          { label: "Companies",      value: companies.length, color: "var(--secondary)"},
        ].map((s, i) => (
          <div key={i} style={{ flex: "1 1 120px" }}>
            <div className="card p-3 text-center stat-card">
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Meetings table */}
      {meetings.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mb-1">No meetings scheduled yet</p>
          <p className="fs-p9 text-secondary">Click "+ Schedule Meeting" to create one.</p>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>
          <div className="row items-center" style={{
            background: "var(--gray-100)", padding: "10px 16px",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
          }}>
            <div style={{ width: 36 }}>#</div>
            <div style={{ flex: 3 }}>Title</div>
            <div style={{ flex: 2 }}>Student</div>
            <div style={{ flex: 2 }}>Company</div>
            <div style={{ flex: 1 }}>Start</div>
            <div style={{ flex: 1 }}>End</div>
            <div style={{ flex: 3 }}>Description</div>
          </div>

          {meetings.map((m, idx) => (
            <div key={m.meetingId || idx} className="row items-center" style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-color)",
              borderLeft: "4px solid var(--primary)",
              background: "#fff",
            }}>
              <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>
              <div style={{ flex: 3 }}>
                <p className="bold fs-p9">{m.meetingTitle || "—"}</p>
              </div>
              <div style={{ flex: 2 }}>
                <p className="fs-p9">{getStudentName(m)}</p>
                <p className="fs-p8 text-secondary">{m.studentModel?.email || ""}</p>
              </div>
              <div style={{ flex: 2 }}>
                <p className="fs-p9">{getCompanyName(m)}</p>
              </div>
              <div style={{ flex: 1 }}>
                <p className="fs-p9">{formatTime(m.startTime)}</p>
              </div>
              <div style={{ flex: 1 }}>
                <p className="fs-p9">{formatTime(m.endTime)}</p>
              </div>
              <div style={{ flex: 3 }}>
                <p className="fs-p9 text-secondary">{m.meetingDescription || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Schedule Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="card p-5"
            style={{ width: 560, maxWidth: "96%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-4">
              <h3 className="bold">Schedule Meeting</h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={closeModal}>x</span>
            </div>

            {/* Title */}
            <div className="form-group mb-3">
              <label className="form-control-label">
                Meeting Title <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                className="form-control"
                placeholder="e.g. Interview Prep Session"
                value={form.meetingTitle}
                onChange={(e) => setForm({ ...form, meetingTitle: e.target.value })}
              />
            </div>

            {/* Company */}
            <div className="form-group mb-3">
              <label className="form-control-label">
                Company <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                className="form-control"
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              >
                <option value="">-- Select Company --</option>
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                ))}
              </select>
            </div>

            {/* Times */}
            <div className="row mb-3" style={{ gap: 10 }}>
              <div className="col-6 p-0">
                <label className="form-control-label">
                  Start Time <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input type="time" className="form-control" value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="col-6 p-0">
                <label className="form-control-label">
                  End Time <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input type="time" className="form-control" value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>

            {/* Description */}
            <div className="form-group mb-3">
              <label className="form-control-label">Description</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="What will be covered..."
                value={form.meetingDescription}
                onChange={(e) => setForm({ ...form, meetingDescription: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* ── Multi-student picker ── */}
            <div className="form-group mb-4">
              {/* Picker header */}
              <div className="row space-between items-center mb-2">
                <label className="form-control-label" style={{ margin: 0 }}>
                  Select Students <span style={{ color: "var(--danger)" }}>*</span>
                  {form.selectedStudents.length > 0 && (
                    <span style={{
                      marginLeft: 8, fontSize: "0.72rem", fontWeight: 600,
                      padding: "2px 8px", borderRadius: 10,
                      background: "rgba(50,85,99,0.12)", color: "var(--primary)",
                    }}>
                      {form.selectedStudents.length} selected
                    </span>
                  )}
                </label>
                {filteredStudents.length > 0 && (
                  <button
                    onClick={toggleAll}
                    style={{
                      fontSize: "0.75rem", fontWeight: 600,
                      padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                      border: "1px solid var(--border-color)",
                      background: allVisibleSelected ? "var(--primary)" : "#fff",
                      color:      allVisibleSelected ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    {allVisibleSelected ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>

              {/* Search */}
              <input
                className="form-control"
                placeholder="Search by name, email or department..."
                value={stuSearch}
                onChange={(e) => setStuSearch(e.target.value)}
                style={{ marginBottom: 8 }}
              />

              {/* Scrollable list */}
              <div style={{
                border: "1px solid var(--border-color)", borderRadius: 8,
                maxHeight: 220, overflowY: "auto", background: "#fff",
              }}>
                {filteredStudents.length === 0 ? (
                  <p className="fs-p9 text-secondary p-3">No students found.</p>
                ) : (
                  filteredStudents.map((s) => {
                    const checked = form.selectedStudents.includes(s.studentId);
                    return (
                      <div
                        key={s.studentId}
                        onClick={() => toggleStudent(s.studentId)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--border-color)",
                          cursor: "pointer",
                          background: checked ? "rgba(50,85,99,0.06)" : "#fff",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => {
                          if (!checked) e.currentTarget.style.background = "var(--gray-100)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = checked ? "rgba(50,85,99,0.06)" : "#fff";
                        }}
                      >
                        {/* Custom checkbox */}
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: checked ? "none" : "2px solid var(--gray-300)",
                          background: checked ? "var(--primary)" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.12s",
                        }}>
                          {checked && (
                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                              <path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        {/* Avatar */}
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: checked ? "var(--primary)" : "var(--gray-300)",
                          color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "0.8rem",
                          transition: "background 0.12s",
                        }}>
                          {(s.name || "S").charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="bold fs-p9" style={{
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {s.name}
                          </p>
                          <p className="fs-p8 text-secondary">
                            {s.departmentModel?.departmentName || "—"} · {s.email}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected chips below the list */}
              {form.selectedStudents.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {form.selectedStudents.map((id) => {
                    const s = students.find((st) => st.studentId === id);
                    if (!s) return null;
                    return (
                      <span key={id} style={{
                        fontSize: "0.72rem", fontWeight: 600,
                        padding: "3px 8px 3px 10px", borderRadius: 20,
                        background: "rgba(50,85,99,0.1)", color: "var(--primary)",
                        display: "inline-flex", alignItems: "center", gap: 5,
                      }}>
                        {s.name}
                        <span
                          onClick={(e) => { e.stopPropagation(); toggleStudent(id); }}
                          style={{ cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1 }}
                        >×</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form error */}
            {formError && (
              <div className="alert-danger mb-3">
                <p className="fs-p9" style={{ color: "var(--danger)" }}>{formError}</p>
              </div>
            )}

            {/* Submit result */}
            {submitDone && (
              <div className={submitDone.failed === 0 ? "alert-success mb-3" : "alert-info mb-3"}>
                <p className="fs-p9" style={{
                  color: submitDone.failed === 0 ? "var(--success)" : "var(--warning)",
                }}>
                  {submitDone.success} meeting{submitDone.success !== 1 ? "s" : ""} scheduled
                  {submitDone.failed > 0 ? `, ${submitDone.failed} failed.` : " successfully!"}
                </p>
              </div>
            )}

            {/* Submitting progress */}
            {submitting && (
              <div style={{
                background: "rgba(50,85,99,0.06)", borderRadius: 8,
                padding: "10px 14px", marginBottom: 12,
              }}>
                <p className="fs-p9 text-secondary">
                  Scheduling for {form.selectedStudents.length} student
                  {form.selectedStudents.length !== 1 ? "s" : ""}...
                </p>
              </div>
            )}

            <div className="row g-2">
              <button
                className="btn btn-primary"
                disabled={submitting}
                onClick={handleSubmit}
                style={{ opacity: submitting ? 0.7 : 1 }}
              >
                {submitting
                  ? "Scheduling..."
                  : `Schedule for ${form.selectedStudents.length || 0} Student${form.selectedStudents.length !== 1 ? "s" : ""}`}
              </button>
              <button className="btn btn-muted" onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorMeetings;