"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";

type BarcodeDetectorResult = { rawValue?: string };
type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

export function ScannerModal({
  open,
  onClose,
  onDetected
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState("Starting camera...");

  useEffect(() => {
    if (!open) {
      cleanup();
      return;
    }

    let cancelled = false;

    async function start() {
      const Detector = window.BarcodeDetector;
      if (!Detector) {
        setStatus("Barcode scanning is unavailable on this browser. Use manual entry below.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }
          }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new Detector({
          formats: [
            "qr_code",
            "ean_13",
            "upc_a",
            "code_128",
            "code_39",
            "itf"
          ]
        });

        const loop = async () => {
          if (cancelled || !videoRef.current) {
            return;
          }
          try {
            const results = await detector.detect(videoRef.current);
            const value = results.find((result) => result.rawValue)?.rawValue;
            if (value) {
              if ("vibrate" in navigator) {
                navigator.vibrate(120);
              }
              onDetected(value);
              cleanup();
              return;
            }
            setStatus("Point the camera at a barcode or QR code.");
          } catch {
            setStatus("Scanning in progress...");
          }
          animationRef.current = window.requestAnimationFrame(loop);
        };

        loop();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to access camera.";
        setStatus(message);
        toast.error(message);
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [open, onDetected]);

  function cleanup() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/55 p-4 md:items-center md:justify-center">
      <SurfaceCard className="w-full max-w-lg rounded-[28px] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-heading text-xl font-bold text-ink">Scan item</p>
            <p className="text-sm text-slate-600">{status}</p>
          </div>
          <button
            className="rounded-full bg-slate-100 p-2 text-slate-600"
            onClick={() => {
              cleanup();
              onClose();
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-hidden rounded-[24px] bg-slate-950">
          <video
            autoPlay
            className="aspect-[3/4] w-full object-cover"
            muted
            playsInline
            ref={videoRef}
          />
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex gap-3">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal"
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Manual barcode / QR entry"
              value={manualCode}
            />
            <Button
              onClick={() => {
                if (!manualCode.trim()) {
                  toast.error("Enter a code first.");
                  return;
                }
                onDetected(manualCode.trim());
                cleanup();
              }}
            >
              Use
            </Button>
          </div>
          <div className="rounded-2xl bg-teal/10 px-4 py-3 text-sm text-teal">
            <div className="flex items-center gap-2 font-semibold">
              <Camera className="h-4 w-4" />
              Rear camera is preferred for warehouse scanning.
            </div>
            <p className="mt-1 text-teal/80">
              If scanning is unreliable, the operator can type or paste the barcode and keep moving.
            </p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
