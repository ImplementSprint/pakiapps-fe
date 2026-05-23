'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  Copy,
  Download,
  LockKeyhole,
  LogOut,
  MapPin,
  Monitor,
  QrCode,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { cn } from '../ui/utils';
import { useAuth } from '../../contexts/AuthContext';
import { getTwoFactorStorageKey } from '../../lib/twoFactor';

type TwoFactorPlatform = 'pakiadmin' | 'pakiship' | 'pakipark';

interface TwoFactorTheme {
  badgeLabel: string;
  workspaceLabel: string;
  recoveryFilePrefix: string;
  rootClassName: string;
  haloClassName: string;
  badgeClassName: string;
  badgeIconClassName: string;
  headingClassName: string;
  bodyClassName: string;
  dimBodyClassName: string;
  outlineChipClassName: string;
  switchClassName: string;
  primaryButtonClassName: string;
  outlineButtonClassName: string;
  summaryCardClassName: string;
  summaryFillClassName: string;
  cardClassName: string;
  cardMutedClassName: string;
  iconWrapClassName: string;
  iconClassName: string;
  stepAccentClassName: string;
  qrFrameClassName: string;
  qrFillClassName: string;
  setupSurfaceClassName: string;
  subtleFillClassName: string;
  separatorClassName: string;
}

interface TwoFactorAuthPanelProps {
  platform?: TwoFactorPlatform;
}

const AUTHENTICATOR_APPS = [
  'Google Authenticator',
  'Microsoft Authenticator',
  'Authy',
  '1Password',
];

type SessionDeviceType = 'desktop' | 'mobile' | 'tablet';

interface ActiveSession {
  id: string;
  deviceType: SessionDeviceType;
  browser: string;
  ipAddress: string;
  isCurrent: boolean;
  isSuspicious?: boolean;
  lastActive: string;
  location: string;
  operatingSystem: string;
}

function createInitialSessions(platform: TwoFactorPlatform): ActiveSession[] {
  if (platform === 'pakiship') {
    return [
      {
        id: 'ship-current',
        deviceType: 'desktop',
        browser: 'Chrome 136',
        ipAddress: '112.198.44.17',
        isCurrent: true,
        lastActive: 'Active now',
        location: 'Quezon City, Metro Manila',
        operatingSystem: 'Windows 11',
      },
      {
        id: 'ship-macbook',
        deviceType: 'desktop',
        browser: 'Safari 18',
        ipAddress: '49.146.208.63',
        isCurrent: false,
        lastActive: '8 minutes ago',
        location: 'Makati, Metro Manila',
        operatingSystem: 'macOS Sonoma',
      },
      {
        id: 'ship-android',
        deviceType: 'mobile',
        browser: 'Chrome Mobile',
        ipAddress: '180.191.24.88',
        isCurrent: false,
        lastActive: '42 minutes ago',
        location: 'Cebu City, Cebu',
        operatingSystem: 'Android 15',
      },
      {
        id: 'ship-unknown',
        deviceType: 'tablet',
        browser: 'Unknown Browser',
        ipAddress: '103.121.55.201',
        isCurrent: false,
        isSuspicious: true,
        lastActive: '2 hours ago',
        location: 'Unrecognized location',
        operatingSystem: 'Unknown OS',
      },
    ];
  }

  if (platform === 'pakipark') {
    return [
      {
        id: 'park-current',
        deviceType: 'desktop',
        browser: 'Chrome 136',
        ipAddress: '120.28.44.10',
        isCurrent: true,
        lastActive: 'Active now',
        location: 'Pasig, Metro Manila',
        operatingSystem: 'Windows 11',
      },
      {
        id: 'park-phone',
        deviceType: 'mobile',
        browser: 'Safari Mobile',
        ipAddress: '136.158.74.50',
        isCurrent: false,
        lastActive: '16 minutes ago',
        location: 'Taguig, Metro Manila',
        operatingSystem: 'iOS 19',
      },
      {
        id: 'park-tablet',
        deviceType: 'tablet',
        browser: 'Chrome',
        ipAddress: '49.145.20.91',
        isCurrent: false,
        isSuspicious: true,
        lastActive: 'Yesterday at 10:14 PM',
        location: 'Unknown city, PH',
        operatingSystem: 'Android Tablet',
      },
    ];
  }

  return [
    {
      id: 'admin-current',
      deviceType: 'desktop',
      browser: 'Chrome 136',
      ipAddress: '112.199.20.11',
      isCurrent: true,
      lastActive: 'Active now',
      location: 'Manila, Philippines',
      operatingSystem: 'Windows 11',
    },
    {
      id: 'admin-mobile',
      deviceType: 'mobile',
      browser: 'Google Authenticated Session',
      ipAddress: '136.158.17.22',
      isCurrent: false,
      lastActive: '23 minutes ago',
      location: 'Pasay, Metro Manila',
      operatingSystem: 'Android 15',
    },
  ];
}

function getDeviceIcon(deviceType: SessionDeviceType) {
  if (deviceType === 'mobile') {
    return Smartphone;
  }

  if (deviceType === 'tablet') {
    return Tablet;
  }

  return Monitor;
}

