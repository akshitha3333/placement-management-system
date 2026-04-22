import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function CompanyOffers() {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [offerMap,         setOfferMap]         = useState({});
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");
  const [activeTab,        setActiveTab]        = useState("all"); // "all" | "accepted"

  const [showModal, setShowModal] = useState(false);
  const [modalInv,  setModalInv]  = useState(null);
  const [offerFile, setOfferFile] = useState(null);
  const [sending,   setSending]   = useState(false);
  const [modalMsg,  setModalMsg]  = useState({ text: "", type: "" });
  const fileInputRef              = useRef(null);

  const getHeaders = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || ""}`,
    },
  });
  const getMultipartHeaders = () => ({
    headers: { Authorization: `Bearer ${Cookies.get("token") || ""}` },
  });

  const baseApi            = () => rest.jobApplications.replace(/\/job-applications.*$/, "");
  const offerLetterSendUrl = ()    => `${baseApi()}/interview-schedule/offer-letter`;
  const offerLetterGetUrl  = (id)  => `${baseApi()}/interview-schedule/${id}/offer-letter`;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      // Step 1: all applications
      const appsRes = await axios.get(rest.jobApplications, getHeaders());
      const apps    = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                    : Array.isArray(appsRes.data)        ? appsRes.data : [];
      console.log("Applications:", apps.length, apps);

      // Step 2: interviews per app — keep only Selected
      const invArrays = await Promise.all(
        apps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res  = await axios.get(`${baseApi()}/job-application/${appId}/interview`, getHeaders());
            const data = res.data?.data || res.data;
            const list = Array.isArray(data) ? data : data ? [data] : [];
            return list
              .filter((i) => i.status === "Selected" || i.status === "OFFER_SENT")
              .map((i) => ({ ...i, _app: app }));
          } catch { return []; }
        })
      );

      const selected = invArrays.flat();
      console.log("Selected interviews:", selected.length, selected);
      setSelectedStudents(selected);

      // Step 3: fetch offer letter status for each
      await fetchAllOfferStatuses(selected);
    } catch (err) {
      console.error("fetchData error:", err.response?.data || err.message);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOfferStatuses = async (selected) => {
    const results = await Promise.all(
      selected.map(async (inv) => {
        const interviewId = inv.interviewId;
        try {
          const res  = await axios.get(offerLetterGetUrl(interviewId), getHeaders());
          const data = res.data?.data || res.data;
          console.log(`Offer letter for interview ${interviewId}:`, data);
          if (data && (data.offerLetterId || data.id)) {
            return {
              interviewId,
              sent:          true,
              offerLetterId: data.offerLetterId || data.id,
              status:        data.status || "Pending",
              date:          data.date   || null,
              pdfName:       data.offerLetter || null,
            };
          }
          return { interviewId, sent: false, offerLetterId: null, status: null };
        } catch {
          return { interviewId, sent: false, offerLetterId: null, status: null };
        }
      })
    );
    const map = {};
    results.forEach((r) => { map[r.interviewId] = r; });
    console.log("Offer map:", map);
    setOfferMap(map);
  };

  const refetchSingleOffer = async (interviewId) => {
    try {
      const res  = await axios.get(offerLetterGetUrl(interviewId), getHeaders());
      const data = res.data?.data || res.data;
      if (data && (data.offerLetterId || data.id)) {
        setOfferMap((prev) => ({
          ...prev,
          [interviewId]: {
            interviewId,
            sent:          true,
            offerLetterId: data.offerLetterId || data.id,
            status:        data.status || "Pending",
            date:          data.date   || null,
            pdfName:       data.offerLetter || null,
          },
        }));
      }
    } catch { /* keep existing */ }
  };

  const handleSendOffer = async () => {
    if (!offerFile) { setModalMsg({ text: "Please select a PDF file.", type: "error" }); return; }
    setSending(true); setModalMsg({ text: "", type: "" });
    try {
      const formData = new FormData();
      formData.append("interviewId", modalInv.interviewId);
      formData.append("offerLetter", offerFile);
      const res = await axios.post(offerLetterSendUrl(), formData, getMultipartHeaders());
      console.log("Send offer response:", res.data);

      setOfferMap((prev) => ({
        ...prev,
        [modalInv.interviewId]: { interviewId: modalInv.interviewId, sent: true, status: "Pending", offerLetterId: null },
      }));

      await refetchSingleOffer(modalInv.interviewId);
      setModalMsg({ text: "Offer letter sent successfully!", type: "success" });
      setOfferFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => { setShowModal(false); setModalInv(null); setModalMsg({ text: "", type: "" }); }, 1800);
    } catch (err) {
      console.error("Send offer error:", err.response?.data || err.message);
      setModalMsg({ text: err.response?.data?.message || "Failed to send offer letter.", type: "error" });
    } finally { setSending(false); }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getApp         = (inv) => inv?.jobApplicationModel || inv?._app || {};
  const getSuggest     = (inv) => getApp(inv)?.jobSuggestionModel || {};
  const getJobPost     = (inv) => getSuggest(inv)?.jobPostModel    || {};
  const getResumeModel = (inv) => getApp(inv)?.resumeModel         || {};
  const getStudent     = (inv) => getResumeModel(inv)?.studentModel || getSuggest(inv)?.studentModel || {};
  const getName        = (inv) => getStudent(inv)?.name            || "Student";
  const getDept        = (inv) => getStudent(inv)?.departmentModel?.departmentName || "—";
  const getEmail       = (inv) => getStudent(inv)?.email           || "—";
  const getPhone       = (inv) => getStudent(inv)?.phone           || "—";
  const getRollNo      = (inv) => getStudent(inv)?.rollNumber      || "—";
  const getPercent     = (inv) => getStudent(inv)?.percentage      || "—";
  const getJobTitle    = (inv) => getJobPost(inv)?.tiitle || getJobPost(inv)?.title || "—";
  const getInitial     = (inv) => getName(inv).charAt(0).toUpperCase();

  const canSendOffer = (interviewId) => {
    const o = offerMap[interviewId];
    if (!o) return false;
    if (!o.sent) return true;
    if (o.status === "Rejected") return true;
    return false;
  };

  const STATUS_CFG = {
    Pending:  { label: "Awaiting Response", bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9" },
    Accepted: { label: "Accepted",          bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
    Rejected: { label: "Rejected",          bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
  };

  const formatDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  // Derived lists
  const sentCount     = Object.values(offerMap).filter((o) => o.sent).length;
  const acceptedCount = Object.values(offerMap).filter((o) => o.status === "Accepted").length;
  const pendingCount  = Object.values(offerMap).filter((o) => o.status === "Pending").length;
  const rejectedCount = Object.values(offerMap).filter((o) => o.status === "Rejected").length;

  // Students who accepted the offer — used in "Accepted" tab
  const acceptedStudents = selectedStudents.filter(
    (inv) => offerMap[inv.interviewId]?.status === "Accepted"
  );

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Offer Letters</h2>
          <p className="fs-p9 text-secondary">Send and track offer letters for selected candidates</p>
        </div>
        <button onClick={fetchData} style={{
          padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)",
          background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
        }}>Refresh</button>
      </div>

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Total Selected",   value: selectedStudents.length, color: "#16a34a" },
          { label: "Offers Sent",      value: sentCount,               color: "#0ea5e9" },
          { label: "Accepted",         value: acceptedCount,           color: "#16a34a" },
          { label: "Pending Response", value: pendingCount,            color: "#f59e0b" },
          { label: "Rejected",         value: rejectedCount,           color: "#dc2626" },
        ].map((s, i) => (
          <div key={i} style={{ flex: "1 1 130px" }}>
            <div className="card p-3 text-center">
              <h2 className="bold" style={{ color: s.color }}>{loading ? "..." : s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      {!loading && !error && selectedStudents.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { key: "all",      label: `All Candidates (${selectedStudents.length})` },
            { key: "accepted", label: `Accepted Offer (${acceptedCount})`           },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "8px 20px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                cursor: "pointer", border: "none",
                background: activeTab === t.key ? "var(--primary)" : "var(--gray-100)",
                color:      activeTab === t.key ? "#fff"           : "var(--text-secondary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary mt-2">Loading selected candidates...</p>
        </div>
      ) : error ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button className="btn btn-primary mt-3 w-auto" style={{ padding: "8px 20px" }} onClick={fetchData}>Retry</button>
        </div>
      ) : selectedStudents.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No selected candidates yet</p>
          <p className="text-secondary fs-p9 mt-1">
            Mark students as "Selected" from the Interview Management page.
          </p>
        </div>

      ) : activeTab === "all" ? (
        /* ══════════════════════════════════════════════
           TAB: ALL CANDIDATES — offers table
        ══════════════════════════════════════════════ */
        <div className="card p-0" style={{ overflow: "hidden" }}>
          {/* Table header */}
          <div className="row items-center" style={{
            background: "var(--gray-100)", padding: "10px 16px",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
          }}>
            <div style={{ width: 36 }}>#</div>
            <div style={{ flex: 3 }}>Candidate</div>
            <div style={{ flex: 2 }}>Contact</div>
            <div style={{ flex: 2 }}>Job Title</div>
            <div style={{ flex: 2 }}>Offer Sent On</div>
            <div style={{ flex: 2, textAlign: "center" }}>Student Response</div>
            <div style={{ flex: 2, textAlign: "center" }}>Action</div>
          </div>

          {selectedStudents.map((inv, idx) => {
            const offer       = offerMap[inv.interviewId];
            const offerSent   = offer?.sent === true;
            const offerStatus = offer?.status || null;
            const statusCfg   = STATUS_CFG[offerStatus] || null;
            const allowSend   = canSendOffer(inv.interviewId);

            return (
              <div
                key={inv.interviewId || idx}
                className="row items-center"
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  borderLeft: offerStatus === "Accepted"
                    ? "4px solid #16a34a"
                    : offerStatus === "Rejected"
                    ? "4px solid #dc2626"
                    : "4px solid transparent",
                  background: "#fff",
                }}
              >
                <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>

                {/* Candidate */}
                <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "#16a34a", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.9rem",
                  }}>{getInitial(inv)}</div>
                  <div>
                    <p className="bold fs-p9">{getName(inv)}</p>
                    <p className="fs-p8 text-secondary">{getDept(inv)}</p>
                    <p className="fs-p8 text-secondary">{getRollNo(inv)}</p>
                  </div>
                </div>

                {/* Contact */}
                <div style={{ flex: 2 }}>
                  <p className="fs-p9">{getEmail(inv)}</p>
                  <p className="fs-p8 text-secondary">{getPhone(inv)}</p>
                </div>

                {/* Job */}
                <div style={{ flex: 2 }}>
                  <p className="bold fs-p9">{getJobTitle(inv)}</p>
                </div>

                {/* Sent On */}
                <div style={{ flex: 2 }}>
                  <p className="fs-p9">{offerSent ? formatDate(offer?.date) || "Sent" : "—"}</p>
                </div>

                {/* Status */}
                <div style={{ flex: 2, textAlign: "center" }}>
                  {offerSent && statusCfg ? (
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: 10,
                      background: statusCfg.bg, color: statusCfg.color,
                    }}>{statusCfg.label}</span>
                  ) : offerSent ? (
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: 10,
                      background: "rgba(14,165,233,0.1)", color: "#0ea5e9",
                    }}>Awaiting Response</span>
                  ) : (
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: 10,
                      background: "rgba(107,114,128,0.08)", color: "#6b7280",
                    }}>Not Sent</span>
                  )}
                </div>

                {/* Action */}
                <div style={{ flex: 2, textAlign: "center" }}>
                  {allowSend ? (
                    <button
                      onClick={() => {
                        setModalInv(inv); setOfferFile(null);
                        setModalMsg({ text: "", type: "" }); setShowModal(true);
                      }}
                      style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600,
                        background: offerStatus === "Rejected" ? "#fff" : "#0ea5e9",
                        color: offerStatus === "Rejected" ? "#0ea5e9" : "#fff",
                        border: offerStatus === "Rejected" ? "2px solid #0ea5e9" : "none",
                        cursor: "pointer",
                      }}
                    >
                      {offerStatus === "Rejected" ? "Resend" : "Send Offer"}
                    </button>
                  ) : offerSent ? (
                    <span style={{
                      fontSize: "0.78rem", fontWeight: 600, padding: "6px 12px", borderRadius: 8,
                      background: "var(--gray-100)", color: "var(--text-secondary)",
                      border: "1px solid var(--border-color)", display: "inline-block",
                    }}>Sent</span>
                  ) : (
                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Loading...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      ) : (
        /* ══════════════════════════════════════════════
           TAB: ACCEPTED — students who accepted offer
        ══════════════════════════════════════════════ */
        acceptedStudents.length === 0 ? (
          <div className="card p-5 text-center">
            <p className="bold mt-2">No acceptances yet</p>
            <p className="fs-p9 text-secondary mt-1">
              Students will appear here once they accept the offer letter.
            </p>
          </div>
        ) : (
          <>
            {/* Summary banner */}
            <div style={{
              background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.25)",
              borderRadius: 10, padding: "14px 18px", marginBottom: 20,
            }}>
              <p className="bold fs-p9" style={{ color: "#16a34a" }}>
                {acceptedStudents.length} student{acceptedStudents.length > 1 ? "s have" : " has"} accepted the offer letter.
              </p>
              <p className="fs-p8 text-secondary mt-1">These students have confirmed joining your company.</p>
            </div>

            {/* Accepted students table */}
            <div className="card p-0" style={{ overflow: "hidden" }}>
              <div className="row items-center" style={{
                background: "var(--gray-100)", padding: "10px 16px",
                borderBottom: "1px solid var(--border-color)",
                fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
              }}>
                <div style={{ width: 36 }}>#</div>
                <div style={{ flex: 3 }}>Candidate</div>
                <div style={{ flex: 2 }}>Department</div>
                <div style={{ flex: 2 }}>Contact</div>
                <div style={{ flex: 2 }}>Roll No / %</div>
                <div style={{ flex: 2 }}>Job Title</div>
                <div style={{ flex: 2 }}>Offer Accepted On</div>
                <div style={{ flex: 1, textAlign: "center" }}>Status</div>
              </div>

              {acceptedStudents.map((inv, idx) => {
                const offer = offerMap[inv.interviewId];
                return (
                  <div
                    key={inv.interviewId || idx}
                    className="row items-center"
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid var(--border-color)",
                      borderLeft: "4px solid #16a34a",
                      background: "#fff",
                    }}
                  >
                    <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>

                    {/* Candidate */}
                    <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: "#16a34a", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "0.9rem",
                      }}>{getInitial(inv)}</div>
                      <div>
                        <p className="bold fs-p9">{getName(inv)}</p>
                        <p className="fs-p8 text-secondary">{getEmail(inv)}</p>
                      </div>
                    </div>

                    {/* Department */}
                    <div style={{ flex: 2 }}>
                      <p className="fs-p9">{getDept(inv)}</p>
                    </div>

                    {/* Contact */}
                    <div style={{ flex: 2 }}>
                      <p className="fs-p9">{getPhone(inv)}</p>
                    </div>

                    {/* Roll / % */}
                    <div style={{ flex: 2 }}>
                      <p className="fs-p9">{getRollNo(inv)}</p>
                      <p className="fs-p8 text-secondary">{getPercent(inv)}%</p>
                    </div>

                    {/* Job Title */}
                    <div style={{ flex: 2 }}>
                      <p className="bold fs-p9">{getJobTitle(inv)}</p>
                    </div>

                    {/* Accepted On */}
                    <div style={{ flex: 2 }}>
                      <p className="fs-p9">{formatDate(offer?.date)}</p>
                    </div>

                    {/* Status badge */}
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: 10,
                        background: "rgba(22,163,74,0.1)", color: "#16a34a",
                      }}>Accepted</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      )}

      {/* ── Send Offer Modal ── */}
      {showModal && modalInv && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setModalInv(null); }}>
          <div className="card p-5" style={{ width: 480, maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="row space-between items-center mb-3">
              <h3 className="bold">Send Offer Letter</h3>
              <span className="cursor-pointer fs-4 text-secondary"
                onClick={() => { setShowModal(false); setModalInv(null); }}>x</span>
            </div>

            {/* Candidate preview */}
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
              }}>{getInitial(modalInv)}</div>
              <div>
                <p className="bold fs-p9">{getName(modalInv)}</p>
                <p className="fs-p9 text-secondary">{getDept(modalInv)} · {getJobTitle(modalInv)}</p>
                <p className="fs-p9 text-secondary">{getEmail(modalInv)}</p>
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
              <p className="fs-p8 text-secondary mt-1">Upload the signed offer letter PDF.</p>
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

            {modalMsg?.text && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem",
                background: modalMsg.type === "success" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                border: `1px solid ${modalMsg.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                color: modalMsg.type === "success" ? "#16a34a" : "#dc2626",
              }}>{modalMsg.text}</div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSendOffer} disabled={sending || !offerFile} style={{
                flex: 1, padding: "10px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                background: sending || !offerFile ? "var(--gray-400)" : "#0ea5e9",
                color: "#fff", border: "none",
                cursor: sending || !offerFile ? "not-allowed" : "pointer",
              }}>{sending ? "Sending..." : "Send Offer Letter"}</button>
              <button className="btn btn-muted" style={{ flex: 1 }}
                onClick={() => { setShowModal(false); setModalInv(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyOffers;