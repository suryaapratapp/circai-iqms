"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, ScanLine, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/field";
import { SurfaceCard } from "@/components/ui/surface-card";

type ScannerProps = {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
};

type ScannerState = "idle" | "starting" | "ready" | "error";
type ZXingModule = typeof import("@zxing/browser");
type ScannerControls = { stop: () => void };

const preferredFormats = [
  "QR_CODE",
  "EAN_13",
  "EAN_8",
  "UPC_A",
  "UPC_E",
  "CODE_128",
  "CODE_39",
  "ITF"
] as const;

const ignoredDecodeErrors = new Set([
  "NotFoundException",
  "ChecksumException",
  "FormatException"
]);

const fallbackConstraintErrors = new Set([
  "OverconstrainedError",
  "ConstraintNotSatisfiedError",
  "NotFoundError",
  "DevicesNotFoundError"
]);

export function ScannerModal({ open, onClose, onDetected }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const zxingRef = useRef<ZXingModule | null>(null);
  const detectedRef = useRef(false);
  const sessionRef = useRef(0);
  const [manualValue, setManualValue] = useState("");
  const [status, setStatus] = useState("Open the camera to scan a barcode or QR code.");
  const [scannerState, setScannerState] = useState<ScannerState>("idle");

  useEffect(() => {
    if (!open) {
      stopScanner();
      setManualValue("");
      setScannerState("idle");
      setStatus("Open the camera to scan a barcode or QR code.");
      return;
    }

    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;
    detectedRef.current = false;
    setManualValue("");
    setScannerState("starting");
    setStatus("Starting camera...");

    void startScanner(sessionId);

    return () => {
      stopScanner();
    };
  }, [open]);

  async function startScanner(sessionId: number) {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.isSecureContext) {
      setScannerState("error");
      setStatus("Camera scanning requires HTTPS or localhost. Use a secure connection or manual entry.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerState("error");
      setStatus("This browser cannot open the camera. Use manual entry below.");
      return;
    }

    try {
      const zxing = await import("@zxing/browser");
      zxingRef.current = zxing;

      const devices = await zxing.BrowserCodeReader.listVideoInputDevices();
      if (!devices.length) {
        setScannerState("error");
        setStatus("No camera was found on this device. Use manual entry below.");
        return;
      }

      const reader = new zxing.BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 180,
        delayBetweenScanSuccess: 500
      });
      reader.possibleFormats = preferredFormats.map(
        (format) => zxing.BarcodeFormat[format]
      );

      const videoElement = videoRef.current;
      if (!videoElement) {
        setScannerState("error");
        setStatus("Scanner initialisation failed. Close this panel and try again.");
        return;
      }

      const handleDecode = (result: { getText(): string } | undefined, error?: { name?: string }) => {
        if (sessionRef.current !== sessionId || detectedRef.current) {
          return;
        }

        if (result) {
          const value = result.getText().trim();
          if (!value) {
            return;
          }

          detectedRef.current = true;
          stopScanner();
          toast.success("Code captured.");
          onDetected(value);
          return;
        }

        if (error?.name && !ignoredDecodeErrors.has(error.name)) {
          setScannerState("ready");
          setStatus("Camera is live. Centre the barcode or QR code in the frame.");
        }
      };

      const preferredConstraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      try {
        controlsRef.current = (await reader.decodeFromConstraints(
          preferredConstraints,
          videoElement,
          handleDecode
        )) as ScannerControls;
      } catch (preferredError) {
        if (!shouldRetryWithFallback(preferredError)) {
          throw preferredError;
        }

        stopScanner();
        controlsRef.current = (await reader.decodeFromConstraints(
          { audio: false, video: true },
          videoElement,
          handleDecode
        )) as ScannerControls;
      }

      if (sessionRef.current !== sessionId) {
        stopScanner();
        return;
      }

      setScannerState("ready");
      setStatus("Camera is live. Centre the barcode or QR code in the frame.");
    } catch (error) {
      if (sessionRef.current !== sessionId) {
        return;
      }

      stopScanner();
      setScannerState("error");
      setStatus(getScannerErrorMessage(error));
    }
  }

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.pause();
      const stream = videoElement.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoElement.srcObject = null;
      zxingRef.current?.BrowserCodeReader.cleanVideoSource(videoElement);
    }

    zxingRef.current?.BrowserCodeReader.releaseAllStreams();
  }

  function submitManualValue() {
    const value = manualValue.trim();
    if (!value) {
      toast.error("Enter a code before confirming.");
      return;
    }
    stopScanner();
    onDetected(value);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 md:flex md:items-center md:justify-center md:p-5">
      <SurfaceCard className="flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border-0 bg-slate-950 p-0 text-white shadow-none md:h-auto md:max-h-[calc(100dvh-2.5rem)] md:max-w-2xl md:rounded-[32px] md:border md:border-slate-200 md:bg-white md:text-ink md:shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-4 pb-2 pt-[max(0.875rem,env(safe-area-inset-top))] md:px-6 md:pb-3 md:pt-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200 md:text-blue-700">
              Scanner
            </p>
            <h2 className="mt-1.5 font-heading text-2xl font-bold text-slate-200 md:text-ink">
              Scan barcode or QR code
            </h2>
          </div>
          <button
            aria-label="Close scanner"
            className="rounded-full border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/15 md:border-slate-200 md:bg-white md:text-slate-500 md:hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
          <div className="relative flex h-[min(44dvh,24rem)] min-h-[17rem] flex-[0_0_auto] items-stretch overflow-hidden rounded-[28px] bg-slate-950 ring-1 ring-white/10 md:h-auto md:min-h-[28rem] md:flex-1 md:ring-slate-200">
            <video
              autoPlay
              className="h-full w-full object-contain"
              disablePictureInPicture
              muted
              playsInline
              ref={(node) => {
                videoRef.current = node;
                if (node) {
                  node.setAttribute("playsinline", "true");
                  node.setAttribute("webkit-playsinline", "true");
                }
              }}
            />

            {scannerState !== "ready" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/78 px-6 text-center text-white">
                {scannerState === "starting" ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-200" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-blue-200" />
                )}
                <p className="max-w-sm text-sm leading-6 text-slate-100">{status}</p>
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_32%,rgba(15,23,42,0.34)_72%)]" />
              <div className="absolute left-1/2 top-1/2 h-[clamp(14rem,46dvh,22rem)] w-[min(84vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.16)]">
                <div className="absolute -left-0.5 -top-0.5 h-8 w-8 rounded-tl-[30px] border-l-[3px] border-t-[3px] border-blue-300" />
                <div className="absolute -right-0.5 -top-0.5 h-8 w-8 rounded-tr-[30px] border-r-[3px] border-t-[3px] border-blue-300" />
                <div className="absolute -bottom-0.5 -left-0.5 h-8 w-8 rounded-bl-[30px] border-b-[3px] border-l-[3px] border-blue-300" />
                <div className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-br-[30px] border-b-[3px] border-r-[3px] border-blue-300" />
                <div className="absolute left-1/2 top-1/2 h-0.5 w-[72%] -translate-x-1/2 -translate-y-1/2 bg-blue-300/90 shadow-[0_0_18px_rgba(147,197,253,0.9)]" />
              </div>
            </div>
          </div>

          {scannerState === "error" ? (
            <div className="mt-3 rounded-[20px] border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-blue-700" />
                <p>{status}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-200 md:text-slate-700">
                Manual entry
              </span>
              <input
                className={inputClassName("bg-white md:bg-slate-50/80")}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="Enter barcode, SKU, UPC, or QR value"
                value={manualValue}
              />
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <Button className="w-full" onClick={submitManualValue}>
              Use manual entry
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="w-full"
                onClick={() => {
                  stopScanner();
                  setScannerState("starting");
                  setStatus("Restarting camera...");
                  const nextSession = sessionRef.current + 1;
                  sessionRef.current = nextSession;
                  detectedRef.current = false;
                  void startScanner(nextSession);
                }}
                variant="secondary"
              >
                Restart camera
              </Button>
              <Button className="w-full" onClick={onClose} variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}

function shouldRetryWithFallback(error: unknown) {
  const name = getErrorName(error);
  return name ? fallbackConstraintErrors.has(name) : false;
}

function getScannerErrorMessage(error: unknown) {
  const name = getErrorName(error);

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera permission was denied. Allow camera access in the browser and try again.";
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No supported camera was found on this device. Use manual entry below.";
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The camera is already in use by another app or tab. Close it there and try again.";
  }

  if (name === "SecurityError") {
    return "Camera scanning requires HTTPS or localhost. Open the app over a secure connection.";
  }

  if (name === "AbortError") {
    return "Camera start-up was interrupted. Try again once the browser has finished opening the camera.";
  }

  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return "The preferred rear camera could not be started. Try restarting the camera or use manual entry.";
  }

  return "Scanner initialisation failed on this browser. Try restarting the camera or use manual entry below.";
}

function getErrorName(error: unknown) {
  if (error && typeof error === "object" && "name" in error && typeof error.name === "string") {
    return error.name;
  }
  return undefined;
}
