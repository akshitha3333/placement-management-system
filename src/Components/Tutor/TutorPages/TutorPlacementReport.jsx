import { useState, useEffect } from "react";
import axios from "axios";

function TutorPlacementReport() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportForm, setReportForm] = useState({ remarks: "", placedCompany: "", package: "", joiningDate: "" });
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("tutorToken")}` } };

  useEffect(() => {
    axios.get("/api/tutor/placement-report", header)
      .then(res => { setStudents(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleUploadReport = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedStudent) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("studentId", selectedStudent.id);
    Object.entries(reportForm).forEach(([k, v]) => formData.append(k, v));

    axios.post("/api/tutor/placement-report/upload", formData, {
      headers: { "Content-type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("tutorToken")}` }
    }).then(() => {
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, reportUploaded: true, ...reportForm } : s));
      setSelectedStudent(null);
      setReportForm({ remarks: "", placedCompany: "", package: "", joiningDate: "" });
      setUploading(false);
    }).catch(() => setUploading(false));
  };

  const filtered = students.filter(s => !filterStatus || (filterStatus === "Placed" ? s.placementStatus === "Placed" : filterStatus === "Report Uploaded" ? s.reportUploaded : filterStatus === "Pending" ? !s.reportUploaded && s.placementStatus !== "Placed" : true));

  const statusColor = (s) => ({
    Placed: ["rgba(22,163,74,0.1)", "#16a34a"],
    "In Process": ["rgba(14,165,233,0.1)", "#0ea5e9"],
    "Not Applied": ["rgba(107,114,128,0.1)", "#6b7280"],
  }[s] || ["rgba(107,114,128,0.1)", "#6b7280"]);

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">Placement Report</h2>
      <p className="fs-p9 text-secondary mb-4">View and upload student placement reports</p>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Total Students", value: students.length, color: "#325563" },
          { label: "Placed", value: students.filter(s => s.placementStatus === "Placed").length, color: "#16a34a" },
          { label: "Reports Uploaded", value: students.filter(s => s.reportUploaded).length, color: "#0ea5e9" },
          { label: "Pending Report", value: students.filter(s => s.placementStatus === "Placed" && !s.reportUploaded).length, color: "#f59e0b" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-3 stat-card text-center">
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="row mb-4" style={{ gap: "12px" }}>
        <div className="col-3 p-0">
          <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Students</option>
            <option value="Placed">Placed</option>
            <option value="Report Uploaded">Report Uploaded</option>
            <option value="Pending">Pending Report</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-2">
        {loading ? <p className="text-center p-4">Loading...</p> : (
          <table className="w-100">
            <thead>
              <tr>
                <th>Student</th>
                <th>Department</th>
                <th>CGPA</th>
                <th>Placement</th>
                <th>Company</th>
                <th>Package</th>
                <th>Report</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center p-4 text-secondary">No students found</td></tr>
              ) : filtered.map(s => {
                const [bg, color] = statusColor(s.placementStatus || "Not Applied");
                return (
                  <tr key={s.id} className="hover-bg">
                    <td>
                      <div className="bold">{s.name}</div>
                      <div className="fs-p8 text-secondary">{s.email}</div>
                    </td>
                    <td>{s.department}</td>
                    <td className="bold">{s.cgpa}</td>
                    <td>
                      <span className="status-item fs-p8" style={{ background: bg, color }}>
                        {s.placementStatus || "Not Applied"}
                      </span>
                    </td>
                    <td>{s.placedCompany || <span className="text-secondary">—</span>}</td>
                    <td>{s.package ? <span className="bold text-success">{s.package} LPA</span> : <span className="text-secondary">—</span>}</td>
                    <td>
                      {s.reportUploaded
                        ? <span className="status-item fs-p8" style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>✅ Uploaded</span>
                        : <span className="fs-p8 text-secondary">Not uploaded</span>
                      }
                    </td>
                    <td>
                      <button
                        className="btn btn-primary w-auto"
                        style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                        onClick={() => setSelectedStudent(s)}
                      >
                        {s.reportUploaded ? "Update" : "Upload"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Report Modal */}
      {selectedStudent && (
        <div className="modal-overlay">
          <div className="card p-5" style={{ width: "480px", maxWidth: "95%" }}>
            <h3 className="mb-1">Upload Placement Report</h3>
            <p className="fs-p9 text-secondary mb-3">For: <span className="bold">{selectedStudent.name}</span></p>

            <div className="form-group mb-2">
              <label className="form-control-label">Placed Company</label>
              <input className="form-control" placeholder="e.g. TechCorp Pvt Ltd" value={reportForm.placedCompany} onChange={e => setReportForm({ ...reportForm, placedCompany: e.target.value })} />
            </div>

            <div className="row mb-2" style={{ gap: "10px" }}>
              <div className="col-6 p-0">
                <label className="form-control-label">Package (LPA)</label>
                <input className="form-control" placeholder="e.g. 8.5" value={reportForm.package} onChange={e => setReportForm({ ...reportForm, package: e.target.value })} />
              </div>
              <div className="col-6 p-0">
                <label className="form-control-label">Joining Date</label>
                <input type="date" className="form-control" value={reportForm.joiningDate} onChange={e => setReportForm({ ...reportForm, joiningDate: e.target.value })} />
              </div>
            </div>

            <div className="form-group mb-2">
              <label className="form-control-label">Remarks</label>
              <textarea className="form-control" rows="2" placeholder="Any notes about this placement..." value={reportForm.remarks} onChange={e => setReportForm({ ...reportForm, remarks: e.target.value })} />
            </div>

            <div className="form-group mb-3">
              <label className="form-control-label">Upload Report File (PDF)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="form-control"
                onChange={handleUploadReport}
                disabled={uploading}
              />
              <p className="fs-p8 text-secondary mt-1">Accepted: PDF, DOC, DOCX</p>
            </div>

            <div className="row" style={{ gap: "10px" }}>
              <button className="btn btn-muted" onClick={() => setSelectedStudent(null)}>Cancel</button>
            </div>

            {uploading && <p className="text-secondary fs-p9 mt-2 text-center">Uploading...</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorPlacementReport;
