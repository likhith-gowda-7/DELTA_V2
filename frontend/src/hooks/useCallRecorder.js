import { useEffect, useRef, useState } from "react";

const log = (...args) => {
  if (import.meta.env.DEV) {
    console.log("[CallRecorder]", ...args);
  }
};

/**
 * Custom hook for managing call recording with MediaRecorder API
 * Records combined audio/video streams from all participants
 */
export const useCallRecorder = (streams = []) => {
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Start recording
   */
  const startRecording = async (audioTracks = [], videoTracks = []) => {
    try {
      // Create audio context to mix tracks
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const audioDestination = audioContext.createMediaStreamDestination();

      // Add audio tracks to destination
      audioTracks.forEach((track) => {
        const source = audioContext.createMediaStreamSource(
          new MediaStream([track]),
        );
        source.connect(audioDestination);
      });

      // Create canvas for video mixing (if multiple video tracks)
      let canvas = null;
      let canvasStream = null;

      if (videoTracks.length > 0) {
        canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");

        canvasStream = canvas.captureStream(30); // 30 FPS
      }

      // Combine audio and video
      const recordingStream = new MediaStream();

      // Add audio tracks
      audioDestination.stream.getAudioTracks().forEach((track) => {
        recordingStream.addTrack(track);
      });

      // Add video tracks
      if (canvasStream) {
        canvasStream.getVideoTracks().forEach((track) => {
          recordingStream.addTrack(track);
        });
      }

      // Create MediaRecorder
      const options = {
        mimeType: "video/webm;codecs=vp9",
      };

      // Fallback mime types
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm;codecs=vp8";
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/mp4";
      }

      const mediaRecorder = new MediaRecorder(recordingStream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start duration timer
      const startTime = Date.now();
      const durationInterval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 100);

      // Store interval for cleanup
      mediaRecorderRef.current.durationInterval = durationInterval;

      return recordingStream;
    } catch (err) {
      const errorMsg = `Failed to start recording: ${err.message}`;
      setError(errorMsg);
      log(errorMsg);
      throw err;
    }
  };

  /**
   * Stop recording and get blob
   */
  const stopRecording = async () => {
    try {
      if (!mediaRecorderRef.current) {
        throw new Error("Recording not started");
      }

      return new Promise((resolve, reject) => {
        mediaRecorderRef.current.onstop = () => {
          // Clear duration interval
          if (mediaRecorderRef.current.durationInterval) {
            clearInterval(mediaRecorderRef.current.durationInterval);
          }

          const blob = new Blob(recordedChunksRef.current, {
            type: mediaRecorderRef.current.mimeType,
          });

          recordedChunksRef.current = [];
          mediaRecorderRef.current = null;

          setIsRecording(false);
          setRecordingDuration(0);

          resolve(blob);
        };

        mediaRecorderRef.current.onerror = (event) => {
          reject(new Error(`Recording error: ${event.error}`));
        };

        mediaRecorderRef.current.stop();
      });
    } catch (err) {
      const errorMsg = `Failed to stop recording: ${err.message}`;
      setError(errorMsg);
      log(errorMsg);
      throw err;
    }
  };

  /**
   * Download recording
   */
  const downloadRecording = (blob, filename = "recording.webm") => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMsg = `Failed to download recording: ${err.message}`;
      setError(errorMsg);
      log(errorMsg);
      throw err;
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    isRecording,
    recordingDuration,
    error,
    startRecording,
    stopRecording,
    downloadRecording,
  };
};

export default useCallRecorder;
