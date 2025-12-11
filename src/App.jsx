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
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none"></div>
      
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
        <div className="bg-slate-800/60 backdrop-blur-xl border-r border-slate-700/50 flex items-center justify-center px-3 relative z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-all duration-300 group shadow-lg"
            title="Show sidebar"
          >
            <svg className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 min-w-0 overflow-hidden gap-4 p-4 relative z-10">
        {/* Chat Section */}
        <div style={{ width: `${100 - visualizationWidth}%` }} className="flex flex-col min-w-0 bg-slate-800/50 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden hover:border-slate-600/50 transition-all duration-300">
          <ChatSection key={chatKey} chatKey={chatKey} selectedHistoryItem={selectedHistoryItem} onClearHistory={handleNewChat} onVisualizationData={handleVisualizationData} />
        </div>

        {/* Resize Divider */}
        <div
          className="w-1.5 bg-gradient-to-b from-slate-700/30 via-blue-500/30 to-slate-700/30 hover:from-blue-400/60 hover:via-blue-500/80 hover:to-blue-400/60 cursor-col-resize flex-shrink-0 transition-all duration-300 group relative rounded-full"
          onMouseDown={startVisualizationResizing}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1.5 h-32 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-400 rounded-full shadow-2xl shadow-blue-500/60"></div>
          </div>
        </div>

        {/* Visualization Section */}
        <div style={{ width: `${visualizationWidth}%` }} className="min-w-0 bg-slate-800/50 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden hover:border-slate-600/50 transition-all duration-300">
          <VisualizationPanel selectedItem={selectedHistoryItem} chatKey={chatKey} visualizationData={visualizationData} />
        </div>
      </div>
    </div>
  );
};

export default App;