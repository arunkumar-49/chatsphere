import { useState, useRef, useEffect, useCallback } from 'react';
import EmojiPicker from '../UI/EmojiPicker';
import api from '../../api/axios';
import useUIStore from '../../store/uiStore';
import useSocket from '../../hooks/useSocket';
import useChatStore from '../../store/chatStore';

export default function MessageInput({ channelId }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const { editingMessage, clearEditingMessage } = useUIStore();
  const { sendMessage, startTyping, stopTyping, editMessage } = useSocket();
  const { addMessage } = useChatStore();

  // Pre-fill textarea when editing
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-resize textarea
  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const handleTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      startTyping(channelId);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      stopTyping(channelId);
    }, 2000);
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    autoResize();
    handleTyping();
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleEmojiSelect = (emoji) => {
    setContent((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = content.trim();

    // Handle edit mode
    if (editingMessage) {
      if (!trimmed) return;
      editMessage(editingMessage._id, trimmed);
      clearEditingMessage();
      setContent('');
      return;
    }

    if (!trimmed && !file) return;
    setIsSubmitting(true);

    try {
      if (file) {
        // HTTP upload for files
        const formData = new FormData();
        if (trimmed) formData.append('content', trimmed);
        formData.append('file', file);

        const { data } = await api.post(`/messages/${channelId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addMessage(data.message);
      } else {
        // Socket for text
        sendMessage({ channelId, content: trimmed, type: 'text' });
      }

      setContent('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      // Stop typing
      stopTyping(channelId);
      isTypingRef.current = false;
      clearTimeout(typingTimerRef.current);
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && editingMessage) {
      clearEditingMessage();
      setContent('');
    }
  };

  return (
    <div className="input-area">
      {/* Edit mode banner */}
      {editingMessage && (
        <div className="edit-box">
          <span>✏️ Editing message</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { clearEditingMessage(); setContent(''); }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* File preview */}
      {file && (
        <div className="file-preview">
          <span>{file.type.startsWith('image/') ? '🖼️' : '📎'}</span>
          <span>{file.name}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            ({(file.size / 1024).toFixed(1)} KB)
          </span>
          <button className="file-preview-remove" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
            ✕
          </button>
        </div>
      )}

      <div className="input-wrapper">
        {/* Attach file */}
        <button
          className="input-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          type="button"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*,.pdf,.txt,.doc,.docx,.zip"
        />

        {/* Message textarea */}
        <textarea
          ref={textareaRef}
          id="message-input"
          placeholder={editingMessage ? 'Edit message...' : 'Type a message... (Enter to send, Shift+Enter for newline)'}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        {/* Emoji picker toggle */}
        <button
          className="input-btn"
          onClick={() => setShowEmoji(!showEmoji)}
          title="Add emoji"
          type="button"
        >
          😊
        </button>

        {/* Send button */}
        <button
          id="send-message-btn"
          className="input-btn send-btn"
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && !file)}
          title="Send message"
          type="button"
        >
          {isSubmitting ? '⏳' : '➤'}
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmoji && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setShowEmoji(false)}
          />
          <EmojiPicker onSelect={handleEmojiSelect} />
        </>
      )}
    </div>
  );
}
