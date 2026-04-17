import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function CompanyProfile() {
  const [profile,  setProfile]  = useState(null);
  const [form,     setForm]     = useState({});
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState("");
  const [msgType,  setMsgType]  = useState("");

  const header = {
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── GET /api/actors/companys ───────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res  = await axios.get(rest.companys, header);
        const list = res.data?.data || res.data || [];
        const me   = Array.isArray(list) ? list[0] : list;
        setProfile(me);
        setForm({
          companyName:  me?.companyName  || "",
          noOfEmployee: me?.noOfEmployee || "",
          website:      me?.website      || "",
          about:        me?.about        || "",
        });
      } catch (err) {
        console.error("fetchProfile:", err);
        setMessage("Failed to load profile.");
        setMsgType("error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── PATCH /api/actors/companys/{companyId} ─────────────
  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const companyId = profile?.companyId || profile?.id;
      await axios.patch(`${rest.companys}/${companyId}`, form, header);
      setProfile((prev) => ({ ...prev, ...form }));
      setEditing(false);
      setMessage("Profile updated successfully!");
      setMsgType("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("saveProfile:", err);
      setMessage(err.response?.data?.message || "Failed to save profile.");
      setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const cancelEdit = () => {
    setEditing(false);
    setForm({
      companyName:  profile?.companyName  || "",
      noOfEmployee: profile?.noOfEmployee || "",
      website:      profile?.website      || "",
      about:        profile?.about        || "",
    });
    setMessage("");
  };

  if (loading)
    return <div className="p-5 text-center"><p>Loading profile...</p></div>;

  const dept  = profile?.departmentModel?.departmentName || "—";
  const email = profile?.userModel?.email || "—";

  return (
    <div className="p-4">
      {/* ── Header ── */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Company Profile</h2>
          <p className="fs-p9 text-secondary">Manage your company information</p>
        </div>
        {!editing ? (
          <button className="btn btn-primary w-auto" onClick={() => setEditing(true)}>
            ✏️ Edit Profile
          </button>
        ) : (
          <div className="row" style={{ gap: "10px" }}>
            <button className="btn btn-primary w-auto" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "💾 Save"}
            </button>
            <button className="btn btn-muted w-auto" onClick={cancelEdit}>Cancel</button>
          </div>
        )}
      </div>

      {/* ── Message ── */}
      {message && (
        <div
          className="card p-2 mb-3 fs-p9"
          style={{
            background: msgType === "success" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
            border:     `1px solid ${msgType === "success" ? "#16a34a" : "#dc2626"}`,
            color:      msgType === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {msgType === "success" ? "✅" : "⚠️"} {message}
        </div>
      )}

      {/* ── Banner Card ── */}
      <div className="card p-5 mb-4" style={{ background: "linear-gradient(135deg, #0b2e40, #325563)", border: "none" }}>
        <div className="row items-center" style={{ gap: "20px" }}>
          <div
            className="text-white br-circle"
            style={{
              width:           "72px",
              height:          "72px",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              fontSize:        "2rem",
              flexShrink:      0,
              background:      "rgba(255,255,255,0.15)",
            }}
          >
            🏢
          </div>
          <div style={{ color: "white" }}>
            <h3 className="bold">{profile?.companyName || "Your Company"}</h3>
            <p className="fs-p9" style={{ opacity: 0.8 }}>
              {dept} &nbsp;|&nbsp; {email}
            </p>
          </div>
        </div>
      </div>

      {/* ── Detail Cards ── */}
      <div className="row">
        {/* Editable Fields */}
        <div className="col-6 p-2">
          <div className="card p-4">
            <h4 className="mb-3">📋 Company Details</h4>

            {/* Company Name */}
            <div className="form-group mb-3">
              <label className="form-control-label">Company Name</label>
              {editing ? (
                <input
                  className="form-control"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
              ) : (
                <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px" }}>
                  {profile?.companyName || <span className="text-secondary">Not set</span>}
                </p>
              )}
            </div>

            {/* No. of Employees */}
            <div className="form-group mb-3">
              <label className="form-control-label">Number of Employees</label>
              {editing ? (
                <input
                  className="form-control"
                  name="noOfEmployee"
                  value={form.noOfEmployee}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  type="number"
                />
              ) : (
                <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px" }}>
                  {profile?.noOfEmployee || <span className="text-secondary">Not set</span>}
                </p>
              )}
            </div>

            {/* Website */}
            <div className="form-group mb-3">
              <label className="form-control-label">Website</label>
              {editing ? (
                <input
                  className="form-control"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com"
                />
              ) : (
                <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px" }}>
                  {profile?.website ? (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="text-link">
                      {profile.website}
                    </a>
                  ) : (
                    <span className="text-secondary">Not set</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Read-only + About */}
        <div className="col-6 p-2">
          <div className="card p-4">
            <h4 className="mb-3">📍 Account Info</h4>

            {/* Email (read-only from userModel) */}
            <div className="form-group mb-3">
              <label className="form-control-label">Registered Email</label>
              <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px" }}>
                {email}
              </p>
            </div>

            {/* Department (read-only) */}
            <div className="form-group mb-3">
              <label className="form-control-label">Department / Sector</label>
              <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px" }}>
                {dept}
              </p>
            </div>

            {/* About */}
            <div className="form-group mb-3">
              <label className="form-control-label">About Company</label>
              {editing ? (
                <textarea
                  className="form-control"
                  name="about"
                  rows="4"
                  value={form.about}
                  onChange={handleChange}
                  placeholder="Describe your company, culture, vision..."
                />
              ) : (
                <p
                  className="fs-p9 p-2"
                  style={{ background: "#f9fafb", borderRadius: "8px", minHeight: "80px" }}
                >
                  {profile?.about || <span className="text-secondary">No description added yet</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;