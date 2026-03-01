import { useAuth } from "./app/context/AuthContext";
import { signInAnonymously } from "firebase/auth";
import { auth } from "./app/services/firebase/firebase";

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div>APP CANARY: App rendered</div>
      <div>loading: {String(loading)}</div>
      <div>user: {user ? user.uid : "null"}</div>
      <button onClick={() => signInAnonymously(auth)}>
  Anonymous sign-in
</button>
    </div>
  );
}

/*
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./app/context/RequireAuth";
import "./App.css";

import Home from "./app/pages/Home";
import Dashboard from "./app/pages/Dashboard";
import ClassPage from "./app/pages/ClassPage";
import MasteryGrid from "./app/pages/MasteryGrid";
import StandardsListPage from "./app/pages/StandardsListPage";
import StandardPage from "./app/pages/StandardPage";
import StudentPage from "./app/pages/StudentPage";
import StudentList from "./app/pages/StudentList";
import ScoringPage from "./app/pages/ScoringPage";

import DashboardLayout from "./app/components/Dashboard/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/standardslist" element={<StandardsListPage />} />
            <Route path="/standard/:standardId" element={<StandardPage />} />
            <Route path="/studentlist" element={<StudentList />} />
            

            <Route path="/class/:classId" element={<ClassPage />} />
            <Route path="/class/:classId/standard/:standardId" element={<ScoringPage/>} />
            <Route path="/class/:classId/mastery" element={<MasteryGrid />} />
            <Route
              path="/classes/:classId/studentpage/:studentId"
              element={<StudentPage />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
*/