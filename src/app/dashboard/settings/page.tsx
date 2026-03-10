'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import '../dashboard.css';

export default function SettingsPage() {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => {
          if(!res.ok) throw new Error("Unauthorized or server error");
          return res.json();
      })
      .then(data => {
         if(data.setting && data.setting.value) {
            setInstruction(data.setting.value);
         }
         setLoading(false);
      })
      .catch((err) => {
         setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
        await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system_instruction: instruction })
        });
        alert('Settings saved successfully!');
    } catch(e) {
        alert('Failed to save settings.');
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="users-page animate-fade-in" style={{display: 'flex', flexDirection: 'column'}}>
      <div className="topbar">
        <div className="topbar-title">
          <div style={{backgroundColor: '#6b7280', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center'}}>
            <SettingsIcon size={20} color="white" />
          </div>
          <h1 className="text-xl font-bold text-white">System Settings</h1>
        </div>
      </div>

      <div className="page-content" style={{maxWidth: '800px', margin: '0 auto', width: '100%'}}>
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Global Configurations</h2>
            <p className="text-muted text-sm">Manage system prompts and general application settings.</p>
        </div>

        <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">Chatbot Configuration</h3>
            {loading ? (
                <p className="text-muted">Loading settings...</p>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <div>
                        <label className="text-sm font-semibold text-white mb-2 block" style={{marginBottom: '0.5rem'}}>
                            System Instruction (System Prompt)
                        </label>
                        <p className="text-xs text-muted mb-4">
                            This prompt defines the chatbot's identity and behavior during interactions globally inside the Kanban module.
                        </p>
                        <textarea 
                            value={instruction} 
                            onChange={(e) => setInstruction(e.target.value)}
                            rows={8}
                            style={{width: '100%', resize: 'vertical'}}
                            placeholder="Enter the instruction instructions for the generative AI..."
                        />
                    </div>
                    <div style={{display: 'flex', justifyItems: 'flex-start', marginTop: '1rem'}}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : <><Save size={16} className="mr-2 inline" /> Save Configuration</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
