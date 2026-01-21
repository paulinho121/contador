
import React, { useState, useEffect, useRef } from 'react';
import { geminiLiveService } from '../services/geminiLiveService';

interface VoiceConsultantProps {
    context: string;
}

const VoiceConsultant: React.FC<VoiceConsultantProps> = ({ context }) => {
    const [isCalling, setIsCalling] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
    const [transcript, setTranscript] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const transcriptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

    const handleStartCall = async () => {
        setIsCalling(true);
        await geminiLiveService.connect(
            (text) => setTranscript(prev => prev + '\n' + text),
            (s) => setStatus(s)
        );
        await geminiLiveService.startMic();
    };

    const handleEndCall = () => {
        geminiLiveService.disconnect();
        setIsCalling(false);
        setStatus('idle');
        setTranscript('');
    };

    if (!isCalling) {
        return (
            <button
                onClick={handleStartCall}
                className="group relative flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" md:width="20" md:height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" /><circle cx="17" cy="7" r="5" /></svg>
                <span className="text-xs md:text-sm uppercase tracking-wider">
                    <span className="hidden sm:inline">CONSULTA POR </span>VOZ
                </span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[600px] border border-white/20">
                {/* Header */}
                <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/30">
                                DR
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-slate-900 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Dr. Contador</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                {status === 'connected' ? 'Em Chamada • Tempo Real' : 'Conectando ao Gabinete...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {status}
                        </div>
                    </div>
                </div>

                {/* Visualizer & Transcript */}
                <div className="flex-1 bg-slate-50 p-8 flex flex-col gap-6 relative overflow-hidden">
                    {/* Wave Visualizer Mockup */}
                    <div className="flex justify-center items-center gap-1.5 h-24">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 rounded-full bg-indigo-600/30 ${status === 'connected' ? 'animate-bounce' : ''}`}
                                style={{
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.05}s`,
                                    animationDuration: '0.8s'
                                }}
                            />
                        ))}
                    </div>

                    <div
                        ref={transcriptRef}
                        className="flex-1 overflow-y-auto bg-white rounded-3xl p-6 border border-slate-200 shadow-inner flex flex-col gap-4 text-slate-600 text-sm leading-relaxed"
                    >
                        {transcript ? (
                            transcript.split('\n').filter(t => t.trim()).map((t, i) => (
                                <div key={i} className="animate-fade-in">
                                    <span className="font-bold text-indigo-600">Dr. Contador:</span> {t}
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-center items-center text-center italic opacity-40">
                                Aguardando início da consulta... Fale qualquer dúvida agora.
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="p-8 border-t border-slate-100 flex items-center justify-center gap-6 bg-white">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isMuted ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" x2="23" y1="1" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><path d="M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2" /><path d="M20 10v2a7 7 0 0 1-.11 1.23" /><line x1="12" x2="12" y1="19" y2="23" /><line x1="8" x2="16" y1="23" y2="23" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="23" /><line x1="8" x2="16" y1="23" y2="23" /></svg>
                        )}
                    </button>

                    <button
                        onClick={handleEndCall}
                        className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-[2rem] flex items-center justify-center transition-all shadow-xl shadow-red-200 active:scale-90"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    </button>

                    <button className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceConsultant;
