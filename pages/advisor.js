import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';

// Convert file to base64 for sending to API
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SUGGESTED_PROMPTS = [
  { label: 'Is this signal worth posting?', text: 'I got a Blabbing signal about [paste signal here]. Is this strong enough to post on, and if so which brand and what sentiment direction?' },
  { label: 'Review my caption', text: 'Can you review this caption draft and tell me if it\'s hitting the right ICP and voice?\n\n[paste caption here]' },
  { label: 'BMHW strategy', text: 'What should my full content plan look like for Black Maternal Health Week April 11-17? Walk me through each day across all four channels.' },
  { label: 'Hashtag check', text: 'Are these hashtags right for this post? [paste post here]' },
  { label: 'Which brand for this idea?', text: 'I have this idea: [describe it]. Which brand should it come from and why?' },
  { label: 'Carousel topic ideas', text: 'Give me 5 carousel post ideas for Henway that would perform well this month based on what\'s trending.' },
  { label: 'Company page vs personal', text: 'I want to post about [topic]. Should this go on Mike\'s personal profile, the company page, or both? And how should the framing differ?' },
  { label: 'Upload a photo →', text: null, isImagePrompt: true },
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'var(--bg3)', border: '0.5px solid var(--border2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, marginRight: 8, marginTop: 2, color: 'var(--text3)',
        }}>◐</div>
      )}
      <div style={{ maxWidth: '78%' }}>
        {/* Image preview in message if present */}
        {msg.imagePreview && (
          <div style={{ marginBottom: 6, display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <img
              src={msg.imagePreview}
              alt="Uploaded"
              style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, border: '0.5px solid var(--border2)', objectFit: 'cover' }}
            />
          </div>
        )}
        {msg.content && (
          <div style={{
            padding: '10px 14px',
            borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: isUser ? 'var(--text)' : 'var(--bg)',
            color: isUser ? 'var(--bg)' : 'var(--text)',
            border: isUser ? 'none' : '0.5px solid var(--border2)',
            fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap',
          }}>
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Advisor() {
  const [messages, setMessages] = useState([]);
  const [apiMessages, setApiMessages] = useState([]); // parallel array for API calls
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [pendingImage, setPendingImage] = useState(null); // { base64, preview, mediaType }
  const [dragOver, setDragOver] = useState(false);
  const bottomRef = useRef();
  const textareaRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const base64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    setPendingImage({ base64, preview, mediaType: file.type });
    textareaRef.current?.focus();
  }

  async function send(text) {
    const userText = (text || input).trim();
    // Need either text or image
    if (!userText && !pendingImage) return;

    const displayText = userText || (pendingImage ? 'What\'s the best way to use this for content?' : '');
    setInput('');
    setShowSuggestions(false);

    // Build display message (with image preview)
    const displayMsg = {
      role: 'user',
      content: displayText,
      imagePreview: pendingImage?.preview || null,
    };

    // Build API message (with actual base64 if image)
    let apiMsg;
    if (pendingImage) {
      const contentBlocks = [];
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: pendingImage.mediaType,
          data: pendingImage.base64,
        },
      });
      if (displayText) {
        contentBlocks.push({ type: 'text', text: displayText });
      } else {
        contentBlocks.push({
          type: 'text',
          text: 'Analyze this image. Tell me: (1) what you see, (2) which brand in my portfolio this content fits best — MyLÚA, Henway, or Blabbing, (3) what post type would perform best with this content (text post, stat card, quote card, carousel, event card), (4) what the caption hook should be, (5) which channel to post on and when, and (6) suggested hashtags.',
        });
      }
      apiMsg = { role: 'user', content: contentBlocks };
    } else {
      apiMsg = { role: 'user', content: displayText };
    }

    setPendingImage(null);

    const newDisplayMessages = [...messages, displayMsg];
    const newApiMessages = [...apiMessages, apiMsg];
    setMessages(newDisplayMessages);
    setApiMessages(newApiMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newApiMessages }),
      });
      const data = await res.json();
      const replyText = data.reply || 'Something went wrong.';
      const replyMsg = { role: 'assistant', content: replyText };
      setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);
      setApiMessages(prev => [...prev, replyMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Check your API key.' }]);
      setApiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.' }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function reset() {
    setMessages([]);
    setApiMessages([]);
    setShowSuggestions(true);
    setInput('');
    setPendingImage(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleImageFile(file);
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) { handleImageFile(file); e.preventDefault(); }
        break;
      }
    }
  }

  return (
    <Layout title="Advisor" active="advisor">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--bg3)', border: '0.5px solid var(--border2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: 'var(--text2)',
          }}>◐</div>
          <div>
            <div className="page-title">Content Advisor</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
              Strategy · UX · Scheduling · Hashtags · Image analysis
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="btn" onClick={reset} style={{ fontSize: 12, padding: '5px 12px' }}>
            New conversation
          </button>
        )}
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 57px)' }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drop overlay */}
        {dragOver && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              padding: '24px 40px', borderRadius: 14,
              background: 'var(--bg)', border: '1.5px dashed var(--border2)',
              fontSize: 14, fontWeight: 500, color: 'var(--text2)',
            }}>
              Drop image to analyze
            </div>
          </div>
        )}

        {/* Message area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 0' }}>

          {showSuggestions && messages.length === 0 && (
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>What do you need?</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
                  I know your three brands, all the scheduling logic, hashtag strategy, and content frameworks. Upload a photo, screenshot, or graphic and I'll tell you exactly how to use it. Or ask me anything.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => {
                    if (p.isImagePrompt) {
                      fileInputRef.current?.click();
                    } else if (p.text?.includes('[')) {
                      setInput(p.text);
                      textareaRef.current?.focus();
                    } else {
                      send(p.text);
                    }
                  }} style={{
                    padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                    border: p.isImagePrompt ? '1.5px dashed var(--border2)' : '0.5px solid var(--border2)',
                    background: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, color: 'var(--text2)', lineHeight: 1.4, transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'var(--bg2)', border: '0.5px dashed var(--border2)',
                fontSize: 12, color: 'var(--text3)', textAlign: 'center',
              }}>
                You can also drag & drop or paste (⌘V) an image anywhere on this page
              </div>
            </div>
          )}

          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--bg3)',
                  border: '0.5px solid var(--border2)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 12, color: 'var(--text3)', flexShrink: 0,
                }}>◐</div>
                <div style={{
                  padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                  background: 'var(--bg)', border: '0.5px solid var(--border2)',
                  fontSize: 13, color: 'var(--text3)',
                }}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div style={{
          padding: '12px 28px 20px', borderTop: '0.5px solid var(--border2)', background: 'var(--bg)',
        }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>

            {/* Pending image preview */}
            {pendingImage && (
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={pendingImage.preview}
                  alt="Pending"
                  style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '0.5px solid var(--border2)' }}
                />
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text2)' }}>
                  Image attached — add a question or hit Send for automatic analysis
                </div>
                <button onClick={() => setPendingImage(null)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', fontSize: 18, lineHeight: 1, fontFamily: 'inherit',
                }}>×</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {/* Image upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload image"
                style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  border: '0.5px solid var(--border2)', background: 'var(--bg2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, color: 'var(--text3)',
                  fontFamily: 'inherit',
                }}
              >
                ⊕
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleImageFile(e.target.files[0])}
              />

              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={pendingImage ? 'Add a question about this image, or just hit Send...' : 'Ask anything — or paste / drag an image · Shift+Enter for new line'}
                rows={1}
                style={{
                  flex: 1, resize: 'none', fontFamily: 'Inter, sans-serif',
                  fontSize: 13, lineHeight: 1.6, maxHeight: 160, overflow: 'auto',
                  padding: '10px 14px', border: '0.5px solid var(--border2)',
                  borderRadius: 12, background: 'var(--bg2)', color: 'var(--text)',
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || (!input.trim() && !pendingImage)}
                style={{
                  padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: (input.trim() || pendingImage) ? 'var(--text)' : 'var(--bg3)',
                  color: (input.trim() || pendingImage) ? 'var(--bg)' : 'var(--text3)',
                  border: 'none', cursor: (input.trim() || pendingImage) ? 'pointer' : 'default',
                  fontFamily: 'inherit', flexShrink: 0, height: 42,
                }}
              >
                Send
              </button>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text3)' }}>
              ⊕ attach image · drag & drop · paste ⌘V · Knows all three brands + strategy rules
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
