import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Clock, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('week');

  // Mock data - in production, fetch from API
  const stats = {
    totalAppointments: 12847,
    avgWaitTime: 23,
    noShowRate: 8.2,
    patientSatisfaction: 94,
    trends: {
      appointments: +12.5,
      waitTime: -45.3,
      noShows: -32.1,
      satisfaction: +8.7
    }
  };

  const topHospitals = [
    { name: 'Tikur Anbessa Hospital', appointments: 4532, waitTime: 28 },
    { name: "St. Paul's Hospital", appointments: 3891, waitTime: 21 },
    { name: 'Zewditu Memorial Hospital', appointments: 2456, waitTime: 19 },
    { name: 'Alert Hospital', appointments: 1968, waitTime: 25 }
  ];

  const busyHours = [
    { hour: '8 AM', count: 145 },
    { hour: '9 AM', count: 287 },
    { hour: '10 AM', count: 423 },
    { hour: '11 AM', count: 512 },
    { hour: '12 PM', count: 389 },
    { hour: '1 PM', count: 298 },
    { hour: '2 PM', count: 456 },
    { hour: '3 PM', count: 512 },
    { hour: '4 PM', count: 387 }
  ];

  const maxCount = Math.max(...busyHours.map(h => h.count));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">
            Analytics Dashboard
          </h1>
          <p className="text-neutral-600 mt-1">System-wide insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-600" />
            <span className={`text-sm font-medium ${stats.trends.appointments > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.trends.appointments > 0 ? '↑' : '↓'} {Math.abs(stats.trends.appointments)}%
            </span>
          </div>
          <p className="text-sm text-neutral-600">Total Appointments</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">
            {stats.totalAppointments.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              ↓ {Math.abs(stats.trends.waitTime)}%
            </span>
          </div>
          <p className="text-sm text-neutral-600">Avg Wait Time</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">
            {stats.avgWaitTime} min
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-green-600">
              ↓ {Math.abs(stats.trends.noShows)}%
            </span>
          </div>
          <p className="text-sm text-neutral-600">No-Show Rate</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">
            {stats.noShowRate}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-green-600">
              ↑ {Math.abs(stats.trends.satisfaction)}%
            </span>
          </div>
          <p className="text-sm text-neutral-600">Satisfaction</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">
            {stats.patientSatisfaction}%
          </p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Peak Hours Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-neutral-900 flex items-center">
              <BarChart3 className="w-5 h-5 text-primary-600 mr-2" />
              Peak Hours
            </h3>
          </div>
          <div className="space-y-3">
            {busyHours.map((item) => (
              <div key={item.hour}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-neutral-600">{item.hour}</span>
                  <span className="font-medium text-neutral-900">{item.count}</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-medical-teal rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / maxCount) * 100}%` }}
                    transition={{ duration: 1, delay: 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Hospitals */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-neutral-900 flex items-center">
              <Calendar className="w-5 h-5 text-primary-600 mr-2" />
              Top Hospitals
            </h3>
          </div>
          <div className="space-y-4">
            {topHospitals.map((hospital, index) => (
              <motion.div
                key={hospital.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{hospital.name}</p>
                    <p className="text-sm text-neutral-600">
                      {hospital.appointments.toLocaleString()} appointments
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-600">Avg Wait</p>
                  <p className="font-semibold text-neutral-900">{hospital.waitTime}m</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="card p-8 bg-gradient-to-br from-primary-500 to-medical-teal text-white">
        <h2 className="font-display text-2xl font-bold mb-4">System Impact</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <p className="text-primary-100 text-sm mb-2">Time Saved</p>
            <p className="text-4xl font-bold">847 hrs</p>
            <p className="text-primary-100 text-sm mt-2">This month</p>
          </div>
          <div>
            <p className="text-primary-100 text-sm mb-2">Patients Served</p>
            <p className="text-4xl font-bold">12.8K</p>
            <p className="text-primary-100 text-sm mt-2">Across all hospitals</p>
          </div>
          <div>
            <p className="text-primary-100 text-sm mb-2">Cost Reduction</p>
            <p className="text-4xl font-bold">₦2.4M</p>
            <p className="text-primary-100 text-sm mt-2">Operational savings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
