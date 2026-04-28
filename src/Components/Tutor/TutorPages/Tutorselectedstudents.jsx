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

const baseJob = rest.jobApplications.replace("/job-applications", "");

const getHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

const fmt = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

function TutorSelectedStudents() {
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [modal,    setModal]    = useState(null);   // selected row for detail modal
  const [mapModal, setMapModal] = useState(false);  // full map inside detail modal
  const [search,   setSearch]   = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true); setError("");
    try {
      const appsRes = await axios.get(rest.jobApplications, getHeaders());
      const apps    = appsRes.data?.data || appsRes.data || [];
      console.log("STEP 1 apps:", apps.length);

      const invArrays = await Promise.all(
        apps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res  = await axios.get(`${baseJob}/job-application/${appId}/interview`, getHeaders());
            const data = res.data?.data || res.data?.interviews || res.data;
            const list = Array.isArray(data) ? data : data ? [data] : [];
            return list
              .filter((i) => { const s = (i.status || "").toUpperCase(); return s === "SELECTED" || s === "OFFER_SENT"; })
              .map((i) => ({ ...i, _app: app }));
          } catch { return []; }
        })
      );

      const selectedInvs = invArrays.flat();
      console.log("STEP 2 selected:", selectedInvs.length);

      const placedRows = [];
      await Promise.all(
        selectedInvs.map(async (inv) => {
          const interviewId = inv.interviewId || inv.id;
          try {
            const res    = await axios.get(`${baseJob}/interview-schedule/${interviewId}/offer-letter`, getHeaders());
            const data   = res.data?.data || res.data;
            const status = (data?.status || "").toUpperCase();
            console.log(`Offer interview ${interviewId}:`, data?.status);

            if (status === "ACCEPTED") {
              const app     = inv._app || {};
              const suggest = app.jobSuggestionModel  || {};
              const jobPost = suggest.jobPostModel     || {};
              const company = jobPost.companyModel     || {};
              const resume  = app.resumeModel          || {};
              const student = resume.studentModel      || suggest.studentModel || {};

              placedRows.push({
                interviewId,
                offerLetterId: data.offerLetterId || data.id || null,
                offerFileName: data.offerLetter   || null,
                studentName:   student.name                            || "—",
                studentEmail:  student.email                           || "—",
                studentPhone:  student.phone                           || "—",
                rollNo:        student.rollNumber                      || "—",
                percentage:    student.percentage                      || "—",
                department:    student.departmentModel?.departmentName || "—",
                year:          student.year                            || "—",
                jobTitle:      jobPost.tiitle || jobPost.title         || "—",
                companyName:   company.companyName                     || "—",
                companyEmail:  company.email                           || "—",
                industry:      company.industryType                    || "—",
                location:      company.location                        || "—",
                website:       company.website                         || "—",
                latitude:      company.latitude                        || null,
                longitude:     company.longitude                       || null,
                offerDate:     data.date                               || null,
              });
            }
          } catch { /* no offer or not accepted */ }
        })
      );

      console.log("STEP 3 placed rows:", placedRows.length);
      setRows(placedRows);
    } catch (err) {
      console.error("fetchAll error:", err.response?.data || err.message);
      setError("Failed to load data.");
    } finally { setLoading(false); }
  };

  const openOfferLetter = async (row) => {
    if (!row.offerLetterId) { alert("Offer letter not available."); return; }
    try {
      const url = `${baseJob}/offer-letter/file/${row.offerLetterId}`;
      console.log("Fetching offer letter:", url);
      const res     = await fetch(url, { headers: { Authorization: `Bearer ${Cookies.get("token") || ""}` } });
      if (!res.ok)  { alert("Could not load offer letter."); return; }
      const blob    = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, "_blank");
      if (!win) {
        const a = document.createElement("a");
        a.href = blobUrl; a.download = row.offerFileName || "offer_letter.pdf"; a.click();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error("openOfferLetter error:", err);
      alert("Could not open offer letter.");
    }
  };

  const hasMap = (r) => r?.latitude && r?.longitude &&
    !isNaN(parseFloat(r.latitude)) && !isNaN(parseFloat(r.longitude));

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.studentName.toLowerCase().includes(q) ||
      r.rollNo.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.companyName.toLowerCase().includes(q);
  });

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Placed Students</h2>
          <p className="fs-p9 text-secondary">Students who accepted an offer letter</p>
        </div>
        <button onClick={fetchAll} style={{
          padding: "7px 16px", borderRadius: 8, border: "1px solid var(--border-color)",
          background: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
        }}>Refresh</button>
      </div>

      {error && <div className="alert-danger mb-3"><p className="text-danger fs-p9">{error}</p></div>}

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10 }}>
        {[
          { label: "Placed Students", value: rows.length,                                 color: "var(--success)" },
          { label: "Companies",       value: new Set(rows.map((r) => r.companyName)).size, color: "#0ea5e9"       },
          { label: "Departments",     value: new Set(rows.map((r) => r.department)).size,  color: "var(--warning)"},
        ].map((s, i) => (
          <div key={i} style={{ flex: "0 0 150px" }}>
            <div className="card p-3 text-center stat-card">
              <h2 className="bold" style={{ color: s.color }}>{loading ? "..." : s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      {rows.length > 0 && (
        <div style={{ maxWidth: 340, marginBottom: 14 }}>
          <input
            className="form-control"
            placeholder="Search name, roll no, dept, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card p-5 text-center"><p className="text-secondary">Loading...</p></div>
      ) : rows.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mb-1">No placed students yet</p>
          <p className="fs-p9 text-secondary">Students appear here once they accept an offer letter.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="fs-p9 text-secondary">No results match your search.</p>
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
            <div style={{ flex: 3 }}>Student</div>
            <div style={{ flex: 2 }}>Department</div>
            <div style={{ flex: 1, textAlign: "center" }}>Roll No</div>
            <div style={{ flex: 1, textAlign: "center" }}>%</div>
            <div style={{ flex: 2 }}>Company</div>
            <div style={{ flex: 2 }}>Job Title</div>
            <div style={{ flex: 2 }}>Offer Accepted</div>
            <div style={{ flex: 1, textAlign: "center" }}>Action</div>
          </div>

          {/* Rows */}
          {filtered.map((r, idx) => (
            <div key={r.interviewId || idx} className="row items-center" style={{
              padding: "11px 16px",
              borderBottom: "1px solid var(--border-color)",
              borderLeft: "4px solid var(--success)",
              background: "#fff",
            }}>
              <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>

              {/* Student */}
              <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: "var(--success)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.8rem",
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
              <div style={{ flex: 2 }} className="fs-p9">{fmt(r.offerDate)}</div>

              {/* View button */}
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
          ))}
        </div>
      )}

      {/* ══════════════════ DETAIL MODAL ══════════════════ */}
      {modal && (
        <div className="modal-overlay" onClick={() => { setModal(null); setMapModal(false); }}>
          <div
            className="card"
            style={{ width: 680, maxWidth: "96%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="row space-between items-center p-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <div className="row items-center" style={{ gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--success)", color: "#fff",
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
                  fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 10,
                  background: "rgba(22,163,74,0.1)", color: "var(--success)",
                }}>Placed</span>
              </div>
              <span
                className="cursor-pointer fs-4 text-secondary"
                onClick={() => { setModal(null); setMapModal(false); }}
              >x</span>
            </div>

            <div className="p-4" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Student details */}
              <div>
                <p className="fs-p8 text-secondary bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                    <div key={f.label} style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
                      <p className="fs-p8 text-secondary">{f.label}</p>
                      <p className="bold fs-p9">{f.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company details */}
              <div>
                <p className="fs-p8 text-secondary bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Company & Placement
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Company",      value: modal.companyName  },
                    { label: "Job Title",    value: modal.jobTitle     },
                    { label: "Industry",     value: modal.industry     },
                    { label: "Location",     value: modal.location     },
                    { label: "Company Email",value: modal.companyEmail },
                    { label: "Website",      value: modal.website      },
                    { label: "Offer Date",   value: fmt(modal.offerDate) },
                  ].map((f) => (
                    <div key={f.label} style={{ background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
                      <p className="fs-p8 text-secondary">{f.label}</p>
                      <p className="bold fs-p9">{f.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Offer letter + Map row */}
              <div className="row" style={{ gap: 10 }}>

                {/* Offer letter button */}
                <button
                  onClick={() => openOfferLetter(modal)}
                  disabled={!modal.offerLetterId}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 8,
                    background: modal.offerLetterId ? "var(--primary)" : "var(--gray-200)",
                    color: modal.offerLetterId ? "#fff" : "var(--text-secondary)",
                    border: "none", cursor: modal.offerLetterId ? "pointer" : "not-allowed",
                    fontWeight: 600, fontSize: "0.85rem",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <span style={{
                    background: modal.offerLetterId ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                    borderRadius: 4, padding: "1px 6px", fontSize: "0.7rem", fontWeight: 700,
                  }}>PDF</span>
                  {modal.offerLetterId ? "View Offer Letter" : "No Offer Letter"}
                </button>

                {/* Map button */}
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

              {/* Inline map — toggled */}
              {mapModal && hasMap(modal) && (
                <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                  <MapContainer
                    key={`detail-${modal.latitude}-${modal.longitude}`}
                    center={[parseFloat(modal.latitude), parseFloat(modal.longitude)]}
                    zoom={14}
                    style={{ height: 280, width: "100%" }}
                    scrollWheelZoom={true}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[parseFloat(modal.latitude), parseFloat(modal.longitude)]}>
                      <Popup>
                        <p style={{ fontWeight: 700 }}>{modal.companyName}</p>
                        <p style={{ fontSize: "0.78rem" }}>{modal.location}</p>
                        <p style={{ fontSize: "0.78rem", color: "#16a34a" }}>{modal.studentName} placed here</p>
                      </Popup>
                    </Marker>
                  </MapContainer>
                  <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
      )}

    </div>
  );
}

export default TutorSelectedStudents;