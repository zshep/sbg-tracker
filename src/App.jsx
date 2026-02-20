import { BrowserRouter, Routes, Route } from "react-router-dom"
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
        <Route path="/teacher/{uid}" element={<Dashboard/>} />
        <Route path="teacher/{uid}/classes/{uid}" element={<Classes />}/>


      </Routes>
    
    </BrowserRouter>
  )
}

export default App
