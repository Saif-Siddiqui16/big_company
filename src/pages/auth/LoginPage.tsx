import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { BrandedName } from '../../components/BrandedName';
import axios from 'axios';
import { API_URL } from '../../config';

// Icons
const ShoppingCartIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ShopIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const TeamIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Admin icon for admin login
const ShieldIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Employee/Briefcase icon for employee login
const BriefcaseIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// Roles available in public login
type PublicUserRole = 'consumer' | 'employee' | 'retailer' | 'wholesaler' | 'admin';

const roleConfig: Record<PublicUserRole, {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  bgGradient: string;
  lightBg: string;
  borderColor: string;
  textColor: string;
  buttonColor: string;
  redirect: string;
  authType: 'phone' | 'email';
  credentials: { phone: string; pin: string; email: string; password: string };
}> = {
  consumer: {
    title: 'Consumer Store',
    subtitle: 'Shop amazing products from local retailers',
    icon: <ShoppingCartIcon />,
    gradient: 'from-emerald-500 to-green-600',
    bgGradient: 'from-emerald-400 via-green-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    redirect: '/consumer/shop',
    authType: 'phone' as const,
    credentials: { phone: '', pin: '', email: '', password: '' },
  },
  employee: {
    title: 'Employee Portal',
    subtitle: 'Access your payslips, attendance, and benefits',
    icon: <BriefcaseIcon />,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-400 via-orange-500 to-red-600',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    buttonColor: 'bg-amber-600 hover:bg-amber-700',
    redirect: '/employee/attendance',
    authType: 'email' as const,
    credentials: { phone: '', pin: '', email: '', password: '' },
  },
  retailer: {
    title: 'Retailer Dashboard',
    subtitle: 'Manage your shop inventory and orders',
    icon: <ShopIcon />,
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-400 via-indigo-500 to-purple-600',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    redirect: '/retailer/dashboard',
    authType: 'email' as const,
    credentials: { phone: '', pin: '', email: '', password: '' },
  },
  wholesaler: {
    title: 'Wholesaler Portal',
    subtitle: 'Distribute products to your retailer network',
    icon: <TeamIcon />,
    gradient: 'from-purple-500 to-violet-600',
    bgGradient: 'from-purple-400 via-violet-500 to-indigo-600',
    lightBg: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    redirect: '/wholesaler/dashboard',
    authType: 'email' as const,
    credentials: { phone: '', pin: '', email: '', password: '' },
  },
  admin: {
    title: 'Admin Portal',
    subtitle: 'System Administration and Management',
    icon: <ShieldIcon />,
    gradient: 'from-red-500 to-rose-600',
    bgGradient: 'from-red-400 via-rose-500 to-pink-600',
    lightBg: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    buttonColor: 'bg-red-600 hover:bg-red-700',
    redirect: '/admin/dashboard',
    authType: 'email' as const,
    credentials: { phone: '', pin: '', email: '', password: '' },
  },
};

