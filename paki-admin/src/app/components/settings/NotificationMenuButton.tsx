'use client';

import { Bell, ChevronRight } from 'lucide-react';

import { Button } from '../ui/button';

import { cn } from '../ui/utils';

interface NotificationMenuTheme {
  buttonClassName: string;
  badgeClassName: string;
  badgeDotClassName: string;
  labelClassName: string;
  statusPillClassName: string;
  panelClassName: string;
  panelTitleClassName: string;
  panelBodyClassName: string;
  panelRowClassName: string;
  panelActionClassName: string;
}

interface NotificationPreviewItem {
  label: string;
  note: string;
  status: 'ON' | 'OFF';
}

interface NotificationMenuButtonProps {
  menuOpen: boolean;
  onToggle: () => void;
  onManagePreferences: () => void;
  badgeCount?: number;
  previewTitle?: string;
  previewDescription?: string;
  previewItems: NotificationPreviewItem[];
  theme: NotificationMenuTheme;
  label: string;
  status: 'ON' | 'OFF';
}

export function NotificationMenuButton({
  menuOpen,
  onToggle,
  onManagePreferences,
  badgeCount = 2,
  previewTitle = 'Important Alerts',
  previewDescription = 'Quick preview of the most important admin alerts.',
  previewItems,
  theme,
  label,
  status,
}: NotificationMenuButtonProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-label={label}
        title={label}
        className={cn(
          'relative flex h-12 items-center gap-3 rounded-2xl border px-4 transition-all duration-200',
          theme.buttonClassName,
        )}
      >
        <Bell className="h-5 w-5" />
        <span className={cn('text-[11px] font-black uppercase tracking-[0.18em]', theme.statusPillClassName)}>
          {status}
        </span>
        <span className={cn('sr-only', theme.labelClassName)}>{label}</span>
        <span
          className={cn(
            'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black',
            theme.badgeClassName,
          )}
        >
          {badgeCount}
        </span>
        <span className={cn('absolute right-2 top-2 h-2 w-2 rounded-full', theme.badgeDotClassName)} />
      </button>

      {menuOpen && (
        <div className={cn('absolute right-0 top-[calc(100%+0.8rem)] z-40 w-72 rounded-[1.8rem] border p-4 shadow-2xl', theme.panelClassName)}>
          <div className="mb-3">
            <p className={cn('text-sm font-black', theme.panelTitleClassName)}>{previewTitle}</p>
            <p className={cn('mt-1 text-xs font-medium', theme.panelBodyClassName)}>
              {previewDescription}
            </p>
          </div>

          <div className="space-y-2">
            {previewItems.map((channel) => (
              <div key={channel.label} className={cn('flex items-center justify-between rounded-2xl border px-3 py-3', theme.panelRowClassName)}>
                <div>
                  <p className={cn('text-sm font-bold', theme.panelTitleClassName)}>{channel.label}</p>
                  <p className={cn('text-[11px] font-medium', theme.panelBodyClassName)}>{channel.note}</p>
                </div>
                <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]', theme.statusPillClassName)}>
                  {channel.status}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={onManagePreferences}
            className={cn('mt-3 h-10 w-full justify-between rounded-2xl px-4 font-bold', theme.panelActionClassName)}
          >
            Manage Preferences
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
