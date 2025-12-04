import React, { useState } from 'react';
import { Search, SlidersHorizontal, FileText, BarChart3 } from 'lucide-react';
import { api } from '../services/api';
import { SearchResponse } from '../types';
import { BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Bar } from 'recharts';

export const SearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search Options
  const [topK, setTopK] = useState(5);
  const [useRerank, setUseRerank] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Using Hybrid search as it's the most robust endpoint provided
      const data = await api.hybridSearch(query, topK, useRerank);
      setResults(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 shadow-sm flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Deep Search</h1>
            <p className="text-slate-500 text-sm">Hybrid Retrieval (Semantic + Keyword)</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Search & Options */}
        <div className="w-1/3 bg-white border-r border-slate-200 flex flex-col z-10">
            <div className="p-6 border-b border-slate-100">
                <form onSubmit={handleSearch}>
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter keywords or concept..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        />
                        <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                    </div>
                </form>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Parameters</span>
                    </div>
                    
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">Results (Top K)</span>
                            <span className="font-medium text-emerald-600">{topK}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="20" 
                            value={topK} 
                            onChange={(e) => setTopK(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm text-slate-700">Reranking (Cross-Encoder)</span>
                        <button 
                            onClick={() => setUseRerank(!useRerank)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${useRerank ? 'bg-emerald-600' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useRerank ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleSearch}
                    disabled={loading || !query}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {loading ? 'Searching...' : <><Search className="w-4 h-4" /> Run Search</>}
                </button>
            </div>
        </div>

        {/* Right Panel: Results */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
            {loading ? (
                 <div className="h-full flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-4 w-48 bg-slate-300 rounded mb-4"></div>
                        <div className="h-64 w-96 bg-slate-200 rounded"></div>
                    </div>
                 </div>
            ) : results.length > 0 ? (
                <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                         <h2 className="text-xl font-bold text-slate-800">Results Found: {results.length}</h2>
                    </div>

                    {results.map((res, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-emerald-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 break-all">{res.path.split('/').pop()}</h3>
                                        <p className="text-xs text-slate-500 font-mono mt-1">{res.path}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {(res.hybrid_score || 0).toFixed(3)}
                                    </div>
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Score</div>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="prose prose-sm prose-slate max-w-none text-slate-600 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    "{res.preview}..."
                                </div>

                                {/* Score Visualization */}
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500 uppercase">
                                        <BarChart3 className="w-3 h-3" /> Score Components
                                    </div>
                                    <div className="h-24 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                layout="vertical"
                                                data={[
                                                    { name: 'Vector', value: res.score_cos || 0, fill: '#6366f1' }, // Indigo
                                                    { name: 'Keyword', value: res.score_kw ? Math.min(res.score_kw / 10, 1) : 0, fill: '#10b981' }, // Emerald (normalized roughly)
                                                ]}
                                                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                                            >
                                                <XAxis type="number" hide domain={[0, 1]} />
                                                <YAxis type="category" dataKey="name" width={60} tick={{fontSize: 10}} interval={0} />
                                                <Tooltip cursor={{fill: 'transparent'}} />
                                                <Bar dataKey="value" barSize={12} radius={[0, 4, 4, 0]}>
                                                    {
                                                        [0, 1].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#10b981'} />
                                                        ))
                                                    }
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Search className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No results to display</p>
                    <p className="text-sm">Run a search to see document matches</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};