import React from 'react';
import { useChat } from './hooks/useChat.js';
import { useResizing } from './hooks/useResizing.js';
import Sidebar from './components/Sidebar.jsx';
import ChatSection from './components/ChatSection.jsx';
import VisualizationPanel from './components/VisualizationPanel.jsx';

const App = () => {
  const {
    // State
    question,
    setQuestion,
    currentChat,
    history,
    loading,
    selectedHistoryId,
    messagesEndRef,
    
    // Actions
    sendMessage,
    loadHistoryItem,
    handleKeyPress,
    startNewChat
  } = useChat();

  const {
    sidebarWidth,
    visualizationWidth,
    startResizing
  } = useResizing();

  // Sidebar open/close
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar 
          history={history}
          selectedHistoryId={selectedHistoryId}
          loadHistoryItem={loadHistoryItem}
          sidebarWidth={sidebarWidth}
          onNewChat={startNewChat}
          onCollapse={() => setIsSidebarOpen(false)}
        />
      )}

      {!isSidebarOpen && (
        <div className="border-r bg-white flex items-center justify-center px-1">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            title="Show sidebar"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Resizable divider for sidebar */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={startResizing}
      />

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Chat Section */}
        <ChatSection 
          currentChat={currentChat}
          question={question}
          setQuestion={setQuestion}
          loading={loading}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          messagesEndRef={messagesEndRef}
        />

        {/* Divider for visualization (still resizable if desired) */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-300 cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={startResizing}
        />

        {/* Visualization Section */}
        <VisualizationPanel 
          currentChat={currentChat}
          visualizationWidth={visualizationWidth}
        />
      </div>
    </div>
  );
};

export default App;