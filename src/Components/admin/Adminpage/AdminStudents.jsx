import React, { useEffect, useState } from "react";
import axios from "axios";
import rest from "../../../Rest";
import Cookies from "js-cookie";

const AdminStudents = () => {
  const [students,        setStudents]        = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search,          setSearch]          = useState("");

  const header = { headers: { Authorization: `Bearer ${Cookies.get("token")}` } };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(rest.students, header);
      setStudents(res.data.data || []);
    } catch (err) { console.log("Error fetching students:", err); }
  };

  useEffect(() => { fetchStudents(); }, []);

  const filtered = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      !search ||
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.departmentModel?.departmentName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Student Management</h2>
          <p className="fs-p9 text-secondary">View all registered students</p>
        </div>
      </div>

      {/* Total Students stat card */}
      <div className="row g-3 mb-4">
        <div className="col-4 p-2">
          <div className="card p-3 stat-card text-center" style={{ borderTop: "3px solid var(--primary)" }}>
            <h3 className="bold" style={{ color: "var(--primary)" }}>{students.length}</h3>
            <p className="fs-p8 text-secondary mt-1">Total Students</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="row mb-3">
        <div className="w-40">
          <input type="text" placeholder="Search by name, email or department..."
            className="form-control" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0" style={{ overflow: "hidden" }}>
        <table className="w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Department</th>
              <th>CGPA</th>
              <th>Roll No</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-5">
                  <p className="bold mt-1">No students found</p>
                  <p className="fs-p8 text-secondary">Try a different search term</p>
                </td>
              </tr>
            ) : (
              filtered.map((student, idx) => (
                <tr key={student.studentId || student.id || idx} className="hover-bg">
                  <td className="fs-p9 text-secondary">{idx + 1}</td>
                  <td>
                    <div className="row items-center g-2">
                      <div className="bg-primary text-white br-circle bold"
                        style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>
                        {student.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="bold fs-p9">{student.name}</p>
                        <p className="fs-p8 text-secondary">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: "rgba(50,85,99,0.08)", color: "var(--primary)", padding: "3px 10px", borderRadius: 12, fontSize: "0.82rem" }}>
                      {student.departmentModel?.departmentName || "—"}
                    </span>
                  </td>
                  <td>
                    <span className="bold fs-p9"
                      style={{ color: student.percentage >= 8 ? "var(--success)" : student.percentage >= 6 ? "var(--warning)" : "var(--danger)" }}>
                      {student.percentage || "—"}
                    </span>
                  </td>
                  <td><span className="fs-p9">{student.rollNumber || "—"}</span></td>
                  <td>
                    <button className="btn btn-primary w-auto"
                      style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                      onClick={() => setSelectedStudent(student)}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal — registration details only */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="card p-5"
            style={{ width: 480, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="row space-between items-center mb-4">
              <div className="row items-center g-3">
                <div className="bg-primary text-white br-circle bold"
                  style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                  {selectedStudent.name?.charAt(0) || "S"}
                </div>
                <div>
                  <h3 className="fs-4 bold">{selectedStudent.name}</h3>
                  <p className="fs-p8 text-secondary">{selectedStudent.email}</p>
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setSelectedStudent(null)}>✖</span>
            </div>

            {/* Registration details grid */}
            <div className="row g-3">
              {[
                { label: "Department", value: selectedStudent.departmentModel?.departmentName },
                { label: "Roll No",    value: selectedStudent.rollNumber  },
                { label: "CGPA",       value: selectedStudent.percentage  },
                { label: "Year",       value: selectedStudent.year ? `Year ${selectedStudent.year}` : null },
                { label: "Phone",      value: selectedStudent.phone       },
                { label: "Email",      value: selectedStudent.email       },
              ].filter((f) => f.value).map((f) => (
                <div className="col-6" key={f.label}>
                  <div className="card p-2">
                    <p className="fs-p8 text-secondary">{f.label}</p>
                    <p className="bold fs-p9 mt-1">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button className="btn btn-muted" onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStudents;