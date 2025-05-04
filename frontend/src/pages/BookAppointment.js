import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Stethoscope, Calendar as CalendarIcon, Clock, 
  CheckCircle, ArrowRight, ArrowLeft, User, Phone, FileText 
} from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    hospitalId: '',
    departmentId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reasonForVisit: ''
  });

  // Data from API
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Fetch hospitals on mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data } = await axios.get('/api/hospitals');
      setHospitals(data.data);
    } catch (error) {
      toast.error('Failed to load hospitals');
    }
  };

  const fetchDepartments = async (hospitalId) => {
    try {
      const { data } = await axios.get(`/api/departments?hospital_id=${hospitalId}`);
      setDepartments(data.data);
    } catch (error) {
      toast.error('Failed to load departments');
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const { data } = await axios.get('/api/appointments/available-slots/search', {
        params: {
          hospital_id: formData.hospitalId,
          department_id: formData.departmentId,
          date: formData.appointmentDate
        }
      });
      setAvailableSlots(data.data);
    } catch (error) {
      toast.error('Failed to load available slots');
    }
  };

  const handleHospitalSelect = (hospital) => {
    setFormData({ ...formData, hospitalId: hospital.id, departmentId: '', appointmentDate: '', appointmentTime: '' });
    setSelectedHospital(hospital);
    fetchDepartments(hospital.id);
    setStep(2);
  };

  const handleDepartmentSelect = (department) => {
    setFormData({ ...formData, departmentId: department.id, appointmentDate: '', appointmentTime: '' });
    setSelectedDepartment(department);
    setStep(3);
  };

  const handleDateSelect = (date) => {
    setFormData({ ...formData, appointmentDate: date, appointmentTime: '' });
    setStep(4);
  };

  const handleTimeSelect = (time) => {
    setFormData({ ...formData, appointmentTime: time });
    setStep(5);
  };

  useEffect(() => {
    if (formData.appointmentDate && formData.departmentId && formData.hospitalId) {
      fetchAvailableSlots();
    }
  }, [formData.appointmentDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post('/api/appointments', {
        patient_name: formData.patientName,
        patient_phone: formData.patientPhone,
        hospital_id: formData.hospitalId,
        department_id: formData.departmentId,
        appointment_date: formData.appointmentDate,
        appointment_time: formData.appointmentTime,
        reason_for_visit: formData.reasonForVisit,
        booking_method: 'web'
      });

      toast.success('Appointment booked successfully!');
      setStep(6);
      
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to book appointment';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const generateDates = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  const progressPercentage = (step / 6) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-neutral-600 mb-3">
          <span>Step {step} of 6</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-medical-teal"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Hospital */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-medical-teal mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-neutral-900">
                Select Hospital
              </h2>
              <p className="text-neutral-600">Choose your preferred hospital</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {hospitals.map((hospital) => (
                <button
                  key={hospital.id}
                  onClick={() => handleHospitalSelect(hospital)}
                  className="card-hover p-6 text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-neutral-900 group-hover:text-primary-600 transition-colors">
                        {hospital.name}
                      </h3>
                      <p className="text-sm text-neutral-600 mt-1">{hospital.location}</p>
                      <p className="text-sm text-neutral-500 mt-2">📞 {hospital.phone}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Department */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-neutral-900">
                Select Department
              </h2>
              <p className="text-neutral-600">At {selectedHospital?.name}</p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="btn-secondary text-sm"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Change Hospital
            </button>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => handleDepartmentSelect(dept)}
                  className="card-hover p-6 text-center group"
                >
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-2">
                    ~{dept.avg_consultation_time} min avg
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Date */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-neutral-900">
                Select Date
              </h2>
              <p className="text-neutral-600">
                {selectedDepartment?.name} at {selectedHospital?.name}
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn-secondary text-sm"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Change Department
            </button>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generateDates().map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateSelect(dateStr)}
                    className="card-hover p-6 text-center group"
                  >
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-primary-600">
                      {format(date, 'EEE')}
                    </p>
                    <p className="text-2xl font-bold text-neutral-900 my-2">
                      {format(date, 'd')}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {format(date, 'MMM yyyy')}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 4: Select Time */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-neutral-900">
                Select Time
              </h2>
              <p className="text-neutral-600">
                {format(new Date(formData.appointmentDate), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>

            <button
              onClick={() => setStep(3)}
              className="btn-secondary text-sm"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Change Date
            </button>

            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleTimeSelect(slot.time)}
                    className="card-hover p-4 text-center font-mono font-semibold text-neutral-900 hover:text-primary-600"
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <p className="text-neutral-600">Loading available slots...</p>
                <div className="spinner mx-auto mt-4"></div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 5: Patient Details */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-neutral-900">
                Your Details
              </h2>
              <p className="text-neutral-600">Almost done! Just a few more details</p>
            </div>

            <button
              onClick={() => setStep(4)}
              className="btn-secondary text-sm"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Change Time
            </button>

            <form onSubmit={handleSubmit} className="card p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="John Doe"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  className="input"
                  placeholder="+251 91 234 5678"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                />
                <p className="text-xs text-neutral-500 mt-2">
                  We'll send appointment confirmation & reminders to this number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Reason for Visit (Optional)
                </label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="Brief description of your health concern..."
                  value={formData.reasonForVisit}
                  onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                />
              </div>

              {/* Summary */}
              <div className="bg-neutral-50 rounded-xl p-6 space-y-3">
                <h3 className="font-semibold text-neutral-900">Appointment Summary</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-neutral-600">Hospital:</span> <span className="font-medium">{selectedHospital?.name}</span></p>
                  <p><span className="text-neutral-600">Department:</span> <span className="font-medium">{selectedDepartment?.name}</span></p>
                  <p><span className="text-neutral-600">Date:</span> <span className="font-medium">{format(new Date(formData.appointmentDate), 'EEEE, MMMM d, yyyy')}</span></p>
                  <p><span className="text-neutral-600">Time:</span> <span className="font-medium">{formData.appointmentTime}</span></p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner w-5 h-5 mr-3"></div>
                    Booking...
                  </span>
                ) : (
                  <span>
                    Confirm Booking
                    <CheckCircle className="inline-block ml-2 w-5 h-5" />
                  </span>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 6: Success */}
        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-12"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-4xl font-bold text-neutral-900">
                Appointment Booked!
              </h2>
              <p className="text-xl text-neutral-600">
                Your appointment has been confirmed
              </p>
            </div>

            <div className="card p-8 max-w-md mx-auto space-y-4 text-left">
              <h3 className="font-semibold text-center text-neutral-900">Appointment Details</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-neutral-600">Hospital:</span> <span className="font-medium">{selectedHospital?.name}</span></p>
                <p><span className="text-neutral-600">Department:</span> <span className="font-medium">{selectedDepartment?.name}</span></p>
                <p><span className="text-neutral-600">Date & Time:</span> <span className="font-medium">{format(new Date(formData.appointmentDate), 'MMM d, yyyy')} at {formData.appointmentTime}</span></p>
              </div>
            </div>

            <p className="text-neutral-600">
              📱 SMS confirmation sent to {formData.patientPhone}
            </p>

            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary"
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
