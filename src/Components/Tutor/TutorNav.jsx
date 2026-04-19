import { useNavigate, useLocation } from "react-router-dom";

function TutorNav({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path);

  const navItem = (path, icon, label) => (
    <div
      className={`p-1 br-md cursor-pointer mb-1 ${isActive(path) ? "nav-active" : "hover-bg"}`}
      onClick={() => navigate(path)}
    >
      {icon} {label}
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      <aside
        className="bg-primary-dark text-white p-4"
        style={{ width: "230px", minHeight: "100vh", overflowY: "auto", flexShrink: 0 }}
      >
        <div className="mb-5">
          <h3 className="bold">🎓 PlacementHub</h3>
          <p className="fs-p8 text-gray-300">Tutor Portal</p>
        </div>

        <p className="fs-p8 text-gray-300 mb-1">OVERVIEW</p>
        {navItem("/tutor-page/dashboard", "📊", "Dashboard")}

        <p className="fs-p8 text-gray-300 mb-1 mt-3">STUDENTS</p>
        {navItem("/tutor-page/students", "👨‍🎓", "My Students")}

        <p className="fs-p8 text-gray-300 mb-1 mt-3">JOBS</p>
        {navItem("/tutor-page/job-posts", "💼", "Job Posts")}

        <p className="fs-p8 text-gray-300 mb-1 mt-3">COMMUNICATION</p>
        {navItem("/tutor-page/meetings", "📹", "Meetings")}
        {navItem("/tutor-page/feedback", "💬", "Feedback")}

        <p className="fs-p8 text-gray-300 mb-1 mt-3">REPORTS</p>
        {navItem("/tutor-page/placement-report", "📑", "Placement Report")}
        {navItem("tutor-page/student-location", "🗺️", "Student Location")}
         

        <div
          className="mt-5 p-1 hover-bg cursor-pointer text-gray-300"
          onClick={() => { localStorage.removeItem("tutorToken"); navigate("/"); }}
        >
          🚪 Logout
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <header
          className="row space-between items-center p-2 box-shadow bg-white"
          style={{ position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}
        >
          <div className="w-40">
            <input type="text" placeholder="Search students..." className="form-control" />
          </div>
          <div className="row items-center">
            <div className="me-3 position-relative cursor-pointer">
              🔔
              <span style={{ position: "absolute", top: "-5px", right: "-8px", background: "red", color: "white", fontSize: "10px", padding: "2px 5px", borderRadius: "50%" }}>
                2
              </span>
            </div>
            <div className="row items-center cursor-pointer">
              <div
                className="bg-primary text-white br-circle me-2"
                style={{ width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                T
              </div>
              <span className="bold">Tutor</span>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default TutorNav;