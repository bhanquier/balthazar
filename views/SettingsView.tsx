import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { IndexStatus, QAStatus } from '../types';
import { 
    CheckCircle, 
    XCircle, 
    RefreshCw, 
    Server, 
    Database, 
    Cpu, 
    HardDrive,
    AlertTriangle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
    const [qaStatus, setQaStatus] = useState<QAStatus | null>(null);
    const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);
    const [isIndexing, setIsIndexing] = useState(false);
    const [lastIndexedCount, setLastIndexedCount] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            const [qa, idx] = await Promise.all([
                api.getQAStatus(),
                api.getIndexStatus()
            ]);
            setQaStatus(qa);
            setIndexStatus(idx);
        } catch (e) {
            console.error("Failed to fetch status", e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleReindex = async () => {
        if (!confirm("This will rebuild all embeddings and the FAISS index. It may take some time. Continue?")) return;
        
        setIsIndexing(true);
        try {
            const res = await api.triggerIndex(true);
            setLastIndexedCount(res.indexed_files);
            await fetchData();
            alert(`Indexing complete! Processed ${res.indexed_files} chunks.`);
        } catch (e) {
            alert("Indexing failed. Check backend logs.");
        } finally {
            setIsIndexing(false);
        }
    };

    const StatusItem = ({ label, active, icon: Icon }: { label: string, active: boolean, icon: any }) => (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-700">{label}</span>
            </div>
            {active ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
                <XCircle className="w-5 h-5 text-red-500" />
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
             <header className="bg-white border-b border-slate-200 px-8 py-5 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-800">System Status</h1>
                <p className="text-slate-500 text-sm">Monitor Infrastructure & Indexes</p>
            </header>

            <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
                
                {/* AI / Ollama Status */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-indigo-600" /> AI Inference Engine
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatusItem 
                            label="Ollama Service" 
                            active={qaStatus?.ollama_available ?? false} 
                            icon={Server} 
                        />
                        <StatusItem 
                            label="Llama 3.2 Model" 
                            active={qaStatus?.llama3_ready ?? false} 
                            icon={Cpu} 
                        />
                        <div className={`p-4 rounded-lg border flex items-center justify-center text-center ${
                            qaStatus?.ready 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                            {qaStatus?.ready 
                                ? "System is fully operational for QA." 
                                : "System is NOT ready for QA."}
                        </div>
                    </div>
                </section>

                {/* Index Status */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" /> Knowledge Base Indices
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <StatusItem label="Vector Embeddings" active={indexStatus?.embed ?? false} icon={Database} />
                        <StatusItem label="FAISS Index" active={indexStatus?.faiss ?? false} icon={HardDrive} />
                        <StatusItem label="BM25 (Lexical)" active={indexStatus?.bm25 ?? false} icon={FileText} />
                        <StatusItem label="Document Paths" active={indexStatus?.paths ?? false} icon={FileText} />
                        <StatusItem label="Text Previews" active={indexStatus?.previews ?? false} icon={FileText} />
                    </div>

                    {/* Actions */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800">Rebuild Index</h3>
                                <p className="text-slate-500 text-sm mt-1 max-w-lg">
                                    Trigger a full scan of the document directory. This will extract text, chunk paragraphs, 
                                    generate new embeddings, and rebuild both Vector and Keyword indices.
                                </p>
                                {lastIndexedCount !== null && (
                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                                        <CheckCircle className="w-3 h-3" /> Last run processed {lastIndexedCount} chunks
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleReindex}
                                disabled={isIndexing}
                                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                                    isIndexing 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow'
                                }`}
                            >
                                <RefreshCw className={`w-4 h-4 ${isIndexing ? 'animate-spin' : ''}`} />
                                {isIndexing ? 'Indexing...' : 'Rebuild All Indices'}
                            </button>
                        </div>
                        {(!indexStatus?.faiss || !indexStatus?.bm25) && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Indices are missing. You must run the indexer before searching.</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* File Info */}
                <section className="bg-slate-900 text-slate-400 p-6 rounded-xl font-mono text-sm">
                    <h3 className="text-slate-200 font-bold mb-2">Debug Info</h3>
                    <p>API Endpoint: <span className="text-emerald-400">http://127.0.0.1:8000</span></p>
                    <p>Current Model: <span className="text-indigo-400">Llama 3.2</span></p>
                    <p>Embedding Model: <span className="text-indigo-400">all-MiniLM-L6-v2</span></p>
                </section>

            </div>
        </div>
    );
};

function FileText(props: any) {
    return (
        <svg 
            {...props}
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    );
}