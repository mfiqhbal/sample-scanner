'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface CameraProps {
  onCapture: (image: Blob) => void;
  onClose: () => void;
}

export function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsReady(true);
      }

      streamRef.current = mediaStream;
      setError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          stopCamera();
          onCapture(blob);
        }
      },
      'image/jpeg',
      0.9
    );
  }, [onCapture, stopCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <div className="text-white text-center mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>{error}</p>
        </div>
        <button
          onClick={handleClose}
          className="px-6 py-3 bg-slate-700 text-white rounded-lg"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-8 border-2 border-white/50 rounded-lg" />
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/30" />
        </div>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="absolute top-4 left-4 right-16 bg-black/50 rounded-lg px-3 py-2">
          <p className="text-white text-sm">Position the sample label within the frame</p>
        </div>
      </div>

      <div className="bg-black py-6 flex justify-center">
        <button
          onClick={capture}
          disabled={!isReady}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center disabled:opacity-50"
        >
          <div className="w-14 h-14 rounded-full border-4 border-black" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
