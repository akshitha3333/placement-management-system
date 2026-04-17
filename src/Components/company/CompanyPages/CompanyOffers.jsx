import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const emptyForm = {
  studentId:   "",
  jobPostId:   "",
  packageLPA:  "",
  joiningDate: "",
  notes:       "",
};

function CompanyOffers() {
  const [jobs,        setJobs]        = useState([]);
  const [applications,setApplications]= useState([]); // all apps across jobs
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(emptyForm);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [offers,      setOffers]      = useState([]); // local offer records
  const [message,     setMessage]     = useState("");
  const [msgType,     setMsgType]     = useState("");

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── Fetch job posts + all their applications ───────────
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Get all job posts
        const jobRes  = await axios.get(rest.jobPost, header);
        const jobList = jobRes.data?.data || jobRes.data || [];
        const jobs    = Array.isArray(jobList) ? jobList : [];
        setJobs(jobs);

        // 2. For each job, fetch its applications
        const appArrays = await Promise.all(
          jobs.map(async (job) => {
            const jid = job.jobPostId || job.id;
            try {
              const res  = await axios.get(`${rest.jobPost}/${jid}/job-applications`, header);
              const list = res.data?.data || res.data || [];
              return Array.isArray(list)
                ? list.map((a) => ({ ...a, _job: job }))
                : [];
            } catch {
              return [];
            }
          })
        );
        setApplications(appArrays.flat());
      } catch (err) {
        console.error("init:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Helpers ────────────────────────────────────────────
  const getName = (app) =>
    app?.studentModel?.name || app?.studentModel?.studentName || app?.studentName || "Student";

  const getDept = (app) =>
    app?.studentModel?.departmentModel?.departmentName || app?.department || "—";

  const getJobTitle = (app) =>
    app?._job?.title || app?._job?.tiitle || "—";

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  // ── Release offer (local state only — no backend offer endpoint in spec) ──
  const handleRelease = () => {
    if (!form.studentId || !form.jobPostId) {
      setMessage("Please select a candidate and job.");
      setMsgType("error");
      return;
    }
    setSubmitting(true);
    setMessage("");

    // Find the selected application to get student name
    const selApp = applications.find(
      (a) =>
        (a.jobApplicationId || a.id) === form.studentId &&
        ((a._job?.jobPostId || a._job?.id) === form.jobPostId)
    ) || applications.find((a) => (a.jobApplicationId || a.id) === form.studentId);

    const newOffer = {
      offerId:      Date.now(),
      studentName:  selApp ? getName(selApp) : "Student",
      department:   selApp ? getDept(selApp)  : "—",
      jobTitle:     selApp ? getJobTitle(selApp) : form.jobPostId,
      packageLPA:   form.packageLPA,
      joiningDate:  form.joiningDate,
      notes:        form.notes,
      releasedDate: new Date().toLocaleDateString("en-IN"),
      studentStatus: "Pending",
    };

    setTimeout(() => {
      setOffers((prev) => [...prev, newOffer]);
      setShowModal(false);
      setForm(emptyForm);
      setMessage("Offer letter released successfully!");
      setMsgType("success");
      setSubmitting(false);
      setTimeout(() => setMessage(""), 3000);
    }, 600);
  };

  const offerStatusMeta = (s) => ({
    Accepted: { bg: "rgba(22,163,74,0.1)",  color: "#16a34a" },
    Rejected: { bg: "rgba(220,38,38,0.1)",  color: "#dc2626" },
    Pending:  { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  }[s] || { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" });

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Offer Letters</h2>
          <p className="fs-p9 text-secondary">Release and track offer letters for selected candidates</p>
        </div>
        <button
          className="btn btn-primary w-auto"
          onClick={() => { setShowModal(true); setMessage(""); }}
        >
          + Release Offer
        </button>
      </div>

      {/* ── Message ── */}
      {message && !showModal && (
        <div
          className="p-2 br-md mb-3 fs-p9"
          style={{
            background: msgType === "success" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
            border:     `1px solid ${msgType === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
            color:      msgType === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {message}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="row mb-4">
        {[
          { label: "Offers Released", value: offers.length,                                                color: "#325563" },
          { label: "Accepted",        value: offers.filter((o) => o.studentStatus === "Accepted").length,  color: "#16a34a" },
          { label: "Pending",         value: offers.filter((o) => o.studentStatus === "Pending").length,   color: "#f59e0b" },
          { label: "Rejected",        value: offers.filter((o) => o.studentStatus === "Rejected").length,  color: "#dc2626" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-3 stat-card text-center">
              <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Offers Table ── */}
      <div className="card p-2">
        {loading ? (
          <p className="text-center p-4">Loading...</p>
        ) : offers.length === 0 ? (
          <div className="text-center p-5">
            <p style={{ fontSize: "3rem" }}>🎯</p>
            <p className="bold mt-2">No offers released yet</p>
            <p className="text-secondary fs-p9">
              Select candidates from Interviews and release offer letters
            </p>
          </div>
        ) : (
          <table className="w-100">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job Title</th>
                <th>Package</th>
                <th>Joining Date</th>
                <th>Released On</th>
                <th>Student Response</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const { bg, color } = offerStatusMeta(offer.studentStatus || "Pending");
                return (
                  <tr key={offer.offerId} className="hover-bg">
                    <td>
                      <div className="bold">{offer.studentName}</div>
                      <div className="fs-p8 text-secondary">{offer.department}</div>
                    </td>
                    <td>{offer.jobTitle}</td>
                    <td className="bold" style={{ color: "#16a34a" }}>
                      {offer.packageLPA ? `${offer.packageLPA} LPA` : "—"}
                    </td>
                    <td className="fs-p9">{formatDate(offer.joiningDate)}</td>
                    <td className="fs-p9">{offer.releasedDate}</td>
                    <td>
                      <span className="status-item" style={{ background: bg, color }}>
                        {offer.studentStatus || "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Release Offer Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card p-5"
            style={{ width: "480px", maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-3">
              <h3>🎯 Release Offer Letter</h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setShowModal(false)}>✕</span>
            </div>

            {/* Select Job */}
            <div className="form-group mb-3">
              <label className="form-control-label">Job Post *</label>
              <select
                className="form-control"
                value={form.jobPostId}
                onChange={(e) => setForm({ ...form, jobPostId: e.target.value, studentId: "" })}
              >
                <option value="">Select job post</option>
                {jobs.map((j) => {
                  const jid = j.jobPostId || j.id;
                  return (
                    <option key={jid} value={jid}>
                      {j.title || j.tiitle}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Select Candidate */}
            <div className="form-group mb-3">
              <label className="form-control-label">Candidate *</label>
              <select
                className="form-control"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                disabled={!form.jobPostId}
              >
                <option value="">
                  {form.jobPostId ? "Select candidate" : "Select a job first"}
                </option>
                {applications
                  .filter((a) => String(a._job?.jobPostId || a._job?.id) === String(form.jobPostId))
                  .map((a) => {
                    const aid = a.jobApplicationId || a.id;
                    return (
                      <option key={aid} value={aid}>
                        {getName(a)} — {getDept(a)}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Package + Joining */}
            <div className="row mb-3" style={{ gap: "12px" }}>
              <div className="col-6 p-0">
                <label className="form-control-label">Package (LPA) *</label>
                <input
                  className="form-control"
                  type="number"
                  placeholder="e.g. 8.5"
                  value={form.packageLPA}
                  onChange={(e) => setForm({ ...form, packageLPA: e.target.value })}
                />
              </div>
              <div className="col-6 p-0">
                <label className="form-control-label">Joining Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.joiningDate}
                  onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="form-group mb-4">
              <label className="form-control-label">Additional Notes</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Any conditions, location, department info..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {message && showModal && (
              <div className="fs-p9 mb-3" style={{ color: "#dc2626" }}>{message}</div>
            )}

            <div className="row" style={{ gap: "10px" }}>
              <button
                className="btn btn-primary"
                onClick={handleRelease}
                disabled={submitting}
              >
                {submitting ? "Releasing..." : "🎯 Release Offer"}
              </button>
              <button className="btn btn-muted" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyOffers;