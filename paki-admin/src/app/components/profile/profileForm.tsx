import { useEffect, useState, cloneElement, type Dispatch, type SetStateAction } from 'react';
import { Eye, EyeOff, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface PasswordData {
  current: string;
  new: string;
}

export interface PasswordErrors {
  length: boolean;
  number: boolean;
  symbol: boolean;
}

export interface ShowPassState {
  current: boolean;
  new: boolean;
  profile: boolean;
}

/** Shared password strength state + live validation used by both profile pages. */
export function usePasswordValidation() {
  const [passwordData, setPasswordData] = useState<PasswordData>({ current: '', new: '' });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({
    length: false,
    number: false,
    symbol: false,
  });

  useEffect(() => {
    setPasswordErrors({
      length: passwordData.new.length >= 8,
      number: /\d/.test(passwordData.new),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new),
    });
  }, [passwordData.new]);

  const isPasswordValid = passwordErrors.length && passwordErrors.number && passwordErrors.symbol;

  return { passwordData, setPasswordData, passwordErrors, isPasswordValid };
}

/** Per-app theme tokens for the profile form + password modal. */
export interface ProfileTheme {
  fieldLabel: string;
  inputEnabled: string;
  inputDisabled: string;
  inputHeight: string;
  iconFocus: string;
  pwLabel: string;
  pwInput: string;
  pwToggleHover: string;
  modalBorder: string;
  modalTitle: string;
  modalSubtitle: string;
  reqBox: string;
  reqLabel: string;
  confirmEnabled: string;
}

export function FormInput({
  icon,
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
  theme,
}: {
  icon?: React.ReactElement;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
  theme: ProfileTheme;
}) {
  return (
    <div className="space-y-2">
      <label className={`text-[10px] font-bold ${theme.fieldLabel} uppercase tracking-[0.2em] ml-1`}>{label}</label>
      <div className="relative group">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 transition-colors ${theme.iconFocus}`}>
          {icon && cloneElement(icon, { className: 'w-4 h-4' } as never)}
        </div>
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full ${disabled ? theme.inputDisabled : theme.inputEnabled} border-2 rounded-2xl pl-12 pr-4 py-6 text-sm font-bold transition-all ${theme.inputHeight}`}
        />
      </div>
    </div>
  );
}

export function PasswordField({
  label,
  value,
  show,
  toggle,
  onChange,
  theme,
}: {
  label: string;
  value: string;
  show: boolean;
  toggle: () => void;
  onChange: (value: string) => void;
  theme: ProfileTheme;
}) {
  return (
    <div className="space-y-2">
      <label className={theme.pwLabel}>{label}</label>
      <div className="relative">
        <Input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className={theme.pwInput} />
        <button type="button" onClick={toggle} className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 ${theme.pwToggleHover}`}>
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

export function ValidationCheck({ label, isValid }: { label: string; isValid: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {isValid ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
      ) : (
        <AlertCircle className="w-3 h-3 text-red-400" />
      )}
      <span className={`text-[11px] font-bold ${isValid ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

interface PasswordResetModalProps {
  show: boolean;
  onClose: () => void;
  subtitle: string;
  passwordData: PasswordData;
  setPasswordData: Dispatch<SetStateAction<PasswordData>>;
  showPass: ShowPassState;
  setShowPass: Dispatch<SetStateAction<ShowPassState>>;
  passwordErrors: PasswordErrors;
  isPasswordValid: boolean;
  onConfirm: () => void;
  theme: ProfileTheme;
}

export function PasswordResetModal({
  show,
  onClose,
  subtitle,
  passwordData,
  setPasswordData,
  showPass,
  setShowPass,
  passwordErrors,
  isPasswordValid,
  onConfirm,
  theme,
}: PasswordResetModalProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 border ${theme.modalBorder} relative`}>
        <button onClick={onClose} className="absolute right-8 top-8 text-gray-400 hover:text-red-500 transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h3 className={`text-2xl font-bold ${theme.modalTitle}`}>Security Update</h3>
          <p className={`text-sm ${theme.modalSubtitle}`}>{subtitle}</p>
        </div>

        <div className="space-y-5">
          <PasswordField
            label="Current Password"
            value={passwordData.current}
            show={showPass.current}
            toggle={() => setShowPass({ ...showPass, current: !showPass.current })}
            onChange={(v) => setPasswordData({ ...passwordData, current: v })}
            theme={theme}
          />

          <div className="space-y-3">
            <PasswordField
              label="New Password"
              value={passwordData.new}
              show={showPass.new}
              toggle={() => setShowPass({ ...showPass, new: !showPass.new })}
              onChange={(v) => setPasswordData({ ...passwordData, new: v })}
              theme={theme}
            />

            <div className={`rounded-2xl p-4 border space-y-2 ${theme.reqBox}`}>
              <p className={`text-[10px] font-bold ${theme.reqLabel} uppercase tracking-widest mb-2`}>Requirements</p>
              <ValidationCheck label="At least 8 characters" isValid={passwordErrors.length} />
              <ValidationCheck label="At least 1 number" isValid={passwordErrors.number} />
              <ValidationCheck label="At least 1 special symbol" isValid={passwordErrors.symbol} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button onClick={onClose} variant="ghost" className="flex-1 rounded-2xl h-12 font-bold text-gray-500">
            Cancel
          </Button>
          <Button
            disabled={!isPasswordValid || !passwordData.current}
            className={`flex-1 rounded-2xl h-12 font-bold shadow-lg transition-all ${isPasswordValid ? theme.confirmEnabled : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            onClick={onConfirm}
          >
            Update Password
          </Button>
        </div>
      </div>
    </div>
  );
}
