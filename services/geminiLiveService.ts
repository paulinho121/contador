
export class GeminiLiveService {
    private socket: WebSocket | null = null;
    private audioContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;
    private onMessageCallback: (text: string) => void = () => { };
    private onStatusCallback: (status: 'connected' | 'disconnected' | 'connecting') => void = () => { };
    private audioQueue: Int16Array[] = [];
    private isProcessingQueue = false;

    constructor() { }

    async connect(onMessage: (text: string) => void, onStatus: (status: any) => void) {
        this.onMessageCallback = onMessage;
        this.onStatusCallback = onStatus;

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.error("API Key missing");
            return;
        }

        this.onStatusCallback('connecting');

        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiGenerateContent?key=${apiKey}`;

        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log("WebSocket Connected");
            this.onStatusCallback('connected');
            this.sendSetup();
        };

        this.socket.onmessage = async (event) => {
            const response = JSON.parse(event.data);

            if (response.serverContent) {
                if (response.serverContent.modelTurn) {
                    const parts = response.serverContent.modelTurn.parts;
                    for (const part of parts) {
                        if (part.text) {
                            this.onMessageCallback(part.text);
                        }
                        if (part.inlineData && part.inlineData.mimeType === 'audio/pcm;rate=24000') {
                            this.playAudioOutput(part.inlineData.data);
                        }
                    }
                }
                if (response.serverContent.interrupted) {
                    this.stopAudioOutput();
                }
            }
        };

        this.socket.onclose = () => {
            this.onStatusCallback('disconnected');
        };
    }

    private sendSetup() {
        const setup = {
            setup: {
                model: "models/gemini-2.0-flash-exp", // Using flash for low latency live audio
                generationConfig: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: {
                                voice_name: "Aoede" // Natural sounding voice
                            }
                        }
                    }
                },
                systemInstruction: {
                    parts: [{
                        text: "Você é o Dr. Contador, um especialista em contabilidade brasileira. Você está em uma chamada de vídeo/áudio em tempo real. Responda de forma concisa, educada e extremamente profissional. Use as informações de contexto que eu te enviar."
                    }]
                }
            }
        };
        this.socket?.send(JSON.stringify(setup));
    }

    async startMic() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext({ sampleRate: 16000 });
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = this.floatTo16BitPCM(inputData);
                this.sendAudioInput(pcm16);
            };
        } catch (err) {
            console.error("Error accessing mic:", err);
        }
    }

    private sendAudioInput(pcmData: Int16Array) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
            this.socket.send(JSON.stringify({
                realtime_input: {
                    media_chunks: [{
                        mime_type: "audio/pcm;rate=16000",
                        data: base64
                    }]
                }
            }));
        }
    }

    private floatTo16BitPCM(input: Float32Array): Int16Array {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    }

    private playAudioOutput(base64Data: string) {
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const pcmData = new Int16Array(bytes.buffer);
        this.audioQueue.push(pcmData);

        if (!this.isProcessingQueue) {
            this.processAudioQueue();
        }
    }

    private async processAudioQueue() {
        if (this.audioQueue.length === 0 || !this.audioContext) {
            this.isProcessingQueue = false;
            return;
        }

        this.isProcessingQueue = true;
        const pcmData = this.audioQueue.shift()!;

        // Create an AudioBuffer for 24kHz Mono PCM
        const buffer = this.audioContext.createBuffer(1, pcmData.length, 24000);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < pcmData.length; i++) {
            channelData[i] = pcmData[i] / 32768.0;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        source.onended = () => {
            this.processAudioQueue();
        };

        source.start();
    }

    private stopAudioOutput() {
        this.audioQueue = [];
        this.isProcessingQueue = false;
    }

    disconnect() {
        this.socket?.close();
        this.stream?.getTracks().forEach(t => t.stop());
        this.audioContext?.close();
    }
}

export const geminiLiveService = new GeminiLiveService();
