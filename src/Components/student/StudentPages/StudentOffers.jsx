import { useState, useEffect } from "react";
import axios from "axios";

function StudentOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("studentToken")}` } };

  useEffect(() => {
    axios.get("/api/student/offers", header)
      .then(res => { setOffers(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const respond = (id, status) => {
    axios.patch(`/api/student/offers/${id}/respond`, { status }, header)
      .then(() => setOffers(prev => prev.map(o => o.id === id ? { ...o, studentStatus: status } : o)))
      .catch(console.error);
  };

  const accepted = offers.filter(o => o.studentStatus === "Accepted");
  const pending = offers.filter(o => !o.studentStatus || o.studentStatus === "Pending");
  const rejected = offers.filter(o => o.studentStatus === "Rejected");

  return (
    <div className="p-4">
      <h2 className="fs-5 bold mb-1">My Offers</h2>
      <p className="fs-p9 text-secondary mb-4">View and respond to offer letters</p>

      {loading ? <p>Loading...</p> : offers.length === 0 ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>🎯</p>
          <p className="bold mt-2">No offers yet</p>
          <p className="text-secondary fs-p9">Offers will appear here once companies release them</p>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-3">⏳ Pending Response ({pending.length})</h4>
              <div className="row" style={{ gap: "16px" }}>
                {pending.map(offer => (
                  <div key={offer.id} className="card p-5 stat-card" style={{ width: "calc(48% - 16px)", borderLeft: "4px solid #f59e0b" }}>
                    <div className="row space-between items-center mb-3">
                      <div>
                        <h4 className="bold">{offer.companyName}</h4>
                        <p className="fs-p9 text-secondary">{offer.jobTitle}</p>
                      </div>
                      <span className="status-item fs-p8" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Awaiting Response</span>
                    </div>

                    <div className="row mb-3" style={{ gap: "20px" }}>
                      <div>
                        <p className="fs-p8 text-secondary">Package</p>
                        <p className="bold fs-3 text-success">{offer.package} LPA</p>
                      </div>
                      <div>
                        <p className="fs-p8 text-secondary">Joining Date</p>
                        <p className="bold">{offer.joiningDate || "TBD"}</p>
                      </div>
                      <div>
                        <p className="fs-p8 text-secondary">Released On</p>
                        <p className="fs-p9">{offer.releasedDate}</p>
                      </div>
                    </div>

                    {offer.notes && (
                      <div className="p-2 br-md mb-3" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <p className="fs-p8">📝 {offer.notes}</p>
                      </div>
                    )}

                    <div className="row" style={{ gap: "10px" }}>
                      <button className="btn btn-primary" style={{ padding: "10px" }}
                        onClick={() => respond(offer.id, "Accepted")}>🎉 Accept Offer</button>
                      <button className="btn btn-danger" style={{ padding: "10px" }}
                        onClick={() => respond(offer.id, "Rejected")}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted */}
          {accepted.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-3">✅ Accepted Offers</h4>
              <div className="row" style={{ gap: "16px" }}>
                {accepted.map(offer => (
                  <div key={offer.id} className="card p-4" style={{ width: "calc(48% - 16px)", borderLeft: "4px solid #16a34a" }}>
                    <div className="row space-between items-center">
                      <div>
                        <h4 className="bold">{offer.companyName}</h4>
                        <p className="fs-p9 text-secondary">{offer.jobTitle}</p>
                      </div>
                      <span className="status-item" style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>✅ Accepted</span>
                    </div>
                    <p className="bold text-success mt-2">{offer.package} LPA • Joining: {offer.joiningDate || "TBD"}</p>
                    <p className="fs-p9 text-secondary mt-1">🎊 Congratulations on your placement!</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <div>
              <h4 className="mb-3 text-secondary">Declined Offers</h4>
              {rejected.map(offer => (
                <div key={offer.id} className="card p-3 mb-2" style={{ opacity: 0.6 }}>
                  <div className="row space-between items-center">
                    <div>
                      <span className="bold">{offer.companyName}</span>
                      <span className="fs-p9 text-secondary ms-2">{offer.jobTitle} • {offer.package} LPA</span>
                    </div>
                    <span className="status-item fs-p8" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>Declined</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StudentOffers;
