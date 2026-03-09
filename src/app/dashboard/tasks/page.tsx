'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Search, Bell, HelpCircle, Plus, Activity, Clock, MessageSquare, X, LayoutDashboard } from 'lucide-react';
import '../dashboard.css';

type Task = {
    id: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    project_id: number;
    assignee_id: number;
    due_date: string;
    assignee_name?: string;
    project_name?: string;
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [form, setForm] = useState({ title: '', priority: 'Medium', status: 'TODO', project_id: '', assignee_id: '', description: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [tasksRes, projsRes, usersRes] = await Promise.all([
            fetch('/api/tasks'), fetch('/api/projects'), fetch('/api/users')
        ]);
        const [tasksData, projsData, usersData] = await Promise.all([
            tasksRes.json(), projsRes.json(), usersRes.json()
        ]);
        if (tasksData.tasks) setTasks(tasksData.tasks);
        if (projsData.projects) setProjects(projsData.projects);
        if (usersData.users) setUsers(usersData.users);
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                project_id: parseInt(form.project_id),
                assignee_id: parseInt(form.assignee_id)
            })
        });
        setIsModalOpen(false);
        setForm({ title: '', priority: 'Medium', status: 'TODO', project_id: '', assignee_id: '', description: '' });
        fetchData();
    };

    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U';

    return (
        <div className="users-page animate-fade-in">
            <div className="topbar">
                <div className="topbar-title">
                    <div style={{ backgroundColor: 'var(--primary-color)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                        <LayoutDashboard size={20} color="white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Dashboard</h1>
                </div>

                <div className="search-bar hidden md:block">
                    <Search size={16} />
                    <input type="text" placeholder="Search tasks, teams, projects..." />
                </div>

                <div className="topbar-actions text-muted">
                    <button className="icon-btn"><Bell size={20} /></button>
                    <button className="icon-btn"><HelpCircle size={20} /></button>
                    <div className="header-divider hidden md:block"></div>
                    <button className="btn btn-primary ml-2 rounded-lg text-sm" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} className="mr-1 inline" /> New Task
                    </button>
                </div>
            </div>

            <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Active Tasks</h1>
                    <p className="text-muted text-sm">You have {tasks.length} tasks recorded across projects.</p>
                </div>

                <div className="card" style={{ padding: '0', marginBottom: '2rem' }}>
                    {tasks.map(task => (
                        <div key={task.id} className="flex border-b border-[var(--border-color)] p-4 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <div className="mr-4 mt-1">
                                <input type="checkbox" className="checkbox-custom" checked={task.status === 'DONE'} readOnly />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white" style={{ textDecoration: task.status === 'DONE' ? 'line-through' : 'none', color: task.status === 'DONE' ? 'var(--text-secondary)' : 'white' }}>
                                    {task.title}
                                </h3>
                                <p className="text-xs text-muted mt-1 flex items-center gap-1">
                                    <Clock size={12} /> Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'} • {task.project_name}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`badge badge-${task.priority === 'High' ? 'inactive' : task.priority === 'Medium' ? 'editor' : 'admin'}`}>{task.priority.toUpperCase()}</span>
                                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{getInitials(task.assignee_name || '')}</div>
                            </div>
                        </div>
                    ))}
                    {tasks.length === 0 && <div className="p-8 text-center text-muted">No tasks available</div>}
                </div>

                <div className="metrics-grid">
                    <div className="card flex-col items-start gap-2" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="metric-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}><Activity size={24} /></div>
                        <div className="mt-4">
                            <span className="text-sm font-bold text-white mt-2 block">Productivity Score</span>
                            <h2 className="text-3xl font-bold mt-1 block" style={{ color: 'var(--primary-color)', fontSize: '2rem' }}>84%</h2>
                            <p className="text-xs text-muted mt-2 block">You are 12% more efficient than last week!</p>
                        </div>
                    </div>

                    <div className="card flex-col items-start gap-2" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}><Clock size={24} /></div>
                        <div className="mt-4">
                            <span className="text-sm font-bold text-white mt-2 block">Active Sessions</span>
                            <h2 className="text-3xl font-bold text-white mt-1 block" style={{ fontSize: '2rem' }}>3</h2>
                            <p className="text-xs text-muted mt-2 block">Currently tracking Active tasks</p>
                        </div>
                    </div>

                    <div className="card flex-col items-start gap-2" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="metric-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}><MessageSquare size={24} /></div>
                        <div className="mt-4">
                            <span className="text-sm font-bold text-white mt-2 block">New Messages</span>
                            <h2 className="text-3xl font-bold text-white mt-1 block" style={{ fontSize: '2rem' }}>7</h2>
                            <p className="text-xs text-muted mt-2 block">Check updates from marketing team</p>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card animate-fade-in card">
                        <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h2 className="text-xl font-bold text-white">Create New Task</h2>
                            <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Task Title</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: '100%', resize: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Project</label>
                                    <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} required style={{ width: '100%' }}>
                                        <option value="">Select Project...</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Assignee</label>
                                    <select value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })} style={{ width: '100%' }} required>
                                        <option value="">Select Assignee...</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Priority</label>
                                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%' }}>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%' }}>
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
