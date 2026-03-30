import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2, Feather, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm();

  if (user) return <Navigate to="/" replace />;

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message || 'Failed to initialize Google login.');
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success('Welcome back to Lekho!');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { username: data.username, fullName: data.fullName } },
        });
        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').upsert([
            { id: authData.user.id, username: data.username, full_name: data.fullName },
          ], { onConflict: 'id' });

          if (profileError) {
            console.error('Profile error:', profileError);
            toast.error('Account created, but profile setup had an issue. Update it in your profile!');
          } else {
            toast.success('Welcome to Lekho! 🎉');
          }
        }
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lekho-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-lekho-accent/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Card */}
      <div className="glass w-full max-w-md rounded-3xl p-8 sm:p-10 shadow-glass relative z-10 animate-slide-up">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-lekho flex items-center justify-center shadow-glow-purple">
            <Feather className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-lekho-text leading-tight">
              {isLogin ? 'Welcome back' : 'Join লেখো'}
            </h1>
            <p className="text-xs text-lekho-muted">{isLogin ? 'Sign in to continue' : 'Create your account'}</p>
          </div>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-[14px] font-semibold text-lekho-text transition-all duration-200 disabled:opacity-50 mb-6"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[11px] font-bold tracking-widest text-lekho-muted uppercase">Or email</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>

          {!isLogin && (
            <>
              <div>
                <label className="block text-[12px] font-bold text-lekho-muted mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  {...register('fullName', { required: !isLogin && 'Required' })}
                  type="text"
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[14px] text-lekho-text placeholder-lekho-muted focus:bg-white/[0.08] focus:border-lekho-primary/60 focus:ring-2 focus:ring-lekho-primary/20 outline-none transition-all"
                  placeholder="Your full name"
                />
                {errors.fullName && <p className="text-rose-400 text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-lekho-muted mb-1.5 uppercase tracking-wider">Username</label>
                <input
                  {...register('username', { required: !isLogin && 'Required' })}
                  type="text"
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[14px] text-lekho-text placeholder-lekho-muted focus:bg-white/[0.08] focus:border-lekho-primary/60 focus:ring-2 focus:ring-lekho-primary/20 outline-none transition-all"
                  placeholder="username123"
                />
                {errors.username && <p className="text-rose-400 text-xs mt-1">{errors.username.message}</p>}
              </div>
            </>
          )}

          <div>
            <label className="block text-[12px] font-bold text-lekho-muted mb-1.5 uppercase tracking-wider">Email</label>
            <input
              {...register('email', { required: 'Email is required' })}
              type="email"
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[14px] text-lekho-text placeholder-lekho-muted focus:bg-white/[0.08] focus:border-lekho-primary/60 focus:ring-2 focus:ring-lekho-primary/20 outline-none transition-all"
              placeholder="name@example.com"
            />
            {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[12px] font-bold text-lekho-muted uppercase tracking-wider">Password</label>
              {isLogin && (
                <a href="#" className="text-[11px] font-bold text-lekho-primary-light hover:text-lekho-accent transition-colors">
                  Forgot password?
                </a>
              )}
            </div>
            <div className="relative">
              <input
                {...register('password', { required: 'Password is required', minLength: 6 })}
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 pr-11 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[14px] text-lekho-text placeholder-lekho-muted focus:bg-white/[0.08] focus:border-lekho-primary/60 focus:ring-2 focus:ring-lekho-primary/20 outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lekho-muted hover:text-lekho-text transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3.5 px-4 mt-2 font-bold rounded-2xl text-white bg-gradient-lekho hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-lekho-primary/50 transition-all shadow-glow-purple disabled:opacity-50 flex justify-center items-center gap-2 relative overflow-hidden"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <p className="text-[13px] text-lekho-muted">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-lekho-primary-light hover:text-lekho-accent transition-colors"
            >
              {isLogin ? 'Create account' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Footer links */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] flex justify-center gap-6 text-[11px] text-lekho-muted font-medium">
          <a href="#" className="hover:text-lekho-text transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-lekho-text transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
