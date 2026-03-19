import { Navigate, useNavigate } from "react-router-dom";

function AboutPage() {

  return (

    <div className="bg-color">
       <header className="row space-between p-2 items-center box-shadow ">
        <div className="fs-4 bold">🎓 PlacementHub</div>

        <div className="row  ">
          <a className="m-2 text-black medium" href="/">Home</a>
          <a className="m-2 text-black medium" href="/about-page">AboutUs</a>
          <a className="m-2 text-black medium" href="/">Companies</a>
          <a className="m-2 text-black medium" href="/">Contact</a>
          <div className="items-center me-6">
            <input type="button" value="Login" className="btn-sm btn-primary ms-5"  onClick={() => Navigate("/roleselection")} />
          </div>
        </div>

      </header>

      {/* ================= HERO ================= */}
      <section className="p-7 text-center">

        <h1 className="fs-9 bold ">
          About PlacementHub
        </h1>

        <p className="text-secondary fs-2 w-60 bold m-auto mt-2">
          Revolutionizing campus recruitment with technology-driven solutions
          that connect talented students with leading companies
        </p>

      </section>


      {/* ================= ABOUT + MISSION ================= */}
      <section className="row p-1 items-center">

        {/* Image */}
        <div className="col-6 p-3">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
            alt="students"
            className="w-100 br-lg"
          />
        </div>

        {/* Content */}
        <div className="col-6 p-5">

          <div className="mb-3">
            <span className="bg-primary-light p-2 br-lg">🎯</span>
          </div>

          <h2 className="fs-7 bold mb-2">
            Our Mission
          </h2>

          <p className="text-secondary fs-2 mb-3">
            To simplify and streamline the entire campus recruitment process
            by providing an integrated platform that brings together students,
            companies, and educational institutions.
          </p>

          <p className="text-secondary fs-2">
            We believe that every student deserves access to quality career
            opportunities, and every company should be able to find the right
            talent efficiently.
          </p>

        </div>

      </section>


      {/* ================= CORE VALUES ================= */}
      <section className="p-7 text-center">

        <h2 className="fs-5 bold mb-5">Our Core Values</h2>

        <div className="row">

          {/* Value 1 */}
          <div className="col-3 p-3">
            <div className="card p-4 text-center">

              <div className="mb-3">
                <span className="bg-primary-light p-2 br-md">👥</span>
              </div>

              <h4 className="bold mb-2">Student-Centric</h4>

              <p className="text-secondary fs-p9">
                Empowering students with tools and resources to succeed
              </p>

            </div>
          </div>

          {/* Value 2 */}
          <div className="col-3 p-3">
            <div className="card p-4 text-center">

              <div className="mb-3">
                <span className="bg-success p-2 br-md text-white">📈</span>
              </div>

              <h4 className="bold mb-2">Innovation</h4>

              <p className="text-secondary fs-p9">
                Leveraging cutting-edge technology to enhance placement experience
              </p>

            </div>
          </div>

          {/* Value 3 */}
          <div className="col-3 p-3">
            <div className="card p-4 text-center">

              <div className="mb-3">
                <span className="bg-warning p-2 br-md text-white">🏅</span>
              </div>

              <h4 className="bold mb-2">Excellence</h4>

              <p className="text-secondary fs-p9">
                Delivering high-quality service and support
              </p>

            </div>
          </div>

          {/* Value 4 */}
          <div className="col-3 p-3">
            <div className="card p-4 text-center">

              <div className="mb-3">
                <span className="bg-info p-2 br-md text-white">✔️</span>
              </div>

              <h4 className="bold mb-2">Transparency</h4>

              <p className="text-secondary fs-p9">
                Building trust through clear communication
              </p>

            </div>
          </div>

        </div>

      </section>


      {/* ================= WHAT WE OFFER ================= */}
      <section className="p-7">

        <div className="card p-6">

          <h2 className="text-center fs-5 bold mb-5">
            What We Offer
          </h2>

          <div className="row">

            {/* LEFT */}
            <div className="col-6">

              <div className="mb-4">
                ✔ <span className="bold">Comprehensive Student Profiles</span>
                <p className="text-secondary fs-p9">
                  Detailed profiles showcasing skills, academics, and achievements
                </p>
              </div>

              <div className="mb-4">
                ✔ <span className="bold">Interview Management</span>
                <p className="text-secondary fs-p9">
                  Streamlined scheduling and coordination of campus interviews
                </p>
              </div>

              <div className="mb-4">
                ✔ <span className="bold">Document Management</span>
                <p className="text-secondary fs-p9">
                  Secure storage and verification of resumes and certificates
                </p>
              </div>

            </div>

            {/* RIGHT */}
            <div className="col-6">

              <div className="mb-4">
                ✔ <span className="bold">Smart Job Matching</span>
                <p className="text-secondary fs-p9">
                  AI-powered recommendations connecting students with opportunities
                </p>
              </div>

              <div className="mb-4">
                ✔ <span className="bold">Real-time Analytics</span>
                <p className="text-secondary fs-p9">
                  Insights and reports for data-driven decisions
                </p>
              </div>

              <div className="mb-4">
                ✔ <span className="bold">Mock Interview Platform</span>
                <p className="text-secondary fs-p9">
                  Practice sessions to prepare students for real interviews
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default AboutPage;