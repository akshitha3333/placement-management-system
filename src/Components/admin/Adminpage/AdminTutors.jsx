import { useState } from "react";

function AdminTutors() {
  const [showModal, setShowModal] = useState(false);

  const [tutor, setTutor] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    department: ""
  });

  const handleChange = (e) => {
    setTutor({ ...tutor, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Tutor Data:", tutor);

    // 👉 Later connect backend here

    setShowModal(false);
  };

  return (
    <div className="p-4">

      {/* Header */}
      <div className="row space-between items-center mb-3">
        <div>
          <h2 className="fs-5 bold">Tutor Management</h2>
          <p className="fs-p9 text-gray-800">
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

        {/* Sample Card */}
        <div className="card p-3 w-30">
          <div className="row space-between">
            <div className="bold">Dr. Rajesh Verma</div>
            <span>...</span>
          </div>

          <p className="fs-p9 text-gray-500">Data Science & AI</p>
          <p className="fs-p9">rajesh@university.edu</p>

          <hr className="mt-2 mb-2" />

          <div className="row space-between">
            <div>
              <div className="bold">42</div>
              <span className="fs-p8 text-gray-500">Students</span>
            </div>

            <div>
              <div className="bold">128</div>
              <span className="fs-p8 text-gray-500">Sessions</span>
            </div>
          </div>
        </div>

      </div>

      {/* 🔥 MODAL */}
      {showModal && (
        <div className="modal-overlay">

          <div className="card p-4 modal-box">

            <h3 className="mb-3">Add Tutor</h3>

            <form onSubmit={handleSubmit}>

              <input
                className="form-control mb-2"
                placeholder="Full Name"
                name="name"
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
                placeholder="Email"
                name="email"
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
                placeholder="Phone Number"
                name="phone"
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
                placeholder="Specialization"
                name="specialization"
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
                placeholder="Experience (years)"
                name="experience"
                onChange={handleChange}
              />

              <input
                className="form-control mb-3"
                placeholder="Department Assigned"
                name="department"
                onChange={handleChange}
              />

              {/* Buttons */}
              <div className="row" style={{ gap: "10px" }}>
                <button className="btn btn-primary">Add Tutor</button>

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