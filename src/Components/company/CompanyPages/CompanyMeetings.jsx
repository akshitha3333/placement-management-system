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

function CompanyMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    setLoading(true); setError("");
    try {
      const res  = await axios.get(`${baseInteractions}/meetings`, getHeaders());
      const data = res.data?.data || res.data || [];
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchMeetings error:", err.response?.data || err.message);
      setError("Failed to load meetings.");
    } finally { setLoading(false); }
  };

  const formatTime = (t) => {
    if (!t) return "—";
    try {
      if (Array.isArray(t)) {
        const [h, m] = t; const d = new Date(); d.setHours(h, m, 0);
        return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });

      }
      const [h, m] = String(t).split(":");
      const d = new Date(); d.setHours(Number(h), Number(m), 0);
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });

    } catch { return t; }
  };

  const getMeetingType = (m) => m.meetingType || (m.studentModel ? "BOTH" : "COMPANY");

  const typeStyle = (type) => {
    if (type === "COMPANY") return { color: "#7c3aed", bg: "rgba(139,92,246,0.08)", label: "Tutor + Company",             icon: "🏢" };
    return                         { color: "var(--primary)", bg: "rgba(50,85,99,0.08)", label: "Tutor + Student + You", icon: "👥" };
  };

  const getStudentName  = (m) => m.studentModel?.name        || null;
  const getTutorName    = (m) => m.tutorModel?.tutorName     || `Tutor #${m.tutorId || "—"}`;
  const getStudentDept  = (m) => m.studentModel?.departmentModel?.departmentName || "—";
  const getStudentEmail = (m) => m.studentModel?.email || "";

  const filtered = meetings.filter((m) => {
    const q = search.toLowerCase();
    return !q
      || (m.meetingTitle   || "").toLowerCase().includes(q)
      || (getStudentName(m) || "").toLowerCase().includes(q)
      || getTutorName(m).toLowerCase().includes(q);
  });

  const withStudents    = meetings.filter((m) => !!m.studentModel).length;
  const companyOnlyMtgs = meetings.length - withStudents;

  if (loading) return <div className="p-4"><p className="text-secondary">Loading meetings...</p></div>;

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Meetings</h2>
          <p className="fs-p9 text-secondary">Meetings scheduled by tutors involving your company</p>
        </div>
        <button className="btn btn-muted w-auto" style={{ padding: "8px 16px" }} onClick={fetchMeetings}>
          Refresh
        </button>
      </div>

      {error && <div className="alert-danger mb-4"><p className="fs-p9" style={{ color: "var(--danger)" }}>{error}</p></div>}

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10 }}>
        {[
          { label: "Total Meetings",        value: meetings.length,                                    color: "var(--primary)" },
          { label: "With Students",         value: withStudents,                                       color: "#0ea5e9"        },
          { label: "Company Only",          value: companyOnlyMtgs,                                    color: "#7c3aed"        },
          { label: "Unique Students",       value: new Set(meetings.map((m) => m.studentId).filter(Boolean)).size, color: "var(--success)" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div className="card p-3 text-center stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p8 text-secondary mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {meetings.length > 0 && (
        <div style={{ marginBottom: 16, maxWidth: 320 }}>
          <input type="text" className="form-control"
            placeholder="Search by title, student or tutor..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mb-1">No meetings yet</p>
          <p className="fs-p9 text-secondary">Meetings scheduled by tutors involving your company appear here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="fs-p9 text-secondary">No meetings match your search.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((m, idx) => {
            const mtype   = getMeetingType(m);
            const ts      = typeStyle(mtype);
            const sName   = getStudentName(m);
            const tName   = getTutorName(m);
            return (
              <div key={m.meetingId || idx} className="card p-4"
                style={{ borderLeft: `4px solid ${ts.color}` }}>

                <div className="row space-between items-center mb-3">
                  <div className="row items-center" style={{ gap: 10 }}>
                    <span style={{ fontSize: "1.1rem" }}>{ts.icon}</span>
                    <div>
                      <p className="bold fs-p9">{m.meetingTitle || "—"}</p>
                      <p className="fs-p8 text-secondary">{formatTime(m.startTime)} — {formatTime(m.endTime)}</p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.72rem", fontWeight: 700, padding: "3px 12px", borderRadius: 20,
                    background: ts.bg, color: ts.color, border: `1px solid ${ts.color}33`,
                  }}>
                    {ts.label}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  {/* Tutor */}
                  <div style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
                    <p className="fs-p8 text-secondary">Tutor</p>
                    <p className="bold fs-p9">{tName}</p>
                  </div>

                  {/* Student — only for BOTH type */}
                  {sName && (
                    <div style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 8, padding: "8px 12px" }}>
                      <p className="fs-p8 text-secondary">Student</p>
                      <p className="bold fs-p9">{sName}</p>
                      <p className="fs-p8 text-secondary">{getStudentDept(m)} · {getStudentEmail(m)}</p>
                    </div>
                  )}

                  {/* Time */}
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
    </div>
  );
}

export default CompanyMeetings;