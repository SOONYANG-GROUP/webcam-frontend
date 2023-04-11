import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Room from "./Pages/Room";

const App = () => {
  return(
    <Router>
      <Routes>
        <Route path="/room/:id" element={<Room />} />
      </Routes>
    </Router>
  )
}

export default App;