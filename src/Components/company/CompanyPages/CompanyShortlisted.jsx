import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const getHeaders = () => {
  const token = Cookies.get("token") || localStorage.getItem("token") || "";
  return { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } };
};

const getMultipartHeaders = () => {
  const token = Cookies.get("token") || localStorage.getItem("token") || "";
  return { headers: { Authorization: `Bearer ${token}` } };
};

const baseApi = () => rest.jobApplications.replace(/\/job-applications.*$/, "");

const interviewByAppUrl  = (appId) => `${baseApi()}/job-application/${appId}/interview`;
const offerLetterSendUrl = ()      => `${baseApi()}/interview-schedule/offer-letter`;
const offerLetterGetUrl  = (id)    => `${baseApi()}/interview-schedule/${id}/offer-letter`;

const OFFER_STATUS = {
  Pending:  { label: "Offer Sent — Awaiting Response", bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9" },
  Accepted: { label: "Offer Accepted",                 bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
  Rejected: { label: "Offer Rejected",                 bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
};

const getApp         = (inv) => inv?.jobApplicationModel                               || {};
const getResumeModel = (inv) => getApp(inv)?.resumeModel                               || {};
const getStudent     = (inv) => getResumeModel(inv)?.studentModel
                             || getApp(inv)?.jobSuggestionModel?.studentModel          || {};
const getSuggest     = (inv) => getApp(inv)?.jobSuggestionModel                        || {};
const getJobPost     = (inv) => getSuggest(inv)?.jobPostModel                          || {};

const getName      = (inv) => getStudent(inv)?.name                              || "Student";
const getEmail     = (inv) => getStudent(inv)?.email                             || "—";
const getPhone     = (inv) => getStudent(inv)?.phone                             || "—";
const getRollNo    = (inv) => getStudent(inv)?.rollNumber                        || "—";
const getYear      = (inv) => getStudent(inv)?.year                              || "—";
const getPercent   = (inv) => getStudent(inv)?.percentage                        || "—";
const getDept      = (inv) => getStudent(inv)?.departmentModel?.departmentName   || "—";
const getResTitle  = (inv) => getResumeModel(inv)?.resumeTitle
                           || `Resume #${getResumeModel(inv)?.resumeId || "—"}`;
const getTutor     = (inv) => getSuggest(inv)?.tutorModel?.tutorName             || "—";
const getJobTitle  = (inv) => getJobPost(inv)?.tiitle || getJobPost(inv)?.title  || "—";
const getJobPostId = (inv) => getJobPost(inv)?.jobPostId                         || null;
const getInitial   = (inv) => getName(inv).charAt(0).toUpperCase();

const openResume = (resumeModel) => {
  if (!resumeModel) return;
  const base64 = resumeModel.resume2 || resumeModel.resume;
  if (!base64) { alert("No resume available."); return; }
  const src = base64.startsWith("data:")
    ? base64.replace(/^data:[^;]+;base64,/, "data:application/pdf;base64,")
    : `data:application/pdf;base64,${base64}`;
  const win = window.open();
  if (win) {
    win.document.write(`<iframe src="${src}" style="width:100%;height:100vh;border:none;"></iframe>`);
    win.document.title = resumeModel.resumeTitle || "Resume";
  }
};

function FeedbackMsg({ msg }) {
  if (!msg?.text) return null;
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem",
      background: msg.type === "success" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
      border: `1px solid ${msg.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
      color: msg.type === "success" ? "#16a34a" : "#dc2626",
    }}>{msg.text}</div>
  );
}

function OfferStatusBadge({ status }) {
  const cfg = OFFER_STATUS[status] || OFFER_STATUS.Pending;
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, padding: "5px 12px", borderRadius: 12,
      background: cfg.bg, color: cfg.color, display: "inline-flex", alignItems: "center",
    }}>{cfg.label}</span>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.06em", color: "var(--primary)", marginBottom: 10, marginTop: 4,
    }}>{children}</p>
  );
}

function CompanyShortlisted() {
  const [allSelected, setAllSelected] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [search,      setSearch]      = useState("");

  // offerMap: { [interviewId]: { sent: bool, status: string|null, offerLetterId, fetched: bool } }
  const [offerMap,    setOfferMap]    = useState({});

  const [showOffer,   setShowOffer]   = useState(false);
  const [offerInv,    setOfferInv]    = useState(null);
  const [offerFile,   setOfferFile]   = useState(null);
  const [sending,     setSending]     = useState(false);
  const [offerMsg,    setOfferMsg]    = useState({ text: "", type: "" });
  const fileInputRef                  = useRef(null);

  const [viewInv,     setViewInv]     = useState(null);

  useEffect(() => { fetchSelected(); }, []);

  const fetchSelected = async () => {
    setLoading(true); setError("");
    try {
      const appsRes = await axios.get(rest.jobApplications, getHeaders());
      const apps    = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                    : Array.isArray(appsRes.data)        ? appsRes.data : [];

      const invArrays = await Promise.all(
        apps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res  = await axios.get(interviewByAppUrl(appId), getHeaders());
            const data = res.data?.data || res.data;
            const list = Array.isArray(data) ? data : data ? [data] : [];
            return list
              .filter((i) => i.status === "Selected")
              .map((i) => ({ ...i, _appFallback: app }));
          } catch { return []; }
        })
      );

      const selected = invArrays.flat().filter(Boolean);
      setAllSelected(selected);
      await fetchAllOfferStatuses(selected);
    } catch {
      setError("Failed to load selected students. Please try again.");
    } finally { setLoading(false); }
  };

  // Source of truth: always fetch from backend on load/refresh
  // An offer is considered "sent" only if the backend returns a real record with an id
  const fetchAllOfferStatuses = async (selected) => {
    const results = await Promise.all(
      selected.map(async (inv) => {
        try {
          const res  = await axios.get(offerLetterGetUrl(inv.interviewId), getHeaders());
          const data = res.data?.data || res.data;
          const isSent = !!(data && (data.offerLetterId || data.id || data.interviewScheduleId));
          if (isSent) {
            return {
              interviewId:   inv.interviewId,
              sent:          true,
              status:        data.status || "Pending",
              offerLetterId: data.offerLetterId || data.id,
              fetched:       true,
            };
          }
          return { interviewId: inv.interviewId, sent: false, status: null, fetched: true };
        } catch {
          return { interviewId: inv.interviewId, sent: false, status: null, fetched: true };
        }
      })
    );
    const map = {};
    results.forEach((r) => { map[r.interviewId] = r; });
    setOfferMap(map);
  };

  // After sending, re-fetch just that one interview's offer from backend to confirm persistence
  const refetchSingleOfferStatus = async (interviewId) => {
    try {
      const res  = await axios.get(offerLetterGetUrl(interviewId), getHeaders());
      const data = res.data?.data || res.data;
      const isSent = !!(data && (data.offerLetterId || data.id || data.interviewScheduleId));
      setOfferMap((prev) => ({
        ...prev,
        [interviewId]: {
          interviewId,
          sent:          isSent,
          status:        isSent ? (data.status || "Pending") : null,
          offerLetterId: data?.offerLetterId || data?.id || null,
          fetched:       true,
        },
      }));
    } catch {
      // Keep the optimistic state already applied
    }
  };

  const handleSendOfferLetter = async () => {
    if (!offerFile) { setOfferMsg({ text: "Please select a PDF file.", type: "error" }); return; }
    setSending(true); setOfferMsg({ text: "", type: "" });
    try {
      const formData = new FormData();
      formData.append("interviewId", offerInv.interviewId);
      formData.append("offerLetter", offerFile);
      await axios.post(offerLetterSendUrl(), formData, getMultipartHeaders());

      // Optimistically lock the button immediately
      setOfferMap((prev) => ({
        ...prev,
        [offerInv.interviewId]: {
          interviewId:   offerInv.interviewId,
          sent:          true,
          status:        "Pending",
          offerLetterId: null,
          fetched:       true,
        },
      }));

      // Re-fetch from backend to confirm the real persisted record
      await refetchSingleOfferStatus(offerInv.interviewId);

      setOfferMsg({ text: "Offer letter sent successfully!", type: "success" });
      setOfferFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => { setShowOffer(false); setOfferMsg({ text: "", type: "" }); setOfferInv(null); }, 1800);
    } catch (err) {
      setOfferMsg({ text: err.response?.data?.message || "Failed to send offer letter.", type: "error" });
    } finally { setSending(false); }
  };

  // Derived data
  const jobPosts = [];
  const seenIds  = new Set();
  allSelected.forEach((inv) => {
    const jp  = getJobPost(inv);
    const jid = jp?.jobPostId;
    if (jid && !seenIds.has(jid)) {
      seenIds.add(jid);
      jobPosts.push({ jobPostId: jid, title: jp.tiitle || jp.title || "—", lastDateToApply: jp.lastDateToApply });
    }
  });

  const displayed = allSelected.filter((inv) => {
    const matchJob = !selectedJob || getJobPostId(inv) === selectedJob.jobPostId;
    const q        = search.toLowerCase();
    const matchQ   = !q
      || getName(inv).toLowerCase().includes(q)
      || getEmail(inv).toLowerCase().includes(q)
      || getDept(inv).toLowerCase().includes(q);
    return matchJob && matchQ;
  });

  const offerSentCount     = Object.values(offerMap).filter((o) => o.sent).length;
  const offerAcceptedCount = Object.values(offerMap).filter((o) => o.status === "Accepted").length;

  // Allow sending only if: offer never sent OR student rejected the offer
  // Pending and Accepted are locked — button disappears
  const canSendOffer = (interviewId) => {
    const o = offerMap[interviewId];
    if (!o || !o.fetched) return false;
    if (!o.sent) return true;
    if (o.status === "Rejected") return true;
    return false;
  };

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">Shortlisted Candidates</h2>
        <p className="fs-p9 text-secondary">Students selected from interviews — send offer letters and track responses</p>
      </div>

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Total Selected",     value: allSelected.length,  color: "#16a34a"        },
          { label: "Offer Letters Sent", value: offerSentCount,      color: "#0ea5e9"        },
          { label: "Offers Accepted",    value: offerAcceptedCount,  color: "var(--success)" },
          { label: "Job Posts",          value: jobPosts.length,     color: "var(--primary)" },
        ].map((s, i) => (
          <div key={i} style={{ flex: "1 1 140px" }}>
            <div className="card p-3 text-center">
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary mt-2">Loading selected students...</p>
        </div>
      ) : error ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button className="btn btn-primary mt-3 w-auto" style={{ padding: "8px 20px" }} onClick={fetchSelected}>Retry</button>
        </div>
      ) : allSelected.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No selected students yet</p>
          <p className="text-secondary fs-p9 mt-1">
            Mark students as "Selected" from the Interview Management page — they will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Job Post Selector */}
          <div className="card p-4 mb-4">
            <h4 className="bold mb-3">Filter by Job Post</h4>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <div onClick={() => setSelectedJob(null)} style={{
                padding: "10px 18px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${!selectedJob ? "var(--primary)" : "var(--border-color)"}`,
                background: !selectedJob ? "var(--primary)" : "#fff",
                color: !selectedJob ? "#fff" : "inherit",
                minWidth: 120, transition: "all 0.15s",
              }}>
                <p className="bold fs-p9">All Posts</p>
                <p className="fs-p8" style={{ opacity: 0.8 }}>{allSelected.length} students</p>
              </div>
              {jobPosts.map((jp) => {
                const count    = allSelected.filter((i) => getJobPostId(i) === jp.jobPostId).length;
                const isActive = selectedJob?.jobPostId === jp.jobPostId;
                return (
                  <div key={jp.jobPostId} onClick={() => setSelectedJob(jp)} style={{
                    padding: "10px 18px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${isActive ? "var(--primary)" : "var(--border-color)"}`,
                    background: isActive ? "var(--primary)" : "#fff",
                    color: isActive ? "#fff" : "inherit",
                    minWidth: 160, transition: "all 0.15s",
                  }}>
                    <p className="bold fs-p9">{jp.title}</p>
                    <p className="fs-p8" style={{ opacity: 0.8 }}>
                      {count} selected · Deadline: {jp.lastDateToApply || "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search & Refresh */}
          <div className="row space-between items-center mb-3" style={{ flexWrap: "wrap", gap: 10 }}>
            <input type="text" className="form-control" style={{ width: 260 }}
              placeholder="Search name, email, department..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="row items-center g-2">
              <span className="fs-p9 text-secondary">{displayed.length} student{displayed.length !== 1 ? "s" : ""}</span>
              <button onClick={fetchSelected} style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)",
                background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
              }}>Refresh</button>
            </div>
          </div>

          {/* Student Cards */}
          {displayed.length === 0 ? (
            <div className="card p-5 text-center">
              <p className="bold mt-2">No results</p>
              <p className="text-secondary fs-p9">Try adjusting search or selecting a different job post.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {displayed.map((inv, idx) => {
                const offer       = offerMap[inv.interviewId];
                const offerSent   = offer?.sent === true;
                const offerStatus = offer?.status;
                const allowSend   = canSendOffer(inv.interviewId);

                return (
                  <div key={inv.interviewId || idx} className="card p-4" style={{ borderTop: "4px solid #16a34a" }}>
                    {/* Header */}
                    <div className="row items-center g-3 mb-3">
                      <div style={{
                        width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                        background: "#16a34a", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "1.1rem",
                      }}>{getInitial(inv)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="bold fs-p9" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {getName(inv)}
                        </p>
                        <p className="fs-p8 text-secondary">{getDept(inv)}</p>
                      </div>
                      <span style={{
                        fontSize: "0.68rem", fontWeight: 700, padding: "3px 8px", borderRadius: 8,
                        background: "rgba(22,163,74,0.1)", color: "#16a34a",
                      }}>Selected</span>
                    </div>

                    {/* Info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                      <p className="fs-p9">{getEmail(inv)}</p>
                      <p className="fs-p9">{getPhone(inv)}</p>
                      <p className="fs-p9">Roll No: <span className="bold">{getRollNo(inv)}</span></p>
                      <p className="fs-p9">{getPercent(inv)}% · Year {getYear(inv)}</p>
                      <p className="fs-p9">{getJobTitle(inv)}</p>
                      {getTutor(inv) !== "—" && <p className="fs-p9">Ref: {getTutor(inv)}</p>}
                    </div>

                    {/* Resume */}
                    <div onClick={() => openResume(getResumeModel(inv))} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      background: "var(--gray-100)", borderRadius: 8, cursor: "pointer",
                      border: "1px solid rgba(50,85,99,0.15)", marginBottom: 14, transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(50,85,99,0.08)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--gray-100)"}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 6, background: "#325563",
                        color: "#fff", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, flexShrink: 0,
                      }}>PDF</div>
                      <div>
                        <p className="bold fs-p8" style={{ color: "#325563" }}>{getResTitle(inv)} — Click to view</p>
                        <p className="fs-p8 text-secondary">Resume</p>
                      </div>
                    </div>

                    {/* Offer letter status badge — always shown if sent */}
                    {offerSent && (
                      <div style={{ marginBottom: 8 }}>
                        <OfferStatusBadge status={offerStatus} />
                      </div>
                    )}

                    {/* Offer action button — only shown when allowed, hidden when locked */}
                    {allowSend ? (
                      <button onClick={() => {
                        setOfferInv(inv); setOfferFile(null);
                        setOfferMsg({ text: "", type: "" }); setShowOffer(true);
                      }} style={{
                        width: "100%", padding: "9px", borderRadius: 8, fontSize: "0.85rem",
                        fontWeight: 600,
                        background: offerStatus === "Rejected" ? "#fff" : "#0ea5e9",
                        color: offerStatus === "Rejected" ? "#0ea5e9" : "#fff",
                        border: offerStatus === "Rejected" ? "2px solid #0ea5e9" : "none",
                        cursor: "pointer",
                      }}>
                        {offerStatus === "Rejected" ? "Resend Offer Letter" : "Send Offer Letter"}
                      </button>
                    ) : offerSent ? (
                      // Locked — Pending or Accepted
                      <div style={{
                        width: "100%", padding: "9px", borderRadius: 8, fontSize: "0.82rem",
                        fontWeight: 600, textAlign: "center",
                        background: "var(--gray-100)", color: "var(--text-secondary)",
                        border: "1px solid var(--border-color)",
                      }}>
                        Offer letter already sent
                      </div>
                    ) : (
                      // offer not yet fetched
                      <div style={{
                        width: "100%", padding: "9px", borderRadius: 8, fontSize: "0.82rem",
                        fontWeight: 600, textAlign: "center",
                        background: "var(--gray-100)", color: "var(--text-secondary)",
                        border: "1px solid var(--border-color)",
                      }}>
                        Loading...
                      </div>
                    )}

                    <button onClick={() => setViewInv(inv)} style={{
                      width: "100%", marginTop: 8, padding: "7px", borderRadius: 8,
                      fontSize: "0.82rem", fontWeight: 600,
                      background: "#fff", color: "var(--primary)",
                      border: "1px solid var(--border-color)", cursor: "pointer",
                    }}>View Full Details</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SEND OFFER LETTER MODAL */}
      {showOffer && offerInv && (
        <div className="modal-overlay" onClick={() => { setShowOffer(false); setOfferInv(null); }}>
          <div className="card p-5" style={{ width: 480, maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="row space-between items-center mb-3">
              <h3 className="bold">Send Offer Letter</h3>
              <span className="cursor-pointer fs-4 text-secondary"
                onClick={() => { setShowOffer(false); setOfferInv(null); }}>✕</span>
            </div>

            <div style={{
              background: "rgba(22,163,74,0.05)", borderRadius: 10, padding: "14px 16px",
              marginBottom: 20, border: "1px solid rgba(22,163,74,0.2)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                background: "#16a34a", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "1.1rem",
              }}>{getInitial(offerInv)}</div>
              <div>
                <p className="bold fs-p9">{getName(offerInv)}</p>
                <p className="fs-p9 text-secondary">{getDept(offerInv)} · {getJobTitle(offerInv)}</p>
                <p className="fs-p9 text-secondary">{getEmail(offerInv)}</p>
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-control-label">
                Offer Letter (PDF) <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="form-control"
                onChange={(e) => setOfferFile(e.target.files[0] || null)}
              />
              <p className="fs-p8 text-secondary mt-1">Upload the signed offer letter PDF to send to the student.</p>
            </div>

            {offerFile && (
              <div style={{
                background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6, background: "#325563",
                  color: "#fff", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, flexShrink: 0,
                }}>PDF</div>
                <div>
                  <p className="bold fs-p9" style={{ color: "#16a34a" }}>{offerFile.name}</p>
                  <p className="fs-p8 text-secondary">{(offerFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}

            <FeedbackMsg msg={offerMsg} />

            <div className="row g-2">
              <button onClick={handleSendOfferLetter} disabled={sending || !offerFile} style={{
                flex: 1, padding: "10px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                background: sending || !offerFile ? "var(--gray-400)" : "#0ea5e9",
                color: "#fff", border: "none",
                cursor: sending || !offerFile ? "not-allowed" : "pointer",
              }}>{sending ? "Sending..." : "Send Offer Letter"}</button>
              <button className="btn btn-muted" style={{ flex: 1 }}
                onClick={() => { setShowOffer(false); setOfferInv(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewInv && (
        <div className="modal-overlay" onClick={() => setViewInv(null)}>
          <div className="card p-5" style={{ width: 640, maxWidth: "96%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="row space-between items-center mb-4">
              <div className="row items-center g-3">
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                  background: "#16a34a", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem", fontWeight: 700,
                }}>{getInitial(viewInv)}</div>
                <div>
                  <h3 className="bold">{getName(viewInv)}</h3>
                  <p className="fs-p9 text-secondary">{getEmail(viewInv)} · {getDept(viewInv)}</p>
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setViewInv(null)}>✕</span>
            </div>

            {/* Offer letter status */}
            <div style={{
              background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)",
              borderRadius: 8, padding: "12px 16px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
            }}>
              <div>
                <p className="fs-p8 text-secondary mb-1">Offer Letter Status</p>
                {offerMap[viewInv.interviewId]?.sent
                  ? <OfferStatusBadge status={offerMap[viewInv.interviewId].status} />
                  : <span style={{
                      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
                      background: "rgba(107,114,128,0.1)", color: "#6b7280",
                    }}>Not Sent Yet</span>
                }
              </div>
              {canSendOffer(viewInv.interviewId) && (
                <button onClick={() => {
                  setOfferInv(viewInv); setOfferFile(null);
                  setOfferMsg({ text: "", type: "" }); setShowOffer(true); setViewInv(null);
                }} style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
                  background: "#0ea5e9", color: "#fff", border: "none", cursor: "pointer",
                }}>
                  {offerMap[viewInv.interviewId]?.status === "Rejected" ? "Resend Offer Letter" : "Send Offer Letter"}
                </button>
              )}
            </div>

            <SectionTitle>Student Details</SectionTitle>
            <div className="row g-3 mb-4" style={{ flexWrap: "wrap" }}>
              {[
                { label: "Name",           value: getName(viewInv)    },
                { label: "Email",          value: getEmail(viewInv)   },
                { label: "Phone",          value: getPhone(viewInv)   },
                { label: "Roll Number",    value: getRollNo(viewInv)  },
                { label: "Department",     value: getDept(viewInv)    },
                { label: "Year",           value: getYear(viewInv)    },
                { label: "Percentage",     value: getPercent(viewInv) },
                { label: "Recommended By", value: getTutor(viewInv)   },
              ].map((f) => (
                <div key={f.label} style={{
                  flex: "1 1 44%", border: "1px solid var(--border-color)", borderRadius: 8,
                  padding: "10px 12px", background: "var(--bg-color)",
                }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: 4 }}>{f.label}</p>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>{f.value || "—"}</p>
                </div>
              ))}
            </div>

            <SectionTitle>Resume</SectionTitle>
            <div onClick={() => openResume(getResumeModel(viewInv))} style={{
              background: "var(--gray-100)", borderRadius: 10, padding: "12px 16px", marginBottom: 20,
              border: "1px solid rgba(50,85,99,0.2)", display: "flex", alignItems: "center", gap: 14,
              cursor: "pointer", transition: "background 0.15s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(50,85,99,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--gray-100)"}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 8, background: "#325563",
                color: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0,
              }}>PDF</div>
              <div>
                <p className="bold fs-p9" style={{ color: "#325563" }}>{getResTitle(viewInv)} — Click to view</p>
                <p className="fs-p8 text-secondary">Uploaded: {getResumeModel(viewInv)?.date || "—"}</p>
              </div>
            </div>

            {getJobPost(viewInv)?.jobPostId && (
              <>
                <SectionTitle>Job Post</SectionTitle>
                <div className="row g-3 mb-4" style={{ flexWrap: "wrap" }}>
                  {[
                    { label: "Title",    value: getJobPost(viewInv)?.tiitle             },
                    { label: "Deadline", value: getJobPost(viewInv)?.lastDateToApply    },
                    { label: "Openings", value: getJobPost(viewInv)?.requiredCandidate  },
                    { label: "Min %",    value: getJobPost(viewInv)?.eligiblePercentage },
                  ].map((f) => (
                    <div key={f.label} style={{
                      flex: "1 1 44%", border: "1px solid var(--border-color)", borderRadius: 8,
                      padding: "10px 12px", background: "var(--bg-color)",
                    }}>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: 4 }}>{f.label}</p>
                      <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>{f.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button className="btn btn-muted" onClick={() => setViewInv(null)}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default CompanyShortlisted;