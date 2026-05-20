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

const MEETING_TYPES = [
  { value: "STUDENT", label: "Tutor → Student",         desc: "1-to-1 with a student",              icon: "👤" },
  { value: "COMPANY", label: "Tutor → Company",         desc: "1-to-1 with a company",              icon: "🏢" },
  { value: "BOTH",    label: "Tutor → Student + Company", desc: "1-to-2 with student and company",  icon: "👥" },
];

function TutorMeetings() {
  const [meetings,    setMeetings]    = useState([]);
  const [students,    setStudents]    = useState([]);
  const [companies,   setCompanies]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitDone,  setSubmitDone]  = useState(null);
  const [error,       setError]       = useState("");
  const [formError,   setFormError]   = useState("");
  const [stuSearch,   setStuSearch]   = useState("");
  const [filterType,  setFilterType]  = useState("");

  const emptyForm = {
    meetingType:        "STUDENT",
    meetingTitle:       "",
    meetingDescription: "",
    startTime:          "",
    endTime:            "",
    selectedStudents:   [],
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

  const toggleStudent = (id) => {
    setForm((prev) => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(id)
        ? prev.selectedStudents.filter((s) => s !== id)
        : [...prev.selectedStudents, id],
    }));
  };

  const toggleAll = () => {
    const visibleIds = filteredStudents.map((s) => s.studentId);
    if (allVisibleSelected) {
      setForm((prev) => ({ ...prev, selectedStudents: prev.selectedStudents.filter((id) => !visibleIds.includes(id)) }));
    } else {
      setForm((prev) => ({ ...prev, selectedStudents: [...new Set([...prev.selectedStudents, ...visibleIds])] }));
    }
  };

  const needsStudent = form.meetingType === "STUDENT" || form.meetingType === "BOTH";
  const needsCompany = form.meetingType === "COMPANY" || form.meetingType === "BOTH";

  const handleSubmit = async () => {
    setFormError("");
    if (!form.meetingTitle || !form.startTime || !form.endTime) {
      setFormError("Title and times are required."); return;
    }
    if (needsStudent && form.selectedStudents.length === 0) {
      setFormError("Please select at least one student."); return;
    }
    if (needsCompany && !form.companyId) {
      setFormError("Please select a company."); return;
    }

    setSubmitting(true);
    setSubmitDone(null);
    let success = 0, failed = 0;

        if (form.meetingType === "COMPANY") {
      // Single POST — tutor to company only
     const payload = {
  meetingType:        "COMPANY",
  meetingTitle:       form.meetingTitle,
  meetingDescription: form.meetingDescription,
  startTime:          form.startTime,
  endTime:            form.endTime,
  companyId:          Number(form.companyId),
};
      try {
        await axios.post(`${baseInteractions}/meetings`, payload, getHeaders());
        success = 1;
      } catch (err) {
        console.error("Failed company meeting:", err.response?.data || err.message);
        failed = 1;
      }
    } else {
      // STUDENT or BOTH — one POST per selected student
      for (const studentId of form.selectedStudents) {
        const payload = {
          meetingType:        form.meetingType,
          meetingTitle:       form.meetingTitle,
          meetingDescription: form.meetingDescription,
          startTime:          form.startTime,
          endTime:            form.endTime,
          studentId:          Number(studentId),
          ...(form.meetingType === "BOTH" && { companyId: Number(form.companyId) }),
        };
        try {
          await axios.post(`${baseInteractions}/meetings`, payload, getHeaders());
          success++;
        } catch (err) {
          console.error(`Failed studentId ${studentId}:`, err.response?.data || err.message);
          failed++;
        }
      }
    }

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
        return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });

      }
      const [h, m] = String(t).split(":");
      const d = new Date(); d.setHours(Number(h), Number(m), 0);
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });

    } catch { return t; }
  };

  const getStudentName = (m) => m.studentModel?.name        || null;
  const getCompanyName = (m) => m.companyModel?.companyName || null;
  const getMeetingType = (m) => {
    const t = m.meetingType || (m.studentModel && m.companyModel ? "BOTH" : m.studentModel ? "STUDENT" : "COMPANY");
    return t;
  };

  const typeStyle = (type) => {
    if (type === "STUDENT") return { bg: "rgba(14,165,233,0.10)", color: "#0ea5e9",         label: "Student",          icon: "👤" };
    if (type === "COMPANY") return { bg: "rgba(139,92,246,0.10)", color: "#7c3aed",         label: "Company",          icon: "🏢" };
    return                         { bg: "rgba(50,85,99,0.10)",   color: "var(--primary)",  label: "Student + Company", icon: "👥" };
  };

  const displayedMeetings = filterType
    ? meetings.filter((m) => getMeetingType(m) === filterType)
    : meetings;

  const countByType = (type) => meetings.filter((m) => getMeetingType(m) === type).length;

  if (loading) return <div className="p-4"><p className="text-secondary">Loading meetings...</p></div>;

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Meetings</h2>
          <p className="fs-p9 text-secondary">Schedule meetings between students, companies, or both</p>
        </div>
        <button className="btn btn-primary w-auto" style={{ padding: "8px 20px" }} onClick={openModal}>
          + Schedule Meeting
        </button>
      </div>

      {error && <div className="alert-danger mb-4"><p className="fs-p9" style={{ color: "var(--danger)" }}>{error}</p></div>}

      {/* Stats — clickable type filters */}
      <div className="row mb-4" style={{ gap: 10 }}>
        {[
          { label: "All Meetings",      value: meetings.length,       color: "var(--primary)", type: "" },
          { label: "Student Meetings",  value: countByType("STUDENT"), color: "#0ea5e9",        type: "STUDENT" },
          { label: "Company Meetings",  value: countByType("COMPANY"), color: "#7c3aed",        type: "COMPANY" },
          { label: "Combined Meetings", value: countByType("BOTH"),    color: "var(--success)", type: "BOTH" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div className="card p-3 text-center stat-card"
              style={{
                cursor: "pointer",
                borderTop: `3px solid ${s.color}`,
                opacity: filterType && filterType !== s.type && s.type ? 0.55 : 1,
              }}
              onClick={() => setFilterType(filterType === s.type ? "" : s.type)}>
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p8 text-secondary mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Meetings list */}
      {displayedMeetings.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mb-1">No meetings {filterType ? `of type "${filterType}"` : "scheduled yet"}</p>
          <p className="fs-p9 text-secondary">
            {filterType ? "Try a different filter." : 'Click "+ Schedule Meeting" to create one.'}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayedMeetings.map((m, idx) => {
            const mtype  = getMeetingType(m);
            const ts     = typeStyle(mtype);
            const sName  = getStudentName(m);
            const cName  = getCompanyName(m);
            return (
              <div key={m.meetingId || idx} className="card p-4"
                style={{ borderLeft: `4px solid ${ts.color}` }}>
                <div className="row space-between items-center mb-3">
                  <div className="row items-center" style={{ gap: 10 }}>
                    <span style={{ fontSize: "1.1rem" }}>{ts.icon}</span>
                    <div>
                      <p className="bold fs-p9">{m.meetingTitle || "—"}</p>
                      <p className="fs-p8 text-secondary">
                        {formatTime(m.startTime)} — {formatTime(m.endTime)}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.72rem", fontWeight: 700, padding: "3px 12px", borderRadius: 20,
                    background: ts.bg, color: ts.color,
                    border: `1px solid ${ts.color}33`,
                  }}>
                    {ts.label}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  {sName && (
                    <div style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 8, padding: "8px 12px" }}>
                      <p className="fs-p8 text-secondary">Student</p>
                      <p className="bold fs-p9">{sName}</p>
                      {m.studentModel?.email && <p className="fs-p8 text-secondary">{m.studentModel.email}</p>}
                    </div>
                  )}
                  {cName && (
                    <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "8px 12px" }}>
                      <p className="fs-p8 text-secondary">Company</p>
                      <p className="bold fs-p9">{cName}</p>
                    </div>
                  )}
                  <div style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
                    <p className="fs-p8 text-secondary">Time</p>
                    <p className="bold fs-p9">{formatTime(m.startTime)} → {formatTime(m.endTime)}</p>
                  </div>
                </div>

                {m.meetingDescription && (
                  <div style={{
                    marginTop: 10, background: "rgba(50,85,99,0.04)",
                    border: "1px solid rgba(50,85,99,0.12)", borderRadius: 8, padding: "8px 12px",
                  }}>
                    <p className="fs-p8 text-secondary" style={{ marginBottom: 2 }}>Description</p>
                    <p className="fs-p9">{m.meetingDescription}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Schedule Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="card p-5"
            style={{ width: 580, maxWidth: "96%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="row space-between items-center mb-4">
              <h3 className="bold">Schedule Meeting</h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={closeModal}>✖</span>
            </div>

            {/* ── Step 1: Meeting Type ── */}
            <div className="form-group mb-4">
              <label className="form-control-label mb-2">
                Meeting Type <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {MEETING_TYPES.map((mt) => {
                  const active = form.meetingType === mt.value;
                  return (
                    <div key={mt.value}
                      onClick={() => setForm({ ...emptyForm, meetingType: mt.value })}
                      style={{
                        border: `2px solid ${active ? "var(--primary)" : "var(--border-color)"}`,
                        borderRadius: 10, padding: "12px 10px", cursor: "pointer", textAlign: "center",
                        background: active ? "rgba(50,85,99,0.06)" : "#fff",
                        transition: "all 0.15s",
                      }}>
                      <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{mt.icon}</div>
                      <p className="bold fs-p9" style={{ color: active ? "var(--primary)" : "var(--text-primary)" }}>
                        {mt.label}
                      </p>
                      <p className="fs-p8 text-secondary">{mt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Title ── */}
            <div className="form-group mb-3">
              <label className="form-control-label">
                Meeting Title <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input className="form-control" placeholder="e.g. Interview Prep Session"
                value={form.meetingTitle}
                onChange={(e) => setForm({ ...form, meetingTitle: e.target.value })} />
            </div>

            {/* ── Company (shown for COMPANY and BOTH) ── */}
            {needsCompany && (
              <div className="form-group mb-3">
                <label className="form-control-label">
                  Company <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select className="form-control" value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
                  <option value="">-- Select Company --</option>
                  {companies.map((c) => (
                    <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ── Times ── */}
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

            {/* ── Description ── */}
            <div className="form-group mb-3">
              <label className="form-control-label">Description</label>
              <textarea className="form-control" rows={2}
                placeholder="What will be covered..."
                value={form.meetingDescription}
                onChange={(e) => setForm({ ...form, meetingDescription: e.target.value })}
                style={{ resize: "vertical" }} />
            </div>

            {/* ── Student picker (shown for STUDENT and BOTH) ── */}
            {needsStudent && (
              <div className="form-group mb-4">
                <div className="row space-between items-center mb-2">
                  <label className="form-control-label" style={{ margin: 0 }}>
                    {form.meetingType === "BOTH" ? "Select Students" : "Select Student(s)"}
                    <span style={{ color: "var(--danger)" }}> *</span>
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
                    <button onClick={toggleAll} style={{
                      fontSize: "0.75rem", fontWeight: 600,
                      padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                      border: "1px solid var(--border-color)",
                      background: allVisibleSelected ? "var(--primary)" : "#fff",
                      color:      allVisibleSelected ? "#fff" : "var(--text-secondary)",
                    }}>
                      {allVisibleSelected ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                <input className="form-control" style={{ marginBottom: 8 }}
                  placeholder="Search by name, email or department..."
                  value={stuSearch}
                  onChange={(e) => setStuSearch(e.target.value)} />

                <div style={{
                  border: "1px solid var(--border-color)", borderRadius: 8,
                  maxHeight: 200, overflowY: "auto", background: "#fff",
                }}>
                  {filteredStudents.length === 0 ? (
                    <p className="fs-p9 text-secondary p-3">No students found.</p>
                  ) : filteredStudents.map((s) => {
                    const checked = form.selectedStudents.includes(s.studentId);
                    return (
                      <div key={s.studentId} onClick={() => toggleStudent(s.studentId)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                          borderBottom: "1px solid var(--border-color)", cursor: "pointer",
                          background: checked ? "rgba(50,85,99,0.06)" : "#fff",
                        }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: checked ? "none" : "2px solid var(--gray-300)",
                          background: checked ? "var(--primary)" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {checked && (
                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                              <path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: checked ? "var(--primary)" : "var(--gray-300)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "0.8rem",
                        }}>
                          {(s.name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="bold fs-p9" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.name}
                          </p>
                          <p className="fs-p8 text-secondary">
                            {s.departmentModel?.departmentName || "—"} · {s.email}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected chips */}
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
                          <span onClick={(e) => { e.stopPropagation(); toggleStudent(id); }}
                            style={{ cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1 }}>
                            ×
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Summary preview */}
            {(form.meetingTitle || form.selectedStudents.length > 0 || form.companyId) && (
              <div className="mb-3 p-3" style={{
                background: "rgba(50,85,99,0.04)", border: "1px solid rgba(50,85,99,0.15)", borderRadius: 8,
              }}>
                <p className="bold fs-p8 mb-2" style={{ color: "var(--primary)" }}>
                  {MEETING_TYPES.find((t) => t.value === form.meetingType)?.icon}{" "}
                  This will create:
                </p>
                <p className="fs-p9 text-secondary">
                  {form.meetingType === "COMPANY" && `1 meeting with ${companies.find((c) => String(c.companyId) === String(form.companyId))?.companyName || "selected company"}`}
                  {form.meetingType === "STUDENT" && `${form.selectedStudents.length || 0} individual student meeting${form.selectedStudents.length !== 1 ? "s" : ""}`}
                  {form.meetingType === "BOTH" && `${form.selectedStudents.length || 0} meeting${form.selectedStudents.length !== 1 ? "s" : ""} (each student + ${companies.find((c) => String(c.companyId) === String(form.companyId))?.companyName || "company"})`}
                </p>
              </div>
            )}

            {formError && (
              <div className="alert-danger mb-3">
                <p className="fs-p9" style={{ color: "var(--danger)" }}>{formError}</p>
              </div>
            )}

            {submitDone && (
              <div className={submitDone.failed === 0 ? "alert-success mb-3" : "alert-info mb-3"}>
                <p className="fs-p9" style={{ color: submitDone.failed === 0 ? "var(--success)" : "var(--warning)" }}>
                  {submitDone.success} meeting{submitDone.success !== 1 ? "s" : ""} scheduled
                  {submitDone.failed > 0 ? `, ${submitDone.failed} failed.` : " successfully!"}
                </p>
              </div>
            )}

            {submitting && (
              <div style={{ background: "rgba(50,85,99,0.06)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                <p className="fs-p9 text-secondary">Scheduling meetings...</p>
              </div>
            )}

            <div className="row g-2">
              <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}
                style={{ opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Scheduling..." : (() => {
                  if (form.meetingType === "COMPANY") return "Schedule Meeting";
                  return `Schedule for ${form.selectedStudents.length || 0} Student${form.selectedStudents.length !== 1 ? "s" : ""}`;
                })()}
              </button>
              <button className="btn btn-muted" onClick={closeModal} disabled={submitting}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorMeetings;