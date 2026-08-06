import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Sparkles, LogIn, UserPlus } from 'lucide-react';
import type { AuthTab, AuthUser } from '../types';
import { cn } from '../lib/utils';
import { getApiUrl } from '../lib/api';
import { trackLogin, trackSignup } from '../lib/analytics';

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

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  tab: AuthTab;
  onClose: () => void;
  onSetTab: (tab: AuthTab) => void;
  onLogin: (user: AuthUser, token?: string) => void;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/>
  </svg>
);

function validateEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validatePhone(v: string) { return /^[6-9]\d{9}$/.test(v); }

function getStrength(val: string): { score: number; label: string; color: string; bg: string; width: string } {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const map = [
    { label: '', color: '#E5E7EB', bg: 'bg-gray-200', width: '0%' },
    { label: 'Weak', color: '#ef4444', bg: 'bg-red-500', width: '25%' },
    { label: 'Fair', color: '#f59e0b', bg: 'bg-amber-500', width: '50%' },
    { label: 'Good', color: '#10b981', bg: 'bg-emerald-500', width: '75%' },
    { label: 'Strong', color: '#6B21A8', bg: 'bg-brand-purple', width: '100%' },
  ];
  return { score, ...map[score] };
}

// ── Input Field Component ─────────────────────────────────────────
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  error?: string;
  autoComplete?: string;
  prefix?: string;
  endAdornment?: React.ReactNode;
  maxLength?: number;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  icon,
  error,
  autoComplete,
  prefix,
  endAdornment,
  maxLength,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-gray-700 dark:text-slate-200">
        {label}
      </label>
      <div
        className={cn(
          'flex h-11 items-center gap-2.5 rounded-xl border bg-white dark:bg-slate-800 px-3.5 transition-all duration-200',
          error
            ? 'border-red-300 dark:border-red-500/50 ring-2 ring-red-50 dark:ring-red-950/30'
            : 'border-gray-200 dark:border-slate-700 focus-within:border-brand-purple/60 dark:focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-brand-purple/10 hover:border-gray-300 dark:hover:border-slate-600'
        )}
      >
        {icon && <span className="flex-shrink-0 text-gray-400 dark:text-slate-400">{icon}</span>}
        {prefix && <span className="flex-shrink-0 text-sm font-medium text-gray-500 dark:text-slate-400">{prefix}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={maxLength}
          placeholder={`Enter your ${label.toLowerCase()}`}
          className="w-full bg-transparent text-sm text-gray-900 dark:text-slate-100 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
        />
        {endAdornment}
      </div>
      {error && <span className="text-[11px] font-medium text-red-500 animate-fadeInUp">{error}</span>}
    </div>
  );
};

