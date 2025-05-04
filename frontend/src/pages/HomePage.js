import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Calendar, Clock, Users, ShieldCheck, ArrowRight,
  CheckCircle, Phone, Activity, Zap, MapPin, Star,
  TrendingDown, Bell, Smartphone, BarChart3, ChevronDown
} from 'lucide-react';

// Animated counter hook
function useCounter(end, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, color, start }) {
  const count = useCounter(value, 2000, start);
  return (
    <div className="text-center">
      <div className={`text-4xl md:text-5xl font-display font-bold ${color}`}>
        {count}{suffix}
      </div>
      <p className="text-neutral-500 mt-2 text-sm font-medium">{label}</p>
    </div>
  );
}

const features = [
  {
    icon: Calendar,
    title: 'Instant Booking',
    desc: 'Book via web, USSD *711#, or SMS. No internet? No problem.',
    color: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50'
  },
  {
    icon: Activity,
    title: 'Real-Time Queue',
    desc: 'Watch your queue position update live — know exactly when it\'s your turn.',
    color: 'from-purple-500 to-pink-400',
    bg: 'bg-purple-50'
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    desc: 'Automated SMS reminders cut no-shows by 40% and keep your day on track.',
    color: 'from-amber-500 to-orange-400',
    bg: 'bg-amber-50'
  },
  {
    icon: BarChart3,
    title: 'Hospital Analytics',
    desc: 'Staff get powerful dashboards to manage patient flow and optimize throughput.',
    color: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50'
  },
  {
    icon: Smartphone,
    title: 'Works on Any Phone',
    desc: 'From smartphones to basic feature phones — every Ethiopian can access care.',
    color: 'from-rose-500 to-red-400',
    bg: 'bg-rose-50'
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    desc: 'Your medical information is encrypted and protected at every step.',
    color: 'from-indigo-500 to-blue-400',
    bg: 'bg-indigo-50'
  }
];

const hospitals = [
  { name: 'Tikur Anbessa', loc: 'Addis Ababa, Lideta', wait: '18 min avg' },
  { name: 'St. Paul\'s HMMC', loc: 'Addis Ababa, Gulele', wait: '22 min avg' },
  { name: 'Zewditu Memorial', loc: 'Addis Ababa, Arada', wait: '15 min avg' },
  { name: 'Alert Hospital', loc: 'Addis Ababa, Kirkos', wait: '25 min avg' },
];

const steps = [
  { num: '01', title: 'Choose Hospital', desc: 'Select from top hospitals across Addis Ababa.' },
  { num: '02', title: 'Pick Department', desc: 'Find the right specialist for your needs.' },
  { num: '03', title: 'Book Your Slot', desc: 'Get an appointment number instantly via SMS.' },
  { num: '04', title: 'Track & Arrive', desc: 'Monitor queue live and arrive at the right time.' },
];

