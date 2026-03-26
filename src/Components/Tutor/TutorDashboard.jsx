// Legacy redirect — the real dashboard is at /tutor-page
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
function TutorDashboard() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/tutor-page"); }, []);
  return null;
}
export default TutorDashboard;
