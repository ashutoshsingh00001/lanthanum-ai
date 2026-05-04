import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Settings, MousePointer2, Type, Square, Layout, ChevronRight, ChevronDown, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link, Send, Loader2 } from 'lucide-react';
import { useCanvas } from '../state/CanvasContext';
import { callGemini } from '../services/aiService';

// Debounce helper
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export default function ComponentEditorPanel() {
  const { state, actions } = useCanvas();
  const { mainCode } = state;
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [components, setComponents] = useState([]);
  const [properties, setProperties] = useState({});
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [locks, setLocks] = useState({ margin: true, padding: true });
  const [history, setHistory] = useState([]);

  // ----------------------------------------------------
  // Undo Functionality
  // ----------------------------------------------------
  const pushToHistory = useCallback((code) => {
    setHistory(prev => {
      const next = [...prev, code];
      if (next.length > 50) next.shift(); // Limit history
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousCode = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    actions.setMainCode(previousCode);
  }, [history, actions]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // ----------------------------------------------------
  // FEATURE 3: Component JSON Generation
  // ----------------------------------------------------
  useEffect(() => {
    if (!mainCode) {
      setComponents([]);
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(mainCode, 'text/html');
    const elementsWithId = doc.querySelectorAll('[id], [data-lanthanum-id]');
    
    const extracted = Array.from(elementsWithId).map(el => {
      const id = el.id || el.getAttribute('data-lanthanum-id');
      let type = 'DIV';
      if (el.tagName === 'BUTTON' || el.classList.contains('btn')) type = 'BUTTON';
      else if (el.tagName === 'SECTION') type = 'SECTION';
      else if (el.tagName === 'P' || el.tagName.match(/^H[1-6]$/)) type = 'TEXT';
      else if (el.tagName === 'IMG') type = 'IMAGE';

      return {
        id,
        tag: el.tagName.toLowerCase(),
        type,
        label: id.startsWith('el_') ? el.tagName.toLowerCase() : '#' + id,
        styles: el.style.cssText,
      };
    });

    const json = { components: extracted };
    // This represents the generated components.json
    console.log("Generated components.json:", JSON.stringify(json, null, 2));
    
    setComponents(extracted);
  }, [mainCode]);

  // ----------------------------------------------------
  // Handle Iframe Messages
  // ----------------------------------------------------
  useEffect(() => {
    const handleMessage = (event) => {
      const { type, id, computedStyles } = event.data;
      if (type === 'ELEMENT_SELECTED') {
        setSelectedElementId(id);
        
        // Map computed styles to our properties state
        setProperties({
          fontSize: computedStyles['font-size'] || '',
          fontStyle: computedStyles['font-style'] || 'normal',
          fontWeight: computedStyles['font-weight'] || '400',
          textAlign: computedStyles['text-align'] || 'left',
          color: rgbToHex(computedStyles['color']) || '#000000',
          backgroundColor: rgbToHex(computedStyles['background-color']) || 'transparent',
          marginTop: computedStyles['margin-top'] || '0px',
          marginRight: computedStyles['margin-right'] || '0px',
          marginBottom: computedStyles['margin-bottom'] || '0px',
          marginLeft: computedStyles['margin-left'] || '0px',
          paddingTop: computedStyles['padding-top'] || '0px',
          paddingRight: computedStyles['padding-right'] || '0px',
          paddingBottom: computedStyles['padding-bottom'] || '0px',
          paddingLeft: computedStyles['padding-left'] || '0px',
          width: computedStyles['width'] || 'auto',
          height: computedStyles['height'] || 'auto',
          borderRadius: computedStyles['border-radius'] || '0px',
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const selectedComponent = useMemo(() => 
    components.find(c => c.id === selectedElementId),
    [components, selectedElementId]
  );

  // ----------------------------------------------------
  // FEATURE 1: Visual CSS Property Editor
  // ----------------------------------------------------
  
  // Update Source Code (Debounced)
  const debouncedUpdateCode = useDebounce((id, prop, value) => {
    if (!id || !mainCode) return;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(mainCode, 'text/html');
    const el = doc.getElementById(id) || doc.querySelector(`[data-lanthanum-id="${id}"]`);
    
    if (el) {
      pushToHistory(mainCode); // Save for undo
      el.style[prop] = value;
      // Update global state
      actions.setMainCode(doc.documentElement.outerHTML);
    }
  }, 300);

  const handleStyleChange = (prop, value, group = null) => {
    if (!selectedElementId) return;

    // Update local state
    setProperties(prev => {
      const next = { ...prev, [prop]: value };
      
      // Handle locks
      if (group === 'margin' && locks.margin) {
        next.marginTop = value; next.marginRight = value; next.marginBottom = value; next.marginLeft = value;
      }
      if (group === 'padding' && locks.padding) {
        next.paddingTop = value; next.paddingRight = value; next.paddingBottom = value; next.paddingLeft = value;
      }
      
      return next;
    });

    // Apply live to iframe
    const iframe = document.querySelector('iframe[title="Interactive Preview"]');
    if (iframe && iframe.contentWindow) {
      if (group === 'margin' && locks.margin) {
        ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(p => {
          iframe.contentWindow.postMessage({ type: 'UPDATE_STYLE', id: selectedElementId, property: p, value }, '*');
        });
      } else if (group === 'padding' && locks.padding) {
        ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(p => {
          iframe.contentWindow.postMessage({ type: 'UPDATE_STYLE', id: selectedElementId, property: p, value }, '*');
        });
      } else {
        iframe.contentWindow.postMessage({ type: 'UPDATE_STYLE', id: selectedElementId, property: prop, value }, '*');
      }
    }

    // Debounced update to source
    if (group === 'margin' && locks.margin) {
      ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(p => debouncedUpdateCode(selectedElementId, p, value));
    } else if (group === 'padding' && locks.padding) {
      ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(p => debouncedUpdateCode(selectedElementId, p, value));
    } else {
      debouncedUpdateCode(selectedElementId, prop, value);
    }
  };

  // ----------------------------------------------------
  // FEATURE 2: AI Component Editor
  // ----------------------------------------------------
  const handleAiSubmit = async () => {
    if (!aiInput.trim() || !selectedElementId || isAiLoading) return;

    setIsAiLoading(true);
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(mainCode, 'text/html');
      const el = doc.getElementById(selectedElementId) || doc.querySelector(`[data-lanthanum-id="${selectedElementId}"]`);
      
      const contextHtml = el ? el.outerHTML : '';
      
      const systemPrompt = `You are a CSS and HTML editor. The user has selected a component in their app.
Return ONLY a JSON object with the CSS changes to apply, nothing else.
Format: { "property": "value", "property": "value" }
Example: { "borderRadius": "8px", "backgroundColor": "#f97316", "color": "white" }`;

      const userMessage = `Component HTML: \n${contextHtml}\n\nRequest: ${aiInput}`;
      
      const response = await callGemini(systemPrompt, userMessage, []);
      let jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || response;
      const cssChanges = JSON.parse(jsonStr);

      const iframe = document.querySelector('iframe[title="Interactive Preview"]');
      
      pushToHistory(mainCode); // Save for undo

      // Apply each property
      for (const [prop, val] of Object.entries(cssChanges)) {
        // Local state
        setProperties(prev => ({ ...prev, [prop]: val }));
        
        // Iframe live
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'UPDATE_STYLE', id: selectedElementId, property: prop, value: val }, '*');
        }
        
        // Source code update
        if (el) {
          el.style[prop] = val;
        }
      }
      
      // Update global
      actions.setMainCode(doc.documentElement.outerHTML);
      setAiInput('');

    } catch (err) {
      console.error('AI Edit Error:', err);
      alert('Failed to parse AI response. See console for details.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper rgb to hex
  function rgbToHex(rgb) {
    if (!rgb || !rgb.startsWith('rgb')) return rgb;
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return rgb;
    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  }

  return (
    <div className="component-editor-panel">
      <div className="component-editor-sidebar">
        <div className="sidebar-header">
          <Layout size={14} />
          <span>Components</span>
        </div>
        <div className="component-list">
          {components.length === 0 ? (
            <div className="empty-state">No components found</div>
          ) : (
            components.map(comp => (
              <button
                key={comp.id}
                className={`component-item ${selectedElementId === comp.id ? 'active' : ''}`}
                onClick={() => setSelectedElementId(comp.id)}
              >
                <div className="component-item-icon">
                  {comp.type === 'BUTTON' ? <Square size={12} /> : <Type size={12} />}
                </div>
                <div className="component-item-info">
                  <span className="component-name">{comp.label}</span>
                  <span className="component-tag">{comp.type}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="component-properties-panel">
        <div className="properties-header">
          <Settings size={14} />
          <span>Properties {selectedComponent ? `— ${selectedComponent.label}` : ''}</span>
        </div>

        {selectedComponent ? (
          <div className="properties-scroll">
            <PropertySection title="TYPOGRAPHY">
              <PropertyField label="Font Size">
                <input 
                  type="text" 
                  value={properties.fontSize || ''} 
                  onChange={(e) => handleStyleChange('fontSize', e.target.value)} 
                />
              </PropertyField>
              <PropertyField label="Style">
                <select value={properties.fontStyle || 'normal'} onChange={(e) => handleStyleChange('fontStyle', e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                  <option value="oblique">Oblique</option>
                </select>
              </PropertyField>
              <PropertyField label="Weight">
                <select value={properties.fontWeight || '400'} onChange={(e) => handleStyleChange('fontWeight', e.target.value)}>
                  <option value="100">100</option>
                  <option value="400">400 (Normal)</option>
                  <option value="600">600 (Semi-bold)</option>
                  <option value="700">700 (Bold)</option>
                  <option value="900">900</option>
                </select>
              </PropertyField>
              <PropertyField label="Align">
                <div className="align-buttons">
                  <button className={properties.textAlign === 'left' ? 'active' : ''} onClick={() => handleStyleChange('textAlign', 'left')}><AlignLeft size={14}/></button>
                  <button className={properties.textAlign === 'center' ? 'active' : ''} onClick={() => handleStyleChange('textAlign', 'center')}><AlignCenter size={14}/></button>
                  <button className={properties.textAlign === 'right' ? 'active' : ''} onClick={() => handleStyleChange('textAlign', 'right')}><AlignRight size={14}/></button>
                  <button className={properties.textAlign === 'justify' ? 'active' : ''} onClick={() => handleStyleChange('textAlign', 'justify')}><AlignJustify size={14}/></button>
                </div>
              </PropertyField>
            </PropertySection>

            <PropertySection title="COLORS">
              <PropertyField label="Text">
                <input 
                  type="color" 
                  value={(properties.color && properties.color.startsWith('#')) ? properties.color.substring(0,7) : '#ffffff'} 
                  onChange={(e) => handleStyleChange('color', e.target.value)} 
                />
              </PropertyField>
              <PropertyField label="Background">
                <input 
                  type="color" 
                  value={(properties.backgroundColor && properties.backgroundColor.startsWith('#')) ? properties.backgroundColor.substring(0,7) : '#000000'} 
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} 
                />
              </PropertyField>
            </PropertySection>

            <PropertySection title="SPACING">
              <div className="spacing-group">
                <div className="spacing-header">
                  <span>Margin</span>
                  <button onClick={() => setLocks(p => ({...p, margin: !p.margin}))} className={`lock-btn ${locks.margin ? 'active-lock' : ''}`}>
                    <Link size={12} />
                  </button>
                </div>
                <div className="spacing-inputs">
                  <input type="text" placeholder="T" value={properties.marginTop || ''} onChange={e => handleStyleChange('marginTop', e.target.value, 'margin')} />
                  <input type="text" placeholder="R" value={properties.marginRight || ''} onChange={e => handleStyleChange('marginRight', e.target.value, 'margin')} />
                  <input type="text" placeholder="B" value={properties.marginBottom || ''} onChange={e => handleStyleChange('marginBottom', e.target.value, 'margin')} />
                  <input type="text" placeholder="L" value={properties.marginLeft || ''} onChange={e => handleStyleChange('marginLeft', e.target.value, 'margin')} />
                </div>
              </div>
              <div className="spacing-group">
                <div className="spacing-header">
                  <span>Padding</span>
                  <button onClick={() => setLocks(p => ({...p, padding: !p.padding}))} className={`lock-btn ${locks.padding ? 'active-lock' : ''}`}>
                    <Link size={12} />
                  </button>
                </div>
                <div className="spacing-inputs">
                  <input type="text" placeholder="T" value={properties.paddingTop || ''} onChange={e => handleStyleChange('paddingTop', e.target.value, 'padding')} />
                  <input type="text" placeholder="R" value={properties.paddingRight || ''} onChange={e => handleStyleChange('paddingRight', e.target.value, 'padding')} />
                  <input type="text" placeholder="B" value={properties.paddingBottom || ''} onChange={e => handleStyleChange('paddingBottom', e.target.value, 'padding')} />
                  <input type="text" placeholder="L" value={properties.paddingLeft || ''} onChange={e => handleStyleChange('paddingLeft', e.target.value, 'padding')} />
                </div>
              </div>
            </PropertySection>

            <PropertySection title="SIZE">
              <PropertyField label="Width">
                <input type="text" value={properties.width || ''} onChange={(e) => handleStyleChange('width', e.target.value)} />
              </PropertyField>
              <PropertyField label="Height">
                <input type="text" value={properties.height || ''} onChange={(e) => handleStyleChange('height', e.target.value)} />
              </PropertyField>
            </PropertySection>
            
            <PropertySection title="BORDER">
              <PropertyField label="Radius">
                <input type="text" value={properties.borderRadius || ''} onChange={(e) => handleStyleChange('borderRadius', e.target.value)} />
              </PropertyField>
              <PropertyField label="Width">
                <input type="text" value={properties.borderWidth || ''} onChange={(e) => handleStyleChange('borderWidth', e.target.value)} />
              </PropertyField>
              <PropertyField label="Style">
                <select value={properties.borderStyle || 'none'} onChange={(e) => handleStyleChange('borderStyle', e.target.value)}>
                  <option value="none">None</option>
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>
              </PropertyField>
              <PropertyField label="Color">
                <input 
                  type="color" 
                  value={(properties.borderColor && properties.borderColor.startsWith('#')) ? properties.borderColor.substring(0,7) : '#000000'} 
                  onChange={(e) => handleStyleChange('borderColor', e.target.value)} 
                />
              </PropertyField>
            </PropertySection>
          </div>
        ) : (
          <div className="no-selection">
            <MousePointer2 size={32} />
            <p>Select a component from the list or canvas to edit its properties</p>
          </div>
        )}

        {/* AI Chat Input */}
        {selectedComponent && (
          <div className="ai-property-editor">
            <input 
              type="text" 
              placeholder="Ask AI to modify this component..." 
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiSubmit()}
              disabled={isAiLoading}
            />
            <button onClick={handleAiSubmit} disabled={isAiLoading || !aiInput.trim()}>
              {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertySection({ title, children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="property-section">
      <button className="section-header" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{title}</span>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
}

function PropertyField({ label, children }) {
  return (
    <div className="property-field">
      <label>{label}</label>
      <div className="field-input-wrapper">
        {children}
      </div>
    </div>
  );
}
