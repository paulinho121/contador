import { VOICE_INSTRUCTION } from './geminiService';

export class GeminiLiveService {
    private socket: WebSocket | null = null;
    private audioContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;
    private onMessageCallback: (text: string) => void = () => { };
    private onStatusCallback: (status: 'connected' | 'disconnected' | 'connecting') => void = () => { };
    private systemInstruction: string = VOICE_INSTRUCTION;
    private audioQueue: Int16Array[] = [];
    private isProcessingQueue = false;

    constructor() { }

    async connect(onMessage: (text: string) => void, onStatus: (status: any) => void, systemInstruction?: string) {
        this.onMessageCallback = onMessage;
        this.onStatusCallback = onStatus;
        if (systemInstruction) {
            this.systemInstruction = systemInstruction;
        }

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
        if (!apiKey) {
            console.error("API Key missing");
            return;
        }

        this.onStatusCallback('connecting');

        // Use v1beta and lowercase 'd' in BidiGenerateContent as per official specs and successful tests
        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        console.log("Connecting to WebSocket:", url.replace(apiKey, "HIDDEN_KEY"));

        this.socket = new WebSocket(url);
        // Ensure binary data is handled correctly
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = () => {
            console.log("WebSocket Connection Opened Successfully");
            this.onStatusCallback('connected');
            this.sendSetup();
        };

        this.socket.onmessage = async (event) => {
            try {
                let messageData = event.data;

                // Handle ArrayBuffer (binary frames)
                if (messageData instanceof ArrayBuffer) {
                    const decoder = new TextDecoder();
                    const text = decoder.decode(messageData);

                    // Check if it's a JSON string sent in a binary frame
                    if (text.startsWith('{') || text.startsWith('[')) {
                        try {
                            const response = JSON.parse(text);
                            this.handleJsonResponse(response);
                            return;
                        } catch (e) {
                            // If not JSON, it might be raw audio
                            console.warn("ArrayBuffer content looked like JSON but failed to parse, treating as audio:", e);
                        }
                    }

                    // If it's pure binary and not JSON, it's raw PCM audio
                    this.playAudioOutputFromBuffer(messageData);
                    return;
                }

                // Handle string data (text frames)
                const response = JSON.parse(messageData);
                this.handleJsonResponse(response);

            } catch (err) {
                console.error("Error processing message:", err);
            }
        };

        this.socket.onclose = (event) => {
            console.error("WebSocket Connection Closed:", event.code, event.reason);
            this.onStatusCallback('disconnected');
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket Error Handshake:", error);
        };
    }

    private handleJsonResponse(response: any) {
        console.log("Gemini Live Response:", response);

        if (response.setupComplete) {
            console.log("Gemini Live Session Setup Complete");
        }

        if (response.serverContent) {
            if (response.serverContent.modelTurn) {
                const parts = response.serverContent.modelTurn.parts;
                for (const part of parts) {
                    if (part.text) {
                        this.onMessageCallback(part.text);
                    }
                    if (part.inlineData && part.inlineData.mimeType.includes('audio/pcm')) {
                        this.playAudioOutput(part.inlineData.data);
                    }
                }
            }
            if (response.serverContent.interrupted) {
                this.stopAudioOutput();
            }
        }
    }

    private playAudioOutputFromBuffer(buffer: ArrayBuffer) {
        // Ensure byteLength is even for Int16Array
        if (buffer.byteLength % 2 !== 0) {
            console.warn("Received odd-length audio buffer, trimming 1 byte");
            buffer = buffer.slice(0, buffer.byteLength - 1);
        }

        const pcmData = new Int16Array(buffer);
        this.audioQueue.push(pcmData);
        if (!this.isProcessingQueue) {
            this.processAudioQueue();
        }
    }

    private sendSetup() {
        // Updated to match the requested Python script configuration
        const safeInstruction = this.systemInstruction.length > 150000
            ? this.systemInstruction.substring(0, 150000) + "... [CONTEÚDO TRUNCADO]"
            : this.systemInstruction;

        const setup = {
            setup: {
                model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
                generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: {
                                voice_name: "Charon"
                            }
                        }
                    },
                    media_resolution: "MEDIA_RESOLUTION_MEDIUM"
                },
                system_instruction: {
                    parts: [{
                        text: safeInstruction
                    }]
                },
                context_window_compression: {
                    trigger_tokens: 25600,
                    sliding_window: {
                        target_tokens: 12800
                    }
                }
            }
        };
        console.log("Sending Setup Message (Multimodal):", JSON.stringify({ ...setup, setup: { ...setup.setup, system_instruction: { parts: [{ text: safeInstruction.substring(0, 50) + "..." }] } } }));
        this.socket?.send(JSON.stringify(setup));
    }

    sendVideoFrame(base64Image: string, mimeType: string = "image/jpeg") {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                realtime_input: {
                    media_chunks: [{
                        mime_type: mimeType,
                        data: base64Image
                    }]
                }
            }));
        }
    }

    async startMic() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext({ sampleRate: 16000 });
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            // ScriptProcessor is deprecated but widely supported for this use case
            // If it fails, we might need a Worklet, but let's keep it for compatibility
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
