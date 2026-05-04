import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Link, MousePointer2 } from 'lucide-react';

// ── Section/Row helpers ───────────────────────────────────────────────────────
function Section({ title, children, open: defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="gjs-prop-section">
      <button className="gjs-prop-section-header" onClick={() => setOpen(o => !o)}>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span>{title}</span>
      </button>
      {open && <div className="gjs-prop-section-body">{children}</div>}
    </div>
  );
}

function PropRow({ label, children }) {
  return (
    <div className="gjs-prop-row">
      <label className="gjs-prop-label">{label}</label>
      <div className="gjs-prop-control">{children}</div>
    </div>
  );
}

function SpacingControl({ values, onChange, locked, onToggleLock }) {
  const sides = ['Top', 'Right', 'Bottom', 'Left'];
  const handle = (side, val) => {
    if (locked) {
      const all = {};
      sides.forEach(s => (all[s.toLowerCase()] = val));
      onChange(all);
    } else {
      onChange({ [side.toLowerCase()]: val });
    }
  };
  return (
    <div className="gjs-spacing-control">
      <div className="gjs-spacing-inputs">
        {sides.map(side => (
          <div key={side} className="gjs-spacing-field">
            <input type="text" value={values[side.toLowerCase()] || ''} onChange={e => handle(side, e.target.value)} placeholder="—" />
            <span className="gjs-spacing-label">{side[0]}</span>
          </div>
        ))}
      </div>
      <button className={`gjs-lock-btn ${locked ? 'locked' : ''}`} onClick={onToggleLock} title={locked ? 'Unlock' : 'Lock'}>
        <Link size={11} />
      </button>
    </div>
  );
}

// ── Parse inline style string into object ─────────────────────────────────────
function parseInlineStyle(styleStr) {
  const obj = {};
  if (!styleStr) return obj;
  styleStr.split(';').forEach(pair => {
    const idx = pair.indexOf(':');
    if (idx < 0) return;
    const prop = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (prop && val) obj[prop] = val;
  });
  return obj;
}

