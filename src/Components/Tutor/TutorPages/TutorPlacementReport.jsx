import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

// GET /api/job/placement-report/{jobApplicationId} → { report: "filename.pdf", ... }
// File served at:  GET /uploads/report/{filename}  (via WebMvcConfig.java - no auth needed)

const baseJob = rest.jobApplications.replace("/job-applications", "");
const BASE_URL = "http://localhost:2026"; // static file base

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
  const [students,     setStudents]     = useState([]);
  const [suggestions,  setSuggestions]  = useState([]);
  const [allApps,      setAllApps]      = useState([]);
  const [reportMap,    setReportMap]    = useState({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [tutor,        setTutor]        = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search,       setSearch]       = useState("");
  const [viewStudent,  setViewStudent]  = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      setLoading(true); setError("");

      const tutorRes  = await axios.get(rest.tutor, getHeaders());
      const tutorList = tutorRes.data?.data || tutorRes.data || [];
      const t         = Array.isArray(tutorList) ? tutorList[0] : tutorList;
      setTutor(t);
      console.log("TUTOR:", t);

      const stuRes  = await axios.get(rest.students, getHeaders());
      const stuList = stuRes.data?.data || stuRes.data || [];
      setStudents(Array.isArray(stuList) ? stuList : []);
      console.log("STUDENTS:", stuList);

      const sugRes  = await axios.get(rest.jobSuggestions, getHeaders());
      const sugList = sugRes.data?.data || sugRes.data || [];
      setSuggestions(Array.isArray(sugList) ? sugList : []);
      console.log("SUGGESTIONS:", sugList);

      const appsRes = await axios.get(rest.jobApplications, getHeaders());
      const appList = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                    : Array.isArray(appsRes.data)        ? appsRes.data : [];
      setAllApps(appList);
      console.log("ALL APPS:", appList);

      const selectedApps = appList.filter((a) => a.status === "SELECTED");
      console.log("SELECTED APPS:", selectedApps);

      const rMap = {};
      await Promise.all(
        selectedApps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res = await axios.get(`${baseJob}/placement-report/${appId}`, getHeaders());
            console.log(`REPORT for app #${appId}:`, res.data);
            // res.data is PlacementReportModel directly (not wrapped in data:{})
            const r = res.data?.data || res.data;
            rMap[appId] = r?.report ? r : null; // only set if filename exists
          } catch (e) {
            console.warn(`No report for app #${appId}:`, e.response?.status);
            rMap[appId] = null;
          }
        })
      );

      console.log("REPORT MAP:", rMap);
      setReportMap(rMap);
    } catch (err) {
      console.error("init error:", err.response?.data || err.message);
      setError("Failed to load placement data.");
    } finally {
      setLoading(false);
    }
  };

  const getName  = (s) => s.name || s.studentName || "Student";
  const getEmail = (s) => s.userModel?.email || s.email || "—";
  const getDept  = (s) => s.departmentModel?.departmentName || "—";
  const getCgpa  = (s) => s.cgpa || s.marks || "—";
  const getSid   = (s) => String(s.studentId || s.id || "");

  const tutorDeptId = tutor?.departmentModel?.departmentId || tutor?.departmentId;
  const myStudents  = students.filter((s) => {
    if (!tutorDeptId) return true;
    const sd = s?.departmentModel?.departmentId || s?.departmentId;
    return String(sd) === String(tutorDeptId);
  });

  const getSelectedApps = (s) => {
    const sid = getSid(s);
    return allApps.filter((app) => {
      const appStudentId = String(
        app.jobSuggestionModel?.studentModel?.studentId ||
        app.jobSuggestionModel?.studentModel?.id || ""
      );
      return appStudentId === sid && app.status === "SELECTED";
    });
  };

  const hasUploadedReport = (s) =>
    getSelectedApps(s).some((app) => !!reportMap[app.jobApplicationId || app.id]);

  const wasAssigned = (s) => {
    const sid = getSid(s);
    return suggestions.some((sg) =>
      String(sg.studentModel?.studentId || sg.studentModel?.id || sg.studentId || "") === sid
    );
  };

  const getStatus = (s) => {
    if (hasUploadedReport(s))          return "Report Uploaded";
    if (getSelectedApps(s).length > 0) return "Selected (Pending Report)";
    if (wasAssigned(s))                return "Assigned";
    return "Not Assigned";
  };

  const statusCfg = {
    "Report Uploaded":          { bg: "rgba(22,163,74,0.1)",  color: "#16a34a" },
    "Selected (Pending Report)":{ bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
    "Assigned":                 { bg: "rgba(50,85,99,0.1)",   color: "#325563" },
    "Not Assigned":             { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  };

  const filtered = myStudents.filter((s) => {
    const matchStatus = !filterStatus || getStatus(s) === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || getName(s).toLowerCase().includes(q) || getEmail(s).toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const reportUploaded = myStudents.filter(hasUploadedReport).length;
  const selected       = myStudents.filter((s) => getSelectedApps(s).length > 0).length;
  const assigned       = myStudents.filter(wasAssigned).length;
  const placementRate  = myStudents.length ? Math.round((reportUploaded / myStudents.length) * 100) : 0;

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">Placement Report</h2>
      <p className="fs-p9 text-secondary mb-4">Overview of your students' placement status and uploaded reports</p>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Total Students",   value: myStudents.length,  color: "#325563" },
          { label: "Assigned to Jobs", value: assigned,           color: "#325563" },
          { label: "Selected",         value: selected,           color: "#0ea5e9" },
          { label: "Reports Uploaded", value: reportUploaded,     color: "#16a34a" },
          { label: "Placement Rate",   value: `${placementRate}%`,color: "#16a34a" },
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
          {reportUploaded} of {myStudents.length} students have uploaded placement reports
        </p>
      </div>

      {/* Filters */}
      <div className="row space-between items-center mb-3">
        <h4>Student List</h4>
        <div className="row" style={{ gap: 10 }}>
          <input type="text" className="form-control"
            placeholder="Search name or email..." style={{ width: 200 }}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="form-control" style={{ width: 200 }}
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Report Uploaded">Report Uploaded</option>
            <option value="Selected (Pending Report)">Selected (Pending Report)</option>
            <option value="Assigned">Assigned</option>
            <option value="Not Assigned">Not Assigned</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-2">
        {loading ? (
          <p className="text-center p-4">Loading students...</p>
        ) : error ? (
          <p className="p-4" style={{ color: "var(--danger)" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <div className="text-center p-5"><p className="bold mt-2">No students found</p></div>
        ) : (
          <table className="w-100">
            <thead>
              <tr>
                <th>#</th><th>Student</th><th>Email</th><th>Department</th>
                <th>CGPA</th><th>Status</th><th>Selected Jobs</th><th>Reports</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const status        = getStatus(s);
                const cfg           = statusCfg[status] || statusCfg["Not Assigned"];
                const selApps       = getSelectedApps(s);
                const uploadedCount = selApps.filter((app) => !!reportMap[app.jobApplicationId || app.id]).length;
                return (
                  <tr key={getSid(s) || i} className="hover-bg">
                    <td className="text-secondary fs-p9">{i + 1}</td>
                    <td>
                      <div className="row items-center" style={{ gap: 8 }}>
                        <div className="bg-primary text-white br-circle" style={{
                          width: 32, height: 32, display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontWeight: "bold", fontSize: "0.85rem", flexShrink: 0,
                        }}>
                          {getName(s).charAt(0).toUpperCase()}
                        </div>
                        <div className="bold fs-p9">{getName(s)}</div>
                      </div>
                    </td>
                    <td className="fs-p8 text-secondary">{getEmail(s)}</td>
                    <td className="fs-p9">{getDept(s)}</td>
                    <td className="bold fs-p9">{getCgpa(s)}</td>
                    <td><span className="status-item" style={{ background: cfg.bg, color: cfg.color }}>{status}</span></td>
                    <td className="text-center bold" style={{ color: "#325563" }}>{selApps.length || "—"}</td>
                    <td className="text-center">
                      {selApps.length > 0 ? (
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                          background: uploadedCount > 0 ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)",
                          color: uploadedCount > 0 ? "#16a34a" : "#f59e0b",
                        }}>{uploadedCount}/{selApps.length}</span>
                      ) : <span className="text-secondary fs-p9">—</span>}
                    </td>
                    <td>
                      {selApps.length > 0 ? (
                        <button className="btn btn-muted w-auto"
                          style={{ padding: "5px 14px", fontSize: "0.78rem" }}
                          onClick={() => setViewStudent(s)}>
                          View Reports
                        </button>
                      ) : <span className="text-secondary fs-p9">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* VIEW REPORTS MODAL */}
      {viewStudent && (() => {
        const selApps = getSelectedApps(viewStudent);
        return (
          <div className="modal-overlay" onClick={() => setViewStudent(null)}>
            <div className="card p-5"
              style={{ width: 600, maxWidth: "96%", maxHeight: "92vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="row space-between items-center mb-4">
                <div className="row items-center g-3">
                  <div className="bg-primary text-white br-circle" style={{
                    width: 44, height: 44, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontWeight: "bold", fontSize: "1.1rem", flexShrink: 0,
                  }}>
                    {getName(viewStudent).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="bold">{getName(viewStudent)}</h3>
                    <p className="fs-p9 text-secondary">{getEmail(viewStudent)} · {getDept(viewStudent)}</p>
                  </div>
                </div>
                <span className="cursor-pointer fs-4 text-secondary" onClick={() => setViewStudent(null)}>x</span>
              </div>

              <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)", marginBottom: 12 }}>
                Placement Reports
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {selApps.map((app) => {
                  const appId    = app.jobApplicationId || app.id;
                  const report   = reportMap[appId];
                  const company  = app.jobSuggestionModel?.jobPostModel?.companyModel?.companyName || "—";
                  const jobTitle = app.jobSuggestionModel?.jobPostModel?.tiitle
                                || app.jobSuggestionModel?.jobPostModel?.title || "—";
                  return (
                    <div key={appId} style={{
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
        );
      })()}
    </div>
  );
}

export default TutorPlacementReport;