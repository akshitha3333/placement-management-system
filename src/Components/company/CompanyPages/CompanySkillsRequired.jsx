import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const rest = require("../../../Rest");

const getToken = () => localStorage.getItem("token") || "";
const getHeader = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  },
});

function CompanySkillsRequired() {
  const [skills, setSkills]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [error, setError]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSkills = () => {
    setLoading(true);
    axios.get(rest.skills, getHeader())
      .then(res => {
        const list = Array.isArray(res.data.data) ? res.data.data
                   : Array.isArray(res.data)       ? res.data
                   : [];
        setSkills(list);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch skills error:", err);
        if (err.response?.status === 401) handleSessionExpired();
        setLoading(false);
      });
  };

  useEffect(() => { fetchSkills(); }, []);

  const handleSessionExpired = () => {
    alert("Session expired. Please login again.");
    localStorage.removeItem("companyToken");
    localStorage.removeItem("token");
    Cookies.remove("companyToken");
    Cookies.remove("token");
    window.location.href = "/company-login";
  };

  const handleSubmit = async () => {
    if (!skillName.trim()) {
      setError("Skill name is required.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await axios.post(rest.skills, { skill: skillName.trim() }, getHeader());
      const saved = res.data.data || res.data;

      setSkills(prev => [...prev, saved]);
      setSkillName("");
      setShowModal(false);
      setSuccessMsg("Skill added successfully!");
      setTimeout(() => setSuccessMsg(""), 1000);
    } catch (err) {
      console.error("Add skill error:", err);
      if (err.response?.status === 409) {
        setError("This skill already exists.");
      } else if (err.response?.status === 401) {
        handleSessionExpired();
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (skillId) => {
    if (!window.confirm("Remove this skill?")) return;
    try {
      await axios.delete(`${rest.skills}/${skillId}`, getHeader());
      setSkills(prev => prev.filter(s => s.skillId !== skillId));
    } catch (err) {
      console.error("Delete skill error:", err);
      if (err.response?.status === 401) handleSessionExpired();
      else alert("Failed to delete skill.");
    }
  };

  const getSkillName = (skill) =>
    skill.skill || skill.skillName || skill.name || "—";

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Skills Required</h2>
          <p className="fs-p9 text-secondary">
            Manage skills that can be tagged to job postings
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "auto", padding: "8px 20px", borderRadius: "10px" }}
          onClick={() => { setSkillName(""); setError(""); setShowModal(true); }}
        >
          + Add Skill
        </button>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="alert-success mb-3">
          <p className="fs-p9" style={{ color: "var(--success)", fontWeight: "600" }}>
            {successMsg}
          </p>
        </div>
      )}

      {/* Skills List */}
      <div className="card p-2">
        {loading ? (
          <p className="text-center p-4">Loading...</p>
        ) : skills.length === 0 ? (
          <div className="text-center p-5">
            <p style={{ fontSize: "2.5rem" }}>🛠️</p>
            <p className="bold mt-2">No skills added yet</p>
            <p className="text-secondary fs-p9">Click "Add Skill" to get started</p>
          </div>
        ) : (
          <div className="p-2">
            {skills.map((skill, index) => (
              <div
                key={skill.skillId || index}
                className="row space-between items-center p-2 activity-item"
                style={{ borderRadius: "8px" }}
              >
                <div className="row items-center" style={{ gap: "10px" }}>
                  <span
                    style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "rgba(14,165,233,0.1)", color: "var(--info)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "700", fontSize: "13px"
                    }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="bold fs-p9" style={{ margin: 0 }}>{getSkillName(skill)}</p>
                    {skill.skillId && (
                      <p className="text-secondary fs-p8" style={{ margin: 0 }}>
                        ID: {skill.skillId}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-sm btn-danger"
                  style={{ width: "auto", padding: "4px 12px", borderRadius: "8px", fontSize: "12px" }}
                  onClick={() => handleDelete(skill.skillId)}
                >
                  🗑 Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card p-4"
            style={{ width: "420px", maxWidth: "95%" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-3">
              <h3 className="bold">Add Skill</h3>
              <button
                className="btn btn-sm btn-muted"
                style={{ width: "auto", padding: "4px 10px", borderRadius: "8px" }}
                onClick={() => setShowModal(false)}
              >✕</button>
            </div>

            <hr style={{ marginBottom: "16px", borderColor: "var(--border-color)" }} />

            <div className="form-group mb-3">
              <label className="form-control-label">Skill Name *</label>
              <input
                className="form-control"
                placeholder="e.g. React, Java, SQL"
                value={skillName}
                onChange={e => { setSkillName(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
            </div>

            {error && (
              <div className="alert-danger mb-3">
                <p className="fs-p9" style={{ color: "var(--danger)", fontWeight: "600" }}>
                  {error}
                </p>
              </div>
            )}

            <div className="row" style={{ gap: "10px" }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, borderRadius: "10px" }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Adding..." : "✔ Add Skill"}
              </button>
              <button
                className="btn btn-muted"
                style={{ flex: 1, borderRadius: "10px" }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CompanySkillsRequired;