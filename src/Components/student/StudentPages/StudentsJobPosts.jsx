import { useState, useEffect } from "react";
import axios from "axios";

function StudentJobPosts() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [applyingId, setApplyingId] = useState(null);
  const [appliedIds, setAppliedIds] = useState([]);

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("studentToken")}` } };

  useEffect(() => {
    Promise.all([
      axios.get("/api/jobs?enabled=true", header),
      axios.get("/api/classification/job-categories", header),
      axios.get("/api/student/applied-jobs", header),
    ]).then(([j, c, a]) => {
      setJobs(j.data.data || j.data || []);
      setCategories(c.data.data || c.data || []);
      setAppliedIds((a.data.data || a.data || []).map(x => x.jobId || x.id));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const applyForJob = (jobId) => {
    setApplyingId(jobId);
    axios.post("/api/student/apply", { jobId }, header)
      .then(() => { setAppliedIds(prev => [...prev, jobId]); setApplyingId(null); })
      .catch(() => setApplyingId(null));
  };

  const filtered = jobs.filter(j =>
    (j.title?.toLowerCase().includes(search.toLowerCase()) || j.companyName?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCategory || j.category === filterCategory)
  );

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">Browse Jobs</h2>
      <p className="fs-p9 text-secondary mb-4">Find opportunities that match your profile</p>

      {/* Filters */}
      <div className="row mb-4" style={{ gap: "12px" }}>
        <div className="col-6 p-0">
          <input type="text" className="form-control" placeholder="Search by job title or company..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="col-3 p-0">
          <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.categoryName || c.name}>{c.categoryName || c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? <p>Loading jobs...</p> : filtered.length === 0 ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>🔍</p>
          <p className="bold mt-2">No jobs found</p>
        </div>
      ) : (
        <div className="row" style={{ gap: "16px" }}>
          {filtered.map(job => {
            const applied = appliedIds.includes(job.id);
            return (
              <div key={job.id} className="card p-4 stat-card" style={{ width: "calc(48% - 16px)" }}>
                <div className="row space-between items-center mb-2">
                  <div>
                    <h4 className="bold">{job.title}</h4>
                    <p className="fs-p9 text-secondary">{job.companyName}</p>
                  </div>
                  <span className="status-item fs-p8" style={{ background: "rgba(50,85,99,0.1)", color: "#325563" }}>{job.category}</span>
                </div>

                <div className="row mb-2" style={{ gap: "12px" }}>
                  <span className="fs-p9">📍 {job.location}</span>
                  <span className="fs-p9">💰 {job.package} LPA</span>
                  <span className="fs-p9">👥 {job.openings} openings</span>
                </div>

                {job.eligibility && <p className="fs-p8 text-secondary mb-2">📋 Eligibility: {job.eligibility}</p>}

                {job.skills && (
                  <div className="mb-3" style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {job.skills.split(",").map((s, i) => (
                      <span key={i} className="fs-p8" style={{ background: "#e5e7eb", borderRadius: "12px", padding: "2px 10px" }}>{s.trim()}</span>
                    ))}
                  </div>
                )}

                <div className="row space-between items-center">
                  <span className="fs-p8 text-secondary">Deadline: {job.deadline}</span>
                  {applied ? (
                    <span className="status-item fs-p8" style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>✅ Applied</span>
                  ) : (
                    <button
                      className="btn btn-primary w-auto"
                      style={{ padding: "6px 20px", fontSize: "0.85rem" }}
                      disabled={applyingId === job.id}
                      onClick={() => applyForJob(job.id)}
                    >{applyingId === job.id ? "Applying..." : "Apply →"}</button>
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

export default StudentJobPosts;
