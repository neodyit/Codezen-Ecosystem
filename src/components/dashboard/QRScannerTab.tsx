import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  RotateCcw
} from "lucide-react";
import { apiFetch } from "@/config/api";

interface ScanResultData {
  success: boolean;
  scan_status: "SUCCESS_CHECK_IN" | "ALREADY_SCANNED" | "RE_CHECKED_IN" | "ABSENT_MARKED" | "INVALID_TOKEN";
  message: string;
  already_scanned?: boolean;
  registration?: {
    id: number;
    user_name: string;
    user_email: string;
    user_phone?: string;
    roll_no?: string;
    college?: string;
    attendance_status: string;
    attended_at?: string;
    qr_token: string;
    event?: {
      id: number;
      title: string;
      code: string;
    };
    user?: {
      phone?: string;
      roll_no?: string;
      course?: string;
      branch?: string;
      department?: string;
      semester?: string;
      college?: string;
      university?: string;
    };
  };
}

export default function QRScannerTab() {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [manualToken, setManualToken] = useState("");
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResultData[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "cz-qr-reader-viewport";

  // Enumerate cameras on component mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available on mobile
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMessage("No video input devices / cameras detected.");
        }
      })
      .catch(() => {
        setErrorMessage("Camera permission denied or camera device not accessible.");
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraIdToUse?: string) => {
    setErrorMessage(null);
    const targetCamId = cameraIdToUse || selectedCameraId;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      const qrCode = html5QrCodeRef.current;
      if (qrCode.isScanning) {
        await qrCode.stop();
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const cameraParam = targetCamId ? { deviceId: { exact: targetCamId } } : { facingMode: "environment" };

      await qrCode.start(
        cameraParam,
        config,
        (decodedText) => {
          handleTokenScanned(decodedText);
        },
        () => {
          // parse frame failure callback (ignore noisy frames)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      setIsScanning(false);
      setErrorMessage(err?.message || "Failed to start camera. Please verify camera permissions in your browser.");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // ignore clean up error
      }
    }
    setIsScanning(false);
  };

  const handleTokenScanned = async (token: string, forceCheckIn: boolean = false) => {
    if (processing) return;
    const cleanToken = token.trim();
    if (!cleanToken) return;

    setProcessing(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch("/admin/events/attendance", {
        method: "POST",
        body: JSON.stringify({
          qr_token: cleanToken,
          status: "Present",
          force: forceCheckIn,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const successData: ScanResultData = {
          success: true,
          scan_status: data.scan_status || "SUCCESS_CHECK_IN",
          message: data.message || "Attendee successfully verified & checked in.",
          registration: data.registration,
          already_scanned: false,
        };
        setScanResult(successData);
        setRecentScans((prev) => [successData, ...prev.slice(0, 9)]);
      } else if (res.status === 409 || data.scan_status === "ALREADY_SCANNED") {
        const dupData: ScanResultData = {
          success: false,
          scan_status: "ALREADY_SCANNED",
          already_scanned: true,
          message: data.message || "Notice: Attendee pass was already checked in earlier.",
          registration: data.registration,
        };
        setScanResult(dupData);
        setRecentScans((prev) => [dupData, ...prev.slice(0, 9)]);
      } else {
        const errData: ScanResultData = {
          success: false,
          scan_status: "INVALID_TOKEN",
          message: data.error || data.message || "Invalid QR Code. No attendee registration found.",
        };
        setScanResult(errData);
      }
    } catch {
      setErrorMessage("Network error verifying attendance pass. Please check server connectivity.");
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleTokenScanned(manualToken);
    setManualToken("");
  };

  return (
    <div className="space-y-5">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span>Attendee QR Check-in Terminal</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
              Live Scanner
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Scan attendee ticket QR passes or enter pass tokens manually to verify event check-in and prevent duplicate entry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isScanning ? (
            <button
              type="button"
              onClick={stopScanner}
              className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/50 hover:bg-rose-500/30 text-rose-400 text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-colors"
            >
              <CameraOff size={14} />
              <span>Stop Camera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startScanner()}
              className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-colors shadow"
            >
              <Camera size={14} />
              <span>Start Camera Scanner</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left is Scanner/Input, Right is Verification Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Live Camera Box & Manual Token Input (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Camera Viewport Box */}
          <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800 text-xs">
              <span className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isScanning ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                <span>Camera Stream</span>
              </span>

              {/* Camera selection dropdown if multiple cameras exist */}
              {cameras.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500">Device:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      if (isScanning) {
                        startScanner(e.target.value);
                      }
                    }}
                    className="p-1 bg-zinc-900 border border-zinc-800 text-white text-[11px] rounded outline-none"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Camera ${c.id.substring(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Html5Qrcode Render Target */}
            <div className="relative min-h-[300px] bg-black border border-zinc-800/80 rounded-lg overflow-hidden flex flex-col items-center justify-center">
              <div id={scannerContainerId} className="w-full max-w-[400px]" />

              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90 space-y-3 z-10">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    <Camera size={26} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase">Camera Is Idle</h4>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1">
                      Click below to activate your webcam or mobile camera to begin scanning attendee QR tickets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startScanner()}
                    className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase rounded flex items-center gap-2 transition-colors"
                  >
                    <Camera size={14} />
                    <span>Enable Scanner Camera</span>
                  </button>
                </div>
              )}

              {processing && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-20 text-white text-xs font-mono">
                  <RefreshCw size={24} className="animate-spin text-emerald-400" />
                  <span>Verifying QR Pass Token...</span>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Manual Token Verification fallback */}
          <div className="p-4 border border-zinc-800 bg-zinc-950 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
              Manual Pass Verification (Alternative)
            </h4>
            <p className="text-[11px] text-zinc-500 mb-3">
              If attendee's phone screen is cracked or camera cannot read the code, enter their unique token code (e.g. <span className="font-mono text-zinc-400">CZ-EV1-U5-...</span>).
            </p>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Enter QR Token code..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 text-xs font-mono text-white rounded outline-none focus:border-zinc-500"
                />
              </div>
              <button
                type="submit"
                disabled={!manualToken.trim() || processing}
                className="px-4 py-2 bg-white text-black font-bold text-xs uppercase rounded disabled:opacity-50 hover:bg-zinc-200 transition-colors"
              >
                Verify & Check In
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Scan Result Card & Verification Details (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Active Result Card */}
          <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-3 border-b border-zinc-850 mb-4 flex items-center justify-between">
              <span>Verification Result</span>
              {scanResult && (
                <button
                  type="button"
                  onClick={() => setScanResult(null)}
                  className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  <span>Clear</span>
                </button>
              )}
            </h3>

            {!scanResult ? (
              <div className="py-12 px-4 text-center border border-dashed border-zinc-850 rounded-lg text-zinc-500 text-xs">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-zinc-700" />
                <p className="font-semibold text-zinc-400">Ready to Scan</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Point camera at attendee pass or submit token to review real-time check-in status.
                </p>
              </div>
            ) : scanResult.scan_status === "SUCCESS_CHECK_IN" || scanResult.scan_status === "RE_CHECKED_IN" ? (
              
              /* SUCCESS STATE */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-start gap-3">
                  <CheckCircle2 size={24} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                      PASS VERIFIED · CHECKED IN
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1">{scanResult.message}</p>
                  </div>
                </div>

                {scanResult.registration && (
                  <div className="border border-zinc-800 bg-zinc-900/60 rounded-lg p-4 space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">Attendee</span>
                      <h4 className="text-sm font-bold text-white">{scanResult.registration.user_name}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono">{scanResult.registration.user_email}</p>
                      {scanResult.registration.user_phone && (
                        <p className="text-[11px] text-zinc-400 font-mono">{scanResult.registration.user_phone}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block">Roll Number</span>
                        <span className="font-bold text-white font-mono">
                          {scanResult.registration.roll_no || scanResult.registration.user?.roll_no || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block">College / Campus</span>
                        <span className="text-zinc-300 truncate block">
                          {scanResult.registration.college || scanResult.registration.user?.college || "CGC / Autonomous"}
                        </span>
                      </div>
                    </div>

                    {(scanResult.registration.user?.course || scanResult.registration.user?.branch) && (
                      <div className="pt-2 border-t border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block">Academic Stream</span>
                        <span className="text-zinc-300 font-mono text-[11px]">
                          {[
                            scanResult.registration.user?.course,
                            scanResult.registration.user?.branch,
                            scanResult.registration.user?.department,
                            scanResult.registration.user?.semester,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block">QR Ticket Code</span>
                        <span className="text-[10px] font-mono text-zinc-400 bg-black px-2 py-0.5 border border-zinc-800 rounded">
                          {scanResult.registration.qr_token}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-emerald-500 text-black font-extrabold text-[10px] uppercase rounded">
                        Present
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : scanResult.scan_status === "ALREADY_SCANNED" ? (
              
              /* DUPLICATE / ALREADY SCANNED WARNING */
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-lg flex items-start gap-3">
                  <AlertTriangle size={24} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                      ALREADY CHECKED IN (DUPLICATE)
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1">{scanResult.message}</p>
                  </div>
                </div>

                {scanResult.registration && (
                  <div className="border border-zinc-800 bg-zinc-900/60 rounded-lg p-4 space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">Attendee</span>
                      <h4 className="text-sm font-bold text-white">{scanResult.registration.user_name}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono">{scanResult.registration.user_email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block">Roll Number</span>
                        <span className="font-bold text-white font-mono">{scanResult.registration.roll_no || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block">Initial Verification</span>
                        <span className="text-amber-300 font-mono text-[11px]">{scanResult.registration.attended_at || "Earlier"}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-500">Need to override & re-confirm entry?</span>
                      <button
                        type="button"
                        onClick={() => handleTokenScanned(scanResult.registration!.qr_token, true)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase rounded transition-colors"
                      >
                        Force Check-in
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              
              /* INVALID TOKEN / ERROR STATE */
              <div className="space-y-4">
                <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-lg flex items-start gap-3">
                  <XCircle size={24} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wide">
                      INVALID QR CODE / PASS
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1">{scanResult.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Scans Log */}
          {recentScans.length > 0 && (
            <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Recent Scanned Passes This Session
              </h4>
              <div className="space-y-1.5 divide-y divide-zinc-900 max-h-48 overflow-y-auto">
                {recentScans.map((scan, i) => (
                  <div key={i} className="pt-1.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white block">
                        {scan.registration?.user_name || "Unknown Attendee"}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {scan.registration?.roll_no || scan.registration?.qr_token}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded border ${
                        scan.scan_status === "ALREADY_SCANNED"
                          ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                          : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      }`}
                    >
                      {scan.scan_status === "ALREADY_SCANNED" ? "Duplicate" : "Present"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

