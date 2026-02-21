import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./app/context/RequireAuth";
import "./App.css";

import Home from "./app/pages/Home";
import Dashboard from "./app/pages/Dashboard";
import ClassPage from "./app/pages/ClassPage";
import Evidence from "./app/pages/Evidence";
import MasteryGrid from "./app/pages/MasteryGrid";
import Standards from "./app/pages/Standards";
import StudentPage from "./app/pages/StudentPage";
import StudentList from "./app/pages/StudentList";

import DashboardLayout from "./app/components/Dashboard/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/standards" element={<Standards />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/studentlist" element={<StudentList />} />

            <Route path="/class/:classId" element={<ClassPage />} />
            <Route
              path="/classes/:classId/studentpage"
              element={<StudentPage />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
