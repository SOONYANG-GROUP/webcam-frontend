import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
// import BackGround from "../assets/images/Loading.jpg";
import FadeLoader from "react-spinners/FadeLoader";
function Whiteboard({ pcsRef, lines, setLines, dataChannel }) {
  const [drawing, setDrawing] = useState(false);

  const [strokeColor, setStrokeColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  //const [lines, setLines] = useState([]);
  const socketRef = useRef();
  const canvasRef = useRef();
  //const SOCKET_SERVER_URL = "https://webcam-backend-13oo.onrender.com";
  const SOCKET_SERVER_URL = "http://localhost:5000";

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.on("whiteboard-data", (data) => {
      setLines((prevLines) => [...prevLines, data]);
    });
  }, [SOCKET_SERVER_URL, setLines]);

  const handleMouseDown = (event) => {
    setDrawing(true);
    const newLine = {
      type: "line",
      color: strokeColor,
      size: lineWidth,
      points: [getMousePosition(event)],
    };
    setLines((prevLines) => [...prevLines, newLine]);
    dataChannel.current.send(JSON.stringify(newLine));
  };

  const handleMouseMove = (event) => {
    if (!drawing) return;
    const newLine = { ...lines[lines.length - 1] };
    newLine.points.push(getMousePosition(event));
    setLines((prevLines) => [...prevLines.slice(0, -1), newLine]);
    dataChannel.current.send(JSON.stringify(newLine));
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  const handleColorChange = (event) => {
    setStrokeColor(event.target.value);
  };

  const handleLineWidthChange = (event) => {
    setLineWidth(event.target.value);
  };

  const getMousePosition = (event) => {
    const rect = event.target.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  function drawLine(context, points, strokeColor, lineWidth) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => {
      context.lineTo(point.x, point.y);
    });
    context.strokeStyle = strokeColor;
    context.lineWidth = lineWidth;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
  }

  useEffect(() => {
    if (!canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    lines.forEach((line) => {
      drawLine(context, line.points, line.color, line.size);
    });
  }, [lines]);

  if (Object.keys(pcsRef.current).length !== 0) {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "white",
          zIndex: -1,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <canvas
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
          width={window.innerWidth}
          height={window.innerHeight}
          ref={canvasRef}
        />
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <label htmlFor="color-picker">Color:</label>
          <input
            type="color"
            id="color-picker"
            value={strokeColor}
            onChange={handleColorChange}
          />
          <br />
          <label htmlFor="line-width-picker">Line Width:</label>
          <input
            type="range"
            id="line-width-picker"
            min="1"
            max="20"
            value={lineWidth}
            onChange={handleLineWidthChange}
          />
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <div className="contentWrap">
          <div
            style={{
              position: "fixed",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontWeight: "700",
            }}
          >
            팀원을 기다리는 중입니다.
          </div>

          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <FadeLoader
              color="#C63DEE"
              height={15}
              width={5}
              radius={2}
              margin={2}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Whiteboard;
