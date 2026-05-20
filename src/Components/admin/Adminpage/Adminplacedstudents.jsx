import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
const rest = require("../../../Rest");

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const baseJob  = rest.jobApplications.replace("/job-applications", "");
const BASE_URL = "http://localhost:2026";

const getHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

const fmt = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
};

const openFileWithAuth = async (filename, folder) => {
  if (!filename) { alert("File not available."); return; }
  const url = `${BASE_URL}/uploads/${folder}/${encodeURIComponent(filename)}`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${Cookies.get("token")}` },
    });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const blob    = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (e) {
    alert("Could not open file: " + e.message);
  }
};

function AdminPlacedStudents() {
  const [rows,           setRows]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [deptFilter,     setDeptFilter]     = useState("");
  const [modal,          setModal]          = useState(null);
  const [mapModal,       setMapModal]       = useState(false);
  // blockedIds = Set of studentIds that are already PLACED in the DB
  const [blockedIds,     setBlockedIds]     = useState(new Set());
  const [blocking,       setBlocking]       = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    setRows([]);

    try {
      const [offersRes, studentsRes] = await Promise.all([
        axios.get(`${baseJob}/offer-letters`, getHeaders()),
        axios.get(rest.students, getHeaders()),
      ]);

      const allOffers   = offersRes.data?.data   || offersRes.data   || [];
      const allStudents = studentsRes.data?.data  || studentsRes.data || [];
      const statusMap = {};
      (Array.isArray(allStudents) ? allStudents : []).forEach((s) => {
        if (s.studentId) statusMap[s.studentId] = (s.workingStatus || "").toUpperCase();
      });
      const alreadyBlocked = new Set(
        Object.entries(statusMap)
          .filter(([, status]) => status === "PLACED")
          .map(([id]) => Number(id))
      );
      setBlockedIds(alreadyBlocked);

      const placedRows = allOffers
        .filter((ol) => (ol.status || "").toLowerCase() === "accepted")
        .map((ol) => {
          const interview = ol.interviewModel             || {};
          const app       = interview.jobApplicationModel || {};
          const resume    = app.resumeModel               || {};
          const suggest   = app.jobSuggestionModel        || {};
          const jobPost   = suggest.jobPostModel          || {};
          const company   = jobPost.companyModel          || {};
          const student   = resume.studentModel || suggest.studentModel || {};

          const sid = student.studentId || null;

          return {
            offerLetterId: ol.offerLetterId || ol.id       || null,
            offerFileName: ol.offerLetter                  || null,
            interviewId:   interview.interviewId           || null,
            studentId:     sid,
            studentName:   student.name                    || "—",
            studentEmail:  student.email                   || "—",
            studentPhone:  student.phone                   || "—",
            rollNo:        student.rollNumber              || "—",
            percentage:    student.percentage              || "—",
            department:    student.departmentModel?.departmentName || "—",
            year:          student.year                    || "—",
            jobTitle:      jobPost.tiitle || jobPost.title || "—",
            companyName:   company.companyName             || "—",
            companyEmail:  company.email                   || "—",
            industry:      company.industryType            || "—",
            location:      company.location                || "—",
            website:       company.website                 || "—",
            latitude:      company.latitude                || null,
            longitude:     company.longitude               || null,
            offerDate:     ol.date                         || null,
          };
        });

      setRows(placedRows);
    } catch (err) {
      console.error("fetchAll error:", err.response?.data || err.message);
      setError("Failed to load placed student data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const blockStudent = async (studentId, studentName) => {
    if (!studentId) { alert("Student ID not found. Cannot block."); return; }
    if (!window.confirm(`Block ${studentName}?\n\nThis will mark them as PLACED and stop tutors from recommending new jobs to them.`)) return;

    setBlocking(true);
    try {
      await axios.patch(
        `${BASE_URL}/api/actors/students/${studentId}/block`,
        {},
        getHeaders()
      );

      // Update blocked set immediately — no need to reload the whole page
      setBlockedIds((prev) => new Set([...prev, Number(studentId)]));

      // Also update the modal so the button changes right away
      setModal((prev) => prev ? { ...prev, _blocked: true } : prev);

      alert(`${studentName} has been blocked successfully.\n\nTutors can no longer recommend new jobs to this student.`);
    } catch (err) {
      console.error("Block student error:", err);
      const msg = err.response?.data?.message || err.message || "Unknown error";
      alert(`Failed to block student.\n\nError: ${msg}\n\nPlease try again.`);
    } finally {
      setBlocking(false);
    }
  };

  const hasMap = (r) =>
    r?.latitude && r?.longitude &&
    !isNaN(parseFloat(r.latitude)) && !isNaN(parseFloat(r.longitude));

  const departments = [
    ...new Set(rows.map((r) => r.department).filter((d) => d !== "—")),
  ].sort();

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.studentName.toLowerCase().includes(q)  ||
      r.rollNo.toLowerCase().includes(q)        ||
      r.department.toLowerCase().includes(q)    ||
      r.companyName.toLowerCase().includes(q)   ||
      r.jobTitle.toLowerCase().includes(q)      ||
      r.studentEmail.toLowerCase().includes(q);
    const matchDept = !deptFilter || r.department === deptFilter;
    return matchSearch && matchDept;
  });

  const blockedCount = rows.filter((r) => r.studentId && blockedIds.has(Number(r.studentId))).length;

  const uniqueCompanies = new Set(
    rows.map((r) => r.companyName).filter((c) => c !== "—")
  ).size;
  const uniqueDepts = new Set(
    rows.map((r) => r.department).filter((d) => d !== "—")
  ).size;

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Placed Students</h2>
          <p className="fs-p9 text-secondary">
            Students who accepted an offer letter. Block them to stop tutors from recommending new jobs.
          </p>
        </div>
        <button
          onClick={fetchAll}
          style={{
            padding: "7px 16px", borderRadius: 8,
            border: "1px solid var(--border-color)",
            background: "#fff", cursor: "pointer",
            fontSize: "0.82rem", fontWeight: 600,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-3 mb-3" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p className="fs-p9" style={{ color: "var(--danger)" }}>{error}</p>
          <button className="btn btn-primary mt-2 w-auto" style={{ padding: "6px 18px" }} onClick={fetchAll}>
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10 }}>
        {[
          { label: "Placed Students", value: rows.length,     color: "var(--success)" },
          { label: "Blocked",         value: blockedCount,    color: "#dc2626"        },
          { label: "Companies",       value: uniqueCompanies, color: "#0ea5e9"        },
          { label: "Departments",     value: uniqueDepts,     color: "var(--warning)" },
        ].map((s, i) => (
          <div key={i} style={{ flex: "0 0 150px" }}>
            <div className="card p-3 text-center">
              <h2 className="bold" style={{ color: s.color }}>
                {loading ? "..." : s.value}
              </h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Department filter */}
      {!loading && rows.length > 0 && (
        <div className="row mb-3" style={{ gap: 10 }}>
          <input
            className="form-control"
            style={{ flex: 2 }}
            placeholder="Search name, roll no, dept, company, job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-control"
            style={{ flex: 1 }}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      {/* States */}
      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary">Loading placed students...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mb-1">No placed students yet</p>
          <p className="fs-p9 text-secondary">Students appear here once they accept an offer letter.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="fs-p9 text-secondary">No results match your search or filter.</p>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>

          {/* Table header */}
          <div
            className="row items-center"
            style={{
              background: "var(--gray-100)", padding: "10px 16px",
              borderBottom: "1px solid var(--border-color)",
              fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)",
            }}
          >
            <div style={{ width: 36 }}>#</div>
            <div style={{ flex: 3 }}>Student</div>
            <div style={{ flex: 2 }}>Department</div>
            <div style={{ flex: 1, textAlign: "center" }}>Roll No</div>
            <div style={{ flex: 1, textAlign: "center" }}>%</div>
            <div style={{ flex: 2 }}>Company</div>
            <div style={{ flex: 2 }}>Job Title</div>
            <div style={{ flex: 1, textAlign: "center" }}>Status</div>
            <div style={{ flex: 1, textAlign: "center" }}>Action</div>
          </div>

          {/* Table rows */}
          {filtered.map((r, idx) => {
            const isBlocked = r.studentId && blockedIds.has(Number(r.studentId));
            return (
              <div
                key={r.offerLetterId || idx}
                className="row items-center"
                style={{
                  padding: "11px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  borderLeft: `4px solid ${isBlocked ? "#dc2626" : "var(--success)"}`,
                  background: isBlocked ? "#fff9f9" : "#fff",
                }}
              >
                <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>

                <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: isBlocked ? "rgba(220,38,38,0.12)" : "rgba(22,163,74,0.15)",
                    color: isBlocked ? "#dc2626" : "#16a34a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.85rem",
                  }}>
                    {(r.studentName || "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="bold fs-p9">{r.studentName}</p>
                    <p className="fs-p8 text-secondary">{r.studentEmail}</p>
                  </div>
                </div>

                <div style={{ flex: 2 }} className="fs-p9">{r.department}</div>
                <div style={{ flex: 1, textAlign: "center" }} className="fs-p9">{r.rollNo}</div>
                <div style={{ flex: 1, textAlign: "center" }} className="fs-p9">
                  {r.percentage !== "—" ? `${r.percentage}%` : "—"}
                </div>

                <div style={{ flex: 2 }}>
                  <p className="bold fs-p9">{r.companyName}</p>
                  <p className="fs-p8 text-secondary">{r.location}</p>
                </div>

                <div style={{ flex: 2 }} className="fs-p9">{r.jobTitle}</div>

                <div style={{ flex: 1, textAlign: "center" }}>
                  {isBlocked ? (
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px",
                      borderRadius: 6, background: "rgba(220,38,38,0.1)", color: "#dc2626",
                    }}>
                      Blocked
                    </span>
                  ) : (
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px",
                      borderRadius: 6, background: "rgba(22,163,74,0.1)", color: "#16a34a",
                    }}>
                      Active
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, textAlign: "center" }}>
                  <button
                    onClick={() => { setModal(r); setMapModal(false); }}
                    className="btn btn-primary w-auto"
                    style={{ padding: "5px 14px", fontSize: "0.78rem" }}
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {modal && (() => {
        const isBlocked = (modal.studentId && blockedIds.has(Number(modal.studentId))) || modal._blocked;
        return (
          <div
            className="modal-overlay"
            onClick={() => { setModal(null); setMapModal(false); }}
          >
            <div
              className="card"
              style={{ width: 680, maxWidth: "96%", maxHeight: "92vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="row space-between items-center p-4"
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <div className="row items-center" style={{ gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: isBlocked ? "rgba(220,38,38,0.12)" : "rgba(22,163,74,0.15)",
                    color: isBlocked ? "#dc2626" : "#16a34a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "1rem",
                  }}>
                    {(modal.studentName || "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="bold">{modal.studentName}</p>
                    <p className="fs-p8 text-secondary">{modal.department} · {modal.rollNo}</p>
                  </div>
                  <span style={{
                    fontSize: "0.72rem", fontWeight: 600,
                    padding: "4px 12px", borderRadius: 10,
                    background: isBlocked ? "rgba(220,38,38,0.1)" : "rgba(22,163,74,0.1)",
                    color: isBlocked ? "#dc2626" : "#16a34a",
                  }}>
                    {isBlocked ? "Blocked" : "✓ Placed"}
                  </span>
                </div>
                <span
                  className="cursor-pointer fs-4 text-secondary"
                  onClick={() => { setModal(null); setMapModal(false); }}
                >
                  ×
                </span>
              </div>

              <div className="p-4" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Block / Already Blocked button */}
                {isBlocked ? (
                  <div style={{
                    padding: "12px 16px", borderRadius: 8,
                    background: "rgba(220,38,38,0.06)",
                    border: "1px solid rgba(220,38,38,0.2)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: "1rem" }}>🚫</span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#dc2626" }}>
                        Student is blocked
                      </p>
                      <p style={{ fontSize: "0.78rem", color: "#dc2626", opacity: 0.8 }}>
                        Tutors can no longer recommend new job posts to this student.
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => blockStudent(modal.studentId, modal.studentName)}
                    disabled={blocking}
                    style={{
                      width: "100%", padding: "12px", borderRadius: 8,
                      background: blocking ? "#e5e7eb" : "#dc2626",
                      color: blocking ? "#6b7280" : "#fff",
                      border: "none", cursor: blocking ? "not-allowed" : "pointer",
                      fontWeight: 600, fontSize: "0.85rem",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {blocking ? "Blocking..." : "🚫 Block Student — stop tutor recommendations"}
                  </button>
                )}

                {/* Student Info */}
                <div>
                  <p className="fs-p8 text-secondary bold mb-2"
                    style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Student Info
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Name",       value: modal.studentName  },
                      { label: "Email",      value: modal.studentEmail },
                      { label: "Phone",      value: modal.studentPhone },
                      { label: "Roll No",    value: modal.rollNo       },
                      { label: "Percentage", value: modal.percentage !== "—" ? `${modal.percentage}%` : "—" },
                      { label: "Year",       value: modal.year         },
                    ].map((f) => (
                      <div key={f.label}
                        style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
                        <p className="fs-p8 text-secondary">{f.label}</p>
                        <p className="bold fs-p9">{f.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Info */}
                <div>
                  <p className="fs-p8 text-secondary bold mb-2"
                    style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Company & Placement
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Company",       value: modal.companyName    },
                      { label: "Job Title",     value: modal.jobTitle       },
                      { label: "Industry",      value: modal.industry       },
                      { label: "Location",      value: modal.location       },
                      { label: "Company Email", value: modal.companyEmail   },
                      { label: "Website",       value: modal.website        },
                      { label: "Offer Date",    value: fmt(modal.offerDate) },
                    ].map((f) => (
                      <div key={f.label}
                        style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
                        <p className="fs-p8 text-secondary">{f.label}</p>
                        <p className="bold fs-p9">{f.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Offer Letter + Map buttons */}
                <div className="row" style={{ gap: 10 }}>
                  <button
                    onClick={() => openFileWithAuth(modal.offerFileName, "offer")}
                    disabled={!modal.offerFileName}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 8,
                      background: modal.offerFileName ? "var(--primary)" : "var(--gray-200)",
                      color: modal.offerFileName ? "#fff" : "var(--text-secondary)",
                      border: "none",
                      cursor: modal.offerFileName ? "pointer" : "not-allowed",
                      fontWeight: 600, fontSize: "0.85rem",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <span style={{
                      background: modal.offerFileName ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                      borderRadius: 4, padding: "1px 6px", fontSize: "0.7rem", fontWeight: 700,
                    }}>PDF</span>
                    {modal.offerFileName ? "View Offer Letter" : "No Offer Letter"}
                  </button>

                  {hasMap(modal) && (
                    <button
                      onClick={() => setMapModal((v) => !v)}
                      style={{
                        flex: 1, padding: "12px", borderRadius: 8,
                        background: mapModal ? "var(--secondary)" : "#fff",
                        color: mapModal ? "#fff" : "var(--primary)",
                        border: "1px solid var(--primary)",
                        cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                      }}
                    >
                      {mapModal ? "Hide Map" : "Show Location on Map"}
                    </button>
                  )}
                </div>

                {mapModal && hasMap(modal) && (
                  <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <MapContainer
                      key={`${modal.latitude}-${modal.longitude}`}
                      center={[parseFloat(modal.latitude), parseFloat(modal.longitude)]}
                      zoom={14} style={{ height: 280, width: "100%" }} scrollWheelZoom
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[parseFloat(modal.latitude), parseFloat(modal.longitude)]}>
                        <Popup>
                          <p style={{ fontWeight: 700 }}>{modal.companyName}</p>
                          <p style={{ fontSize: "0.78rem" }}>{modal.location}</p>
                          <p style={{ fontSize: "0.78rem", color: "#16a34a" }}>
                            {modal.studentName} placed here
                          </p>
                        </Popup>
                      </Marker>
                    </MapContainer>
                    <div style={{
                      padding: "8px 12px", borderTop: "1px solid var(--border-color)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <p className="fs-p8 text-secondary">
                        {parseFloat(modal.latitude).toFixed(5)}, {parseFloat(modal.longitude).toFixed(5)}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${modal.latitude},${modal.longitude}`}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: "0.78rem", color: "var(--info)", fontWeight: 600 }}
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

export default AdminPlacedStudents;