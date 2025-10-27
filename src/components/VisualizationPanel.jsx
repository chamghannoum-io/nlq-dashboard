import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

export default function VisualizationPanel({ selectedItem }) {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [cardInfo, setCardInfo] = useState(null);

  // When a history item is selected, show its visualization immediately
  useEffect(() => {
    if (selectedItem) {
      console.log('Selected item:', selectedItem);
      
      if (selectedItem.embed_url) {
        setEmbedUrl(selectedItem.embed_url);
        setCardTitle(selectedItem.card_name || selectedItem.question || 'Visualization');
        setCardInfo({
          type: selectedItem.visualization_type,
          id: selectedItem.card_id
        });
        setIsLoading(false);
      } else {
        // Selected item has no visualization
        setEmbedUrl(null);
        setCardTitle('');
        setCardInfo(null);
        setIsLoading(false);
      }
    }
  }, [selectedItem]);

  // Don't poll for new visualizations - only show when explicitly selected from history

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Visualization</h2>
            {cardTitle && (
              <p className="text-sm text-gray-600 mt-0.5">{cardTitle}</p>
            )}
          </div>
          {cardInfo && (
            <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
              {cardInfo.type && (
                <span className="font-medium">Type: {cardInfo.type}</span>
              )}
              {cardInfo.id && (
                <span className="text-gray-400">ID: {cardInfo.id}</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Generating visualization...</p>
            <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
          </div>
        )}
        
        {embedUrl && !isLoading && (
          <div className="h-full flex flex-col">
            <div className="w-full flex-1 border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                title="Data Visualization"
                allow="fullscreen"
              />
            </div>
          </div>
        )}
        
        {!embedUrl && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">
                {selectedItem 
                  ? 'No visualization available' 
                  : 'No visualization yet'}
              </p>
              <p className="text-sm text-gray-400">
                {selectedItem 
                  ? 'This conversation doesn\'t have a visualization' 
                  : 'Select a conversation from history to view charts'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}