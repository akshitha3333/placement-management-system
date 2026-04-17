import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function TutorPlacementReport() {
  const [students,     setStudents]     = useState([]);
  const [suggestions,  setSuggestions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search,       setSearch]       = useState("");
  const [tutor,        setTutor]        = useState(null);

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${Cookies.get("token")}`,
    },
  };

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Tutor profile
        const tutorRes  = await axios.get(rest.tutor, header);
        const tutorList = tutorRes.data?.data || tutorRes.data || [];
        const t         = Array.isArray(tutorList) ? tutorList[0] : tutorList;
        setTutor(t);

        // 2. All students
        const stuRes  = await axios.get(rest.students, header);
        const stuList = stuRes.data?.data || stuRes.data || [];
        setStudents(Array.isArray(stuList) ? stuList : []);

        // 3. All job suggestions (to know who was assigned)
        const sugRes  = await axios.get(rest.jobSuggestions, header);
        const sugList = sugRes.data?.data || sugRes.data || [];
        setSuggestions(Array.isArray(sugList) ? sugList : []);
      } catch (err) {
        console.error("TutorPlacementReport init:", err);
        setError("Failed to load placement data.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Helpers ────────────────────────────────────────────
  const getName  = (s) => s.name || s.studentName || "Student";
  const getEmail = (s) => s.userModel?.email || s.email || "—";
  const getDept  = (s) => s.departmentModel?.departmentName || "—";
  const getCgpa  = (s) => s.cgpa || s.marks || "—";

  // Which students have been assigned at least one job?
  const assignedStudentIds = new Set(
    suggestions.map((sg) => {
      const sm = sg.studentModel;
      return String(sm?.studentId || sm?.id || sg.studentId || "");
    })
  );

  const getPlacementStatus = (s) => {
    const sid = String(s.studentId || s.id || "");
    if (assignedStudentIds.has(sid)) return "Assigned";
    return "Not Assigned";
  };

  // Filter students to tutor's department
  const tutorDeptId = tutor?.departmentModel?.departmentId || tutor?.departmentId;
  const myStudents  = students.filter((s) => {
    if (!tutorDeptId) return true;
    const sd = s?.departmentModel?.departmentId || s?.departmentId;
    return String(sd) === String(tutorDeptId);
  });

  const assigned    = myStudents.filter((s) => getPlacementStatus(s) === "Assigned");
  const notAssigned = myStudents.filter((s) => getPlacementStatus(s) === "Not Assigned");

  const filtered = myStudents.filter((s) => {
    const matchStatus =
      !filterStatus ||
      (filterStatus === "Assigned"     && getPlacementStatus(s) === "Assigned") ||
      (filterStatus === "Not Assigned" && getPlacementStatus(s) === "Not Assigned");

    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      getName(s).toLowerCase().includes(q) ||
      getEmail(s).toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const placementRate = myStudents.length
    ? Math.round((assigned.length / myStudents.length) * 100)
    : 0;

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">Placement Report</h2>
      <p className="fs-p9 text-secondary mb-4">
        Overview of your students' placement status
      </p>

      {/* ── Stats ── */}
      <div className="row mb-4">
        {[
          { label: "Total Students",  value: myStudents.length,   color: "#325563" },
          { label: "Assigned to Jobs",value: assigned.length,     color: "#16a34a" },
          { label: "Not Assigned",    value: notAssigned.length,  color: "#f59e0b" },
          { label: "Placement Rate",  value: `${placementRate}%`, color: "#0ea5e9" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4 stat-card text-center">
              <h2 className="bold" style={{ color: s.color }}>
                {loading ? "…" : s.value}
              </h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress Bar ── */}
      <div className="card p-4 mb-4" style={{ background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)", border: "none" }}>
        <div className="row space-between items-center mb-2">
          <h4>📈 Overall Placement Rate</h4>
          <span className="bold" style={{ color: "#325563", fontSize: "1.2rem" }}>
            {placementRate}%
          </span>
        </div>
        <div style={{ height: "12px", background: "#e5e7eb", borderRadius: "6px" }}>
          <div
            style={{
              width:        `${placementRate}%`,
              height:       "12px",
              background:   "linear-gradient(90deg, #325563, #4A788C)",
              borderRadius: "6px",
              transition:   "width 0.5s",
            }}
          />
        </div>
        <p className="fs-p8 text-secondary mt-2">
          {assigned.length} of {myStudents.length} students assigned to job opportunities
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="row space-between items-center mb-3">
        <h4>👥 Student List</h4>
        <div className="row" style={{ gap: "10px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search name or email..."
            style={{ width: "200px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-control"
            style={{ width: "160px" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Assigned">Assigned</option>
            <option value="Not Assigned">Not Assigned</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card p-2">
        {loading ? (
          <p className="text-center p-4">Loading students...</p>
        ) : error ? (
          <p className="p-4 text-danger">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="text-center p-5">
            <p style={{ fontSize: "2.5rem" }}>🔍</p>
            <p className="bold mt-2">No students found</p>
          </div>
        ) : (
          <table className="w-100">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Email</th>
                <th>Department</th>
                <th>CGPA / Marks</th>
                <th>Status</th>
                <th>Jobs Assigned</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const sid     = String(s.studentId || s.id || "");
                const status  = getPlacementStatus(s);
                const jobsAssigned = suggestions.filter((sg) => {
                  const sm = sg.studentModel;
                  return String(sm?.studentId || sm?.id || sg.studentId || "") === sid;
                }).length;

                return (
                  <tr key={s.studentId || i} className="hover-bg">
                    <td className="text-secondary fs-p9">{i + 1}</td>
                    <td>
                      <div className="row items-center" style={{ gap: "8px" }}>
                        <div
                          className="bg-primary text-white br-circle"
                          style={{
                            width:          "32px",
                            height:         "32px",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            fontWeight:     "bold",
                            fontSize:       "0.85rem",
                            flexShrink:     0,
                          }}
                        >
                          {getName(s).charAt(0).toUpperCase()}
                        </div>
                        <div className="bold fs-p9">{getName(s)}</div>
                      </div>
                    </td>
                    <td className="fs-p8 text-secondary">{getEmail(s)}</td>
                    <td>{getDept(s)}</td>
                    <td className="bold">{getCgpa(s)}</td>
                    <td>
                      <span
                        className="status-item"
                        style={{
                          background: status === "Assigned"
                            ? "rgba(22,163,74,0.1)"
                            : "rgba(245,158,11,0.1)",
                          color:      status === "Assigned" ? "#16a34a" : "#f59e0b",
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="text-center bold" style={{ color: "#325563" }}>
                      {jobsAssigned || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TutorPlacementReport;