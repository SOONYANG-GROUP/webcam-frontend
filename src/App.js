import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Room from "./Pages/Room";
import Home from "./Pages/Home";

const App = () => {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:id" element={<Room />} />
      </Routes>
    </Router>
  )
}

export default App;
