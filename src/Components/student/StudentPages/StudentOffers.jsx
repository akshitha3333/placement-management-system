import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function StudentOffers() {
  const [offers,         setOffers]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [offerLetterMap, setOfferLetterMap] = useState({});
  const [actionLoading,  setActionLoading]  = useState({});
  const [actionMsg,      setActionMsg]      = useState({});

  const getHeaders = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || localStorage.getItem("token") || ""}`,
    },
  });

  const baseApi              = () => rest.jobApplications.replace(/\/job-applications.*$/, "");
  const offerLetterGetUrl    = (id) => `${baseApi()}/interview-schedule/${id}/offer-letter`;
  const offerLetterAcceptUrl = (id) => `${baseApi()}/offer-letter/${id}/accept`;
  const offerLetterRejectUrl = (id) => `${baseApi()}/offer-letter/${id}/reject`;

  useEffect(() => { fetchOffers(); }, []);

  const fetchOffers = async () => {
    setLoading(true);
    setError("");
    try {
      // Step 1: all job applications for this student
      const appsRes = await axios.get(rest.jobApplications, getHeaders());
      const apps    = Array.isArray(appsRes.data?.data) ? appsRes.data.data
                    : Array.isArray(appsRes.data)        ? appsRes.data : [];

      // Step 2: interviews per application — keep only status === "Selected"
      // NOTE: backend InterviewScheduleStatus enum value is "Selected"
      const invArrays = await Promise.all(
        apps.map(async (app) => {
          const appId = app.jobApplicationId || app.id;
          try {
            const res  = await axios.get(`${baseApi()}/job-application/${appId}/interview`, getHeaders());
            const data = res.data?.data || res.data;
            const list = Array.isArray(data) ? data : data ? [data] : [];
            // Filter by both "Selected" and "OFFER_SENT" so student still sees
            // their card after the company sends the offer letter
            return list
              .filter((i) => { const s = (i.status || "").toLowerCase(); return s === "selected" || s === "offer_sent"; })
              .map((i) => ({ ...i, _app: app }));
          } catch { return []; }
        })
      );

      const selected = invArrays.flat();
      console.log("Filtered selected/offer_sent interviews:", selected.length, selected.map(i => ({ id: i.interviewId, status: i.status })));
      setOffers(selected);
      await fetchAllOfferLetters(selected);
    } catch (err) {
      setError("Failed to load offers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOfferLetters = async (selectedOffers) => {
    const results = await Promise.all(
      selectedOffers.map(async (offer) => {
        const interviewId = offer.interviewId || offer.id;
        try {
          const res  = await axios.get(offerLetterGetUrl(interviewId), getHeaders());
          const data = res.data?.data || res.data;
          if (data && (data.offerLetterId || data.id)) {
            return {
              interviewId,
              offerLetterId: data.offerLetterId || data.id,
              status:        data.status        || null,
              // offerLetter field now contains base64 PDF string from backend
              pdfBase64:     data.offerLetter   || null,
              date:          data.date          || null,
            };
          }
          return { interviewId, offerLetterId: null, status: null, pdfBase64: null };
        } catch {
          return { interviewId, offerLetterId: null, status: null, pdfBase64: null };
        }
      })
    );
    const map = {};
    results.forEach((r) => { map[r.interviewId] = r; });
    setOfferLetterMap(map);
  };

  const refetchSingleOffer = async (interviewId) => {
    try {
      const res  = await axios.get(offerLetterGetUrl(interviewId), getHeaders());
      const data = res.data?.data || res.data;
      if (data && (data.offerLetterId || data.id)) {
        setOfferLetterMap((prev) => ({
          ...prev,
          [interviewId]: {
            interviewId,
            offerLetterId: data.offerLetterId || data.id,
            status:        data.status        || null,
            pdfBase64:     data.offerLetter   || null,
            date:          data.date          || null,
          },
        }));
      }
    } catch { /* keep existing state */ }
  };

  const openOfferLetter = (pdfBase64, title = "Offer Letter") => {
    if (!pdfBase64) { alert("Offer letter PDF not available."); return; }
    try {
      // Strip data URL prefix if present, keep only raw base64
      const raw = pdfBase64.startsWith("data:")
        ? pdfBase64.split(",")[1]
        : pdfBase64;

      // Convert base64 → Uint8Array → Blob → Blob URL
      // Blob URLs work in all browsers (Firefox blocks data: URLs in new tabs)
      const binary = atob(raw);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob    = new Blob([bytes], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      const win = window.open(blobUrl, "_blank");
      if (!win) {
        // Fallback: download the file if popup is blocked
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${title}.pdf`;
        a.click();
      }
      // Revoke after 60s to free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error("openOfferLetter error:", err);
      alert("Could not open the offer letter. Please try again.");
    }
  };

  const handleAccept = async (interviewId, offerLetterId) => {
    setActionLoading((p) => ({ ...p, [offerLetterId]: true }));
    setActionMsg((p)     => ({ ...p, [offerLetterId]: { text: "", type: "" } }));
    try {
      await axios.get(offerLetterAcceptUrl(offerLetterId), getHeaders());
      await refetchSingleOffer(interviewId);
      setActionMsg((p) => ({ ...p, [offerLetterId]: { text: "Offer accepted successfully!", type: "success" } }));
    } catch (err) {
      setActionMsg((p) => ({
        ...p,
        [offerLetterId]: { text: err.response?.data?.message || "Failed to accept offer.", type: "error" },
      }));
    } finally {
      setActionLoading((p) => ({ ...p, [offerLetterId]: false }));
    }
  };

  const handleReject = async (interviewId, offerLetterId) => {
    if (!window.confirm("Are you sure you want to reject this offer?")) return;
    setActionLoading((p) => ({ ...p, [offerLetterId]: true }));
    setActionMsg((p)     => ({ ...p, [offerLetterId]: { text: "", type: "" } }));
    try {
      await axios.get(offerLetterRejectUrl(offerLetterId), getHeaders());
      await refetchSingleOffer(interviewId);
      setActionMsg((p) => ({ ...p, [offerLetterId]: { text: "Offer rejected.", type: "error" } }));
    } catch (err) {
      setActionMsg((p) => ({
        ...p,
        [offerLetterId]: { text: err.response?.data?.message || "Failed to reject offer.", type: "error" },
      }));
    } finally {
      setActionLoading((p) => ({ ...p, [offerLetterId]: false }));
    }
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
  const getCompanyName = (inv) => getJobPost(inv)?.companyModel?.companyName || "Company";
  const getJobTitle    = (inv) => getJobPost(inv)?.tiitle || getJobPost(inv)?.title || "—";

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const OFFER_STATUS_CFG = {
    Pending:  { label: "Awaiting Your Response", bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9" },
    Accepted: { label: "Offer Accepted",          bg: "rgba(22,163,74,0.1)",   color: "#16a34a" },
    Rejected: { label: "Offer Rejected",          bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
  };

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">My Offers</h2>
      <p className="fs-p9 text-secondary mb-4">Interviews where you were selected</p>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Interviews Cleared", value: offers.length,                                                               color: "#16a34a" },
          { label: "Companies",          value: new Set(offers.map(getCompanyName)).size,                                    color: "#325563" },
          { label: "Offers Received",    value: Object.values(offerLetterMap).filter((o) => o.offerLetterId).length,         color: "#0ea5e9" },
          { label: "Offers Accepted",    value: Object.values(offerLetterMap).filter((o) => o.status === "Accepted").length, color: "#16a34a" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4 stat-card text-center">
              <h2 className="bold" style={{ color: s.color }}>{loading ? "..." : s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary mt-2">Loading your offers...</p>
        </div>
      ) : error ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button className="btn btn-primary mt-3 w-auto" style={{ padding: "8px 20px" }} onClick={fetchOffers}>
            Retry
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No offers yet</p>
          <p className="text-secondary fs-p9 mt-1">
            Offers appear here once you are marked as Selected in an interview.
          </p>
        </div>
      ) : (
        <>
          <div className="row space-between items-center mb-3">
            <h4 className="bold">Selected Interviews ({offers.length})</h4>
            <button onClick={fetchOffers} style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)",
              background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
            }}>Refresh</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {offers.map((offer, idx) => {
              const interviewId = offer.interviewId || offer.id || idx;
              const olData      = offerLetterMap[interviewId];
              const olStatus    = olData?.status        || null;
              const olId        = olData?.offerLetterId || null;
              const olPdf       = olData?.pdfBase64     || null;
              const olSent      = !!(olId);
              const statusCfg   = OFFER_STATUS_CFG[olStatus] || null;
              const isActing    = actionLoading[olId];
              const msg         = actionMsg[olId];

              return (
                <div key={interviewId} className="card p-4" style={{ borderTop: "4px solid #16a34a" }}>

                  {/* Header */}
                  <div className="row space-between items-center mb-3">
                    <div>
                      <h4 className="bold">{getCompanyName(offer)}</h4>
                      <p className="fs-p9 text-secondary">{getJobTitle(offer)}</p>
                    </div>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, padding: "4px 10px", borderRadius: 10,
                      background: "rgba(22,163,74,0.1)", color: "#16a34a",
                    }}>Selected</span>
                  </div>

                  {/* Student info */}
                  <div style={{ marginBottom: 14 }}>
                    <p className="fs-p9 bold">{getName(offer)}</p>
                    <p className="fs-p8 text-secondary">{getDept(offer)} — {getEmail(offer)}</p>
                  </div>

                  {/* Interview info */}
                  <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                    <div>
                      <p className="fs-p8 text-secondary">Interview Date</p>
                      <p className="bold fs-p9">{formatDate(offer.interviewDateTime || offer.InterviewDateTime)}</p>
                    </div>
                    <div>
                      <p className="fs-p8 text-secondary">Mode</p>
                      <p className="bold fs-p9">{offer.interviewMode || "—"}</p>
                    </div>
                  </div>

                  {/* Congrats */}
                  <div style={{
                    background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)",
                    borderRadius: 8, padding: "10px 12px", marginBottom: 14,
                  }}>
                    <p className="fs-p9 bold" style={{ color: "#16a34a" }}>
                      Congratulations! You have been selected by {getCompanyName(offer)}.
                    </p>
                    <p className="fs-p8 text-secondary mt-1">
                      {olSent
                        ? "The company has sent you an offer letter below."
                        : "Awaiting the official offer letter from the company."}
                    </p>
                  </div>

                  {/* Offer Letter Section */}
                  {olSent ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                      {statusCfg && (
                        <div style={{
                          padding: "8px 12px", borderRadius: 8,
                          background: statusCfg.bg, border: `1px solid ${statusCfg.color}40`,
                        }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: statusCfg.color }}>
                            {statusCfg.label}
                          </span>
                        </div>
                      )}

                      {olPdf ? (
                        <button
                          onClick={() => openOfferLetter(olPdf, `Offer Letter - ${getCompanyName(offer)}`)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", background: "var(--gray-100)",
                            borderRadius: 8, cursor: "pointer", width: "100%",
                            border: "1px solid rgba(50,85,99,0.2)", textAlign: "left",
                          }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: 6, background: "#325563",
                            color: "#fff", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, flexShrink: 0,
                          }}>PDF</div>
                          <div>
                            <p className="bold fs-p8" style={{ color: "#325563" }}>View Offer Letter</p>
                            <p className="fs-p8 text-secondary">Click to open</p>
                          </div>
                        </button>
                      ) : (
                        <p className="fs-p8 text-secondary">Offer letter PDF not available yet.</p>
                      )}

                      {msg?.text && (
                        <div style={{
                          padding: "8px 12px", borderRadius: 8, fontSize: "0.82rem",
                          background: msg.type === "success" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                          border: `1px solid ${msg.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                          color: msg.type === "success" ? "#16a34a" : "#dc2626",
                        }}>
                          {msg.text}
                        </div>
                      )}

                      {/* Accept / Reject only when no decision made yet */}
                      {(olStatus === null || olStatus === "Pending") && olId && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleAccept(interviewId, olId)}
                            disabled={isActing}
                            style={{
                              flex: 1, padding: "9px", borderRadius: 8,
                              fontSize: "0.85rem", fontWeight: 600,
                              background: isActing ? "var(--gray-400)" : "#16a34a",
                              color: "#fff", border: "none",
                              cursor: isActing ? "not-allowed" : "pointer",
                            }}
                          >
                            {isActing ? "Processing..." : "Accept Offer"}
                          </button>
                          <button
                            onClick={() => handleReject(interviewId, olId)}
                            disabled={isActing}
                            style={{
                              flex: 1, padding: "9px", borderRadius: 8,
                              fontSize: "0.85rem", fontWeight: 600, background: "#fff",
                              color: isActing ? "var(--gray-400)" : "#dc2626",
                              border: `1px solid ${isActing ? "var(--gray-400)" : "#dc2626"}`,
                              cursor: isActing ? "not-allowed" : "pointer",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      padding: "10px 14px", borderRadius: 8,
                      background: "rgba(107,114,128,0.06)",
                      border: "1px solid rgba(107,114,128,0.2)",
                    }}>
                      <p className="fs-p9" style={{ color: "#6b7280", fontWeight: 600 }}>
                        Offer letter not sent yet
                      </p>
                      <p className="fs-p8 text-secondary mt-1">
                        The company will send you an official offer letter soon.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default StudentOffers;