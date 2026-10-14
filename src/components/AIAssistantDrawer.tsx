import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  HelpCircle,
  TrendingDown,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Search,
  ChevronRight,
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { aiService, AuditSummaryResult } from '../services/aiService';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectItemForCount?: (item: InventoryItem) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItemForCount,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Halo! Saya **InvenTrack AI**, asisten cerdas inventaris Anda. Anda bisa bertanya tentang ringkasan stok opname hari ini, barang dengan selisih terbesar, lokasi rak barang tertentu, atau meminta analisis audit otomatis. Ada yang bisa saya bantu?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditSummaryResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const historyForAI = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await aiService.chatWithAssistant(historyForAI, items);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.reply,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);

    const result = await aiService.generateAuditSummary(items);
    setAuditResult(result);
    setIsAuditing(false);
  };

  const quickPrompts = [
    {
      label: '📊 Analisis Selisih Terbesar',
      prompt: 'Tolong analisis 5 barang yang selisihnya paling besar dan beri saran investigasinya.',
    },
    {
      label: '📍 Cek Status Progres Opname',
      prompt: 'Berapa persen barang yang sudah dihitung dan berapa yang belum tersentuh sama sekali?',
    },
    {
      label: '⚠️ Deteksi Anomali Stok',
      prompt: 'Apakah ada indikasi anomali stok, seperti stok fisik 0 padahal di sistem banyak, atau potensi double input?',
    },
    {
      label: '💡 Tips Akurasi Hitung Gudang',
      prompt: 'Bagaimana SOP terbaik agar tim penghitung tidak salah hitung atau dobel input saat stock opname?',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  InvenTrack AI Assistant
                </h3>
                <span className="text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Gemini Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Membaca {items.length} data master & opname secara real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              title="Buat Laporan Audit Eksekutif Instan"
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {isAuditing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-200" />
              )}
              <span className="hidden sm:inline">Audit AI</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit Results Banner if triggered */}
        {auditResult && (
          <div className="p-4 bg-indigo-50/90 border-b border-indigo-200 max-h-64 overflow-y-auto space-y-2.5 text-xs text-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                Hasil Laporan Audit Eksekutif
              </span>
              <button
                onClick={() => setAuditResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              {auditResult.ringkasanStatus}
            </p>
            {auditResult.poinPenting && auditResult.poinPenting.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {auditResult.poinPenting.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            )}
            {auditResult.barangPerluAuditUlang && auditResult.barangPerluAuditUlang.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Prioritas Audit Ulang:</span>
                <div className="space-y-1">
                  {auditResult.barangPerluAuditUlang.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-indigo-200/60 flex items-center justify-between">
                      <span className="truncate"><b>{item.kodeStok}</b>: {item.namaStok}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 shrink-0 ml-1">
                        {item.prioritas}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat message history */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
          {/* Quick Prompts Bar */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pertanyaan Cepat:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(qp.prompt)}
                  className="text-left p-2 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/40 text-[11px] text-slate-700 font-medium transition-all shadow-2xs"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-xs text-slate-500">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>InvenTrack AI sedang menganalisis data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tanyakan analisis stok, barang, atau rekomendasi..."
              className="flex-1 py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors shadow-2xs shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-slate-400 text-center mt-2">
            InvenTrack AI ditenagai Google Gemini 3.8 Flash • Menjaga integritas data opname
          </div>
        </div>

      </div>
    </div>
  );
};
