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

function StudentMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await axios.get(`${baseInteractions}/meetings`, getHeaders());
      const data = res.data?.data || res.data || [];
      console.log("Student meetings response:", res.data);
      console.log("Student meetings data:", data);
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

  const getTutorName   = (m) => m.tutorModel?.tutorName    || `Tutor #${m.tutorId || "—"}`;
  const getCompanyName = (m) => m.companyModel?.companyName || `Company #${m.companyId || "—"}`;

  if (loading) {
    return <div className="p-4"><p className="text-secondary">Loading meetings...</p></div>;
  }

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">My Meetings</h2>
          <p className="fs-p9 text-secondary">Meetings scheduled for you by your tutor</p>
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
        ].map((s, i) => (
          <div key={i} style={{ flex: "0 0 160px" }}>
            <div className="card p-3 text-center stat-card">
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards view */}
      {meetings.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mb-1">No meetings yet</p>
          <p className="fs-p9 text-secondary">Your tutor will schedule meetings for you.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {meetings.map((m, idx) => (
            <div key={m.meetingId || idx} className="card p-4"
              style={{ borderLeft: "4px solid var(--primary)" }}>

              <div className="row space-between items-center mb-3">
                <h4 className="bold">{m.meetingTitle || "Meeting"}</h4>
                <span style={{
                  fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: 10,
                  background: "rgba(50,85,99,0.1)", color: "var(--primary)",
                }}>
                  {formatTime(m.startTime)} — {formatTime(m.endTime)}
                </span>
              </div>

              {/* Details grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
                <div style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
                  <p className="fs-p8 text-secondary">Tutor</p>
                  <p className="bold fs-p9">{getTutorName(m)}</p>
                </div>
                <div style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
                  <p className="fs-p8 text-secondary">Company</p>
                  <p className="bold fs-p9">{getCompanyName(m)}</p>
                </div>
                <div style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
                  <p className="fs-p8 text-secondary">Duration</p>
                  <p className="bold fs-p9">{formatTime(m.startTime)} to {formatTime(m.endTime)}</p>
                </div>
              </div>

              {m.meetingDescription && (
                <div style={{
                  background: "rgba(50,85,99,0.04)", border: "1px solid rgba(50,85,99,0.12)",
                  borderRadius: 8, padding: "8px 12px",
                }}>
                  <p className="fs-p8 text-secondary" style={{ marginBottom: 2 }}>Description</p>
                  <p className="fs-p9">{m.meetingDescription}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentMeetings;