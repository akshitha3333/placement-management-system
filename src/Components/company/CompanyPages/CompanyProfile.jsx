import { useState, useEffect } from "react";
import axios from "axios";

function CompanyProfile() {
  const [profile, setProfile] = useState({
    companyName: "", industry: "", email: "", phone: "", website: "",
    address: "", city: "", state: "", description: "", founded: ""
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("companyToken")}` } };

  useEffect(() => {
    axios.get("/api/company/profile", header)
      .then(res => { setProfile(res.data.data || res.data || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = () => {
    axios.put("/api/company/profile", profile, header)
      .then(() => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000); })
      .catch(console.error);
  };

  const handleChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });

  if (loading) return <p className="p-5">Loading...</p>;

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Company Profile</h2>
          <p className="fs-p9 text-secondary">Manage your company information</p>
        </div>
        {!editing ? (
          <button className="btn btn-primary w-auto" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
        ) : (
          <div className="row" style={{ gap: "10px" }}>
            <button className="btn btn-primary w-auto" onClick={handleSave}>💾 Save</button>
            <button className="btn btn-muted w-auto" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        )}
      </div>

      {saved && <div className="card p-2 mb-3" style={{ background: "rgba(22,163,74,0.1)", border: "1px solid #16a34a" }}>
        <p className="text-success">✅ Profile saved successfully!</p>
      </div>}

      {/* Company Header Card */}
      <div className="card p-5 mb-4">
        <div className="row items-center" style={{ gap: "20px" }}>
          <div className="bg-primary text-white br-circle" style={{ width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0 }}>
            🏢
          </div>
          <div>
            {editing ? (
              <input className="form-control" name="companyName" value={profile.companyName} onChange={handleChange} placeholder="Company Name" style={{ fontSize: "1.3rem", fontWeight: "bold", marginBottom: "8px" }} />
            ) : <h3 className="bold">{profile.companyName || "Company Name"}</h3>}
            <p className="text-secondary fs-p9">{profile.industry || "Industry"} &nbsp;|&nbsp; {profile.city || "City"}, {profile.state || "State"}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="row">
        <div className="col-6 p-2">
          <div className="card p-4 h-100">
            <h4 className="mb-3">📋 Basic Information</h4>
            {[
              { label: "Industry", name: "industry", placeholder: "e.g. Information Technology" },
              { label: "Email", name: "email", placeholder: "company@email.com" },
              { label: "Phone", name: "phone", placeholder: "+91 XXXXXXXXXX" },
              { label: "Website", name: "website", placeholder: "https://company.com" },
              { label: "Founded Year", name: "founded", placeholder: "2010" },
            ].map(field => (
              <div className="form-group mb-2" key={field.name}>
                <label className="form-control-label">{field.label}</label>
                {editing ? (
                  <input className="form-control" name={field.name} value={profile[field.name] || ""} onChange={handleChange} placeholder={field.placeholder} />
                ) : <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px" }}>{profile[field.name] || <span className="text-secondary">Not set</span>}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="col-6 p-2">
          <div className="card p-4 h-100">
            <h4 className="mb-3">📍 Address & Description</h4>
            {[
              { label: "Address", name: "address" },
              { label: "City", name: "city" },
              { label: "State", name: "state" },
            ].map(field => (
              <div className="form-group mb-2" key={field.name}>
                <label className="form-control-label">{field.label}</label>
                {editing ? (
                  <input className="form-control" name={field.name} value={profile[field.name] || ""} onChange={handleChange} />
                ) : <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px" }}>{profile[field.name] || <span className="text-secondary">Not set</span>}</p>}
              </div>
            ))}
            <div className="form-group mb-2">
              <label className="form-control-label">About Company</label>
              {editing ? (
                <textarea className="form-control" rows="4" name="description" value={profile.description || ""} onChange={handleChange} placeholder="Describe your company..." />
              ) : <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px", minHeight: "80px" }}>{profile.description || <span className="text-secondary">Not set</span>}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;
