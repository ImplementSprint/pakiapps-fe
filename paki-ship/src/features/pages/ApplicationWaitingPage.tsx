import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, CheckCircle2, Clock3, FileSearch, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

type ApplicationStatus = {
  role: "driver" | "operator";
  status: "pending" | "rejected" | "approved";
  approved: boolean;
  redirectPath: string;
  missingDocumentTypes?: string[];
};

const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

export function ApplicationWaitingPage() {
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplication = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/auth/application-status");
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Sign in again to check your application status.");
        return;
      }

      if (result.approved && result.redirectPath) {
        navigate(result.redirectPath, { replace: true });
        return;
      }

      setApplication(result);
    } catch {
      setError("Unable to check the application review status right now.");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const isRejected = application?.status === "rejected";

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56]">
      <header className="flex h-20 items-center border-b border-[#39B5A8]/10 bg-white/85 px-6 backdrop-blur md:px-14">
        <Link to="/" aria-label="PakiShip home">
          <img src={logoImg} alt="PakiSHIP" className="h-10 w-auto object-contain" />
        </Link>
      </header>

      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10">
        <section className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[#39B5A8]/15 bg-white shadow-2xl shadow-[#39B5A8]/10">
          <div className="bg-[#041614] px-6 py-7 text-white md:px-9">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 text-[#FDB833]">
              {isRejected ? <AlertCircle className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}
            </div>
            <p className="text-[11px] font-black uppercase text-[#39B5A8]">
              {application?.role === "operator" ? "Partner application" : "Driver application"}
            </p>
            <h1 className="mt-2 text-3xl font-black">
              {isRejected ? "Admin review needs attention" : "Your application is under review"}
            </h1>
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-white/70">
              PakiAdmin receives the documents you submitted during signup. Your dashboard opens
              after the required documents are approved.
            </p>
          </div>

          <div className="space-y-5 p-6 md:p-9">
            <div className="grid gap-3 md:grid-cols-3">
              <StatusItem icon={<CheckCircle2 className="h-4 w-4" />} label="Application" value="Submitted" />
              <StatusItem icon={<FileSearch className="h-4 w-4" />} label="Documents" value="With PakiAdmin" />
              <StatusItem icon={<Clock3 className="h-4 w-4" />} label="Access" value="Waiting approval" />
            </div>

            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            ) : null}

            {application?.missingDocumentTypes?.length ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-800">
                  Some required documents are not yet attached to this application.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void loadApplication()}
                disabled={isLoading}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#39B5A8] px-5 text-sm font-black text-white transition hover:bg-[#2D8F85] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                {isLoading ? "Checking..." : "Check Review Status"}
              </button>
              <Link
                to="/login"
                className="flex h-14 flex-1 items-center justify-center rounded-2xl border-2 border-[#39B5A8]/15 px-5 text-sm font-black text-[#1A5D56] transition hover:bg-[#F0F9F8]"
              >
                Back to Log In
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8]/70 p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#39B5A8]">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#041614]">{value}</p>
    </div>
  );
}
