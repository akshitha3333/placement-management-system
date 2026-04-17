import { useNavigate } from "react-router-dom";


function AdminNav({ children }) {

  const navigate = useNavigate();

  return (

    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      <aside
        className="bg-primary-dark text-white p-4"
        style={{ width: "250px", minHeight: "100vh", overflowY: "auto" }}
      >

        {/* Logo */}
        <div className="mb-5">
          <h3 className="bold">🎓 PlacementHub</h3>
          <p className="fs-p8 text-gray-300">Admin Portal</p>
        </div>

        {/* OVERVIEW */}
        <div className="p-1 br-md mb-2 hover-bg cursor-pointer"
          onClick={() => navigate("/admin-page/dashboard")}>
          📊 Dashboard
        </div>

        <p className="fs-p8 text-gray-300 mb-2">OVERVIEW</p>
         <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/admin-page/students")}>
          👨‍🎓 Students
        </div>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/admin-page/companies")}>
          🏢 Companies
        </div>

        <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/admin-page/tutors")}>
          👨‍🏫 Tutors
        </div>

        <div className="p-1 hover-bg cursor-pointer mb-2"
          onClick={() => navigate("/admin-page/departments")}>
          👨‍🏫 Departments
        </div>

        {/* PLACEMENT */}
        <p className="fs-p8 text-gray-300 mb-2">PLACEMENT</p>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/offers")}>
          🎯 Offers
        </div>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/meetings")}>
          📹 Meetings
        </div>

        {/* SYSTEM */}
        <p className="fs-p8 text-gray-300 mb-2">SYSTEM</p>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/reports")}>
          📊 Reports
        </div>

        <div className="p-1 hover-bg cursor-pointer"
          onClick={() => navigate("/notifications")}>
          🔔 Notifications
        </div>

        {/* Sign Out */}
        <div className="mt-6 p-1 hover-bg cursor-pointer text-gray-300"
         onClick={() => navigate("/")}>
          🚪 Logout
        </div>

      </aside>
      <div style={{ flex: 1,display: "flex", flexDirection: "column", height: "100vh" }}>

      <header 
        className="row space-between items-center p-2 box-shadow bg-white"
        style={{ position: "sticky", top: 0, zIndex: 10 }}
      >         
      {/* Search */}
          <div className="w-40">
            <input
              type="text"
              placeholder="Search students, companies, jobs..."
              className="form-control "
            />
          </div>

          {/* Right Section */}
          <div className="row items-center">

            {/* Notification */}
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

            {/* Profile */}
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

export default AdminNav;