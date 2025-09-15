// js/core/app.js - Main application controller

class App {
  constructor() {
    this.pipeline = null;
    this.progressView = null;
    this.assessmentView = null;
    this.summaryView = null;
    this.state = 'idle'; // idle, analyzing, results, error
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      console.log('Initializing Venture Assessment Platform...');
      
      // Initialize components
      this.pipeline = new AnalysisPipeline();
      this.progressView = new ProgressView();
      this.assessmentView = new AssessmentView();
      this.summaryView = new SummaryView();
      
      // Initialize views
      this.progressView.init();
      this.assessmentView.init();
      this.summaryView.init();
      // Make assessment view globally accessible for onclick handlers
	window.assessmentView = this.assessmentView;
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup pipeline callbacks
      this.setupPipelineCallbacks();
      
      console.log('Application initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.startAnalysis());
    }
    
    // New analysis button
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    if (newAnalysisBtn) {
      newAnalysisBtn.addEventListener('click', () => this.resetAnalysis());
    }
    
    // Export buttons
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportReport());
    }
    
    const exportFinalBtn = document.getElementById('exportFinalBtn');
    if (exportFinalBtn) {
      exportFinalBtn.addEventListener('click', () => this.exportReport());
    }
    
    // Error section buttons
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.retryAnalysis());
    }
    
    const startOverBtn = document.getElementById('startOverBtn');
    if (startOverBtn) {
      startOverBtn.addEventListener('click', () => this.resetAnalysis());
    }
    
    // Enter key on URL input
    const urlInput = document.getElementById('companyUrl');
    if (urlInput) {
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.startAnalysis();
        }
      });
    }
  }

  /**
   * Setup pipeline callbacks
   */
  setupPipelineCallbacks() {
    this.pipeline.on('start', () => {
      this.state = 'analyzing';
    });
    
    this.pipeline.on('complete', (results) => {
      this.handleAnalysisComplete(results);
    });
    
    this.pipeline.on('error', (error) => {
      this.handleAnalysisError(error);
    });
    
    this.pipeline.on('cancelled', () => {
      this.handleAnalysisCancelled();
    });
  }

  /**
   * Start analysis
   */
  async startAnalysis() {
	  // Get and validate URL
	  const urlInput = document.getElementById('companyUrl');
	  if (!urlInput) return;
	  
	  const url = urlInput.value.trim();
	  if (!url) {
		this.showValidationError('Please enter a company website URL');
		return;
	  }
	  
	  // Validate URL format
	  const validation = Validators.validateUrl(url);
	  if (!validation.valid) {
		this.showValidationError(validation.error);
		return;
	  }
	  
	  // Request notification permission (more explicit)
	  try {
		const hasPermission = await this.requestNotificationPermission();
		if (!hasPermission && Notification.permission === 'default') {
		  // User hasn't decided yet, show a friendly message
		  const wantsNotifications = confirm(
			'Would you like to receive a notification when the analysis completes?\n\n' +
			'This allows you to work on other tasks while waiting.'
		  );
		  if (wantsNotifications) {
			await this.requestNotificationPermission();
		  }
		}
	  } catch (e) {
		console.log('Notification permission request failed:', e);
	  }
	  
	  try {
		// Hide input section, show progress
		this.showSection('progress');
		
		// Start progress tracking
		this.progressView.start(this.pipeline);
		
		// Run analysis
		await this.pipeline.start(validation.url);
		
	  } catch (error) {
		console.error('Analysis failed:', error);
		this.handleAnalysisError(error);
	  }
	}

  /**
   * Handle analysis complete
   */
  handleAnalysisComplete(results) {
	  this.state = 'results';
	  
	  // Browser notification
	  const companyName = results.company?.company_overview?.name || 'Company';
	  this.showDesktopNotification(
		'✅ Analysis Complete!',
		`${companyName} assessment is ready for review`,
		'/favicon.ico'
	  );
	  
	  // Update page title
	  const originalTitle = document.title;
	  document.title = '✅ Analysis Complete - ' + originalTitle;
  
    // Hide progress
    this.progressView.hide();
    
    // Load results into assessment view
    this.assessmentView.loadResults(results);
    
    // Update summary
    this.summaryView.update(results);
    
    // Show results section
    this.showSection('results');
    
    // Show header buttons
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    if (newAnalysisBtn) {
      newAnalysisBtn.style.display = 'inline-block';
    }
  }

  /**
   * Handle analysis error
   */
  handleAnalysisError(error) {
    this.state = 'error';
    
    // Hide progress
    this.progressView.hide();
    
    // Show error
    this.showError(error.message || 'An unexpected error occurred');
  }

  /**
   * Handle analysis cancelled
   */
  handleAnalysisCancelled() {
    this.state = 'idle';
    
    // Hide progress
    this.progressView.hide();
    
    // Show input section
    this.showSection('input');
  }

  /**
   * Retry analysis
   */
  async retryAnalysis() {
    const urlInput = document.getElementById('companyUrl');
    if (urlInput && urlInput.value) {
      await this.startAnalysis();
    } else {
      this.resetAnalysis();
    }
  }

  /**
   * Reset analysis
   */
  resetAnalysis() {
    // Confirm if in progress
    if (this.state === 'analyzing') {
      const confirmed = confirm('Analysis in progress. Are you sure you want to start over?');
      if (!confirmed) return;
      
      // Cancel current analysis
      this.pipeline.cancel();
    }
    
    // Reset state
    this.state = 'idle';
    
    // Reset pipeline
    this.pipeline.reset();
    
    // Reset views
    this.progressView.reset();
    
    // Clear input
    const urlInput = document.getElementById('companyUrl');
    if (urlInput) {
      urlInput.value = '';
      urlInput.focus();
    }
    
    // Hide buttons
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    const exportBtn = document.getElementById('exportBtn');
    if (newAnalysisBtn) newAnalysisBtn.style.display = 'none';
    if (exportBtn) exportBtn.style.display = 'none';
    
    // Show input section
    this.showSection('input');
  }

  /**
   * Export report
   */
  async exportReport() {
    try {
      // Check if jsPDF is loaded
      if (!window.jspdf) {
        throw new Error('PDF library not loaded. Please refresh the page.');
      }
      
      // Get export data from assessment view
      const data = this.assessmentView.getExportData();
      
      // Validate data
      const validation = Validators.validateExportData(data);
      if (!validation.valid) {
        alert(`Cannot export: ${validation.errors.join('\n')}`);
        return;
      }
      
      // Show loading indicator
      this.showExportProgress();
      
      // Generate PDF
      const filename = await ExportUtility.generateReport(data);
      
      // Hide loading indicator
      this.hideExportProgress();
      
      // Show success message
      this.showExportSuccess(filename);
      
    } catch (error) {
      console.error('Export failed:', error);
      this.hideExportProgress();
      alert(`Export failed: ${error.message}`);
    }
  }

  /**
   * Show validation error
   */
  showValidationError(message) {
    const urlInput = document.getElementById('companyUrl');
    if (!urlInput) return;
    
    // Add error styling
    urlInput.style.borderColor = 'var(--danger)';
    urlInput.focus();
    
    // Show error message
    let errorEl = urlInput.parentElement.querySelector('.validation-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'validation-error';
      errorEl.style.cssText = 'color: var(--danger); font-size: 0.875rem; margin-top: 0.5rem;';
      urlInput.parentElement.appendChild(errorEl);
    }
    
    errorEl.textContent = message;
    
    // Remove after 5 seconds
    setTimeout(() => {
      urlInput.style.borderColor = '';
      if (errorEl) errorEl.remove();
    }, 5000);
  }

  /**
   * Show error section
   */
  showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    
    this.showSection('error');
  }

  /**
   * Show section
   */
  showSection(section) {
    const sections = ['input', 'progress', 'results', 'error'];
    
    sections.forEach(s => {
      const element = document.getElementById(`${s}Section`);
      if (element) {
        if (s === section) {
          element.style.display = s === 'progress' ? 'flex' : 'block';
        } else {
          element.style.display = 'none';
        }
      }
    });
  }

  /**
   * Show export progress
   */
  showExportProgress() {
    const overlay = document.createElement('div');
    overlay.id = 'exportOverlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        text-align: center;
      ">
        <div style="
          width: 50px;
          height: 50px;
          border: 3px solid var(--gray-200);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        "></div>
        <p>Generating PDF report...</p>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  /**
   * Hide export progress
   */
  hideExportProgress() {
    const overlay = document.getElementById('exportOverlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Show export success
   */
  showExportSuccess(filename) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--success);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: var(--shadow-xl);
      animation: slideIn 0.3s ease;
      z-index: 10000;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;">✓</span>
        <div>
          <strong>Export Successful</strong>
          <div style="font-size: 0.875rem; opacity: 0.9;">${filename}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
	  async requestNotificationPermission() {
	  // Check if notifications are supported
	  if (!("Notification" in window)) {
		console.log("This browser does not support notifications");
		return false;
	  }
	  
	  // Check current permission
	  if (Notification.permission === "granted") {
		return true;
	  }
	  
	  // Request permission if not denied
	  if (Notification.permission !== "denied") {
		try {
		  const permission = await Notification.requestPermission();
		  return permission === "granted";
		} catch (error) {
		  // Handle browsers that don't return a promise
		  Notification.requestPermission(function(permission) {
			return permission === "granted";
		  });
		}
	  }
	  
	  return false;
	}

	showDesktopNotification(title, body, icon = null) {
	  if (Notification.permission === "granted") {
		const notification = new Notification(title, {
		  body: body,
		  icon: icon || '/favicon.ico',
		  badge: '/favicon.ico',
		  vibrate: [200, 100, 200],
		  tag: 'analysis-complete',
		  requireInteraction: true // Keeps notification visible until clicked
		});
		
		notification.onclick = () => {
		  window.focus();
		  notification.close();
		};
		
		// Auto-close after 30 seconds
		setTimeout(() => notification.close(), 30000);
	  }
	}
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});

// Handle beforeunload
window.addEventListener('beforeunload', (e) => {
  if (window.app && window.app.state === 'analyzing') {
    e.preventDefault();
    e.returnValue = 'Analysis in progress. Are you sure you want to leave?';
  }
});