// ── Main Style Editor Panel ───────────────────────────────────────────────────
export default function StyleEditorPanel() {
  const [selEl, setSelEl] = useState(null); // { id, tag }
  const [styles, setStyles] = useState({});
  const [marginLocked, setMarginLocked] = useState(true);
  const [paddingLocked, setPaddingLocked] = useState(true);

  // Listen for ELEMENT_SELECTED from Visual Editor iframe
  useEffect(() => {
    const handler = e => {
      if (e.data?.type === 'ELEMENT_SELECTED') {
        setSelEl({ id: e.data.id, tag: e.data.tag });
        setStyles(parseInlineStyle(e.data.styles));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Send style update to iframe
  const applyStyle = useCallback((prop, value) => {
    const iframe = document.querySelector('iframe[title="Visual Editor"]');
    if (iframe?.contentWindow && selEl) {
      iframe.contentWindow.postMessage({ type: 'APPLY_STYLES', id: selEl.id, styles: { [prop]: value } }, '*');
    }
    setStyles(prev => ({ ...prev, [prop]: value }));
  }, [selEl]);

  const applyStyles = useCallback((obj) => {
    const iframe = document.querySelector('iframe[title="Visual Editor"]');
    if (iframe?.contentWindow && selEl) {
      iframe.contentWindow.postMessage({ type: 'APPLY_STYLES', id: selEl.id, styles: obj }, '*');
    }
    setStyles(prev => ({ ...prev, ...obj }));
  }, [selEl]);

  const getSpacing = prefix => ({
    top: styles[`${prefix}-top`] || '',
    right: styles[`${prefix}-right`] || '',
    bottom: styles[`${prefix}-bottom`] || '',
    left: styles[`${prefix}-left`] || '',
  });

  const applySpacing = (prefix, vals) => {
    const update = {};
    Object.entries(vals).forEach(([side, val]) => { update[`${prefix}-${side}`] = val; });
    applyStyles(update);
  };

  if (!selEl) {
    return (
      <div className="gjs-no-sel" style={{ flex: 1 }}>
        <MousePointer2 size={28} />
        <p>Switch to Visual Editor and click any element to edit its styles</p>
      </div>
    );
  }

  const colorVal = (c, fallback) => c && c.startsWith('#') ? c.slice(0, 7) : fallback;

  return (
    <div className="gjs-props-scroll" style={{ flex: 1 }}>
      <div style={{ padding: '8px 14px 6px', fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>
        &lt;{selEl.tag}&gt;
      </div>

      <Section title="TYPOGRAPHY">
        <PropRow label="Font Size">
          <input className="gjs-input" type="text" value={styles['font-size'] || ''} onChange={e => applyStyle('font-size', e.target.value)} placeholder="16px" />
        </PropRow>
        <PropRow label="Font Weight">
          <select className="gjs-select" value={styles['font-weight'] || '400'} onChange={e => applyStyle('font-weight', e.target.value)}>
            {['100','200','300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </PropRow>
        <PropRow label="Line Height">
          <input className="gjs-input" type="text" value={styles['line-height'] || ''} onChange={e => applyStyle('line-height', e.target.value)} placeholder="1.5" />
        </PropRow>
        <PropRow label="Text Align">
          <select className="gjs-select" value={styles['text-align'] || 'left'} onChange={e => applyStyle('text-align', e.target.value)}>
            {['left','center','right','justify'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </PropRow>
      </Section>

      <Section title="COLORS">
        <PropRow label="Text">
          <div className="gjs-color-row">
            <input type="color" className="gjs-color-swatch" value={colorVal(styles['color'], '#ffffff')} onChange={e => applyStyle('color', e.target.value)} />
            <input type="text" className="gjs-input" value={styles['color'] || ''} onChange={e => applyStyle('color', e.target.value)} placeholder="#ffffff" />
          </div>
        </PropRow>
        <PropRow label="Background">
          <div className="gjs-color-row">
            <input type="color" className="gjs-color-swatch" value={colorVal(styles['background-color'], '#000000')} onChange={e => applyStyle('background-color', e.target.value)} />
            <input type="text" className="gjs-input" value={styles['background'] || styles['background-color'] || ''} onChange={e => applyStyle('background', e.target.value)} placeholder="transparent" />
          </div>
        </PropRow>
      </Section>

      <Section title="SPACING">
        <div className="gjs-spacing-block">
          <div className="gjs-spacing-title"><span>Margin</span></div>
          <SpacingControl values={getSpacing('margin')} onChange={v => applySpacing('margin', v)} locked={marginLocked} onToggleLock={() => setMarginLocked(l => !l)} />
        </div>
        <div className="gjs-spacing-block">
          <div className="gjs-spacing-title"><span>Padding</span></div>
          <SpacingControl values={getSpacing('padding')} onChange={v => applySpacing('padding', v)} locked={paddingLocked} onToggleLock={() => setPaddingLocked(l => !l)} />
        </div>
      </Section>

      <Section title="SIZE">
        <PropRow label="Width"><input className="gjs-input" type="text" value={styles['width'] || ''} onChange={e => applyStyle('width', e.target.value)} placeholder="auto" /></PropRow>
        <PropRow label="Height"><input className="gjs-input" type="text" value={styles['height'] || ''} onChange={e => applyStyle('height', e.target.value)} placeholder="auto" /></PropRow>
      </Section>

      <Section title="BORDER">
        <PropRow label="Radius"><input className="gjs-input" type="text" value={styles['border-radius'] || ''} onChange={e => applyStyle('border-radius', e.target.value)} placeholder="0px" /></PropRow>
        <PropRow label="Width"><input className="gjs-input" type="text" value={styles['border-width'] || ''} onChange={e => applyStyle('border-width', e.target.value)} placeholder="0px" /></PropRow>
        <PropRow label="Style">
          <select className="gjs-select" value={styles['border-style'] || 'none'} onChange={e => applyStyle('border-style', e.target.value)}>
            {['none','solid','dashed','dotted','double'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </PropRow>
        <PropRow label="Color">
          <div className="gjs-color-row">
            <input type="color" className="gjs-color-swatch" value={colorVal(styles['border-color'], '#000000')} onChange={e => applyStyle('border-color', e.target.value)} />
            <input type="text" className="gjs-input" value={styles['border-color'] || ''} onChange={e => applyStyle('border-color', e.target.value)} placeholder="#000000" />
          </div>
        </PropRow>
      </Section>

      <Section title="EFFECTS">
        <PropRow label="Opacity">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="range" min="0" max="1" step="0.01" value={parseFloat(styles['opacity'] ?? 1)} onChange={e => applyStyle('opacity', e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 32, textAlign: 'right' }}>{Math.round(parseFloat(styles['opacity'] ?? 1) * 100)}%</span>
          </div>
        </PropRow>
        <PropRow label="Box Shadow"><input className="gjs-input" type="text" value={styles['box-shadow'] || ''} onChange={e => applyStyle('box-shadow', e.target.value)} placeholder="0 4px 12px rgba(0,0,0,.2)" /></PropRow>
        <PropRow label="Transition"><input className="gjs-input" type="text" value={styles['transition'] || ''} onChange={e => applyStyle('transition', e.target.value)} placeholder="all 0.2s ease" /></PropRow>
      </Section>
    </div>
  );
}
