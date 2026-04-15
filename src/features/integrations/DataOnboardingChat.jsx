/**
 * DataOnboardingChat — AI-powered data import assistant chat component.
 * Renders inside the Integrations page as the "AI Import Assistant" tab.
 *
 * Features:
 * - File drop zone (CSV/XLSX/TSV) with drag-and-drop + click-to-browse
 * - Client-side file parsing (headers, sample rows, row count)
 * - Chat message list with structured blocks (mapping tables, validation, import preview)
 * - Confirm Import button inline when agent proposes import
 * - Auto-scroll, loading indicator, session tracking
 */
import { useState, useRef, useEffect, useCallback } from 'react';

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('swoop_auth_token');
    if (token && token !== 'demo') return { Authorization: `Bearer ${token}` };
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');
    if (user?.clubId?.startsWith('demo_')) return { 'X-Demo-Club': user.clubId };
  } catch { /* ignore */ }
  return { 'X-Demo-Club': 'club_001' };
}

/** Minimal CSV parser — handles quoted fields and newlines inside quotes. */
function parseCSVText(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);
  if (lines.length === 0) return { headers: [], rows: [] };

  const splitRow = (line) => {
    const cells = [];
    let cell = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { q = !q; }
      else if ((c === ',' || c === '\t') && !q) { cells.push(cell.trim()); cell = ''; }
      else { cell += c; }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = splitRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const vals = splitRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

async function parseFile(file) {
  const text = await file.text();
  const { headers, rows } = parseCSVText(text);
  return {
    filename: file.name,
    headers,
    sampleRows: rows.slice(0, 10),
    rowCount: rows.length,
  };
}

/** Render structured blocks inside assistant messages (mapping tables, validation, etc.) */
function MessageContent({ text }) {
  if (!text) return null;
  // Split on markdown-ish table blocks and render them as styled tables
  const parts = text.split(/(\|.+\|(?:\n\|.+\|)*)/g);
  return (
    <div className="text-sm whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('|') && part.includes('|')) {
          const rows = part.trim().split('\n').filter(r => r.trim() && !/^[\|\s-]+$/.test(r));
          if (rows.length === 0) return <span key={i}>{part}</span>;
          const cells = rows.map(r => r.split('|').filter(c => c.trim()).map(c => c.trim()));
          return (
            <div key={i} className="my-2 overflow-x-auto">
              <table className="text-xs border border-swoop-border rounded w-full">
                <thead>
                  <tr className="bg-swoop-row">
                    {(cells[0] || []).map((c, ci) => (
                      <th key={ci} className="px-2 py-1 text-left font-semibold text-swoop-text-muted border-b border-swoop-border">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cells.slice(1).map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-swoop-panel' : 'bg-swoop-row'}>
                      {row.map((c, ci) => (
                        <td key={ci} className="px-2 py-1 border-b border-swoop-border-inset">
                          {/high/i.test(c) ? <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold">{c}</span>
                            : /medium/i.test(c) ? <span className="inline-block px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-semibold">{c}</span>
                            : /low/i.test(c) ? <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-semibold">{c}</span>
                            : c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        // Bold markdown
        const bolded = part.split(/(\*\*[^*]+\*\*)/g).map((seg, si) => {
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return <strong key={si}>{seg.slice(2, -2)}</strong>;
          }
          return <span key={si}>{seg}</span>;
        });
        return <span key={i}>{bolded}</span>;
      })}
    </div>
  );
}

export default function DataOnboardingChat({ clubId, onImportComplete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text, fileParsed) => {
    if (!text.trim() && !fileParsed) return;
    const userMsg = {
      role: 'user',
      text: fileParsed ? `Uploaded: ${fileParsed.filename} (${fileParsed.rowCount} rows)` : text.trim(),
      time: timestamp(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const body = {
        message: text.trim() || `Please analyze this file and suggest a column mapping.`,
        club_id: clubId,
        session_id: sessionId,
      };
      if (fileParsed) {
        body.file_data = fileParsed;
      }
      const res = await fetch('/api/onboarding-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);
      const hasConfirm = /proceed|confirm|ready to import|import preview/i.test(data.response || '');
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.response || data.error || 'No response',
        time: timestamp(),
        showConfirm: hasConfirm,
        toolsCalled: data.tools_called || [],
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}`, time: timestamp() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [clubId, sessionId]);

  const handleFileDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'tsv', 'xlsx', 'txt'].includes(ext)) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Please upload a CSV, TSV, or XLSX file.', time: timestamp() }]);
      return;
    }
    try {
      const parsed = await parseFile(file);
      setFileData(parsed);
      await sendMessage(`I've uploaded ${file.name}`, parsed);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Failed to parse file: ${err.message}`, time: timestamp() }]);
    }
  }, [sendMessage]);

  const handleConfirmImport = useCallback(async () => {
    await sendMessage('Yes, please proceed with the import. Confirm: true.');
  }, [sendMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col bg-swoop-row rounded-xl border border-swoop-border" style={{ height: 'min(700px, 75vh)' }}>
      {/* File drop zone */}
      <div
        className={`flex-shrink-0 border-b border-swoop-border p-4 transition-colors cursor-pointer ${
          dragOver ? 'bg-orange-50 border-orange-300' : 'bg-swoop-panel'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.txt"
          className="hidden"
          onChange={(e) => handleFileDrop(e.target.files)}
        />
        <div className="flex items-center justify-center gap-3 py-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${dragOver ? 'bg-orange-100' : 'bg-swoop-row'}`}>
            <svg className="w-5 h-5 text-swoop-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-swoop-text-2">
              {fileData ? `${fileData.filename} (${fileData.rowCount} rows)` : 'Drop a CSV, XLSX, or TSV file to get started'}
            </div>
            <div className="text-xs text-swoop-text-label">
              {fileData ? 'Drop another file to replace' : 'or click to browse'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <p className="text-swoop-text-muted text-sm text-center max-w-xs">
              Drop a file above or ask me what data your club needs. I'll guide you through the import.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {['What data gaps does my club have?', 'Help me import member data', 'Show recent import history'].map((msg) => (
                <button
                  key={msg}
                  onClick={() => sendMessage(msg)}
                  className="text-left text-sm bg-swoop-panel border border-swoop-border rounded-xl px-4 py-2.5 text-swoop-text-2 hover:bg-swoop-row-hover active:bg-gray-100 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white rounded-br-md'
                : 'bg-swoop-panel text-swoop-text rounded-bl-md shadow-sm border border-swoop-border-inset'
            }`}>
              {msg.role === 'assistant' ? <MessageContent text={msg.text} /> : (
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              )}
              {msg.role === 'assistant' && msg.toolsCalled?.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {msg.toolsCalled.map((t, ti) => (
                    <span key={ti} className="text-[10px] bg-swoop-row text-swoop-text-muted px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {msg.role === 'assistant' && msg.showConfirm && (
                <button
                  onClick={handleConfirmImport}
                  className="mt-2 w-full py-2 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                >
                  Confirm Import
                </button>
              )}
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-orange-200' : 'text-swoop-text-label'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-swoop-panel rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-swoop-border-inset">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-swoop-text-muted">Analyzing</span>
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 bg-swoop-panel border-t border-swoop-border px-3 py-2 flex items-center gap-2 rounded-b-xl"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your data or import..."
          disabled={loading}
          className="flex-1 rounded-full border border-swoop-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent disabled:bg-gray-50"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-orange-600 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
