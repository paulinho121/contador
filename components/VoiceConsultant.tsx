
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { geminiLiveService } from '../services/geminiLiveService';
import { VOICE_INSTRUCTION } from '../services/geminiService';

interface VoiceConsultantProps {
    context: string;
    isSelectionMode?: boolean;
}

const VoiceConsultant: React.FC<VoiceConsultantProps> = ({ context, isSelectionMode }) => {
    const [isCalling, setIsCalling] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
    const [volume, setVolume] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const sphereCanvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const handleStartCall = async () => {
        setIsCalling(true);
        const systemInstruction = context
            ? `${VOICE_INSTRUCTION}\n\n[CONTEXTO DA BASE DE CONHECIMENTO]:\n${context}`
            : VOICE_INSTRUCTION;

        await geminiLiveService.connect(
            () => { },
            (s) => setStatus(s),
            systemInstruction
        );
        await geminiLiveService.startMic();
        startAudioAnalysis();
    };

    const startAudioAnalysis = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;

            animateSphere();
        } catch (err) {
            console.error("Audio analysis failed:", err);
        }
    };

    const animateSphere = () => {
        if (!analyserRef.current || !sphereCanvasRef.current) return;

        const canvas = sphereCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current?.getByteFrequencyData(dataArray);

            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            const normalizedVol = average / 128;
            setVolume(normalizedVol);

            const width = canvas.width = canvas.offsetWidth;
            const height = canvas.height = canvas.offsetHeight;
            const centerX = width / 2;
            const centerY = height / 2;
            const baseRadius = Math.min(width, height) * 0.2;
            const radius = baseRadius + (normalizedVol * baseRadius * 1.5);

            ctx.clearRect(0, 0, width, height);

            // Glow Effect
            ctx.shadowBlur = 50 + (normalizedVol * 100);
            ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';

            // Energy Field
            const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
            gradient.addColorStop(0, 'rgba(192, 132, 252, 0.3)');
            gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.5)');
            gradient.addColorStop(1, 'rgba(126, 34, 206, 0)');

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Core
            ctx.shadowBlur = 30 + (normalizedVol * 50);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.35, 0, Math.PI * 2);
            const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.35);
            coreGradient.addColorStop(0, '#ffffff');
            coreGradient.addColorStop(1, '#a855f7');
            ctx.fillStyle = coreGradient;
            ctx.fill();

            // Dynamic rings
            for (let i = 0; i < 2; i++) {
                const angle = (Date.now() / 800 + (i * Math.PI)) * (1 + normalizedVol);
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radius * 1.5, radius * 0.4, angle, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(192, 132, 252, ${0.1 + normalizedVol * 0.2})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };

        draw();
    };

    const handleEndCall = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();

        geminiLiveService.disconnect();
        setIsCalling(false);
        setStatus('idle');
        setVolume(0);
    };

    if (!isCalling) {
        if (isSelectionMode) {
            return (
                <button
                    onClick={handleStartCall}
                    className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest group-hover:scale-105 transition-transform"
                >
                    Iniciar Protocolo <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </button>
            );
        }

        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-6 animate-fade-in text-white">
            <div className="w-full max-w-4xl h-[80vh] flex flex-col items-center justify-between relative">

                {/* Visualizer Status */}
                <div className="mt-8 flex flex-col items-center gap-2">
                    <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center mb-2 border border-white/5 shadow-2xl shadow-purple-500/20">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-white rounded-xl shadow-lg"></div>
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Sessão Live Dr. Contador</h2>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-purple-500 animate-pulse' : 'bg-amber-500'}`}></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300/60">
                            {status === 'connected' ? 'Conexão Neural Ativa' : 'Sincronizando...'}
                        </span>
                    </div>
                </div>

                {/* Central Energy Sphere */}
                <div className="flex-1 w-full flex items-center justify-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] max-h-[600px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <canvas
                        ref={sphereCanvasRef}
                        className="w-full h-full max-h-[500px]"
                    />
                </div>

                {/* Control Footer */}
                <div className="mb-12 flex flex-col items-center gap-8">
                    <p className="text-purple-200/40 text-[10px] uppercase tracking-[0.5em] font-light animate-pulse">
                        {status === 'connected' ? 'O Dr. Contador está ouvindo...' : 'Aguardando Ativação do Sistema'}
                    </p>

                    <div className="flex items-center gap-10">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${isMuted
                                ? 'bg-red-500/10 border-red-500/30 text-red-100'
                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                        >
                            {isMuted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" x2="23" y1="1" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><path d="M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2" /><path d="M20 10v2a7 7 0 0 1-.11 1.23" /><line x1="12" x2="12" y1="19" y2="23" /><line x1="8" x2="16" y1="23" y2="23" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="23" /><line x1="8" x2="16" y1="23" y2="23" /></svg>
                            )}
                        </button>

                        <button
                            onClick={handleEndCall}
                            className="w-20 h-20 bg-gradient-to-tr from-red-500 to-rose-600 hover:scale-110 text-white rounded-full flex items-center justify-center transition-all shadow-2xl shadow-red-500/40 active:scale-95 group"
                        >
                            <svg className="group-hover:rotate-12 transition-transform" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        </button>

                        <div className="w-14" />
                    </div>
                    <p className="privacy-notice text-[8px] opacity-30 mt-4">Nenhum dado capturado nesta sessão é persistido em nosso banco de dados.</p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default VoiceConsultant;
