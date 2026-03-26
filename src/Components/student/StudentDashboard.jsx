// Legacy redirect — the real dashboard is at /student-page
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
function StudentDashboard() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/student-page"); }, []);
  return null;
}
export default StudentDashboard;
