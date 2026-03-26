import CompanyNav from "./CompanyNav";
import { Outlet } from "react-router-dom";
function CompanyPage() {
  return (
    <CompanyNav>
      <Outlet/>
    </CompanyNav>
  );
}
export default CompanyPage;