import { useState, useEffect, useRef } from 'react';

// Hook for managing panel resizing
export const useResizing = (isSidebarOpen = true) => {
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default 320px
  const [visualizationWidth, setVisualizationWidth] = useState(50); // Default 50% of remaining space
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null); // 'sidebar' or 'visualization'
  const startXRef = useRef(0);
  const startVisualizationWidthRef = useRef(50);

  // Visualization resize handler
  const handleVisualizationResize = (e) => {
    if (!isResizing || resizeType !== 'visualization') return;
    
    const sidebarOffset = isSidebarOpen ? sidebarWidth : 0;
    const availableWidth = window.innerWidth - sidebarOffset;
    const mouseX = e.clientX - sidebarOffset;
    
    // Calculate percentage based on available space
    const newPercentage = Math.max(20, Math.min(80, (mouseX / availableWidth) * 100));
    setVisualizationWidth(newPercentage);
  };

  const startVisualizationResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeType('visualization');
    startXRef.current = e.clientX;
    startVisualizationWidthRef.current = visualizationWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopResizing = () => {
    setIsResizing(false);
    setResizeType(null);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleVisualizationResize);
      document.addEventListener('mouseup', stopResizing);
      document.addEventListener('mouseleave', stopResizing);
    } else {
      document.removeEventListener('mousemove', handleVisualizationResize);
      document.removeEventListener('mouseup', stopResizing);
      document.removeEventListener('mouseleave', stopResizing);
    }

    return () => {
      document.removeEventListener('mousemove', handleVisualizationResize);
      document.removeEventListener('mouseup', stopResizing);
      document.removeEventListener('mouseleave', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, resizeType, isSidebarOpen, sidebarWidth]);

  return {
    sidebarWidth,
    visualizationWidth,
    isResizing,
    startVisualizationResizing
  };
};
