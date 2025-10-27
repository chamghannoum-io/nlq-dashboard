import React from 'react';
import { useChat } from './hooks/useChat.js';
import { useResizing } from './hooks/useResizing.js';
import Sidebar from './components/Sidebar.jsx';
import ChatSection from './components/ChatSection.jsx';
import VisualizationPanel from './components/VisualizationPanel.jsx';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [selectedHistoryId, setSelectedHistoryId] = React.useState(null);
  const [currentChat, setCurrentChat] = React.useState(null);

  // Only need history from useChat now
  const { history } = useChat();

  const {
    sidebarWidth,
    visualizationWidth,
    startVisualizationResizing
  } = useResizing(isSidebarOpen);

  const loadHistoryItem = (item) => {
    const itemId = item.session_id + item.timestamp;
    setSelectedHistoryId(itemId);
    setCurrentChat(item);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar 
          history={history}
          selectedHistoryId={selectedHistoryId}
          loadHistoryItem={loadHistoryItem}
          sidebarWidth={sidebarWidth}
          onNewChat={() => window.location.reload()}
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

      {/* Main Content */}
      <div className="flex flex-1 min-w-0">
        {/* Chat Section - n8n widget handles everything */}
        <div style={{ width: `${100 - visualizationWidth}%` }} className="flex flex-col min-w-0">
          <ChatSection />
        </div>

        {/* Divider for visualization */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-300 cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={startVisualizationResizing}
        />

        {/* Visualization Section */}
        <div style={{ width: `${visualizationWidth}%` }} className="min-w-0">
          <VisualizationPanel currentChat={currentChat} />
        </div>
      </div>
    </div>
  );
};

export default App;