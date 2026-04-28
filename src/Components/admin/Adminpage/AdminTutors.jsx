import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function AdminTutors() {
  const [tutors,       setTutors]       = useState([]);
  const [departments,  setDepartments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [message,      setMessage]      = useState("");
  const [msgType,      setMsgType]      = useState("");
  const [toastMsg,     setToastMsg]     = useState("");

  const emptyForm = {
    tutorName:      "",
    email:          "",
    phone:          "",
    specialization: "",
    experience:     "",
    departmentId:   "",
    password:       "",
  };
  const [form, setForm] = useState(emptyForm);

  const getHeader = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || ""}`,
    },
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // ── Fetch tutors ─────────────────────────────────────────────────────────
  const fetchTutors = async () => {
    try {
      const res = await axios.get(rest.tutor, getHeader());
      const list = Array.isArray(res.data?.data) ? res.data.data
                 : Array.isArray(res.data)        ? res.data : [];
      console.log("Tutors fetched:", list.length, list);
      setTutors(list);
    } catch (err) {
      console.error("Fetch tutors error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch departments for dropdown ───────────────────────────────────────
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(rest.departments, getHeader());
      const list = Array.isArray(res.data?.data) ? res.data.data
                 : Array.isArray(res.data)        ? res.data : [];
      console.log("Departments:", list);
      setDepartments(list);
    } catch (err) {
      console.error("Fetch departments error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchTutors();
    fetchDepartments();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Add tutor ─────────────────────────────────────────────────────────────
  // Backend: POST /api/actors/tutors
  // Automatically sends login credentials email to tutor after creation
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.tutorName || !form.email || !form.phone || !form.departmentId || !form.password) {
      setMessage("All fields are required.");
      setMsgType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const payload = {
      tutorName:      form.tutorName,
      email:          form.email,
      phone:          form.phone,
      specialization: form.specialization,
      experience:     form.experience,
      departmentId:   Number(form.departmentId),
      password:       form.password,
    };
    console.log("Adding tutor payload:", payload);

    try {
      const res = await axios.post(rest.tutor, payload, getHeader());
      console.log("Add tutor response:", res.data);

      setShowModal(false);
      setForm(emptyForm);
      setMessage("");
      fetchTutors(); // refresh list
      showToast(`Tutor added successfully! Login credentials emailed to ${form.email}.`);
    } catch (err) {
      console.error("Add tutor error:", err.response?.data || err.message);
      const msg = err.response?.data?.message || err.response?.data || "Failed to add tutor.";
      if (String(msg).toLowerCase().includes("duplicate") || err.response?.status === 409) {
        setMessage("A tutor with this email or phone already exists.");
      } else {
        setMessage(String(msg));
      }
      setMsgType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setForm(emptyForm);
    setMessage("");
    setShowModal(true);
  };

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: "var(--primary)", color: "#fff",
          padding: "12px 20px", borderRadius: 10, fontWeight: 600,
          fontSize: "0.85rem", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          maxWidth: 380,
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Tutor Management</h2>
          <p className="fs-p9 text-secondary">
            Add tutors — login credentials are emailed to them automatically.
          </p>
        </div>
        <button className="btn btn-primary w-auto" style={{ padding: "8px 20px" }} onClick={openModal}>
          + Add Tutor
        </button>
      </div>

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10 }}>
        <div style={{ flex: "0 0 160px" }}>
          <div className="card p-3 text-center stat-card">
            <h2 className="bold" style={{ color: "var(--primary)" }}>{tutors.length}</h2>
            <p className="fs-p9 text-secondary">Total Tutors</p>
          </div>
        </div>
        <div style={{ flex: "0 0 160px" }}>
          <div className="card p-3 text-center stat-card">
            <h2 className="bold" style={{ color: "#0ea5e9" }}>{departments.length}</h2>
            <p className="fs-p9 text-secondary">Departments</p>
          </div>
        </div>
      </div>

      {/* Tutor cards */}
      {loading ? (
        <p className="text-secondary p-3">Loading...</p>
      ) : tutors.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mb-1">No tutors added yet</p>
          <p className="fs-p9 text-secondary">Click "+ Add Tutor" to create one.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {tutors.map((t) => (
            <div key={t.tutorId || t.id} className="card p-4" style={{ borderLeft: "4px solid var(--primary)" }}>

              {/* Avatar + Name */}
              <div className="row items-center mb-3" style={{ gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: "var(--primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "1rem",
                }}>
                  {(t.tutorName || "T").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="bold fs-p9" style={{ margin: 0 }}>{t.tutorName}</p>
                  <p className="fs-p8 text-secondary" style={{ margin: 0 }}>{t.specialization || "—"}</p>
                </div>
              </div>

              <hr style={{ borderColor: "var(--border-color)", margin: "0 0 12px" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "var(--gray-100)", borderRadius: 6, padding: "6px 10px" }}>
                  <p className="fs-p8 text-secondary">Email</p>
                  <p className="bold fs-p9" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.email || "—"}
                  </p>
                </div>
                <div style={{ background: "var(--gray-100)", borderRadius: 6, padding: "6px 10px" }}>
                  <p className="fs-p8 text-secondary">Phone</p>
                  <p className="bold fs-p9">{t.phone || "—"}</p>
                </div>
                <div style={{ background: "var(--gray-100)", borderRadius: 6, padding: "6px 10px" }}>
                  <p className="fs-p8 text-secondary">Experience</p>
                  <p className="bold fs-p9">{t.experience ? `${t.experience} yrs` : "—"}</p>
                </div>
                <div style={{ background: "var(--gray-100)", borderRadius: 6, padding: "6px 10px" }}>
                  <p className="fs-p8 text-secondary">Department</p>
                  <p className="bold fs-p9">{t.departmentModel?.departmentName || "—"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Tutor Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card p-5"
            style={{ width: 500, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-4">
              <h3 className="bold">Add Tutor</h3>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setShowModal(false)}>x</span>
            </div>

            {/* Email note */}
            <div style={{
              background: "rgba(14,165,233,0.07)",
              border: "1px solid rgba(14,165,233,0.2)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            }}>
              <p className="fs-p9" style={{ color: "var(--info)" }}>
                After creation, login credentials will be automatically emailed to the tutor.
              </p>
            </div>

            {message && (
              <div className={msgType === "error" ? "alert-danger mb-3" : "alert-success mb-3"}>
                <p className={msgType === "error" ? "text-danger fs-p9" : "text-success fs-p9"}>{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label className="form-control-label">Full Name *</label>
                <input className="form-control" placeholder="John Doe" name="tutorName"
                  value={form.tutorName} onChange={handleChange} />
              </div>

              <div className="form-group mb-3">
                <label className="form-control-label">Email *</label>
                <input className="form-control" type="email" placeholder="tutor@college.edu" name="email"
                  value={form.email} onChange={handleChange} />
              </div>

              <div className="form-group mb-3">
                <label className="form-control-label">Phone *</label>
                <input className="form-control" placeholder="9876543210" name="phone"
                  value={form.phone} onChange={handleChange} />
              </div>

              <div className="form-group mb-3">
                <label className="form-control-label">Specialization</label>
                <input className="form-control" placeholder="e.g. Web Development" name="specialization"
                  value={form.specialization} onChange={handleChange} />
              </div>

              <div className="form-group mb-3">
                <label className="form-control-label">Experience (years)</label>
                <input className="form-control" placeholder="e.g. 5" name="experience"
                  value={form.experience} onChange={handleChange} />
              </div>

              <div className="form-group mb-3">
                <label className="form-control-label">Department *</label>
                <select className="form-control" name="departmentId"
                  value={form.departmentId} onChange={handleChange}>
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-control-label">Password *</label>
                <input className="form-control" type="password" placeholder="Set initial password"
                  name="password" value={form.password} onChange={handleChange} />
                <p className="fs-p8 text-secondary mt-1">This password will be emailed to the tutor.</p>
              </div>

              <div className="row g-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Adding..." : "Add Tutor"}
                </button>
                <button type="button" className="btn btn-muted" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTutors;