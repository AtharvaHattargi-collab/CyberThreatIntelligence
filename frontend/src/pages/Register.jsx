import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertTriangle, Mail } from 'lucide-react';
import { authAPI } from '../api/client';

export default function Register() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return <div className="h-screen w-screen bg-background flex items-center justify-center text-text-muted">Loading...</div>;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await authAPI.register({ username, email, password });
      navigate('/login', { state: { message: 'Account created successfully. Please sign in.' }, replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 shadow-2xl border-border/50 animate-fade-in relative overflow-hidden">
        {/* Subtle tech background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-safe/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface to-background border border-border flex items-center justify-center mb-4 shadow-inner">
            <Shield size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary text-center">Create Account</h1>
          <p className="text-sm text-text-secondary mt-2 text-center">Join Cyber Threat Intelligence Platform</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-md p-3 mb-6 flex items-start gap-3 relative z-10">
            <AlertTriangle size={18} className="text-danger mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="input-label block mb-2">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full pl-10 h-11 bg-surface border-border text-sm"
                placeholder="analyst_01"
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label block mb-2">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full pl-10 h-11 bg-surface border-border text-sm"
                placeholder="analyst@cyberthreatintel.local"
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label block mb-2">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full pl-10 h-11 bg-surface border-border text-sm"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label className="input-label block mb-2">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input w-full pl-10 h-11 bg-surface border-border text-sm"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !email || !password || !confirmPassword}
            className="btn-primary w-full h-11 text-sm font-semibold tracking-wide mt-2"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>

          <div className="mt-4 text-center">
            <span className="text-sm text-text-secondary">Already have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center relative z-10">
          <p className="text-[10px] text-text-muted tracking-widest uppercase">Secured by Argon2 & JWT</p>
        </div>
      </div>
    </div>
  );
}
