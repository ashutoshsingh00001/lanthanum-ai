import React, { useState } from 'react';
import { X, Package, Zap, Apple, Monitor, Laptop, CheckCircle2 } from 'lucide-react';
import { downloadElectronProjectZip } from '../services/exportService';

function PlatformCard({ id, label, icon: Icon, desc, selected, onClick }) {
  return (
    <button
      className={`export-platform-card ${selected ? 'selected' : ''}`}
      onClick={() => onClick(id)}
    >
      <div className="export-platform-icon"><Icon size={22} /></div>
      <div className="export-platform-info">
        <div className="export-platform-label">{label}</div>
        <div className="export-platform-desc">{desc}</div>
      </div>
      {selected && <div className="export-platform-check"><CheckCircle2 size={16} /></div>}
    </button>
  );
}

export default function ExportModal({ onClose, mainCode }) {
  const [appName, setAppName] = useState('MyApp');
  const [version, setVersion] = useState('1.0.0');
  const [platform, setPlatform] = useState('both');
  const [errorMsg, setErrorMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const buildCommands = {
    mac: ['npm run build:mac'],
    win: ['npm run build:win'],
    both: ['npm run build:mac', 'npm run build:win'],
  };

  const startQuickExport = async () => {
    setIsExporting(true);
    setErrorMsg('');

    try {
      await downloadElectronProjectZip({
        html: mainCode,
        appName,
        version,
        platform,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="export-modal">
        <div className="export-modal-header">
          <div className="export-modal-title">
            <Package size={18} />
            <span>Quick Export</span>
          </div>
          <button className="export-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="export-modal-body">
          <div className="export-section">
            <div className="export-section-label">App Details</div>
            <div className="export-fields">
              <div className="export-field">
                <label>App Name</label>
                <input
                  className="export-input"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  placeholder="MyApp"
                  maxLength={40}
                />
              </div>
              <div className="export-field">
                <label>Version</label>
                <input
                  className="export-input"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  style={{ width: 100 }}
                />
              </div>
            </div>
          </div>

          <div className="export-section">
            <div className="export-section-label">Target Platform</div>
            <div className="export-platforms">
              <PlatformCard
                id="mac"
                label="macOS"
                icon={Apple}
                desc="ZIP includes macOS build command"
                selected={platform === 'mac'}
                onClick={setPlatform}
              />
              <PlatformCard
                id="win"
                label="Windows"
                icon={Monitor}
                desc="ZIP includes Windows build command"
                selected={platform === 'win'}
                onClick={setPlatform}
              />
              <PlatformCard
                id="both"
                label="Both"
                icon={Laptop}
                desc="ZIP includes both macOS and Windows build commands"
                selected={platform === 'both'}
                onClick={setPlatform}
              />
            </div>
          </div>

          <div className="export-section">
            <div className="export-section-label">What You Get</div>
            <div className="export-warn" style={{ marginTop: 0 }}>
              This downloads a ready-to-run Electron project ZIP. The selection above tailors the included build scripts and README instructions. After extracting it, run <code>npm install</code> and <code>npm start</code>.
            </div>
          </div>

          <div className="export-section">
            <div className="export-section-label">Build Command</div>
            <div className="export-warn" style={{ marginTop: 0 }}>
              After testing with <code>npm start</code>, use:
              {buildCommands[platform].map((command) => (
                <div key={command} style={{ marginTop: 8 }}>
                  <code>{command}</code>
                </div>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="export-error-header" style={{ marginTop: 8 }}>
              <div>
                <div className="export-error-title">Export Failed</div>
                <div className="export-error-msg">{errorMsg}</div>
              </div>
            </div>
          )}

          <div className="export-modal-footer">
            <button className="export-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="export-build-btn" onClick={startQuickExport} disabled={isExporting}>
              <Zap size={15} />
              <span>{isExporting ? 'Exporting...' : 'Download ZIP'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
