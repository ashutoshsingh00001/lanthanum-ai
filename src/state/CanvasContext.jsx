import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { canvasReducer, initialState } from './canvasReducer';
import { injectElementIds } from '../utils/frameCode';

const CanvasContext = createContext(null);

export function CanvasProvider({ children }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  // Convenience action creators
  const actions = {
    setMainCode: useCallback((html) => {
      const processedHtml = typeof html === 'string' ? injectElementIds(html) : injectElementIds(html.code);
      const payload = typeof html === 'string' ? { code: processedHtml } : { ...html, code: processedHtml };
      dispatch({ type: 'SET_MAIN_CODE', payload });
    }, []),
    setViewMode: useCallback((mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }), []),
    setTheme: useCallback((theme) => dispatch({ type: 'SET_THEME', payload: theme }), []),
    setPan: useCallback((pan) => dispatch({ type: 'SET_PAN', payload: pan }), []),

    setZoom: useCallback((zoom) => dispatch({ type: 'SET_ZOOM', payload: zoom }), []),
    
    select: useCallback((id, type) => dispatch({ type: 'SELECT', payload: { id, type } }), []),
    deselect: useCallback(() => dispatch({ type: 'DESELECT' }), []),
  };

  return (
    <CanvasContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}
