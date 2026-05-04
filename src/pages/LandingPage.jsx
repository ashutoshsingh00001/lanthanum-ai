import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Code2, Layout, MousePointer2, Download, Palette, Bot, Monitor, Zap } from 'lucide-react';
import lanthanumLogo from '../assets/Lanthanum.png';
import editorMockup from '../assets/editor-mockup.png';
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
        <img src={lanthanumLogo} alt="Lanthanum AI" className="nav-logo" />
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#frameworks" className="nav-link">Frameworks</a>
          <Link to="/editor" className="nav-cta">
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
          Build Desktop Apps{' '}
          <span className="hero-title-gradient">Visually with AI</span>
        </h1>

        <p className="hero-subtitle">
          Design, code, and export stunning macOS & Windows desktop apps using 
          natural language. Visual editing meets AI intelligence — no boilerplate, 
          no friction.
        </p>

        <div className="hero-actions">
          <Link to="/editor" className="hero-btn-primary" id="hero-cta">
            <Sparkles size={20} />
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
            <h2 className="section-title">Everything You Need to Build</h2>
            <p className="section-subtitle">
              From AI code generation to visual editing and one-click export — 
              Lanthanum AI covers the entire desktop app workflow.
            </p>
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
            <h2 className="section-title">From Idea to Desktop App in Minutes</h2>
            <p className="section-subtitle">
              Four simple steps to go from a concept to a fully-functional 
              macOS or Windows application.
            </p>
          </div>
        </div>

        <div className="steps-container fade-in-section" ref={addToRefs}>
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">⚙️</div>
            <h3 className="step-title">Choose Framework</h3>
            <p className="step-desc">
              Pick your stack — Vanilla JS, React, Vue, or Svelte with CSS, 
              Tailwind, or Bootstrap.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">🤖</div>
            <h3 className="step-title">Describe to AI</h3>
            <p className="step-desc">
              Tell the AI what you want. "Build a note-taking app with a dark 
              sidebar and markdown support."
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">🎨</div>
            <h3 className="step-title">Edit Visually</h3>
            <p className="step-desc">
              Click any element to customize its styles. Fine-tune colors, 
              layout, and typography visually.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon">📦</div>
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
            <h2 className="section-title">Your Favorite Frameworks</h2>
            <p className="section-subtitle">
              Choose the frontend and styling combination that fits your workflow. 
              The AI adapts its output accordingly.
            </p>
          </div>
        </div>

        <div className="frameworks-grid fade-in-section" ref={addToRefs}>
          <div className="framework-card">
            <div className="framework-icon">⚡</div>
            <div className="framework-name">Vanilla JS</div>
            <div className="framework-desc">Pure HTML/CSS/JS</div>
          </div>
          <div className="framework-card">
            <div className="framework-icon">⚛️</div>
            <div className="framework-name">React</div>
            <div className="framework-desc">Component-based UI</div>
          </div>
          <div className="framework-card">
            <div className="framework-icon">💚</div>
            <div className="framework-name">Vue.js</div>
            <div className="framework-desc">Progressive framework</div>
          </div>
          <div className="framework-card">
            <div className="framework-icon">🔥</div>
            <div className="framework-name">Svelte</div>
            <div className="framework-desc">Compiled framework</div>
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
            <Sparkles size={20} />
            Launch Editor
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-left">
          <img src={lanthanumLogo} alt="Lanthanum AI" className="footer-logo" />
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
