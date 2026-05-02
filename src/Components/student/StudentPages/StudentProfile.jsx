import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const SUGGESTED_SKILLS = [
  "JavaScript","Python","Java","C++","React","Node.js","SQL","MongoDB",
  "Spring Boot","Django","Flutter","AWS","Docker","Machine Learning","Git","Figma",
  "TypeScript","Linux","Kubernetes","Data Analysis",
];



const TABS = ["Personal", "Academic", "Skills", "Resumes"];

const getHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});
const getMultipartHeaders = () => ({
  headers: {
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

function Tag({ label, onRemove, editing, variant = "skill" }) {
  const c = variant === "skill"
    ? { bg: "rgba(50,85,99,0.1)",  color: "#325563", border: "rgba(50,85,99,0.3)"   }
    : { bg: "rgba(88,60,160,0.1)", color: "#483b8f", border: "rgba(88,60,160,0.3)"  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 16, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600,
    }}>
      {label}
      {editing && (
        <span onClick={() => onRemove(label)}
          style={{ cursor: "pointer", color: "var(--danger)", fontSize: "0.75rem" }}>
          x
        </span>
      )}
    </span>
  );
}

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

export default function StudentProfile() {
  const [activeTab,     setActiveTab]     = useState("Personal");
  const [editing,       setEditing]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [message,       setMessage]       = useState("");
  const [msgType,       setMsgType]       = useState("");
  const [studentData,   setStudentData]   = useState(null);

  const [form, setForm] = useState({
    name: "", phone: "", rollNumber: "", percentage: "", year: "",
  });

  const [skills,   setSkills]   = useState([]);
  const [newSkill, setNewSkill] = useState("");

  const [resumes,       setResumes]       = useState([]);
  const [resumeTitle,   setResumeTitle]   = useState("");
  const [uploading,     setUploading]     = useState(false);
  const [dragging,      setDragging]      = useState(false);
  const [resumeMsg,     setResumeMsg]     = useState("");
  const [resumeMsgType, setResumeMsgType] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    const init = async () => {
      try {
        const [profileRes, resumeRes] = await Promise.allSettled([
          axios.get(`${rest.students.replace("students", "student-profile")}`, getHeaders()),
          axios.get(rest.studentResume, getHeaders()),
        ]);

        if (profileRes.status === "fulfilled") {
          const me = profileRes.value.data?.data || profileRes.value.data;
          console.log("Student profile:", me);
          setStudentData(me);
          setForm({
            name:       me?.name       || "",
            phone:      me?.phone      || "",
            rollNumber: me?.rollNumber || "",
            percentage: me?.percentage || "",
            year:       me?.year       || "",
          });
          if (me?.skills) setSkills(me.skills.split(",").map((s) => s.trim()).filter(Boolean));
        }

        if (resumeRes.status === "fulfilled") {
          const list = resumeRes.value.data?.data || resumeRes.value.data || [];
          const arr  = Array.isArray(list) ? list : [list].filter(Boolean);
          console.log("Resumes:", arr.length, arr);
          setResumes(arr);
        }
      } catch (err) {
        console.error("init error:", err);
        setMessage("Failed to load profile.");
        setMsgType("error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true); setMessage("");
    try {
      const studentId = studentData?.studentId || studentData?.id;
      const payload   = {
        ...studentData,           // keep non-editable fields intact
        name:       form.name,
        phone:      form.phone,
        rollNumber: form.rollNumber,
        percentage: form.percentage,
        year:       form.year,
      };
      console.log("Saving profile payload:", payload);
      const res = await axios.patch(
        `${rest.students.replace("students", "student-profile")}/${studentId}`,
        payload,
        getHeaders()
      );
      console.log("Save response:", res.data);
      setStudentData((prev) => ({ ...prev, ...payload }));
      setEditing(false);
      setMessage("Profile saved successfully!");
      setMsgType("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("save error:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Failed to save profile.");
      setMsgType("error");
    } finally { setSaving(false); }
  };

  const cancelEdit = () => {
    if (studentData) {
      setForm({
        name:       studentData.name       || "",
        phone:      studentData.phone      || "",
        rollNumber: studentData.rollNumber || "",
        percentage: studentData.percentage || "",
        year:       studentData.year       || "",
      });
    }
    setEditing(false);
    setMessage("");
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const addSkill = () => {
    const v = newSkill.trim();
    if (!v || skills.includes(v)) return;
    setSkills((p) => [...p, v]); setNewSkill("");
  };



  const uploadResume = async (file) => {
    if (file.type !== "application/pdf") {
      setResumeMsg("Only PDF files are accepted."); setResumeMsgType("error"); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeMsg("File exceeds the 5 MB limit."); setResumeMsgType("error"); return;
    }
    const title = resumeTitle.trim() || file.name.replace(/\.pdf$/i, "");
    setUploading(true); setResumeMsg("");
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await axios.post(
        `${rest.studentResume}?resumeTitle=${encodeURIComponent(title)}`,
        fd, getMultipartHeaders()
      );
      console.log("Upload response:", res.data);
      const saved = res.data?.data || res.data;
      setResumes((p) => [...p, saved]);
      setResumeTitle("");
      setResumeMsg("Resume uploaded successfully!");
      setResumeMsgType("success");
      setTimeout(() => setResumeMsg(""), 3000);
    } catch (err) {
      console.error("upload error:", err.response?.data || err.message);
      setResumeMsg(err.response?.data?.message || "Upload failed.");
      setResumeMsgType("error");
    } finally { setUploading(false); }
  };

  const processFiles = (files) => {
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");
    if (pdfs.length === 0) { setResumeMsg("PDF only."); setResumeMsgType("error"); return; }
    pdfs.forEach(uploadResume);
  };

  const openResume = (r) => {
    const base64 = r.resume2;
    if (!base64) { alert("Resume file not available."); return; }
    try {
      const raw    = base64.startsWith("data:") ? base64.split(",")[1] : base64;
      const binary = atob(raw);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob    = new Blob([bytes], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, "_blank");
      if (!win) {
        const a = document.createElement("a");
        a.href = blobUrl; a.download = (r.resumeTitle || "resume") + ".pdf"; a.click();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error("openResume error:", err);
      alert("Could not open resume.");
    }
  };

  const dept  = studentData?.departmentModel?.departmentName || "—";
  const email = studentData?.userModel?.email || studentData?.email || "—";

  const checks = [
    { label: "Full Name",   done: !!form.name       },
    { label: "Phone",       done: !!form.phone       },
    { label: "Roll Number", done: !!form.rollNumber  },
    { label: "Percentage",  done: !!form.percentage  },
    { label: "Skills",      done: skills.length > 0  },
    { label: "Resume",      done: resumes.length > 0 },
  ];
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

  if (loading) return <div className="p-5 text-center"><p className="text-secondary">Loading profile...</p></div>;

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "calc(100vh - 70px)" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">My Profile</h2>
          <p className="fs-p9 text-secondary">Keep your profile updated for better job matches</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {editing ? (
            <>
              <button className="btn btn-primary w-auto" style={{ padding: "8px 20px" }}
                onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="btn btn-muted w-auto" style={{ padding: "8px 20px" }}
                onClick={cancelEdit}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-primary w-auto" style={{ padding: "8px 20px" }}
              onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={msgType === "success" ? "alert-success mb-3" : "alert-danger mb-3"}>
          <p className={msgType === "success" ? "text-success fs-p9" : "text-danger fs-p9"}>{message}</p>
        </div>
      )}

      {/* Profile banner */}
      <div className="card p-4 mb-4" style={{
        background: "linear-gradient(135deg, #0b2e40, #325563)", border: "none", color: "#fff",
      }}>
        <div className="row items-center" style={{ gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,255,255,0.15)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "1.6rem",
          }}>
            {(form.name || "S").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h3 className="bold">{form.name || "Student Name"}</h3>
            <p className="fs-p9" style={{ opacity: 0.8 }}>
              {dept} · Roll No: {form.rollNumber || "—"} · {email}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <h2 className="bold" style={{ fontSize: "1.8rem" }}>{form.percentage || "—"}</h2>
            <p className="fs-p8" style={{ opacity: 0.7 }}>Percentage</p>
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 5, width: 100, background: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#86efac", borderRadius: 3 }} />
              </div>
              <p className="fs-p8 mt-1" style={{ opacity: 0.7 }}>Profile {pct}% complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-3" style={{ borderBottom: "2px solid var(--border-color)" }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontSize: "0.88rem",
            fontWeight:   activeTab === tab ? 600 : 400,
            color:        activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
            borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
            marginBottom: -2,
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB: Personal ── */}
      {activeTab === "Personal" && (
        <div className="row" style={{ gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div className="card p-4">
              <p className="fs-p8 bold text-secondary mb-3" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Personal Information
              </p>
              {[
                { label: "Full Name", name: "name",  type: "text" },
                { label: "Phone",     name: "phone", type: "text" },
              ].map((f) => (
                <div className="form-group mb-3" key={f.name}>
                  <label className="form-control-label">{f.label}</label>
                  {editing ? (
                    <input type={f.type} className="form-control" name={f.name}
                      value={form[f.name] || ""} onChange={handleChange} />
                  ) : (
                    <DisplayVal value={form[f.name]} />
                  )}
                </div>
              ))}
              <div className="form-group mb-3">
                <label className="form-control-label">Email (registered)</label>
                <DisplayVal value={email} />
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card p-4 mb-3">
              <p className="fs-p8 bold text-secondary mb-3" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Department
              </p>
              <div className="form-group mb-2">
                <label className="form-control-label">Department</label>
                <DisplayVal value={dept} />
              </div>
              <p className="fs-p8 text-secondary">Department is assigned by admin and cannot be changed.</p>
            </div>

            <div className="card p-4">
              <p className="fs-p8 bold text-secondary mb-3" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Profile Completion
              </p>
              {checks.map((c, i) => (
                <div key={i} className="row items-center mb-2" style={{ gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: c.done ? "var(--success)" : "var(--gray-300)",
                  }} />
                  <span className="fs-p9" style={{ color: c.done ? "var(--text-primary)" : "var(--gray-400)" }}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Academic ── */}
      {activeTab === "Academic" && (
        <div style={{ maxWidth: 500 }}>
          <div className="card p-4">
            <p className="fs-p8 bold text-secondary mb-3" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Academic Details
            </p>
            <div className="form-group mb-3">
              <label className="form-control-label">Department</label>
              <DisplayVal value={dept} />
            </div>
            {[
              { label: "Roll Number",       name: "rollNumber" },
              { label: "Percentage / CGPA", name: "percentage" },
            ].map((f) => (
              <div className="form-group mb-3" key={f.name}>
                <label className="form-control-label">{f.label}</label>
                {editing ? (
                  <input className="form-control" name={f.name}
                    value={form[f.name] || ""} onChange={handleChange} />
                ) : (
                  <DisplayVal value={form[f.name]} />
                )}
              </div>
            ))}
            <div className="form-group mb-3">
              <label className="form-control-label">Current Year</label>
              {editing ? (
                <select className="form-control" name="year" value={form.year || ""} onChange={handleChange}>
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              ) : (
                <DisplayVal value={form.year ? `${form.year}${["st","nd","rd","th"][Number(form.year)-1] || "th"} Year` : ""} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Skills ── */}
      {activeTab === "Skills" && (
        <div className="row" style={{ gap: 14 }}>

          {/* Skills */}
          <div style={{ flex: 1 }}>
            <div className="card p-4">
              <p className="fs-p8 bold text-secondary mb-3" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Skills
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {skills.length === 0
                  ? <p className="fs-p9 text-secondary">No skills added yet</p>
                  : skills.map((s) => <Tag key={s} label={s} onRemove={(v) => setSkills((p) => p.filter((x) => x !== v))} editing={true} variant="skill" />)
                }
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input className="form-control" style={{ flex: 1 }}
                  placeholder="Type skill + Enter"
                  value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()} />
                <button className="btn btn-primary w-auto" style={{ padding: "8px 14px" }} onClick={addSkill}>Add</button>
              </div>
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 10 }}>
                <p className="fs-p8 text-secondary mb-2">Suggested — click to add</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                    <span key={s} onClick={() => editing && setSkills((p) => [...p, s])}
                      style={{
                        fontSize: "0.78rem", padding: "3px 10px", borderRadius: 12,
                        background: "var(--gray-100)", color: "var(--gray-600)",
                        border: "1px solid var(--gray-300)",
                        cursor: "pointer",
                      }}>
                      {s} +
                    </span>
                  ))}
                </div>
              </div>

              {/* Save skills button */}
              <button
                className="btn btn-primary mt-3"
                style={{ padding: "9px 24px" }}
                onClick={async () => {
                  setSaving(true); setMessage("");
                  try {
                    const studentId = studentData?.studentId || studentData?.id;
                    const payload   = { ...studentData, skills: skills.join(", ") };
                    await axios.patch(
                      `${rest.students.replace("students", "student-profile")}/${studentId}`,
                      payload,
                      getHeaders()
                    );
                    setStudentData((p) => ({ ...p, skills: skills.join(", ") }));
                    setMessage("Skills saved!"); setMsgType("success");
                    setTimeout(() => setMessage(""), 2500);
                  } catch (err) {
                    setMessage("Failed to save skills."); setMsgType("error");
                  } finally { setSaving(false); }
                }}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Skills"}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB: Resumes ── */}
      {activeTab === "Resumes" && (
        <div className="card p-4">
          <div className="row space-between items-center mb-3">
            <p className="fs-p8 bold text-secondary" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Resumes
            </p>
            <p className="fs-p8 text-secondary">{resumes.length} uploaded · PDF only · Max 5 MB</p>
          </div>

          {resumeMsg && (
            <div className={resumeMsgType === "success" ? "alert-success mb-3" : "alert-danger mb-3"}>
              <p className={resumeMsgType === "success" ? "text-success fs-p9" : "text-danger fs-p9"}>{resumeMsg}</p>
            </div>
          )}

          {/* Existing resumes */}
          {resumes.length === 0 && !uploading && (
            <p className="text-secondary fs-p9 text-center p-3">No resumes uploaded yet.</p>
          )}

          {resumes.map((r, i) => (
            <div key={r.resumeId || i} className="row items-center mb-2" style={{
              padding: "10px 14px", borderRadius: 10,
              border: "1px solid var(--border-color)",
              background: i === 0 ? "rgba(50,85,99,0.04)" : "var(--gray-100)",
              gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: "#325563", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.65rem", fontWeight: 700, flexShrink: 0,
              }}>
                PDF
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="bold fs-p9" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.resumeTitle || `Resume ${i + 1}`}
                </p>
                <p className="fs-p8 text-secondary">
                  {r.date ? new Date(r.date).toLocaleDateString("en-IN") : "Uploaded"}
                </p>
              </div>
              {i === 0 && (
                <span style={{
                  fontSize: "0.72rem", padding: "3px 10px", borderRadius: 12,
                  background: "rgba(50,85,99,0.12)", color: "var(--primary)", fontWeight: 600,
                }}>
                  Primary
                </span>
              )}
              <button
                onClick={() => openResume(r)}
                disabled={!r.resume2}
                className="btn btn-muted w-auto"
                style={{ padding: "5px 14px", fontSize: "0.78rem" }}
              >
                View
              </button>
            </div>
          ))}

          {uploading && (
            <div className="p-3 text-center mb-2" style={{
              border: "1px dashed var(--border-color)", borderRadius: 10, background: "rgba(50,85,99,0.03)",
            }}>
              <p className="fs-p9 text-secondary">Uploading...</p>
            </div>
          )}

          {/* Title + drop zone */}
          <div className="mt-3">
            <div className="form-group mb-2">
              <label className="form-control-label">
                Resume Title
                <span className="fs-p8 text-secondary" style={{ fontWeight: 400, marginLeft: 6 }}>
                  (optional — defaults to filename)
                </span>
              </label>
              <input className="form-control" placeholder="e.g. Software Engineer Resume"
                value={resumeTitle} onChange={(e) => setResumeTitle(e.target.value)} disabled={uploading} />
            </div>

            <div
              onClick={() => !uploading && fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
              style={{
                border: `2px dashed ${dragging ? "var(--primary)" : "var(--border-color)"}`,
                borderRadius: 12, padding: "2rem", textAlign: "center",
                cursor: uploading ? "not-allowed" : "pointer",
                background: dragging ? "rgba(50,85,99,0.04)" : "transparent",
                opacity: uploading ? 0.5 : 1,
              }}
            >
              <p className="bold fs-p9" style={{ color: "var(--gray-600)" }}>
                {dragging ? "Drop PDF here!" : "Drop PDF here or click to upload"}
              </p>
              <p className="fs-p8 text-secondary mt-1">PDF only · Max 5 MB</p>
              <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }}
                onChange={(e) => processFiles(e.target.files)} />
            </div>
          </div>
        </div>
      )}


    </div>
  );
}