// js/components/progress-view.js - Progress tracking and display

class ProgressView {
  constructor() {
    this.pipeline = null;
    this.updateInterval = null;
    this.elements = {};
  }

  /**
   * Initialize progress view
   */
  init() {
    this.cacheElements();
    this.setupEventListeners();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      section: document.getElementById('progressSection'),
      bar: document.getElementById('progressBar'),
      message: document.getElementById('progressMessage'),
      time: document.getElementById('progressTime'),
      cancelBtn: document.getElementById('cancelBtn'),
      phases: {
        company: document.querySelector('[data-phase="company"]'),
        competitive: document.querySelector('[data-phase="competitive"]'),
        market: document.querySelector('[data-phase="market"]')
      }
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (this.elements.cancelBtn) {
      this.elements.cancelBtn.addEventListener('click', () => this.handleCancel());
    }
  }

  /**
   * Start tracking progress
   */
  start(pipeline) {
    this.pipeline = pipeline;
    
    // Subscribe to pipeline events
    pipeline.on('phaseStart', (data) => this.handlePhaseStart(data));
    pipeline.on('phaseComplete', (data) => this.handlePhaseComplete(data));
    pipeline.on('phaseError', (data) => this.handlePhaseError(data));
    
    // Show progress section
    this.show();
    
    // Start update loop
    this.startUpdateLoop();
  }

  /**
   * Show progress section
   */
  show() {
    if (this.elements.section) {
      this.elements.section.style.display = 'flex';
    }
    
    // Reset all phases
    Object.values(this.elements.phases).forEach(phase => {
      if (phase) {
        phase.classList.remove('active', 'completed', 'error');
        const check = phase.querySelector('.phase-check');
        const number = phase.querySelector('.phase-number');
        if (check) check.style.display = 'none';
        if (number) number.style.display = 'block';
      }
    });
    
    // Reset progress bar
    if (this.elements.bar) {
      this.elements.bar.style.width = '0%';
    }
    
    // Set initial message
    if (this.elements.message) {
      this.elements.message.textContent = 'Initializing analysis...';
    }
  }

  /**
   * Hide progress section
   */
  hide() {
    if (this.elements.section) {
      this.elements.section.style.display = 'none';
    }
    this.stopUpdateLoop();
  }

  /**
   * Start update loop
   */
  startUpdateLoop() {
    this.stopUpdateLoop();
    
    this.updateInterval = setInterval(() => {
      this.updateProgress();
    }, 500);
  }

  /**
   * Stop update loop
   */
  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update progress display
   */
  updateProgress() {
    if (!this.pipeline) return;
    
    const progress = this.pipeline.getProgress();
    
    // Update progress bar
    if (this.elements.bar) {
      this.elements.bar.style.width = `${progress.percentage}%`;
    }
    
    // Update time display
    if (this.elements.time) {
      const elapsed = Formatters.duration(progress.elapsed);
      const estimated = Formatters.duration(progress.estimated);
      this.elements.time.textContent = `${elapsed} / ${estimated}`;
    }
  }

  /**
   * Handle phase start
   */
  handlePhaseStart(data) {
    const phaseElement = this.elements.phases[data.phase];
    if (phaseElement) {
      phaseElement.classList.add('active');
      phaseElement.classList.remove('completed', 'error');
    }
    
    // Update message
    if (this.elements.message) {
      const messages = {
        company: 'Analyzing company website and extracting information...',
        competitive: 'Analyzing competitive landscape and market players...',
        market: 'Analyzing market opportunity and growth potential...'
      };
      
      this.elements.message.textContent = messages[data.phase] || `Running ${data.name}...`;
    }
  }

  /**
   * Handle phase complete
   */
  handlePhaseComplete(data) {
    const phaseElement = this.elements.phases[data.phase];
    if (phaseElement) {
      phaseElement.classList.remove('active');
      phaseElement.classList.add('completed');
      
      // Show check mark
      const check = phaseElement.querySelector('.phase-check');
      const number = phaseElement.querySelector('.phase-number');
      if (check) check.style.display = 'block';
      if (number) number.style.display = 'none';
    }
    
    // Update message
    if (this.elements.message) {
      this.elements.message.textContent = `${data.name} completed in ${Math.round(data.duration)} seconds`;
    }
  }

  /**
   * Handle phase error
   */
  handlePhaseError(data) {
    const phaseElement = this.elements.phases[data.phase];
    if (phaseElement) {
      phaseElement.classList.remove('active');
      phaseElement.classList.add('error');
    }
    
    // Update message
    if (this.elements.message) {
      this.elements.message.textContent = `Error in ${data.name}: ${data.error}`;
      this.elements.message.style.color = 'var(--danger)';
    }
    
    this.stopUpdateLoop();
  }

  /**
   * Handle cancel
   */
  handleCancel() {
    if (this.pipeline) {
      const confirmed = confirm('Are you sure you want to cancel the analysis?');
      if (confirmed) {
        this.pipeline.cancel();
        this.hide();
      }
    }
  }

  /**
   * Reset view
   */
  reset() {
    this.pipeline = null;
    this.stopUpdateLoop();
    
    // Reset elements
    if (this.elements.message) {
      this.elements.message.textContent = 'Initializing...';
      this.elements.message.style.color = '';
    }
    
    if (this.elements.bar) {
      this.elements.bar.style.width = '0%';
    }
    
    if (this.elements.time) {
      this.elements.time.textContent = '0:00 / 20:00';
    }
  }
}

// Make available globally
window.ProgressView = ProgressView;