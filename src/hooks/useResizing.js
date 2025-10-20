import { useState, useEffect } from 'react';

// Hook for managing panel resizing
export const useResizing = () => {
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default 320px
  const [visualizationWidth, setVisualizationWidth] = useState(50); // Default 50% of remaining space
  const [isResizing, setIsResizing] = useState(false);

  // Resizing handlers
  const handleSidebarResize = (e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    const minWidth = 200;
    const maxWidth = window.innerWidth * 0.6;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  };

  const handleVisualizationResize = (e) => {
    if (!isResizing) return;
    
    const containerWidth = window.innerWidth - sidebarWidth;
    const mouseX = e.clientX - sidebarWidth;
    const newPercentage = (mouseX / containerWidth) * 100;
    
    const minPercentage = 20;
    const maxPercentage = 80;
    
    if (newPercentage >= minPercentage && newPercentage <= maxPercentage) {
      setVisualizationWidth(newPercentage);
    }
  };

  const startResizing = () => {
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleSidebarResize);
      document.addEventListener('mousemove', handleVisualizationResize);
      document.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleSidebarResize);
      document.removeEventListener('mousemove', handleVisualizationResize);
      document.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      document.removeEventListener('mousemove', handleSidebarResize);
      document.removeEventListener('mousemove', handleVisualizationResize);
      document.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, sidebarWidth]);

  return {
    sidebarWidth,
    visualizationWidth,
    isResizing,
    startResizing
  };
};
