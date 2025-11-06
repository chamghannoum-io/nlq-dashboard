import React from 'react';
import { useChat } from './hooks/useChat.js';
import { useResizing } from './hooks/useResizing.js';
import Sidebar from './components/Sidebar.jsx';
import ChatSection from './components/ChatSection.jsx';
import VisualizationPanel from './components/VisualizationPanel.jsx';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [selectedHistoryItem, setSelectedHistoryItem] = React.useState(null);
  const [chatKey, setChatKey] = React.useState(Date.now());
  const [visualizationData, setVisualizationData] = React.useState(null);

  const { history } = useChat();

  const {
    sidebarWidth,
    visualizationWidth,
    startVisualizationResizing
  } = useResizing(isSidebarOpen);

  const handleHistoryClick = (item) => {
    console.log('History item clicked:', item);
    setSelectedHistoryItem(item);
  };

  const handleNewChat = () => {
    setSelectedHistoryItem(null);
    setChatKey(Date.now());
    setVisualizationData(null); // Clear visualization when starting new chat
  };

  const handleVisualizationData = (data) => {
    setVisualizationData(data);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar 
          history={history}
          selectedHistoryItem={selectedHistoryItem}
          onHistoryClick={handleHistoryClick}
          sidebarWidth={sidebarWidth}
          onNewChat={handleNewChat}
          onCollapse={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Collapsed Sidebar Button */}
      {!isSidebarOpen && (
        <div className="border-r border-gray-200 bg-white flex items-center justify-center px-2 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
            title="Show sidebar"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Chat Section */}
        <div style={{ width: `${100 - visualizationWidth}%` }} className="flex flex-col min-w-0 bg-white border-r border-gray-200">
          <ChatSection key={chatKey} chatKey={chatKey} selectedHistoryItem={selectedHistoryItem} onClearHistory={handleNewChat} onVisualizationData={handleVisualizationData} />
        </div>

        {/* Resize Divider */}
        <div
          className="w-1 bg-gradient-to-b from-gray-300 to-gray-200 hover:from-blue-400 hover:to-blue-300 cursor-col-resize flex-shrink-0 transition-all duration-200 group relative"
          onMouseDown={startVisualizationResizing}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-20 bg-blue-500 rounded-full"></div>
          </div>
        </div>

        {/* Visualization Section */}
        <div style={{ width: `${visualizationWidth}%` }} className="min-w-0 bg-white">
          <VisualizationPanel selectedItem={selectedHistoryItem} chatKey={chatKey} visualizationData={visualizationData} />
        </div>
      </div>
    </div>
  );
};

export default App;