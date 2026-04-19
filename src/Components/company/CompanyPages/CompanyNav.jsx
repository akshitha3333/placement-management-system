import { useNavigate } from "react-router-dom";


function CompanyNav({ children }) {

  const navigate = useNavigate();

  return (

    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      <aside
        className="bg-primary-dark text-white p-4"
        style={{ width: "250px", minHeight: "100vh", overflowY: "auto" }}
      >

        <div className="mb-5">
          <h3 className="bold">🎓 PlacementHub</h3>
          <p className="fs-p8 text-gray-300">Company Portal</p>
        </div>

        <p className="fs-p8 text-gray-300 mb-2">OVERVIEW</p>

        <div className="p-1 br-md hover-bg cursor-pointer"
          onClick={() => navigate("/company-page/dashboard")}>
          📊 Dashboard
        </div>

        <p className="fs-p8 text-gray-300 mb-2">RECRUITMENT</p>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/company-page/job-posts")}>
          👨‍🎓 Job Post
        </div>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/company-page/job-categories")}>
          🏢 Job Categories
        </div>

        <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/skills-required")}>
          👨‍🏫 Skills Required
        </div>

        <p className="fs-p8 text-gray-300 mb-2">HIRING PROCESS</p>

        <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/applications")}>
          📄 Applications
        </div>

         <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/shortlisted")}>
          ✅ Shortlisted
        </div>

         <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/interviews")}>
         📅 Interviews
        </div>

         <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/offers")}>
          💼 Offers
        </div>

        {/* PLACEMENT */}
        <p className="fs-p8 text-gray-300 mb-2">COMMUNICATION</p>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/company-page/meetings")}>
          📅 Meetings
        </div>

        <p className="fs-p8 text-gray-300 mb-2">REPORTS</p>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/applications")}>
          📊 Analytics
        </div>


        {/* SYSTEM */}
        <p className="fs-p8 text-gray-300 mb-2">SYSTEM</p>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/company-page/profile")}>
         🏢 Company Profile
        </div>

        {/* Sign Out */}
        <div className="mt-6 p-1 hover-bg cursor-pointer text-gray-300"
         onClick={() => navigate("/")}>
          🚪 Logout
        </div>

      </aside>
      <div style ={{ flex: 1,display: "flex", flexDirection: "column", height: "100vh" }}>

      <header className="row space-between items-center p-2 box-shadow header">

  {/* LEFT - Search */}
  <div className="w-30">
    <input
      type="text"
      placeholder="Search students, jobs, applications..."
      className="form-control"
    />
  </div>

  {/* RIGHT */}
  <div className="row items-center">

    {/* Quick Actions */}
    <div className="position-relative me-3 cursor-pointer">
      <button className="btn-sm bg-primary text-white">
        + Quick Actions
      </button>

      <div
        className="card p-2 position-absoulte"
        style={{
          top: "45px",
          right: "0",
          width: "180px",
          display: "none"
        }}
      >
        <div className="p-2 hover-bg cursor-pointer">📄 Post a Job</div>
        <div className="p-2 hover-bg cursor-pointer">📅 Schedule Interview</div>
      </div>
    </div>

    <div className="me-3 position-relative cursor-pointer">
      🔔
      <span
        className="bg-danger text-white br-circle"
        style={{
          position: "absolute",
          top: "-5px",
          right: "-8px",
          fontSize: "10px",
          padding: "2px 6px"
        }}
      >
        3
      </span>

      <div
        className="card position-absoulte"
        style={{
          top: "40px",
          right: "0",
          width: "260px",
          display: "none"
        }}
      >
        <div className="p-2 bold">Notifications</div>

        <div className="activity-item">
          <p className="fs-p9">New application received</p>
          <span className="fs-p8 text-gray-300">2 min ago</span>
        </div>

        <div className="activity-item">
          <p className="fs-p9">Interview scheduled</p>
          <span className="fs-p8 text-gray-300">1 hour ago</span>
        </div>

        <div className="activity-item">
          <p className="fs-p9">Offer accepted</p>
          <span className="fs-p8 text-gray-300">3 hours ago</span>
        </div>
      </div>
    </div>

    {/* PROFILE */}
    <div className="row items-center cursor-pointer">
      <div
        className="bg-primary text-white br-circle me-2"
        style={{
          width: "35px",
          height: "35px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        TC
      </div>

      <div >
        <p className="bold fs-p9">TechCorp</p>
        <span className="fs-p8 text-gray-500">HR Admin</span>
      </div>
    </div>

  </div>
</header>
        <div className="p-5" style={{flex: 1, overflowY: "auto"}}>
          {children}
        </div>

      </div>

    </div>
  );
}

export default CompanyNav;