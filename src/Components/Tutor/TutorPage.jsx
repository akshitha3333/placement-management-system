import TutorNav from "./TutorNav";
import { Outlet } from "react-router-dom";

function TutorPage() {
  return (
    <TutorNav>
      <Outlet />
    </TutorNav>
  );
}

export default TutorPage;
