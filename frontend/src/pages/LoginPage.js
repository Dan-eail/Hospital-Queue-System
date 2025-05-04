import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Lock, ChevronRight, ArrowLeft, 
  User, Building2, ShieldCheck, Mail
} from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState('patient'); // 'patient' or 'staff'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', {
        identifier,
        password,
        type: role
      });

      // Save token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Notify App navbar to re-read user
      window.dispatchEvent(new Event('auth-change'));
      if (onLogin) onLogin();

      toast.success(`Welcome back, ${data.user.name}!`);

      // Redirect based on type
      if (data.user.type === 'staff') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/patient';
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-medical-teal rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-100">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Welcome Back</h1>
          <p className="text-neutral-500">Sign in to your account</p>
        </div>

        {/* Role Switcher */}
        <div className="flex p-1 bg-neutral-100 rounded-xl">
          <button
            onClick={() => setRole('patient')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              role === 'patient' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <User className="w-4 h-4" />
            Patient
          </button>
          <button
            onClick={() => setRole('staff')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              role === 'staff' 
                ? 'bg-white text-medical-teal shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Hospital
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 ml-1">
              {role === 'patient' ? 'Phone Number' : 'Email or Phone'}
            </label>
            <div className="relative">
              {role === 'patient' ? (
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              ) : (
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              )}
              <input
                type={role === 'patient' ? 'tel' : 'text'}
                placeholder={role === 'patient' ? '0911223344' : 'admin@hospital.com'}
                className="input pl-12 h-14"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                placeholder="••••••••"
                className="input pl-12 h-14"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`btn-primary w-full h-14 text-lg group ${role === 'staff' ? 'bg-medical-teal hover:bg-emerald-600 border-none' : ''}`}
          >
            {loading ? (
              <div className="spinner w-6 h-6 border-white/30 border-t-white" />
            ) : (
              <span className="flex items-center justify-center">
                Sign In
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        <div className="pt-4 text-center">
          <p className="text-sm text-neutral-500">
            Don't have an account? 
            <a href="/register" className="text-primary-600 font-semibold ml-1 hover:underline">Create an account</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
