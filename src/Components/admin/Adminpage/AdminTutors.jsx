import { useState, useEffect } from "react";
import axios from "axios";

function AdminTutors() {
  const [showModal, setShowModal] = useState(false);
  const [tutors, setTutors] = useState([]);

  const [tutor, setTutor] = useState({
    tutorName: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    departmentName: "",
    password: ""
  });

  // 🔥 Fetch tutors from backend
  const fetchTutors = async () => {
    try {
      const res = await axios.get("/admin-tutors");
      setTutors(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  const handleChange = (e) => {
    setTutor({ ...tutor, [e.target.name]: e.target.value });
  };

  // 🔥 Add tutor
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/admin-add-tutor", tutor);

      // Add new tutor to UI instantly
      setTutors([...tutors, res.data]);

      setShowModal(false);

      // Reset form
      setTutor({
        name: "",
        email: "",
        phone: "",
        specialization: "",
        experience: "",
        department: "",
        password: ""
      });

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-4">

      {/* Header */}
      <div className="row space-between items-center mb-3">
        <div>
          <h2 className="fs-5 bold">Tutor Management</h2>
          <p className="fs-p9 text-gray-500">
            Manage placement trainers and mentors
          </p>
        </div>

        <button
          className="btn btn-primary w-auto"
          onClick={() => setShowModal(true)}
        >
          + Add Tutor
        </button>
      </div>

      {/* Cards */}
      <div className="row" style={{ gap: "15px" }}>

        {tutors.map((t) => (
          <div key={t.id} className="card p-3 w-30">

            <div className="row space-between">
              <div className="bold">{t.name}</div>

              {/* Status */}
              <span
                className="status-item"
                style={{
                  background: t.active
                    ? "rgba(22,163,74,0.1)"
                    : "rgba(220,38,38,0.1)",
                  color: t.active ? "#16a34a" : "#dc2626"
                }}
              >
                {t.active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="fs-p9 text-gray-500">{t.specialization}</p>
            <p className="fs-p9">{t.email}</p>

            <hr className="mt-2 mb-2" />

            <div className="row space-between">
              <div>
                <div className="bold">{t.experience} yrs</div>
                <span className="fs-p8 text-gray-500">Experience</span>
              </div>

              <div>
                <div className="bold">{t.department}</div>
                <span className="fs-p8 text-gray-500">Department</span>
              </div>
            </div>
          </div>
        ))}

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card p-4 modal-box">

            <h3 className="mb-3">Add Tutor</h3>

            <form onSubmit={handleSubmit}>

              <input
                className="form-control mb-2"
                placeholder="Full Name"
                name="name"
                value={tutor.name}
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
                placeholder="Email"
                name="email"
                value={tutor.email}
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
                placeholder="Phone Number"
                name="phone"
                value={tutor.phone}
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
                placeholder="Specialization"
                name="specialization"
                value={tutor.specialization}
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
                placeholder="Experience (years)"
                name="experience"
                value={tutor.experience}
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
                placeholder="Department"
                name="department"
                value={tutor.department}
                onChange={handleChange}
              />

              {/* 🔐 PASSWORD FIELD */}
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Set Password"
                name="password"
                value={tutor.password}
                onChange={handleChange}
              />

              <div className="row" style={{ gap: "10px" }}>
              <button  type="button" className="btn btn-primary" onClick={handleSubmit}>
                Add Department
              </button>
                <button
                  type="button"
                  className="btn btn-muted"
                  onClick={() => setShowModal(false)}
                >
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