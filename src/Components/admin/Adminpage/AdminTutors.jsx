import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from 'js-cookie'
const rest = require("../../../Rest")
function AdminTutors() {
  const [showModal, setShowModal] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tutor, setTutor] = useState({
    tutorName: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    departmentId: "",
    password: ""
  });

       const header = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Cookies.get('token')}`
        }
    };

  const fetchTutors = async () => {
    try {
      const res = await axios.get(rest.tutor,header);
      console.log(res.data);
      
      setTutors(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

 useEffect(() => {
  fetchTutors();
  fetchDepartments();  
}, []);

  const handleChange = (e) => {
    setTutor({ ...tutor, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(rest.tutor, tutor,header);
     if(res.data==="Duplicate Tutor Added."){
       alert()
       return
     }
      setTutors([...tutors, res.data]);

      setShowModal(false);

      setTutor({
        tutorName: "",
        email: "",
        phone: "",
        specialization: "",
        experience: "",
        departmentId: "",
        password: ""
      });

    } catch (err) {
      console.log(err);
    }
  };
  const fetchDepartments = async () => {
  try {
    const res = await axios.get(rest.departments, header); // make sure this API exists
    setDepartments(res.data.data);
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

            <div className="row space-between items-center">
  <div className="bold">{t.tutorName}</div>

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
                <div className="bold">{t.departmentModel?.departmentName || "No Department"}</div>
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
                name="tutorName"
                value={tutor.tutorName}
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

              <select
                className="form-control mb-2"
                name="departmentId"
                value={tutor.departmentId}
                onChange={handleChange}
              >
                <option value="">Select Department</option>

                {departments.map((dept) => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.departmentName}
                  </option>
                ))}
              </select>

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
                Add Tutors
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