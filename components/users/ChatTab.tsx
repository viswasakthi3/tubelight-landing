'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { get, post } from '@/lib/client';
import { ago, stamp } from '@/lib/format';
import { DeviceId, Empty, ErrorNote, TierPill } from './bits';

export default function ChatTab({ selectedUser, onSelectUser }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'active'

  const [replyText, setReplyText] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [lightboxItem, setLightboxItem] = useState<any>(null);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxItem) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setLightboxItem(null);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxItem]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const selectedConvoRef = useRef(selectedConvo);
  selectedConvoRef.current = selectedConvo;
  const selectedUserDeviceId = selectedUser?.deviceId;
  const autoSelectedDeviceRef = useRef(null);

  // Fetch conversations list
  const fetchConversations = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoadingList(true);
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('q', search.trim());
      const res = await get(`chat/conversations${queryParams.toString() ? `?${queryParams}` : ''}`);
      if (res?.conversations) {
        setConversations(res.conversations);
        setListError('');

        // If selectedConvo is set, keep its unread count synchronized
        if (selectedConvoRef.current) {
          const updated = res.conversations.find(
            c => c.deviceId === selectedConvoRef.current.deviceId || c.conversationId === selectedConvoRef.current.conversationId
          );
          if (updated) {
            setSelectedConvo(prev => (prev ? { ...prev, ...updated } : prev));
          }
        }
      }
    } catch (err: any) {
      if (!isPolling) setListError(err.message || 'Failed to load conversations.');
    } finally {
      if (!isPolling) setLoadingList(false);
    }
  }, [search]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (recipientId, isPolling = false) => {
    if (!recipientId) return;
    try {
      if (!isPolling) setLoadingMessages(true);
      const res = await get(`chat/conversations/${encodeURIComponent(recipientId)}/messages`);
      if (res?.messages) {
        setMessages(res.messages);
        setMessageError('');
      }
    } catch (err: any) {
      if (!isPolling) setMessageError(err.message || 'Failed to load messages.');
    } finally {
      if (!isPolling) setLoadingMessages(false);
    }
  }, []);

  // Initial fetch and search change
  useEffect(() => {
    fetchConversations(false);
  }, [fetchConversations]);

  // Periodic polling for conversations list (every 6s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchConversations(true);
    }, 6000);
    return () => clearInterval(timer);
  }, [fetchConversations]);

  // Periodic polling for messages in active conversation (every 3s)
  useEffect(() => {
    const recipientId = selectedConvo?.conversationId || selectedConvo?.deviceId;
    if (!recipientId) return;
    const timer = setInterval(() => {
      fetchMessages(recipientId, true);
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedConvo?.conversationId, selectedConvo?.deviceId, fetchMessages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When selectedUser prop changes (e.g. user clicked "Chat with user" from drawer)
  useEffect(() => {
    if (!selectedUserDeviceId) {
      autoSelectedDeviceRef.current = null;
      return;
    }
    // Opening a user from the drawer is a one-time navigation. Selecting also
    // updates conversations, so reselecting on every list update creates a loop.
    if (autoSelectedDeviceRef.current !== selectedUserDeviceId) {
      autoSelectedDeviceRef.current = selectedUserDeviceId;
      const match = conversations.find(c => c.deviceId === selectedUserDeviceId);
      if (match) {
        selectConversation(match);
      } else {
        // Synthesize target conversation
        const target = {
          deviceId: selectedUserDeviceId,
          displayName: selectedUser.name || selectedUser.email || `Device ${selectedUserDeviceId.slice(0, 8)}`,
          email: selectedUser.email || null,
          platform: selectedUser.platform || null,
          tier: selectedUser.tier || 'free',
          status: 'open',
          unreadCount: 0
        };
        selectConversation(target);
      }
    }
  }, [selectedUserDeviceId, selectedUser, conversations]);

  function selectConversation(convo) {
    setSelectedConvo(convo);
    const recipientId = convo.conversationId || convo.deviceId;
    fetchMessages(recipientId, false);
    // Mark as read in local list immediately for snappier UI
    setConversations(prev =>
      prev.map(c => (c.deviceId === convo.deviceId ? { ...c, unreadCount: 0 } : c))
    );
  }

  // Handle image upload from file or paste
  async function handleUploadFile(file) {
    if (!file || !selectedConvo) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files (JPEG, PNG, WebP, GIF) are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large (maximum 10MB).');
      return;
    }

    setIsUploading(true);
    try {
      const recipientId = selectedConvo.conversationId || selectedConvo.deviceId;
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result;
          const match = String(res).match(/^data:.*?;base64,(.*)$/);
          resolve(match ? match[1] : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const previewUrl = URL.createObjectURL(file);
      const res = await post('chat/upload', {
        recipientId,
        filename: file.name,
        mimeType: file.type,
        dataBase64: base64
      });

      if (res?.attachment?.id) {
        setStagedAttachments(prev => [
          ...prev,
          {
            id: res.attachment.id,
            filename: file.name,
            previewUrl,
            byteSize: file.size
          }
        ]);
      }
    } catch (err: any) {
      alert(`Failed to upload image: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  // Handle clipboard paste for images
  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleUploadFile(file);
          return;
        }
      }
    }
  }

  // Send reply message
  async function handleSend(e?: any) {
    e?.preventDefault();
    if (!selectedConvo || isSending) return;

    const content = replyText.trim();
    const attachmentIds = stagedAttachments.map(a => a.id);

    if (!content && attachmentIds.length === 0) return;

    setIsSending(true);
    try {
      const recipientId = selectedConvo.conversationId || selectedConvo.deviceId;
      const res = await post(`chat/conversations/${encodeURIComponent(recipientId)}/messages`, {
        content,
        attachmentIds
      });

      if (res?.message) {
        setMessages(prev => [...prev, res.message]);
        setReplyText('');
        setStagedAttachments([]);
        fetchConversations(true);
      }
    } catch (err: any) {
      alert(`Could not send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  }

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (filter === 'unread') return (c.unreadCount || 0) > 0;
    if (filter === 'active') return Boolean(c.lastMessageAt);
    return true;
  });

  return (
    <div className="chat-layout">
      {/* Sidebar: Conversation List */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-head">
          <div className="chat-search-wrap">
            <input
              type="text"
              className="input search-input"
              placeholder="Search user, email or device…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                ✕
              </button>
            )}
          </div>

          <div className="chat-filter-bar">
            <button
              className={`filter-chip ${filter === 'all' ? 'is-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({conversations.length})
            </button>
            <button
              className={`filter-chip ${filter === 'unread' ? 'is-active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({conversations.filter(c => (c.unreadCount || 0) > 0).length})
            </button>
            <button
              className={`filter-chip ${filter === 'active' ? 'is-active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({conversations.filter(c => Boolean(c.lastMessageAt)).length})
            </button>
          </div>
        </div>

        <div className="chat-sidebar-list">
          {listError && <ErrorNote error={listError} onRetry={() => fetchConversations(false)} />}
          {loadingList && conversations.length === 0 ? (
            <div className="chat-loading-state">
              <span className="live-dot" /> Loading conversations…
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="chat-empty-sidebar">
              <p>No conversations found.</p>
            </div>
          ) : (
            filteredConversations.map(convo => {
              const isSelected =
                selectedConvo &&
                (selectedConvo.deviceId === convo.deviceId ||
                  selectedConvo.conversationId === convo.conversationId);
              const unread = Number(convo.unreadCount) || 0;
              const hasActivity = Boolean(convo.lastMessageAt);

              return (
                <div
                  key={convo.deviceId}
                  className={`chat-convo-item ${isSelected ? 'is-selected' : ''} ${
                    unread > 0 ? 'has-unread' : ''
                  }`}
                  onClick={() => selectConversation(convo)}
                >
                  <div className="chat-avatar">
                    {(convo.displayName || 'U')[0].toUpperCase()}
                    {convo.chatLastSeen && (
                      <span className="chat-presence-dot" title="Native chat active" />
                    )}
                  </div>

                  <div className="chat-convo-info">
                    <div className="chat-convo-top">
                      <span className="chat-convo-name" title={convo.displayName}>
                        {convo.displayName}
                      </span>
                      {convo.lastMessageAt ? (
                        <span className="chat-convo-time">{ago(convo.lastMessageAt)}</span>
                      ) : convo.lastSeen ? (
                        <span className="chat-convo-time cell-faint">{ago(convo.lastSeen)}</span>
                      ) : null}
                    </div>

                    <div className="chat-convo-sub">
                      <span className="chat-convo-snippet">
                        {convo.lastMessageSnippet
                          ? (convo.lastMessageSender === 'admin' ? 'You: ' : '') + convo.lastMessageSnippet
                          : convo.email || convo.deviceId.slice(0, 16) + '…'}
                      </span>
                      {unread > 0 && <span className="chat-unread-badge">{unread}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main: Active Conversation */}
      <section className="chat-main">
        {!selectedConvo ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a user or device from the left panel to read and send messages.</p>
          </div>
        ) : (
          <div className="chat-thread-container">
            {/* Header */}
            <header className="chat-thread-head">
              <div className="chat-thread-user">
                <div className="chat-avatar large">
                  {(selectedConvo.displayName || 'U')[0].toUpperCase()}
                </div>
                <div className="chat-thread-meta">
                  <div className="chat-thread-title">
                    <span className="name-strong">{selectedConvo.displayName}</span>
                    <TierPill tier={selectedConvo.tier} />
                    {selectedConvo.platform && (
                      <span className="pill faint">{selectedConvo.platform}</span>
                    )}
                  </div>
                  <div className="chat-thread-sub">
                    {selectedConvo.email && <span>{selectedConvo.email} · </span>}
                    <span>Device: </span>
                    <DeviceId id={selectedConvo.deviceId} />
                    {selectedConvo.lastSeen && (
                      <span className="cell-faint"> · Active {ago(selectedConvo.lastSeen)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="chat-thread-actions">
                <button
                  className="btn small ghost"
                  onClick={() => {
                    const recipientId = selectedConvo.conversationId || selectedConvo.deviceId;
                    fetchMessages(recipientId, false);
                  }}
                  title="Refresh conversation"
                >
                  ↻ Refresh
                </button>
                {onSelectUser && (
                  <button
                    className="btn small"
                    onClick={() => onSelectUser({ deviceId: selectedConvo.deviceId })}
                  >
                    Inspect user
                  </button>
                )}
              </div>
            </header>

            {/* Messages Stream */}
            <div className="chat-messages-stream">
              {messageError && (
                <ErrorNote
                  error={messageError}
                  onRetry={() => {
                    const recipientId = selectedConvo.conversationId || selectedConvo.deviceId;
                    fetchMessages(recipientId, false);
                  }}
                />
              )}

              {loadingMessages && messages.length === 0 ? (
                <div className="chat-stream-loading">Loading message history…</div>
              ) : messages.length === 0 ? (
                <div className="chat-stream-empty">
                  <p>No messages in this conversation yet.</p>
                  <small>Send a greeting below to reach out to this user.</small>
                </div>
              ) : (
                messages.map(msg => {
                  const isFounder = msg.senderType === 'admin';
                  const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];

                  return (
                    <div
                      key={msg.id}
                      className={`chat-bubble-row ${isFounder ? 'is-founder' : 'is-user'}`}
                    >
                      <div className="chat-bubble">
                        <div className="chat-bubble-sender">
                          {isFounder ? 'Founder (You)' : msg.senderName || selectedConvo.displayName}
                        </div>

                        {msg.content && <div className="chat-bubble-text">{msg.content}</div>}

                        {attachments.length > 0 && (
                          <div className="chat-bubble-attachments">
                            {attachments.map(att => {
                              const imgSrc = `/api/admin/chat/attachments/${att.id}`;
                              const filename = att.filename || 'image.png';
                              const downloadUrl = `${imgSrc}?download=1`;

                              return (
                                <div
                                  key={att.id}
                                  className="chat-attachment-thumb"
                                  onClick={() =>
                                    setLightboxItem({ url: imgSrc, filename, id: att.id })
                                  }
                                  title="Click to enlarge"
                                >
                                  <img
                                    src={imgSrc}
                                    alt={filename}
                                    loading="lazy"
                                  />
                                  <div className="attachment-filename-bar">
                                    <span className="attachment-filename" title={filename}>{filename}</span>
                                    <a
                                      href={downloadUrl}
                                      download={filename}
                                      className="attachment-download-action"
                                      onClick={e => e.stopPropagation()}
                                      title={`Download ${filename}`}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                      </svg>
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="chat-bubble-foot">
                          <span className="chat-bubble-time">{stamp(msg.createdAt)}</span>
                          {isFounder && (
                            <span className="chat-bubble-status">
                              {msg.status === 'read' ? '✓✓ Read' : '✓ Sent'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Staged Attachments Preview */}
            {stagedAttachments.length > 0 && (
              <div className="chat-staged-tray">
                {stagedAttachments.map((att, idx) => (
                  <div key={att.id || idx} className="chat-staged-chip">
                    <img src={att.previewUrl} alt="Staged" />
                    <span className="chat-staged-name">{att.filename}</span>
                    <button
                      className="chat-staged-remove"
                      onClick={() =>
                        setStagedAttachments(prev => prev.filter((_, i) => i !== idx))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Composer */}
            <form className="chat-composer" onSubmit={handleSend}>
              <button
                type="button"
                className="chat-composer-btn"
                title="Attach an image screenshot (JPEG, PNG, WebP)"
                disabled={isUploading || isSending}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? '…' : '📎'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFile(file);
                  e.target.value = '';
                }}
              />

              <textarea
                ref={textareaRef}
                className="chat-composer-input"
                placeholder="Type a message… (Shift+Enter for newline, Enter to send, Paste images directly)"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                disabled={isSending}
              />

              <button
                type="submit"
                className="btn primary chat-send-btn"
                disabled={isSending || (!replyText.trim() && stagedAttachments.length === 0)}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div className="chat-lightbox-overlay" onClick={() => setLightboxItem(null)}>
          <div className="chat-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={lightboxItem.url} alt={lightboxItem.filename || 'Attachment enlarged'} />
            <div className="chat-lightbox-actions">
              <span className="chat-lightbox-name" title={lightboxItem.filename}>{lightboxItem.filename}</span>
              <a
                href={`${lightboxItem.url}?download=1`}
                download={lightboxItem.filename || 'image.png'}
                className="btn small primary chat-lightbox-btn"
                onClick={e => e.stopPropagation()}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Image
              </a>
            </div>
            <button
              type="button"
              className="chat-lightbox-close"
              onClick={() => setLightboxItem(null)}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
