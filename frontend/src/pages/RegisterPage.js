import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Lock, ChevronRight, ArrowLeft, 
  User, Building2, ShieldCheck, Mail
} from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState(null); // 'patient' or 'hospital'
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Form, 3: Verification (Hospital)
  const [loading, setLoading] = useState(false);
  
  // Patient Form State
  const [patientData, setPatientData] = useState({
    name: '',
    phone: '',
    password: ''
  });

  // Hospital Form State
  const [hospitalData, setHospitalData] = useState({
    hospitalName: '',
    location: '',
    adminName: '',
    email: '',
    password: ''
  });

  const [verificationCode, setVerificationCode] = useState('');

  const handlePatientRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/register/patient', patientData);
      toast.success('Registration successful! Please login.');
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/register/hospital', hospitalData);
      toast.success('Verification code sent to your email');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyHospital = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/verify-hospital', {
        email: hospitalData.email,
        code: verificationCode
      });
      toast.success('Account verified! You can now log in.');
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
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
          <h1 className="font-display text-3xl font-bold text-neutral-900">Create Account</h1>
          <p className="text-neutral-500">Join the HealthQueue network</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid gap-4"
            >
              <p className="text-center text-sm font-medium text-neutral-600 mb-2">Choose your account type</p>
              
              <button 
                onClick={() => { setRole('patient'); setStep(2); }}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-neutral-100 hover:border-primary-500 hover:bg-primary-50 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">Patient</h3>
                  <p className="text-xs text-neutral-500">Book appointments and track your queue</p>
                </div>
              </button>

              <button 
                onClick={() => { setRole('hospital'); setStep(2); }}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-neutral-100 hover:border-medical-teal hover:bg-emerald-50 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-medical-teal group-hover:bg-medical-teal group-hover:text-white transition-colors">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">Hospital / Clinic</h3>
                  <p className="text-xs text-neutral-500">Manage queues and patient flow</p>
                </div>
              </button>
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-neutral-500 hover:text-primary-600 flex items-center gap-1 -mt-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Change account type
              </button>

              {role === 'patient' ? (
                <form onSubmit={handlePatientRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="input pl-12 h-12"
                        value={patientData.name}
                        onChange={(e) => setPatientData({...patientData, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="tel"
                        placeholder="0911223344"
                        className="input pl-12 h-12"
                        value={patientData.phone}
                        onChange={(e) => setPatientData({...patientData, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="input pl-12 h-12"
                        value={patientData.password}
                        onChange={(e) => setPatientData({...patientData, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full h-12 mt-4"
                  >
                    {loading ? <div className="spinner w-5 h-5 border-white/30 border-t-white" /> : 'Register Patient'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleHospitalRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Hospital Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Addis General Hospital"
                        className="input pl-12 h-12"
                        value={hospitalData.hospitalName}
                        onChange={(e) => setHospitalData({...hospitalData, hospitalName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Location</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Addis Ababa, Bole"
                        className="input pl-12 h-12"
                        value={hospitalData.location}
                        onChange={(e) => setHospitalData({...hospitalData, location: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <hr className="my-4 border-neutral-100" />
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider text-center">Admin Details</p>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Admin Name"
                        className="input pl-12 h-12"
                        value={hospitalData.adminName}
                        onChange={(e) => setHospitalData({...hospitalData, adminName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="email"
                        placeholder="admin@hospital.com"
                        className="input pl-12 h-12"
                        value={hospitalData.email}
                        onChange={(e) => setHospitalData({...hospitalData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="input pl-12 h-12"
                        value={hospitalData.password}
                        onChange={(e) => setHospitalData({...hospitalData, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full h-12 mt-4 bg-medical-teal hover:bg-emerald-600 border-none"
                  >
                    {loading ? <div className="spinner w-5 h-5 border-white/30 border-t-white" /> : 'Register Hospital'}
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <p className="text-sm text-neutral-600">Enter the 6-digit code sent to <span className="font-bold">{hospitalData.email}</span></p>
              </div>

              <form onSubmit={handleVerifyHospital} className="space-y-6">
                <input
                  type="text"
                  placeholder="000000"
                  className="input h-16 text-center text-3xl tracking-widest font-mono"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full h-14 text-lg"
                >
                  {loading ? <div className="spinner w-6 h-6 border-white/30 border-t-white" /> : 'Verify & Complete'}
                </button>

                <p className="text-center text-sm text-neutral-500">
                  Didn't receive the code? 
                  <button type="button" onClick={() => setStep(2)} className="text-primary-600 font-bold ml-1 hover:underline">Go back</button>
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 text-center border-t border-neutral-100">
          <p className="text-sm text-neutral-500">
            Already have an account? 
            <a href="/login" className="text-primary-600 font-semibold ml-1 hover:underline">Sign In</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
