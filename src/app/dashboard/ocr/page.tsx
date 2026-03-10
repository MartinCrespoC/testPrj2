'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, RefreshCw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import './ocr.css';

type Receta = {
  id: number;
  file_name: string;
  medico_e_institucion: string;
  paciente_y_fecha: string;
  diagnostico_o_sintomas: string;
  tratamiento_indicado: string;
  texto_adicional: string;
  calidad_lectura: string;
  porcentaje_lectura: number;
  created_at: string;
};

export default function OcrPage() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRecetas();
  }, []);

  const fetchRecetas = async () => {
    const res = await fetch('/api/ocr');
    const data = await res.json();
    if (data.recetas) setRecetas(data.recetas);
  };

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // result is "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        // Nadro API says "<BASE64_DEL_ARCHIVO>", some OCR API prefer the pure base64. 
        // We will send the pure base64.
        const base64Data = result.split(',')[1];
        resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setLoading(true);
    try {
        const base64 = await toBase64(file);
        
        const res = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_name: file.name,
                mime_type: file.type,
                file_base64: base64
            })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            alert('Error processing OCR: ' + (data.error || 'Unknown error'));
        } else {
            // Success
            fetchRecetas();
        }
    } catch (e: any) {
        alert('Error: ' + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this OCR record?')) {
        await fetch(`/api/ocr/${id}`, { method: 'DELETE' });
        fetchRecetas();
    }
  };

  return (
    <div className="ocr-page flex-col animate-fade-in" style={{display: 'flex', flexDirection: 'column'}}>
      <div className="topbar">
        <div className="topbar-title">
          <div style={{backgroundColor: '#a855f7', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center'}}>
            <FileText size={20} color="white" />
          </div>
          <h1 className="text-xl font-bold text-white">Lector OCR de Recetas</h1>
        </div>
      </div>

      <div className="page-content" style={{maxWidth: '1200px', margin: '0 auto', width: '100%'}}>
        
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Análisis de Documentos</h2>
            <p className="text-muted text-sm">Sube, arrastra o selecciona tu imagen (PNG, JPG) o PDF para extraer automáticamente los detalles de la receta médica.</p>
        </div>

        {/* Upload Zone */}
        <div 
            className={`upload-zone mb-8 card ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !loading && fileInputRef.current?.click()}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                accept="image/png, image/jpeg, image/jpg, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                    }
                }}
            />
            
            <div className={`upload-icon ${loading ? 'pulse' : ''}`}>
                {loading ? <RefreshCw size={32} className="animate-spin" /> : <Upload size={32} />}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">
                {loading ? 'Procesando documento con IA...' : 'Arrastra un archivo aquí'}
            </h3>
            <p className="text-muted text-sm">
                {loading ? 'Leyendo datos del médico, paciente, diagnóstico y tratamiento...' : 'O haz click para buscar en tu dispositivo (Formatos permitidos: JPG, PNG, PDF, DOCX)'}
            </p>
        </div>

        {/* CRUD Table */}
        <div className="card" style={{padding: 0}}>
            <table className="ocr-table">
                <thead>
                    <tr>
                        <th>MÉDICO E INSTITUCIÓN</th>
                        <th>PACIENTE Y FECHA</th>
                        <th>DIAGNÓSTICO</th>
                        <th>TRATAMIENTO INDICADO</th>
                        <th>CALIDAD</th>
                        <th style={{textAlign: 'right'}}>ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    {recetas.map(receta => (
                        <tr key={receta.id}>
                            <td className="w-1/5">
                                <span className="font-semibold text-white line-clamp">{receta.medico_e_institucion || 'N/A'}</span>
                            </td>
                            <td className="text-muted w-1/5">
                                <span className="line-clamp">{receta.paciente_y_fecha || 'N/A'}</span>
                            </td>
                            <td className="text-muted w-1/5">
                                <span className="line-clamp">{receta.diagnostico_o_sintomas || 'N/A'}</span>
                            </td>
                            <td className="text-muted w-1/5">
                                <span className="line-clamp">{receta.tratamiento_indicado || 'N/A'}</span>
                            </td>
                            <td>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                    <span style={{fontSize: '10px'}} className={`badge badge-${receta.calidad_lectura.toLowerCase()}`}>
                                        {receta.calidad_lectura.toUpperCase()}
                                    </span>
                                    <span className="text-xs font-bold text-white">{receta.porcentaje_lectura}% precision</span>
                                </div>
                            </td>
                            <td style={{textAlign: 'right'}}>
                                <button className="icon-btn hover:text-red-500" onClick={() => handleDelete(receta.id)}>
                                    <Trash2 size={18} color="var(--danger-color)" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {recetas.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{padding: '3rem', textAlign: 'center'}}>
                                <AlertCircle size={32} className="text-muted" style={{margin: '0 auto 1rem', display: 'block'}} />
                                <p className="text-muted">No hay recetas escaneadas todavía.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
