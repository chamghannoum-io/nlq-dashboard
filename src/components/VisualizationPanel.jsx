import React from 'react';
import { BarChart3 } from 'lucide-react';

const VisualizationPanel = ({ currentChat }) => {
  return (
    <div className="bg-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Visualization</h2>
        {currentChat && currentChat.card_name && (
          <p className="text-sm text-gray-600 mt-1">{currentChat.card_name}</p>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        {currentChat && currentChat.embed_url && (currentChat.should_visualize !== false) ? (
          <div className="h-full flex flex-col">
            <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
              <span className="font-medium">Type:</span> {currentChat.visualization_type} | 
              <span className="font-medium ml-2">Card ID:</span> {currentChat.card_id}
            </div>
            <iframe
              src={currentChat.embed_url}
              className="flex-1 border-0 w-full"
              title={`Metabase Visualization: ${currentChat.card_name || 'Chart'}`}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No visualization available</p>
              {currentChat && !currentChat.should_visualize && (
                <p className="text-xs mt-2">This question doesn't require a chart</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPanel;