const THEMES: Record<TwoFactorPlatform, TwoFactorTheme> = {
  pakiadmin: {
    badgeLabel: 'Admin Security',
    workspaceLabel: 'admin dashboard',
    recoveryFilePrefix: 'pakiadmin',
    rootClassName: 'border-[#2c0735]/10 bg-white',
    haloClassName:
      'bg-[radial-gradient(circle_at_top_right,_rgba(124,58,237,0.12),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(44,7,53,0.08),_transparent_35%)]',
    badgeClassName: 'border-[#dec0f1] bg-[#faf5ff] text-[#2c0735]',
    badgeIconClassName: 'text-[#7c3aed]',
    headingClassName: 'text-[#2c0735]',
    bodyClassName: 'text-[#2c0735]/70',
    dimBodyClassName: 'text-[#2c0735]/60',
    outlineChipClassName: 'border-[#2c0735]/10 bg-white text-[#2c0735]/60',
    switchClassName: 'data-[state=checked]:bg-[#2c0735]',
    primaryButtonClassName: 'bg-[#2c0735] text-white hover:bg-[#3a0a46]',
    outlineButtonClassName: 'border-[#2c0735]/15 text-[#2c0735] hover:bg-[#f7f2fb]',
    summaryCardClassName: 'border-[#2c0735]/10 bg-white/90 shadow-[#2c0735]/5',
    summaryFillClassName: 'bg-[#f7f2fb] text-[#2c0735]/70',
    cardClassName: 'border-[#2c0735]/10 bg-white',
    cardMutedClassName: 'border-[#2c0735]/10 bg-[#fcfbfe]',
    iconWrapClassName: 'bg-[#f7f2fb]',
    iconClassName: 'text-[#7c3aed]',
    stepAccentClassName: 'text-[#7c3aed]',
    qrFrameClassName: 'border-[#2c0735]/10 shadow-[#2c0735]/5',
    qrFillClassName: 'bg-[#2c0735]',
    setupSurfaceClassName: 'bg-[#f8f6fb]',
    subtleFillClassName: 'bg-[#f8f6fb]',
    separatorClassName: 'bg-[#2c0735]/10',
  },
  pakiship: {
    badgeLabel: 'PakiShip Security',
    workspaceLabel: 'shipment admin workspace',
    recoveryFilePrefix: 'pakiship',
    rootClassName: 'border-[#39B5A8]/10 bg-white',
    haloClassName:
      'bg-[radial-gradient(circle_at_top_right,_rgba(57,181,168,0.16),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(4,22,20,0.08),_transparent_35%)]',
    badgeClassName: 'border-[#39B5A8]/20 bg-[#F0F9F8] text-[#1A5D56]',
    badgeIconClassName: 'text-[#39B5A8]',
    headingClassName: 'text-[#041614]',
    bodyClassName: 'text-[#1A5D56]/72',
    dimBodyClassName: 'text-[#1A5D56]/60',
    outlineChipClassName: 'border-[#39B5A8]/10 bg-white text-[#1A5D56]/65',
    switchClassName: 'data-[state=checked]:bg-[#39B5A8]',
    primaryButtonClassName: 'bg-[#39B5A8] text-white hover:bg-[#2F9D91]',
    outlineButtonClassName: 'border-[#39B5A8]/15 text-[#1A5D56] hover:bg-[#F0F9F8]',
    summaryCardClassName: 'border-[#39B5A8]/10 bg-white/90 shadow-[#39B5A8]/10',
    summaryFillClassName: 'bg-[#F0F9F8] text-[#1A5D56]/70',
    cardClassName: 'border-[#39B5A8]/10 bg-white',
    cardMutedClassName: 'border-[#39B5A8]/10 bg-[#F7FCFB]',
    iconWrapClassName: 'bg-[#F0F9F8]',
    iconClassName: 'text-[#39B5A8]',
    stepAccentClassName: 'text-[#39B5A8]',
    qrFrameClassName: 'border-[#39B5A8]/10 shadow-[#39B5A8]/10',
    qrFillClassName: 'bg-[#1A5D56]',
    setupSurfaceClassName: 'bg-[#F4FBFA]',
    subtleFillClassName: 'bg-[#F0F9F8]',
    separatorClassName: 'bg-[#39B5A8]/10',
  },
  pakipark: {
    badgeLabel: 'PakiPark Security',
    workspaceLabel: 'parking admin dashboard',
    recoveryFilePrefix: 'pakipark',
    rootClassName: 'border-[#1e3d5a]/10 bg-white',
    haloClassName:
      'bg-[radial-gradient(circle_at_top_right,_rgba(238,107,32,0.14),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(30,61,90,0.10),_transparent_35%)]',
    badgeClassName: 'border-[#ee6b20]/20 bg-[#fff4ec] text-[#1e3d5a]',
    badgeIconClassName: 'text-[#ee6b20]',
    headingClassName: 'text-[#1e3d5a]',
    bodyClassName: 'text-[#1e3d5a]/72',
    dimBodyClassName: 'text-[#1e3d5a]/60',
    outlineChipClassName: 'border-[#1e3d5a]/10 bg-white text-[#1e3d5a]/65',
    switchClassName: 'data-[state=checked]:bg-[#ee6b20]',
    primaryButtonClassName: 'bg-[#1e3d5a] text-white hover:bg-[#2a5373]',
    outlineButtonClassName: 'border-[#1e3d5a]/15 text-[#1e3d5a] hover:bg-[#f4f7fa]',
    summaryCardClassName: 'border-[#1e3d5a]/10 bg-white/90 shadow-blue-900/5',
    summaryFillClassName: 'bg-[#f4f7fa] text-[#1e3d5a]/70',
    cardClassName: 'border-[#1e3d5a]/10 bg-white',
    cardMutedClassName: 'border-[#1e3d5a]/10 bg-[#fbfcfe]',
    iconWrapClassName: 'bg-[#fff4ec]',
    iconClassName: 'text-[#ee6b20]',
    stepAccentClassName: 'text-[#ee6b20]',
    qrFrameClassName: 'border-[#1e3d5a]/10 shadow-blue-900/5',
    qrFillClassName: 'bg-[#1e3d5a]',
    setupSurfaceClassName: 'bg-[#f7f9fc]',
    subtleFillClassName: 'bg-[#f4f7fa]',
    separatorClassName: 'bg-[#1e3d5a]/10',
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function createSeededSequence(seed: number, length: number, alphabet: string) {
  let value = seed;
  let output = '';

  for (let index = 0; index < length; index += 1) {
    value = (value * 1664525 + 1013904223) % 4294967296;
    output += alphabet[value % alphabet.length];
  }

  return output;
}

function createManualSetupKey(version: number) {
  const raw = createSeededSequence(version * 941, 32, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
  return raw.match(/.{1,4}/g)?.join('-') ?? raw;
}

function createRecoveryCodes(version: number) {
  return Array.from({ length: 10 }, (_, index) => {
    const raw = createSeededSequence(version * 613 + index * 97, 10, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
  });
}

function buildQrMatrix(seedText: string) {
  const size = 25;
  const matrix: boolean[][] = [];
  const seed = seedText.split('').reduce((total, character) => total + character.charCodeAt(0), 0);

  const getFinderValue = (x: number, y: number) => {
    const anchors = [
      { left: 1, top: 1 },
      { left: size - 8, top: 1 },
      { left: 1, top: size - 8 },
    ];

    for (const anchor of anchors) {
      const relativeX = x - anchor.left;
      const relativeY = y - anchor.top;

      if (relativeX >= 0 && relativeX < 7 && relativeY >= 0 && relativeY < 7) {
        const isOuterRing =
          relativeX === 0 || relativeX === 6 || relativeY === 0 || relativeY === 6;
        const isInnerSquare =
          relativeX >= 2 && relativeX <= 4 && relativeY >= 2 && relativeY <= 4;

        return isOuterRing || isInnerSquare;
      }
    }

    return null;
  };

  for (let y = 0; y < size; y += 1) {
    const row: boolean[] = [];

    for (let x = 0; x < size; x += 1) {
      const finderValue = getFinderValue(x, y);

      if (finderValue !== null) {
        row.push(finderValue);
        continue;
      }

      const noise =
        (seed + x * 17 + y * 31 + ((x * y + seed) % 13) * 7 + ((x + y) % 5) * 11) % 29;
      row.push(noise % 2 === 0 || noise % 7 === 0);
    }

    matrix.push(row);
  }

  return matrix;
}

function QrPreview({ seed, theme }: { seed: string; theme: TwoFactorTheme }) {
  const matrix = buildQrMatrix(seed);

  return (
    <div className={cn('rounded-[2rem] border bg-white p-4 shadow-inner', theme.qrFrameClassName)}>
      <div className="grid grid-cols-[repeat(25,minmax(0,1fr))] gap-[2px] rounded-[1.4rem] bg-white p-3">
        {matrix.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => (
            <div
              key={`${rowIndex}-${columnIndex}`}
              className={cn('aspect-square rounded-[2px]', cell ? theme.qrFillClassName : 'bg-transparent')}
            />
          )),
        )}
      </div>
    </div>
  );
}

export function TwoFactorAuthPanel({ platform = 'pakiadmin' }: TwoFactorAuthPanelProps) {
  const theme = THEMES[platform];
  const { user } = useAuth();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [setupVersion, setSetupVersion] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [lastUpdated, setLastUpdated] = useState('Not configured yet');
  const [sessions, setSessions] = useState<ActiveSession[]>(() => createInitialSessions(platform));
  const [sessionAction, setSessionAction] = useState<
    | { mode: 'single'; session: ActiveSession }
    | { mode: 'all' }
    | null
  >(null);

  const manualSetupKey = createManualSetupKey(setupVersion);
  const recoveryCodes = createRecoveryCodes(setupVersion);
  const currentSession = sessions.find((session) => session.isCurrent);
  const otherSessions = sessions.filter((session) => !session.isCurrent);
  const suspiciousCount = otherSessions.filter((session) => session.isSuspicious).length;
  const twoFactorStorageKey = user?.email ? getTwoFactorStorageKey(platform, user.email) : null;

  useEffect(() => {
    if (!twoFactorStorageKey) {
      return;
    }

    setIsEnabled(window.localStorage.getItem(twoFactorStorageKey) === 'enabled');
  }, [twoFactorStorageKey]);

  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Clipboard access failed. Please try again.');
    }
  };

  const downloadRecoveryCodes = () => {
    const fileContents = [
      `${theme.badgeLabel} Recovery Codes`,
      `Generated: ${formatDate(new Date())}`,
      '',
      ...recoveryCodes,
      '',
      'Store these codes in a secure location.',
    ].join('\n');

    const fileBlob = new Blob([fileContents], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `${theme.recoveryFilePrefix}-2fa-recovery-codes.txt`;
    link.click();
    URL.revokeObjectURL(downloadUrl);

    toast.success('Recovery codes downloaded.');
  };

  const openSetupFlow = () => {
    setVerificationCode('');
    setShowSuccessState(false);
    setIsSetupOpen(true);
  };

  const handleProtectionToggle = (checked: boolean) => {
    if (checked) {
      openSetupFlow();
      return;
    }

    setIsDisableDialogOpen(true);
  };

  const handleVerifyAndEnable = () => {
    if (verificationCode.length !== 6) {
      return;
    }

    setIsVerifying(true);

    window.setTimeout(() => {
      setIsVerifying(false);
      setIsEnabled(true);
      if (twoFactorStorageKey) {
        window.localStorage.setItem(twoFactorStorageKey, 'enabled');
      }
      setShowSuccessState(true);
      setLastUpdated(formatDate(new Date()));
      toast.success('Two-factor authentication enabled.', {
        description: `Your ${theme.workspaceLabel} now requires an authenticator app code during sign-in.`,
      });
    }, 1100);
  };

  const handleDisable2FA = () => {
    setIsEnabled(false);
    if (twoFactorStorageKey) {
      window.localStorage.removeItem(twoFactorStorageKey);
    }
    setIsDisableDialogOpen(false);
    setVerificationCode('');
    setShowSuccessState(false);
    setLastUpdated(formatDate(new Date()));

    toast.success('Two-factor authentication disabled.', {
      description: `The ${theme.workspaceLabel} is back to password-only sign-in until 2FA is enabled again.`,
    });
  };

  const handleRegenerateSetup = () => {
    setSetupVersion((current) => current + 1);
    setVerificationCode('');
    toast.success('A new setup key and QR preview have been generated.');
  };

  const handleRevokeSession = () => {
    if (!sessionAction) {
      return;
    }

    if (sessionAction.mode === 'all') {
      const removedCount = otherSessions.length;

      setSessions((current) => current.filter((session) => session.isCurrent));
      setSessionAction(null);
      toast.success('All other devices were logged out.', {
        description:
          removedCount === 1
            ? '1 active session was revoked successfully.'
            : `${removedCount} active sessions were revoked successfully.`,
      });
      return;
    }

    setSessions((current) => current.filter((session) => session.id !== sessionAction.session.id));
    setSessionAction(null);
    toast.success('Session revoked successfully.', {
      description: `${sessionAction.session.browser} on ${sessionAction.session.operatingSystem} has been signed out.`,
    });
  };

  return (
    <section className={cn('relative overflow-hidden rounded-[2.5rem] border shadow-sm', theme.rootClassName)}>
      <div className={cn('pointer-events-none absolute inset-0', theme.haloClassName)} />

      <div className="relative space-y-8 p-6 md:p-8 xl:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em]',
                theme.badgeClassName,
              )}
            >
              <Shield className={cn('h-4 w-4', theme.badgeIconClassName)} />
              {theme.badgeLabel}
            </span>

            <div className="space-y-2">
              <h2 className={cn('text-3xl font-black tracking-tight md:text-4xl', theme.headingClassName)}>
                Two-Factor Authentication
              </h2>
              <p className={cn('max-w-2xl text-sm font-medium leading-6 md:text-base', theme.bodyClassName)}>
                Add an authenticator app check to every admin login so password theft alone cannot unlock the{' '}
                {theme.workspaceLabel}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]',
                  isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                )}
              >
                {isEnabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                {isEnabled ? 'Protected' : 'Protection Off'}
              </span>
              <span
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]',
                  theme.outlineChipClassName,
                )}
              >
                TOTP Authenticator
              </span>
              <span
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]',
                  theme.outlineChipClassName,
                )}
              >
                Recovery Codes Ready
              </span>
            </div>
          </div>

          <div
            className={cn(
              'w-full max-w-md rounded-[2rem] border p-5 shadow-lg backdrop-blur',
              theme.summaryCardClassName,
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={cn('text-sm font-black', theme.headingClassName)}>
                  {isEnabled ? 'Authenticator protection is active' : 'Enable stronger sign-in protection'}
                </p>
                <p className={cn('mt-1 text-sm font-medium leading-6', theme.dimBodyClassName)}>
                  {isEnabled
                    ? 'Admins must enter a 6-digit code from their authenticator app during sign-in.'
                    : 'Turn this on to require a time-based code after the admin password.'}
                </p>
              </div>

              <Switch
                checked={isEnabled}
                onCheckedChange={handleProtectionToggle}
                aria-label="Toggle two-factor authentication"
                className={cn('scale-125', theme.switchClassName)}
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button onClick={openSetupFlow} className={cn('h-12 flex-1 rounded-2xl', theme.primaryButtonClassName)}>
                {isEnabled ? 'Reconfigure 2FA' : 'Enable Two-Factor Authentication'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDisableDialogOpen(true)}
                disabled={!isEnabled}
                className={cn('h-12 rounded-2xl', theme.outlineButtonClassName)}
              >
                Disable
              </Button>
            </div>

            <div className={cn('mt-4 rounded-[1.5rem] px-4 py-3 text-sm font-medium', theme.summaryFillClassName)}>
              Last updated: <span className={cn('font-bold', theme.headingClassName)}>{lastUpdated}</span>
            </div>
          </div>
        </div>

        <Alert
          className={cn(
            'rounded-[1.8rem] border px-5 py-4',
            isEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800',
          )}
        >
          {isEnabled ? <BadgeCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertTitle className="font-black">
            {isEnabled
              ? '2FA is actively protecting this admin account.'
              : 'This account is still relying on password-only access.'}
          </AlertTitle>
          <AlertDescription className={isEnabled ? 'text-emerald-800/80' : 'text-amber-800/80'}>
            {isEnabled
              ? 'Recovery codes are available below in case the authenticator device is lost or replaced.'
              : 'Enable an authenticator app to reduce takeover risk and require a rotating 6-digit code at login.'}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className={cn('rounded-[2rem] border p-6 shadow-sm', theme.cardClassName)}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', theme.iconWrapClassName)}>
                    <Monitor className={cn('h-5 w-5', theme.iconClassName)} />
                  </div>
                  <div>
                    <h3 className={cn('text-xl font-black', theme.headingClassName)}>Active login sessions</h3>
                    <p className={cn('text-sm font-medium', theme.dimBodyClassName)}>
                      Review every device currently signed in without leaving the security settings page.
                    </p>
                  </div>
                </div>
                <p className={cn('text-sm font-medium leading-6', theme.bodyClassName)}>
                  Open a lightweight centered popup to check trusted devices, suspicious activity, and revoke access instantly.
                </p>
              </div>

              <span
                className={cn(
                  'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]',
                  suspiciousCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
                )}
              >
                {suspiciousCount > 0 ? `${suspiciousCount} Review` : 'All Trusted'}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={cn('rounded-[1.5rem] border p-4', theme.cardMutedClassName)}>
                <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>Current device</p>
                <p className={cn('mt-2 text-lg font-black', theme.headingClassName)}>
                  {currentSession?.browser ?? 'Unavailable'}
                </p>
                <p className={cn('mt-1 text-sm font-medium', theme.dimBodyClassName)}>
                  {currentSession?.operatingSystem ?? 'Unknown OS'}
                </p>
              </div>
              <div className={cn('rounded-[1.5rem] border p-4', theme.cardMutedClassName)}>
                <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>Other devices</p>
                <p className={cn('mt-2 text-lg font-black', theme.headingClassName)}>{otherSessions.length}</p>
                <p className={cn('mt-1 text-sm font-medium', theme.dimBodyClassName)}>
                  Sessions that can be revoked remotely.
                </p>
              </div>
              <div className={cn('rounded-[1.5rem] border p-4', theme.cardMutedClassName)}>
                <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>Suspicious</p>
                <p className={cn('mt-2 text-lg font-black', suspiciousCount > 0 ? 'text-amber-700' : theme.headingClassName)}>
                  {suspiciousCount}
                </p>
                <p className={cn('mt-1 text-sm font-medium', theme.dimBodyClassName)}>
                  Unknown or unusual devices needing attention.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setIsSessionsOpen(true)} className={cn('h-12 rounded-2xl px-6', theme.primaryButtonClassName)}>
                Manage Sessions
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsSessionsOpen(true)}
                className={cn('h-12 rounded-2xl px-6', theme.outlineButtonClassName)}
              >
                View Active Devices
              </Button>
            </div>
          </div>

          <div className={cn('rounded-[2rem] border p-6 shadow-sm', theme.cardMutedClassName)}>
            <div className="flex items-center gap-3">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm', theme.headingClassName)}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className={cn('text-xl font-black', theme.headingClassName)}>Session security signals</h3>
                <p className={cn('text-sm font-medium', theme.dimBodyClassName)}>
                  Fast indicators help admins spot unfamiliar activity before it becomes a problem.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                {
                  title: 'Known browser and OS',
                  body: 'Each card shows the browser and operating system so trusted work devices are easy to recognize.',
                },
                {
                  title: 'Location and IP visibility',
                  body: 'Approximate location plus IP address make unusual sign-ins easier to audit and revoke.',
                },
                {
                  title: 'Warning states for unknown devices',
                  body: 'Suspicious sessions are highlighted with warmer caution styling to encourage a quick review.',
                },
              ].map((item) => (
                <div key={item.title} className={cn('rounded-[1.4rem] border p-4', theme.cardClassName)}>
                  <p className={cn('text-sm font-black', theme.headingClassName)}>{item.title}</p>
                  <p className={cn('mt-2 text-sm font-medium leading-6', theme.bodyClassName)}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={cn('rounded-[2rem] border p-6 shadow-sm', theme.cardClassName)}>
            <div className="flex items-center gap-3">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', theme.iconWrapClassName)}>
                <LockKeyhole className={cn('h-5 w-5', theme.iconClassName)} />
              </div>
              <div>
                <h3 className={cn('text-xl font-black', theme.headingClassName)}>How the setup flow works</h3>
                <p className={cn('text-sm font-medium', theme.dimBodyClassName)}>
                  The setup modal walks admins through the exact security sequence below.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Scan the generated QR code',
                  description: 'Open your authenticator app and scan the unique setup code for this admin account.',
                },
                {
                  step: '02',
                  title: 'Enter the 6-digit code',
                  description: 'Type the current code shown by the app to verify the device is paired correctly.',
                },
                {
                  step: '03',
                  title: 'Save backup recovery codes',
                  description: 'Copy or download one-time recovery codes so login access can be restored safely later.',
                },
              ].map((item) => (
                <div key={item.step} className={cn('rounded-[1.6rem] border p-5', theme.cardMutedClassName)}>
                  <p className={cn('text-[11px] font-black uppercase tracking-[0.28em]', theme.stepAccentClassName)}>
                    {item.step}
                  </p>
                  <h4 className={cn('mt-3 text-lg font-black', theme.headingClassName)}>{item.title}</h4>
                  <p className={cn('mt-2 text-sm font-medium leading-6', theme.bodyClassName)}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={cn('rounded-[2rem] border p-6 shadow-sm', theme.cardMutedClassName)}>
            <div className="flex items-center gap-3">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm', theme.headingClassName)}>
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className={cn('text-xl font-black', theme.headingClassName)}>Security status</h3>
                <p className={cn('text-sm font-medium', theme.dimBodyClassName)}>
                  Live indicators for the authenticator-based protection state.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className={cn('rounded-[1.6rem] border bg-white p-5', theme.cardClassName)}>
                <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>Primary factor</p>
                <p className={cn('mt-2 text-lg font-black', theme.headingClassName)}>Password + 6-digit app code</p>
              </div>

              <div className={cn('rounded-[1.6rem] border bg-white p-5', theme.cardClassName)}>
                <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>Authenticator status</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className={cn('h-3 w-3 rounded-full', isEnabled ? 'bg-emerald-500' : 'bg-amber-500')} />
                  <p className={cn('text-lg font-black', theme.headingClassName)}>
                    {isEnabled ? 'Connected and verified' : 'Not enabled yet'}
                  </p>
                </div>
              </div>

              <div className={cn('rounded-[1.6rem] border bg-white p-5', theme.cardClassName)}>
                <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>Recovery readiness</p>
                <p className={cn('mt-2 text-lg font-black', theme.headingClassName)}>{recoveryCodes.length} backup codes prepared</p>
                <p className={cn('mt-1 text-sm font-medium', theme.dimBodyClassName)}>
                  Recovery codes become the secure fallback if the authenticator device is unavailable.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={cn('rounded-[2rem] border p-6 shadow-sm md:p-8', theme.cardClassName)}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className={cn('text-2xl font-black', theme.headingClassName)}>Backup and recovery codes</h3>
              <p className={cn('mt-2 max-w-2xl text-sm font-medium leading-6', theme.bodyClassName)}>
                Store these one-time codes somewhere secure. Each code can be used once if the paired authenticator
                device is unavailable.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => copyText(recoveryCodes.join('\n'), 'Recovery codes copied.')}
                disabled={!isEnabled}
                className={cn('h-11 rounded-2xl', theme.outlineButtonClassName)}
              >
                <Copy className="h-4 w-4" />
                Copy Codes
              </Button>
              <Button
                variant="outline"
                onClick={downloadRecoveryCodes}
                disabled={!isEnabled}
                className={cn('h-11 rounded-2xl', theme.outlineButtonClassName)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {recoveryCodes.map((code) => (
              <div
                key={code}
                className={cn(
                  'rounded-[1.25rem] border px-4 py-4 text-center font-mono text-sm font-black tracking-[0.16em]',
                  isEnabled
                    ? cn(theme.cardMutedClassName, theme.headingClassName)
                    : cn('border-dashed bg-[#fafafa] blur-[1px]', theme.dimBodyClassName, platform === 'pakiship' ? 'border-[#39B5A8]/10' : platform === 'pakipark' ? 'border-[#1e3d5a]/10' : 'border-[#2c0735]/10'),
                )}
              >
                {code}
              </div>
            ))}
          </div>

          {!isEnabled && (
            <div className={cn('mt-5 rounded-[1.4rem] border border-dashed px-4 py-4 text-sm font-medium', theme.cardMutedClassName, theme.dimBodyClassName)}>
              Recovery codes will unlock after the authenticator app is verified and 2FA is enabled.
            </div>
          )}
        </div>
      </div>

      <Dialog open={isSessionsOpen} onOpenChange={setIsSessionsOpen}>
        <DialogContent
          className={cn(
            'max-h-[90vh] overflow-y-auto rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-4xl',
            theme.setupSurfaceClassName,
          )}
        >
          <div className="overflow-hidden rounded-[2rem]">
            <div className={cn('border-b bg-white px-6 py-6 md:px-8', theme.cardClassName)}>
              <DialogHeader className="text-left">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em]',
                      theme.badgeClassName,
                    )}
                  >
                    <Shield className={cn('h-4 w-4', theme.badgeIconClassName)} />
                    Session Control
                  </span>
                  {suspiciousCount > 0 && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">
                      {suspiciousCount} suspicious
                    </span>
                  )}
                </div>
                <DialogTitle className={cn('mt-3 text-3xl font-black', theme.headingClassName)}>
                  Active Login Sessions
                </DialogTitle>
                <DialogDescription className={cn('max-w-3xl text-sm font-medium leading-6', theme.bodyClassName)}>
                  Review which browsers and devices still have access to this admin account, then revoke anything unfamiliar without leaving the current settings page.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-6 p-6 md:p-8">
              {currentSession && (
                <div className={cn('rounded-[1.9rem] border p-6 shadow-sm', theme.cardClassName)}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', theme.iconWrapClassName)}>
                        <Monitor className={cn('h-6 w-6', theme.iconClassName)} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className={cn('text-xl font-black', theme.headingClassName)}>{currentSession.browser}</h3>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                            Current Device
                          </span>
                        </div>
                        <p className={cn('mt-2 text-sm font-medium', theme.bodyClassName)}>{currentSession.operatingSystem}</p>
                      </div>
                    </div>

                    <div className={cn('rounded-[1.5rem] px-4 py-3 text-sm font-medium', theme.summaryFillClassName)}>
                      This session stays active while you manage the rest.
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className={cn('rounded-[1.4rem] border p-4', theme.cardMutedClassName)}>
                      <div className="flex items-center gap-2">
                        <MapPin className={cn('h-4 w-4', theme.iconClassName)} />
                        <p className={cn('text-xs font-black uppercase tracking-[0.22em]', theme.dimBodyClassName)}>Approximate location</p>
                      </div>
                      <p className={cn('mt-3 text-sm font-bold', theme.headingClassName)}>{currentSession.location}</p>
                    </div>
                    <div className={cn('rounded-[1.4rem] border p-4', theme.cardMutedClassName)}>
                      <p className={cn('text-xs font-black uppercase tracking-[0.22em]', theme.dimBodyClassName)}>IP address</p>
                      <p className={cn('mt-3 font-mono text-sm font-black', theme.headingClassName)}>{currentSession.ipAddress}</p>
                    </div>
                    <div className={cn('rounded-[1.4rem] border p-4', theme.cardMutedClassName)}>
                      <div className="flex items-center gap-2">
                        <Clock3 className={cn('h-4 w-4', theme.iconClassName)} />
                        <p className={cn('text-xs font-black uppercase tracking-[0.22em]', theme.dimBodyClassName)}>Last active</p>
                      </div>
                      <p className={cn('mt-3 text-sm font-bold', theme.headingClassName)}>{currentSession.lastActive}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className={cn('rounded-[1.9rem] border p-6 shadow-sm', theme.cardClassName)}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className={cn('text-xl font-black', theme.headingClassName)}>Other active sessions</h3>
                    <p className={cn('mt-2 text-sm font-medium leading-6', theme.bodyClassName)}>
                      Revoke any device that should no longer have access. Unknown devices use warning styling so they stand out immediately.
                    </p>
                  </div>
                  <span className={cn('rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em]', theme.outlineChipClassName)}>
                    {otherSessions.length} other devices
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {otherSessions.length === 0 ? (
                    <div className={cn('rounded-[1.5rem] border border-dashed p-5 text-sm font-medium', theme.cardMutedClassName, theme.dimBodyClassName)}>
                      No other active devices remain. This account is only signed in on the current device.
                    </div>
                  ) : (
                    otherSessions.map((session) => {
                      const DeviceIcon = getDeviceIcon(session.deviceType);

                      return (
                        <div
                          key={session.id}
                          className={cn(
                            'rounded-[1.6rem] border p-5 transition-colors',
                            session.isSuspicious ? 'border-amber-200 bg-amber-50' : theme.cardMutedClassName,
                          )}
                        >
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  'flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm',
                                  session.isSuspicious ? 'text-amber-600' : theme.headingClassName,
                                )}
                              >
                                <DeviceIcon className="h-5 w-5" />
                              </div>
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h4 className={cn('text-lg font-black', theme.headingClassName)}>{session.browser}</h4>
                                  <span
                                    className={cn(
                                      'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]',
                                      session.deviceType === 'desktop'
                                        ? 'bg-slate-100 text-slate-700'
                                        : session.deviceType === 'mobile'
                                          ? 'bg-teal-100 text-teal-700'
                                          : 'bg-cyan-100 text-cyan-700',
                                    )}
                                  >
                                    {session.deviceType}
                                  </span>
                                  {session.isSuspicious && (
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">
                                      Suspicious
                                    </span>
                                  )}
                                </div>

                                <p className={cn('text-sm font-medium', theme.bodyClassName)}>{session.operatingSystem}</p>

                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                                  <div className="flex items-center gap-2">
                                    <MapPin className={cn('h-4 w-4', session.isSuspicious ? 'text-amber-600' : theme.iconClassName)} />
                                    <span className={cn('font-medium', session.isSuspicious ? 'text-amber-800' : theme.dimBodyClassName)}>
                                      {session.location}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={cn('font-mono text-xs font-black', session.isSuspicious ? 'text-amber-800' : theme.headingClassName)}>
                                      {session.ipAddress}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock3 className={cn('h-4 w-4', session.isSuspicious ? 'text-amber-600' : theme.iconClassName)} />
                                    <span className={cn('font-medium', session.isSuspicious ? 'text-amber-800' : theme.dimBodyClassName)}>
                                      {session.lastActive}
                                    </span>
                                  </div>
                                </div>

                                {session.isSuspicious && (
                                  <div className="rounded-[1.2rem] border border-amber-200 bg-white/80 px-4 py-3 text-sm font-medium text-amber-800">
                                    This session looks unfamiliar. If you do not recognize it, revoke access immediately.
                                  </div>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              onClick={() => setSessionAction({ mode: 'single', session })}
                              className="h-11 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              Revoke Session
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className={cn('border-t bg-white px-6 py-5 md:px-8', theme.cardClassName)}>
              <Button
                variant="outline"
                onClick={() => setIsSessionsOpen(false)}
                className={cn('h-12 rounded-2xl', theme.outlineButtonClassName)}
              >
                Close
              </Button>
              <Button
                onClick={() => setSessionAction({ mode: 'all' })}
                disabled={otherSessions.length === 0}
                className="h-12 rounded-2xl bg-red-600 px-6 text-white hover:bg-red-700"
              >
                <LogOut className="h-4 w-4" />
                Log Out All Other Devices
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSetupOpen}
        onOpenChange={(open) => {
          setIsSetupOpen(open);
          if (!open) {
            setShowSuccessState(false);
            setVerificationCode('');
          }
        }}
      >
        <DialogContent
          className={cn(
            'max-h-[92vh] overflow-y-auto rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-5xl',
            theme.setupSurfaceClassName,
          )}
        >
          {!showSuccessState ? (
            <div className="overflow-hidden rounded-[2rem]">
              <div className={cn('border-b bg-white px-6 py-6 md:px-8', theme.cardClassName)}>
                <DialogHeader className="text-left">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em]',
                        theme.badgeClassName,
                      )}
                    >
                      <QrCode className={cn('h-4 w-4', theme.badgeIconClassName)} />
                      Authenticator Setup
                    </span>
                    <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white', theme.primaryButtonClassName)}>
                      Step 1 of 2
                    </span>
                  </div>
                  <DialogTitle className={cn('mt-3 text-3xl font-black', theme.headingClassName)}>
                    {isEnabled ? 'Reconfigure your authenticator app' : 'Enable two-factor authentication'}
                  </DialogTitle>
                  <DialogDescription className={cn('max-w-3xl text-sm font-medium leading-6', theme.bodyClassName)}>
                    Scan the setup code with your authenticator app, then enter the rotating 6-digit code to verify
                    the connection before access protection is enabled.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 md:p-8 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-6">
                  <div className={cn('rounded-[1.8rem] border bg-white p-6 shadow-sm', theme.cardClassName)}>
                    <h3 className={cn('text-xl font-black', theme.headingClassName)}>How 2FA protects admin access</h3>
                    <div className="mt-5 space-y-4">
                      {[
                        'Your authenticator app generates a new 6-digit sign-in code every 30 seconds.',
                        'Only admins with both the password and the paired device can finish login.',
                        'Backup codes act as single-use recovery keys if the device is lost or replaced.',
                      ].map((item) => (
                        <div key={item} className={cn('flex items-start gap-3 rounded-[1.2rem] px-4 py-3', theme.subtleFillClassName)}>
                          <div className={cn('mt-1 h-2.5 w-2.5 rounded-full', theme.qrFillClassName)} />
                          <p className={cn('text-sm font-medium leading-6', theme.bodyClassName)}>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert className="rounded-[1.8rem] border-amber-200 bg-amber-50 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-black">Security reminder</AlertTitle>
                    <AlertDescription className="text-amber-800/80">
                      Keep the setup key private. Anyone who has it can pair an authenticator app to this account.
                    </AlertDescription>
                  </Alert>

                  <div className={cn('rounded-[1.8rem] border bg-white p-6 shadow-sm', theme.cardClassName)}>
                    <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>Recommended apps</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {AUTHENTICATOR_APPS.map((appName) => (
                        <span
                          key={appName}
                          className={cn(
                            'rounded-full border px-4 py-2 text-xs font-bold',
                            theme.cardMutedClassName,
                            theme.bodyClassName,
                          )}
                        >
                          {appName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className={cn('rounded-[1.8rem] border bg-white p-6 shadow-sm', theme.cardClassName)}>
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                      <div className="mx-auto w-full max-w-[280px]">
                        <QrPreview seed={manualSetupKey} theme={theme} />
                        <p className={cn('mt-3 text-center text-xs font-medium leading-5', theme.dimBodyClassName)}>
                          Preview generated from the current setup key for this UI flow.
                        </p>
                      </div>

                      <div className="flex-1 space-y-5">
                        <div>
                          <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>
                            Manual setup key
                          </p>
                          <div className={cn('mt-3 rounded-[1.4rem] border p-4', theme.cardMutedClassName)}>
                            <p className={cn('font-mono text-base font-black tracking-[0.22em]', theme.headingClassName)}>
                              {manualSetupKey}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            onClick={() => copyText(manualSetupKey, 'Setup key copied.')}
                            className={cn('h-11 rounded-2xl', theme.outlineButtonClassName)}
                          >
                            <Copy className="h-4 w-4" />
                            Copy Key
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRegenerateSetup}
                            className={cn('h-11 rounded-2xl', theme.outlineButtonClassName)}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Regenerate
                          </Button>
                        </div>

                        <Separator className={theme.separatorClassName} />

                        <div>
                          <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>
                            Verification code
                          </p>
                          <p className={cn('mt-2 text-sm font-medium leading-6', theme.bodyClassName)}>
                            Enter the current 6-digit code shown in your authenticator app to finish pairing.
                          </p>

                          <div className="mt-4 flex justify-start">
                            <InputOTP
                              maxLength={6}
                              value={verificationCode}
                              onChange={(value) => setVerificationCode(value.replace(/\D/g, '').slice(0, 6))}
                              containerClassName="justify-start"
                            >
                              <InputOTPGroup className="gap-2">
                                {Array.from({ length: 6 }, (_, index) => (
                                  <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className={cn(
                                      'h-12 w-12 rounded-2xl border text-base font-black first:rounded-2xl first:border last:rounded-2xl',
                                      theme.cardMutedClassName,
                                      theme.headingClassName,
                                    )}
                                  />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className={cn('border-t bg-white px-6 py-5 md:px-8', theme.cardClassName)}>
                <Button
                  variant="outline"
                  onClick={() => setIsSetupOpen(false)}
                  className={cn('h-12 rounded-2xl', theme.outlineButtonClassName)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className={cn('h-12 rounded-2xl px-6', theme.primaryButtonClassName)}
                >
                  {isVerifying ? 'Verifying...' : 'Verify and Enable'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[2rem]">
              <div className="border-b border-emerald-100 bg-white px-6 py-6 md:px-8">
                <DialogHeader className="text-left">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-700">
                    <BadgeCheck className="h-4 w-4" />
                    2FA Activated
                  </span>
                  <DialogTitle className={cn('mt-3 text-3xl font-black', theme.headingClassName)}>
                    Authenticator protection is now active
                  </DialogTitle>
                  <DialogDescription className={cn('max-w-3xl text-sm font-medium leading-6', theme.bodyClassName)}>
                    Save the recovery codes below before closing this setup flow. Each code works once and can restore
                    access if the authenticator device becomes unavailable.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-6 p-6 md:p-8">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                  <div className="rounded-[1.8rem] border border-emerald-100 bg-emerald-50 p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-emerald-900">Protection confirmed</h3>
                        <p className="mt-2 text-sm font-medium leading-6 text-emerald-800/80">
                          Future admin logins now require a password and a code from the paired authenticator app.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={cn('rounded-[1.8rem] border bg-white p-6 shadow-sm', theme.cardClassName)}>
                    <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>What happens next</p>
                    <div className="mt-4 space-y-3">
                      {[
                        'Store recovery codes outside the browser in a secure location.',
                        'Use Reconfigure later if the authenticator device changes.',
                        'Disable 2FA only after a deliberate security review.',
                      ].map((item) => (
                        <div key={item} className={cn('rounded-[1.2rem] px-4 py-3 text-sm font-medium', theme.subtleFillClassName, theme.bodyClassName)}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={cn('rounded-[1.8rem] border bg-white p-6 shadow-sm', theme.cardClassName)}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className={cn('text-xl font-black', theme.headingClassName)}>Recovery codes</h3>
                      <p className={cn('mt-2 text-sm font-medium leading-6', theme.bodyClassName)}>
                        Copy or download these codes now. They will remain available later from the Security section.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => copyText(recoveryCodes.join('\n'), 'Recovery codes copied.')}
                        className={cn('h-11 rounded-2xl', theme.outlineButtonClassName)}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadRecoveryCodes}
                        className={cn('h-11 rounded-2xl', theme.outlineButtonClassName)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {recoveryCodes.map((code) => (
                      <div
                        key={code}
                        className={cn(
                          'rounded-[1.25rem] border px-4 py-4 text-center font-mono text-sm font-black tracking-[0.16em]',
                          theme.cardMutedClassName,
                          theme.headingClassName,
                        )}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className={cn('border-t bg-white px-6 py-5 md:px-8', theme.cardClassName)}>
                <Button
                  variant="outline"
                  onClick={handleRegenerateSetup}
                  className={cn('h-12 rounded-2xl', theme.outlineButtonClassName)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reconfigure Again
                </Button>
                <Button
                  onClick={() => {
                    setIsSetupOpen(false);
                    setShowSuccessState(false);
                    setVerificationCode('');
                  }}
                  className={cn('h-12 rounded-2xl px-6', theme.primaryButtonClassName)}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent className="rounded-[2rem] border-none bg-white p-0 shadow-2xl sm:max-w-xl">
          <div className={cn('border-b px-6 py-6', theme.cardClassName)}>
            <DialogHeader className="text-left">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Disable 2FA
              </span>
              <DialogTitle className={cn('mt-3 text-2xl font-black', theme.headingClassName)}>
                Remove authenticator protection?
              </DialogTitle>
              <DialogDescription className={cn('text-sm font-medium leading-6', theme.bodyClassName)}>
                Disabling 2FA lowers account security. Admin sign-ins will return to password-only access until 2FA is
                enabled again.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-6">
            <Alert className="rounded-[1.8rem] border-red-200 bg-red-50 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-black">High-impact security change</AlertTitle>
              <AlertDescription className="text-red-700/80">
                Make sure recovery codes are saved and the disable action is truly necessary before proceeding.
              </AlertDescription>
            </Alert>

            <div className={cn('rounded-[1.5rem] border p-5', theme.cardMutedClassName)}>
              <p className={cn('text-xs font-black uppercase tracking-[0.24em]', theme.dimBodyClassName)}>Available later</p>
              <p className={cn('mt-2 text-sm font-medium leading-6', theme.bodyClassName)}>
                You can re-enable 2FA anytime and generate a fresh setup key plus new recovery codes from this same
                Security section.
              </p>
            </div>
          </div>

          <DialogFooter className={cn('border-t px-6 py-5', theme.cardClassName)}>
            <Button
              variant="outline"
              onClick={() => setIsDisableDialogOpen(false)}
              className={cn('h-12 rounded-2xl', theme.outlineButtonClassName)}
            >
              Cancel
            </Button>
            <Button onClick={handleDisable2FA} className="h-12 rounded-2xl bg-red-600 px-6 text-white hover:bg-red-700">
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={sessionAction !== null} onOpenChange={(open) => !open && setSessionAction(null)}>
        <AlertDialogContent className="rounded-[1.8rem] border-none bg-white p-0 shadow-2xl sm:max-w-lg">
          <div className={cn('border-b px-6 py-6', theme.cardClassName)}>
            <AlertDialogHeader className="text-left">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Confirm Action
              </span>
              <AlertDialogTitle className={cn('mt-3 text-2xl font-black', theme.headingClassName)}>
                {sessionAction?.mode === 'all' ? 'Log out all other devices?' : 'Revoke this session?'}
              </AlertDialogTitle>
              <AlertDialogDescription className={cn('text-sm font-medium leading-6', theme.bodyClassName)}>
                {sessionAction?.mode === 'all'
                  ? 'Every active device except the one you are using right now will be signed out immediately.'
                  : 'This device will lose access right away and will need to sign in again to restore access.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <div className="space-y-4 px-6 py-6">
            {sessionAction?.mode === 'single' && (
              <div className={cn('rounded-[1.5rem] border p-5', theme.cardMutedClassName)}>
                <p className={cn('text-sm font-black', theme.headingClassName)}>
                  {sessionAction.session.browser} on {sessionAction.session.operatingSystem}
                </p>
                <p className={cn('mt-2 text-sm font-medium', theme.bodyClassName)}>
                  {sessionAction.session.location} • {sessionAction.session.ipAddress}
                </p>
              </div>
            )}

            {sessionAction?.mode === 'all' && (
              <div className={cn('rounded-[1.5rem] border p-5', theme.cardMutedClassName)}>
                <p className={cn('text-sm font-black', theme.headingClassName)}>
                  {otherSessions.length} other active {otherSessions.length === 1 ? 'session' : 'sessions'} will be removed
                </p>
                <p className={cn('mt-2 text-sm font-medium', theme.bodyClassName)}>
                  The current device stays signed in so you can continue managing security settings safely.
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter className={cn('border-t px-6 py-5', theme.cardClassName)}>
            <AlertDialogCancel className={cn('h-12 rounded-2xl', theme.outlineButtonClassName)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSession}
              className="h-12 rounded-2xl bg-red-600 px-6 text-white hover:bg-red-700"
            >
              {sessionAction?.mode === 'all' ? 'Log Out Devices' : 'Revoke Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