const PasswordInput: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}> = ({ id, label, value, onChange, error, autoComplete }) => {
  const [show, setShow] = useState(false);
  return (
    <InputField
      id={id}
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      icon={<Lock size={16} />}
      error={error}
      autoComplete={autoComplete}
      endAdornment={
        <button
          type="button"
          tabIndex={-1}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
};

const SocialGoogleButton: React.FC<{ onClick: () => void; loading: boolean; label: string }> = ({ onClick, loading, label }) => (
  <button
    type="button"
    className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-semibold text-gray-700 dark:text-slate-200 transition-all duration-200 hover:bg-gray-50/90 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 active:scale-[0.99] disabled:opacity-60 shadow-xs"
    onClick={onClick}
    disabled={loading}
  >
    {loading ? (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 dark:border-slate-600 border-t-gray-700 dark:border-t-slate-200" />
    ) : (
      <GoogleIcon />
    )}
    <span>{loading ? 'Connecting...' : label}</span>
  </button>
);

const AuthDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="relative my-3 flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
    <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
    <span className="font-medium">{label}</span>
    <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
  </div>
);

const SubmitButton: React.FC<{ loading: boolean; loadingLabel: string; children: React.ReactNode }> = ({ loading, loadingLabel, children }) => (
  <button
    type="submit"
    disabled={loading}
    className="group relative flex h-[47px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple via-purple-700 to-brand-purple-dark px-5 text-sm sm:text-base font-bold text-white shadow-md shadow-brand-purple/20 transition-all duration-200 hover:shadow-lg hover:shadow-brand-purple/30 hover:scale-[1.005] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 disabled:shadow-none"
  >
    {loading ? (
      <>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <span>{loadingLabel}</span>
      </>
    ) : (
      <>
        <span>{children}</span>
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
      </>
    )}
  </button>
);

// ── Login Form ──────────────────────────────────────
const LoginForm: React.FC<{
  onSuccess: (user: AuthUser, token?: string) => void;
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
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const res = await fetch(getApiUrl('/api/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          photoURL: firebaseUser.photoURL || '',
        }),
      });

      const data = await parseJsonResponse<{ token?: string; user?: { id: string; firstName: string; lastName: string; email: string; role: AuthUser['role'] }; msg?: string; message?: string }>(res);
      if (!res.ok || !data?.token || !data.user) {
        const msg = getApiErrorMessage(data, 'Google login failed');
        console.error('Google auth failed:', msg);
        setErrors({ email: msg });
        return;
      }

      trackLogin('google', data.user.id);
      onSuccess({
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        role: data.user.role,
      }, data.token);
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
    if (!validateEmail(email)) errs.email = 'Please enter a valid email address';
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
      const data = await parseJsonResponse<{ token?: string; user?: { id: string; firstName: string; lastName: string; email: string; role: AuthUser['role'] }; msg?: string; message?: string }>(res);
      if (!res.ok || !data?.token || !data.user) {
        const msg = getApiErrorMessage(data, 'Login failed');
        setErrors({ email: msg });
        setLoading(false);
        return;
      }
      trackLogin('email');
      onSuccess({
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        role: data.user.role,
      }, data.token);
    } catch (err) {
      setErrors({ email: 'Connection failed. Please check network.' });
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-4 animate-fadeIn" onSubmit={submit} noValidate>
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-purple">
          <LogIn size={11} /> RETURNING USER
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">Log in to your account</h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">Welcome back! Please enter your details.</p>
      </div>

      <SocialGoogleButton onClick={handleGoogle} loading={googleLoading} label="Continue with Google" />

      <AuthDivider label="or sign in with email" />

      <InputField
        id="loginEmail"
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        icon={<Mail size={16} />}
        error={errors.email}
        autoComplete="email"
      />

      <PasswordInput
        id="loginPass"
        label="Password"
        value={pass}
        onChange={setPass}
        error={errors.pass}
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-gray-600 select-none">
          <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded border-gray-300 accent-brand-purple" />
          <span>Remember me</span>
        </label>
        <button
          type="button"
          className="font-semibold text-brand-purple hover:underline"
          onClick={onForgot}
        >
          Forgot password?
        </button>
      </div>

      <SubmitButton loading={loading} loadingLabel="Signing in...">Log in</SubmitButton>

      <p className="mt-1 text-center text-xs text-gray-500">
        Don't have an account?{' '}
        <button
          type="button"
          className="font-bold text-brand-purple hover:underline"
          onClick={onRegister}
        >
          Create account
        </button>
      </p>
    </form>
  );
};

// ── Register Form ──────────────────────────────────
const RegisterForm: React.FC<{
  onSuccess: (user: AuthUser, token?: string) => void;
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
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const res = await fetch(getApiUrl('/api/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          photoURL: firebaseUser.photoURL || '',
        }),
      });

      const data = await parseJsonResponse<{ token?: string; user?: { id: string; firstName: string; lastName: string; email: string; role: AuthUser['role'] }; msg?: string; message?: string }>(res);
      if (!res.ok || !data?.token || !data.user) {
        const msg = getApiErrorMessage(data, 'Google login failed');
        console.error('Google auth failed:', msg);
        setErrors({ email: msg });
        return;
      }

      trackSignup('google');
      onSuccess({
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        role: data.user.role,
      }, data.token);
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
    if (!first) errs.first = 'Enter first name';
    if (!last) errs.last = 'Enter last name';
    if (!validateEmail(email)) errs.email = 'Enter a valid email address';
    if (!validatePhone(phone)) errs.phone = 'Enter a valid 10-digit mobile number';
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
        body: JSON.stringify({ firstName: first, lastName: last, email, password: pass, phone })
      });
      const data = await parseJsonResponse<{ msg?: string; message?: string }>(res);
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
      const loginData = await parseJsonResponse<{ token?: string; user?: { id: string; firstName: string; lastName: string; email: string; role: AuthUser['role'] }; msg?: string; message?: string }>(loginRes);
      if (loginRes.ok && loginData?.token && loginData.user) {
        trackSignup('email');
        onSuccess({
          id: loginData.user.id,
          firstName: loginData.user.firstName,
          lastName: loginData.user.lastName,
          email: loginData.user.email,
          role: loginData.user.role,
        }, loginData.token);
      } else {
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
    <form className="flex flex-col gap-3.5 animate-fadeIn" onSubmit={submit} noValidate>
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-bold text-violet-700">
          <UserPlus size={11} /> GETTING STARTED
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">Create your account</h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">Start planning unforgettable celebrations across Bengaluru.</p>
      </div>

      <SocialGoogleButton onClick={handleGoogle} loading={googleLoading} label="Sign up with Google" />

      <AuthDivider label="or register with email" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InputField
          id="regFirst"
          label="First Name"
          value={first}
          onChange={setFirst}
          icon={<User size={16} />}
          error={errors.first}
          autoComplete="given-name"
        />
        <InputField
          id="regLast"
          label="Last Name"
          value={last}
          onChange={setLast}
          error={errors.last}
          autoComplete="family-name"
        />
      </div>

      <InputField
        id="regEmail"
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        icon={<Mail size={16} />}
        error={errors.email}
        autoComplete="email"
      />

      <InputField
        id="regPhone"
        label="Mobile Number"
        type="tel"
        value={phone}
        onChange={v => setPhone(v.replace(/\D/g, '').slice(0, 10))}
        icon={<Phone size={16} />}
        prefix="+91"
        error={errors.phone}
        autoComplete="tel"
        maxLength={10}
      />

      <div>
        <PasswordInput
          id="regPass"
          label="Password"
          value={pass}
          onChange={setPass}
          error={errors.pass}
          autoComplete="new-password"
        />
        {pass && (
          <div className="mt-1.5 flex flex-col gap-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn('h-full rounded-full transition-all duration-300', strength.bg)}
                style={{ width: strength.width }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">Password strength:</span>
              <span className="font-semibold" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          </div>
        )}
      </div>

      <PasswordInput
        id="regConfirm"
        label="Confirm Password"
        value={confirm}
        onChange={setConfirm}
        error={errors.confirm || (confirm && pass !== confirm ? 'Passwords do not match' : undefined)}
        autoComplete="new-password"
      />

      <div>
        <label className="flex items-start gap-2 text-xs text-gray-600 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={terms}
            onChange={e => setTerms(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand-purple"
          />
          <span>
            I agree to the{' '}
            <a href="#" className="font-semibold text-brand-purple hover:underline" onClick={e => e.preventDefault()}>Terms of Service</a> &amp;{' '}
            <a href="#" className="font-semibold text-brand-purple hover:underline" onClick={e => e.preventDefault()}>Privacy Policy</a>
          </span>
        </label>
        {errors.terms && <span className="mt-1 block text-xs font-medium text-red-500">{errors.terms}</span>}
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600" role="alert">
          {submitError}
        </div>
      )}

      <SubmitButton loading={loading} loadingLabel="Creating account...">Create account</SubmitButton>

      <p className="text-center text-xs text-gray-500">
        Already have an account?{' '}
        <button
          type="button"
          className="font-bold text-brand-purple hover:underline"
          onClick={onLogin}
        >
          Log in
        </button>
      </p>
    </form>
  );
};

// ── Forgot Password Form ───────────────────────────
const ForgotForm: React.FC<{ onBack: () => void; onSuccess: (user: AuthUser, token?: string) => void }> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const send = () => {
    if (!validateEmail(email)) { setError('Enter a valid email address'); return; }
    onSuccess({ id: `u_${Date.now()}`, firstName: '', lastName: '', email, role: 'user' });
  };

  return (
    <form onSubmit={e => { e.preventDefault(); send(); }} className="flex flex-col gap-4 animate-fadeIn" noValidate>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Reset password</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Enter your email and we'll send you a reset link</p>
      </div>

      <InputField
        id="forgotEmail"
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        icon={<Mail size={16} />}
        error={error}
        autoComplete="email"
      />

      <SubmitButton loading={false} loadingLabel="Sending...">Send reset link</SubmitButton>

      <button
        type="button"
        className="text-center text-xs font-semibold text-brand-purple dark:text-purple-400 hover:underline"
        onClick={onBack}
      >
        ← Back to log in
      </button>
    </form>
  );
};

// ── Success Panel ──────────────────────────────────
const SuccessPanel: React.FC<{ title: string; msg: string; onClose: () => void }> = ({ title, msg, onClose }) => (
  <div className="flex flex-col items-center gap-3 py-6 text-center animate-scaleIn">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-brand-purple">
      <Sparkles size={24} />
    </div>
    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    <p className="text-xs text-gray-500 max-w-xs">{msg}</p>
    <button
      className="mt-2 flex h-[47px] w-full max-w-xs items-center justify-center rounded-xl bg-brand-purple text-sm font-bold text-white shadow-md shadow-brand-purple/20 transition-all hover:bg-brand-purple-dark active:scale-[0.98]"
      onClick={onClose}
    >
      Continue →
    </button>
  </div>
);

