import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message || "Failed to initialize Google login.");
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
        toast.success("Welcome back to Lekho!");
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: authData.user.id,
              username: data.username,
              full_name: data.fullName,
            }
          ]);
          if (profileError) {
            toast.error("Account created, but profile setup failed. Please update your profile later.");
          } else {
            toast.success("Account created successfully!");
          }
        }
      }
    } catch (err) {
      toast.error(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-10 sm:p-12 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-2xl border border-gray-100 flex flex-col relative z-10">
        
        {/* Header */}
        <div className="text-left mb-8">
          <h2 className="text-[28px] font-bold text-gray-900 tracking-tight mb-2">
            {isLogin ? "Sign In / Sign Up" : "Create an Account"}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Authentication portal for the curious mind.
          </p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#f3f5f8] hover:bg-[#ebedf2] text-[15px] font-semibold text-gray-800 transition-colors disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
          )}
          Continue with Google
        </button>

        {/* Separator */}
        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-gray-100"></div>
          <span className="px-4 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
            Or Email
          </span>
          <div className="flex-1 border-t border-gray-100"></div>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          
          {!isLogin && (
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Full Name</label>
                <input
                  {...register("fullName", { required: !isLogin && "Full Name is required" })}
                  type="text"
                  className="w-full px-4 py-3 bg-[#f8f9fc] border border-transparent rounded-xl text-[15px] focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Username</label>
                <input
                  {...register("username", { required: !isLogin && "Username is required" })}
                  type="text"
                  className="w-full px-4 py-3 bg-[#f8f9fc] border border-transparent rounded-xl text-[15px] focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="johndoe123"
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Email address</label>
            <input
              {...register("email", { required: "Email is required" })}
              type="email"
              className="w-full px-4 py-3 bg-[#f8f9fc] border border-transparent rounded-xl text-[15px] focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="name@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[13px] font-bold text-gray-800">Password</label>
              {isLogin && (
                <a href="#" className="text-[12px] font-bold text-blue-600 hover:text-blue-700">
                  Forgot password?
                </a>
              )}
            </div>
            <input
              {...register("password", { required: "Password is required", minLength: 6 })}
              type="password"
              className="w-full px-4 py-3 bg-[#f8f9fc] border border-transparent rounded-xl text-[15px] tracking-widest focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-700 placeholder:tracking-normal"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1 tracking-normal">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3.5 px-4 mt-2 font-bold rounded-xl text-white bg-[#4338ca] hover:bg-[#3730a3] focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-[13px] text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-[#4338ca] hover:underline"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-50 flex justify-center gap-6 text-[11px] text-gray-400 font-medium">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
        </div>

      </div>
    </div>
  );
};

export default Auth;
