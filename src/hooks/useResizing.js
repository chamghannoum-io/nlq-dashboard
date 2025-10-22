import { useState, useEffect, useRef, useCallback } from 'react';

// Hook for managing panel resizing
export const useResizing = (isSidebarOpen = true) => {
  const [sidebarWidth, setSidebarWidth] = useState(320); 
  const [visualizationWidth, setVisualizationWidth] = useState(50); 
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null); 
  const startXRef = useRef(0);
  const startVisualizationWidthRef = useRef(50);

  // Visualization resize handler - wrapped in useCallback to avoid stale closures
  const handleVisualizationResize = useCallback((e) => {
    if (resizeType !== 'visualization') return;
    
    const sidebarOffset = isSidebarOpen ? sidebarWidth : 0;
    const availableWidth = window.innerWidth - sidebarOffset;
    const mouseX = e.clientX - sidebarOffset;
    
    const visualizationPercentage = ((availableWidth - mouseX) / availableWidth) * 100;
    
    const newPercentage = Math.max(20, Math.min(80, visualizationPercentage));
    setVisualizationWidth(newPercentage);
  }, [resizeType, isSidebarOpen, sidebarWidth]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    setResizeType(null);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const startVisualizationResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeType('visualization');
    startXRef.current = e.clientX;
    startVisualizationWidthRef.current = visualizationWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [visualizationWidth]);

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing && resizeType === 'visualization') {
      document.addEventListener('mousemove', handleVisualizationResize);
      document.addEventListener('mouseup', stopResizing);
    }

    return () => {
      document.removeEventListener('mousemove', handleVisualizationResize);
      document.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, resizeType, handleVisualizationResize, stopResizing]);

  return {
    sidebarWidth,
    visualizationWidth,
    isResizing,
    startVisualizationResizing
  };
};
