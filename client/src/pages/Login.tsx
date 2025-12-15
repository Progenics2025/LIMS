import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, ArrowRight, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [view, setView] = useState<'login' | 'forgot-email' | 'forgot-otp'>('login');
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpTimer, setOtpTimer] = useState(0); // Countdown timer in seconds
  const [canResend, setCanResend] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isAuthenticated) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome to LIMS Portal",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'forgot-password' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code. OTP expires in 5 minutes.",
      });
      // Start 5 minute countdown
      setOtpTimer(300);
      setCanResend(false);
      setView('forgot-otp');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      toast({
        title: "Success",
        description: "Password reset successfully. Please login with your new password.",
      });
      setView('login');
      setPassword("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Branding (Visible on large screens) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579547945413-497e1b99dac0?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-black/90"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center p-12 text-center max-w-2xl">
          <div className="mb-8 p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl">
            <img
              src="/assets/logo_w.png"
              alt="Progenics Logo"
              className="w-80 h-auto object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-6 tracking-tight">
            Advanced LIMS Portal
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-md">
            Unmatched Genomics Expertise for Patient-Centric Care. Streamlining laboratory operations with precision and efficiency.
          </p>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        {/* Vibrant Background Mesh */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[30%] -right-[10%] w-[70vh] h-[70vh] rounded-full bg-purple-400/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen dark:bg-purple-900/30 animate-pulse"></div>
          <div className="absolute -bottom-[30%] -left-[10%] w-[70vh] h-[70vh] rounded-full bg-blue-400/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen dark:bg-blue-900/30 animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute top-[20%] left-[20%] w-[50vh] h-[50vh] rounded-full bg-indigo-400/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen dark:bg-indigo-900/30 animate-pulse" style={{ animationDuration: '5s' }}></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="/assets/logo_b.png"
              alt="Progenics Logo"
              className="w-64 h-auto object-contain drop-shadow-lg"
            />
          </div>

          <Card className="border-white/40 shadow-2xl bg-white/60 backdrop-blur-xl dark:bg-gray-900/60 ring-1 ring-white/60 dark:ring-gray-800">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl font-bold text-center tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {view === 'login' ? 'Welcome Back' : view === 'forgot-email' ? 'Reset Password' : 'Set New Password'}
              </CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300 text-base">
                {view === 'login'
                  ? 'Sign in to your LIMS account'
                  : view === 'forgot-email'
                    ? 'Enter your email to receive a verification code'
                    : 'Enter the OTP sent to your email and your new password'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {view === 'login' && (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Email address</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@progenics.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Password</Label>
                      <button
                        type="button"
                        onClick={() => setView('forgot-email')}
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all rounded-xl"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 rounded-xl transform hover:-translate-y-0.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Sign In</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </form>
              )}

              {view === 'forgot-email' && (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Email address</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="name@progenics.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all rounded-xl"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 rounded-xl transform hover:-translate-y-0.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending OTP...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Send Verification Code</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </button>
                  </div>
                </form>
              )}

              {view === 'forgot-otp' && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="otp" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Verification Code (OTP)</Label>
                      {otpTimer > 0 && (
                        <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                          Expires in {formatTimer(otpTimer)}
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all rounded-xl text-center text-lg tracking-widest"
                      />
                    </div>
                    {/* Resend OTP */}
                    <div className="text-center">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const res = await fetch('/api/auth/send-otp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email })
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.message);
                              toast({ title: "OTP Resent", description: "Please check your email." });
                              setOtpTimer(300);
                              setCanResend(false);
                            } catch (error) {
                              toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to resend OTP", variant: "destructive" });
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors hover:underline"
                        >
                          Resend OTP
                        </button>
                      ) : otpTimer > 0 ? (
                        <span className="text-sm text-gray-400">
                          Resend available in {formatTimer(otpTimer)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700 dark:text-gray-200">New Password</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Confirm Password</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all rounded-xl"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 rounded-xl transform hover:-translate-y-0.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Resetting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Reset Password</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setView('forgot-email')}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {view === 'login' && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{" "}
              <a href="#" className="text-blue-600 hover:text-blue-500 font-bold transition-colors hover:underline">
                Contact Administrator
              </a>
            </p>
          )}
        </div>

        {/* Copyright Footer */}
        <div className="absolute bottom-6 text-center text-xs text-gray-400 dark:text-gray-500 z-10">
          &copy; 2025 Progenics Lab. All rights reserved.
        </div>
      </div>
    </div>
  );
}
