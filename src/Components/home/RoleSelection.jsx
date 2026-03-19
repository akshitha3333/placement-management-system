import { useNavigate } from "react-router-dom";

function RoleSelection() {

  const navigate = useNavigate();

  return (
    <div>
        <header className="row space-between p-2 items-center box-shadow ">
        <div className="fs-4 bold">🎓 PlacementHub</div>

        <div className="row  ">
          <a className="m-2 text-black medium" href="/">Home</a>
          <a className="m-2 text-black medium" href="/">Features</a>
          <a className="m-2 text-black medium" href="/">Companies</a>
          <a className="m-2 text-black medium" href="/">Contact</a>
           
        </div>

      </header>
    <section className="p-7 mt-7 text-center">

      <h1 className="fs-7 bold mb-2">
        Choose Your Role
      </h1>

      <p className="text-secondary mb-6">
        Select your role to access the placement management system
      </p>

      <div className="row mt-7">

        {/* Administrator */}
        <div className="col-3 p-3 mt-6">
          <div 
            className="card p-5 role-card text-center"
            onClick={() => navigate("/admin-login")}
          >

            <div className="mb-3">
              <span className="icon-box bg-primary-light">🛡️</span>
            </div>

            <h3 className="fs-3 bold mb-2">Administrator</h3>

            <p className="text-secondary fs-p9 mb-3">
              Manage students, companies, and placement activities
            </p>

            <span className="text-link">Continue →</span>

          </div>
        </div>

        {/* Student */}
        <div className="col-3 p-3 mt-6">
          <div 
            className="card p-5 role-card text-center"
            onClick={() => navigate("/student-login")}
          >

            <div className="mb-3">
              <span className="icon-box bg-success text-white">🎓</span>
            </div>

            <h3 className="fs-3 bold mb-2">Student</h3>

            <p className="text-secondary fs-p9 mb-3">
              Apply for jobs, track applications, and manage your profile
            </p>

            <span className="text-link">Continue →</span>

          </div>
        </div>

        {/* Company */}
        <div className="col-3 p-3 mt-6">
          <div 
            className="card p-5 role-card text-center"
            onClick={() => navigate("/company-login")}
          >

            <div className="mb-3">
              <span className="icon-box bg-warning text-white">🏢</span>
            </div>

            <h3 className="fs-3 bold mb-2">Company</h3>

            <p className="text-secondary fs-p9 mb-3">
              Post jobs, review applicants, and schedule interviews
            </p>

            <span className="text-link">Continue →</span>

          </div>
        </div>

        {/* Tutor */}
        <div className="col-3 p-3 mt-6">
          <div 
            className="card p-5 role-card text-center"
            onClick={() => navigate("/tutor-login")}
          >

            <div className="mb-3">
              <span className="icon-box bg-info text-white">👨‍🏫</span>
            </div>

            <h3 className="fs-3 bold mb-2">Tutor</h3>

            <p className="text-secondary fs-p9 mb-3">
              Guide students, conduct mock interviews, and provide training
            </p>

            <span className="text-link">Continue →</span>

          </div>
        </div>

      </div>

      {/* Register Section */}
      <div className="mt-6">

        <p className="text-secondary">
          New student or company?
        </p>

        <p>
          <span 
            className="text-link"
            onClick={() => navigate("/student-register")}
          >
            Register as Student
          </span>

          {" | "}

          <span 
            className="text-link"
            onClick={() => navigate("/company-register")}
          >
            Register as Company
          </span>
        </p>

      </div>

    </section>
      <section className="bg-primary-dark text-white pt-7 pb-7 mt-6">

  <div className="text-center">

    <h2 className="fs-6 bold mb-3">
      Ready to Transform Your Campus Recruitment?
    </h2>

    <p className="fs-p9 text-gray-300 mb-5">
      Join hundreds of universities already using PlacementHub to connect
      students with their dream careers
    </p>

    <button className="btn btn-primary ms-auto me-auto w-auto ps-5 pe-5">
      Get Started Today →
    </button>

  </div>

</section>
    </div>
    
  );
}

export default RoleSelection;