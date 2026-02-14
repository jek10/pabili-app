/**
 * Chat Component
 * Simple messaging between customer and agent for a specific errand
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function Chat({ errand, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load messages when chat opens
  useEffect(() => {
    loadMessages();

    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
  }, [errand.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(
        `
         *,
         sender:users!messages_sender_id_fkey(name, user_type)
       `
      )
      .eq('errand_id', errand.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setIsSending(true);

    const { error } = await supabase.from('messages').insert([
      {
        errand_id: errand.id,
        sender_id: currentUser.id,
        message_text: newMessage.trim(),
      },
    ]);

    if (error) {
      alert('Error sending message: ' + error.message);
    } else {
      setNewMessage('');
      loadMessages();
    }

    setIsSending(false);
  };

  // Get other person's name
  const otherPersonName =
    currentUser.user_type === 'customer'
      ? errand.agent?.name || 'Agent'
      : errand.customer?.name || errand.users?.name || 'Customer';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            background: '#4CAF50',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>
              💬 Chat with {otherPersonName}
            </h3>
            <small style={{ opacity: 0.9 }}>
              {errand.description.substring(0, 40)}...
            </small>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            background: '#f5f5f5',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#999',
                padding: '40px 20px',
              }}
            >
              <p>No messages yet</p>
              <p style={{ fontSize: '14px' }}>
                Send a message to start the conversation
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUser.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isMe ? '#4CAF50' : 'white',
                      color: isMe ? 'white' : '#333',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {!isMe && (
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginBottom: '4px',
                          opacity: 0.8,
                        }}
                      >
                        {msg.sender.name}
                      </div>
                    )}
                    <div style={{ wordWrap: 'break-word' }}>
                      {msg.message_text}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        marginTop: '4px',
                        opacity: 0.7,
                      }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={sendMessage}
          style={{
            padding: '16px',
            borderTop: '1px solid #ddd',
            display: 'flex',
            gap: '8px',
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: isSending || !newMessage.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
