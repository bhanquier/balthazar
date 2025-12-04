import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  Cpu,
  Database,
  Settings,
  FileText,
  X,
  Server,
  CloudLightning
} from "lucide-react";

// --- Types ---
interface Source {
  name: string;
  score?: number;
}

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  sources?: string[]; // Strings returned by backend
  mode?: "direct" | "rag";
}

interface AppSettings {
  mode: "direct" | "rag";
  backendUrl: string;
  ragProvider: "gemini" | "ollama";
}

// --- Components ---

const Header = ({ onOpenSettings, currentMode }: { onOpenSettings: () => void, currentMode: "direct" | "rag" }) => (
  <header className="flex items-center justify-between px-6 py-4 bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-10">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg transition-colors ${currentMode === 'rag' ? 'bg-amber-600/20 text-amber-500' : 'bg-blue-600/20 text-blue-400'}`}>
        {currentMode === 'rag' ? <Database className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
      </div>
      <div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Gemini Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            currentMode === 'rag' 
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' 
              : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
          }`}>
            {currentMode === 'rag' ? 'Balthazar RAG' : 'Direct Gemini'}
          </span>
        </div>
      </div>
    </div>
    <button 
      onClick={onOpenSettings}
      className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
      title="Settings"
    >
      <Settings className="w-5 h-5" />
    </button>
  </header>
);

const SourceDisplay = ({ sources }: { sources: string[] }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-slate-700/50">
      <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
        <FileText className="w-3 h-3" /> Sources utilisées :
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((src, idx) => (
          <span key={idx} className="text-xs bg-slate-900/50 border border-slate-700/50 px-2 py-1 rounded text-slate-300">
            {src}
          </span>
        ))}
      </div>
    </div>
  );
};

