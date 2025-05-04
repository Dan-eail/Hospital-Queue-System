import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { Users, Clock, CheckCircle, XCircle, Activity, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function ReceptionDashboard() {
  const [selectedHospital, setSelectedHospital] = useState('1');
  const [selectedDepartment, setSelectedDepartment] = useState('1');
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchHospitals();
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      fetchDepartments(selectedHospital);
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (selectedHospital && selectedDepartment) {
      fetchQueue();
    }
  }, [selectedHospital, selectedDepartment]);

  useEffect(() => {
    if (socket && selectedHospital && selectedDepartment) {
      socket.emit('join-room', {
        hospitalId: selectedHospital,
        departmentId: selectedDepartment
      });

      socket.on('queue-update', () => {
        fetchQueue();
      });

      socket.on('new-appointment', () => {
        toast.success('New appointment added to queue');
        fetchQueue();
      });
    }
  }, [socket, selectedHospital, selectedDepartment]);

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

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/queue/${selectedHospital}/${selectedDepartment}`);
      setQueue(data.data.queue);
      setStats(data.data.statistics);
    } catch (error) {
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appointmentNumber, status) => {
    try {
      await axios.put(`/api/appointments/${appointmentNumber}/status`, { status });
      toast.success(`Appointment ${status.replace('_', ' ')}`);
      fetchQueue();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'badge-scheduled',
      checked_in: 'badge-checked-in',
      in_progress: 'badge-in-progress',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled'
    };
    return badges[status] || 'badge-scheduled';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">
            Reception Dashboard
          </h1>
          <p className="text-neutral-600 mt-1">Manage today's appointments and queue</p>
        </div>
        <button onClick={fetchQueue} className="btn-primary">
          <RefreshCw className="w-4 h-4 mr-2 inline" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Hospital
            </label>
            <select
              className="input"
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Department
            </label>
            <select
              className="input"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">In Queue</p>
                <p className="text-3xl font-bold text-neutral-900 mt-1">
                  {stats.total_in_queue || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Checked In</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {stats.checked_in_count || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">In Progress</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {stats.in_progress_count || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Avg Wait</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {Math.round(stats.avg_wait_time || 0)}m
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Queue Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-neutral-50">
          <h2 className="font-semibold text-neutral-900">Current Queue</h2>
          <p className="text-sm text-neutral-600 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="spinner mx-auto"></div>
            <p className="text-neutral-600 mt-4">Loading queue...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600">No patients in queue</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Appointment #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Wait
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {queue.map((apt) => (
                  <tr key={apt.appointment_number} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                        #{apt.current_position}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-neutral-900">
                        {apt.appointment_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-neutral-900">{apt.patient_name}</p>
                        <p className="text-sm text-neutral-500">{apt.patient_phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {apt.appointment_time}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getStatusBadge(apt.status)}`}>
                        {apt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {apt.estimated_wait_minutes || 0} min
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {apt.status === 'scheduled' && (
                          <button
                            onClick={() => updateStatus(apt.appointment_number, 'checked_in')}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        {apt.status === 'checked_in' && (
                          <button
                            onClick={() => updateStatus(apt.appointment_number, 'in_progress')}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {apt.status === 'in_progress' && (
                          <button
                            onClick={() => updateStatus(apt.appointment_number, 'completed')}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates enabled</span>
      </div>
    </div>
  );
}
