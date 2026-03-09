'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, CheckCircle2, MonitorSmartphone } from 'lucide-react';
import './login.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to login');
            }

            router.push('/dashboard/users');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container flex items-center justify-center animate-fade-in">
            <div className="login-content flex-col items-center">
                <div className="flex items-center gap-2 mb-8 brand-logo">
                    <CheckCircle2 color="#3b82f6" size={32} />
                    <h1 className="font-bold">TaskMaster</h1>
                </div>

                <div className="login-card card">
                    <div className="login-header">
                        <h2>Sign In</h2>
                        <p className="text-muted text-sm">Welcome back! Please enter your details.</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleLogin} className="flex-col gap-4">
                        <div className="input-group">
                            <label className="text-sm font-medium">Email Address</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Password</label>
                                <a href="#" className="text-xs forgot-link">Forgot password?</a>
                            </div>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <Eye className="input-icon-right" size={18} />
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm remember-me">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="checkbox-custom" />
                                <span className="text-muted">Remember me for 30 days</span>
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary login-btn mt-2" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In →'}
                        </button>
                    </form>

                    <div className="divider">
                        <span>OR CONTINUE WITH</span>
                    </div>

                    <div className="auth-providers flex gap-4">
                        <button className="btn btn-secondary flex-1 flex gap-2 items-center justify-center">
                            <span className="google-icon">G</span> Google
                        </button>
                        <button className="btn btn-secondary flex-1 flex gap-2 items-center justify-center">
                            <MonitorSmartphone size={16} /> Apple
                        </button>
                    </div>
                </div>

                <p className="signup-link mt-8 text-sm text-muted">
                    Don't have an account? <a href="#">Sign up for free</a>
                </p>
            </div>
        </div>
    );
}