export default function HomePage() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' });

  return (
    <div className="space-y-0 -mt-8">

      {/* ===================== HERO ===================== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden py-20">
        {/* Gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-medical-teal/15 rounded-full blur-3xl" />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-medical-mint/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Zap className="w-4 h-4 fill-primary-500" />
                Ethiopia's #1 Hospital Queue System
              </div>

              <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-bold leading-[1.1]">
                <span className="text-neutral-900">Skip the</span>
                <br />
                <span className="text-gradient">4-Hour Line.</span>
                <br />
                <span className="text-neutral-900">Save Your Day.</span>
              </h1>

              <p className="text-xl text-neutral-600 max-w-lg leading-relaxed">
                Book appointments at top Addis Ababa hospitals, track your queue in real-time, and arrive only when it's your turn.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login" className="btn-primary h-14 px-8 text-lg group flex items-center justify-center">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/book" className="btn-outline h-14 px-8 text-lg flex items-center justify-center">
                  Book Appointment
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-3">
                  {['bg-primary-400', 'bg-medical-teal', 'bg-medical-mint', 'bg-purple-400'].map((c, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                      {['H', 'A', 'D', 'S'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">Trusted by <strong className="text-neutral-800">12,000+</strong> patients</p>
                </div>
              </div>
            </motion.div>

            {/* Right: Live Queue Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="card p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Live Queue</p>
                      <h3 className="font-display text-lg font-bold text-neutral-900 mt-0.5">Tikur Anbessa · Cardiology</h3>
                    </div>
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-600 text-xs font-bold px-3 py-1 rounded-full border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { num: '#A661234', name: 'Hana Tadesse', status: 'In Progress', color: 'bg-purple-100 text-purple-700', pos: 'Now' },
                      { num: '#A442871', name: 'Samuel Girma', status: 'Checked In', color: 'bg-amber-100 text-amber-700', pos: '~8 min' },
                      { num: '#A783452', name: 'Marta Alemayehu', status: 'Scheduled', color: 'bg-blue-100 text-blue-700', pos: '~23 min' },
                    ].map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center font-bold text-neutral-600 text-sm">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-neutral-900">{p.name}</p>
                            <p className="text-xs font-mono text-neutral-400">{p.num}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${p.color}`}>{p.status}</span>
                          <p className="text-xs text-neutral-400 mt-0.5">{p.pos}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {[
                      { label: 'In Queue', val: '12', icon: Users },
                      { label: 'Avg Wait', val: '18m', icon: Clock },
                      { label: 'Done Today', val: '43', icon: CheckCircle },
                    ].map((s) => (
                      <div key={s.label} className="bg-neutral-50 rounded-xl p-3 text-center border border-neutral-100">
                        <s.icon className="w-4 h-4 text-primary-500 mx-auto mb-1" />
                        <p className="font-bold text-neutral-900 text-lg">{s.val}</p>
                        <p className="text-neutral-400 text-[10px] uppercase font-semibold">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute -top-5 -right-6 card px-4 py-3 shadow-xl flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-medical-teal flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Dial *711#</p>
                    <p className="text-[10px] text-neutral-400">Book offline</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [4, -4, 4] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="absolute -bottom-5 -left-6 card px-4 py-3 shadow-xl flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Appointment Confirmed</p>
                    <p className="text-[10px] text-neutral-400">SMS sent to your phone</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex justify-center mt-16"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center gap-1 text-neutral-400"
            >
              <span className="text-xs font-medium">Scroll to explore</span>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section ref={statsRef} className="py-20 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
          >
            <StatCard value={12000} suffix="+" label="Patients Served" color="text-primary-400" start={statsInView} />
            <StatCard value={60} suffix="%" label="Reduction in Wait Time" color="text-medical-teal" start={statsInView} />
            <StatCard value={4} suffix="" label="Hospitals Connected" color="text-medical-mint" start={statsInView} />
            <StatCard value={94} suffix="%" label="Patient Satisfaction" color="text-amber-400" start={statsInView} />
          </motion.div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <span className="text-primary-600 text-sm font-bold uppercase tracking-widest">Simple Process</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-neutral-900">How HealthQueue Works</h2>
            <p className="text-xl text-neutral-500 max-w-2xl mx-auto">
              From booking to consultation in 4 easy steps
            </p>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, i) => (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center text-center space-y-4"
                >
                  <div className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-medical-teal flex flex-col items-center justify-center shadow-lg shadow-primary-200">
                    <span className="text-primary-100 text-xs font-bold uppercase tracking-wider">{s.num}</span>
                    <span className="text-white font-display font-bold text-lg leading-tight mt-1">{s.title.split(' ')[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-neutral-900">{s.title}</h3>
                    <p className="text-neutral-500 text-sm mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <span className="text-primary-600 text-sm font-bold uppercase tracking-widest">Powerful Features</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-neutral-900">Everything You Need</h2>
            <p className="text-xl text-neutral-500 max-w-2xl mx-auto">
              Built for Ethiopia's healthcare system — accessible, fast, and reliable
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-hover p-8 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-bold text-neutral-900 mb-2">{f.title}</h3>
                <p className="text-neutral-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOSPITALS ===================== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <span className="text-primary-600 text-sm font-bold uppercase tracking-widest">Network</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-neutral-900">Connected Hospitals</h2>
            <p className="text-xl text-neutral-500">Book at Addis Ababa's top hospitals today</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hospitals.map((h, i) => (
              <motion.div
                key={h.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-hover p-6 space-y-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-medical-teal flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-neutral-900">{h.name}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{h.loc}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">{h.wait}</span>
                  <Link to="/book" className="text-sm text-primary-600 font-semibold hover:underline">Book →</Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== DUAL CTA ===================== */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Patient CTA */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-10 text-white"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-3xl font-bold">For Patients</h3>
                  <p className="text-primary-200 mt-2 text-lg">Book appointments, track queue live, and manage your health journey.</p>
                </div>
                <Link to="/patient" className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all hover:scale-105">
                  Open Patient Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Hospital CTA */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-10 text-white"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-3xl font-bold">For Hospitals</h3>
                  <p className="text-neutral-400 mt-2 text-lg">Manage queues, track patient flow, and optimize your department's performance.</p>
                </div>
                <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-all hover:scale-105">
                  Open Hospital Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== BOTTOM CTA ===================== */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-100">
              <TrendingDown className="w-4 h-4" />
              Reduce wait times by up to 60%
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-neutral-900">
              Ready to Skip the Line?
            </h2>
            <p className="text-xl text-neutral-500 max-w-2xl mx-auto">
              Join thousands of Ethiopians taking control of their healthcare experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book" className="btn-primary h-14 px-10 text-lg group flex items-center justify-center">
                Book Now — It's Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center justify-center gap-3 text-neutral-500">
                <Phone className="w-5 h-5" />
                <span className="font-mono font-bold text-lg text-neutral-700">Dial *711#</span>
                <span className="text-sm">(no internet needed)</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
