import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Gift, Zap, PartyPopper, Mailbox } from 'lucide-react';
import type { AuthTab, AuthUser } from '../types';
import { cn } from '../lib/utils';
import { getApiUrl } from '../lib/api';
function getGoogleAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : '';

  if (code === 'auth/popup-blocked') {
    return 'Popup was blocked. Please allow popups and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error during Google login. Please check your connection and retry.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '';
  }
  return 'Google login failed. Please try again.';
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'object' && payload !== null) {
    const maybeMsg = (payload as { msg?: unknown; message?: unknown }).msg ?? (payload as { message?: unknown }).message;
    if (typeof maybeMsg === 'string' && maybeMsg.trim()) return maybeMsg;
  }
  return fallback;
}

interface AuthModalProps {
  isOpen: boolean;
  tab: AuthTab;
  onClose: () => void;
  onSetTab: (tab: AuthTab) => void;
  onLogin: (user: AuthUser) => void;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/>
  </svg>
);

function validateEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validatePhone(v: string) { return /^[6-9]\d{9}$/.test(v); }

function getStrength(val: string): { score: number; label: string; color: string; width: string } {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const map = [
    { label: '', color: '#E5E7EB', width: '0%' },
    { label: 'Weak', color: '#ef4444', width: '25%' },
    { label: 'Fair', color: '#f59e0b', width: '50%' },
    { label: 'Good', color: '#10b981', width: '75%' },
    { label: 'Strong 💪', color: '#6B21A8', width: '100%' },
  ];
  return { score, ...map[score] };
}

