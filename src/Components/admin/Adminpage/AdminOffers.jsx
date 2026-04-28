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
// baseJob = http://localhost:2026/api/job

const STATUS_CFG = {
  Pending:  { label: "Awaiting Response", bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9" },
  Accepted: { label: "Accepted",          bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
  Rejected: { label: "Rejected",          bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
};

function AdminOffers() {
  const [rows,        setRows]        = useState([]); // flat list: { inv, offer, student, company, jobTitle }
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search,      setSearch]      = useState("");

  useEffect(() => { fetchAll(); }, []);

  // ── Main fetch chain ──────────────────────────────────────────────────────
  // Admin sees everything so we use the same /job-applications endpoint
  // which returns ALL applications when called with an ADMINISTRATOR token.
  // Then we walk: applications → interviews (Selected/OFFER_SENT) → offer letters
  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      // Step 1: all job applications — backend now returns ALL for ADMINISTRATOR role
      console.log("STEP 1 fetching:", rest.jobApplications);
      const appsRes = await axios.get(rest.jobApplications, getHeaders());
      console.log("STEP 1 raw:", appsRes.data);
      const apps = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                 : Array.isArray(appsRes.data)        ? appsRes.data : [];
      console.log("STEP 1 apps count:", apps.length, apps);
      if (apps.length === 0) {
        console.warn("STEP 1 WARNING: 0 apps. Make sure JobService.java has ADMINISTRATOR case and backend is restarted.");
      }

      // Step 2: for each app get interviews — keep Selected / OFFER_SENT
      console.log("STEP 2 fetching interviews for", apps.length, "apps");
      const invArrays = await Promise.all(
        apps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res  = await axios.get(`${baseJob}/job-application/${appId}/interview`, getHeaders());
            const data = res.data?.data || res.data;
            const list = Array.isArray(data) ? data : data ? [data] : [];
            console.log("STEP 2 app", appId, "interviews:", list.length, "statuses:", list.map(i => i.status));
            return list
              .filter((i) => { const s = (i.status || "").toLowerCase(); return s === "selected" || s === "offer_sent"; })
              .map((i) => ({ ...i, _app: app }));
          } catch (e) {
            console.warn("STEP 2 app", appId, "failed:", e.response?.status);
            return [];
          }
        })
      );

      const selectedInvs = invArrays.flat();
      console.log("STEP 2 selected interviews:", selectedInvs.length, selectedInvs);

      // Step 3: fetch offer letter for each selected interview
      const rowResults = await Promise.all(
        selectedInvs.map(async (inv) => {
          const interviewId = inv.interviewId || inv.id;
          let offer = { sent: false, offerLetterId: null, status: null, date: null };
          try {
            const res  = await axios.get(`${baseJob}/interview-schedule/${interviewId}/offer-letter`, getHeaders());
            const data = res.data?.data || res.data;
            console.log(`Offer for interview ${interviewId}:`, data);
            if (data && (data.offerLetterId || data.id)) {
              offer = {
                sent:          true,
                offerLetterId: data.offerLetterId || data.id,
                status:        data.status || "Pending",
                date:          data.date   || null,
              };
            }
          } catch { /* no offer yet */ }

          // Extract student, company, job info from nested objects
          const app        = inv._app || inv.jobApplicationModel || {};
          const suggest    = app.jobSuggestionModel || inv.jobApplicationModel?.jobSuggestionModel || {};
          const jobPost    = suggest.jobPostModel    || {};
          const company    = jobPost.companyModel    || {};
          const resume     = app.resumeModel         || {};
          const student    = resume.studentModel     || suggest.studentModel || {};

          return {
            interviewId,
            inv,
            offer,
            studentName:  student.name                              || "—",
            studentEmail: student.email                             || "—",
            studentPhone: student.phone                             || "—",
            rollNo:       student.rollNumber                        || "—",
            percentage:   student.percentage                        || "—",
            department:   student.departmentModel?.departmentName   || "—",
            companyName:  company.companyName                       || "—",
            companyEmail: company.email                             || "—",
            industry:     company.industryType                      || "—",
            jobTitle:     jobPost.tiitle || jobPost.title           || "—",
            appliedOn:    app.appliedOn                             || "—",
          };
        })
      );

      console.log("Final rows:", rowResults.length, rowResults);
      setRows(rowResults);
    } catch (err) {
      console.error("fetchAll error:", err.response?.data || err.message);
      setError("Failed to load offer data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const matchStatus = filterStatus === "ALL"
      || (filterStatus === "NOT_SENT" && !r.offer.sent)
      || r.offer.status === filterStatus;

    const q = search.toLowerCase();
    const matchSearch = !q
      || r.studentName.toLowerCase().includes(q)
      || r.studentEmail.toLowerCase().includes(q)
      || r.companyName.toLowerCase().includes(q)
      || r.jobTitle.toLowerCase().includes(q)
      || r.department.toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const totalSent     = rows.filter((r) => r.offer.sent).length;
  const totalAccepted = rows.filter((r) => r.offer.status === "Accepted").length;
  const totalPending  = rows.filter((r) => r.offer.status === "Pending").length;
  const totalRejected = rows.filter((r) => r.offer.status === "Rejected").length;
  const totalNotSent  = rows.filter((r) => !r.offer.sent).length;

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Offer Letters</h2>
          <p className="fs-p9 text-secondary">All offer letters across every company and student</p>
        </div>
        <button
          onClick={fetchAll}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)",
            background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
          }}
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Total Selected", value: rows.length,    color: "var(--primary)" },
          { label: "Offers Sent",    value: totalSent,      color: "#0ea5e9"        },
          { label: "Accepted",       value: totalAccepted,  color: "#16a34a"        },
          { label: "Pending",        value: totalPending,   color: "#f59e0b"        },
          { label: "Rejected",       value: totalRejected,  color: "#dc2626"        },
          { label: "Not Sent Yet",   value: totalNotSent,   color: "var(--gray-500)"},
        ].map((s, i) => (
          <div key={i} style={{ flex: "1 1 120px" }}>
            <div className="card p-3 text-center stat-card">
              <h2 className="bold" style={{ color: s.color }}>{loading ? "..." : s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="row mb-3" style={{ gap: 10 }}>
        <div style={{ flex: 2 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by student, company, job title, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Accepted">Accepted</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="NOT_SENT">Not Sent Yet</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary">Loading all offer letters...</p>
        </div>
      ) : error ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button className="btn btn-primary mt-3 w-auto" style={{ padding: "8px 20px" }} onClick={fetchAll}>
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No selected students yet</p>
          <p className="fs-p9 text-secondary mt-1">
            Students appear here once a company marks them as Selected in an interview.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="fs-p9 text-secondary">No results match your search or filter.</p>
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
            <div style={{ flex: 2 }}>Company</div>
            <div style={{ flex: 2 }}>Job Title</div>
            <div style={{ flex: 2 }}>Contact</div>
            <div style={{ flex: 2 }}>Offer Sent On</div>
            <div style={{ flex: 2, textAlign: "center" }}>Status</div>
          </div>

          {/* Rows */}
          {filtered.map((r, idx) => {
            const statusCfg  = STATUS_CFG[r.offer.status] || null;
            const borderColor = r.offer.status === "Accepted" ? "#16a34a"
                              : r.offer.status === "Rejected" ? "#dc2626"
                              : r.offer.status === "Pending"  ? "#0ea5e9"
                              : "transparent";

            return (
              <div
                key={r.interviewId || idx}
                className="row items-center"
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  borderLeft: `4px solid ${borderColor}`,
                  background: "#fff",
                }}
              >
                <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>

                {/* Student */}
                <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "var(--primary)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.9rem",
                  }}>
                    {(r.studentName || "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="bold fs-p9">{r.studentName}</p>
                    <p className="fs-p8 text-secondary">{r.rollNo}</p>
                    <p className="fs-p8 text-secondary">{r.percentage}%</p>
                  </div>
                </div>

                {/* Department */}
                <div style={{ flex: 2 }}>
                  <p className="fs-p9">{r.department}</p>
                </div>

                {/* Company */}
                <div style={{ flex: 2 }}>
                  <p className="bold fs-p9">{r.companyName}</p>
                  <p className="fs-p8 text-secondary">{r.industry}</p>
                </div>

                {/* Job Title */}
                <div style={{ flex: 2 }}>
                  <p className="fs-p9">{r.jobTitle}</p>
                </div>

                {/* Contact */}
                <div style={{ flex: 2 }}>
                  <p className="fs-p9">{r.studentEmail}</p>
                  <p className="fs-p8 text-secondary">{r.studentPhone}</p>
                </div>

                {/* Sent On */}
                <div style={{ flex: 2 }}>
                  <p className="fs-p9">
                    {r.offer.sent ? formatDate(r.offer.date) || "Sent" : "—"}
                  </p>
                </div>

                {/* Status */}
                <div style={{ flex: 2, textAlign: "center" }}>
                  {r.offer.sent && statusCfg ? (
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600,
                      padding: "4px 10px", borderRadius: 10,
                      background: statusCfg.bg, color: statusCfg.color,
                    }}>
                      {statusCfg.label}
                    </span>
                  ) : r.offer.sent ? (
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600,
                      padding: "4px 10px", borderRadius: 10,
                      background: "rgba(14,165,233,0.1)", color: "#0ea5e9",
                    }}>
                      Awaiting Response
                    </span>
                  ) : (
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600,
                      padding: "4px 10px", borderRadius: 10,
                      background: "rgba(107,114,128,0.08)", color: "#6b7280",
                    }}>
                      Not Sent
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminOffers;