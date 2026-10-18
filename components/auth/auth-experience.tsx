'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthenticateWithRedirectCallback, SignIn, SignUp, useClerk, useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import type { SignInResource, SignUpResource } from '@clerk/types';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole, MessageCircle, Send, Zap } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { localizePublicPath } from '@/lib/i18n/config';
import { AUTH_COPY, type AuthCopy } from './copy';
import './auth.css';

type Step = 'entry' | 'verify' | 'forgot' | 'reset' | 'complete' | 'advanced';

export function authError(error: unknown, copy: AuthCopy): string {
  const code = (error as { errors?: { code?: string }[] })?.errors?.[0]?.code || '';
  if (/password_pwned|password_validation|password_length|password_not_strong/.test(code)) return copy.weak;
  if (/identifier_exists/.test(code)) return copy.exists;
  if (/password_incorrect|identifier_not_found|form_identifier/.test(code)) return copy.invalid;
  if (/verification_failed|code_incorrect|verification_expired/.test(code)) return copy.expired;
  if (/too_many|rate_limit|locked/.test(code)) return copy.rate;
  return copy.error;
}

function GoogleIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93a6 6 0 0 1 0-3.86V7.48H3.06a10 10 0 0 0 0 9.04l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59A5.99 5.99 0 0 1 12 5.95Z"/></svg>;
}

export function AuthStory() {
  const { locale } = useI18n();
  const t = AUTH_COPY[locale];
  return <aside className="auth-story" aria-label={t.preview}>
    <div className="auth-story-glow" />
    <div className="auth-story-heading"><span className="auth-eyebrow">INSTAGRAM × AP3K</span><h2>{t.hero}</h2><p>{t.heroIntro}</p></div>
    <div className="auth-scene">
      <div className="auth-photo"><Image src="/media/hero/creator-fashion.webp" alt="" width={480} height={720} sizes="(max-width: 800px) 1px, 260px" /><div className="auth-photo-label"><span className="auth-avatar">S</span><span>studio.sofia<small>Instagram</small></span></div></div>
      <div className="auth-comment auth-floating-card"><span className="auth-card-label"><MessageCircle size={14}/>{t.commentLabel}</span><div className="auth-comment-body"><span className="auth-avatar auth-avatar-pink">J</span><p><strong>julia</strong>{t.comment}</p></div></div>
      <div className="auth-message auth-floating-card"><span className="auth-card-label"><Send size={14}/>{t.replyLabel}</span><p>{t.reply}</p><div className="auth-demo-link">{t.link}<ArrowRight size={14}/></div></div>
      <div className="auth-flow auth-floating-card"><span className="auth-flow-icon"><Zap size={19}/></span><div><small>{t.keyword}</small><strong>LINK <ArrowRight size={14}/> {t.action}</strong></div><span className="auth-flow-check"><Check size={15}/></span></div>
    </div>
    <div className="auth-story-bottom"><span><i/>{t.active}</span><span>{t.preview}</span></div>
  </aside>;
}

