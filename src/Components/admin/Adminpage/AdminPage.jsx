import AdminNav from "./AdminNav";
import { Outlet } from "react-router-dom";
function AdminPage() {
  return (
    <AdminNav>
      <Outlet/>
    </AdminNav>
  );
}
export default AdminPage;