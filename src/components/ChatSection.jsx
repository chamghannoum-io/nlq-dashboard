// src/components/ChatSection.jsx
import { useEffect, useRef } from 'react';
import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';

export default function ChatSection() {
  const chatInstanceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!chatInstanceRef.current && containerRef.current) {
      try {
        chatInstanceRef.current = createChat({
          webhookUrl: '/webhook/6a2a75cc-9487-4650-8174-31e80a40158b/chat',
          target: containerRef.current, 
          mode: 'fullscreen',
          chatSessionKey: 'n8n_session_id',
          
          initialMessages: [
            'Hello! Ask me anything about your healthcare data.'
          ],
          inputPlaceholder: 'Type your question...',
          
          theme: {
            primaryColor: '#3b82f6',
            fontSize: '14px',
          },
        });
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    }

    return () => {
      if (chatInstanceRef.current && chatInstanceRef.current.unmount) {
        chatInstanceRef.current.unmount();
        chatInstanceRef.current = null;
      }
    };
  }, []); 

  return (
    <div className="chat-section h-full w-full">
      <div ref={containerRef} className="h-full w-full"></div>
    </div>
  );
}