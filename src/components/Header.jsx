import React, { useState } from 'react';
import { Code, Download, Home, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCanvas } from '../state/CanvasContext';
import ExportModal from './ExportModal';
import lanthanumLogo from '../assets/Lanthanum.png';

export default function Header() {
  const { state } = useCanvas();
  const { mainCode } = state;
  const [showExport, setShowExport] = useState(false);

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <img src={lanthanumLogo} alt="Lanthanum AI" className="header-logo" />
          <div className="header-badge">
            <span>Beta</span>
          </div>
        </div>
        <div className="header-right">
          <Link to="/" className="header-btn home-btn" title="Back to Home">
            <Home size={18} />
            <span>Home</span>
          </Link>
          <button className="header-btn export-btn" onClick={() => setShowExport(true)}>
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </header>

      {showExport && (
        <ExportModal
          mainCode={mainCode}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  );
}
