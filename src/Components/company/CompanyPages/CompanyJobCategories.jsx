import { useState, useEffect } from "react";
import axios from "axios";
import rest from "../../../Rest";

const getToken = () => localStorage.getItem("token") || "";

const getHeader = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  },
});

function CompanyJobCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchCategories = () => {
    setLoading(true);
    axios.get(rest.jobCategory, getHeader())
      .then(res => {
        const list = Array.isArray(res.data.data) ? res.data.data
                   : Array.isArray(res.data)       ? res.data
                   : [];
        setCategories(list);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = () => {
    if (!categoryName.trim()) {
      setError("Category name is required.");
      return;
    }
    setError("");
    setSubmitting(true);

    axios.post(rest.jobCategory, { jobCategoryName: categoryName.trim() }, getHeader())
      .then(res => {
        const saved = res.data.data || res.data;
        setCategories(prev => [...prev, saved]);
        setCategoryName("");
        setShowModal(false);
        setSuccessMsg("Category added successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      })
      .catch(err => {
        console.error("Add error:", err);
        if (err.response?.status === 409) setError("This category already exists.");
        else if (err.response?.status === 401) setError("Session expired. Please login again.");
        else setError("Something went wrong. Please try again.");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Job Categories</h2>
          <p className="fs-p9 text-secondary">Manage categories used when posting jobs</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "auto", padding: "8px 20px", borderRadius: "10px" }}
          onClick={() => { setCategoryName(""); setError(""); setShowModal(true); }}
        >
          + Add Category
        </button>
      </div>

      {successMsg && (
        <div className="alert-success mb-3">
          <p className="fs-p9" style={{ color: "var(--success)", fontWeight: "600" }}>{successMsg}</p>
        </div>
      )}

      <div className="card p-2">
        {loading ? (
          <p className="text-center p-4">Loading...</p>
        ) : categories.length === 0 ? (
          <div className="text-center p-5">
            <p style={{ fontSize: "2.5rem" }}>📂</p>
            <p className="bold mt-2">No categories added yet</p>
            <p className="text-secondary fs-p9">Click "Add Category" to get started</p>
          </div>
        ) : (
          <table className="w-100">
            <thead>
              <tr>
                <th className="fs-p9 text-secondary">#</th>
                <th className="fs-p9 text-secondary">Category Name</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => (
                <tr key={cat.jobCategoryId || cat.id || index} className="hover-bg">
                  <td className="text-secondary fs-p9" style={{ width: "40px" }}>{index + 1}</td>
                  <td className="bold fs-p9">{cat.jobCategoryName || cat.categoryName || cat.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card p-4"
            style={{ width: "420px", maxWidth: "95%" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-3">
              <h3 className="bold">Add Category</h3>
              <button
                className="btn btn-sm btn-muted"
                style={{ width: "auto", padding: "4px 10px", borderRadius: "8px" }}
                onClick={() => setShowModal(false)}
              >✕</button>
            </div>

            <hr style={{ marginBottom: "16px", borderColor: "var(--border-color)" }} />

            <div className="form-group mb-3">
              <label className="form-control-label">Category Name *</label>
              <input
                className="form-control"
                placeholder="e.g. Software Engineering"
                value={categoryName}
                onChange={e => { setCategoryName(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
            </div>

            {error && (
              <div className="alert-danger mb-3">
                <p className="fs-p9" style={{ color: "var(--danger)", fontWeight: "600" }}>{error}</p>
              </div>
            )}

            <div className="row" style={{ gap: "10px" }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, borderRadius: "10px" }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Adding..." : "✔ Add Category"}
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

export default CompanyJobCategories;