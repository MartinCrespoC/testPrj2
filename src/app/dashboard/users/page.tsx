'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Download, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Lock, Users as UsersIcon, UserCheck, ShieldCheck, X } from 'lucide-react';
import './users.css';

type User = { id: number; name: string; email: string; role: string; status: string; };

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Form State
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Viewer', status: 'Active' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        if (res.ok) {
            const data = await res.json();
            setUsers(data.users);
        }
    };

    const handleEdit = (user: User) => {
        setCurrentUser(user);
        setForm({ name: user.name, email: user.email, password: '', role: user.role, status: user.status });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            fetchUsers();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = currentUser ? `/api/users/${currentUser.id}` : '/api/users';
        const method = currentUser ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        setIsModalOpen(false);
        setCurrentUser(null);
        setForm({ name: '', email: '', password: '', role: 'Viewer', status: 'Active' });
        fetchUsers();
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="users-page animate-fade-in">
            <div className="topbar">
                <div className="topbar-title">
                    <div className="logo-icon-small">
                        <UserCheck size={20} color="white" />
                    </div>
                    <span className="text-secondary font-medium">AdminConsole</span>
                </div>

                <div className="search-bar">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search users, roles or emails..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="topbar-actions">
                    <button className="icon-btn"><Bell size={20} /></button>
                    <div className="header-divider"></div>
                    <div className="profile-info">
                        <div className="profile-details" style={{ textAlign: 'right' }}>
                            <strong>Alex Rivera</strong>
                            <span>SUPER ADMIN</span>
                        </div>
                        <div className="avatar" style={{ backgroundColor: '#eca96b' }}>AR</div>
                    </div>
                </div>
            </div>

            <div className="page-content">
                <div className="page-header flex justify-between items-center">
                    <div>
                        <div className="breadcrumb text-xs text-muted mb-2">Dashboard / User Management</div>
                        <h1 className="text-3xl font-bold text-white mb-2">User Administration</h1>
                        <p className="text-muted">Manage system access, assign roles, and monitor account status across your organization.</p>
                    </div>
                    <div className="actions flex gap-4">
                        <button className="btn btn-secondary"><Download size={16} className="mr-2" /> Export CSV</button>
                        <button className="btn btn-primary" onClick={() => { setCurrentUser(null); setForm({ name: '', email: '', password: '', role: 'Viewer', status: 'Active' }); setIsModalOpen(true); }}><Plus size={16} className="mr-2" /> Create New User</button>
                    </div>
                </div>

                <div className="card table-card mt-8">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>NAME</th>
                                <th>EMAIL</th>
                                <th>ROLE</th>
                                <th>STATUS</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="flex items-center gap-4">
                                            <div className="avatar-small">{user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                                            <span className="font-semibold text-white">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-muted">{user.email}</td>
                                    <td><span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span></td>
                                    <td>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <span className={`status-dot ${user.status === 'Active' ? 'active' : 'inactive'}`}></span>
                                            <span className={user.status === 'Active' ? 'text-success' : 'text-muted'}>{user.status}</span>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <button className="action-btn text-muted hover-white mr-2" onClick={() => handleEdit(user)}>Edit</button>
                                        <button className="action-btn text-danger ml-2" onClick={() => handleDelete(user.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-muted">No users found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="table-footer flex justify-between items-center mt-6">
                        <div className="security-badge flex items-center gap-2 text-xs text-muted">
                            <Lock size={14} color="#3b82f6" />
                            <span>Passwords are encrypted using Argon2/BCrypt hashing</span>
                        </div>

                        <div className="pagination flex items-center gap-2">
                            <button className="icon-btn"><ChevronLeft size={16} /></button>
                            <button className="page-btn active">1</button>
                            <button className="page-btn">2</button>
                            <button className="page-btn">3</button>
                            <span className="text-muted">...</span>
                            <button className="page-btn">12</button>
                            <button className="icon-btn"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

                <div className="metrics-grid mt-8">
                    <div className="metric-card card">
                        <div className="metric-icon bg-blue-dim"><UsersIcon size={24} color="#3b82f6" /></div>
                        <div className="metric-info">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">TOTAL USERS</span>
                            <h2 className="text-3xl font-bold text-white mt-1">{users.length}</h2>
                        </div>
                    </div>
                    <div className="metric-card card">
                        <div className="metric-icon bg-green-dim"><UserCheck size={24} color="#10b981" /></div>
                        <div className="metric-info">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">ACTIVE NOW</span>
                            <h2 className="text-3xl font-bold text-white mt-1">{users.filter(u => u.status === 'Active').length}</h2>
                        </div>
                    </div>
                    <div className="metric-card card">
                        <div className="metric-icon bg-purple-dim"><ShieldCheck size={24} color="#3b82f6" /></div>
                        <div className="metric-info">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">ADMIN ACCOUNTS</span>
                            <h2 className="text-3xl font-bold text-white mt-1">{users.filter(u => u.role === 'Admin').length}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card animate-fade-in card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{currentUser ? 'Edit User' : 'Create New User'}</h2>
                            <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-col gap-4">
                            <div>
                                <label className="text-sm text-muted mb-2 block">Full Name</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full" />
                            </div>
                            <div>
                                <label className="text-sm text-muted mb-2 block">Email Address</label>
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full" />
                            </div>
                            <div>
                                <label className="text-sm text-muted mb-2 block">{currentUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!currentUser} className="w-full" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-sm text-muted mb-2 block">Role</label>
                                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full">
                                        <option value="Viewer">Viewer</option>
                                        <option value="Editor">Editor</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm text-muted mb-2 block">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{currentUser ? 'Save Changes' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
