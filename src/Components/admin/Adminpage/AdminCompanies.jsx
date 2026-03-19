import { useEffect, useState } from "react";
import axios from "axios";

function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      const res = await axios.get("/admin-companies", {
        params: { status }
      });
      setCompanies(res.data);
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [status]);

  return (
    <div
      className="p-4"
      style={{
        height: "calc(100vh - 70px)",
        overflowY: "auto"
      }}
    >
      {/* Header */}
      <div className="row items-center space-between mb-3">
        <div>
          <h2 className="fs-5 bold">Company Management</h2>
          <p className="fs-p9 text-gray-300">
            Review and manage company registrations
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-3" style={{ gap: "10px" }}>
        <select
          className="form-control w-20"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-2">
        {loading ? (
          <p className="text-center p-3">Loading...</p>
        ) : (
          <table className="w-100">
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>Contact</th>
                <th>Job Posts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-3">
                    No companies found
                  </td>
                </tr>
              ) : (
                companies.map((comp) => (
                  <tr key={comp.id} className="hover-bg">

                    {/* Company */}
                    <td>
                      <div className="row items-center" style={{ gap: "10px" }}>
                        <div className="company-icon">🏢</div>

                        <div>
                          <div className="bold">{comp.name}</div>
                          <div className="fs-p8 text-gray-300">
                            {comp.companyCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>{comp.industry}</td>
                    <td>{comp.email}</td>
                    <td className="bold">{comp.jobPosts}</td>

                    {/* Status */}
                    <td>
                      <span
                        className="status-item"
                        style={{
                          background:
                            comp.status === "Verified"
                              ? "rgba(22,163,74,0.1)"
                              : comp.status === "Pending"
                              ? "rgba(245,158,11,0.1)"
                              : "rgba(220,38,38,0.1)",
                          color:
                            comp.status === "Verified"
                              ? "#16a34a"
                              : comp.status === "Pending"
                              ? "#f59e0b"
                              : "#dc2626"
                        }}
                      >
                        {comp.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="row" style={{ gap: "8px" }}>
                        <span className="cursor-pointer">👁️</span>
                        <span className="cursor-pointer text-success">✔</span>
                        <span className="cursor-pointer text-danger">✖</span>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminCompanies;
