/**
 * useGeminiLive — Manages a Gemini Live bidirectional audio session.
 *
 * Uses @google/genai live API directly from the browser with
 * VITE_GEMINI_API_KEY. Audio is captured at 16kHz PCM via AudioWorklet,
 * streamed to Gemini, and responses are played back via AudioContext.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';
const SAMPLE_RATE = 16000;

// Tool declarations that mirror the SMS concierge backend
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

// Simulate tool execution — mirrors what the backend would return
function simulateToolResult(toolName, args) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  switch (toolName) {
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
      return {
        upcoming: [
          { type: 'tee_time', date: 'Saturday Apr 19', time: '7:00 AM', players: 4 },
          { type: 'dining', date: 'Saturday Apr 19', time: '7:00 PM', party: 2 },
        ],
      };
    case 'rsvp_event':
      return { success: true, event: args.event_name, confirmation: `RSVP-${Math.floor(Math.random() * 9000) + 1000}` };
    case 'file_complaint':
      return { success: true, ticket: `SVC-${Math.floor(Math.random() * 9000) + 1000}`, message: 'Complaint filed. Our team will follow up within 24 hours.' };
    case 'send_request_to_club':
      return { success: true, message: 'Request sent to club staff. You will hear back shortly.' };
    default:
      return { success: false, message: 'Unknown tool.' };
  }
}

// Decode base64 PCM audio and enqueue to AudioContext
function base64ToFloat32(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
  return float32;
}

// Convert Float32Array to base64 PCM
function float32ToBase64PCM(float32Array) {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function useGeminiLive({ systemPrompt, memberName = 'Member', onTranscript, onToolCall }) {
  const [status, setStatus] = useState('idle'); // idle | connecting | active | error
  const [error, setError] = useState(null);

  const sessionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const workletNodeRef = useRef(null);
  const playbackQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Drain the audio playback queue
  const drainQueue = useCallback(() => {
    if (isPlayingRef.current || playbackQueueRef.current.length === 0) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    isPlayingRef.current = true;

    const process = () => {
      if (playbackQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        return;
      }
      const float32 = playbackQueueRef.current.shift();
      const buf = ctx.createBuffer(1, float32.length, 24000); // Gemini output is 24kHz
      buf.copyToChannel(float32, 0);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      src.start(startAt);
      nextPlayTimeRef.current = startAt + buf.duration;
      src.onended = process;
    };
    process();
  }, []);

  const start = useCallback(async () => {
    if (!apiKey) {
      setError('VITE_GEMINI_API_KEY not set. Add it to your .env.local file.');
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);

      // Init audio context
      audioCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      nextPlayTimeRef.current = 0;

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
          onopen: () => setStatus('active'),

          onmessage: async (msg) => {
            // Audio response
            const parts = msg.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              if (part.inlineData?.mimeType?.startsWith('audio/')) {
                const float32 = base64ToFloat32(part.inlineData.data);
                playbackQueueRef.current.push(float32);
                drainQueue();
              }
              if (part.text) {
                onTranscript?.({ role: 'assistant', text: part.text });
              }
            }

            // Transcript from input audio
            if (msg.serverContent?.inputTranscription?.text) {
              onTranscript?.({ role: 'user', text: msg.serverContent.inputTranscription.text });
            }
            if (msg.serverContent?.outputTranscription?.text) {
              onTranscript?.({ role: 'assistant', text: msg.serverContent.outputTranscription.text });
            }

            // Tool calls
            const toolCalls = msg.toolCall?.functionCalls ?? [];
            for (const call of toolCalls) {
              const result = simulateToolResult(call.name, call.args || {});
              onToolCall?.({ name: call.name, args: call.args, result });
              // Send tool result back to session
              await session.sendToolResponse({
                functionResponses: [{
                  id: call.id,
                  name: call.name,
                  response: result,
                }],
              });
            }
          },

          onerror: (e) => {
            setError(e?.message || 'Connection error');
            setStatus('error');
          },

          onclose: () => {
            if (status !== 'idle') setStatus('idle');
          },
        },
      });

      sessionRef.current = session;

      // Mic capture via AudioWorklet
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: SAMPLE_RATE, channelCount: 1 } });
      mediaStreamRef.current = stream;

      await audioCtxRef.current.audioWorklet.addModule(
        URL.createObjectURL(new Blob([`
          class MicProcessor extends AudioWorkletProcessor {
            process(inputs) {
              const ch = inputs[0]?.[0];
              if (ch?.length) this.port.postMessage(ch.slice());
              return true;
            }
          }
          registerProcessor('mic-processor', MicProcessor);
        `], { type: 'application/javascript' }))
      );

      const src = audioCtxRef.current.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioCtxRef.current, 'mic-processor');
      worklet.port.onmessage = (e) => {
        if (sessionRef.current && status !== 'idle') {
          const b64 = float32ToBase64PCM(e.data);
          sessionRef.current.sendRealtimeInput({
            media: { mimeType: `audio/pcm;rate=${SAMPLE_RATE}`, data: b64 },
          });
        }
      };
      src.connect(worklet);
      worklet.connect(audioCtxRef.current.destination); // silent node needed to keep worklet alive
      workletNodeRef.current = worklet;

    } catch (err) {
      setError(err.message || 'Failed to start voice session');
      setStatus('error');
    }
  }, [apiKey, systemPrompt, drainQueue, onTranscript, onToolCall]);

  const stop = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    sessionRef.current?.close?.();
    sessionRef.current = null;
    audioCtxRef.current?.close?.();
    audioCtxRef.current = null;
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    setStatus('idle');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { status, error, start, stop };
}
