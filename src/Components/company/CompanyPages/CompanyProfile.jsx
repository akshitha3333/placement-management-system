import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
const rest = require("../../../Rest");

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const getHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

function DisplayVal({ value }) {
  return (
    <div style={{
      fontSize: "0.9rem", padding: "0.65rem 0.75rem",
      background: "var(--gray-100)", borderRadius: 8,
      color: value ? "var(--text-primary)" : "var(--gray-400)", minHeight: 38,
    }}>
      {value || "Not set"}
    </div>
  );
}

function CompanyProfile() {
  const [profile,  setProfile]  = useState(null);
  const [form,     setForm]     = useState({ companyName: "", website: "", about: "" });
  const [loading,  setLoading]  = useState(true);
  const [message,  setMessage]  = useState("");
  const [msgType,  setMsgType]  = useState("");
  const [showMap,  setShowMap]  = useState(false);

  useEffect(() => {
    axios.get(rest.companys, getHeaders())
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const me   = Array.isArray(list) ? list[0] : list;
        console.log("Company profile:", me);
        setProfile(me);
        setForm({
          companyName: me?.companyName || "",
          website:     me?.website     || "",
          about:       me?.about       || "",
        });
      })
      .catch((err) => {
        console.error("fetch profile error:", err.response?.data || err.message);
        setMessage("Failed to load profile."); setMsgType("error");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const hasMap = profile?.latitude && profile?.longitude &&
    !isNaN(parseFloat(profile.latitude)) && !isNaN(parseFloat(profile.longitude));

  if (loading) return <div className="p-5 text-center"><p className="text-secondary">Loading profile...</p></div>;

  const email    = profile?.userModel?.email || profile?.email || "—";
  const status   = (profile?.status || "").toUpperCase() === "VERIFIED";
  const initials = (profile?.companyName || "C").charAt(0).toUpperCase();

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Company Profile</h2>
          <p className="fs-p9 text-secondary">Manage your company information</p>
        </div>

      </div>

      {/* Message */}
      {message && (
        <div className={msgType === "success" ? "alert-success mb-3" : "alert-danger mb-3"}>
          <p className={msgType === "success" ? "text-success fs-p9" : "text-danger fs-p9"}>{message}</p>
        </div>
      )}

      {/* Banner */}
      <div className="card p-4 mb-4" style={{
        background: "linear-gradient(135deg, #0b2e40, #325563)", border: "none",
      }}>
        <div className="row items-center" style={{ gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,255,255,0.15)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "1.6rem",
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, color: "#fff" }}>
            <h3 className="bold">{profile?.companyName || "Company Name"}</h3>
            <p className="fs-p9" style={{ opacity: 0.8 }}>
              {profile?.industryType || "—"} · {profile?.location || "—"}
            </p>
            <p className="fs-p9" style={{ opacity: 0.7 }}>{email}</p>
          </div>
          <span style={{
            fontSize: "0.75rem", fontWeight: 600, padding: "5px 14px", borderRadius: 20,
            background: status ? "rgba(22,163,74,0.25)" : "rgba(245,158,11,0.25)",
            color: status ? "#86efac" : "#fcd34d",
          }}>
            {status ? "Verified" : "Pending Verification"}
          </span>
        </div>
      </div>

      {/* Content grid */}
      <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>

        {/* Left — editable fields */}
        <div style={{ flex: 1 }}>
          <div className="card p-4 mb-3">
            <p className="fs-p8 bold text-secondary mb-3" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Company Details
            </p>

            {/* Company Name */}
            <div className="form-group mb-3">
              <label className="form-control-label">Company Name</label>
              <DisplayVal value={profile?.companyName} />
            </div>

            {/* Website */}
            <div className="form-group mb-3">
              <label className="form-control-label">Website</label>
              {profile?.website ? (
                <div style={{ fontSize: "0.9rem", padding: "0.65rem 0.75rem", background: "var(--gray-100)", borderRadius: 8 }}>
                  <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: "var(--info)" }}>{profile.website}</a>
                </div>
              ) : <DisplayVal value="" />}
            </div>

            {/* About */}
            <div className="form-group mb-0">
              <label className="form-control-label">About Company</label>
              <DisplayVal value={profile?.about} />
            </div>
          </div>
        </div>

        {/* Right — read-only info + map */}
        <div style={{ flex: 1 }}>
          <div className="card p-4 mb-3">
            <p className="fs-p8 bold text-secondary mb-3" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Account Info
            </p>

            {[
              { label: "Registered Email", value: email },
              { label: "Phone",            value: profile?.phone        || "—" },
              { label: "Industry",         value: profile?.industryType || "—" },
              { label: "Location",         value: profile?.location     || "—" },
            ].map((f) => (
              <div className="form-group mb-3" key={f.label}>
                <label className="form-control-label">{f.label}</label>
                <DisplayVal value={f.value} />
              </div>
            ))}

            <p className="fs-p8 text-secondary">
              Email, phone, industry and location are set during registration and cannot be changed here.
            </p>
          </div>

          {/* Location map */}
          <div className="card p-0" style={{ overflow: "hidden" }}>
            <div className="row space-between items-center p-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <p className="bold fs-p9">Company Location</p>
              {hasMap && (
                <button
                  onClick={() => setShowMap((v) => !v)}
                  style={{
                    padding: "5px 14px", borderRadius: 8, fontSize: "0.78rem",
                    fontWeight: 600, cursor: "pointer",
                    background: showMap ? "var(--primary)" : "#fff",
                    color:      showMap ? "#fff" : "var(--primary)",
                    border: "1px solid var(--primary)",
                  }}
                >
                  {showMap ? "Hide Map" : "Show Map"}
                </button>
              )}
            </div>

            {hasMap ? (
              <>
                {showMap && (
                  <div style={{ height: 240 }}>
                    <MapContainer
                      center={[parseFloat(profile.latitude), parseFloat(profile.longitude)]}
                      zoom={14}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[parseFloat(profile.latitude), parseFloat(profile.longitude)]}>
                        <Popup>{profile.companyName}<br />{profile.location}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}
                <div className="p-3">
                  <p className="fs-p9 bold">{profile.location}</p>
                  <p className="fs-p8 text-secondary mt-1">
                    {parseFloat(profile.latitude).toFixed(5)}, {parseFloat(profile.longitude).toFixed(5)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize: "0.78rem", color: "var(--info)", fontWeight: 600 }}
                  >
                    Open in Google Maps
                  </a>
                </div>
              </>
            ) : (
              <div className="p-4 text-center">
                <p className="fs-p9 text-secondary">No location coordinates set.</p>
                <p className="fs-p8 text-secondary mt-1">
                  Location is set during company registration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;