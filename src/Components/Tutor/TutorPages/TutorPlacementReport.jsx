import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const baseJob = rest.jobApplications.replace("/job-applications", "");
const BASE_URL = "http://localhost:2026";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${Cookies.get("token")}`,
    "Content-Type": "application/json",
  },
});

const openFile = (filename, folder) => {
  if (!filename) { alert("File not available."); return; }
  const url = `${BASE_URL}/uploads/${folder}/${encodeURIComponent(filename)}`;
  console.log("Opening file:", url);
  window.open(url, "_blank");
};

function TutorPlacementReport() {
  const [groupedRows,  setGroupedRows]  = useState([]); // [{ student, appRows: [{app, report}] }]
  const [allStudents,  setAllStudents]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search,       setSearch]       = useState("");
  const [viewStudent,  setViewStudent]  = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      setLoading(true); setError("");

      const stuRes   = await axios.get(rest.students, getHeaders());
      const stuList  = stuRes.data?.data || stuRes.data || [];
      const students = Array.isArray(stuList) ? stuList : [];
      setAllStudents(students);

      const appsRes  = await axios.get(rest.jobApplications, getHeaders());
      const appList  = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                     : Array.isArray(appsRes.data)        ? appsRes.data : [];

      const selectedApps = appList.filter((a) => a.status === "SELECTED");
      console.log("SELECTED APPS:", selectedApps.length);

      // Fetch report for each selected app
      const appRows = await Promise.all(
        selectedApps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res  = await axios.get(`${baseJob}/placement-report/${appId}`, getHeaders());
            const raw  = res.data?.data || res.data;
            const r    = Array.isArray(raw) ? raw[raw.length - 1] : raw;
            return { app, report: (r && r.report) ? r : null };
          } catch {
            return { app, report: null };
          }
        })
      );

      console.log("APP ROWS:", appRows);

      // Group appRows by student email
      // Priority: use jobSuggestionModel.studentModel.email to identify student
      const emailMap = {}; // email → { student, appRows }

      // Seed with students list
      students.forEach((s) => {
        const email = (s.email || "").toLowerCase();
        if (email) emailMap[email] = { student: s, appRows: [] };
      });

      // Attach each appRow to correct student bucket
      appRows.forEach((row) => {
        const appStu  = row.app.jobSuggestionModel?.studentModel || {};
        const repStu  = row.report?.studentModel || {};

        // Try to get email from app's studentModel first, then report's studentModel
        const email = (appStu.email || repStu.email || "").toLowerCase();

        if (!email) return;

        if (!emailMap[email]) {
          // Student not in students list — create from available data
          emailMap[email] = {
            student: Object.keys(appStu).length > Object.keys(repStu).length ? appStu : repStu,
            appRows: [],
          };
        }
        emailMap[email].appRows.push(row);
      });

      // Only keep students with at least one selected app
      const result = Object.values(emailMap).filter((g) => g.appRows.length > 0);
      console.log("GROUPED ROWS:", result);
      setGroupedRows(result);

    } catch (err) {
      console.error("init error:", err.response?.data || err.message);
      setError("Failed to load placement data.");
    } finally {
      setLoading(false);
    }
  };

  const getName  = (s) => s?.name || s?.studentName || "Student";
  const getEmail = (s) => s?.email || s?.userModel?.email || "—";
  const getDept  = (s) => s?.departmentModel?.departmentName || "—";

  const hasReport   = (g) => g.appRows.some((r) => !!r.report);
  const getStatus   = (g) => hasReport(g) ? "Report Uploaded" : "Selected (Pending Report)";

  const statusCfg = {
    "Report Uploaded":           { bg: "rgba(22,163,74,0.1)",  color: "#16a34a" },
    "Selected (Pending Report)": { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
  };

  const reportUploadedCount = groupedRows.filter(hasReport).length;
  const placementRate = groupedRows.length
    ? Math.round((reportUploadedCount / groupedRows.length) * 100) : 0;

  const filtered = groupedRows.filter((g) => {
    const matchStatus = !filterStatus || getStatus(g) === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q
      || getName(g.student).toLowerCase().includes(q)
      || getEmail(g.student).toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>
      <h2 className="fs-5 bold mb-1">Placement Report</h2>
      <p className="fs-p9 text-secondary mb-4">Students who have been selected and their uploaded reports</p>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Total Students",   value: allStudents.length,  color: "#325563" },
          { label: "Selected",         value: groupedRows.length,  color: "#0ea5e9" },
          { label: "Reports Uploaded", value: reportUploadedCount, color: "#16a34a" },
          { label: "Placement Rate",   value: `${placementRate}%`, color: "#16a34a" },
        ].map((s, i) => (
          <div className="col p-2" key={i}>
            <div className="card p-4 text-center">
              <h2 className="bold" style={{ color: s.color }}>{loading ? "…" : s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-4 mb-4" style={{ background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)", border: "none" }}>
        <div className="row space-between items-center mb-2">
          <h4>Overall Placement Rate</h4>
          <span className="bold" style={{ color: "#325563", fontSize: "1.2rem" }}>{placementRate}%</span>
        </div>
        <div style={{ height: 12, background: "#e5e7eb", borderRadius: 6 }}>
          <div style={{
            width: `${placementRate}%`, height: 12,
            background: "linear-gradient(90deg, #325563, #4A788C)",
            borderRadius: 6, transition: "width 0.5s",
          }} />
        </div>
        <p className="fs-p8 text-secondary mt-2">
          {reportUploadedCount} of {groupedRows.length} selected students have uploaded placement reports
        </p>
      </div>

      {/* Filters */}
      <div className="row space-between items-center mb-3">
        <h4>Selected Students</h4>
        <div className="row" style={{ gap: 10 }}>
          <input type="text" className="form-control"
            placeholder="Search name or email..." style={{ width: 200 }}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="form-control" style={{ width: 200 }}
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Report Uploaded">Report Uploaded</option>
            <option value="Selected (Pending Report)">Selected (Pending Report)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-2">
        {loading ? (
          <p className="text-center p-4">Loading...</p>
        ) : error ? (
          <p className="p-4" style={{ color: "var(--danger)" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <div className="text-center p-5">
            <p className="bold mt-2">No selected students found</p>
            <p className="fs-p9 text-secondary mt-1">
              Students appear here once they are marked as Selected in an interview.
            </p>
          </div>
        ) : (
          <table className="w-100">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Reports</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => {
                const status        = getStatus(g);
                const cfg           = statusCfg[status];
                const uploadedCount = g.appRows.filter((r) => !!r.report).length;
                return (
                  <tr key={getEmail(g.student) + i} className="hover-bg">
                    <td className="text-secondary fs-p9">{i + 1}</td>
                    <td>
                      <div className="row items-center" style={{ gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: "var(--primary)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: "bold", fontSize: "0.85rem",
                        }}>
                          {getName(g.student).charAt(0).toUpperCase()}
                        </div>
                        <div className="bold fs-p9">{getName(g.student)}</div>
                      </div>
                    </td>
                    <td className="fs-p8 text-secondary">{getEmail(g.student)}</td>
                    <td className="fs-p9">{getDept(g.student)}</td>
                    <td>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                        background: cfg.bg, color: cfg.color,
                      }}>{status}</span>
                    </td>
                    <td className="text-center">
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                        background: uploadedCount > 0 ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)",
                        color: uploadedCount > 0 ? "#16a34a" : "#f59e0b",
                      }}>
                        {uploadedCount}/{g.appRows.length}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-muted w-auto"
                        style={{ padding: "5px 14px", fontSize: "0.78rem" }}
                        onClick={() => setViewStudent(g)}>
                        View Reports
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* VIEW REPORTS MODAL */}
      {viewStudent && (
        <div className="modal-overlay" onClick={() => setViewStudent(null)}>
          <div className="card p-5"
            style={{ width: 620, maxWidth: "96%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="row space-between items-center mb-4">
              <div className="row items-center" style={{ gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "var(--primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "bold", fontSize: "1.1rem",
                }}>
                  {getName(viewStudent.student).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="bold">{getName(viewStudent.student)}</h3>
                  <p className="fs-p9 text-secondary">
                    {getEmail(viewStudent.student)} · {getDept(viewStudent.student)}
                  </p>
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setViewStudent(null)}>✕</span>
            </div>

            <p style={{
              fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "var(--primary)", marginBottom: 12,
            }}>
              Placement Reports ({viewStudent.appRows.length} selected job{viewStudent.appRows.length !== 1 ? "s" : ""})
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {viewStudent.appRows.map(({ app, report }, idx) => {
                const appId    = app.jobApplicationId || app.id;
                const company  = app.jobSuggestionModel?.jobPostModel?.companyModel?.companyName || "—";
                const jobTitle = app.jobSuggestionModel?.jobPostModel?.tiitle
                              || app.jobSuggestionModel?.jobPostModel?.title || "—";
                return (
                  <div key={appId || idx} style={{
                    border: "1px solid var(--border-color)", borderRadius: 10, padding: "14px 16px",
                    borderLeft: `4px solid ${report ? "#16a34a" : "#f59e0b"}`,
                  }}>
                    <div className="row space-between items-center mb-2">
                      <div>
                        <p className="bold fs-p9">{company}</p>
                        <p className="fs-p8 text-secondary">{jobTitle}</p>
                      </div>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: 10,
                        background: report ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)",
                        color: report ? "#16a34a" : "#f59e0b",
                      }}>{report ? "Uploaded" : "Pending"}</span>
                    </div>
                    <p className="fs-p8 text-secondary">Application ID: #{appId}</p>

                    {report ? (
                      <div style={{
                        background: "rgba(22,163,74,0.05)", borderRadius: 8,
                        padding: "10px 12px", marginTop: 10,
                        border: "1px solid rgba(22,163,74,0.2)",
                      }}>
                        <p className="fs-p8 text-secondary mb-1">File: {report.report}</p>
                        <p className="fs-p8 text-secondary">Report ID: #{report.placementReportId}</p>
                        <button
                          onClick={() => openFile(report.report, "report")}
                          style={{
                            marginTop: 8, padding: "6px 16px", borderRadius: 6,
                            background: "var(--primary)", color: "#fff",
                            border: "none", cursor: "pointer",
                            fontSize: "0.8rem", fontWeight: 600,
                          }}>
                          View Report File
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        background: "rgba(245,158,11,0.05)", borderRadius: 8,
                        padding: "10px 12px", marginTop: 10,
                        border: "1px solid rgba(245,158,11,0.2)",
                      }}>
                        <p className="fs-p9" style={{ color: "#f59e0b" }}>
                          Student has not uploaded a placement report yet.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button className="btn btn-muted mt-4" onClick={() => setViewStudent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorPlacementReport;