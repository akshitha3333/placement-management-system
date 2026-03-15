function Home() {
  return (
    <>

      {/* Navbar */}
      <header className="row space-between p-3">
        <div className="fs-4 bold">🎓 PlacementHub</div>

        <nav>
          <a className="m-2" href="/">Home</a>
          <a className="m-2" href="/">Features</a>
          <a className="m-2" href="/">Companies</a>
          <a className="m-2" href="/">Contact</a>

          <button className="btn-sm btn-primary">Login</button>
        </nav>
      </header>


      {/* Hero Section */}
      <section className="row p-7">

        <div className="col-6">
          <h1 className="fs-7 mb-3">PlacementHub</h1>

          <p className="fs-3 mb-4">
            Streamline your campus recruitment journey with our
            comprehensive placement management system.
            Connect students, companies and opportunities seamlessly.
          </p>

          <button className="btn btn-primary w-30">Get Started</button>
          <button className="btn btn-secondary w-30 mt-2">Learn More</button>
        </div>


        <div className="col-6 text-center">

          <div className="card p-4 w-40 m-auto">
            <h2 className="fs-6 bold">85%</h2>
            <p className="fs-2">Placement Rate</p>
          </div>

          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
            alt="students"
            className="w-80 mt-4 br-md"
          />

        </div>

      </section>


      {/* Statistics */}
      <section className="row company-color text-center p-5">

        <div className="col-3">
          <h2 className="fs-6 bold">450+</h2>
          <p>Active Students</p>
        </div>

        <div className="col-3">
          <h2 className="fs-6 bold">85+</h2>
          <p>Partner Companies</p>
        </div>

        <div className="col-3">
          <h2 className="fs-6 bold">200+</h2>
          <p>Successful Placements</p>
        </div>

        <div className="col-3">
          <h2 className="fs-6 bold">12 LPA</h2>
          <p>Average Package</p>
        </div>

      </section>


      {/* Features */}
      <section className="p-7 text-center">

        <h2 className="fs-6 mb-3">
          Everything You Need for Successful Placements
        </h2>

        <p className="mb-5">
          Comprehensive tools designed for students,
          companies and administrators
        </p>

        <div className="row">


          <div className="col-3 p-3">
            <div className="card p-4">
              <h3 className="fs-3">Student Dashboard</h3>
              <p className="fs-p9 mt-2">
                Track applications, eligibility and placement progress easily.
              </p>
            </div>
          </div>


          <div className="col-3 p-3">
            <div className="card p-4">
              <h3 className="fs-3">Company Portal</h3>
              <p className="fs-p9 mt-2">
                Companies can post jobs and shortlist candidates efficiently.
              </p>
            </div>
          </div>


          <div className="col-3 p-3">
            <div className="card p-4">
              <h3 className="fs-3">Admin Management</h3>
              <p className="fs-p9 mt-2">
                Manage students, companies and recruitment drives.
              </p>
            </div>
          </div>


          <div className="col-3 p-3">
            <div className="card p-4">
              <h3 className="fs-3">Analytics</h3>
              <p className="fs-p9 mt-2">
                Visual insights into placements and performance.
              </p>
            </div>
          </div>


        </div>
      </section>


      {/* Companies */}
      <section className="p-7 text-center">

        <h2 className="fs-6 mb-4">Our Hiring Partners</h2>

        <div className="row">

          <div className="col-2 p-3">
            <div className="card p-3">Google</div>
          </div>

          <div className="col-2 p-3">
            <div className="card p-3">Microsoft</div>
          </div>

          <div className="col-2 p-3">
            <div className="card p-3">Amazon</div>
          </div>

          <div className="col-2 p-3">
            <div className="card p-3">Infosys</div>
          </div>

          <div className="col-2 p-3">
            <div className="card p-3">TCS</div>
          </div>

          <div className="col-2 p-3">
            <div className="card p-3">Wipro</div>
          </div>

        </div>

      </section>


      {/* Footer */}
      <footer className="text-center p-5">

        <h3 className="fs-4">PlacementHub</h3>

        <p className="mt-2">
          Empowering students and companies for successful placements.
        </p>

        <p className="mt-3 fs-p8">
          © 2026 PlacementHub. All rights reserved.
        </p>

      </footer>

    </>
  );
}

export default Home;