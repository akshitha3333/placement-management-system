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
          onClick={() => navigate("/company-page/students")}>
          👨‍🎓 Job Post
        </div>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/company-page/companies")}>
          🏢 Job Categories
        </div>

        <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/tutors")}>
          👨‍🏫 Skills Required
        </div>

        <p className="fs-p8 text-gray-300 mb-2">HIRING PROCESS</p>

        <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/departments")}>
          📄 Applications
        </div>

         <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/departments")}>
          ✅ Shortlisted
        </div>

         <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/departments")}>
         📅 Interviews
        </div>

         <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/company-page/departments")}>
          💼 Offers
        </div>

        <p className="fs-p8 text-gray-300 mb-2">COMMUNICATION</p>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/job-categories")}>
          📅 Meetings
        </div>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/job-posts")}>
          🔔 Notifications
        </div>

        <p className="fs-p8 text-gray-300 mb-2">REPORTS</p>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/applications")}>
          📊 Analytics
        </div>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/interviews")}>
          📑 Placement Reports
        </div>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/offers")}>
          🗺️ Students Map
        </div>

        <p className="fs-p8 text-gray-300 mb-2">SYSTEM</p>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/reports")}>
         🏢 Company Profile
        </div>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/settings")}>
          ⚙️ Settings
        </div>

        <div className="mt-6 p-1 hover-bg cursor-pointer text-gray-300"
         onClick={() => navigate("/admin-page/companies")}>
          🚪 Logout
        </div>

      </aside>
      <div style ={{ flex: 1,display: "flex", flexDirection: "column", height: "100vh" }}>

      <header 
        className="row space-between items-center p-2 box-shadow bg-white"
        style={{ position: "sticky", top: 0, zIndex: 10 }}
      >         
          <div className="w-40">
            <input
              type="text"
              placeholder="Search students, companies, jobs..."
              className="form-control "
            />
          </div>

          <div className="row items-center">

            <div className="me-3 position-relative cursor-pointer">
              🔔
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-8px",
                  background: "red",
                  color: "white",
                  fontSize: "10px",
                  padding: "2px 5px",
                  borderRadius: "50%"
                }}
              >
                3
              </span>
            </div>

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
                A
              </div>

              <span className="bold">Admin</span>

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