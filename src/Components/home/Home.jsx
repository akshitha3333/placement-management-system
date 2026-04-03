import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Navbar */}
      
      <header className="row space-between p-2 items-center box-shadow ">
        <div className="fs-4 bold">🎓 PlacementHub</div>

        <div className="row">
          <a className="m-2 text-black medium" href="/">Home</a>
          <a className="m-2 text-black medium" href="/about-page">AboutUs</a>
          <a className="m-2 text-black medium" href="/">Companies</a>
          <a className="m-2 text-black medium" href="/">Contact</a>
          <div className="items-center me-6">
            <input type="button" value="Login" className="btn-sm btn-primary ms-5"  onClick={() => navigate("/roleselection")} />
          </div>
        </div>

      </header>
      <div class="row items-center p-7 hero-section">

        <div class="col-6">
          <p className="d-inline fs-p8 border br-lg p-2 text-primary-light">Transforming Campus Recruitment</p>
          <h1 className="hero-title mt-4">Your Gateway to </h1>
          <h1 className="gradient-text1">Dream</h1>
          <h1 className="gradient-text2">Placements</h1>
           <p className="mt-4 text-secoundary ">
              Streamline your campus recruitment journey with our comprehensive
              placement management system. Connect students, companies, and
              opportunities seamlessly.
          </p>
          <div className="row mt-5">
          <button className="btn btn-primary w-auto me-3" onClick={() => navigate("/roleselection")} >
            Get Started →
          </button>

          <button className="btn btn-muted w-auto">
            Learn More
          </button>
        </div>
        </div>
        <div class="col-6">
          <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
              alt="students"
              className="w-60 mt-4 br-md position-position"
            />
        </div>

      </div>

      {/* Statistics */}
      <section className="bg-primary-dark text-white pt-6 pb-6">
      <div className="row text-center items-center">

    <div className="col-3">
      <h2 className="fs-7 bold">450+</h2>
      <p className="fs-p9">Active Students</p>
    </div>

    <div className="col-3">
      <h2 className="fs-7 bold">85+</h2>
      <p className="fs-p9">Partner Companies</p>
    </div>

    <div className="col-3">
      <h2 className="fs-7 bold">200+</h2>
      <p className="fs-p9">Successful Placements</p>
    </div>

    <div className="col-3">
      <h2 className="fs-7 bold">12 LPA</h2>
      <p className="fs-p9">Average Package</p>
    </div>

  </div>
</section>


      <section className="hero-section pt-7 pb-7">

  <div className="text-center mb-6">
    <h2 className="fs-6 bold">
      Everything You Need for Successful Placements
    </h2>

    <p className="fs-p9 text-secondary mt-2">
      Comprehensive tools and features designed for students,
      companies, and administrators
    </p>
  </div>

  <div className="row">

    {/* Card 1 */}
    <div className="col-4 p-3">
      <div className="card p-5">

        <div className="mb-3">
          <span className="bg-primary-light p-2 br-md">
            👥
          </span>
        </div>

        <h3 className="fs-3 bold mb-2">
          Student Management
        </h3>

        <p className="text-secondary fs-p9 mb-3">
          Comprehensive student profiles, skill tracking, and
          application management system
        </p>

        <ul className="fs-p9 text-secondary">
          <li>✔ Profile Management</li>
          <li>✔ Resume Upload</li>
          <li>✔ Application Tracking</li>
        </ul>

      </div>
    </div>

    {/* Card 2 */}
    <div className="col-4 p-3">
      <div className="card p-5">

        <div className="mb-3">
          <span className="bg-secoundary-light p-2 br-md text-white">
            💼
          </span>
        </div>

        <h3 className="fs-3 bold mb-2">
          Job Portal
        </h3>

        <p className="text-secondary fs-p9 mb-3">
          Easy job posting, application management, and
          candidate screening
        </p>

        <ul className="fs-p9 text-secondary">
          <li>✔ Post Opportunities</li>
          <li>✔ Smart Matching</li>
          <li>✔ Applicant Screening</li>
        </ul>

      </div>
    </div>

    {/* Card 3 */}
    <div className="col-4 p-3">
      <div className="card p-5">

        <div className="mb-3">
          <span className="bg-warning p-2 br-md text-white">
            🏅
          </span>
        </div>

        <h3 className="fs-3 bold mb-2">
          Analytics & Insights
        </h3>

        <p className="text-secondary fs-p9 mb-3">
          Real-time analytics, placement trends,
          and performance metrics
        </p>

        <ul className="fs-p9 text-secondary">
          <li>✔ Placement Statistics</li>
          <li>✔ Performance Reports</li>
          <li>✔ Trend Analysis</li>
        </ul>

      </div>
    </div>

  </div>

</section>

      <section className="bg-primary-dark text-white pt-7 pb-7">

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

export default Home;