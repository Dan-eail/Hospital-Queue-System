import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Calendar, Clock, MapPin, 
  ChevronRight, Search, Activity, LogOut,
  Clock3, CheckCircle2, XCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function PatientDashboard() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);

  // Persistence for demo
  useEffect(() => {
    const savedPhone = localStorage.getItem('patientPhone');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      handleLogin(null, savedPhone);
    }
  }, []);

  const handleLogin = async (e, forcedPhone) => {
    if (e) e.preventDefault();
    const phone = forcedPhone || phoneNumber;
    
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(`/api/appointments?patient_phone=${phone}`);
      setAppointments(data.data);
      if (data.data.length > 0) {
        setPatientInfo({
          name: data.data[0].patient_name,
          phone: data.data[0].patient_phone
        });
        setIsLoggedIn(true);
        localStorage.setItem('patientPhone', phone);
        toast.success(`Welcome back, ${data.data[0].patient_name}!`);
      } else {
        toast.error('No appointments found for this number');
      }
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPhoneNumber('');
    setAppointments([]);
    setPatientInfo(null);
    localStorage.removeItem('patientPhone');
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'text-blue-600 bg-blue-50 border-blue-100',
      checked_in: 'text-amber-600 bg-amber-50 border-amber-100',
      in_progress: 'text-purple-600 bg-purple-50 border-purple-100',
      completed: 'text-green-600 bg-green-50 border-green-100',
      cancelled: 'text-red-600 bg-red-50 border-red-100',
      no_show: 'text-gray-600 bg-gray-50 border-gray-100'
    };
    return colors[status] || colors.scheduled;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock3 className="w-4 h-4" />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-medical-teal rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-primary-200">
            <User className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-neutral-900">Patient Portal</h1>
            <p className="text-neutral-500">Access your medical queue and history</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="input pl-12 h-14 text-lg"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full h-14 text-lg group"
            >
              {loading ? (
                <div className="spinner w-6 h-6 border-white/30 border-t-white" />
              ) : (
                <span className="flex items-center justify-center">
                  Continue to Portal
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <p className="text-sm text-neutral-400">
            Forgot which number you used? Check your appointment SMS confirmation.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center border border-neutral-200">
            <User className="w-8 h-8 text-neutral-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900">
              Hello, {patientInfo?.name}
            </h1>
            <p className="text-neutral-500 flex items-center gap-2">
              <Phone className="w-4 h-4" /> {patientInfo?.phone}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="btn-secondary text-red-600 hover:bg-red-50 border-red-100"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 bg-gradient-to-br from-primary-600 to-medical-teal text-white border-none shadow-xl shadow-primary-100">
            <p className="text-primary-100 text-sm font-medium mb-1">Active Appointments</p>
            <div className="flex items-end justify-between">
              <h2 className="text-4xl font-bold">
                {appointments.filter(a => ['scheduled', 'checked_in', 'in_progress'].includes(a.status)).length}
              </h2>
              <Activity className="w-12 h-12 opacity-20" />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-neutral-900">Need another visit?</h3>
            <p className="text-sm text-neutral-500">Book your next consultation in minutes.</p>
            <button 
              onClick={() => window.location.href = '/book'}
              className="btn-primary w-full"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book New Appointment
            </button>
          </div>

          <div className="card p-6 space-y-4 bg-neutral-900 text-white border-none">
            <h3 className="font-semibold">Health Tip</h3>
            <p className="text-sm text-neutral-400">
              Remember to arrive at least 15 minutes before your scheduled appointment time for check-in.
            </p>
          </div>
        </div>

        {/* Right Column: Appointment List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-neutral-900">Your Appointments</h2>
            <div className="flex gap-2">
              <span className="badge bg-neutral-100 text-neutral-600 border-neutral-200">
                All Time: {appointments.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="card p-12 text-center text-neutral-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                No appointments found.
              </div>
            ) : (
              appointments.map((apt) => (
                <motion.div
                  key={apt.id}
                  layout
                  className="card p-6 hover:border-primary-200 transition-all group"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">
                          {format(new Date(apt.appointment_date), 'MMM')}
                        </span>
                        <span className="text-lg font-bold text-neutral-900 leading-none">
                          {format(new Date(apt.appointment_date), 'd')}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">
                            {apt.department_name}
                          </h3>
                          <span className={`badge flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase font-bold border ${getStatusColor(apt.status)}`}>
                            {getStatusIcon(apt.status)}
                            {apt.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          {apt.hospital_name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {apt.appointment_time}
                          </span>
                          <span className="font-mono font-bold text-primary-500">
                            #{apt.appointment_number}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      {['scheduled', 'checked_in', 'in_progress'].includes(apt.status) ? (
                        <button 
                          onClick={() => window.location.href = `/queue?num=${apt.appointment_number}`}
                          className="btn-secondary w-full md:w-auto"
                        >
                          Track Position
                          <ChevronRight className="ml-1 w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">
                          Session {apt.status}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