// ── Shared building blocks ─────────────────────────
interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}
const Field: React.FC<FieldProps> = ({ label, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-ink">{label}</label>
    {children}
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
);

const fieldWrapClass =
  'flex items-center gap-2 rounded-lg border border-border bg-white px-3 focus-within:border-brand-purple-light focus-within:ring-2 focus-within:ring-brand-purple-light';
const fieldInputClass = 'w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted';

interface PasswordInputProps {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}
const PasswordInput: React.FC<PasswordInputProps> = ({ id, placeholder, value, onChange, autoComplete }) => {
  const [show, setShow] = useState(false);
  return (
    <div className={fieldWrapClass}>
      <Lock size={16} className="flex-shrink-0 text-ink-muted" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={fieldInputClass}
      />
      <button type="button" className="flex-shrink-0 text-ink-muted hover:text-ink" onClick={() => setShow(s => !s)}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

const SocialGoogleButton: React.FC<{ onClick: () => void; loading: boolean; label: string }> = ({ onClick, loading, label }) => (
  <button
    type="button"
    className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-white py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gray-50 disabled:opacity-60"
    onClick={onClick}
    disabled={loading}
  >
    <GoogleIcon /> {loading ? 'Opening Google...' : label}
  </button>
);

const AuthDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="relative my-1 flex items-center gap-3 text-xs text-ink-muted">
    <div className="h-px flex-1 bg-border" /> {label} <div className="h-px flex-1 bg-border" />
  </div>
);

const SubmitButton: React.FC<{ loading: boolean; loadingLabel: string; children: React.ReactNode }> = ({ loading, loadingLabel, children }) => (
  <button
    type="submit"
    disabled={loading}
    className="flex items-center justify-center gap-2 rounded-lg bg-brand-purple py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-purple-dark disabled:opacity-70"
  >
    {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
    <span>{loading ? loadingLabel : children}</span>
  </button>
);

// ── Login Form ──────────────────────────────────────
const LoginForm: React.FC<{
  onSuccess: (user: AuthUser) => void;
  onRegister: () => void;
  onForgot: () => void;
}> = ({ onSuccess, onRegister, onForgot }) => {

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (error) {
      const msg = getGoogleAuthErrorMessage(error);
      if (msg) setErrors({ email: msg });
      console.error('Google auth error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!validateEmail(email)) errs.email = 'Please enter a valid email';
    if (pass.length < 6) errs.pass = 'Password must be at least 6 characters';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ email: data.msg || 'Login failed' });
        setLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      onSuccess({
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        role: data.user.role,
      });
    } catch (err) {
      setErrors({ email: 'Connection failed' });
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <div>
        <h2 className="text-xl font-bold text-ink">Welcome back! 👋</h2>
        <p className="mt-1 text-sm text-ink-muted">Login to manage your celebrations</p>
      </div>

      <SocialGoogleButton onClick={handleGoogle} loading={googleLoading} label="Continue with Google" />

      <AuthDivider label="or login with email" />

      <Field label="Email Address" error={errors.email}>
        <div className={fieldWrapClass}>
          <Mail size={16} className="flex-shrink-0 text-ink-muted" />
          <input type="email" placeholder="you@email.com" value={email}
            onChange={e => setEmail(e.target.value)} autoComplete="email" className={fieldInputClass} />
        </div>
      </Field>

      <Field label="Password" error={errors.pass}>
        <PasswordInput id="loginPass" placeholder="Enter your password"
          value={pass} onChange={setPass} autoComplete="current-password" />
      </Field>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-ink-muted">
          <input type="checkbox" defaultChecked className="accent-brand-purple" /> Remember me
        </label>
        <a href="#" className="font-medium text-brand-purple hover:underline" onClick={e => { e.preventDefault(); onForgot(); }}>Forgot password?</a>
      </div>

      <SubmitButton loading={loading} loadingLabel="Logging in...">Login to Account</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        Don't have an account? <a href="#" className="font-semibold text-brand-purple hover:underline" onClick={e => { e.preventDefault(); onRegister(); }}>Register free</a>
      </p>
    </form>
  );
};

// ── Register Form ──────────────────────────────────
const RegisterForm: React.FC<{
  onSuccess: (user: AuthUser) => void;
  onLogin: () => void;
}> = ({ onSuccess, onLogin }) => {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const strength = getStrength(pass);

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (error) {
      const msg = getGoogleAuthErrorMessage(error);
      if (msg) setErrors({ email: msg });
      console.error('Google auth error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const errs: Record<string, string> = {};
    if (!first) errs.first = 'Enter your first name';
    if (!last) errs.last = 'Enter your last name';
    if (!validateEmail(email)) errs.email = 'Enter a valid email address';
    if (!validatePhone(phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number';
    if (pass.length < 8) errs.pass = 'Password must be at least 8 characters';
    if (pass !== confirm) errs.confirm = 'Passwords do not match';
    if (!terms) errs.terms = 'You must agree to the Terms & Privacy Policy';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: first, lastName: last, email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = getApiErrorMessage(data, 'Registration failed. Please try again.');
        setSubmitError(msg);
        setErrors({ email: msg });
        setLoading(false);
        return;
      }
      // After successful registration, auto-login
      const loginRes = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem('token', loginData.token);
        onSuccess({
          id: loginData.user.id,
          firstName: loginData.user.firstName,
          lastName: loginData.user.lastName,
          email: loginData.user.email,
          role: loginData.user.role,
        });
      } else {
        // Registration succeeded but login failed, redirect to login
        setSubmitError('Registration successful, but auto login failed. Please login manually.');
        setLoading(false);
        onLogin();
      }
    } catch (err) {
      setSubmitError('Registration failed due to a network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <div>
        <h2 className="text-xl font-bold text-ink">Create Account 🎉</h2>
        <p className="mt-1 text-sm text-ink-muted">Join thousands of happy customers</p>
      </div>

      <SocialGoogleButton onClick={handleGoogle} loading={googleLoading} label="Sign up with Google" />

      <AuthDivider label="or register with email" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name" error={errors.first}>
          <div className={fieldWrapClass}>
            <User size={16} className="flex-shrink-0 text-ink-muted" />
            <input type="text" placeholder="First name" value={first}
              onChange={e => setFirst(e.target.value)} autoComplete="given-name" className={fieldInputClass} />
          </div>
        </Field>
        <Field label="Last Name" error={errors.last}>
          <div className={fieldWrapClass}>
            <input type="text" placeholder="Last name" value={last}
              onChange={e => setLast(e.target.value)} autoComplete="family-name" className={fieldInputClass} />
          </div>
        </Field>
      </div>

      <Field label="Email Address" error={errors.email}>
        <div className={fieldWrapClass}>
          <Mail size={16} className="flex-shrink-0 text-ink-muted" />
          <input type="email" placeholder="you@email.com" value={email}
            onChange={e => setEmail(e.target.value)} autoComplete="email" className={fieldInputClass} />
        </div>
      </Field>

      <Field label="Phone Number" error={errors.phone}>
        <div className={fieldWrapClass}>
          <Phone size={16} className="flex-shrink-0 text-ink-muted" />
          <span className="flex-shrink-0 text-sm text-ink-muted">+91</span>
          <input type="tel" placeholder="Please enter your number" value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            autoComplete="tel" className={fieldInputClass} />
        </div>
      </Field>

      <Field label="Password" error={errors.pass}>
        <PasswordInput id="regPass" placeholder="Min. 8 characters"
          value={pass} onChange={setPass} autoComplete="new-password" />
        {pass && (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full transition-all" style={{ width: strength.width, background: strength.color }} />
            </div>
            <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
          </>
        )}
      </Field>

      <Field label="Confirm Password" error={errors.confirm}>
        <PasswordInput id="regConfirm" placeholder="Re-enter password"
          value={confirm} onChange={setConfirm} autoComplete="new-password" />
      </Field>

      <div>
        <label className="flex items-start gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5 accent-brand-purple" />
          <span>
            I agree to the <a href="#" className="font-medium text-brand-purple hover:underline" onClick={e => e.preventDefault()}>Terms of Service</a> &amp; <a href="#" className="font-medium text-brand-purple hover:underline" onClick={e => e.preventDefault()}>Privacy Policy</a>
          </span>
        </label>
        {errors.terms && <span className="mt-1 block text-xs text-red-600">{errors.terms}</span>}
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600" role="alert">
          {submitError}
        </div>
      )}

      <SubmitButton loading={loading} loadingLabel="Creating account...">Create My Account</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        Already have an account? <a href="#" className="font-semibold text-brand-purple hover:underline" onClick={e => { e.preventDefault(); onLogin(); }}>Login here</a>
      </p>
    </form>
  );
};

// ── Phone / OTP Form (currently unreachable — no 'phone' tab wired into the
//    switch below; kept and re-styled in case it's enabled in future) ──────
export const PhoneForm: React.FC<{ onBack: () => void; onSuccess: (user: AuthUser) => void }> = ({ onBack, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [phoneErr, setPhoneErr] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOTP = () => {
    if (!validatePhone(phone)) { setPhoneErr('Enter a valid 10-digit mobile number'); return; }
    setPhoneErr('');
    setOtpSent(true);
    setCountdown(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current!); return 0; } return c - 1; });
    }, 1000);
    setTimeout(() => boxRefs.current[0]?.focus(), 100);
  };

  const handleOtpInput = (i: number, val: string) => {
    const v = val.replace(/\D/, '');
    const newOtp = [...otp];
    newOtp[i] = v;
    setOtp(newOtp);
    if (v && i < 5) boxRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) boxRefs.current[i - 1]?.focus();
  };

  const verify = () => {
    if (otp.join('').length < 6) { alert('Please enter the 6-digit OTP'); return; }
    onSuccess({ id: `u_${Date.now()}`, firstName: 'User', lastName: '', email: `+91${phone}`, role: 'user' });
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-ink">Phone Login 📱</h2>
        <p className="mt-1 text-sm text-ink-muted">We'll send an OTP to verify your number</p>
      </div>

      <Field label="Mobile Number" error={phoneErr}>
        <div className={fieldWrapClass}>
          <Phone size={16} className="flex-shrink-0 text-ink-muted" />
          <span className="flex-shrink-0 text-sm text-ink-muted">+91</span>
          <input type="tel" placeholder="9876543210" value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={fieldInputClass} />
        </div>
      </Field>

      {!otpSent && (
        <button type="button" className="rounded-lg bg-brand-purple py-3 text-sm font-semibold text-white hover:bg-brand-purple-dark" onClick={sendOTP}>Send OTP</button>
      )}

      {otpSent && (
        <>
          <Field label="Enter OTP" error="">
            <div className="flex gap-2">
              {otp.map((v, i) => (
                <input
                  key={i}
                  ref={el => { boxRefs.current[i] = el; }}
                  className="h-12 w-10 rounded-lg border border-border text-center text-lg font-semibold outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-light"
                  maxLength={1}
                  type="text"
                  inputMode="numeric"
                  value={v}
                  onChange={e => handleOtpInput(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                />
              ))}
            </div>
          </Field>
          <div className="text-sm text-ink-muted">
            {countdown > 0
              ? <>Resend OTP in <strong className="text-ink">{countdown}s</strong></>
              : <a href="#" className="font-medium text-brand-purple hover:underline" onClick={e => { e.preventDefault(); sendOTP(); }}>Resend OTP</a>
            }
          </div>
          <button type="button" className="rounded-lg bg-brand-purple py-3 text-sm font-semibold text-white hover:bg-brand-purple-dark" onClick={verify}>Verify &amp; Login</button>
        </>
      )}

      <p className="text-center text-sm text-ink-muted">
        <a href="#" className="font-medium text-brand-purple hover:underline" onClick={e => { e.preventDefault(); onBack(); }}>← Back to login</a>
      </p>
    </div>
  );
};

// ── Forgot Password ────────────────────────────────
const ForgotForm: React.FC<{ onBack: () => void; onSuccess: (user: AuthUser) => void }> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const send = () => {
    if (!validateEmail(email)) { setError('Enter a valid email address'); return; }
    onSuccess({ id: `u_${Date.now()}`, firstName: '', lastName: '', email, role: 'user' });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-ink">Reset Password 🔑</h2>
        <p className="mt-1 text-sm text-ink-muted">Enter your email and we'll send a reset link</p>
      </div>
      <Field label="Email Address" error={error}>
        <div className={fieldWrapClass}>
          <Mail size={16} className="flex-shrink-0 text-ink-muted" />
          <input type="email" placeholder="you@email.com" value={email}
            onChange={e => setEmail(e.target.value)} className={fieldInputClass} />
        </div>
      </Field>
      <button type="button" className="rounded-lg bg-brand-purple py-3 text-sm font-semibold text-white hover:bg-brand-purple-dark" onClick={send}>Send Reset Link</button>
      <p className="text-center text-sm text-ink-muted">
        <a href="#" className="font-medium text-brand-purple hover:underline" onClick={e => { e.preventDefault(); onBack(); }}>← Back to login</a>
      </p>
    </div>
  );
};

