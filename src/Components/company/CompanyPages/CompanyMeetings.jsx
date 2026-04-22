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

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await axios.get(`${baseInteractions}/meetings`, getHeaders());
      const data = res.data?.data || res.data || [];
      console.log("Company meetings response:", res.data);
      console.log("Company meetings data:", data);
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchMeetings error:", err.response?.data || err.message);
      setError("Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return "—";
    try {
      if (Array.isArray(t)) {
        const [h, m] = t;
        const d = new Date();
        d.setHours(h, m, 0);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      }
      const [h, m] = String(t).split(":");
      const d = new Date();
      d.setHours(Number(h), Number(m), 0);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch { return t; }
  };

  const getStudentName = (m) => m.studentModel?.name        || `Student #${m.studentId || "—"}`;
  const getTutorName   = (m) => m.tutorModel?.tutorName     || `Tutor #${m.tutorId || "—"}`;
  const getStudentDept = (m) => m.studentModel?.departmentModel?.departmentName || "—";
  const getStudentEmail= (m) => m.studentModel?.email       || "—";

  const filtered = meetings.filter((m) => {
    const q = search.toLowerCase();
    return !q
      || (m.meetingTitle || "").toLowerCase().includes(q)
      || getStudentName(m).toLowerCase().includes(q)
      || getTutorName(m).toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="p-4"><p className="text-secondary">Loading meetings...</p></div>;
  }

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Meetings</h2>
          <p className="fs-p9 text-secondary">Meetings scheduled by tutors involving your company</p>
        </div>
        <button className="btn btn-muted w-auto" style={{ padding: "8px 16px" }}
          onClick={fetchMeetings}>
          Refresh
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
          { label: "Total Meetings", value: meetings.length, color: "var(--primary)" },
          { label: "Students",       value: new Set(meetings.map((m) => m.studentId)).size, color: "#0ea5e9" },
        ].map((s, i) => (
          <div key={i} style={{ flex: "0 0 160px" }}>
            <div className="card p-3 text-center stat-card">
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      {meetings.length > 0 && (
        <div style={{ marginBottom: 16, maxWidth: 320 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by title, student or tutor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        <div className="card p-0" style={{ overflow: "hidden" }}>
          {/* Table header */}
          <div className="row items-center" style={{
            background: "var(--gray-100)", padding: "10px 16px",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
          }}>
            <div style={{ width: 36 }}>#</div>
            <div style={{ flex: 3 }}>Meeting Title</div>
            <div style={{ flex: 3 }}>Student</div>
            <div style={{ flex: 2 }}>Tutor</div>
            <div style={{ flex: 1 }}>Start</div>
            <div style={{ flex: 1 }}>End</div>
            <div style={{ flex: 3 }}>Description</div>
          </div>

          {filtered.map((m, idx) => (
            <div key={m.meetingId || idx} className="row items-center" style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-color)",
              borderLeft: "4px solid var(--secondary)",
              background: "#fff",
            }}>
              <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>

              {/* Title */}
              <div style={{ flex: 3 }}>
                <p className="bold fs-p9">{m.meetingTitle || "—"}</p>
              </div>

              {/* Student */}
              <div style={{ flex: 3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "var(--primary)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.8rem",
                  }}>
                    {getStudentName(m).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="bold fs-p9">{getStudentName(m)}</p>
                    <p className="fs-p8 text-secondary">{getStudentDept(m)} · {getStudentEmail(m)}</p>
                  </div>
                </div>
              </div>

              {/* Tutor */}
              <div style={{ flex: 2 }}>
                <p className="fs-p9">{getTutorName(m)}</p>
              </div>

              {/* Times */}
              <div style={{ flex: 1 }}>
                <p className="fs-p9">{formatTime(m.startTime)}</p>
              </div>
              <div style={{ flex: 1 }}>
                <p className="fs-p9">{formatTime(m.endTime)}</p>
              </div>

              {/* Description */}
              <div style={{ flex: 3 }}>
                <p className="fs-p9 text-secondary">{m.meetingDescription || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompanyMeetings;