import { useEffect, useState } from "react";
import axios from "axios";
import rest from "../../../Rest";
import Cookies from "js-cookie";

function AdminCompanies() {
  const [companies,     setCompanies]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState("");
  const [selectedCompany, setSelected]    = useState(null);
  const [showModal,     setShowModal]     = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toastMsg,      setToastMsg]      = useState(""); // success/fail toast

  const getHeader = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || ""}`,
    },
  });

  const resolveStatus = (s) => {
    const val = (s || "").toString().trim().toUpperCase();
    return val === "VERIFIED" ? "VERIFIED" : "UNVERIFIED";
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    axios.get(rest.companys, getHeader())
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data
                   : Array.isArray(res.data)        ? res.data : [];
        console.log("Companies fetched:", list.length, list);
        setCompanies(list.map((c) => ({ ...c, status: resolveStatus(c.status) })));
      })
      .catch((err) => {
        console.error("Fetch companies error:", err.response?.data || err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const viewDetails = async (id) => {
    try {
      const res  = await axios.get(`${rest.companys}/${id}`, getHeader());
      const data = res.data?.data || res.data;
      console.log("Company detail:", data);
      setSelected({ ...data, status: resolveStatus(data.status) });
      setShowModal(true);
    } catch (err) {
      console.error("Fetch company detail error:", err.response?.data || err.message);
    }
  };

  const toggleVerify = async (id, currentStatus) => {
    setActionLoading(id);
    const newStatus = currentStatus === "VERIFIED" ? "UNVERIFIED" : "VERIFIED";
    try {
      // New backend: GET /api/actors/companys/{id}/verify  (was PATCH before)
      const res = await axios.get(`${rest.companys}/${id}/verify`, getHeader());
      console.log("Verify toggle response:", res.data);

      setCompanies((prev) =>
        prev.map((c) => c.companyId === id ? { ...c, status: newStatus } : c)
      );
      if (selectedCompany?.companyId === id) {
        setSelected((prev) => ({ ...prev, status: newStatus }));
      }

      if (newStatus === "VERIFIED") {
        showToast(`Company verified. Confirmation email sent to company.`);
      } else {
        showToast(`Company unverified.`);
      }
    } catch (err) {
      console.error("Verify toggle error:", err.response?.data || err.message);
      showToast("Failed to update status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const StatusBadge = ({ s }) => {
    const val = resolveStatus(s);
    return (
      <span style={{
        padding: "4px 12px", borderRadius: 20, fontWeight: 600,
        fontSize: "0.75rem", display: "inline-block",
        background: val === "VERIFIED" ? "rgba(22,163,74,0.12)" : "rgba(156,163,175,0.15)",
        color:      val === "VERIFIED" ? "var(--success)"       : "var(--gray-500)",
      }}>
        {val === "VERIFIED" ? "Verified" : "Unverified"}
      </span>
    );
  };

  const ToggleButton = ({ comp, fullWidth = false }) => {
    const id      = comp.companyId;
    const status  = resolveStatus(comp.status);
    const busy    = actionLoading === id;
    const isVerified = status === "VERIFIED";

    return (
      <button
        disabled={busy}
        onClick={() => toggleVerify(id, status)}
        title={isVerified ? "Click to unverify" : "Click to verify — email will be sent"}
        style={{
          width: fullWidth ? "100%" : "auto",
          padding: fullWidth ? "10px 16px" : "5px 14px",
          borderRadius: 8,
          fontSize: fullWidth ? "0.88rem" : "0.78rem",
          fontWeight: 600,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
          border: isVerified ? "1px solid #16a34a" : "1px solid #9ca3af",
          background: isVerified ? "rgba(22,163,74,0.12)" : "rgba(156,163,175,0.12)",
          color: isVerified ? "var(--success)" : "#6b7280",
          transition: "all 0.15s",
        }}
      >
        {busy ? "Updating..." : isVerified ? "Verified" : "Unverified"}
      </button>
    );
  };

  const Avatar = ({ name, logo }) => {
    if (logo) {
      return (
        <img src={logo} alt={name} style={{
          width: 36, height: 36, borderRadius: 8, objectFit: "cover",
          flexShrink: 0, border: "1px solid var(--border-color)",
        }} onError={(e) => { e.target.style.display = "none"; }} />
      );
    }
    const initials = (name || "??").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: "rgba(14,165,233,0.12)", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "0.8rem", color: "var(--info)",
      }}>
        {initials}
      </div>
    );
  };

  const filtered = filterStatus
    ? companies.filter((c) => resolveStatus(c.status) === filterStatus)
    : companies;

  const verifiedCount   = companies.filter((c) => resolveStatus(c.status) === "VERIFIED").length;
  const unverifiedCount = companies.filter((c) => resolveStatus(c.status) === "UNVERIFIED").length;

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: "var(--primary)", color: "#fff",
          padding: "12px 20px", borderRadius: 10, fontWeight: 600,
          fontSize: "0.85rem", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="row items-center space-between mb-4">
        <div>
          <h2 className="fs-5 bold">Company Management</h2>
          <p className="fs-p9 text-secondary">Review and verify company registrations. Email is sent automatically on verification.</p>
        </div>
        <div className="row items-center" style={{ gap: 10 }}>
          <div style={{
            padding: "5px 14px", borderRadius: 8, fontWeight: 600,
            fontSize: "0.8rem", background: "rgba(156,163,175,0.15)", color: "var(--gray-600)",
          }}>
            Unverified: {unverifiedCount}
          </div>
          <div style={{
            padding: "5px 14px", borderRadius: 8, fontWeight: 600,
            fontSize: "0.8rem", background: "rgba(22,163,74,0.12)", color: "var(--success)",
          }}>
            Verified: {verifiedCount}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-3">
        <select
          className="form-control w-20"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Companies</option>
          <option value="UNVERIFIED">Unverified</option>
          <option value="VERIFIED">Verified</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-3">
        {loading ? (
          <p className="text-center p-3 text-secondary">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center p-3 text-secondary">No companies found.</p>
        ) : (
          <table className="w-100">
            <thead>
              <tr className="text-secondary fs-p9">
                <th>#</th>
                <th>Company</th>
                <th>Industry</th>
                <th>Email</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comp, idx) => (
                <tr key={comp.companyId} className="hover-bg">
                  <td className="fs-p9 text-secondary">{idx + 1}</td>
                  <td>
                    <div className="row items-center" style={{ gap: 10 }}>
                      <Avatar name={comp.companyName} logo={comp.logo} />
                      <div>
                        <p className="bold fs-p9" style={{ margin: 0 }}>{comp.companyName}</p>
                        <p className="fs-p8 text-secondary" style={{ margin: 0 }}>
                          CMP{String(comp.companyId).padStart(3, "0")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="fs-p9">{comp.industryType || "—"}</td>
                  <td className="fs-p9">{comp.email        || "—"}</td>
                  <td className="fs-p9">{comp.location     || "—"}</td>
                  <td><StatusBadge s={comp.status} /></td>
                  <td>
                    <div className="row items-center" style={{ gap: 8 }}>
                      <button
                        className="btn btn-sm btn-info"
                        style={{ width: "auto", padding: "5px 12px", borderRadius: 8, fontSize: "0.78rem" }}
                        onClick={() => viewDetails(comp.companyId)}
                      >
                        View
                      </button>
                      <ToggleButton comp={comp} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedCompany && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card p-5"
            style={{ width: 520, maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row items-center space-between mb-3">
              <div className="row items-center" style={{ gap: 12 }}>
                <Avatar name={selectedCompany.companyName} logo={selectedCompany.logo} />
                <div>
                  <p className="bold fs-4" style={{ margin: 0 }}>{selectedCompany.companyName}</p>
                  <StatusBadge s={selectedCompany.status} />
                </div>
              </div>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setShowModal(false)}>x</span>
            </div>

            <hr style={{ marginBottom: 16, borderColor: "var(--border-color)" }} />

            <p className="fs-p8 text-secondary bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Registered Details
            </p>

            <table className="w-100">
              <tbody>
                {[
                  ["Company ID",  `CMP${String(selectedCompany.companyId).padStart(3, "0")}`],
                  ["Industry",    selectedCompany.industryType || "—"],
                  ["Email",       selectedCompany.email        || "—"],
                  ["Phone",       selectedCompany.phone        || "—"],
                  ["Website",     selectedCompany.website      || "—"],
                  ["Location",    selectedCompany.location     || "—"],
                  ["About",       selectedCompany.about        || "—"],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="text-secondary fs-p9" style={{ width: 130, verticalAlign: "top", paddingBottom: 8, paddingRight: 8 }}>
                      {label}
                    </td>
                    <td className="fs-p9" style={{ paddingBottom: 8 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr style={{ margin: "16px 0", borderColor: "var(--border-color)" }} />

            <div style={{
              background: "rgba(14,165,233,0.07)",
              border: "1px solid rgba(14,165,233,0.2)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 14,
            }}>
              <p className="fs-p9" style={{ color: "var(--info)" }}>
                Clicking Verify will toggle the company status and automatically send a confirmation email to {selectedCompany.email}.
              </p>
            </div>

            <ToggleButton comp={selectedCompany} fullWidth={true} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCompanies;