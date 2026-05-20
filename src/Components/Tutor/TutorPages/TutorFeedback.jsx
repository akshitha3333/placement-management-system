import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const getHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});


const ratingCfg = (r) => ({
  Excellent:           { bg: "rgba(22,163,74,0.1)",  color: "#16a34a" },
  Good:                { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
  Average:             { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  "Needs Improvement": { bg: "rgba(220,38,38,0.1)",  color: "#dc2626" },
}[r] || { bg: "rgba(107,114,128,0.1)", color: "#6b7280" });


const parseFb = (fb) => {
  const raw = fb.feedback || "";
  if (raw.includes("||sName:")) {
    return {
      rating:      (raw.match(/^\[(.+?)\]/) || [])[1]          || "Good",
      studentName: (raw.match(/\|\|sName:(.+?)\|\|/) || [])[1] || "—",
      tutorName:   (raw.match(/\|\|tName:(.+?)\|\|/) || [])[1] || "—",
      text:        (raw.match(/\|\|text:(.+)$/s) || [])[1]     || "",
    };
  }
  return {
    rating:      (raw.match(/^\[(.+?)\]/) || [])[1] || "Good",
    studentName: "—", tutorName: "—",
    text: raw.replace(/^\[.+?\]\s*/, ""),
  };
};


function TutorFeedback() {
  const [feedbacks,    setFeedbacks]    = useState([]);
  const [companies,    setCompanies]    = useState({}); 
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [search,       setSearch]       = useState("");

  useEffect(() => { fetchFeedbacks(); }, []);

  const fetchFeedbacks = async () => {
    setLoading(true); setError("");
    try {
      
      const [res, compRes] = await Promise.all([
        axios.get(rest.feedback,  getHeaders()),
        axios.get(rest.companys,  getHeaders()),
      ]);

    
      const compList = compRes.data?.data || compRes.data || [];
      const compMap  = {};
      (Array.isArray(compList) ? compList : []).forEach((c) => {
        compMap[String(c.companyId || c.id)] = c.companyName || c.name || `Company #${c.companyId}`;
      });
      setCompanies(compMap);
      console.log("Companies map:", compMap);

      const fbList = res.data?.data || res.data || [];
      const all    = Array.isArray(fbList) ? fbList : [];
      console.log("TutorFeedback — raw feedbacks:", all);

     
      const incoming = all.filter(
        (f) => f.feedback_by_role === "COMPANY" && f.feedback_to_role === "TUTOR"
      );
      console.log("TutorFeedback — incoming:", incoming);
      setFeedbacks(incoming);
    } catch (err) {
      console.error("TutorFeedback fetch:", err.response?.data || err.message);
      setError("Failed to load feedback. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

 
  const countRating = (r) => feedbacks.filter((f) => parseFb(f).rating === r).length;

  
  const filtered = feedbacks.filter((f) => {
    const { rating, studentName } = parseFb(f);
    const matchRating  = !filterRating || rating === filterRating;
    const matchSearch  = !search || studentName.toLowerCase().includes(search.toLowerCase());
    return matchRating && matchSearch;
  });

  
  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Header */}
      <div className="mb-4">
        <h2 className="fs-5 bold mb-1">Company Feedback</h2>
        <p className="fs-p9 text-secondary">
          Feedback sent by companies about your students' interview performance
        </p>
      </div>

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 12 }}>
        {[
          { label: "Total Received",    value: feedbacks.length,                color: "#325563" },
          { label: "Excellent",         value: countRating("Excellent"),         color: "#16a34a" },
          { label: "Good",              value: countRating("Good"),              color: "#0ea5e9" },
          { label: "Needs Improvement", value: countRating("Needs Improvement"), color: "#dc2626" },
        ].map((s, i) => (
          <div className="col p-0" key={i}>
            <div className="card p-3 text-center">
              <h2 className="bold" style={{ color: s.color, fontSize: "1.8rem" }}>
                {loading ? "…" : s.value}
              </h2>
              <p className="fs-p8 text-secondary mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="row space-between items-center mb-3" style={{ flexWrap: "wrap", gap: 10 }}>
        <h4 className="bold">Feedback Records</h4>
        <div className="row items-center" style={{ gap: 10 }}>
          <input
            className="form-control"
            style={{ width: 200 }}
            placeholder="Search student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-control"
            style={{ width: 180 }}
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="">All Ratings</option>
            <option>Excellent</option>
            <option>Good</option>
            <option>Average</option>
            <option>Needs Improvement</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary fs-p9">Loading feedback...</p>
        </div>
      ) : error ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }} className="fs-p9">{error}</p>
          <button className="btn btn-primary mt-3 w-auto" style={{ padding: "8px 20px" }}
            onClick={fetchFeedbacks}>Retry</button>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No company feedback yet</p>
          <p className="text-secondary fs-p9 mt-1">
            When a company sends feedback about one of your students, it will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="text-secondary fs-p9">No feedback matches the selected filters</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((fb, i) => {
            const { rating, studentName, text } = parseFb(fb);
            const { bg, color } = ratingCfg(rating);
            return (
              <div key={fb.feedbackId || i} className="card p-4"
                style={{ borderLeft: `4px solid ${color}` }}>
                <div className="row space-between items-center mb-2">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "0.85rem",
                    }}>
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="bold fs-p9">{studentName}</p>
                      <p className="fs-p8 text-secondary">
                        From: {companies[String(fb.feedbackFrom)] || `Company #${fb.feedbackFrom}`}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    background: bg, color, fontWeight: 600,
                    padding: "3px 12px", borderRadius: 20, fontSize: "0.75rem",
                  }}>
                    {rating}
                  </span>
                </div>
                <p className="fs-p9" style={{ color: "#374151", lineHeight: 1.6 }}>{text}</p>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default TutorFeedback;