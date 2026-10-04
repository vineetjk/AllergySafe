"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserProfile, ImageScanResult } from "../types";
import { scanImage, errorMessage } from "../lib/api";
import { Camera, Upload, X, AlertTriangle, SwitchCamera, ScanLine, Info } from "lucide-react";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onScanComplete: (result: ImageScanResult, imageThumbnail: string) => void;
}

const SAMPLES = [
  { name: "Paneer Butter Masala", emoji: "🍛", desc: "Creamy restaurant-style curry" },
  { name: "Chole Bhature", emoji: "🫓", desc: "Chickpea curry with fried bread" },
  { name: "Idli Sambar", emoji: "🥣", desc: "Steamed rice cakes with lentil stew" },
  { name: "Masala Chai", emoji: "☕", desc: "Milk tea with sugar" },
  { name: "Tofu Stir Fry", emoji: "🥢", desc: "Tofu with vegetables and soy sauce" },
  { name: "Grilled Chicken Salad", emoji: "🥗", desc: "Lean protein and greens" },
];

const MAX_IMAGE_SIDE = 1280;

/** Downscale a photo so phone pictures upload quickly and stay under size limits. */
async function downscale(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function samplePicture(emoji: string, label: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(0, 0, 400, 300);
    ctx.font = "72px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(emoji, 200, 150);
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#fafaf9";
    ctx.fillText(label, 200, 220);
  }
  return canvas.toDataURL("image/jpeg");
}

function isPermissionError(err: unknown): boolean {
  const name = err instanceof DOMException ? err.name : "";
  return name === "NotAllowedError" || name === "SecurityError";
}

