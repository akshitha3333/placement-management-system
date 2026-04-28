import { useNavigate, useLocation } from "react-router-dom";

function StudentNav({ children }) {
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
      <aside className="bg-primary-dark text-white p-4" style={{ width: "230px", minHeight: "100vh", overflowY: "auto", flexShrink: 0 }}>
        <div className="mb-5">
          <h3 className="bold">🎓 PlacementHub</h3>
          <p className="fs-p8 text-gray-300">Student Portal</p>
        </div>

        <p className="fs-p8 text-gray-300 mb-1">OVERVIEW</p>
        {navItem("/student-page/dashboard", "📊", "Dashboard")}

        <p className="fs-p8 text-gray-300 mb-1 mt-3">JOBS</p>
        {navItem("/student-page/student-recommended", "💼", "Recommended Jobs")}
        {navItem("/student-page/applications", "📄", "My Applications")}

        <p className="fs-p8 text-gray-300 mb-1 mt-3">PROCESS</p>
        {navItem("/student-page/interviews", "📅", "Interviews")}
        {navItem("/student-page/offers", "🎯", "Offers")}

        <p className="fs-p8 text-gray-300 mb-1 mt-3">TOOLS</p>
        {navItem("/student-page/meetings", "📹", "Meetings")}

        <p className="fs-p8 text-gray-300 mb-1 mt-3">ACCOUNT</p>
        {navItem("/student-page/profile", "👤", "My Profile")}

        <div className="mt-5 p-1 hover-bg cursor-pointer text-gray-300"
          onClick={() => { localStorage.removeItem("studentToken"); navigate("/"); }}>
          🚪 Logout
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <header className="row space-between items-center p-2 box-shadow bg-white" style={{ position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
          <div className="w-40">
            <input type="text" placeholder="Search jobs, companies..." className="form-control" />
          </div>
          <div className="row items-center">
            <div className="me-3 position-relative cursor-pointer">
              🔔
              <span style={{ position: "absolute", top: "-5px", right: "-8px", background: "red", color: "white", fontSize: "10px", padding: "2px 5px", borderRadius: "50%" }}>1</span>
            </div>
            <div className="row items-center cursor-pointer">
              <div className="bg-primary text-white br-circle me-2" style={{ width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center" }}>S</div>
              <span className="bold">Student</span>
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

export default StudentNav;
