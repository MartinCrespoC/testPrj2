'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Plus, Filter, MoreHorizontal, X, Sparkles, MessageCircle, Send, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import '../../dashboard.css';

type Task = {
    id: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    assignee_name?: string;
    due_date?: string;
    assignee_id?: number;
};

export default function KanbanPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [project, setProject] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);

    const [search, setSearch] = useState('');
    const [filterPriority, setFilterPriority] = useState('All');

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryText, setSummaryText] = useState('');

    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
    const [chatLoading, setChatLoading] = useState(false);

    const [taskForm, setTaskForm] = useState({ title: '', priority: 'Medium', status: 'TODO', assignee_id: '', description: '' });

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        try {
            const [tasksRes, projsRes, usersRes] = await Promise.all([
                fetch(`/api/tasks?project_id=${projectId}`),
                fetch(`/api/projects`),
                fetch('/api/users')
            ]);
            
            if(!tasksRes.ok || !projsRes.ok || !usersRes.ok) return; // Silent return if unauthorized

            const tasksData = await tasksRes.json();
            const projsData = await projsRes.json();
            const usersData = await usersRes.json();

            if (tasksData.tasks) setTasks(tasksData.tasks);
            if (usersData.users) setUsers(usersData.users);
            if (projsData.projects) {
                const p = projsData.projects.find((pr: any) => pr.id.toString() === projectId);
                setProject(p);
            }
        } catch (e) {
            console.error("Error fetching kanban data:", e);
        }
    };

    const handleDragStart = (e: React.DragEvent, id: number) => {
        e.dataTransfer.setData('taskId', id.toString());
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        // Optimistic update
        setTasks(prev => prev.map(t => t.id.toString() === taskId ? { ...t, status: newStatus } : t));

        await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        fetchData();
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...taskForm,
                project_id: parseInt(projectId),
                assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : null
            })
        });
        setIsTaskModalOpen(false);
        setTaskForm({ title: '', priority: 'Medium', status: 'TODO', assignee_id: '', description: '' });
        fetchData();
    };

    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U';

    const handleGenerateSummary = async () => {
        setIsSummaryModalOpen(true);
        setSummaryLoading(true);
        setSummaryText('');
        
        try {
            const prompt = `Genera un breve resumen en español de las siguientes tareas del proyecto "${project?.name || 'Actual'}": ${JSON.stringify(tasks.map(t => ({ titulo: t.title, estado: t.status, prioridad: t.priority })))}. Destaca lo urgente y el progreso general en 2 a 3 lineas y en formato de reporte directo al usuario que esta consumiendo el dashboard.`;
            
            const res = await fetch('/api/ai/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();
            if(data.text) {
                setSummaryText(data.text);
            } else {
                setSummaryText('No se pudo generar el resumen.');
            }
        } catch(e) {
            setSummaryText('Error al conectar con la IA.');
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!chatInput.trim() || chatLoading) return;
        
        const userMessage = chatInput.trim();
        const newHistory = [...chatHistory, { role: 'user', content: userMessage }];
        setChatHistory(newHistory);
        setChatInput('');
        setChatLoading(true);

        try {
            // Retrieve latest instruction config
            const settRes = await fetch('/api/settings');
            const settData = await settRes.json();
            const sysInstruction = settData.setting?.value || 'Eres un asistente.';

            // Prepare context (Kanban tasks)
            const contextStr = "Tareas del proyecto:\n" + tasks.map(t => `- [${t.status}] ${t.title} (${t.priority})`).join('\n');

            const res = await fetch('/api/ai/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    systemInstruction: sysInstruction,
                    context: contextStr,
                    history: chatHistory
                })
            });

            const data = await res.json();
            if(data.text) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: data.text }]);
            } else {
                setChatHistory(prev => [...prev, { role: 'assistant', content: 'Lo siento, ocurrió un error procesando tu respuesta.' }]);
            }
        } catch(err) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error de conexión con el Asistente.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const columns = [
        { id: 'TODO', title: 'To Do', color: 'var(--text-secondary)' },
        { id: 'IN_PROGRESS', title: 'In Progress', color: 'var(--warning-color)' },
        { id: 'DONE', title: 'Done', color: 'var(--success-color)' }
    ];

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterPriority === 'All' || t.priority === filterPriority;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="users-page flex-col h-full animate-fade-in" style={{ display: 'flex' }}>
            <div className="topbar">
                <div className="topbar-title">
                    <div className="dot" style={{ backgroundColor: project ? project.color : 'white', width: 12, height: 12 }}></div>
                    <h1 className="text-xl font-bold text-white">{project?.name || 'Loading Project...'}</h1>
                </div>

                <div className="search-bar hidden md:block">
                    <Search size={16} />
                    <input type="text" placeholder="Search in board..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <div className="topbar-actions text-muted relative" style={{ position: 'relative' }}>
                    <button className={`icon-btn ${filterPriority !== 'All' ? 'text-primary' : ''}`} onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}>
                        <Filter size={20} color={filterPriority !== 'All' ? 'var(--primary-color)' : 'currentColor'} />
                    </button>

                    {isFilterModalOpen && (
                        <div className="absolute bg-[#1c1e28] border border-[#262933] p-4 rounded-lg shadow-lg z-50 w-48" style={{ position: 'absolute', top: '40px', right: '120px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)', zIndex: 50 }}>
                            <h4 className="text-sm font-semibold text-white mb-2">Priority Filter</h4>
                            <select className="w-full" value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setIsFilterModalOpen(false); }} style={{ width: '100%' }}>
                                <option value="All">All Priorities</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    )}

                    <button className="icon-btn" onClick={handleGenerateSummary} title="AI Summary"><Sparkles size={20} /></button>
                    <button className="icon-btn"><Bell size={20} /></button>
                    <div className="header-divider hidden md:block"></div>
                    <button className="btn btn-primary ml-2 rounded-lg text-sm" onClick={() => setIsMemberModalOpen(true)}>
                        <Plus size={16} className="mr-1 inline" /> Add Member
                    </button>
                </div>
            </div>

            <div className="page-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="kanban-board" style={{ flex: 1 }}>
                    {columns.map(col => {
                        const columnTasks = filteredTasks.filter(t => t.status === col.id);
                        return (
                            <div
                                key={col.id}
                                className="kanban-column"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className="kanban-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color, display: 'inline-block' }}></span>
                                        {col.title}
                                    </div>
                                    <span className="kanban-column-count">{columnTasks.length}</span>
                                </div>

                                <div className="kanban-tasks">
                                    {columnTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="kanban-card"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                        >
                                            <div className="flex justify-between items-start mb-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span className={`badge badge-${task.priority === 'High' ? 'inactive' : task.priority === 'Medium' ? 'editor' : 'admin'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                                <MoreHorizontal size={16} className="text-muted cursor-pointer" />
                                            </div>
                                            <h4 className="font-semibold text-white mb-1">{task.title}</h4>
                                            {task.description && (
                                                <p className="text-xs text-muted mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
                                            )}

                                            <div className="flex justify-between items-center mt-auto pt-2 border-t" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--border-color)', borderTopStyle: 'solid', borderTopWidth: '1px' }}>
                                                <div className="text-xs text-muted">
                                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : ''}
                                                </div>
                                                <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.65rem' }}>
                                                    {getInitials(task.assignee_name || '')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button className="kanban-add-btn" onClick={() => {
                                        setTaskForm({ ...taskForm, status: col.id });
                                        setIsTaskModalOpen(true);
                                    }}>
                                        <Plus size={16} /> Add Task
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Task Modal */}
            {isTaskModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card animate-fade-in card">
                        <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h2 className="text-xl font-bold text-white">Create Task in {project?.name}</h2>
                            <button className="icon-btn" onClick={() => setIsTaskModalOpen(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Task Title</label>
                                <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Description</label>
                                <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={3} style={{ width: '100%', resize: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Assignee</label>
                                    <select value={taskForm.assignee_id} onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })} style={{ width: '100%' }} required>
                                        <option value="">Select Assignee...</option>
                                        {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted mb-2 block" style={{ marginBottom: '0.5rem' }}>Priority</label>
                                    <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} style={{ width: '100%' }}>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal (Dummy) */}
            {isMemberModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card animate-fade-in card" style={{ maxWidth: '400px' }}>
                        <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h2 className="text-xl font-bold text-white">Project Members</h2>
                            <button className="icon-btn" onClick={() => setIsMemberModalOpen(false)}><X size={20} /></button>
                        </div>
                        <p className="text-muted text-sm mb-4">Invite team members to collaborate on {project?.name}.</p>

                        <div className="search-bar mb-4" style={{ width: '100%' }}>
                            <Search size={16} />
                            <input type="text" placeholder="Search by email..." style={{ width: '100%' }} />
                        </div>

                        <div className="flex flex-col gap-3" style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {users.map((u: any) => (
                                <div key={u.id} className="flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>{getInitials(u.name)}</div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{u.name}</div>
                                            <div className="text-xs text-muted">{u.email}</div>
                                        </div>
                                    </div>
                                    <button className="btn btn-secondary text-xs" style={{ padding: '0.25rem 0.5rem' }} onClick={() => alert(`Invitation sent to ${u.email}!`)}>Invite</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Summary Modal */}
            {isSummaryModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card animate-fade-in card" style={{maxWidth: '500px'}}>
                        <div className="flex justify-between items-center mb-6" style={{display: 'flex', justifyContent: 'space-between'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <Sparkles size={20} color="#a855f7" />
                                <h2 className="text-xl font-bold text-white">AI Project Summary</h2>
                            </div>
                            <button className="icon-btn" onClick={() => setIsSummaryModalOpen(false)}><X size={20}/></button>
                        </div>
                        <div className="bg-[#101217] p-4 rounded-lg border border-[#262933]" style={{backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem'}}>
                            {summaryLoading ? (
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)'}}>
                                    <Sparkles size={16} className="animate-pulse" style={{color: 'var(--primary-color)'}}/>
                                    <span className="text-sm">Analizando tareas del proyecto con Gemini...</span>
                                </div>
                            ) : (
                                <p className="text-sm text-white" style={{lineHeight: '1.6'}}>
                                    {summaryText}
                                </p>
                            )}
                        </div>
                        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem'}}>
                            <button className="btn btn-secondary" onClick={() => setIsSummaryModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Assistant Chat Button & Window */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}>
                {isChatOpen ? (
                   <div className="card shadow-2xl flex-col" style={{ width: '380px', height: '500px', display: 'flex', padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                      {/* Chat Header */}
                      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#101217' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ backgroundColor: '#a855f7', padding: '0.5rem', borderRadius: '50%' }}>
                                <Sparkles size={16} color="white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">TaskMaster Agent</h3>
                                <p className="text-xs text-muted">Aowered by Gemini</p>
                            </div>
                         </div>
                         <button className="icon-btn" onClick={() => setIsChatOpen(false)}><X size={18} /></button>
                      </div>

                      {/* Chat Messages Area */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         {chatHistory.length === 0 && (
                             <div className="text-center text-muted text-sm my-auto">
                                 ✨ Hola, pregúntame acerca de tus tareas pendientes o pídeme priorizarlas basado en el tablero.
                             </div>
                         )}

                         {chatHistory.map((msg, index) => (
                             <div key={index} style={{
                                 alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                 backgroundColor: msg.role === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                                 padding: '0.75rem 1rem',
                                 borderRadius: '0.75rem',
                                 maxWidth: '85%',
                                 borderBottomRightRadius: msg.role === 'user' ? '0' : '0.75rem',
                                 borderBottomLeftRadius: msg.role === 'assistant' ? '0' : '0.75rem',
                             }}>
                                <p className="text-sm text-white" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</p>
                             </div>
                         ))}

                         {chatLoading && (
                             <div style={{
                                alignSelf: 'flex-start',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                borderBottomLeftRadius: '0'
                             }}>
                                <Loader2 size={16} className="text-primary animate-spin" />
                             </div>
                         )}
                      </div>

                      {/* Chat Input */}
                      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#101217' }}>
                         <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Haz una pregunta al AI..."
                                style={{ flex: 1, borderRadius: '99px', padding: '0.5rem 1rem', border: '1px solid var(--border-color)' }}
                                disabled={chatLoading}
                            />
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                disabled={chatLoading || !chatInput.trim()}
                            >
                                <Send size={16} />
                            </button>
                         </form>
                      </div>
                   </div>
                ) : (
                   <button 
                       onClick={() => setIsChatOpen(true)}
                       className="shadow-lg hover:scale-105 transition-transform"
                       style={{ 
                           backgroundColor: 'var(--primary-color)', 
                           color: 'white', 
                           width: '60px', 
                           height: '60px', 
                           borderRadius: '50%', 
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'center',
                           border: 'none',
                           cursor: 'pointer'
                       }}>
                       <MessageCircle size={28} />
                   </button>
                )}
            </div>

        </div>
    );
}
