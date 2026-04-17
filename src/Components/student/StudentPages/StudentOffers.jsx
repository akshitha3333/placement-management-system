import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function StudentOffers() {
  const [offers,   setOffers]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── Derive offers from the interview chain ─────────────
  // GET /api/job/job-suggestions
  // → GET /api/job/job-suggestions/{id}/job-applications
  // → GET /api/job/job-application/{id}/interview
  // filter where interview.result === "Selected"
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        setError("");

        // Step 1
        const sugRes  = await axios.get(rest.jobSuggestions, header);
        const sugList = sugRes.data?.data || sugRes.data || [];
        const sugs    = Array.isArray(sugList) ? sugList : [];

        // Step 2
        const appArrays = await Promise.all(
          sugs.map(async (sug) => {
            const sugId = sug.jobSuggestionId || sug.id;
            try {
              const res  = await axios.get(
                `${rest.jobSuggestions}/${sugId}/job-applications`,
                header
              );
              const apps = res.data?.data || res.data || [];
              return Array.isArray(apps)
                ? apps.map((a) => ({ ...a, _sug: sug }))
                : [];
            } catch {
              return [];
            }
          })
        );
        const allApps = appArrays.flat();

        // Step 3
        const invArrays = await Promise.all(
          allApps.map(async (app) => {
            const appId = app.jobApplicationId || app.id;
            try {
              const res  = await axios.get(
                `${rest.jobApplications}/${appId}/interview`,
                header
              );
              const inv  = res.data?.data || res.data;
              const list = Array.isArray(inv) ? inv : inv ? [inv] : [];
              return list
                .filter((i) => i.result === "Selected")
                .map((i) => ({ ...i, _app: app, _sug: app._sug }));
            } catch {
              return [];
            }
          })
        );

        setOffers(invArrays.flat());
      } catch (err) {
        console.error("fetchOffers:", err);
        setError("Failed to load offers.");
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const getCompanyName = (offer) =>
    offer._sug?.jobPostModel?.companyModel?.companyName || "Company";

  const getJobTitle = (offer) =>
    offer._sug?.jobPostModel?.title ||
    offer._sug?.jobPostModel?.tiitle ||
    "Job";

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">My Offers</h2>
      <p className="fs-p9 text-secondary mb-4">
        Interview results where you were selected
      </p>

      {/* ── Stats ── */}
      <div className="row mb-4">
        {[
          { label: "Interviews Cleared", value: offers.length,  color: "#16a34a" },
          { label: "Companies",          value: new Set(offers.map(getCompanyName)).size, color: "#325563" },
        ].map((s, i) => (
          <div className="col-3 p-2" key={i}>
            <div className="card p-4 stat-card text-center">
              <h2 className="bold" style={{ color: s.color }}>{loading ? "…" : s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card p-5 text-center"><p>Loading your offers...</p></div>
      ) : error ? (
        <div className="card p-4"><p className="text-danger">{error}</p></div>
      ) : offers.length === 0 ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>🎯</p>
          <p className="bold mt-2">No offers yet</p>
          <p className="text-secondary fs-p9">
            Offers appear here once you clear an interview (result = Selected).
            Keep applying to recommended jobs!
          </p>

          {/* Tips */}
          <div
            className="card p-4 mt-4"
            style={{ background: "linear-gradient(135deg, #f0f9f4, #e8f4f8)", border: "none" }}
          >
            <h4 className="mb-2">💡 Tips to get placed</h4>
            <div className="row" style={{ gap: "10px" }}>
              {[
                "Apply to all recommended jobs from your tutor",
                "Keep your resume and skills updated",
                "Prepare well before every interview",
                "Check the Interviews tab for your schedule",
              ].map((tip, i) => (
                <div
                  key={i}
                  className="fs-p9 p-2 br-md"
                  style={{
                    background: "white",
                    flex:       "1 1 calc(48% - 5px)",
                    border:     "1px solid var(--border-color)",
                  }}
                >
                  ✅ {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <h4 className="mb-3">🎉 Selected in Interviews</h4>
          <div className="row" style={{ gap: "16px", flexWrap: "wrap" }}>
            {offers.map((offer, idx) => (
              <div
                key={offer.interviewId || idx}
                className="card p-5 stat-card"
                style={{
                  width:      "calc(48% - 16px)",
                  minWidth:   "280px",
                  borderLeft: "4px solid #16a34a",
                }}
              >
                <div className="row space-between items-center mb-3">
                  <div>
                    <h4 className="bold">{getCompanyName(offer)}</h4>
                    <p className="fs-p9 text-secondary">{getJobTitle(offer)}</p>
                  </div>
                  <span
                    className="status-item"
                    style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}
                  >
                    ✅ Selected
                  </span>
                </div>

                <div className="row mb-3" style={{ gap: "20px" }}>
                  <div>
                    <p className="fs-p8 text-secondary">Interview Date</p>
                    <p className="bold">{formatDate(offer.interviewDate)}</p>
                  </div>
                  <div>
                    <p className="fs-p8 text-secondary">Mode</p>
                    <p className="bold">{offer.mode || "Online"}</p>
                  </div>
                </div>

                {offer.notes && (
                  <div
                    className="p-2 br-md mb-3"
                    style={{
                      background: "rgba(22,163,74,0.05)",
                      border:     "1px solid rgba(22,163,74,0.2)",
                    }}
                  >
                    <p className="fs-p8">📝 {offer.notes}</p>
                  </div>
                )}

                <div
                  className="p-2 br-md"
                  style={{
                    background: "rgba(22,163,74,0.08)",
                    border:     "1px solid rgba(22,163,74,0.2)",
                  }}
                >
                  <p className="fs-p9 bold" style={{ color: "#16a34a" }}>
                    🎊 Congratulations! You have been selected by {getCompanyName(offer)}.
                  </p>
                  <p className="fs-p8 text-secondary mt-1">
                    Await the official offer letter from the company.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default StudentOffers;