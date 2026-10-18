import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
const mocks = vi.hoisted(() => ({
 signIn: { create: vi.fn(), authenticateWithRedirect: vi.fn(), attemptFirstFactor: vi.fn() },
 signUp: { create: vi.fn(), authenticateWithRedirect: vi.fn(), prepareEmailAddressVerification: vi.fn(), attemptEmailAddressVerification: vi.fn(), update: vi.fn(), status: null as string | null, missingFields: [] as string[], unverifiedFields: [] as string[] },
 setActive: vi.fn(), replace: vi.fn(), path: '/sign-in', signedIn: false, loaded: true,
}));
vi.mock('@clerk/nextjs', () => ({
 useSignIn: () => ({ signIn: mocks.signIn, isLoaded: mocks.loaded }),
 useSignUp: () => ({ signUp: mocks.signUp, isLoaded: mocks.loaded }),
 useClerk: () => ({ setActive: mocks.setActive }), useUser: () => ({ isSignedIn: mocks.signedIn }),
 SignIn: () => <div data-testid="secure-recovery"/>, SignUp: () => <div data-testid="signup-recovery"/>,
 AuthenticateWithRedirectCallback: (props: object) => <div data-testid="callback" {...props}/>,
}));
vi.mock('next/navigation', () => ({ usePathname: () => mocks.path, useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('next/link', () => ({ default: (props: object) => <a {...props}/> }));
vi.mock('@/providers/i18n-provider', () => ({ useI18n: () => ({ locale: 'en' }) }));
import AuthExperience, { authError } from './auth-experience';
import { AUTH_COPY } from './copy';
let view: ReactTestRenderer;
async function render(mode: 'sign-in' | 'sign-up' = 'sign-in') { await act(async () => { view = create(<AuthExperience mode={mode}/>); }); }
async function input(id: string, value: string) { await act(async () => { view.root.findByProps({ id }).props.onChange({ target: { value } }); }); }
async function submit() { await act(async () => { await view.root.findByType('form').props.onSubmit({ preventDefault() {} }); }); }
async function clickText(label: string) { const button = view.root.findAllByType('button').find(b => b.children.filter(c => typeof c === 'string').join('').includes(label)); if (!button) throw new Error(`Missing ${label}`); await act(async () => { await button.props.onClick(); }); }
afterEach(async () => { if(view) await act(async () => view.unmount()); });
beforeEach(() => { vi.clearAllMocks(); mocks.path='/sign-in'; mocks.loaded=true; mocks.signedIn=false; mocks.signUp.status=null; mocks.signUp.missingFields=[]; mocks.signUp.unverifiedFields=[]; });
describe('AP3K branded authentication', () => {
 it('activates only a complete email sign-in and routes to the workspace', async () => {
   mocks.signIn.create.mockResolvedValue({ status:'complete', createdSessionId:'session_test' });
   await render(); await input('auth-email','person@example.com'); await input('auth-password','test-password'); await submit();
   expect(mocks.signIn.create).toHaveBeenCalledWith({identifier:'person@example.com',password:'test-password'});
   expect(mocks.setActive).toHaveBeenCalledWith({session:'session_test'}); expect(mocks.replace).toHaveBeenCalledWith('/dashboard');
 });
 it('does not activate a session when another factor is needed', async () => {
   mocks.signIn.create.mockResolvedValue({status:'needs_second_factor'}); await render(); await submit();
   expect(mocks.setActive).not.toHaveBeenCalled(); expect(view.root.findByProps({'data-testid':'secure-recovery'})).toBeTruthy();
 });
 it('starts Google directly with an AP3K callback', async () => {
   await render(); await clickText('Continue with Google');
   expect(mocks.signIn.authenticateWithRedirect).toHaveBeenCalledWith({strategy:'oauth_google',redirectUrl:'/sign-in/sso-callback',redirectUrlComplete:'/dashboard'});
 });
 it('requires consent before Google signup', async () => {
   await render('sign-up'); await clickText('Continue with Google'); expect(mocks.signUp.authenticateWithRedirect).not.toHaveBeenCalled();
   await act(async () => view.root.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}})); await clickText('Continue with Google');
   expect(mocks.signUp.authenticateWithRedirect).toHaveBeenCalledWith(expect.objectContaining({legalAccepted:true,redirectUrlComplete:'/onboarding'}));
 });
 it('handles signup with verification and activates only after the code succeeds', async () => {
   const result={status:'missing_requirements',unverifiedFields:['email_address'],prepareEmailAddressVerification:mocks.signUp.prepareEmailAddressVerification};
   mocks.signUp.create.mockResolvedValue(result); mocks.signUp.attemptEmailAddressVerification.mockResolvedValue({status:'complete',createdSessionId:'new_session'});
   await render('sign-up'); await input('auth-name','My chosen name'); await input('auth-email','person@example.com'); await input('auth-password','test-password');
   await act(async () => view.root.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}})); await submit();
   expect(mocks.signUp.create).toHaveBeenCalledWith(expect.objectContaining({firstName:'My chosen name',legalAccepted:true}));
   expect(mocks.setActive).not.toHaveBeenCalled(); expect(mocks.signUp.prepareEmailAddressVerification).toHaveBeenCalledWith({strategy:'email_code'});
   await input('auth-code','123456'); await submit(); expect(mocks.setActive).toHaveBeenCalledWith({session:'new_session'}); expect(mocks.replace).toHaveBeenCalledWith('/onboarding');
 });
 it('handles signup when the configured policy does not require an email code', async () => {
   mocks.signUp.create.mockResolvedValue({status:'complete',createdSessionId:'new_session'}); await render('sign-up');
   await act(async () => view.root.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}})); await submit();
   expect(mocks.setActive).toHaveBeenCalledWith({session:'new_session'});
 });
 it('supports password reset with the existing account and recovery code', async () => {
   mocks.signIn.create.mockResolvedValue({status:'needs_first_factor'}); mocks.signIn.attemptFirstFactor.mockResolvedValue({status:'complete',createdSessionId:'reset_session'});
   await render(); await input('auth-email','person@example.com'); await clickText('Forgot password?'); await submit();
   expect(mocks.signIn.create).toHaveBeenCalledWith({strategy:'reset_password_email_code',identifier:'person@example.com'});
   await input('auth-code','123456'); await input('auth-password','new-test-password'); await submit();
   expect(mocks.signIn.attemptFirstFactor).toHaveBeenCalledWith({strategy:'reset_password_email_code',code:'123456',password:'new-test-password'});
   expect(mocks.setActive).toHaveBeenCalledWith({session:'reset_session'});
 });
 it('keeps errors recoverable and does not expose raw provider details', async () => {
   mocks.signIn.create.mockRejectedValue({errors:[{code:'form_password_incorrect',longMessage:'Internal data'}]}); await render(); await submit();
   expect(view.root.findByProps({role:'alert'}).children.join('')).toBe(AUTH_COPY.en.invalid); expect(mocks.setActive).not.toHaveBeenCalled();
 });
 it('routes OAuth missing requirements back to the application', async () => {
   mocks.path='/sign-in/sso-callback'; await render();
   const callback=view.root.findByProps({'data-testid':'callback'}); expect(callback.props.continueSignUpUrl).toBe('/sign-up/continue'); expect(callback.props.secondFactorUrl).toBe('/sign-in/continue');
 });
 it('finishes legal consent after OAuth without creating a second account', async () => {
   mocks.path='/sign-up/continue'; mocks.signUp.status='missing_requirements'; mocks.signUp.missingFields=['legal_accepted']; mocks.signUp.update.mockResolvedValue({status:'complete',createdSessionId:'oauth_session'});
   await render('sign-up'); await act(async () => view.root.findByProps({type:'checkbox'}).props.onChange({target:{checked:true}})); await submit();
   expect(mocks.signUp.update).toHaveBeenCalledWith({legalAccepted:true}); expect(mocks.signUp.create).not.toHaveBeenCalled(); expect(mocks.setActive).toHaveBeenCalledWith({session:'oauth_session'});
 });
 it('blocks requests until the authentication SDK is ready', async () => {
   mocks.loaded=false; await render(); await clickText('Continue with Google'); expect(mocks.signIn.authenticateWithRedirect).not.toHaveBeenCalled();
 });
 it('localizes rate-limit feedback', () => { expect(authError({errors:[{code:'too_many_requests'}]},AUTH_COPY.fr)).toBe(AUTH_COPY.fr.rate); });
});
