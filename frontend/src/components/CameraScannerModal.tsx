"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserProfile, ImageScanResult } from "../types";
import { scanImage } from "../lib/api";
import {
  Camera, Upload, X, RefreshCw, Sparkles, CheckCircle2,
  AlertOctagon, AlertTriangle, Eye, Image as ImageIcon,
  SwitchCamera, ScanLine
} from "lucide-react";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onScanComplete: (result: ImageScanResult, imageThumbnail: string) => void;
}

const PHOTO_PRESETS = [
  {
    name: "Prepared Meal: Creamy Alfredo Pasta",
    type: "Prepared Full Meal",
    hint: "Italian Fettuccine Alfredo with garlic bread and parmesan",
    emoji: "🍝",
    desc: "Pasta plate with white cream sauce, butter & shaved parmesan."
  },
  {
    name: "Prepared Meal: Thai Satay & Pad Thai",
    type: "Prepared Full Meal",
    hint: "Thai noodles with crushed peanut sauce and peanuts",
    emoji: "🍜",
    desc: "Wok noodles topped with crushed roasted peanuts & soy sauce."
  },
  {
    name: "Packaged Ingredient: Barbecue Glaze",
    type: "Packaged Product",
    hint: "Store-bought Barbecue sauce with barley malt extract",
    emoji: "🥫",
    desc: "Condiment bottle with barley malt extract & Worcestershire."
  },
  {
    name: "Prepared Meal: Seared Salmon & Asparagus (Safe)",
    type: "Prepared Full Meal",
    hint: "Pan-seared wild salmon with roasted sweet potatoes and asparagus",
    emoji: "🐟",
    desc: "Clean grilled salmon, olive oil, sea salt & steamed greens."
  },
  {
    name: "Single Ingredient: Raw Mixed Tree Nuts",
    type: "Single Ingredient",
    hint: "Whole almonds, cashews, and walnuts",
    emoji: "🥜",
    desc: "Whole tree nuts with direct anaphylactic risk."
  }
];

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  profile,
  onScanComplete
}) => {
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when camera tab is selected and modal is open
  useEffect(() => {
    if (isOpen && activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(err.message || "Could not access camera. Please allow permissions or use photo upload.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    analyzeCaptured(dataUrl, "Live Camera Meal Scan");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      analyzeCaptured(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PHOTO_PRESETS[0]) => {
    // Generate a clean placeholder data URL for preset preview
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 400, 300);
      ctx.font = "60px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(preset.emoji, 200, 140);
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(preset.name, 200, 200);
    }
    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);
    analyzeCaptured(dataUrl, preset.hint);
  };

  const analyzeCaptured = async (imageDataUrl: string, hint: string) => {
    setAnalyzing(true);
    try {
      const result: ImageScanResult = await scanImage(imageDataUrl, profile, hint);
      onScanComplete(result, imageDataUrl);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs">
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Camera & Photo Food Scanner
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Scan single ingredients or prepared full meals for {profile.name}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-1.5 gap-1.5">
          <button
            onClick={() => {
              setCapturedImage(null);
              setActiveTab("camera");
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "camera"
                ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab("upload");
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "upload"
                ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload or Presets</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                <ScanLine className="h-8 w-8 text-emerald-600 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  Analyzing Food & Auditing Allergens...
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
                  Running vision identification and cross-referencing ingredients with {profile.name}'s Celiac & allergy profiles.
                </p>
              </div>
            </div>
          ) : activeTab === "camera" ? (
            <div className="space-y-4">
              {cameraError ? (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5 text-center">
                  <AlertTriangle className="h-7 w-7 text-amber-600 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Camera Access Note
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">
                    {cameraError}
                  </p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-700 text-white text-xs font-bold shadow-xs hover:bg-amber-800"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Switch to Photo Upload & Presets</span>
                  </button>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-black aspect-video flex items-center justify-center border border-stone-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Viewfinder Overlay */}
                  <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-white/60 rounded-xl flex items-center justify-center">
                    <span className="bg-black/60 px-3 py-1 rounded-full text-[11px] font-semibold text-white/90 backdrop-blur-xs">
                      Align food plate or packaging label
                    </span>
                  </div>

                  {/* Flip camera button */}
                  <button
                    onClick={() => setFacingMode(facingMode === "environment" ? "user" : "environment")}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <SwitchCamera className="h-4 w-4" />
                  </button>
                </div>
              )}

              {cameraActive && !cameraError && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={capturePhoto}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Snap & Analyze Photo</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File upload drag zone */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 hover:border-emerald-500 transition-colors cursor-pointer bg-stone-50/50 dark:bg-stone-950/30">
                <Upload className="h-8 w-8 text-stone-400 dark:text-stone-500 mb-2" />
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Upload Food Photo or Label
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  JPEG, PNG, or WebP (e.g. photos from phone camera roll)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Instant Test Presets */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-2">
                  Or Test Instant Real-World Photo Presets:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PHOTO_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(p)}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left cursor-pointer"
                    >
                      <span className="text-2xl">{p.emoji}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {p.name.split(":")[1] || p.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5">
                          {p.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 dark:border-stone-800 p-4 bg-stone-50 dark:bg-stone-950/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>Vision AI: Evaluates single ingredients & prepared full dishes</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="font-medium hover:text-stone-800 dark:hover:text-stone-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
