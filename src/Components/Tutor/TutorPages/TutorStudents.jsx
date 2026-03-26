import { useState, useEffect } from "react";
import axios from "axios";

function TutorStudents() {
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedJob, setSelectedJob] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("tutorToken")}` } };

  useEffect(() => {
    Promise.all([
      axios.get("/api/tutor/students", header),
      axios.get("/api/jobs?enabled=true", header),
    ]).then(([s, j]) => {
      setStudents(s.data.data || s.data || []);
      setJobs(j.data.data || j.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const assignToJob = () => {
    if (!selectedStudent || !selectedJob) return;
    axios.post("/api/tutor/assign-job", { studentId: selectedStudent.id, jobId: selectedJob }, header)
      .then(() => { setSelectedStudent(null); setSelectedJob(""); alert("Student assigned to job successfully!"); })
      .catch(console.error);
  };

  const filtered = students.filter(s =>
    (s.name?.toLowerCase().includes(search.toLowerCase()) || s.rollNo?.includes(search)) &&
    (!filterStatus || s.placementStatus === filterStatus)
  );

  const statusColor = (s) => ({
    Placed: ["rgba(22,163,74,0.1)", "#16a34a"],
    "In Process": ["rgba(14,165,233,0.1)", "#0ea5e9"],
    "Not Applied": ["rgba(107,114,128,0.1)", "#6b7280"],
  }[s] || ["rgba(107,114,128,0.1)", "#6b7280"]);

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">My Students</h2>
      <p className="fs-p9 text-secondary mb-4">View and manage students assigned to you</p>

      {/* Filters */}
      <div className="row mb-4" style={{ gap: "12px" }}>
        <div className="col-5 p-0">
          <input type="text" className="form-control" placeholder="Search by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="col-3 p-0">
          <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Placed</option><option>In Process</option><option>Not Applied</option>
          </select>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="card p-2">
          <table className="w-100">
            <thead>
              <tr><th>Student</th><th>Department</th><th>CGPA</th><th>Backlogs</th><th>Skills</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-4">No students found</td></tr>
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
                    <td>{s.backlogCount || 0}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", maxWidth: "150px" }}>
                        {s.skills?.split(",").slice(0, 2).map((sk, i) => (
                          <span key={i} className="fs-p8" style={{ background: "#e5e7eb", borderRadius: "8px", padding: "1px 7px" }}>{sk.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td><span className="status-item fs-p8" style={{ background: bg, color }}>{s.placementStatus || "Not Applied"}</span></td>
                    <td>
                      <button
                        className="btn btn-primary w-auto"
                        style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                        onClick={() => setSelectedStudent(s)}
                      >Assign Job</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Job Modal */}
      {selectedStudent && (
        <div className="modal-overlay">
          <div className="card p-5" style={{ width: "440px", maxWidth: "95%" }}>
            <h3 className="mb-1">Assign to Job</h3>
            <p className="fs-p9 text-secondary mb-3">Assigning: <span className="bold">{selectedStudent.name}</span></p>
            <div className="form-group mb-3">
              <label className="form-control-label">Select Job Requirement</label>
              <select className="form-control" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                <option value="">Choose a job...</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} - {j.companyName} ({j.package} LPA)</option>)}
              </select>
            </div>
            <div className="row" style={{ gap: "10px" }}>
              <button className="btn btn-primary" onClick={assignToJob} disabled={!selectedJob}>Assign</button>
              <button className="btn btn-muted" onClick={() => setSelectedStudent(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorStudents;
