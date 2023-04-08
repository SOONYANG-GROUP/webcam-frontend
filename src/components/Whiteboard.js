import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

function Whiteboard() {
  const [drawing, setDrawing] = useState(false);
  const [lines, setLines] = useState([]);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const socketRef = useRef();
  const canvasRef = useRef();
  const SOCKET_SERVER_URL = "https://webcam-backend-13oo.onrender.com";
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.on("whiteboard-data", (data) => {
      setLines((prevLines) => [...prevLines, data]);
    });
  }, [SOCKET_SERVER_URL]);

  const onMouseWheel = (e) => {
    e.preventDefault();
    if (e.nativeEvent.wheelDelta > 0) {
      setZoom((prevZoom) => prevZoom + 0.1);
    } else {
      setZoom((prevZoom) => Math.max(0.1, prevZoom - 0.1));
    }
  };

  const handleMouseDown = (event) => {
    setDrawing(true);
    const newLine = {
      type: "line",
      color: strokeColor,
      size: lineWidth,
      points: [getMousePosition(event)],
    };
    setLines((prevLines) => [...prevLines, newLine]);
    socketRef.current.emit("whiteboard-data", newLine);
  };

  const handleMouseMove = (event) => {
    if (!drawing) return;
    const newLine = { ...lines[lines.length - 1] };
    newLine.points.push(getMousePosition(event));
    setLines((prevLines) => [...prevLines.slice(0, -1), newLine]);
    socketRef.current.emit("whiteboard-data", newLine);
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    lines.forEach((line) => {
      drawLine(context, line.points, line.color, line.size);
    });
  }, [lines]);

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
}

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

export default Whiteboard;
