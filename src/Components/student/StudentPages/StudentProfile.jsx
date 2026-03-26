import { useState, useEffect } from "react";
import axios from "axios";

function StudentProfile() {
  const [profile, setProfile] = useState({
    name: "", email: "", phone: "", dob: "", gender: "", address: "",
    department: "", rollNo: "", cgpa: "", backlogCount: "", skills: "",
    resume: "", linkedin: "", github: "", about: ""
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("studentToken")}` } };

  useEffect(() => {
    axios.get("/api/student/profile", header)
      .then(res => {
        const data = res.data.data || res.data || {};
        setProfile(data);
        setSkills(data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });

  const addSkill = () => {
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    const updated = [...skills, newSkill.trim()];
    setSkills(updated);
    setProfile({ ...profile, skills: updated.join(", ") });
    setNewSkill("");
  };

  const removeSkill = (skill) => {
    const updated = skills.filter(s => s !== skill);
    setSkills(updated);
    setProfile({ ...profile, skills: updated.join(", ") });
  };

  const handleSave = () => {
    axios.put("/api/student/profile", { ...profile, skills: skills.join(", ") }, header)
      .then(() => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000); })
      .catch(console.error);
  };

  if (loading) return <p className="p-5">Loading...</p>;

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">My Profile</h2>
          <p className="fs-p9 text-secondary">Keep your profile updated for better job matches</p>
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
        <p className="text-success">✅ Profile saved!</p>
      </div>}

      {/* Header Card */}
      <div className="card p-5 mb-4" style={{ background: "linear-gradient(135deg, #f9fafb, #e8f4f8)" }}>
        <div className="row items-center" style={{ gap: "20px" }}>
          <div className="bg-primary text-white br-circle" style={{ width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", flexShrink: 0 }}>
            {profile.name?.charAt(0) || "S"}
          </div>
          <div>
            <h3 className="bold">{profile.name || "Student Name"}</h3>
            <p className="fs-p9 text-secondary">{profile.department || "Department"} &nbsp;|&nbsp; Roll No: {profile.rollNo || "—"}</p>
            <p className="fs-p9 text-secondary">{profile.email}</p>
          </div>
          <div className="ms-auto text-right">
            <div className="bold fs-3" style={{ color: "#325563" }}>CGPA {profile.cgpa || "—"}</div>
            <p className="fs-p8 text-secondary">Academic Score</p>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Personal Info */}
        <div className="col-6 p-2">
          <div className="card p-4 mb-3">
            <h4 className="mb-3">👤 Personal Information</h4>
            {[
              { label: "Full Name", name: "name" },
              { label: "Email", name: "email" },
              { label: "Phone", name: "phone" },
              { label: "Date of Birth", name: "dob", type: "date" },
              { label: "Gender", name: "gender", type: "select", options: ["Male", "Female", "Other"] },
              { label: "Address", name: "address" },
            ].map(f => (
              <div className="form-group mb-2" key={f.name}>
                <label className="form-control-label">{f.label}</label>
                {editing ? (
                  f.type === "select" ? (
                    <select className="form-control" name={f.name} value={profile[f.name] || ""} onChange={handleChange}>
                      <option value="">Select</option>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : <input type={f.type || "text"} className="form-control" name={f.name} value={profile[f.name] || ""} onChange={handleChange} />
                ) : <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px" }}>{profile[f.name] || <span className="text-secondary">Not set</span>}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Academic & Skills */}
        <div className="col-6 p-2">
          <div className="card p-4 mb-3">
            <h4 className="mb-3">🎓 Academic Details</h4>
            {[
              { label: "Department", name: "department" },
              { label: "Roll Number", name: "rollNo" },
              { label: "CGPA", name: "cgpa" },
              { label: "Number of Backlogs", name: "backlogCount" },
              { label: "LinkedIn", name: "linkedin" },
              { label: "GitHub", name: "github" },
            ].map(f => (
              <div className="form-group mb-2" key={f.name}>
                <label className="form-control-label">{f.label}</label>
                {editing ? (
                  <input className="form-control" name={f.name} value={profile[f.name] || ""} onChange={handleChange} />
                ) : <p className="fs-p9 p-2" style={{ background: "#f9fafb", borderRadius: "8px" }}>{profile[f.name] || <span className="text-secondary">Not set</span>}</p>}
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="card p-4">
            <h4 className="mb-3">🛠️ Skills</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              {skills.length === 0 ? <p className="fs-p9 text-secondary">No skills added yet</p> : skills.map((s, i) => (
                <div key={i} style={{ background: "rgba(50,85,99,0.1)", border: "1px solid rgba(50,85,99,0.3)", borderRadius: "16px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="fs-p9" style={{ color: "#325563", fontWeight: 600 }}>{s}</span>
                  {editing && <span style={{ cursor: "pointer", color: "#dc2626", fontSize: "0.75rem" }} onClick={() => removeSkill(s)}>✕</span>}
                </div>
              ))}
            </div>
            {editing && (
              <div className="row" style={{ gap: "8px" }}>
                <input className="form-control" style={{ flex: 1 }} placeholder="Add skill..." value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill()} />
                <button className="btn btn-primary w-auto" style={{ padding: "8px 16px" }} onClick={addSkill}>Add</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-4 mt-2">
        <h4 className="mb-2">📝 About Me</h4>
        {editing ? (
          <textarea className="form-control" rows="3" name="about" value={profile.about || ""} onChange={handleChange} placeholder="Write a short bio..." />
        ) : <p className="fs-p9">{profile.about || <span className="text-secondary">Not set</span>}</p>}
      </div>
    </div>
  );
}

export default StudentProfile;
