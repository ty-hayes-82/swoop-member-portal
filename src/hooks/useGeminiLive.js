/**
 * useGeminiLive — Gemini 3.1 Flash Live bidirectional audio session.
 *
 * Architecture:
 * - INPUT:  MediaStream → AudioWorklet (16kHz PCM) → base64 → session.sendRealtimeInput
 * - OUTPUT: session onmessage audio chunks → AudioContext queue → speaker playback
 *
 * Two separate AudioContexts are used: inputCtx at 16kHz for mic capture,
 * outputCtx at system default (typically 44.1/48kHz) for playback so the
 * browser can resample Gemini's 24kHz output cleanly.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000; // Gemini Live outputs 24kHz PCM

// Tool declarations matching the SMS concierge backend
const CONCIERGE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'book_tee_time',
        description: 'Book a tee time for the member at the club.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
            time: { type: 'string', description: 'Time in HH:MM 24h format' },
            players: { type: 'number', description: 'Number of players (1-4)' },
            notes: { type: 'string', description: 'Special requests' },
          },
          required: ['date', 'time'],
        },
      },
      {
        name: 'cancel_tee_time',
        description: 'Cancel an existing tee time booking.',
        parameters: {
          type: 'object',
          properties: {
            booking_id: { type: 'string', description: 'Booking ID to cancel' },
            date: { type: 'string', description: 'Date of the booking' },
          },
        },
      },
      {
        name: 'make_dining_reservation',
        description: 'Make a dining reservation at the club restaurant.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
            time: { type: 'string', description: 'Time in HH:MM format' },
            party_size: { type: 'number', description: 'Number of guests' },
            notes: { type: 'string', description: 'Special requests or dietary needs' },
          },
          required: ['date', 'time', 'party_size'],
        },
      },
      {
        name: 'get_club_calendar',
        description: 'Get upcoming club events and activities.',
        parameters: {
          type: 'object',
          properties: {
            days_ahead: { type: 'number', description: 'How many days ahead to look' },
          },
        },
      },
      {
        name: 'get_my_schedule',
        description: "Get the member's upcoming bookings and reservations.",
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'rsvp_event',
        description: 'RSVP the member to a club event.',
        parameters: {
          type: 'object',
          properties: {
            event_id: { type: 'string', description: 'Event ID' },
            event_name: { type: 'string', description: 'Event name' },
            guests: { type: 'number', description: 'Number of guests including member' },
          },
          required: ['event_name'],
        },
      },
      {
        name: 'file_complaint',
        description: 'File a service complaint or feedback with the club.',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Category: dining/golf/facilities/service' },
            description: { type: 'string', description: 'Detailed description' },
            severity: { type: 'string', description: 'low/medium/high' },
          },
          required: ['description'],
        },
      },
      {
        name: 'send_request_to_club',
        description: 'Send a general request or message to club staff.',
        parameters: {
          type: 'object',
          properties: {
            department: { type: 'string', description: 'pro_shop/dining/facilities/management' },
            message: { type: 'string', description: 'The request message' },
          },
          required: ['message'],
        },
      },
    ],
  },
];

// Simulate tool results for the demo
function simulateToolResult(name, args = {}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  switch (name) {
    case 'book_tee_time':
      return { success: true, confirmation: `TEE-${Math.floor(Math.random() * 9000) + 1000}`, date: args.date || dateStr, time: args.time || '8:00 AM', players: args.players || 2 };
    case 'cancel_tee_time':
      return { success: true, message: 'Tee time cancelled successfully.' };
    case 'make_dining_reservation':
      return { success: true, confirmation: `RES-${Math.floor(Math.random() * 9000) + 1000}`, date: args.date || dateStr, time: args.time || '7:00 PM', party_size: args.party_size || 2 };
    case 'get_club_calendar':
      return {
        events: [
          { name: 'Member-Guest Tournament', date: 'Saturday Apr 19', time: '8:00 AM', type: 'golf' },
          { name: 'Spring Wine Dinner', date: 'Friday Apr 25', time: '7:00 PM', type: 'dining' },
          { name: 'Couples Mixer', date: 'Sunday Apr 27', time: '5:00 PM', type: 'social' },
        ],
      };
    case 'get_my_schedule':
      return { upcoming: [{ type: 'tee_time', date: 'Saturday Apr 19', time: '7:00 AM', players: 4 }] };
    case 'rsvp_event':
      return { success: true, event: args.event_name, confirmation: `RSVP-${Math.floor(Math.random() * 9000) + 1000}` };
    case 'file_complaint':
      return { success: true, ticket: `SVC-${Math.floor(Math.random() * 9000) + 1000}`, message: 'Complaint filed. Our team will follow up within 24 hours.' };
    case 'send_request_to_club':
      return { success: true, message: 'Request sent to club staff.' };
    default:
      return { success: false, message: 'Unknown tool.' };
  }
}

// Decode base64 PCM16 → Float32 for Web Audio playback
function pcm16Base64ToFloat32(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;
  return float32;
}

// Encode Float32 mic audio → base64 PCM16
function float32ToPcm16Base64(float32) {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function useGeminiLive({ systemPrompt, onTranscript, onToolCall }) {
  const [status, setStatus] = useState('idle'); // idle | connecting | active | error
  const [error, setError] = useState(null);

  const sessionRef = useRef(null);
  const inputCtxRef = useRef(null);   // 16kHz — mic capture only
  const outputCtxRef = useRef(null);  // system rate — playback
  const mediaStreamRef = useRef(null);
  const workletNodeRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const playbackQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Drain audio playback queue sequentially
  const drainQueue = useCallback(() => {
    if (isPlayingRef.current || playbackQueueRef.current.length === 0) return;
    const ctx = outputCtxRef.current;
    if (!ctx || ctx.state === 'closed') return;
    isPlayingRef.current = true;

    const scheduleNext = () => {
      if (playbackQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        return;
      }
      const float32 = playbackQueueRef.current.shift();
      const buf = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
      buf.copyToChannel(float32, 0);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      src.start(startAt);
      nextPlayTimeRef.current = startAt + buf.duration;
      src.onended = scheduleNext;
    };
    scheduleNext();
  }, []);

  const stop = useCallback(() => {
    // Disconnect mic worklet
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    mediaSourceRef.current?.disconnect();
    mediaSourceRef.current = null;
    // Stop mic track
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    // Close session
    try { sessionRef.current?.close?.(); } catch (_) {}
    sessionRef.current = null;
    // Close audio contexts
    try { inputCtxRef.current?.close(); } catch (_) {}
    inputCtxRef.current = null;
    try { outputCtxRef.current?.close(); } catch (_) {}
    outputCtxRef.current = null;
    // Reset playback state
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    setStatus('idle');
    setError(null);
  }, []);

  const start = useCallback(async () => {
    if (!apiKey) {
      setError('Add VITE_GEMINI_API_KEY to .env.local and restart the dev server.');
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);

      // Output AudioContext — system default sample rate, no forced 16kHz
      outputCtxRef.current = new AudioContext();
      nextPlayTimeRef.current = 0;

      // Connect to Gemini 3.1 Flash Live
      const genAI = new GoogleGenAI({ apiKey });

      const session = await genAI.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemPrompt,
          tools: CONCIERGE_TOOLS,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          },
        },
        callbacks: {
          onopen: () => {
            setStatus('active');
          },

          onmessage: async (msg) => {
            // Audio response chunks
            const parts = msg.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              if (part.inlineData?.mimeType?.startsWith('audio/')) {
                const float32 = pcm16Base64ToFloat32(part.inlineData.data);
                playbackQueueRef.current.push(float32);
                drainQueue();
              }
              if (part.text) {
                onTranscript?.({ role: 'assistant', text: part.text });
              }
            }

            // Transcriptions
            const inputText = msg.serverContent?.inputTranscription?.text;
            const outputText = msg.serverContent?.outputTranscription?.text;
            if (inputText) onTranscript?.({ role: 'user', text: inputText });
            if (outputText) onTranscript?.({ role: 'assistant', text: outputText });

            // Tool calls — respond immediately
            const functionCalls = msg.toolCall?.functionCalls ?? [];
            for (const fc of functionCalls) {
              const result = simulateToolResult(fc.name, fc.args || {});
              onToolCall?.({ name: fc.name, args: fc.args, result, id: fc.id });
              session.sendToolResponse({
                functionResponses: [{
                  id: fc.id,
                  name: fc.name,
                  response: result,
                }],
              });
            }
          },

          onerror: (e) => {
            setError(e?.message || String(e) || 'Connection error');
            setStatus('error');
          },

          onclose: (e) => {
            if (e?.code !== 1000) {
              setError(`Session closed: ${e?.reason || 'unknown'}`);
              setStatus('error');
            } else {
              setStatus('idle');
            }
          },
        },
      });

      sessionRef.current = session;

      // Mic capture — separate 16kHz AudioContext to avoid polluting output
      inputCtxRef.current = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: INPUT_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // AudioWorklet for low-latency mic → base64 PCM pipeline
      const workletCode = `
        class MicCapture extends AudioWorkletProcessor {
          process(inputs) {
            const ch = inputs[0]?.[0];
            if (ch?.length) this.port.postMessage(ch.slice());
            return true;
          }
        }
        registerProcessor('mic-capture', MicCapture);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await inputCtxRef.current.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      const source = inputCtxRef.current.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(inputCtxRef.current, 'mic-capture');

      // Route mic audio to Gemini — do NOT connect to destination (prevents feedback)
      worklet.port.onmessage = ({ data }) => {
        if (sessionRef.current && status !== 'idle') {
          session.sendRealtimeInput({
            audio: {
              data: float32ToPcm16Base64(data),
              mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
            },
          });
        }
      };

      // Source → worklet only; worklet is NOT connected to destination
      source.connect(worklet);
      mediaSourceRef.current = source;
      workletNodeRef.current = worklet;

    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg.includes('Permission denied') ? 'Microphone access denied. Allow mic access and try again.' : msg);
      setStatus('error');
      stop();
    }
  }, [apiKey, systemPrompt, drainQueue, onTranscript, onToolCall, stop]);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { status, error, start, stop };
}
