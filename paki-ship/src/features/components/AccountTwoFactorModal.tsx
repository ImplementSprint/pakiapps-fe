import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import {
  disableAccountTwoFactor,
  enableAccountTwoFactor,
  setupAccountTwoFactor,
} from "@/lib/auth-security";
import { AuthenticatorQrCode } from "./AuthenticatorQrCode";

type AccountTwoFactorModalProps = {
  enabled: boolean;
  storageKey: string;
  onClose: () => void;
  onUpdated: (enabled: boolean) => void;
};

export function AccountTwoFactorModal({
  enabled,
  storageKey,
  onClose,
  onUpdated,
}: AccountTwoFactorModalProps) {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [setup, setSetup] = useState<{
    secret?: string;
    otpauthUri?: string;
    twoFactorEnabled: boolean;
  } | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setCode("");
    setErrorMessage("");
    setSetup(null);

    setIsPreparing(true);
    void setupAccountTwoFactor()
      .then((result) => {
        if (isMounted) {
          setSetup(result);
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to start two-factor setup.");
        if (isMounted) {
          onClose();
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsPreparing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  const handleSubmit = async () => {
    if (code.trim().length !== 6) {
      const message = "Enter the 6-digit code from your authenticator app.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    const loadingToast = toast.loading(
      enabled ? "Turning off 2FA..." : "Turning on 2FA...",
    );

    try {
      const result = enabled
        ? await disableAccountTwoFactor(code)
        : await enableAccountTwoFactor(code);

      localStorage.setItem(storageKey, String(Boolean(result.twoFactorEnabled)));
      window.dispatchEvent(new Event("storage"));
      onUpdated(Boolean(result.twoFactorEnabled));

      toast.dismiss(loadingToast);
      toast.success(
        enabled
          ? "Two-factor authentication disabled."
          : "Two-factor authentication enabled.",
      );
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update two-factor authentication.";
      setErrorMessage(message);
      toast.dismiss(loadingToast);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-[#39B5A8]/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-[#041614]">
            {enabled ? "Disable 2FA" : "Enable 2FA"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            ✕
          </button>
        </div>
        {enabled ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from Google Authenticator to turn off two-factor authentication.
            </p>
            <Input
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setErrorMessage("");
              }}
              placeholder="123456"
              className="rounded-xl text-center tracking-[0.4em] font-bold"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add this account to Google Authenticator, then enter its 6-digit code.
            </p>
            {isPreparing ? (
              <p className="text-sm text-gray-500">Preparing authenticator setup...</p>
            ) : (
              <>
                <div className="rounded-2xl bg-[#F0F9F8] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#39B5A8]">
                    Authenticator Setup Key
                  </p>
                  <p className="mt-2 break-all font-mono text-sm font-bold text-[#041614]">
                    {setup?.secret || "Preparing setup key..."}
                  </p>
                  {setup?.otpauthUri ? (
                    <a
                      href={setup.otpauthUri}
                      className="mt-3 inline-block text-xs font-black text-[#1A5D56] underline"
                    >
                      Open in authenticator app
                    </a>
                  ) : null}
                </div>
                {setup?.otpauthUri ? (
                  <AuthenticatorQrCode value={setup.otpauthUri} />
                ) : null}
                <Input
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setErrorMessage("");
                  }}
                  placeholder="123456"
                  className="rounded-xl text-center tracking-[0.4em] font-bold"
                />
              </>
            )}
          </div>
        )}
        {errorMessage ? (
          <p className="mt-3 text-sm font-medium text-red-600">{errorMessage}</p>
        ) : null}
        <div className="flex gap-3 mt-6">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#39B5A8] hover:bg-[#2D8F85] text-white rounded-xl"
            onClick={handleSubmit}
            disabled={isPreparing || isSubmitting || code.length !== 6 || (!enabled && !setup?.secret)}
          >
            {isSubmitting ? "Saving..." : enabled ? "Disable 2FA" : "Enable 2FA"}
          </Button>
        </div>
      </div>
    </div>
  );
}
