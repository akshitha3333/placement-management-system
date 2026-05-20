import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const TABS = ["Personal", "Academic", "Resumes"];

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
  const [activeTab,   setActiveTab]   = useState("Personal");
  const [editing,     setEditing]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [message,     setMessage]     = useState("");
  const [msgType,     setMsgType]     = useState("");
  const [studentData, setStudentData] = useState(null);

  const [form, setForm] = useState({
    name: "", phone: "", rollNumber: "", percentage: "", year: "",
  });

  // ── Single resume state ──
  const [resume,        setResume]        = useState(null);  // single resume object
  const [resumeTitle,   setResumeTitle]   = useState("");
  const [uploading,     setUploading]     = useState(false);
  const [replacing,     setReplacing]     = useState(false); // toggle re-upload UI
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
          setStudentData(me);
          setForm({
            name:       me?.name       || "",
            phone:      me?.phone      || "",
            rollNumber: me?.rollNumber || "",
            percentage: me?.percentage || "",
            year:       me?.year       || "",
          });
        }

        if (resumeRes.status === "fulfilled") {
          const list = resumeRes.value.data?.data || resumeRes.value.data || [];
          const arr  = Array.isArray(list) ? list : [list].filter(Boolean);
          // Always use the latest resume as the single resume
          setResume(arr.length > 0 ? arr[arr.length - 1] : null);
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
        ...studentData,
        name:       form.name,
        phone:      form.phone,
        rollNumber: form.rollNumber,
        percentage: form.percentage,
        year:       form.year,
      };
      await axios.patch(
        `${rest.students.replace("students", "student-profile")}/${studentId}`,
        payload,
        getHeaders()
      );
      setStudentData((prev) => ({ ...prev, ...payload }));
      setEditing(false);
      setMessage("Profile saved successfully!");
      setMsgType("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
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

  // ── Upload / replace the single resume ──
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
    await axios.post(
      `${rest.studentResume}?resumeTitle=${encodeURIComponent(title)}`,
      fd, getMultipartHeaders()
    );

    // Re-fetch the full resume list so we get resume2 (base64 PDF data)
    const resumeRes = await axios.get(rest.studentResume, getHeaders());
    const list = resumeRes.data?.data || resumeRes.data || [];
    const arr  = Array.isArray(list) ? list : [list].filter(Boolean);
    setResume(arr.length > 0 ? arr[arr.length - 1] : null);

    setResumeTitle("");
    setReplacing(false);
    setResumeMsg("Resume uploaded successfully!");
    setResumeMsgType("success");
    setTimeout(() => setResumeMsg(""), 3000);
  } catch (err) {
    setResumeMsg(err.response?.data?.message || "Upload failed.");
    setResumeMsgType("error");
  } finally { setUploading(false); }
};

  const processFile = (files) => {
    const pdf = Array.from(files).find((f) => f.type === "application/pdf");
    if (!pdf) { setResumeMsg("PDF only."); setResumeMsgType("error"); return; }
    uploadResume(pdf);
  };

  // ── View resume ──
  // The backend sends resume2 with a wrong MIME type "data:image/jpeg;base64,..."
  // but the actual bytes are a valid PDF. We strip the prefix and force application/pdf.
  const openResume = () => {
  if (!resume?.resume2) { alert("Resume file not available."); return; }
  try {
    const raw = resume.resume2.includes(",")
      ? resume.resume2.split(",")[1]
      : resume.resume2;

    const binary = atob(raw);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Force correct PDF MIME type — backend sends wrong "image/jpeg" for PDFs
    const blob    = new Blob([bytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    const win = window.open(blobUrl, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      const a = document.createElement("a");
      a.href     = blobUrl;
      a.download = (resume.resumeTitle || "resume") + ".pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    console.error("openResume error:", err);
    alert("Could not open resume: " + err.message);
  }
};

  const dept  = studentData?.departmentModel?.departmentName || "—";
  const email = studentData?.userModel?.email || studentData?.email || "—";

  const checks = [
    { label: "Full Name",   done: !!form.name      },
    { label: "Phone",       done: !!form.phone      },
    { label: "Roll Number", done: !!form.rollNumber },
    { label: "Percentage",  done: !!form.percentage },
    { label: "Resume",      done: !!resume          },
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

      {/* ── TAB: Resumes ── */}
      {activeTab === "Resumes" && (
        <div className="card p-4" style={{ maxWidth: 560 }}>

          <div className="row space-between items-center mb-1">
            <p className="fs-p8 bold text-secondary" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              My Resume
            </p>
            <p className="fs-p8 text-secondary">PDF only · Max 5 MB</p>
          </div>

          {/* Feedback message */}
          {resumeMsg && (
            <div className={resumeMsgType === "success" ? "alert-success mb-3" : "alert-danger mb-3"}>
              <p className={resumeMsgType === "success" ? "text-success fs-p9" : "text-danger fs-p9"}>{resumeMsg}</p>
            </div>
          )}

          {/* ── Existing resume card (shown when a resume exists and not replacing) ── */}
          {resume && !replacing && (
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px", borderRadius: 12,
              border: "1.5px solid var(--primary)",
              background: "rgba(50,85,99,0.05)",
              marginBottom: 16,
            }}>
              {/* PDF icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "#325563", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.65rem", fontWeight: 700, flexShrink: 0,
              }}>
                PDF
              </div>

              {/* Title + date */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="bold fs-p9" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {resume.resumeTitle || resume.resume || "My Resume"}
                </p>
                <p className="fs-p8 text-secondary">
                  {resume.date ? new Date(resume.date).toLocaleDateString("en-IN") : "Uploaded"}
                </p>
              </div>

              {/* View button */}
              <button
                onClick={openResume}
                className="btn btn-muted w-auto"
                style={{ padding: "6px 14px", fontSize: "0.78rem", whiteSpace: "nowrap" }}
              >
                View
              </button>

              {/* Replace button */}
              <button
                onClick={() => { setReplacing(true); setResumeMsg(""); }}
                className="btn btn-primary w-auto"
                style={{ padding: "6px 14px", fontSize: "0.78rem", whiteSpace: "nowrap" }}
              >
                Replace
              </button>
            </div>
          )}

          {/* ── Upload area: shown when no resume OR when replacing ── */}
          {(!resume || replacing) && (
            <>
              {/* Warning banner shown only when replacing */}
              {replacing && (
                <div className="row items-center mb-3" style={{
                  gap: 10, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(255,180,0,0.08)",
                  border: "1px solid rgba(255,180,0,0.35)",
                }}>
                  <p className="fs-p9" style={{ flex: 1, color: "var(--text-secondary)" }}>
                    Uploading a new resume will replace the existing one.
                  </p>
                  <button
                    onClick={() => { setReplacing(false); setResumeMsg(""); setResumeTitle(""); }}
                    className="btn btn-muted w-auto"
                    style={{ padding: "4px 12px", fontSize: "0.78rem" }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Optional title */}
              <div className="form-group mb-2">
                <label className="form-control-label">
                  Resume Title
                  <span className="fs-p8 text-secondary" style={{ fontWeight: 400, marginLeft: 6 }}>
                    (optional — defaults to filename)
                  </span>
                </label>
                <input
                  className="form-control"
                  placeholder="e.g. Software Engineer Resume"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  disabled={uploading}
                />
              </div>

              {/* Drag & drop zone */}
              <div
                onClick={() => !uploading && fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files); }}
                style={{
                  border: `2px dashed ${dragging ? "var(--primary)" : "var(--border-color)"}`,
                  borderRadius: 12, padding: "2.5rem", textAlign: "center",
                  cursor: uploading ? "not-allowed" : "pointer",
                  background: dragging ? "rgba(50,85,99,0.04)" : "transparent",
                  opacity: uploading ? 0.5 : 1,
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                {uploading ? (
                  <p className="fs-p9 text-secondary">Uploading...</p>
                ) : (
                  <>
                    <p className="bold fs-p9" style={{ color: "var(--gray-600)" }}>
                      {dragging ? "Drop PDF here!" : "Drop PDF here or click to upload"}
                    </p>
                    <p className="fs-p8 text-secondary mt-1">PDF only · Max 5 MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: "none" }}
                  onChange={(e) => processFile(e.target.files)}
                />
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}

/**
 * EXPORTED UTILITY — returns the student's current resume.
 * Used in tutor / prediction pages.
 */
export function getPrimaryResume(resumeList) {
  if (!resumeList || resumeList.length === 0) return null;
  return resumeList[resumeList.length - 1];
}