// Floating particles component for background
const FloatingParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, isLoading } = useAuth();

  // Get role from URL or default to consumer
  const urlRole = searchParams.get('role');
  // Only allow public roles - admin uses separate internal auth
  const validPublicRoles: PublicUserRole[] = ['consumer', 'retailer', 'wholesaler'];
  const initialRole: PublicUserRole = validPublicRoles.includes(urlRole as PublicUserRole)
    ? (urlRole as PublicUserRole)
    : 'consumer';
  const [activeRole, setActiveRole] = useState<PublicUserRole>(initialRole);
  // Phone/PIN for consumers
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  // Email/Password for retailer/wholesaler/admin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMethod, setForgotMethod] = useState<'email' | 'phone'>('email');
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  // Force Password Reset States
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPasswordUsed, setTempPasswordUsed] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const config = roleConfig[activeRole];

  // Dynamic Auth Method State (defaults to config preference, but can be toggled)
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>(config.authType);

  // Update credentials and auth method when role changes
  useEffect(() => {
    setAuthMethod(config.authType); // Reset method when role changes
    if (config.authType === 'phone') {
      setPhone(config.credentials.phone);
      setPin(config.credentials.pin);
    } else {
      setEmail(config.credentials.email);
      setPassword(config.credentials.password);
    }
  }, [activeRole, config.authType, config.credentials]);



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use authMethod state instead of config.authType
      const credentials = authMethod === 'phone'
        ? { phone_number: phone, pin }
        : { email, password };
      const res = await login(credentials, activeRole);
      
      if (res && res.require_password_reset) {
        setTempPasswordUsed(authMethod === 'phone' ? pin : password);
        setShowResetModal(true);
        message.warning('Temporary password matched! Please set a new password.');
        return;
      }

      message.success('Login successful!');
      navigate(config.redirect);
    } catch (error: any) {
      message.error(error.response?.data?.error || error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsSendingForgot(true);
    try {
      const rolePrefix = activeRole === 'consumer' ? 'store' : activeRole;
      const endpoint = `${API_URL}/${rolePrefix}/auth/forgot-password`;
      const res = await axios.post(endpoint, { 
        email: forgotEmail, 
        role: activeRole, 
        method: forgotMethod 
      });
      message.success(res.data.message || 'Temporary password has been sent.');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to send temporary password. Please verify your details.');
    } finally {
      setIsSendingForgot(false);
    }
  };

  const handleForceResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      message.error('Passwords do not match');
      return;
    }
    setIsResettingPassword(true);
    try {
      const token = localStorage.getItem('bigcompany_token');
      const endpoint = `${API_URL}/${activeRole}/auth/update-password`;
      await axios.put(
        endpoint,
        { old_password: tempPasswordUsed, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Password updated successfully! Welcome to your dashboard.');
      setShowResetModal(false);
      navigate(config.redirect);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };



  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-4 relative overflow-hidden`}>
      <FloatingParticles />

      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white bg-black/20 backdrop-blur-md px-4 py-2 rounded-full hover:bg-black/30 mb-6 transition-all w-fit"
        >
          <ArrowLeftIcon />
          <span className="font-bold text-sm">Back to Home</span>
        </button>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
          {/* Company Branding Top */}
          <div className="py-4 flex flex-col items-center bg-white border-b border-gray-100">
            <div className="relative h-16 w-full flex items-center justify-center overflow-hidden bg-white">
               <img src="/logo-big.png" alt="BIG" className="h-16 w-auto object-contain bg-white" />
            </div>
            <div className="mt-1 text-center bg-white w-full">
              <BrandedName size="md" />
            </div>
          </div>

          {/* Header */}
          <div className={`bg-gradient-to-r ${config.gradient} p-4 text-center text-white`}>
            <h1 className="text-lg font-bold">{config.title}</h1>
            <p className="text-white/80 text-xs">{config.subtitle}</p>
          </div>

          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {(['consumer', 'retailer', 'wholesaler'] as PublicUserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  setSearchParams({ role });
                }}
                className={`flex-1 py-3 text-xs font-bold transition-all relative ${activeRole === role
                  ? `${roleConfig[role].textColor}`
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {role.toUpperCase()}
                {activeRole === role && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${roleConfig[role].gradient}`} />
                )}
              </button>
            ))}
          </div>
          <div className="p-6">
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {authMethod === 'phone' ? (
                <>
                  {/* Phone Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserIcon />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="250788xxxxxx"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        required={authMethod === 'phone'}
                      />
                    </div>
                  </div>

                  {/* PIN Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockIcon />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter your 4-6 digit PIN"
                        maxLength={6}
                        className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        required={authMethod === 'phone'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserIcon />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@big.co.rw"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        required={authMethod === 'email'}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockIcon />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        required={authMethod === 'email'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Login Method Toggle Link */}
              {activeRole === 'consumer' && (
                <div className="text-center -mt-4">
                  <span className="text-gray-500 text-sm">Or </span>
                  <button
                    type="button"
                    onClick={() => setAuthMethod(authMethod === 'phone' ? 'email' : 'phone')}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline focus:outline-none"
                  >
                    {authMethod === 'phone' ? 'Login with Email & Password' : 'Login with Phone & PIN'}
                  </button>
                </div>
              )}

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    defaultChecked
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className={`${config.textColor} hover:underline focus:outline-none`}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full ${config.buttonColor} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in with {authMethod === 'phone' ? 'Phone' : 'Email'}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>

              {/* Registration Link for Consumers */}
              {activeRole === 'consumer' && (
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    First time using Big Innovation Group Ltd?{' '}
                    <a
                      href="/auth/register"
                      className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
                    >
                      Create Account
                    </a>
                  </p>
                </div>
              )}
            </form>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          © {new Date().getFullYear()} Big Innovation Group Ltd. All rights reserved.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-gray-900">Forgot Password?</h3>
              <button 
                onClick={() => setShowForgotModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Choose how you want to reset your password and enter your details to receive a temporary password.
            </p>
            
            {/* Reset Option Choice */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setForgotMethod('email');
                  setForgotEmail('');
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  forgotMethod === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotMethod('phone');
                  setForgotEmail('');
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  forgotMethod === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Phone Number
              </button>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {forgotMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={forgotMethod === 'email' ? 'email' : 'text'}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder={forgotMethod === 'email' ? 'yourname@bigcompany.rw' : '250788xxxxxx'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSendingForgot}
                className={`w-full ${config.buttonColor} text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2`}
              >
                {isSendingForgot ? 'Sending...' : 'Send Temporary Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Force Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in border border-gray-100">
            <h3 className="text-xl font-extrabold text-gray-900 mb-4 text-center">Change Password</h3>
            <p className="text-gray-600 text-sm mb-6 text-center">
              You are logging in with a temporary password. Please set a secure new password to continue.
            </p>
            <form onSubmit={handleForceResetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isResettingPassword}
                className={`w-full ${config.buttonColor} text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2`}
              >
                {isResettingPassword ? 'Updating...' : 'Update Password & Login'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
