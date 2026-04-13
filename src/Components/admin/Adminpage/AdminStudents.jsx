import React, { useEffect, useState } from "react";
import axios from "axios";
import rest from "../../../Rest";
import Cookies from "js-cookie";

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState("");

  const header = {
    headers: {
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  };

  // ✅ Fetch students — unchanged
  const fetchStudents = async () => {
    try {
      const res = await axios.get(rest.students, header);
      console.log(res.data)
      setStudents(res.data.data || []);
    } catch (err) {
      console.log("Error fetching students:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Search filter (UI only — no logic change)
  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.departmentModel?.departmentName?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const total   = students.length;
  const placed  = students.filter((s) => s.workingStatus === "Placed").length;
  const unplaced = total - placed;

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* ── Page Header ── */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">👨‍🎓 Student Management</h2>
          <p className="fs-p9 text-secondary">View and manage all registered students</p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Students", value: total,   icon: "👨‍🎓", color: "var(--primary)" },
          { label: "Placed",         value: placed,  icon: "✅",   color: "var(--success)" },
          { label: "Unplaced",       value: unplaced,icon: "⏳",   color: "var(--warning)" },  
        ].map((s, i) => (
          <div className="col-4 p-2" key={i}>
            <div className="card p-3 stat-card row items-center g-3">
              <div className="fs-4">{s.icon}</div>
              <div>
                <p className="fs-p8 text-secondary">{s.label}</p>
                <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="w-40 mb-3">
        <input
          type="text"
          placeholder="🔍  Search by name, email or department..."
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
      <div className="card p-0" style={{ overflow: "hidden" }}>
        <table className="w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Department</th>
              <th>CGPA</th>
              <th>Roll No</th>
              <th>Placement</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-5">
                  <p className="fs-4">📭</p>
                  <p className="bold mt-1">No students found</p>
                  <p className="fs-p8 text-secondary">Try a different search term</p>
                </td>
              </tr>
            ) : (
              filtered.map((student, idx) => {
                const isPlaced = student.workingStatus === "Placed";
                return (
                  <tr key={student.id} className="hover-bg">

                    {/* Index */}
                    <td className="fs-p9 text-secondary">{idx + 1}</td>

                    {/* Name + Email */}
                    <td>
                      <div className="row items-center g-2">
                        {/* Avatar */}
                        <div
                          className="bg-primary text-white br-circle bold"
                          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}
                        >
                          {student.name?.charAt(0) || "S"}
                        </div>
                        <div>
                          <p className="bold fs-p9">{student.name}</p>
                          <p className="fs-p8 text-secondary">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td>
                      <span className="fs-p9 br-md p-1"
                        style={{ background: "rgba(50,85,99,0.08)", color: "var(--primary)", padding: "3px 10px" }}>
                        {student.departmentModel?.departmentName || "—"}
                      </span>
                    </td>

                    {/* CGPA */}
                    <td>
                      <span className="bold fs-p9" style={{ color: student.percentage >= 8 ? "var(--success)" : student.percentage >= 6? "var(--warning)" : "var(--danger)" }}>
                        {student.percentage || "—"}
                      </span>
                    </td>

                    {/* Skills
                    <td>
                      {student.skills ? (
                        <div className="row g-1 flex-wrap">
                          {student.skills.split(",").slice(0, 2).map((sk) => (
                            <span key={sk} className="fs-p7 br-md"
                              style={{ background: "var(--gray-200)", padding: "2px 8px", color: "var(--gray-700)" }}>
                              {sk.trim()}
                            </span>
                          ))}
                          {student.skills.split(",").length > 2 && (
                            <span className="fs-p7 text-secondary">+{student.skills.split(",").length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="fs-p8 text-secondary">—</span>
                      )}
                    </td> */}
                    {/* Roll No */}
                    <td>
                      <span className="fs-p9">{student.rollNumber || "—"}</span>
                    </td>

                    {/* Placement Badge */}
                    <td>
                      <span className="status-item fs-p8 bold"
                        style={{
                          background: isPlaced ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
                          color: isPlaced ? "var(--success)" : "var(--gray-500)",
                        }}>
                        {isPlaced ? "✅ Placed" : "⏳ Unplaced"}
                      </span>
                    </td>

                    {/* View Button */}
                    <td>
                      <button
                        className="btn btn-primary w-auto"
                        style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                        onClick={() => setSelectedStudent(student)}
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div
            className="card p-5"
            style={{ width: 520, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="row space-between items-center mb-4">
              <div className="row items-center g-3">
                <div
                  className="bg-primary text-white br-circle bold"
                  style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}
                >
                  {selectedStudent.name?.charAt(0) || "S"}
                </div>
                <div>
                  <h3 className="fs-4 bold">{selectedStudent.name}</h3>
                  <p className="fs-p8 text-secondary">{selectedStudent.email}</p>
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setSelectedStudent(null)}>✖</span>
            </div>

            {/* Placement banner */}
            <div className="mb-4 p-2 br-md text-center"
              style={{
                background: selectedStudent.workingStatus === "Placed" ? "rgba(22,163,74,0.08)" : "rgba(107,114,128,0.08)",
                border: `1px solid ${selectedStudent.workingStatus === "Placed" ? "rgba(22,163,74,0.3)" : "rgba(107,114,128,0.2)"}`,
              }}>
              <p className="bold" style={{ color: selectedStudent.placement === "Placed" ? "var(--success)" : "var(--gray-500)" }}>
                {selectedStudent.placement === "Placed" ? "✅ Placed Student" : "⏳ Not Yet Placed"}
              </p>
            </div>

            {/* Info Grid */}
            <div className="row g-3">

              {[
                { label: "Department", value: selectedStudent.departmentModel?.departmentName },
                { label: "Percentage", value: selectedStudent.percentage },
                { label: "Phone",      value: selectedStudent.phone      },
                { label: "Roll No",    value: selectedStudent.rollNumber },
              ].filter((f) => f.value).map((f) => (
                <div className="col-6" key={f.label}>
                  <div className="card p-2">
                    <p className="fs-p8 text-secondary">{f.label}</p>
                    <p className="bold fs-p9 mt-1">{f.value}</p>
                  </div>
                </div>
              ))}

              {/* Skills full list */}
              {selectedStudent.skills && (
                <div className="col-12">
                  <div className="card p-2">
                    <p className="fs-p8 text-secondary mb-2">🛠️ Skills</p>
                    <div className="row g-1 flex-wrap">
                      {selectedStudent.skills.split(",").map((sk) => (
                        <span key={sk} className="fs-p8 br-md"
                          style={{ background: "rgba(50,85,99,0.08)", color: "var(--primary)", padding: "3px 10px" }}>
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="mt-4">
              <button
                className="btn btn-muted"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStudents;