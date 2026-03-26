import { useState, useEffect } from "react";
import axios from "axios";

function CompanyOffers() {
  const [offers, setOffers] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId: "", jobId: "", package: "", joiningDate: "", notes: "" });
  const [jobs, setJobs] = useState([]);

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("companyToken")}` } };

  useEffect(() => {
    Promise.all([
      axios.get("/api/company/offers", header),
      axios.get("/api/company/interviews?result=Selected", header),
      axios.get("/api/company/job-posts", header),
    ]).then(([off, sel, jbs]) => {
      setOffers(off.data.data || off.data || []);
      setEligible(sel.data.data || sel.data || []);
      setJobs(jbs.data.data || jbs.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleRelease = () => {
    axios.post("/api/company/offers", form, header)
      .then(res => { setOffers(prev => [...prev, res.data.data || res.data]); setShowModal(false); setForm({ studentId: "", jobId: "", package: "", joiningDate: "", notes: "" }); })
      .catch(console.error);
  };

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Offer Letters</h2>
          <p className="fs-p9 text-secondary">Release and track offer letters for selected candidates</p>
        </div>
        <button className="btn btn-primary w-auto" onClick={() => setShowModal(true)}>+ Release Offer</button>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Offers Released", value: offers.length, color: "#325563" },
          { label: "Accepted", value: offers.filter(o => o.studentStatus === "Accepted").length, color: "#16a34a" },
          { label: "Pending", value: offers.filter(o => !o.studentStatus || o.studentStatus === "Pending").length, color: "#f59e0b" },
          { label: "Rejected", value: offers.filter(o => o.studentStatus === "Rejected").length, color: "#dc2626" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-3 stat-card text-center">
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Offers Table */}
      <div className="card p-2">
        {loading ? <p className="text-center p-4">Loading...</p> : offers.length === 0 ? (
          <div className="text-center p-5">
            <p style={{ fontSize: "3rem" }}>🎯</p>
            <p className="bold mt-2">No offers released yet</p>
            <p className="text-secondary fs-p9">Select candidates from Interviews and release offers</p>
          </div>
        ) : (
          <table className="w-100">
            <thead>
              <tr><th>Candidate</th><th>Job Title</th><th>Package</th><th>Joining Date</th><th>Released On</th><th>Student Response</th></tr>
            </thead>
            <tbody>
              {offers.map(offer => (
                <tr key={offer.id} className="hover-bg">
                  <td>
                    <div className="bold">{offer.studentName}</div>
                    <div className="fs-p8 text-secondary">{offer.department}</div>
                  </td>
                  <td>{offer.jobTitle}</td>
                  <td className="bold text-success">{offer.package} LPA</td>
                  <td className="fs-p9">{offer.joiningDate}</td>
                  <td className="fs-p9">{offer.releasedDate}</td>
                  <td>
                    <span className="status-item" style={{
                      background: offer.studentStatus === "Accepted" ? "rgba(22,163,74,0.1)" : offer.studentStatus === "Rejected" ? "rgba(220,38,38,0.1)" : "rgba(245,158,11,0.1)",
                      color: offer.studentStatus === "Accepted" ? "#16a34a" : offer.studentStatus === "Rejected" ? "#dc2626" : "#f59e0b"
                    }}>{offer.studentStatus || "Pending"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Release Offer Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card p-5" style={{ width: "460px", maxWidth: "95%" }}>
            <h3 className="mb-3">Release Offer Letter</h3>
            <div className="form-group mb-2">
              <label className="form-control-label">Select Candidate</label>
              <select className="form-control" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                <option value="">Choose selected candidate</option>
                {eligible.map(e => <option key={e.studentId || e.id} value={e.studentId || e.id}>{e.studentName} - {e.department}</option>)}
              </select>
            </div>
            <div className="form-group mb-2">
              <label className="form-control-label">Job</label>
              <select className="form-control" value={form.jobId} onChange={e => setForm({ ...form, jobId: e.target.value })}>
                <option value="">Select Job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div className="row mb-2" style={{ gap: "10px" }}>
              <div className="col-6 p-0">
                <label className="form-control-label">Package (LPA)</label>
                <input className="form-control" placeholder="e.g. 8.5" value={form.package} onChange={e => setForm({ ...form, package: e.target.value })} />
              </div>
              <div className="col-6 p-0">
                <label className="form-control-label">Joining Date</label>
                <input type="date" className="form-control" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} />
              </div>
            </div>
            <div className="form-group mb-3">
              <label className="form-control-label">Additional Notes</label>
              <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="row" style={{ gap: "10px" }}>
              <button className="btn btn-primary" onClick={handleRelease}>Release Offer</button>
              <button className="btn btn-muted" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyOffers;
