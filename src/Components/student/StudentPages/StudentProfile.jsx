import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

// ── Static suggestion lists ────────────────────────────
const SUGGESTED_SKILLS = [
  "JavaScript","TypeScript","Python","Java","C++","React","Node.js",
  "MongoDB","Docker","Kubernetes","Machine Learning","SQL","Git","Figma","Data Analysis",
  "Spring Boot","Django","Flutter","AWS","Linux"
];

const SUGGESTED_CERTS = [
  "AWS Cloud Practitioner","AWS Solutions Architect","Google Cloud Professional",
  "Microsoft Azure Fundamentals","Meta Front-End Developer","IBM Data Science",
  "Coursera Machine Learning","NPTEL Python","Google Analytics","Cisco CCNA"
];

const TABS = ["Personal", "Academic", "Skills & Certs", "Resumes", "About"];

// ── Small reusable Tag chip ────────────────────────────
function Tag({ label, onRemove, editing, variant = "skill" }) {
  const colors = variant === "skill"
    ? { bg: "rgba(50,85,99,0.1)",    color: "#325563",  border: "rgba(50,85,99,0.3)"    }
    : { bg: "rgba(88,60,160,0.1)",   color: "#483b8f",  border: "rgba(88,60,160,0.3)"   };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: colors.bg, color: colors.color,
      border: `1px solid ${colors.border}`,
      borderRadius: 16, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600,
    }}>
      {label}
      {editing && (
        <span
          onClick={() => onRemove(label)}
          style={{ cursor: "pointer", color: "var(--danger)", fontSize: "0.75rem", lineHeight: 1 }}
        >✕</span>
      )}
    </span>
  );
}

// ── Read-only display value ────────────────────────────
function DisplayVal({ value }) {
  return (
    <div style={{
      fontSize: "0.9rem", padding: "0.65rem 0.75rem",
      background: "var(--gray-100)", borderRadius: "8px",
      color: value ? "var(--text-primary)" : "var(--gray-400)",
      minHeight: "38px",
    }}>
      {value || "Not set"}
    </div>
  );
}

