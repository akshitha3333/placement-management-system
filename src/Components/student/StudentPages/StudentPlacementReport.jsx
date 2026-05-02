import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");
const baseJob = rest.jobApplications.replace("/job-applications", "");

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${Cookies.get("token")}`,
    "Content-Type": "application/json",
  },
});

function StudentPlacementReport() {
  const [applications, setApplications] = useState([]); 
  const [reports,      setReports]      = useState({}); 
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  // upload modal state
  const [uploadApp,    setUploadApp]    = useState(null);  
  const [file,         setFile]         = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadMsg,    setUploadMsg]    = useState({ text: "", type: "" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true); setError("");

      const appsRes = await axios.get(rest.jobApplications, getHeaders());
      console.log("STEP 1 — raw applications:", appsRes.data);

      const allApps = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                    : Array.isArray(appsRes.data)        ? appsRes.data : [];
      console.log("STEP 1 — parsed apps:", allApps);

      const selectedApps = allApps.filter((a) => a.status === "SELECTED");
      console.log("STEP 1 — SELECTED apps:", selectedApps);

      setApplications(selectedApps);

      const reportMap = {};
      await Promise.all(
        selectedApps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res = await axios.get(`${baseJob}/placement-report/${appId}`, getHeaders());
            console.log(`STEP 2 — report for app #${appId}:`, res.data);
            reportMap[appId] = res.data?.data || res.data || null;
          } catch (e) {
            console.warn(`STEP 2 — no report for app #${appId}:`, e.response?.status);
            reportMap[appId] = null;
          }
        })
      );

      console.log("STEP 2 — all reports map:", reportMap);
      setReports(reportMap);
    } catch (err) {
      console.error("fetchAll error:", err.response?.data || err.message);
      setError("Failed to load your applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) { setUploadMsg({ text: "Please select a file to upload.", type: "error" }); return; }
    const appId = uploadApp.jobApplicationId || uploadApp.id;

    setUploading(true); setUploadMsg({ text: "", type: "" });
    try {
      const formData = new FormData();
      formData.append("report", file);
      formData.append("jobApplicationId", appId);

      const res = await axios.post(`${baseJob}/placement-report`, formData, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      console.log("Upload response:", res.data);

      setUploadMsg({ text: "Placement report uploaded successfully!", type: "success" });
      setTimeout(() => {
        closeModal();
        fetchAll(); 
      }, 1600);
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      const msg = typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message || "Upload failed. Please try again.";
      setUploadMsg({ text: msg, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const openModal = (app) => {
    setUploadApp(app); setFile(null); setUploadMsg({ text: "", type: "" });
  };
  const closeModal = () => {
    setUploadApp(null); setFile(null); setUploadMsg({ text: "", type: "" });
  };

  const getJobTitle = (app) => app.jobSuggestionModel?.jobPostModel?.tiitle
                             || app.jobSuggestionModel?.jobPostModel?.title || "—";
  const getCompany  = (app) => app.jobSuggestionModel?.jobPostModel?.companyModel?.companyName || "—";
  const getAppId    = (app) => app.jobApplicationId || app.id;

  const uploaded    = applications.filter((a) => reports[getAppId(a)]);
  const pending     = applications.filter((a) => !reports[getAppId(a)]);

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">Placement Report</h2>
        <p className="fs-p9 text-secondary">
          Upload your placement report for jobs where you have been selected
        </p>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Selected Jobs",    value: applications.length, color: "#325563" },
          { label: "Reports Uploaded", value: uploaded.length,     color: "#16a34a" },
          { label: "Pending Upload",   value: pending.length,      color: "#f59e0b" },
        ].map((s, i) => (
          <div className="col-4 p-2" key={i}>
            <div className="card p-4 text-center">
              <h2 className="bold" style={{ color: s.color }}>
                {loading ? "…" : s.value}
              </h2>
              <p className="fs-p8 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary">Loading your selected applications...</p>
        </div>
      ) : error ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button className="btn btn-primary mt-3 w-auto" style={{ padding: "8px 20px" }} onClick={fetchAll}>Retry</button>
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No selected applications yet</p>
          <p className="text-secondary fs-p9 mt-1">
            You can upload a placement report once a company selects you after an interview.
          </p>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>

          {/* Table header */}
          <div className="row items-center" style={{
            background: "var(--gray-100)", padding: "10px 16px",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
          }}>
            <div style={{ width: 36 }}>#</div>
            <div style={{ flex: 2 }}>Company</div>
            <div style={{ flex: 2 }}>Job Role</div>
            <div style={{ flex: 2 }}>Application ID</div>
            <div style={{ flex: 2, textAlign: "center" }}>Report Status</div>
            <div style={{ flex: 2, textAlign: "center" }}>Action</div>
          </div>

          {applications.map((app, idx) => {
            const appId      = getAppId(app);
            const hasReport  = !!reports[appId];
            const reportObj  = reports[appId];

            return (
              <div key={appId} className="row items-center" style={{
                padding: "14px 16px", borderBottom: "1px solid var(--border-color)",
                background: "#fff",
              }}>
                <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>

                <div style={{ flex: 2 }}>
                  <p className="bold fs-p9">{getCompany(app)}</p>
                </div>

                <div style={{ flex: 2 }}>
                  <p className="fs-p9">{getJobTitle(app)}</p>
                </div>

                <div style={{ flex: 2 }}>
                  <p className="fs-p9 text-secondary">#{appId}</p>
                </div>

                <div style={{ flex: 2, textAlign: "center" }}>
                  {hasReport ? (
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
                      background: "rgba(22,163,74,0.1)", color: "#16a34a",
                    }}>
                      Uploaded
                    </span>
                  ) : (
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
                      background: "rgba(245,158,11,0.1)", color: "#f59e0b",
                    }}>
                      Pending
                    </span>
                  )}
                </div>

                <div style={{ flex: 2, textAlign: "center" }}>
                  {hasReport ? (
                    <div>
                      <p className="fs-p8 text-secondary">{reportObj?.report || "Report on file"}</p>
                      <button
                        className="btn btn-muted w-auto mt-1"
                        style={{ padding: "5px 14px", fontSize: "0.78rem" }}
                        onClick={() => openModal(app)}
                      >
                        Re-upload
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary w-auto"
                      style={{ padding: "7px 18px", fontSize: "0.82rem" }}
                      onClick={() => openModal(app)}
                    >
                      Upload Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info card */}
      {!loading && applications.length > 0 && (
        <div className="card p-4 mt-4" style={{ background: "rgba(50,85,99,0.04)", border: "1px solid rgba(50,85,99,0.15)" }}>
          <h4 className="bold mb-2" style={{ color: "#325563" }}>About Placement Reports</h4>
          <p className="fs-p9 text-secondary">
            A placement report is required for every job where you have been selected. Upload your offer letter, joining confirmation, or any document your tutor or institution requires as proof of placement. Accepted formats: PDF, JPG, PNG, DOCX.
          </p>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadApp && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="card p-5" style={{ width: 480, maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-4">
              <h3 className="bold">Upload Placement Report</h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={closeModal}>x</span>
            </div>

            {/* App summary */}
            <div style={{
              background: "rgba(50,85,99,0.05)", borderRadius: 8,
              padding: "12px 14px", marginBottom: 20,
              border: "1px solid rgba(50,85,99,0.12)",
            }}>
              <p className="bold fs-p9">{getCompany(uploadApp)}</p>
              <p className="fs-p9 text-secondary">{getJobTitle(uploadApp)}</p>
              <p className="fs-p9 text-secondary mt-1">Application ID: #{getAppId(uploadApp)}</p>
            </div>

            {/* File picker */}
            <div className="form-group mb-4">
              <label className="form-control-label">
                Select Report File
                <span style={{ color: "var(--danger)" }}> *</span>
              </label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                onChange={(e) => {
                  setFile(e.target.files[0] || null);
                  setUploadMsg({ text: "", type: "" });
                }}
              />
              <p className="fs-p8 text-secondary mt-1">Accepted: PDF, JPG, PNG, DOCX</p>
              {file && (
                <p className="fs-p8 mt-1" style={{ color: "#325563", fontWeight: 600 }}>
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {uploadMsg.text && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem",
                background: uploadMsg.type === "success" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                border: `1px solid ${uploadMsg.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                color: uploadMsg.type === "success" ? "#16a34a" : "#dc2626",
              }}>{uploadMsg.text}</div>
            )}

            <div className="row g-2">
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                  border: "none", color: "#fff",
                  background: uploading || !file ? "var(--gray-400)" : "var(--primary)",
                  cursor: uploading || !file ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? "Uploading..." : "Upload Report"}
              </button>
              <button className="btn btn-muted" style={{ flex: 1 }} onClick={closeModal} disabled={uploading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentPlacementReport;