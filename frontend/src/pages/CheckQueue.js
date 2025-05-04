import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Search, Clock, Users, TrendingUp, MapPin, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function CheckQueue() {
  const [appointmentNumber, setAppointmentNumber] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && appointment) {
      // Join room for this appointment
      socket.emit('track-appointment', {
        appointmentNumber: appointment.appointment_number
      });

      // Listen for position updates
      socket.on('position-update', (data) => {
        setAppointment(prev => ({
          ...prev,
          current_position: data.position,
          estimated_wait_minutes: data.estimatedWait
        }));
        toast.success(`Queue updated! Position: ${data.position}`);
      });

      socket.on('status-changed', (data) => {
        toast.success(data.message);
        checkQueue(); // Refresh data
      });
    }
  }, [socket, appointment]);

  const checkQueue = async () => {
    if (!appointmentNumber) {
      toast.error('Please enter an appointment number');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(`/api/appointments/${appointmentNumber.toUpperCase()}`);
      setAppointment(data.data);
      toast.success('Appointment found!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Appointment not found');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'text-blue-600 bg-blue-50 border-blue-200',
      checked_in: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      in_progress: 'text-purple-600 bg-purple-50 border-purple-200',
      completed: 'text-green-600 bg-green-50 border-green-200',
      cancelled: 'text-red-600 bg-red-50 border-red-200',
      no_show: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[status] || colors.scheduled;
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-medical-teal mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display text-4xl font-bold text-neutral-900">
          Check Queue Position
        </h1>
        <p className="text-lg text-neutral-600">
          Track your appointment in real-time
        </p>
      </div>

      {/* Search Box */}
      <div className="card p-8">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-neutral-700">
            Enter Your Appointment Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              className="input flex-1 uppercase font-mono"
              placeholder="A123456"
              value={appointmentNumber}
              onChange={(e) => setAppointmentNumber(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && checkQueue()}
            />
            <button
              onClick={checkQueue}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <div className="spinner w-5 h-5"></div>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2 inline" />
                  Check Status
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-neutral-500">
            💡 Find your appointment number in the confirmation SMS
          </p>
        </div>
      </div>

      {/* Appointment Details */}
      {appointment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Banner */}
          <div className={`card p-6 border-2 ${getStatusColor(appointment.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Appointment Status</p>
                <p className="text-2xl font-bold">{getStatusText(appointment.status)}</p>
              </div>
              <div className={`w-16 h-16 rounded-full ${getStatusColor(appointment.status)} flex items-center justify-center`}>
                {appointment.status === 'completed' ? '✓' : '⏱️'}
              </div>
            </div>
          </div>

          {/* Queue Position (if active) */}
          {appointment.current_position && (appointment.status === 'scheduled' || appointment.status === 'checked_in') && (
            <div className="card p-8 bg-gradient-to-br from-primary-50 to-medical-teal/10">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg queue-pulse">
                  <span className="text-4xl font-bold text-primary-600">
                    #{appointment.current_position}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Your Queue Position</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {appointment.current_position === 1 ? "You're Next!" : `${appointment.current_position - 1} people ahead`}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600">Estimated Wait</p>
                    <p className="text-xl font-bold text-neutral-900">
                      {appointment.estimated_wait_minutes || 0} min
                    </p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600">Queue Speed</p>
                    <p className="text-xl font-bold text-neutral-900">Fast</p>
                  </div>
                </div>

                {appointment.current_position <= 3 && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4">
                    <p className="text-yellow-800 font-medium">
                      ⚡ Your turn is coming soon! Please arrive at the hospital now.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appointment Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-neutral-900 flex items-center">
                <MapPin className="w-5 h-5 text-primary-600 mr-2" />
                Location
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-neutral-600">Hospital:</span> <span className="font-medium">{appointment.hospital_name}</span></p>
                <p><span className="text-neutral-600">Department:</span> <span className="font-medium">{appointment.department_name}</span></p>
                {appointment.doctor_name && (
                  <p><span className="text-neutral-600">Doctor:</span> <span className="font-medium">{appointment.doctor_name}</span></p>
                )}
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-neutral-900 flex items-center">
                <Calendar className="w-5 h-5 text-primary-600 mr-2" />
                Schedule
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-neutral-600">Date:</span> <span className="font-medium">{format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}</span></p>
                <p><span className="text-neutral-600">Time:</span> <span className="font-medium">{appointment.appointment_time}</span></p>
                <p><span className="text-neutral-600">Booked via:</span> <span className="font-medium capitalize">{appointment.booking_method}</span></p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-neutral-900 flex items-center">
              <Phone className="w-5 h-5 text-primary-600 mr-2" />
              Patient Information
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-neutral-600">Name:</span> <span className="font-medium">{appointment.patient_name}</span></p>
              <p><span className="text-neutral-600">Phone:</span> <span className="font-medium">{appointment.patient_phone}</span></p>
              <p><span className="text-neutral-600">Appointment #:</span> <span className="font-mono font-bold text-primary-600">{appointment.appointment_number}</span></p>
            </div>
          </div>

          {/* Real-time Updates Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live updates enabled</span>
          </div>
        </motion.div>
      )}

      {/* Help Text */}
      {!appointment && (
        <div className="card p-8 bg-neutral-50 text-center">
          <p className="text-neutral-600">
            Enter your appointment number above to see your current queue position and estimated wait time.
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Updates automatically in real-time ⚡
          </p>
        </div>
      )}
    </div>
  );
}
