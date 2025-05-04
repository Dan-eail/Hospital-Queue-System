import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Calendar, Users, Activity, BarChart3, Menu, X, LogOut, User, Building2 } from 'lucide-react';

// Pages
import HomePage from './pages/HomePage';
import BookAppointment from './pages/BookAppointment';
import CheckQueue from './pages/CheckQueue';
import ReceptionDashboard from './pages/ReceptionDashboard';
import Analytics from './pages/Analytics';
import PatientDashboard from './pages/PatientDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Helper: read user from localStorage
function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(getStoredUser);

  // Listen for login/logout events across tabs or from LoginPage
  React.useEffect(() => {
    const onStorage = () => setCurrentUser(getStoredUser());
    window.addEventListener('storage', onStorage);
    // Also listen for a custom event LoginPage fires after login
    window.addEventListener('auth-change', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-change', onStorage);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth-change'));
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const patientNavigation = [
    { name: 'Book Appointment', path: '/book', icon: Calendar },
    { name: 'My Dashboard', path: '/patient', icon: Users },
  ];

  const hospitalNavigation = [
    { name: 'Reception', path: '/dashboard', icon: BarChart3 },
    { name: 'Analytics', path: '/analytics', icon: Activity },
  ];

  const isPatient = currentUser?.type === 'patient';
  const isStaff   = currentUser?.type === 'staff';
  const activeNav  = isPatient ? patientNavigation : isStaff ? hospitalNavigation : [];

  return (
    <Router>
      <div className="min-h-screen bg-mesh">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#171717',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
          }}
        />

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <nav className="bg-white/80 backdrop-blur-lg border-b border-neutral-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">

              {/* Logo */}
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-medical-teal rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-display text-xl font-bold text-gradient">
                  HealthQueue
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2">

                {/* ── NOT logged in: show only Sign In ── */}
                {!currentUser && (
                  <Link
                    to="/login"
                    className="btn-primary px-6 py-2 h-auto"
                  >
                    Sign In
                  </Link>
                )}

                {/* ── Logged-in: show role badge + relevant links + logout ── */}
                {currentUser && (
                  <>
                    {/* Role badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mr-2 ${
                      isPatient
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isPatient ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                      {isPatient ? 'Patient' : 'Hospital Staff'}
                    </div>

                    {/* Role-specific nav links */}
                    <div className="flex items-center space-x-1 pr-4 mr-2 border-r border-neutral-200">
                      {activeNav.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-neutral-700 transition-colors duration-200 ${
                              isPatient
                                ? 'hover:bg-primary-50 hover:text-primary-600'
                                : 'hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* User name + Logout */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-600 font-medium hidden lg:block">
                        {currentUser.name}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 space-y-2 animate-slide-down border-t border-neutral-100 mt-2">

                {/* NOT logged in */}
                {!currentUser && (
                  <Link
                    to="/login"
                    className="block mx-4 btn-primary text-center py-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}

                {/* Logged in */}
                {currentUser && (
                  <>
                    <div className={`mx-4 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${
                      isPatient ? 'bg-primary-50 text-primary-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {isPatient ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      {currentUser.name} · {isPatient ? 'Patient' : 'Hospital Staff'}
                    </div>

                    {activeNav.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            isPatient ? 'hover:bg-primary-50 hover:text-primary-600' : 'hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      );
                    })}

                    <button
                      onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/"          element={<PatientDashboard />} />
            <Route path="/home"      element={<HomePage />} />
            <Route path="/book"      element={<BookAppointment />} />
            <Route path="/queue"     element={<CheckQueue />} />
            <Route path="/patient"   element={<PatientDashboard />} />
            <Route path="/dashboard" element={<ReceptionDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/login"     element={<LoginPage onLogin={() => setCurrentUser(getStoredUser())} />} />
            <Route path="/register"  element={<RegisterPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-neutral-900 text-white mt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-4 gap-10">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-medical-teal rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="font-display text-xl font-bold text-white">HealthQueue</span>
                </div>
                <p className="text-neutral-400 leading-relaxed max-w-sm">
                  Reducing hospital wait times across Ethiopia — accessible to everyone, even on basic feature phones via USSD *711#.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm uppercase tracking-wider">Patient</h4>
                <ul className="space-y-2">
                  {[['Book Appointment', '/book'], ['My Dashboard', '/patient'], ['Check Queue', '/queue'], ['Sign In', '/login']].map(([l, h]) => (
                    <li key={l}><Link to={h} className="text-neutral-400 hover:text-white transition-colors text-sm">{l}</Link></li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm uppercase tracking-wider">Hospital</h4>
                <ul className="space-y-2">
                  {[['Reception Dashboard', '/dashboard'], ['Analytics', '/analytics']].map(([l, h]) => (
                    <li key={l}><Link to={h} className="text-neutral-400 hover:text-white transition-colors text-sm">{l}</Link></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
              <p>© 2024 HealthQueue · Built for Ethiopia's healthcare system</p>
              <p>Reducing wait times, improving lives.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