// ── Success Panel ──────────────────────────────────
const SuccessPanel: React.FC<{ title: string; msg: string; onClose: () => void }> = ({ title, msg, onClose }) => (
  <div className="flex flex-col items-center gap-3 py-6 text-center">
    <div className="text-5xl">🎉</div>
    <h2 className="text-xl font-bold text-ink">{title}</h2>
    <p className="text-sm text-ink-muted">{msg}</p>
    <button className="mt-2 rounded-lg bg-brand-purple px-6 py-3 text-sm font-semibold text-white hover:bg-brand-purple-dark" onClick={onClose}>Start Celebrating →</button>
  </div>
);

// ── Main AuthModal ─────────────────────────────────
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, tab, onClose, onSetTab, onLogin }) => {
  const [successData, setSuccessData] = useState<{ title: string; msg: string } | null>(null);

  const handleSuccess = useCallback((user: AuthUser, title: string, msg: string) => {
    setSuccessData({ title, msg });
    onSetTab('success');
    onLogin(user);
  }, [onLogin, onSetTab]);

  useEffect(() => {
    if (!isOpen) setSuccessData(null);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-0 z-[1001] mx-auto my-auto flex h-fit max-h-[92vh] w-[min(920px,94vw)] flex-col overflow-y-auto rounded-2xl bg-white shadow-2xl sm:flex-row sm:self-center"
        style={{ top: '4vh', bottom: '4vh' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Left decorative panel */}
        <div className="relative hidden w-[38%] flex-shrink-0 overflow-hidden bg-gradient-to-br from-brand-purple to-brand-pink p-8 text-white sm:block">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -right-6 top-1/3 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative flex h-full flex-col justify-center">
            <div className="text-xl font-extrabold">TheDecorParty</div>
            <div className="mt-2 text-sm text-white/85">Bangalore's #1 Surprise &amp; Decoration Platform</div>
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm"><Gift size={18} /><span>Exclusive member discounts</span></div>
              <div className="flex items-center gap-3 text-sm"><Zap size={18} /><span>Priority booking &amp; support</span></div>
              <div className="flex items-center gap-3 text-sm"><PartyPopper size={18} /><span>Track &amp; manage your events</span></div>
              <div className="flex items-center gap-3 text-sm"><Mailbox size={18} /><span>Personalised occasion reminders</span></div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="relative flex-1 p-6 sm:p-8">
          <button className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-black/5" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>

          {(tab === 'login' || tab === 'register') && (
            <div className="relative mb-6 flex rounded-lg bg-gray-100 p-1">
              <button
                className={cn('relative z-10 flex-1 rounded-md py-2 text-sm font-semibold transition-colors', tab === 'login' ? 'text-white' : 'text-ink-muted')}
                onClick={() => onSetTab('login')}
              >Login</button>
              <button
                className={cn('relative z-10 flex-1 rounded-md py-2 text-sm font-semibold transition-colors', tab === 'register' ? 'text-white' : 'text-ink-muted')}
                onClick={() => onSetTab('register')}
              >Register</button>
              <div
                className={cn(
                  'absolute inset-y-1 w-[calc(50%-4px)] rounded-md bg-brand-purple transition-transform duration-200',
                  tab === 'register' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
                )}
              />
            </div>
          )}

          {tab === 'login' && (
            <LoginForm
              onSuccess={u => handleSuccess(u, 'Welcome back! 👋', "You're now logged into TheDecorParty")}
              onRegister={() => onSetTab('register')}
              onForgot={() => onSetTab('forgot')}
            />
          )}
          {tab === 'register' && (
            <RegisterForm
              onSuccess={u => handleSuccess(u, 'Account created! 🎉', `Welcome, ${u.firstName}! Start planning your first event`)}
              onLogin={() => onSetTab('login')}
            />
          )}
          {tab === 'forgot' && (
            <ForgotForm
              onBack={() => onSetTab('login')}
              onSuccess={u => handleSuccess(u, 'Email Sent! 📧', `A password reset link has been sent to ${u.email}`)}
            />
          )}
          {tab === 'success' && successData && (
            <SuccessPanel title={successData.title} msg={successData.msg} onClose={onClose} />
          )}
        </div>
      </div>
    </>
  );
};
