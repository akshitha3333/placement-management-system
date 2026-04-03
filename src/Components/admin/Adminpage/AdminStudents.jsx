import React, { useEffect, useState } from "react";
import axios from "axios";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Fetch students
  const fetchStudents = async () => {
  try {
    const res = await axios.get("/admin-students", {
      params: {
        department: selectedDept,
        status: selectedStatus
      }
    });
    setStudents(res.data);
  } catch (err) {
    console.error("Error fetching students:", err);
  } finally {
    setLoading(false);
  }
};
  const fetchDepartments = async () => {
  try {
    const res = await axios.get("/departments");
    setDepartments(res.data);
  } catch (err) {
    console.error("Error fetching departments:", err);
  }
};
 useEffect(() => {
  fetchDepartments();
}, []);

useEffect(() => {
  fetchStudents();
}, [selectedDept, selectedStatus]);

  return (
    <div
      className="p-4"
      style={{
        height: "calc(100vh - 70px)", // adjust if header height differs
        overflowY: "auto",
      }}
    >
      {/* Title + Actions */}
      <div className="row items-center space-between mb-3">
        <div>
          <h2 className="fs-5 bold">Student Management</h2>
          <p className="fs-p9 text-gray-600">
            Manage and verify student registrations
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-3" style={{ gap: "10px" }}>
        <input
          type="text"
          placeholder="Search by name or ID..."
          className="form-control w-40"
        />

       {/* Department Dropdown */}
<select
  className="form-control w-20"
  value={selectedDept}
  onChange={(e) => setSelectedDept(e.target.value)}
>
  <option value="">All Departments</option>
  {departments.map((dept) => (
    <option key={dept.id} value={dept.name}>
      {dept.name}
    </option>
  ))}
</select>

{/* Status Dropdown */}
<select
  className="form-control w-20"
  value={selectedStatus}
  onChange={(e) => setSelectedStatus(e.target.value)}
>
  <option value="">All Status</option>
  <option value="Verified">Verified</option>
  <option value="Unverified">Unverified</option>
  <option value="Rejected">Rejected</option>
</select>
      </div>
      {/* Table */}
      <div className="card p-2">
        {loading ? (
          <p className="text-center p-3">Loading...</p>
        ) : (
          <table className="w-100">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Department</th>
                <th>CGPA</th>
                <th>Verification</th>
                <th>Placement</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="hover-bg">
                  <td>{student.id}</td>
                  <td>
                    <div className="bold">{student.name}</div>
                    <div className="fs-p8 text-gray-300">
                      {student.email}
                    </div>
                  </td>
                  <td>{student.department}</td>
                  <td className="bold">{student.cgpa}</td>
                  {/* Verification */}
                  <td>
                    <span
                      className="status-item"
                      style={{
                        background:
                          student.verification === "Verified"
                            ? "rgba(22,163,74,0.1)"
                            : student.verification === "Pending"
                            ? "rgba(245,158,11,0.1)"
                            : "rgba(220,38,38,0.1)",
                        color:
                          student.verification === "Verified"
                            ? "#16a34a"
                            : student.verification === "Pending"
                            ? "#f59e0b"
                            : "#dc2626",
                      }}
                    >
                      {student.verification}
                    </span>
                  </td>

                  {/* Placement */}
                  <td>
                    <span
                      className="status-item"
                      style={{
                        background:
                          student.placement === "Placed"
                            ? "rgba(14,165,233,0.1)"
                            : "rgba(107,114,128,0.1)",
                        color:
                          student.placement === "Placed"
                            ? "#0ea5e9"
                            : "#6b7280",
                      }}
                    >
                      {student.placement}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="row" style={{ gap: "8px" }}>
                      <span className="cursor-pointer">👁️</span>
                      <span className="cursor-pointer text-success">✔</span>
                      <span className="cursor-pointer text-danger">✖</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Students;