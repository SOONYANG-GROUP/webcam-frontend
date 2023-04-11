import "./App.css";
import io from "socket.io-client";
import { useCallback, useRef, useState } from "react";
import { useEffect } from "react";
import Whiteboard from "./components/Whiteboard";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import { Rnd } from "react-rnd";
const pc_config = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
  ],
};
const roomName = "1234";
//const SOCKET_SERVER_URL = "http://localhost:5000";
const SOCKET_SERVER_URL = "https://webcam-backend-13oo.onrender.com";

const Video = ({ stream, muted, xPosition, yPosition }) => {
  const ref = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    if (ref.current) ref.current.srcObject = stream;
    if (muted) setIsMuted(muted);
    setIsLoading(false);
  }, [stream, muted, xPosition, yPosition]);

  if (isLoading) {
    return <></>;
  }

  const MuteBtn = () => {
    console.log(isMuted);
    setIsMuted(!isMuted);
  };

  return (
    <>
      <Rnd
        default={{
          x: xPosition,
          y: yPosition,
          width: 320,
          height: "auto",
        }}
        style={{ zIndex: 2 }}
      >
        <video
          muted={isMuted}
          ref={ref}
          autoPlay
          style={{ width: "100%", height: "100%" }}
        />
        {isMuted ? (
          <>
            <button onClick={MuteBtn}>마이크 온~</button>
          </>
        ) : (
          <>
            <button onClick={MuteBtn}>음소거~</button>
          </>
        )}
      </Rnd>
    </>
  );
};

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
