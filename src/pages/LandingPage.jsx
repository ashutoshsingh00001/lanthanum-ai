import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Code2, Layout, MousePointer2, Download, Palette, Bot, Monitor, Zap } from 'lucide-react';
import lanthanumLogo from '../assets/Lanthanum.png';
import editorMockup from '../assets/mockup.png';
import lanthanumLogos from '../assets/Lanthanum-logos.png';
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
        <img src={lanthanumLogos} alt="Lanthanum AI" className="nav-logo" />
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
            <h3 className="step-title">Start with Vanilla JS</h3>
            <p className="step-desc">
              The current Beta version focuses exclusively on pure HTML, CSS, and Vanilla JS for maximum speed and simplicity.
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

      {/* Roadmap Section */}
      <section className="landing-section" id="roadmap">
        <div className="fade-in-section" ref={addToRefs}>
          <div className="section-header">
            <div className="section-label">
              <Monitor size={14} />
              Product Roadmap
            </div>
          </div>
        </div>

        <div className="roadmap-grid fade-in-section" ref={addToRefs}>
          <div className="roadmap-card active">
            <div className="roadmap-badge">Current</div>
            <h3 className="roadmap-title">Beta Release</h3>
            <p className="roadmap-desc">
              A rapid UI generator prototype using Vanilla HTML, CSS, and JavaScript.
            </p>
            <ul className="roadmap-list">
              <li><Sparkles size={14}/> Vanilla HTML, CSS, & JS</li>
              <li><Sparkles size={14}/> AI UI Generation</li>
              <li><Sparkles size={14}/> Live Rendering</li>
              <li><Sparkles size={14}/> Rapid Prototyping</li>
            </ul>
          </div>

          <div className="roadmap-card future">
            <div className="roadmap-badge future">Coming Soon</div>
            <h3 className="roadmap-title">v1.0 Release</h3>
            <p className="roadmap-desc">
              A full desktop app code editor with visual editing support for building macOS and Windows applications.
            </p>
            <ul className="roadmap-list">
              <li><ArrowRight size={14}/> Multi-Framework Support (React, Vue, Svelte)</li>
              <li><ArrowRight size={14}/> Visual Property Editor</li>
              <li><ArrowRight size={14}/> Native macOS & Windows App Export</li>
              <li><ArrowRight size={14}/> Full Desktop IDE Experience</li>
            </ul>
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
          <img src={lanthanumLogos} alt="Lanthanum AI" className="footer-logo" />
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
