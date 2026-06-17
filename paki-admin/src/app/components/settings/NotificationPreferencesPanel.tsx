'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, Mail, Save, Smartphone, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { cn } from '../ui/utils';

type NotificationChannelKey = 'email' | 'push' | 'inApp';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationPreferencesCopy {
  badge: string;
  title: string;
  description: string;
  emailDescription: string;
  pushDescription: string;
  inAppDescription: string;
  successMessage: string;
  successDescription: string;
}

interface NotificationPreferencesTheme {
  panelClassName: string;
  haloClassName: string;
  badgeClassName: string;
  titleClassName: string;
  bodyClassName: string;
  summaryClassName: string;
  summaryValueClassName: string;
  summaryLabelClassName: string;
  channelCardClassName: string;
  iconWrapClassName: string;
  iconClassName: string;
  switchClassName: string;
  statusEnabledClassName: string;
  statusDisabledClassName: string;
  footerClassName: string;
  footerTitleClassName: string;
  footerBodyClassName: string;
  buttonClassName: string;
}

interface NotificationPreferencesPanelProps {
  copy: NotificationPreferencesCopy;
  theme: NotificationPreferencesTheme;
  initialPreferences?: NotificationPreferences;
  sectionId?: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  push: true,
  inApp: true,
};

const CHANNELS: Array<{
  key: NotificationChannelKey;
  title: string;
  icon: LucideIcon;
}> = [
  { key: 'email', title: 'Email Notifications', icon: Mail },
  { key: 'push', title: 'Push Notifications', icon: Smartphone },
  { key: 'inApp', title: 'In-App Notifications', icon: Bell },
];

export function NotificationPreferencesPanel({
  copy,
  theme,
  initialPreferences = DEFAULT_PREFERENCES,
  sectionId = 'notification-preferences',
}: NotificationPreferencesPanelProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [savedPreferences, setSavedPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const enabledCount =
    Number(preferences.email) + Number(preferences.push) + Number(preferences.inApp);
  const isDirty =
    preferences.email !== savedPreferences.email ||
    preferences.push !== savedPreferences.push ||
    preferences.inApp !== savedPreferences.inApp;

  const channelDescriptions: Record<NotificationChannelKey, string> = {
    email: copy.emailDescription,
    push: copy.pushDescription,
    inApp: copy.inAppDescription,
  };

  const handleToggle = (key: NotificationChannelKey, checked: boolean) => {
    setPreferences((current) => ({
      ...current,
      [key]: checked,
    }));
  };

  const handleSave = () => {
    if (!isDirty) {
      return;
    }

    setIsSaving(true);

    window.setTimeout(() => {
      setSavedPreferences(preferences);
      setIsSaving(false);
      toast.success(copy.successMessage, {
        description: copy.successDescription,
      });
    }, 900);
  };

  return (
    <section
      id={sectionId}
      className={cn('relative overflow-hidden rounded-[2.5rem] border p-8 shadow-sm md:p-10', theme.panelClassName)}
    >
      <div className={cn('pointer-events-none absolute inset-0', theme.haloClassName)} />

      <div className="relative space-y-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em]',
                theme.badgeClassName,
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {copy.badge}
            </span>

            <div className="space-y-2">
              <h2 className={cn('text-2xl font-black tracking-tight md:text-3xl', theme.titleClassName)}>
                {copy.title}
              </h2>
              <p className={cn('max-w-2xl text-sm font-medium leading-6 md:text-base', theme.bodyClassName)}>
                {copy.description}
              </p>
            </div>
          </div>

          <div className={cn('min-w-[220px] rounded-[1.8rem] border p-5', theme.summaryClassName)}>
            <p className={cn('text-3xl font-black leading-none', theme.summaryValueClassName)}>{enabledCount}/3</p>
            <p className={cn('mt-2 text-xs font-bold uppercase tracking-[0.24em]', theme.summaryLabelClassName)}>
              Channels Enabled
            </p>
            <p className={cn('mt-3 text-sm font-medium leading-6', theme.bodyClassName)}>
              Choose exactly where admin alerts should appear and mute the rest.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const isEnabled = preferences[channel.key];

            return (
              <div
                key={channel.key}
                className={cn(
                  'rounded-[1.8rem] border p-6 transition-all duration-200',
                  theme.channelCardClassName,
                  isEnabled ? 'shadow-lg' : 'shadow-sm',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border', theme.iconWrapClassName)}>
                      <Icon className={cn('h-5 w-5', theme.iconClassName)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className={cn('text-lg font-bold', theme.titleClassName)}>{channel.title}</h3>
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]',
                            isEnabled ? theme.statusEnabledClassName : theme.statusDisabledClassName,
                          )}
                        >
                          {isEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>

                      <p className={cn('text-sm font-medium leading-6', theme.bodyClassName)}>
                        {channelDescriptions[channel.key]}
                      </p>
                    </div>
                  </div>

                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(channel.key, checked)}
                    aria-label={`Toggle ${channel.title}`}
                    className={theme.switchClassName}
                  />
                </div>

                <div className={cn('mt-6 rounded-2xl border px-4 py-3 text-sm font-medium', theme.summaryClassName)}>
                  {isEnabled
                    ? 'Alerts through this channel are currently enabled for your admin account.'
                    : 'This channel is muted, so no admin alerts will be sent here.'}
                </div>
              </div>
            );
          })}
        </div>

        <div className={cn('flex flex-col gap-4 rounded-[1.8rem] border p-5 md:flex-row md:items-center md:justify-between', theme.footerClassName)}>
          <div>
            <p className={cn('text-sm font-bold', theme.footerTitleClassName)}>
              {isDirty ? 'Unsaved changes are ready to apply.' : 'Notification preferences are up to date.'}
            </p>
            <p className={cn('mt-1 text-sm font-medium', theme.footerBodyClassName)}>
              {isDirty
                ? 'Save now to keep this notification mix for future admin alerts.'
                : 'You can return anytime to adjust where platform alerts are delivered.'}
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn('h-12 rounded-2xl px-6 font-bold shadow-lg', theme.buttonClassName)}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>
    </section>
  );
}
