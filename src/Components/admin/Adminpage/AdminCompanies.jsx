import { useEffect, useState } from "react";
import axios from "axios";
import rest from "../../../Rest";
import Cookies from 'js-cookie';

function AdminCompanies() {
  const [companies, setCompanies]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filterStatus, setFilterStatus]   = useState("");
  const [selectedCompany, setSelected]    = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Try cookie first, fallback to localStorage ──
  const getToken = () =>
    Cookies.get('token') || localStorage.getItem('token') || "";
  

  const getHeader = () => ({
    headers: {
      "Content-type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    }
  });

  // null / empty / "UNVERIFIED" → UNVERIFIED
  const resolveStatus = (s) => {
    const val = (s || "").toString().trim().toUpperCase();
    return val === "VERIFIED" ? "VERIFIED" : "UNVERIFIED";
  };

  /* ── Fetch all companies ── */
  useEffect(() => {
    const token = getToken();
    console.log("TOKEN FOUND:", token ? "yes " : "MISSING ");
    console.log("TOKEN VALUE:", token);

    axios.get(rest.companys, getHeader())
      .then(res => {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        const normalised = list.map(c => ({ ...c, status: resolveStatus(c.status) }));
        setCompanies(normalised);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        console.error("Status:", err.response?.status);
        console.error("Message:", err.response?.data);
        setLoading(false);
      });
  }, []);

  /* ── Fetch single company details ── */
  const viewDetails = async (id) => {
    try {
      const res  = await axios.get(`${rest.companys}/${id}`, getHeader());
      const data = res.data.data || res.data;
      setSelected({ ...data, status: resolveStatus(data.status) });
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching details:", err);
    }
  };

  /* ── Toggle VERIFIED ↔ UNVERIFIED ── */
  const updateStatus = async (id, newStatus) => {
    setActionLoading(id);
    try {
      await axios.patch(
        `${rest.companys}/${id}/verify`,
        getHeader()
      );
      setCompanies(prev =>
        prev.map(c => c.companyId === id ? { ...c, status: newStatus } : c)
      );
      if (selectedCompany?.companyId === id) {
        setSelected(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Status Badge ── */
  const StatusBadge = ({ s }) => {
    const val = resolveStatus(s);
    return (
      <span style={{
        padding: "5px 14px", borderRadius: "20px", fontWeight: "600",
        fontSize: "0.78rem", display: "inline-block",
        background: val === "VERIFIED" ? "rgba(22,163,74,0.12)" : "rgba(156,163,175,0.18)",
        color:      val === "VERIFIED" ? "var(--success)"       : "var(--gray-500)"
      }}>
        {val === "VERIFIED" ? "✔ Verified" : "Unverified"}
      </span>
    );
  };

  /* ── Verify / Unverify toggle button ── */
  const ToggleButton = ({ comp, fullWidth = false }) => {
    const id     = comp.companyId;
    const status = resolveStatus(comp.status);
    const busy   = actionLoading === id;

    const base = {
      width: fullWidth ? "100%" : "auto",
      padding: fullWidth ? "11px 16px" : "5px 14px",
      borderRadius: "8px",
      fontSize: fullWidth ? "14px" : "12px",
      fontWeight: "600",
      cursor: busy ? "not-allowed" : "pointer",
      opacity: busy ? 0.6 : 1,
      transition: "all 0.2s"
    };

    if (status === "UNVERIFIED") {
      return (
        <button
          title="Click to verify this company"
          disabled={busy}
          style={{ ...base, border: "1px solid #9ca3af", background: "rgba(156,163,175,0.15)", color: "#6b7280" }}
          onMouseEnter={e => { if (!busy) { e.currentTarget.style.background="rgba(22,163,74,0.12)"; e.currentTarget.style.color="var(--success)"; e.currentTarget.style.borderColor="#16a34a"; }}}
          onMouseLeave={e => { e.currentTarget.style.background="rgba(156,163,175,0.15)"; e.currentTarget.style.color="#6b7280"; e.currentTarget.style.borderColor="#9ca3af"; }}
          onClick={() => updateStatus(id, "VERIFIED")}
        >
          {busy ? "..." : "Unverified"}
        </button>
      );
    }

    return (
      <button
        title="Click to unverify this company"
        disabled={busy}
        style={{ ...base, border: "1px solid #16a34a", background: "rgba(22,163,74,0.12)", color: "var(--success)" }}
        onMouseEnter={e => { if (!busy) { e.currentTarget.style.background="rgba(220,38,38,0.1)"; e.currentTarget.style.color="var(--danger)"; e.currentTarget.style.borderColor="#dc2626"; }}}
        onMouseLeave={e => { e.currentTarget.style.background="rgba(22,163,74,0.12)"; e.currentTarget.style.color="var(--success)"; e.currentTarget.style.borderColor="#16a34a"; }}
        onClick={() => updateStatus(id, "UNVERIFIED")}
      >
        {busy ? "..." : "✔ Verified"}
      </button>
    );
  };

  /* ── Avatar ── */
  const Avatar = ({ name, logo }) => {
    if (logo) {
      return (
        <img src={logo} alt={name}
          style={{ width: "36px", height: "36px", borderRadius: "8px",
            objectFit: "cover", flexShrink: 0, border: "1px solid var(--border-color)" }}
          onError={e => { e.target.style.display = "none"; }}
        />
      );
    }
    const initials = (name || "??").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <div style={{ width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
        background: "rgba(14,165,233,0.12)", display: "flex", alignItems: "center",
        justifyContent: "center", fontWeight: "700", fontSize: "13px", color: "var(--info)" }}>
        {initials}
      </div>
    );
  };

  const filtered = filterStatus
    ? companies.filter(c => resolveStatus(c.status) === filterStatus)
    : companies;

  const detailRows = selectedCompany ? [
    ["Company ID",  `CMP${String(selectedCompany.companyId).padStart(3, "0")}`],
    ["Industry",     selectedCompany.industryType || "—"],
    ["Email",        selectedCompany.email        || "—"],
    ["Phone",        selectedCompany.phone        || "—"],
    ["Website",      selectedCompany.website      || "—"],
    ["Location",     selectedCompany.location     || "—"],
    ["About",        selectedCompany.about        || "—"],
    ["Admin Email",  selectedCompany.userModel?.email || "—"],
    ["Admin Role",   selectedCompany.userModel?.role  || "—"],
  ] : [];

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* ── Page Header ── */}
      <div className="row items-center space-between mb-3">
        <div>
          <h2 className="fs-5 bold">Company Management</h2>
          <p className="fs-p9 text-secondary">Review and manage company registrations</p>
        </div>
        <div className="row items-center" style={{ gap: "10px" }}>
          <div style={{ padding: "5px 14px", borderRadius: "8px", fontWeight: "600",
            fontSize: "0.8rem", background: "rgba(156,163,175,0.15)", color: "var(--gray-600)" }}>
            Unverified: {companies.filter(c => resolveStatus(c.status) === "UNVERIFIED").length}
          </div>
          <div style={{ padding: "5px 14px", borderRadius: "8px", fontWeight: "600",
            fontSize: "0.8rem", background: "rgba(22,163,74,0.12)", color: "var(--success)" }}>
            Verified: {companies.filter(c => resolveStatus(c.status) === "VERIFIED").length}
          </div>
        </div>
      </div>

      {/* ── Filter ── */}
      <div className="row mb-3">
        <select
          className="form-control w-20"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Companies</option>
          <option value="UNVERIFIED">Unverified</option>
          <option value="VERIFIED">Verified</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="card p-3">
        {loading ? (
          <p className="text-center p-3">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center p-3 text-secondary">No companies found.</p>
        ) : (
          <table className="w-100">
            <thead>
              <tr className="text-secondary fs-p9">
                <th>Company</th>
                <th>Industry</th>
                <th>Email</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(comp => (
                <tr key={comp.companyId} className="hover-bg">
                  <td>
                    <div className="row items-center" style={{ gap: "10px" }}>
                      <Avatar name={comp.companyName} logo={comp.logo} />
                      <div>
                        <p className="bold" style={{ margin: 0 }}>{comp.companyName}</p>
                        <p className="fs-p8 text-secondary" style={{ margin: 0 }}>
                          CMP{String(comp.companyId).padStart(3, "0")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{comp.industryType || "—"}</td>
                  <td>{comp.email        || "—"}</td>
                  <td>{comp.location     || "—"}</td>
                  <td><StatusBadge s={comp.status} /></td>
                  <td>
                    <div className="row items-center" style={{ gap: "8px" }}>
                      <button
                        className="btn btn-sm btn-info"
                        title="View registered details"
                        style={{ width: "auto", padding: "5px 10px", borderRadius: "8px", fontSize: "13px" }}
                        onClick={() => viewDetails(comp.companyId)}
                      >
                        👁️
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

      {/* ── Modal ── */}
      {showModal && selectedCompany && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-box card p-4"
            style={{ width: "520px", maxHeight: "82vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="row items-center space-between mb-3">
              <div className="row items-center" style={{ gap: "12px" }}>
                <Avatar name={selectedCompany.companyName} logo={selectedCompany.logo} />
                <div>
                  <p className="bold fs-4" style={{ margin: 0 }}>{selectedCompany.companyName}</p>
                  <StatusBadge s={selectedCompany.status} />
                </div>
              </div>
              <button
                className="btn btn-sm btn-muted"
                style={{ width: "auto", padding: "4px 10px", borderRadius: "8px" }}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <hr style={{ marginBottom: "16px", borderColor: "var(--border-color)" }} />

            <p className="fs-p8 text-secondary bold mb-2"
               style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Registered Details
            </p>

            <table className="w-100">
              <tbody>
                {detailRows.map(([label, value]) => (
                  <tr key={label}>
                    <td className="text-secondary fs-p9"
                        style={{ width: "130px", verticalAlign: "top", paddingRight: "8px" }}>
                      {label}
                    </td>
                    <td className="fs-p9">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr style={{ margin: "20px 0 14px", borderColor: "var(--border-color)" }} />

            <p className="fs-p9 text-secondary mb-2" style={{ fontWeight: "600" }}>Admin Action</p>
            <ToggleButton comp={selectedCompany} fullWidth={true} />

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminCompanies;