const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-blue-600" : (message.mode === 'rag' ? "bg-amber-600" : "bg-purple-600")
        }`}>
          {isUser ? <User className="w-6 h-6 text-white" /> : (message.mode === 'rag' ? <Database className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-white" />)}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}>
          <div className={`px-5 py-3.5 rounded-2xl shadow-lg text-sm leading-relaxed w-full ${
            isUser 
              ? "bg-blue-600 text-white rounded-tr-sm" 
              : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm"
          }`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.text}</p>
            ) : (
              <div className="markdown-body">
                 <ReactMarkdown>{message.text}</ReactMarkdown>
                 {message.sources && <SourceDisplay sources={message.sources} />}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500 mt-1 px-1 flex items-center gap-2">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {!isUser && message.mode === 'rag' && <span className="text-[10px] uppercase tracking-wider text-amber-500/80">• Document Search</span>}
          </span>
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  settings: AppSettings; 
  onSave: (s: AppSettings) => void; 
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" /> Configuration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Mode de fonctionnement</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLocalSettings(s => ({ ...s, mode: 'direct' }))}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  localSettings.mode === 'direct' 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-100' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                <Cpu className="w-6 h-6" />
                <span className="text-sm font-medium">Direct Gemini</span>
              </button>
              <button
                onClick={() => setLocalSettings(s => ({ ...s, mode: 'rag' }))}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  localSettings.mode === 'rag' 
                    ? 'bg-amber-600/20 border-amber-500 text-amber-100' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                <Database className="w-6 h-6" />
                <span className="text-sm font-medium">Balthazar (RAG)</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {localSettings.mode === 'direct' 
                ? "Utilise l'API Google Gemini directement (Frontend). Pas d'accès aux documents." 
                : "Se connecte à votre backend Python. Recherche dans vos documents indexés."}
            </p>
          </div>

          {/* RAG Settings (Only visible in RAG mode) */}
          {localSettings.mode === 'rag' && (
            <div className="space-y-4 pt-4 border-t border-slate-700 animate-[fadeIn_0.3s]">
               <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Moteur de génération (Backend)</label>
                <div className="grid grid-cols-2 gap-2">
                   <button
                    onClick={() => setLocalSettings(s => ({...s, ragProvider: 'gemini'}))}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      localSettings.ragProvider === 'gemini' 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' 
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                   >
                     <CloudLightning className="w-4 h-4" /> Gemini (Rapide)
                   </button>
                   <button
                    onClick={() => setLocalSettings(s => ({...s, ragProvider: 'ollama'}))}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      localSettings.ragProvider === 'ollama' 
                        ? 'bg-green-500/20 border-green-500/50 text-green-200' 
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                   >
                     <Server className="w-4 h-4" /> Ollama (Local)
                   </button>
                </div>
                <p className="text-xs text-slate-500">
                  Choisissez qui répond après la recherche documentaire. Gemini est recommandé.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">URL du Backend (FastAPI)</label>
                <input 
                  type="text" 
                  value={localSettings.backendUrl}
                  onChange={(e) => setLocalSettings(s => ({...s, backendUrl: e.target.value}))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                  placeholder="http://localhost:8000"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
            Annuler
          </button>
          <button 
            onClick={() => { onSave(localSettings); onClose(); }}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // App Settings State
  const [settings, setSettings] = useState<AppSettings>({
    mode: 'direct', 
    backendUrl: 'http://localhost:8000',
    ragProvider: 'gemini'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setError(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: userText,
      timestamp: new Date()
    };
    
    // Placeholder for model response
    const tempModelId = (Date.now() + 1).toString();
    const modelMsgPlaceholder: Message = {
      id: tempModelId,
      role: "model",
      text: "", 
      timestamp: new Date(),
      mode: settings.mode
    };

    setMessages(prev => [...prev, userMsg, modelMsgPlaceholder]);
    setIsLoading(true);

    try {
      if (settings.mode === 'direct') {
        // --- DIRECT MODE (GEMINI API) ---
        // VITE SPECIFIC: Utilisation de import.meta.env
        const apiKey = import.meta.env.VITE_API_KEY;
        if (!apiKey) throw new Error("Clé API manquante dans le fichier .env");

        const ai = new GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: "You are a helpful, clever, and expert AI assistant. Responses should be concise and formatted beautifully using Markdown.",
          }
        });

        const resultStream = await chat.sendMessageStream({ message: userText });
        let fullText = "";
        
        for await (const chunk of resultStream) {
          const chunkText = (chunk as GenerateContentResponse).text;
          if (chunkText) {
            fullText += chunkText;
            setMessages(prev => prev.map(msg => 
              msg.id === tempModelId ? { ...msg, text: fullText } : msg
            ));
          }
        }
      } else {
        // --- RAG MODE (BACKEND PYTHON) ---
        const response = await fetch(`${settings.backendUrl.replace(/\/$/, '')}/qa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: userText,
            top_k: 5,
            use_rerank: true,
            provider: settings.ragProvider
          }),
        });

        if (!response.ok) throw new Error(`Backend Error: ${response.status}`);

        const data = await response.json();
        
        setMessages(prev => prev.map(msg => 
          msg.id === tempModelId ? { 
            ...msg, 
            text: data.answer || "No answer returned.",
            sources: data.sources || []
          } : msg
        ));
      }

    } catch (err: any) {
      console.error(err);
      let errorMsg = "Failed to generate response.";
      if (settings.mode === 'rag' && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
        errorMsg = `Impossible de contacter le serveur Balthazar sur ${settings.backendUrl}. Vérifiez que le backend Python tourne.`;
      } else if (settings.mode === 'direct') {
        errorMsg = `Erreur Gemini API: ${err.message}`;
      }
      setError(errorMsg);
      setMessages(prev => prev.filter(msg => msg.id !== tempModelId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} currentMode={settings.mode} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
              <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 max-w-lg">
                <h2 className="text-3xl font-bold mb-3 text-white">Gemini Dashboard</h2>
                <p className="text-slate-500 text-sm">Prêt à discuter ou à chercher dans vos documents.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
              {isLoading && messages[messages.length - 1].text.length === 0 && (
                <div className="flex gap-4 items-center text-slate-400">
                   <Loader2 className="w-5 h-5 animate-spin" /> Génération...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          {error && <div className="p-4 text-red-400 bg-red-900/20 rounded-lg">{error}</div>}
        </div>
      </main>
      <footer className="p-4 bg-slate-900/90 border-t border-slate-800">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="w-full bg-slate-800 text-slate-100 rounded-2xl p-4 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
          />
          <button onClick={handleSend} className="absolute right-3 bottom-3 p-2 text-blue-400 hover:text-white">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;