import { BrowserRouter, Routes, Route } from "react-router-dom"
import RequireAuth from "./app/context/RequireAuth";
import './App.css'

import Home from "./app/pages/Home";
import Dashboard from "./app/pages/Dashboard";
import Classes from "./app/pages/Classes";
import Evidence from "./app/pages/Evidence";
import MasteryGrid from "./app/pages/MasteryGrid";
import Standards from "./app/pages/Standards";
import Students from "./app/pages/Students";


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>}/>

        <Route element={<RequireAuth/>}>
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/standards" element={<Standards />} />
          <Route path="/classes" element={<Classes />}/>
          <Route path="/classes/:classId/students" element={<Students />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App