export default function AuthExperience({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const signingUp = mode === 'sign-up';
  const { locale } = useI18n();
  const t = AUTH_COPY[locale];
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { setActive } = useClerk();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const path = usePathname();
  const callback = path.endsWith('/sso-callback');
  const continuing = path.endsWith('/continue');
  const [step, setStep] = useState<Step>('entry');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const lock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const ready = signInLoaded && signUpLoaded;
  const local = (url: string) => localizePublicPath(url, locale);

  useEffect(() => {
    if (isSignedIn && !callback) router.replace(signingUp ? '/onboarding' : '/dashboard');
  }, [isSignedIn, callback, router, signingUp]);
  useEffect(() => {
    if (!ready || !continuing) return;
    // OAuth may return with legal consent or another verification still required.
    if (signingUp && signUp?.status === 'missing_requirements' && signUp.missingFields.every(f => ['legal_accepted', 'first_name', 'last_name'].includes(f)) && !signUp.unverifiedFields.length) {
      setStep('complete');
    } else setStep('advanced');
  }, [ready, continuing, signingUp, signUp]);
  useEffect(() => { if (step !== 'entry') heading.current?.focus(); }, [step]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function run(work: () => Promise<void>) {
    if (lock.current || !ready) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (err) { setError(authError(err, t)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function finish(result: SignInResource | SignUpResource) {
    if (result.status === 'complete' && result.createdSessionId) {
      await setActive({ session: result.createdSessionId });
      router.replace(signingUp ? '/onboarding' : '/dashboard');
      return;
    }
    // Retain the provider's recovery UI for MFA, passkeys, or future account
    // requirements. Never treat a partial authentication as a valid session.
    setStep('advanced');
  }
  async function signupResult(result: SignUpResource) {
    if (result.status === 'complete') return finish(result);
    if (result.unverifiedFields.includes('email_address')) {
      await result.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify'); setCooldown(30); return;
    }
    setStep('advanced');
  }
  async function google() {
    if (signingUp && !accepted) { setError(t.consent); return; }
    await run(async () => {
      const resource = signingUp ? signUp : signIn;
      await resource!.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: local(`/${mode}/sso-callback`), redirectUrlComplete: signingUp ? '/onboarding' : '/dashboard', ...(signingUp ? { legalAccepted: accepted } : {}) });
    });
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if ((signingUp && step === 'entry' || step === 'complete') && !accepted) { setError(t.consent); return; }
    await run(async () => {
      if (step === 'forgot') {
        await signIn!.create({ strategy: 'reset_password_email_code', identifier: email.trim() });
        setStep('reset'); setCooldown(30); return;
      }
      if (step === 'reset') {
        const result = await signIn!.attemptFirstFactor({ strategy: 'reset_password_email_code', code, password });
        await finish(result); return;
      }
      if (step === 'verify') { await signupResult(await signUp!.attemptEmailAddressVerification({ code })); return; }
      if (step === 'complete') {
        await signupResult(await signUp!.update({ legalAccepted: accepted, ...(name.trim() ? { firstName: name.trim() } : {}) })); return;
      }
      if (signingUp) {
        await signupResult(await signUp!.create({ emailAddress: email.trim(), password, ...(name.trim() ? { firstName: name.trim() } : {}), legalAccepted: accepted }));
      } else {
        await finish(await signIn!.create({ identifier: email.trim(), password }));
      }
    });
  }
  function resetEntry() { setStep('entry'); setError(''); setNotice(''); setCode(''); setPassword(''); }
  const title = step === 'verify' ? t.verify : step === 'forgot' || step === 'reset' ? t.reset : step === 'complete' ? t.complete : signingUp ? t.create : t.welcome;
  const intro = step === 'verify' || step === 'reset' ? `${t.codeIntro} ${email}` : step === 'forgot' ? t.resetIntro : signingUp ? t.signupIntro : t.intro;
  const consent = <label className="auth-consent"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>{t.agree} <Link href={local('/terms')} target="_blank" rel="noopener noreferrer">{t.terms}</Link> {t.and} <Link href={local('/privacy')} target="_blank" rel="noopener noreferrer">{t.privacy}</Link>.</span></label>;

  if (callback) return <div className="auth-form"><p role="status" className="auth-loading"><Loader2 className="animate-spin" size={20}/>{t.loading}</p><AuthenticateWithRedirectCallback signInUrl={local('/sign-in')} signUpUrl={local('/sign-up')} signInForceRedirectUrl="/dashboard" signUpForceRedirectUrl="/onboarding" continueSignUpUrl={local('/sign-up/continue')} secondFactorUrl={local('/sign-in/continue')} firstFactorUrl={local('/sign-in/continue')} resetPasswordUrl={local('/sign-in/continue')} /><div id="clerk-captcha"/></div>;
  if (step === 'advanced') return <div className="auth-form auth-advanced">{signingUp ? <SignUp routing="hash" forceRedirectUrl="/onboarding" /> : <SignIn routing="hash" forceRedirectUrl="/dashboard" />}</div>;

  return <div className="auth-form">
    <div className="auth-form-heading"><span className="auth-eyebrow">AP3K</span><h1 ref={heading} tabIndex={-1}>{title}</h1><p>{intro}</p></div>
    {step === 'entry' && <><button type="button" className="auth-google" onClick={google} disabled={!ready || busy}><GoogleIcon/>{t.google}</button><div className="auth-divider"><span>{t.or}</span></div></>}
    <form onSubmit={submit} aria-busy={busy}>
      {(signingUp && step === 'entry' || step === 'complete') && <div className="auth-field"><label htmlFor="auth-name">{t.name}</label><input id="auth-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={256}/></div>}
      {(step === 'entry' || step === 'forgot') && <div className="auth-field"><label htmlFor="auth-email">{t.email}</label><input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} /></div>}
      {(step === 'verify' || step === 'reset') && <div className="auth-field"><label htmlFor="auth-code">{t.code}</label><input id="auth-code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="auth-code" /></div>}
      {(step === 'entry' || step === 'reset') && <div className="auth-field"><div className="auth-label-row"><label htmlFor="auth-password">{step === 'reset' ? t.newPassword : t.password}</label>{!signingUp && step === 'entry' && <button type="button" onClick={() => { setPassword(''); setError(''); setStep('forgot'); }}>{t.forgot}</button>}</div><div className="auth-password"><input id="auth-password" type={visible ? 'text' : 'password'} autoComplete={signingUp || step === 'reset' ? 'new-password' : 'current-password'} required value={password} onChange={e => setPassword(e.target.value)} /><button type="button" aria-label={visible ? t.hide : t.show} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>}
      {(signingUp && step === 'entry' || step === 'complete') && consent}
      <div id="clerk-captcha" data-cl-theme="auto" />
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      <button className="auth-primary" type="submit" disabled={!ready || busy}>{busy ? <><Loader2 size={18} className="animate-spin"/>{t.loading}</> : <>{step === 'forgot' ? t.sendCode : step === 'reset' ? t.savePassword : step === 'verify' ? t.verifyButton : step === 'complete' ? t.continue : signingUp ? t.signUp : t.signIn}<ArrowRight size={18}/></>}</button>
    </form>
    {(step === 'verify' || step === 'reset') && <button type="button" className="auth-resend" disabled={busy || cooldown > 0} onClick={() => run(async () => {
      if (step === 'verify') await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
      else await signIn!.create({ strategy: 'reset_password_email_code', identifier: email.trim() });
      setCooldown(30); setNotice(t.sent);
    })}>{t.resend}{cooldown > 0 ? ` (${cooldown})` : ''}</button>}
    {step === 'entry' ? <><p className="auth-switch">{signingUp ? t.haveAccount : t.newHere} <Link href={local(signingUp ? '/sign-in' : '/sign-up')}>{signingUp ? t.signIn : t.signUp}<ArrowRight size={14}/></Link></p><p className="auth-security"><LockKeyhole size={13}/>{signingUp ? t.free : t.secure}</p></> : step !== 'complete' && <button type="button" className="auth-back" disabled={busy} onClick={resetEntry}><ArrowLeft size={15}/>{signingUp ? t.change : t.back}</button>}
  </div>;
}