// Turns a getUserMedia failure into a message that says what to do about it.
function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return (
      "Camera permission is blocked for this site. Tap the icon next to the address bar (or open your browser's " +
      "site settings), set Camera to Allow, then tap Try again. On iPhone, also check Settings > Safari > Camera. " +
      "If you opened this link inside WhatsApp, Instagram, or another app, open it in Safari or Chrome instead."
    );
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No camera was found on this device. Use photo upload instead.";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "The camera is busy in another app or tab. Close it there, then tap Try again.";
  }
  return `The camera couldn't start${name ? ` (${name})` : ""}. Tap Try again, or use photo upload.`;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  profile,
  onScanComplete,
}) => {
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("upload");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  // Bumped by "Try again" to ask for the camera again after the user changes a setting.
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [dishName, setDishName] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  // Reasons the live camera can't work in this browser, known without asking.
  const cameraUnsupported =
    typeof window === "undefined"
      ? null
      : !window.isSecureContext
      ? "The live camera needs a secure (https) page. Use photo upload instead; it can still open your camera."
      : !navigator.mediaDevices?.getUserMedia
      ? "This browser doesn't support the live camera. Use photo upload instead."
      : null;

  const wantCamera = isOpen && activeTab === "camera" && !capturedImage && !cameraUnsupported;

  // Start the camera stream while the live-camera tab is showing.
  useEffect(() => {
    if (!wantCamera) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } })
      // Some phones and laptops reject the preferred size or lens; any camera will do.
      .catch((err: unknown) =>
        isPermissionError(err) ? Promise.reject(err) : navigator.mediaDevices.getUserMedia({ video: true })
      )
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraError(null);
        setCameraActive(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCameraError(cameraErrorMessage(err));
          setCameraActive(false);
        }
      });
    return () => {
      cancelled = true;
      releaseStream();
    };
  }, [wantCamera, facingMode, cameraAttempt]);

  const stopCamera = () => {
    releaseStream();
    setCameraActive(false);
  };

  // Clearing the photo turns the live camera back on (see wantCamera).
  const retake = () => {
    setCapturedImage(null);
    setProblem(null);
  };

  const close = () => {
    stopCamera();
    setCapturedImage(null);
    setProblem(null);
    setDishName("");
    setAnalyzing(false);
    setCameraError(null);
    onClose();
  };

  const analyze = async (imageDataUrl: string, hint: string) => {
    setAnalyzing(true);
    setProblem(null);
    try {
      const result = await scanImage(imageDataUrl, profile, hint);
      if (!result.identified || !result.scan_result) {
        setProblem(result.message || "I couldn't identify this food. Type its name below and try again.");
        return;
      }
      onScanComplete(result, imageDataUrl);
      close();
    } catch (err) {
      setProblem(errorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = await downscale(canvas.toDataURL("image/jpeg", 0.85));
    setCapturedImage(dataUrl);
    stopCamera();
    void analyze(dataUrl, dishName);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProblem("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = await downscale(event.target?.result as string);
      setCapturedImage(dataUrl);
      void analyze(dataUrl, dishName);
    };
    reader.readAsDataURL(file);
  };

  const handleSample = (sample: (typeof SAMPLES)[number]) => {
    const dataUrl = samplePicture(sample.emoji, sample.name);
    setCapturedImage(dataUrl);
    setDishName(sample.name);
    void analyze(dataUrl, sample.name);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/70 p-0 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Check a food photo"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Check a food photo</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">A meal, a single ingredient, or a packaged food</p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-1.5 gap-1.5">
          {(["upload", "camera"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setCapturedImage(null);
                setProblem(null);
                setActiveTab(tab);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs"
                  : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              {tab === "camera" ? <Camera className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              <span>{tab === "camera" ? "Live camera" : "Take or upload photo"}</span>
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Dish name helps identification */}
          <div>
            <label htmlFor="dish-hint" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              What is it? <span className="font-normal text-stone-400">(recommended)</span>
            </label>
            <input
              id="dish-hint"
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              maxLength={200}
              placeholder="e.g. rajma chawal, masala dosa, biscuits"
              className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {problem && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{problem}</span>
              </div>
              {capturedImage && (
                <button
                  onClick={() => analyze(capturedImage, dishName)}
                  disabled={!dishName.trim() || analyzing}
                  className="rounded-lg bg-amber-700 px-3 py-1.5 font-bold text-white hover:bg-amber-800 disabled:opacity-50 cursor-pointer"
                >
                  Check again with this name
                </button>
              )}
            </div>
          )}

          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                <ScanLine className="h-8 w-8 text-emerald-600 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Checking for {profile.name}...</p>
            </div>
          ) : activeTab === "camera" ? (
            <div className="space-y-4">
              {cameraUnsupported || cameraError ? (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5 text-center">
                  <AlertTriangle className="h-7 w-7 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">{cameraUnsupported || cameraError}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {cameraError && !cameraUnsupported && (
                      <button
                        onClick={() => {
                          setCameraError(null);
                          setCameraAttempt((n) => n + 1);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Try again</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Use photo upload</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-black aspect-video flex items-center justify-center border border-stone-800">
                  {capturedImage ? (
                    // The stream stops once a photo is taken; show that photo instead of a dead video.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={capturedImage} alt="Photo you took" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-white/60 rounded-xl flex items-end justify-center pb-2">
                        <span className="bg-black/60 px-3 py-1 rounded-full text-[11px] font-semibold text-white/90">
                          Fit the plate or label in the frame
                        </span>
                      </div>
                      <button
                        onClick={() => setFacingMode(facingMode === "environment" ? "user" : "environment")}
                        aria-label="Switch camera"
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                      >
                        <SwitchCamera className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
              {capturedImage && !cameraUnsupported && !cameraError && (
                <div className="flex justify-center">
                  <button
                    onClick={retake}
                    className="flex items-center gap-2 rounded-2xl border border-stone-200 dark:border-stone-700 px-6 py-2.5 text-sm font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Retake photo</span>
                  </button>
                </div>
              )}
              {cameraActive && !cameraError && !cameraUnsupported && (
                <div className="flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Take photo and check</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 hover:border-emerald-500 transition-colors cursor-pointer bg-stone-50/50 dark:bg-stone-950/30">
                <Upload className="h-8 w-8 text-stone-400 dark:text-stone-500 mb-2" />
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200">Take a photo or choose one</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">On a phone this can open the camera</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <div>
                <span className="text-sm font-medium text-stone-500 dark:text-stone-400 block mb-2">
                  Or try a sample dish
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLES.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => handleSample(s)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left cursor-pointer"
                    >
                      <span className="text-2xl" aria-hidden>
                        {s.emoji}
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">{s.name}</span>
                        <span className="block text-[11px] text-stone-500 dark:text-stone-400">{s.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-stone-100 dark:border-stone-800 p-3.5 bg-stone-50 dark:bg-stone-950/60 text-[11px] text-stone-500 dark:text-stone-400">
          Without an image model on the server, the dish name you type is used to look up typical ingredients.
        </div>
      </div>
    </div>
  );
};
