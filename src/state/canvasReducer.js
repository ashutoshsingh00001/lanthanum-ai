// Unique ID generator
let nextId = 1;
export const generateId = () => `el_${nextId++}`;

// Default state
export const initialState = {
  // Main UI content (HTML)
  mainCode: '',

  // View mode: 'code' | 'preview' | 'component'
  viewMode: 'preview',

  // Theme: 'dark' | 'light'
  theme: 'dark',

  // Canvas transform (kept for compatibility)
  pan: { x: 0, y: 0 },
  zoom: 1,

  // Selection
  selectedId: null,
  selectedType: null,

  // History (for undo/redo later)
  history: [],
  historyIndex: -1,
};

export function canvasReducer(state, action) {
  switch (action.type) {
    case 'SET_MAIN_CODE':
      return { 
        ...state, 
        mainCode: action.payload.code,
        language: action.payload.language || state.language,
        previewHTML: action.payload.previewHTML || state.previewHTML
      };

    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    // ---- Canvas Transform ----
    case 'SET_PAN':
      return { ...state, pan: action.payload };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.payload)) };

    case 'RESET_VIEW':
      return { ...state, pan: { x: 0, y: 0 }, zoom: 1 };

    // ---- Selection ----
    case 'SELECT':
      return {
        ...state,
        selectedId: action.payload.id,
        selectedType: action.payload.type,
      };

    case 'DESELECT':
      return {
        ...state,
        selectedId: null,
        selectedType: null,
      };

    default:
      return state;
  }
}
