import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Upload, Sparkles, Check, AlertCircle } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureProblem: (imageBase64: string, prompt?: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onCaptureProblem,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>('Solve this math problem with step-by-step steps');

  // Start camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      // Prefer rear/environment camera for scanning homework/textbooks
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      setCameraError('Camera access not granted or not available. You can upload an image or photo directly.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!capturedImage) return;
    onCaptureProblem(capturedImage, promptText);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm md:text-base">Photomath Scanner</h3>
              <p className="text-xs text-slate-400">Align textbook or handwritten equation inside the focus box</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] max-h-[460px] overflow-hidden">
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-2">
              <img
                src={capturedImage}
                alt="Captured math"
                className="max-h-[360px] w-auto object-contain rounded-lg border border-slate-800"
              />
              <button
                onClick={startCamera}
                className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-slate-900/90 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 hover:bg-slate-800 transition-colors shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>
            </div>
          ) : cameraActive ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Photomath-style Scanning Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="relative w-4/5 max-w-md h-36 border-2 border-indigo-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  {/* Scanner corners */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-indigo-400 rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-indigo-400 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-indigo-400 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-indigo-400 rounded-br" />

                  {/* Horizontal scanning laser animation */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse absolute top-1/2 transform -translate-y-1/2" />

                  <span className="absolute -bottom-7 inset-x-0 text-center text-xs font-medium text-slate-200 drop-shadow">
                    Fit mathematical problem within frame
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-4 max-w-sm">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 leading-relaxed">
                {cameraError || 'Camera inactive. Click below to activate or choose a photo from your files.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Enable Camera</span>
                </button>
                <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer controls */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {capturedImage ? (
            <div className="w-full flex items-center justify-between gap-3">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Optional instruction: e.g. 'Solve for x', 'Find integral'"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Solve This Problem</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Upload from Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {cameraActive && (
                <button
                  onClick={handleCapture}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
