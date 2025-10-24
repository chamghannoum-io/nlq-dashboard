// src/components/ChatSection.jsx
import { useEffect } from 'react';
import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';

export default function ChatSection() {
  useEffect(() => {
    // Clear any existing chat
    const container = document.getElementById('n8n-chat-container');
    if (container) {
      container.innerHTML = '';
    }

    // Simple initialization
    const chat = createChat({
      webhookUrl: '/webhook/6a2a75cc-9487-4650-8174-31e80a40158b/chat',
      target: '#n8n-chat-container',
      mode: 'fullscreen',
      chatSessionKey: 'n8n_session_id',
      
      initialMessages: [
        'Hello! Ask me anything about your healthcare data.'
      ],
      inputPlaceholder: 'Type your question...',
    });

    console.log('Chat initialized:', chat);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Chat</h2>
      </div>
      <div 
        id="n8n-chat-container" 
        style={{ 
          flex: 1, 
          overflow: 'hidden',
          background: '#f9fafb'
        }}
      />
    </div>
  );
}