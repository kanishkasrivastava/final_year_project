"use client";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as cocoSSDLoad } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import { renderPredictions } from "../utils/render-predictions";

let detectInterval;

const ObjectDetectionWeb = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [error, setError] = useState(null); // New state to hold errors

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const sendToBackend = async (predictions) => {
    try {
      const response = await fetch('/api/object-detection-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictions }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from backend");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error sending data to backend:", err);
      setError(err.message); // Set error message
      return [];
    }
  };

  async function runCoco() {
    setIsLoading(true);
    const net = await cocoSSDLoad();
    setIsLoading(false);

    detectInterval = setInterval(() => {
      runObjectDetection(net);
    }, 100);
  }

  async function runObjectDetection(net) {
    if (
      canvasRef.current &&
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      canvasRef.current.width = webcamRef.current.video.videoWidth;
      canvasRef.current.height = webcamRef.current.video.videoHeight;

      const detectedObjects = await net.detect(webcamRef.current.video);

      if (detectedObjects.length > 0) {
        console.log("Detected objects:", detectedObjects);
      } else {
        console.log("No objects detected");
      }

      const predictionsFromBackend = await sendToBackend(detectedObjects);
      setDetectedObjects(predictionsFromBackend);

      const context = canvasRef.current.getContext("2d");
      renderPredictions(predictionsFromBackend, context);
    }
  }

  const showmyVideo = () => {
    if (
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      const myVideoWidth = webcamRef.current.video.videoWidth;
      const myVideoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = myVideoWidth;
      webcamRef.current.video.height = myVideoHeight;
    }
  };

  useEffect(() => {
    runCoco();
    showmyVideo();
  }, []);

  return (
    <div className="mt-8">
      {isLoading ? (
        <div className="gradient-text">Loading AI Model...</div>
      ) : (
        <div className="relative flex justify-center items-center gradient p-1.5 rounded-md">
          <Webcam ref={webcamRef} className="rounded-md w-full lg:h-[720px]" muted />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 z-99999 w-full lg:h-[720px]"
          />
        </div>
      )}

      <div className="backend-results mt-4">
        <h2 className="text-xl font-bold">Backend API Results:</h2>
        <pre>{JSON.stringify(detectedObjects, null, 2)}</pre>
        {error && <div className="text-red-500">Error: {error}</div>}
      </div>
    </div>
  );
};

export default ObjectDetectionWeb;
