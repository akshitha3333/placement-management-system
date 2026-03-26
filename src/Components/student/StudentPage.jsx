import StudentNav from "./StudentNav";
import { Outlet } from "react-router-dom";

function StudentPage() {
  return (
    <StudentNav>
      <Outlet />
    </StudentNav>
  );
}

export default StudentPage;
