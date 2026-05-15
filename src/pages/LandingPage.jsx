import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Code2, Layout, MousePointer2, Download, Palette, Bot, Monitor, Zap } from 'lucide-react';
import lanthanumLogo from '../assets/Lanthanum.png';
import editorMockup from '../assets/mockup.png';
import './LandingPage.css';

export default function LandingPage() {
  const sectionsRef = useRef([]);

  // Intersection Observer for scroll fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    sectionsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Navbar scroll effect
  useEffect(() => {
    const nav = document.querySelector('.landing-nav');
    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav?.classList.add('scrolled');
      } else {
        nav?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <div className="landing-page">
      {/* Background Orbs */}
      <div className="landing-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Navigation */}
      <nav className="landing-nav" id="landing-nav">
        <img src="src/assets/Lanthanum-logos.png" alt="Lanthanum AI" className="nav-logo" />
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#frameworks" className="nav-link">Frameworks</a>
          <Link to="/editor" className="nav-cta">
            <Code2 size={20} />
            Open Editor <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          AI-Powered Desktop App Builder
        </div>

        <h1 className="hero-title">
          Build Desktop Apps Using{' '}
          <span className="hero-title-gradient"> Natural Language with AI</span>
        </h1>
        <p className="hero-subtitle">
          Design, code, and export stunning macOS & Windows desktop apps using
          natural language and Electron Desktop app builder with HTML, CSS and JavaScript
        </p>

        <div className="hero-actions">
          <Link to="/editor" className="hero-btn-primary" id="hero-cta">
            <Code2 size={20} />
            Start Building
            <ArrowRight size={18} />
          </Link>
          <a href="#features" className="hero-btn-secondary">
            <Zap size={18} />
            See Features
          </a>
        </div>

        <div className="hero-mockup">
          <div className="hero-mockup-glow" />
          <img src={editorMockup} alt="Lanthanum AI Editor Interface" />
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section" id="features" ref={addToRefs}>
        <div className="fade-in-section" ref={addToRefs}>
          <div className="section-header">
            <div className="section-label">
              <Sparkles size={14} />
              Features
            </div>
          </div>
        </div>
        <div className="features-grid">
          <div className="feature-card fade-in-section" ref={addToRefs}>
            <div className="feature-icon">
              <Bot size={28} />
            </div>
            <h3 className="feature-title">AI-Powered Generation</h3>
            <p className="feature-desc">
              Describe your app in plain English. Our AI generates the complete
              codebase with HTML, CSS, and JavaScript — styled and ready to go.
            </p>
          </div>

          <div className="feature-card fade-in-section" ref={addToRefs}>
            <div className="feature-icon">
              <MousePointer2 size={28} />
            </div>
            <h3 className="feature-title">Visual Editor</h3>
            <p className="feature-desc">
              Click any element and edit its properties visually. Change colors,
              spacing, typography, and layout without touching code.
            </p>
          </div>

          <div className="feature-card fade-in-section" ref={addToRefs}>
            <div className="feature-icon">
              <Code2 size={28} />
            </div>
            <h3 className="feature-title">Full Code Access</h3>
            <p className="feature-desc">
              Switch to Code View anytime for complete control. Monaco Editor
              with syntax highlighting, autocomplete, and real-time preview.
            </p>
          </div>

          <div className="feature-card fade-in-section" ref={addToRefs}>
            <div className="feature-icon">
              <Layout size={28} />
            </div>
            <h3 className="feature-title">Live Preview</h3>
            <p className="feature-desc">
              See your app render in real-time as you make changes.
              Render UI mode shows exactly what your Electron app will look like.
            </p>
          </div>

          <div className="feature-card fade-in-section" ref={addToRefs}>
            <div className="feature-icon">
              <Palette size={28} />
            </div>
            <h3 className="feature-title">Style Editor</h3>
            <p className="feature-desc">
              A dedicated CSS property panel for granular control. Edit margins,
              padding, fonts, borders, shadows — all with instant feedback.
            </p>
          </div>

          <div className="feature-card fade-in-section" ref={addToRefs}>
            <div className="feature-icon">
              <Download size={28} />
            </div>
            <h3 className="feature-title">Export as Electron</h3>
            <p className="feature-desc">
              One click to download a complete Electron project.
              Run npm install, npm start — your desktop app is live.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section how-it-works" id="how-it-works">
        <div className="fade-in-section" ref={addToRefs}>
          <div className="section-header">
            <div className="section-label">
              <Zap size={14} />
              How It Works
            </div>
          </div>
        </div>

        <div className="steps-container fade-in-section" ref={addToRefs}>
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon"></div>
            <h3 className="step-title">Choose Framework</h3>
            <p className="step-desc">
              Pick your stack — Vanilla JS, React, Vue, or Svelte with CSS,
              Tailwind, or Bootstrap.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon"></div>
            <h3 className="step-title">Describe to AI</h3>
            <p className="step-desc">
              Tell the AI what you want. "Build a note-taking app with a dark
              sidebar and markdown support."
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon"></div>
            <h3 className="step-title">Edit Visually</h3>
            <p className="step-desc">
              Click any element to customize its styles. Fine-tune colors,
              layout, and typography visually.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon"></div>
            <h3 className="step-title">Export & Run</h3>
            <p className="step-desc">
              Download a complete Electron project. Install dependencies and
              launch your desktop app instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Frameworks Section */}
      <section className="landing-section" id="frameworks">
        <div className="fade-in-section" ref={addToRefs}>
          <div className="section-header">
            <div className="section-label">
              <Monitor size={14} />
              Supported Stacks
            </div>
          </div>
        </div>

        <div className="frameworks-grid fade-in-section" ref={addToRefs}>
          <div className="framework-card">
            <div className="framework-icon">
              <svg viewBox="0 0 630 630" width="32" height="32">
                <rect width="630" height="630" rx="80" fill="#F7DF1E" />
                <path d="M423.2 492.19c12.69 20.72 29.2 35.95 58.4 35.95 24.53 0 40.2-12.26 40.2-29.2 0-20.3-16.1-27.49-43.1-39.3l-14.8-6.35c-42.72-18.2-71.1-41-71.1-89.2 0-44.4 33.83-78.2 86.7-78.2 37.64 0 64.7 13.1 84.2 47.4l-46.1 29.6c-10.15-18.2-21.1-25.37-38.1-25.37-17.34 0-28.33 11-28.33 25.37 0 17.76 11 24.95 36.4 35.95l14.8 6.34c50.3 21.57 78.7 43.56 78.7 93 0 53.3-41.87 82.5-98.1 82.5-54.98 0-90.5-26.2-107.88-60.54zm-209.13 5.13c9.3 16.5 17.76 30.45 38.1 30.45 19.45 0 31.72-7.61 31.72-37.2v-201.3h59.2v202.1c0 61.3-35.94 89.2-88.4 89.2-47.4 0-74.85-24.53-88.81-54.075z" fill="#000" />
              </svg>
            </div>
            <div className="framework-name">Vanilla JS</div>
            <div className="framework-desc">Pure HTML/CSS/JS</div>
          </div>
          <div className="framework-card">
            <div className="framework-icon">
              <svg viewBox="-11.5 -10.232 23 20.463" width="32" height="32">
                <circle r="2.05" fill="#61DAFB" />
                <g fill="none" stroke="#61DAFB" strokeWidth="1">
                  <ellipse rx="11" ry="4.2" />
                  <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                  <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                </g>
              </svg>
            </div>
            <div className="framework-name">React</div>
            <div className="framework-desc">Component-based UI</div>
          </div>
          <div className="framework-card">
            <div className="framework-icon">
              <svg viewBox="0 0 261.76 226.69" width="32" height="32">
                <path d="M161.096.001l-30.224 52.35L100.647.001H0l130.877 226.688L261.76.001z" fill="#41B883" />
                <path d="M161.096.001l-30.224 52.35L100.647.001H52.346l78.526 136.01L209.398.001z" fill="#34495E" />
              </svg>
            </div>
            <div className="framework-name">Vue.js</div>
            <div className="framework-desc">Progressive framework</div>
          </div>
          <div className="framework-card">
            <div className="framework-icon">
              <svg viewBox="0 0 180 180" width="32" height="32">
                <mask id="nMask" style={{ maskType: 'alpha' }}>
                  <circle cx="90" cy="90" r="90" fill="#000" />
                </mask>
                <g mask="url(#nMask)">
                  <circle cx="90" cy="90" r="90" fill="#000" />
                  <path d="M149.508 157.52L69.142 54H54v71.97h12.114V69.384l73.885 95.461a90.304 90.304 0 009.509-7.325z" fill="url(#nGrad1)" />
                  <rect x="115" y="54" width="12" height="72" fill="url(#nGrad2)" />
                </g>
                <defs>
                  <linearGradient id="nGrad1" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="nGrad2" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="framework-name">Next.js</div>
            <div className="framework-desc">React meta-framework</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-card fade-in-section" ref={addToRefs}>
          <h2 className="cta-title">Ready to Build Something Amazing?</h2>
          <p className="cta-subtitle">
            Start building your desktop application in minutes.
            No setup required — just describe and create.
          </p>
          <Link to="/editor" className="hero-btn-primary" id="cta-bottom">
            <Code2 size={20} />
            Launch Editor
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-left">
          <img src="src/assets/Lanthanum-logos.png" alt="Lanthanum AI" className="footer-logo" />
          <span className="footer-text">© 2026 Lanthanum AI. All rights reserved.</span>
        </div>
        <div className="footer-links">
          <a href="#features" className="footer-link">Features</a>
          <a href="#how-it-works" className="footer-link">How It Works</a>
          <a href="#frameworks" className="footer-link">Frameworks</a>
        </div>
      </footer>
    </div>
  );
}
