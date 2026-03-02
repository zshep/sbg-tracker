import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="page">
      <div>LAYOUT CANARY: DashboardLayout rendered</div>
      <Outlet />
    </div>
  );
}


/*
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <NavBar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

*/