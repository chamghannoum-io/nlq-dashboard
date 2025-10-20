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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        history={history}
        selectedHistoryId={selectedHistoryId}
        loadHistoryItem={loadHistoryItem}
        sidebarWidth={sidebarWidth}
        onNewChat={startNewChat}
      />

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

        {/* Resizable divider for visualization */}
        <div
          className="w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize flex-shrink-0 transition-colors"
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