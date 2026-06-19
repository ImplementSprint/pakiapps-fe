import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function AuthenticatorQrCode({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    void QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 196,
      color: {
        dark: "#041614",
        light: "#FFFFFF",
      },
    }).then((nextDataUrl) => {
      if (!cancelled) {
        setDataUrl(nextDataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="flex min-h-[196px] items-center justify-center rounded-2xl border border-[#39B5A8]/15 bg-white p-3">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="Google Authenticator setup QR code"
          className="h-[196px] w-[196px]"
        />
      ) : (
        <p className="text-xs font-bold text-gray-400">Generating QR code...</p>
      )}
    </div>
  );
}
