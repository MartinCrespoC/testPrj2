'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, CheckCircle2, FileText } from 'lucide-react';
import './dashboard.css';

type Project = { id: number; name: string; color: string; };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [projects, setProjects] = useState<Project[]>([]);
    const [adminUser, setAdminUser] = useState<any>(null);

    useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(data => {
            if (data.user) setAdminUser(data.user);
        });
        fetch('/api/projects').then(res => res.json()).then(data => {
            if (data.projects) setProjects(data.projects);
        });
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <CheckCircle2 color="#3b82f6" fill="white" size={32} className="logo-icon" />
                    <div className="logo-text">
                        <h2>TaskMaster</h2>
                        <span>Management Portal</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <a href="/dashboard/tasks" className={`nav-item ${pathname === '/dashboard/tasks' ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </a>
                    <a href="/dashboard/users" className={`nav-item ${pathname === '/dashboard/users' ? 'active' : ''}`}>
                        <Users size={20} />
                        <span>User Admin</span>
                    </a>
                    <a href="/dashboard/ocr" className={`nav-item ${pathname === '/dashboard/ocr' ? 'active' : ''}`}>
                        <FileText size={20} />
                        <span>OCR Recetas</span>
                    </a>
                    <a href="#" className="nav-item">
                        <Settings size={20} />
                        <span>Settings</span>
                    </a>

                    <div className="nav-group-title">PROJECTS</div>
                    {projects.map(proj => (
                        <a key={proj.id} href={`/dashboard/projects/${proj.id}`} className={`nav-item project-item ${pathname === '/dashboard/projects/' + proj.id ? 'active' : ''}`}>
                            <span className={`dot`} style={{ backgroundColor: proj.color === 'blue' ? 'var(--primary-color)' : proj.color === 'purple' ? '#a855f7' : proj.color }}></span> {proj.name}
                        </a>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="profile-info">
                        <div className="avatar">{adminUser?.name?.charAt(0) || 'A'}</div>
                        <div className="profile-details">
                            <strong>{adminUser?.name || 'Admin User'}</strong>
                            <span>{adminUser?.email || 'admin@taskmaster.io'}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn mx-2 hover:text-red-500">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content relative">
                {children}
            </main>
        </div>
    );
}