// ── Main AuthModal ─────────────────────────────────
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, tab, onClose, onSetTab, onLogin }) => {
  const [successData, setSuccessData] = useState<{ title: string; msg: string } | null>(null);
  const navigate = useNavigate();

  const handleSuccess = useCallback(
    (user: AuthUser, token: string | undefined, title: string, msg: string) => {
      setSuccessData({ title, msg });
      onLogin(user, token);
    },
    [onLogin]
  );

  useEffect(() => {
    if (!isOpen) setSuccessData(null);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const isRegister = tab === 'register';

  return (
    <>
      {/* Soft Backdrop */}
      <div
        className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Centered Modal Container — Sizes naturally according to content height */}
      <div
        className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative flex max-h-[88vh] w-full max-w-[860px] flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-purple-950/20 transition-all duration-300 lg:flex-row animate-scaleIn">
          {/* Left branding section (Desktop only) — Visually balanced vertical layout */}
          <div
            className={cn(
              'relative hidden w-[360px] flex-shrink-0 flex-col justify-between overflow-hidden p-8 text-white transition-all duration-500 lg:flex',
              isRegister
                ? 'bg-gradient-to-br from-purple-950 via-purple-900 to-slate-900'
                : 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950'
            )}
          >
            {/* Background image overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity transition-all duration-500"
              style={{
                backgroundImage: isRegister
                  ? 'url(https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80)'
                  : 'url(https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />

            {/* Top Brand Header */}
            <div className="relative z-10">
              <div className="flex items-center gap-2.5">
                <img src="/final_logo.jpeg" alt="TheDecorParty" className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-lg font-bold tracking-tight text-white">
                  TheDecor<span className="text-purple-300">Party</span>
                </span>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-purple-200 backdrop-blur-sm">
                {isRegister ? '✨ Start Planning' : '🔐 Secure Sign In'}
              </div>
            </div>

            {/* Middle Headline — Well distributed */}
            <div className="relative z-10 my-auto py-8">
              <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
                {isRegister ? "Let's Create Your Account" : 'Welcome Back'}
              </h3>
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed font-normal">
                {isRegister
                  ? 'Start planning unforgettable celebrations in just a few minutes.'
                  : 'Continue planning your celebrations with TheDecorParty.'}
              </p>
              {/* Graphic accent */}
              <div className="mt-5 flex items-center gap-1.5">
                <div className="h-1 w-7 rounded-full bg-purple-400/60" />
                <div className="h-1 w-2 rounded-full bg-purple-400/30" />
              </div>
            </div>

            {/* Bottom Copyright */}
            <div className="relative z-10 text-[11px] text-slate-400">
              © {new Date().getFullYear()} TheDecorParty. All rights reserved.
            </div>
          </div>

          {/* Right Form Container — Hugs content height without dead bottom space */}
          <div className="relative flex flex-1 flex-col overflow-y-auto p-5 sm:p-7 lg:p-8">
            {/* Close button */}
            <button
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            {/* Prominent High-Contrast Toggle */}
            {(tab === 'login' || tab === 'register') && (
              <div className="relative mb-6 flex items-center rounded-2xl bg-gray-100/90 dark:bg-slate-800/90 p-1 w-full max-w-[240px] select-none border border-gray-200/80 dark:border-slate-700 shadow-inner">
                <button
                  type="button"
                  className={cn(
                    'relative z-10 flex-1 rounded-xl py-2 text-xs sm:text-sm font-bold transition-all duration-300 text-center',
                    tab === 'login'
                      ? 'text-white scale-100'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/40'
                  )}
                  onClick={() => onSetTab('login')}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className={cn(
                    'relative z-10 flex-1 rounded-xl py-2 text-xs sm:text-sm font-bold transition-all duration-300 text-center',
                    tab === 'register'
                      ? 'text-white scale-100'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/40'
                  )}
                  onClick={() => onSetTab('register')}
                >
                  Register
                </button>

                {/* Sliding Active Indicator Pill */}
                <div
                  className={cn(
                    'absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-brand-purple to-purple-700 shadow-md shadow-brand-purple/30 transition-transform duration-300 ease-[cubic-bezier(0.34,1.1,0.64,1)]',
                    tab === 'register' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
                  )}
                />
              </div>
            )}

            {/* Form Tabs */}
            {tab === 'login' && (
              <LoginForm
                onSuccess={(u, token) => handleSuccess(u, token, 'Welcome back', 'You are now logged into your account.')}
                onRegister={() => onSetTab('register')}
                onForgot={() => { onClose(); navigate('/forgot-password'); }}
              />
            )}
            {tab === 'register' && (
              <RegisterForm
                onSuccess={(u, token) => handleSuccess(u, token, 'Account created', `Welcome, ${u.firstName}! Your account is ready.`)}
                onLogin={() => onSetTab('login')}
              />
            )}
            {tab === 'forgot' && (
              <ForgotForm
                onBack={() => onSetTab('login')}
                onSuccess={(u, token) => handleSuccess(u, token, 'Email sent', `A password reset link has been sent to ${u.email}`)}
              />
            )}
            {tab === 'success' && successData && (
              <SuccessPanel title={successData.title} msg={successData.msg} onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
