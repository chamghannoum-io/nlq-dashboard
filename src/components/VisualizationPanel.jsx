import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

export default function VisualizationPanel({ selectedItem, chatKey, visualizationData }) {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [cardInfo, setCardInfo] = useState(null);

  // When chatKey changes (new chat started), clear visualization
  useEffect(() => {
    if (!selectedItem) {
      setEmbedUrl(null);
      setCardTitle('');
      setCardInfo(null);
      setIsLoading(false);
    }
  }, [chatKey, selectedItem]);

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

  // Handle visualization data from webhook payload (live chat mode)
  useEffect(() => {
    if (selectedItem) return; // Don't process when viewing history
    
    if (visualizationData && visualizationData.embedUrl) {
      console.log('Received visualization data:', visualizationData);
      setEmbedUrl(visualizationData.embedUrl);
      setCardTitle(visualizationData.cardName || 'Visualization');
      setCardInfo({
        type: visualizationData.visualization_type,
        id: visualizationData.cardId
      });
      setIsLoading(false);
    } else if (visualizationData === null) {
      // Clear visualization when data is explicitly cleared
      setEmbedUrl(null);
      setCardTitle('');
      setCardInfo(null);
      setIsLoading(false);
    }
  }, [visualizationData, selectedItem]);

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Data Visualization</h2>
              {cardTitle && (
                <p className="text-xs text-slate-400 mt-0.5">{cardTitle}</p>
              )}
            </div>
          </div>
          {cardInfo && (
            <div className="flex items-center gap-2 text-xs bg-slate-700/40 px-3 py-2 rounded-xl border border-slate-600/50">
              {cardInfo.type && (
                <span className="px-2 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-medium border border-teal-500/30">
                  {cardInfo.type}
                </span>
              )}
              {cardInfo.id && (
                <span className="text-slate-500 font-mono">#{cardInfo.id}</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full bg-slate-800/20 backdrop-blur-sm rounded-3xl border border-slate-700/50">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-700"></div>
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-teal-500 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-white font-semibold text-lg">Generating visualization...</p>
            {cardTitle && (
              <p className="text-sm text-slate-400 mt-2 text-center px-6 max-w-md">{cardTitle}</p>
            )}
            <div className="flex items-center gap-2 mt-4">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-slate-500">Processing your data</p>
            </div>
          </div>
        )}
        
        {embedUrl && !isLoading && (
          <div className="h-full flex flex-col">
            {/* Chart Container with Modern Frame */}
            <div className="w-full flex-1 relative group">
              {/* Decorative corners */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-teal-500/50 rounded-tl-2xl z-10"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-teal-500/50 rounded-tr-2xl z-10"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-teal-500/50 rounded-bl-2xl z-10"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-teal-500/50 rounded-br-2xl z-10"></div>
              
              {/* Main frame */}
              <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-700/50 bg-white relative">
                {/* Top gradient overlay */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-900/10 to-transparent pointer-events-none z-10"></div>
                
                {/* iframe */}
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  title="Data Visualization"
                  allow="fullscreen"
                />
              </div>
              
              {/* Floating badge */}
              <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-300 font-medium">Live Data</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!embedUrl && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-slate-700/40 to-slate-700/20 rounded-3xl flex items-center justify-center border border-slate-700/50 shadow-xl">
                <BarChart3 className="w-16 h-16 text-slate-500" />
              </div>
              <p className="text-slate-300 font-semibold text-xl mb-3">
                {selectedItem 
                  ? 'No visualization available' 
                  : 'Ready for data'}
              </p>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                {selectedItem 
                  ? 'This conversation doesn\'t have an associated visualization' 
                  : 'Ask a question in the chat to generate visualizations'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}