// ─────────────────────────────────────────────────────
export default function StudentProfile() {
  const [activeTab,     setActiveTab]     = useState("Personal");
  const [editing,       setEditing]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [message,       setMessage]       = useState("");
  const [msgType,       setMsgType]       = useState("");

  // ── Raw student object from API (for ID + read-only fields)
  const [studentData,   setStudentData]   = useState(null);

  // ── Editable form state (mirrors PATCH-able fields)
  const [form, setForm] = useState({
    name: "", phone: "", rollNumber: "", percentage: "",
    year: "", skills: "", about: "", linkedin: "", github: "",
  });

  // ── Derived lists
  const [skills,        setSkills]        = useState([]);
  const [newSkill,      setNewSkill]      = useState("");
  const [certs,         setCerts]         = useState([]);
  const [newCert,       setNewCert]       = useState("");

  // ── Resume state
  const [resumes,       setResumes]       = useState([]);  // existing from API
  const [resumeTitle,   setResumeTitle]   = useState("");  // title input before upload
  const [uploading,     setUploading]     = useState(false);
  const [dragging,      setDragging]      = useState(false);
  const [resumeMsg,     setResumeMsg]     = useState("");
  const [resumeMsgType, setResumeMsgType] = useState("");
  const fileInputRef = useRef();

  const jsonHeader = {
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${Cookies.get("token")}`,
    },
  };

  const multipartHeader = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization:  `Bearer ${Cookies.get("token")}`,
    },
  };

  // ── GET /api/actors/students → load own profile ───────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res  = await axios.get(rest.students, jsonHeader);
        const list = res.data?.data || res.data || [];
        const me   = Array.isArray(list) ? list[0] : list;
        setStudentData(me);

        // Populate editable form
        setForm({
          name:       me?.name        || "",
          phone:      me?.phone       || "",
          rollNumber: me?.rollNumber  || "",
          percentage: me?.percentage  || "",
          year:       me?.year        || "",
          skills:     me?.skills      || "",
          about:      me?.about       || "",
          linkedin:   me?.linkedin    || "",
          github:     me?.github      || "",
        });

        // Populate skill/cert chips from comma-separated strings
        if (me?.skills) {
          setSkills(me.skills.split(",").map((s) => s.trim()).filter(Boolean));
        }
        if (me?.certifications) {
          setCerts(me.certifications.split(",").map((c) => c.trim()).filter(Boolean));
        }

        // Populate resumes from resumeModel if present
        const resumeList = me?.resumeModels || (me?.resumeModel ? [me.resumeModel] : []);
        setResumes(resumeList);
      } catch (err) {
        console.error("fetchProfile:", err);
        setMessage("Failed to load profile.");
        setMsgType("error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── PATCH /api/actors/students/{studentId} ────────────
  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const studentId = studentData?.studentId || studentData?.id;
      const payload   = {
        ...form,
        skills:           skills.join(", "),
        certifications:   certs.join(", "),
      };
      await axios.patch(`${rest.students}/${studentId}`, payload, jsonHeader);
      // Refresh local studentData with saved values
      setStudentData((prev) => ({ ...prev, ...payload }));
      setEditing(false);
      setMessage("Profile saved successfully!");
      setMsgType("success");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      console.error("saveProfile:", err);
      setMessage(err.response?.data?.message || "Failed to save profile.");
      setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    // Reset form to current studentData
    if (studentData) {
      setForm({
        name:       studentData.name        || "",
        phone:      studentData.phone       || "",
        rollNumber: studentData.rollNumber  || "",
        percentage: studentData.percentage  || "",
        year:       studentData.year        || "",
        skills:     studentData.skills      || "",
        about:      studentData.about       || "",
        linkedin:   studentData.linkedin    || "",
        github:     studentData.github      || "",
      });
      if (studentData.skills) {
        setSkills(studentData.skills.split(",").map((s) => s.trim()).filter(Boolean));
      }
      if (studentData.certifications) {
        setCerts(studentData.certifications.split(",").map((c) => c.trim()).filter(Boolean));
      }
    }
    setEditing(false);
    setMessage("");
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Skills ────────────────────────────────────────────
  const addSkill = () => {
    const val = newSkill.trim();
    if (!val || skills.includes(val)) return;
    setSkills((prev) => [...prev, val]);
    setNewSkill("");
  };
  const removeSkill = (s) => setSkills((prev) => prev.filter((x) => x !== s));
  const addSuggestedSkill = (s) => {
    if (!skills.includes(s)) setSkills((prev) => [...prev, s]);
  };

  // ── Certifications ────────────────────────────────────
  const addCert = () => {
    const val = newCert.trim();
    if (!val || certs.includes(val)) return;
    setCerts((prev) => [...prev, val]);
    setNewCert("");
  };
  const removeCert = (c) => setCerts((prev) => prev.filter((x) => x !== c));
  const addSuggestedCert = (c) => {
    if (!certs.includes(c)) setCerts((prev) => [...prev, c]);
  };

  // ── Resume upload: POST /api/actors/student-resume ────
  // Backend requires resumeTitle as @RequestParam (query param)
  const uploadResume = async (file) => {
    if (!file || file.type !== "application/pdf") {
      setResumeMsg("Only PDF files are accepted.");
      setResumeMsgType("error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeMsg(`${file.name} exceeds the 5 MB limit.`);
      setResumeMsgType("error");
      return;
    }
    const title = resumeTitle.trim() || file.name.replace(/\.pdf$/i, "");
    setUploading(true);
    setResumeMsg("");
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await axios.post(
        `${rest.studentResume}?resumeTitle=${encodeURIComponent(title)}`,
        formData,
        multipartHeader
      );
      const saved = res.data?.data || res.data;
      setResumes((prev) => [...prev, saved]);
      setResumeTitle(""); // clear title input after successful upload
      setResumeMsg("Resume uploaded successfully!");
      setResumeMsgType("success");
      setTimeout(() => setResumeMsg(""), 3000);
    } catch (err) {
      console.error("uploadResume:", err);
      setResumeMsg(err.response?.data?.message || "Upload failed. Please try again.");
      setResumeMsgType("error");
    } finally {
      setUploading(false);
    }
  };

  const processFiles = (files) => {
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");
    if (pdfs.length === 0) {
      setResumeMsg("Please select PDF files only.");
      setResumeMsgType("error");
      return;
    }
    pdfs.forEach((f) => uploadResume(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  // ── Helpers ───────────────────────────────────────────
  const formatSize = (bytes) => {
    if (!bytes) return "—";
    return bytes > 1048576
      ? (bytes / 1048576).toFixed(1) + " MB"
      : (bytes / 1024).toFixed(0) + " KB";
  };

  // Field component — edit mode shows input, view mode shows display div
  const Field = ({ label, name, type = "text", options, readOnly = false }) => (
    <div className="form-group mb-3">
      <label className="form-control-label">{label}</label>
      {editing && !readOnly ? (
        type === "select" ? (
          <select className="form-control" name={name} value={form[name] || ""} onChange={handleChange}>
            <option value="">Select</option>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : type === "textarea" ? (
          <textarea
            className="form-control"
            name={name}
            rows={4}
            value={form[name] || ""}
            onChange={handleChange}
            placeholder={`Enter ${label.toLowerCase()}...`}
            style={{ resize: "vertical" }}
          />
        ) : (
          <input
            type={type}
            className="form-control"
            name={name}
            value={form[name] || ""}
            onChange={handleChange}
          />
        )
      ) : (
        <DisplayVal value={form[name] || (readOnly ? studentData?.[name] : "")} />
      )}
    </div>
  );

  // Read-only row (always display, never editable)
  const ReadOnlyField = ({ label, value }) => (
    <div className="form-group mb-3">
      <label className="form-control-label">{label}</label>
      <DisplayVal value={value} />
    </div>
  );

  // Profile completeness
  const checks = [
    { label: "Full Name",   done: !!form.name       },
    { label: "Phone",       done: !!form.phone       },
    { label: "Roll Number", done: !!form.rollNumber  },
    { label: "CGPA/Marks",  done: !!form.percentage  },
    { label: "Skills",      done: skills.length > 0  },
    { label: "Resume",      done: resumes.length > 0 },
  ];
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

  const dept  = studentData?.departmentModel?.departmentName || "—";
  const email = studentData?.userModel?.email || studentData?.email || "—";

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-5 text-center">
        <p className="text-secondary">Loading profile...</p>
      </div>
    );
  }

  // ═══════════════ RENDER ═══════════════════════════════
  return (
    <div className="p-4" style={{ background: "var(--bg-color)", minHeight: "100vh" }}>

      {/* ── Top Bar ── */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">My Profile</h2>
          <p className="fs-p9 text-secondary">Keep your profile updated for better job matches</p>
        </div>
        <div className="row" style={{ gap: "10px" }}>
          {editing ? (
            <>
              <button
                className="btn btn-primary w-auto"
                style={{ padding: "8px 20px" }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "💾 Save"}
              </button>
              <button
                className="btn btn-muted w-auto"
                style={{ padding: "8px 20px" }}
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary w-auto"
              style={{ padding: "8px 20px" }}
              onClick={() => setEditing(true)}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Global Message ── */}
      {message && (
        <div
          className="p-2 br-md mb-3 fs-p9"
          style={{
            background: msgType === "success" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
            border:     `1px solid ${msgType === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
            color:      msgType === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {msgType === "success" ? "✅" : "⚠️"} {message}
        </div>
      )}

      {/* ── Header Card ── */}
      <div className="card p-4 mb-4" style={{ background: "linear-gradient(135deg,#f9fafb,#e8f4f8)" }}>
        <div className="row items-center" style={{ gap: "16px" }}>
          {/* Avatar */}
          <div
            className="bg-primary text-white br-circle"
            style={{
              width: 72, height: 72, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", flexShrink: 0, fontWeight: "bold",
            }}
          >
            {form.name?.charAt(0)?.toUpperCase() || "S"}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h3 className="bold">{form.name || "Student Name"}</h3>
            <p className="fs-p9 text-secondary">
              {dept} &nbsp;|&nbsp; Roll No: {form.rollNumber || "—"}
            </p>
            <p className="fs-p9 text-secondary">{email}</p>
          </div>

          {/* CGPA + completeness */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div className="bold" style={{ color: "#325563", fontSize: "1.6rem" }}>
              {form.percentage || "—"}
            </div>
            <p className="fs-p8 text-secondary">Percentage / CGPA</p>
            <div className="mt-2">
              <div style={{ height: "6px", width: "100px", background: "#e5e7eb", borderRadius: "3px" }}>
                <div style={{ width: `${pct}%`, height: "6px", background: "#325563", borderRadius: "3px" }} />
              </div>
              <p className="fs-p8 text-secondary mt-1">Profile {pct}% complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="row mb-3" style={{ borderBottom: "2px solid var(--border-color)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 18px", border: "none", background: "none",
              cursor: "pointer", fontSize: "0.9rem",
              fontWeight:   activeTab === tab ? 600 : 400,
              color:        activeTab === tab ? "#325563" : "var(--text-secondary)",
              borderBottom: activeTab === tab ? "2px solid #325563" : "2px solid transparent",
              marginBottom: -2, transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ════════ TAB: Personal ════════ */}
      {activeTab === "Personal" && (
        <div className="row" style={{ gap: "16px" }}>
          <div className="col-6" style={{ paddingRight: "8px" }}>
            <div className="card p-4">
              <h4 className="mb-3 fs-p9 bold" style={{ color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                👤 Personal Information
              </h4>
              <Field label="Full Name"  name="name"  />
              <ReadOnlyField label="Email (registered)" value={email} />
              <Field label="Phone"      name="phone" />
              <Field label="LinkedIn"   name="linkedin" />
              <Field label="GitHub"     name="github" />
            </div>
          </div>

          <div className="col-6" style={{ paddingLeft: "8px" }}>
            <div className="card p-4">
              <h4 className="mb-3 fs-p9 bold" style={{ color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🏫 Department
              </h4>
              <ReadOnlyField label="Department" value={dept} />
              <p className="fs-p8 text-secondary" style={{ marginTop: "-8px", marginBottom: "16px" }}>
                Department is assigned by admin and cannot be edited here.
              </p>

              {/* Profile Completion Checklist */}
              <h4 className="mb-2 fs-p9 bold" style={{ color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ✅ Profile Completion
              </h4>
              {checks.map((c, i) => (
                <div key={i} className="row items-center mb-1" style={{ gap: "8px" }}>
                  <span style={{ color: c.done ? "#16a34a" : "#dc2626" }}>
                    {c.done ? "✅" : "⭕"}
                  </span>
                  <span className="fs-p9" style={{ color: c.done ? "inherit" : "#9ca3af" }}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════ TAB: Academic ════════ */}
      {activeTab === "Academic" && (
        <div className="row" style={{ gap: "16px" }}>
          <div className="col-6" style={{ paddingRight: "8px" }}>
            <div className="card p-4">
              <h4 className="mb-3 fs-p9 bold" style={{ color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🎓 Academic Details
              </h4>
              <ReadOnlyField label="Department" value={dept} />
              <Field label="Roll Number"       name="rollNumber"  />
              <Field label="Percentage / CGPA" name="percentage"  />
              <Field
                label="Current Year"
                name="year"
                type="select"
                options={["1", "2", "3", "4"]}
              />
            </div>
          </div>
        </div>
      )}

      {/* ════════ TAB: Skills & Certs ════════ */}
      {activeTab === "Skills & Certs" && (
        <div className="row" style={{ gap: "16px" }}>

          {/* Skills */}
          <div className="col-6" style={{ paddingRight: "8px" }}>
            <div className="card p-4">
              <h4 className="mb-3 fs-p9 bold" style={{ color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🛠️ Skills
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {skills.length === 0
                  ? <p className="fs-p9 text-secondary">No skills added yet</p>
                  : skills.map((s) => (
                      <Tag key={s} label={s} onRemove={removeSkill} editing={editing} variant="skill" />
                    ))
                }
              </div>
              {editing && (
                <div className="row mb-3" style={{ gap: "8px" }}>
                  <input
                    className="form-control"
                    style={{ flex: 1 }}
                    placeholder="Type skill and press Enter…"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  />
                  <button
                    className="btn btn-primary w-auto"
                    style={{ padding: "8px 16px" }}
                    onClick={addSkill}
                  >
                    Add
                  </button>
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
                <p className="fs-p8 text-secondary mb-2">Suggested skills</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                    <span
                      key={s}
                      onClick={() => editing && addSuggestedSkill(s)}
                      style={{
                        fontSize: "0.8rem", padding: "3px 10px", borderRadius: 12,
                        background: "var(--gray-100)", color: "var(--gray-600)",
                        border: "1px solid var(--gray-300)",
                        cursor: editing ? "pointer" : "default",
                        opacity: editing ? 1 : 0.55,
                        transition: "all 0.15s",
                      }}
                    >
                      {s} {editing && "+"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="col-6" style={{ paddingLeft: "8px" }}>
            <div className="card p-4">
              <h4 className="mb-3 fs-p9 bold" style={{ color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🏅 Certifications
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {certs.length === 0
                  ? <p className="fs-p9 text-secondary">No certifications added yet</p>
                  : certs.map((c) => (
                      <Tag key={c} label={c} onRemove={removeCert} editing={editing} variant="cert" />
                    ))
                }
              </div>
              {editing && (
                <div className="row mb-3" style={{ gap: "8px" }}>
                  <input
                    className="form-control"
                    style={{ flex: 1 }}
                    placeholder="Type certification and press Enter…"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCert()}
                  />
                  <button
                    className="btn btn-primary w-auto"
                    style={{ padding: "8px 16px" }}
                    onClick={addCert}
                  >
                    Add
                  </button>
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
                <p className="fs-p8 text-secondary mb-2">Common certifications</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {SUGGESTED_CERTS.filter((c) => !certs.includes(c)).map((c) => (
                    <span
                      key={c}
                      onClick={() => editing && addSuggestedCert(c)}
                      style={{
                        fontSize: "0.8rem", padding: "3px 10px", borderRadius: 12,
                        background: "rgba(88,60,160,0.07)", color: "#483b8f",
                        border: "1px solid rgba(88,60,160,0.2)",
                        cursor: editing ? "pointer" : "default",
                        opacity: editing ? 1 : 0.55,
                        transition: "all 0.15s",
                      }}
                    >
                      {c} {editing && "+"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ TAB: Resumes ════════ */}
      {activeTab === "Resumes" && (
        <div className="card p-4">
          <div className="row space-between items-center mb-3">
            <h4 className="fs-p9 bold" style={{ color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              📄 Resumes
            </h4>
            <span className="fs-p8 text-secondary">
              {resumes.length} uploaded · PDF only · Max 5 MB each
            </span>
          </div>

          {/* Resume message */}
          {resumeMsg && (
            <div
              className="p-2 br-md mb-3 fs-p9"
              style={{
                background: resumeMsgType === "success" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                border:     `1px solid ${resumeMsgType === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                color:      resumeMsgType === "success" ? "#16a34a" : "#dc2626",
              }}
            >
              {resumeMsgType === "success" ? "✅" : "⚠️"} {resumeMsg}
            </div>
          )}

          {/* Existing resumes from API */}
          {resumes.length === 0 && !uploading && (
            <div className="text-center p-3 mb-3">
              <p className="text-secondary fs-p9">No resumes uploaded yet</p>
            </div>
          )}

          {resumes.map((r, i) => {
            const resumeId  = r.resumeId  || r.id  || i;
            const resumeName = r.resumeName || r.name || `Resume ${i + 1}`;
            const resumeUrl  = r.resumeUrl  || r.url  || null;
            const resumeSize = r.resumeSize || r.size || null;

            return (
              <div
                key={resumeId}
                className="row items-center mb-2"
                style={{
                  padding:    "10px 14px",
                  borderRadius: 10,
                  border:     "1px solid var(--border-color)",
                  background: i === 0 ? "rgba(50,85,99,0.05)" : "var(--gray-100)",
                  gap:        "12px",
                }}
              >
                {/* PDF icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 8, background: "#325563",
                  color: "#fff", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                }}>
                  PDF
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="fs-p9 bold" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {resumeName}
                  </p>
                  <p className="fs-p8 text-secondary">
                    {resumeSize ? formatSize(resumeSize) : "—"} · Uploaded
                  </p>
                </div>

                {/* Primary badge */}
                {i === 0 && (
                  <span style={{
                    fontSize: "0.75rem", padding: "3px 10px",
                    background: "rgba(50,85,99,0.15)", color: "#325563",
                    borderRadius: 12, fontWeight: 600,
                  }}>
                    Primary
                  </span>
                )}

                {/* View link */}
                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-muted w-auto"
                    style={{ padding: "4px 12px", fontSize: "0.8rem", textDecoration: "none" }}
                  >
                    👁 View
                  </a>
                )}
              </div>
            );
          })}

          {/* Uploading indicator */}
          {uploading && (
            <div
              className="p-3 br-md mb-2 text-center"
              style={{ border: "1px dashed var(--border-color)", background: "rgba(50,85,99,0.03)" }}
            >
              <p className="fs-p9 text-secondary">⏳ Uploading resume...</p>
            </div>
          )}

          {/* Resume title input + drop zone */}
          <div className="mt-3">
            <div className="form-group mb-2">
              <label className="form-control-label">
                Resume Title
                <span className="fs-p8 text-secondary" style={{ fontWeight: 400, marginLeft: 6 }}>
                  (optional — defaults to filename)
                </span>
              </label>
              <input
                className="form-control"
                placeholder="e.g. Software Engineer Resume, Internship CV..."
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                disabled={uploading}
              />
            </div>

          {/* Drop zone */}
          <div
            onClick={() => !uploading && fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border:       `2px dashed ${dragging ? "#325563" : "var(--border-color)"}`,
              borderRadius: 12,
              padding:      "2rem",
              textAlign:    "center",
              cursor:       uploading ? "not-allowed" : "pointer",
              background:   dragging ? "rgba(50,85,99,0.05)" : "transparent",
              opacity:      uploading ? 0.5 : 1,
              transition:   "all 0.2s",
            }}
          >
            <div style={{ fontSize: "2rem", opacity: 0.35, marginBottom: 6 }}>⬆</div>
            <p className="fs-p9" style={{ fontWeight: 600, color: "var(--gray-600)" }}>
              {dragging ? "Drop PDF here!" : "Drop PDF here or click to upload"}
            </p>
            <p className="fs-p8 text-secondary mt-1">PDF files only · Max 5 MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => processFiles(e.target.files)}
            />
          </div>
          </div>
        </div>
      )}

      {/* ════════ TAB: About ════════ */}
      {activeTab === "About" && (
        <div className="card p-4">
          <h4 className="mb-3 fs-p9 bold" style={{ color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            📝 About Me
          </h4>
          <div className="form-group mb-3">
            <label className="form-control-label">Bio / Summary</label>
            {editing ? (
              <textarea
                className="form-control"
                name="about"
                rows={6}
                value={form.about || ""}
                onChange={handleChange}
                placeholder="Tell recruiters about yourself — your strengths, interests, career goals..."
                style={{ resize: "vertical" }}
              />
            ) : (
              <DisplayVal value={form.about} />
            )}
          </div>

          {/* Social links summary */}
          {(form.linkedin || form.github) && (
            <div className="mt-3 p-3 br-md" style={{ background: "var(--gray-100)", borderRadius: "10px" }}>
              <p className="fs-p8 bold text-secondary mb-2">🔗 Links</p>
              {form.linkedin && (
                <p className="fs-p9 mb-1">
                  <a href={form.linkedin} target="_blank" rel="noreferrer" className="text-link">
                    💼 LinkedIn: {form.linkedin}
                  </a>
                </p>
              )}
              {form.github && (
                <p className="fs-p9">
                  <a href={form.github} target="_blank" rel="noreferrer" className="text-link">
                    🐙 GitHub: {form.github}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}