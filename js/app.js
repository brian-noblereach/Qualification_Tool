// js/app.js - Main Application Controller with Enhanced Error Handling and State Management

const App = {
    // Application state
    initialized: false,
    progressInterval: null,
    startTime: null,
    currentPhase: null,
    isAnalyzing: false,
    
    // Initialize application with async component loading
    async init() {
        if (this.initialized) {
            console.debug('Application already initialized');
            return true;
        }
        
        console.log('Initializing Venture Assessment Platform...');
        
        try {
            // Initialize state manager first
            if (!StateManager.initialized) {
                StateManager.init();
            }
            
            // Initialize components in sequence
            const assessmentInit = await AssessmentComponent.init();
            if (!assessmentInit) {
                throw new Error('Failed to initialize assessment component');
            }
            
            // Setup main event listeners
            this.setupEventListeners();
            
            // Add CSS animations if not present
            this.injectAnimations();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('Application initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showInitializationError(error);
            return false;
        }
    },
    
    // Setup main event listeners with proper error handling
    setupEventListeners() {
        // Analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.runAnalysis());
        }
        
        // New analysis button
        const newAnalysisBtn = document.getElementById('newAnalysisBtn');
        if (newAnalysisBtn) {
            newAnalysisBtn.addEventListener('click', () => this.startNewAnalysis());
        }
        
        // Export buttons
        const exportBtn = document.getElementById('exportBtn');
        const finalExportBtn = document.getElementById('finalExportBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }
        if (finalExportBtn) {
            finalExportBtn.addEventListener('click', () => this.handleExport());
        }
        
        // Retry button in error section
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryAnalysis());
        }
        
        // Auto-save technology description with debouncing
        const techInput = document.getElementById('techDescription');
        if (techInput) {
            let saveTimeout;
            techInput.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    StateManager.setState({ techDescription: techInput.value });
                    StateManager.save();
                }, 500);
            });
        }
        
        // Handle page visibility change to pause/resume progress
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.progressInterval) {
                console.log('Page hidden, pausing progress updates');
            }
        });
    },
    
    // Run complete analysis with enhanced error handling
    async runAnalysis() {
        // Prevent multiple simultaneous analyses
        if (this.isAnalyzing) {
            console.warn('Analysis already in progress');
            return;
        }
        
        const techDescription = document.getElementById('techDescription')?.value?.trim();
        
        if (!techDescription) {
            this.showValidationError('Please provide a technology description');
            return;
        }
        
        // Minimum length validation
        if (techDescription.length < 20) {
            this.showValidationError('Please provide a more detailed technology description (at least 20 characters)');
            return;
        }
        
        this.isAnalyzing = true;
        
        // Update state
        StateManager.setState({
            techDescription,
            isAnalyzing: true,
            currentAssessment: null
        });
        
        // Update header
        this.updateHeader(techDescription);
        
        // Show loading
        this.showSection('loading');
        this.startProgress();
        
        try {
            // Phase 1: Competitive Analysis
            this.updatePhase('competitive');
            console.log('Starting competitive analysis...');
            
            const competitiveResult = await CompetitiveAPI.retryAnalysis(techDescription);
            
            if (!competitiveResult || !competitiveResult.formatted) {
                throw new Error('Invalid competitive analysis result');
            }
            
            console.log('Competitive analysis complete');
            
            // Store competitive analysis text for market analysis
            StateManager.setState({ 
                competitiveAnalysisText: competitiveResult.competitiveAnalysisText 
            });
            
            // Phase 2: Market Analysis
            this.updatePhase('market');
            console.log('Starting market analysis...');
            
            const marketResult = await MarketAPI.retryAnalysis(
                techDescription, 
                competitiveResult.competitiveAnalysisText
            );
            
            if (!marketResult || !marketResult.formatted) {
                throw new Error('Invalid market analysis result');
            }
            
            console.log('Market analysis complete');
            
            // Process and display results
            this.processResults(competitiveResult, marketResult);
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showError(error);
        } finally {
            this.stopProgress();
            this.isAnalyzing = false;
            StateManager.setState({ isAnalyzing: false });
        }
    },
    
    // Process analysis results with validation
    processResults(competitiveResult, marketResult) {
        try {
            // Load competitive results using standardized structure
            const competitiveLoaded = AssessmentComponent.loadCompetitiveResults(competitiveResult);
            
            if (!competitiveLoaded) {
                throw new Error('Failed to load competitive results');
            }
            
            // Load market results using standardized structure
            const marketLoaded = AssessmentComponent.loadMarketResults(marketResult);
            
            if (!marketLoaded) {
                throw new Error('Failed to load market results');
            }
            
            // Show assessment section
            this.showSection('assessment');
            
            // Show tabs and controls
            this.showAssessmentControls();
            
            // Default to competitive assessment
            AssessmentComponent.switchAssessment('competitive');
            
            // Save state
            StateManager.save();
            
            // Show success notification
            this.showSuccessNotification();
            
        } catch (error) {
            console.error('Failed to process results:', error);
            this.showError(error);
        }
    },
    
    // Show assessment controls
    showAssessmentControls() {
        const elements = {
            assessmentTabs: document.getElementById('assessmentTabs'),
            newAnalysisBtn: document.getElementById('newAnalysisBtn'),
            exportBtn: document.getElementById('exportBtn'),
            assessmentProgress: document.getElementById('assessmentProgress')
        };
        
        Object.entries(elements).forEach(([name, element]) => {
            if (element) {
                element.style.display = name === 'assessmentTabs' || name === 'assessmentProgress' 
                    ? 'flex' 
                    : 'inline-block';
            }
        });
    },
    
    // Update loading phase with validation
    updatePhase(phase) {
        if (!['competitive', 'market', 'complete'].includes(phase)) {
            console.error(`Invalid phase: ${phase}`);
            return;
        }
        
        this.currentPhase = phase;
        StateManager.setState({ analysisPhase: phase });
        
        // Update UI
        document.querySelectorAll('.phase-indicator').forEach(indicator => {
            const indicatorPhase = indicator.dataset.phase;
            
            if (indicatorPhase === phase) {
                indicator.classList.add('active');
                indicator.classList.remove('complete');
            } else if (
                (phase === 'market' && indicatorPhase === 'competitive') ||
                (phase === 'complete' && indicatorPhase !== 'complete')
            ) {
                indicator.classList.remove('active');
                indicator.classList.add('complete');
            }
        });
        
        // Update loading title
        const loadingTitle = document.getElementById('loadingTitle');
        if (loadingTitle) {
            const titles = {
                competitive: 'Analyzing Competitive Landscape',
                market: 'Analyzing Market Opportunity',
                complete: 'Analysis Complete'
            };
            loadingTitle.textContent = titles[phase] || 'Processing...';
        }
    },
    
    // Start progress animation with proper cleanup
    startProgress() {
        // Clear any existing interval
        this.stopProgress();
        
        this.startTime = Date.now();
        let lastMessageIndex = -1;
        
        this.progressInterval = setInterval(() => {
            // Check if still analyzing
            if (!this.isAnalyzing) {
                this.stopProgress();
                return;
            }
            
            const elapsed = (Date.now() - this.startTime) / 1000;
            const minutes = Math.floor(elapsed / 60);
            const seconds = Math.floor(elapsed % 60);
            
            // Update time
            const timeEl = document.getElementById('timeElapsed');
            if (timeEl) {
                timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Update progress bar
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                const expectedDuration = this.currentPhase === 'competitive' ? 150 : 365;
                const progress = Math.min(95, (elapsed / expectedDuration) * 100);
                progressBar.style.width = `${progress}%`;
            }
            
            // Update status message
            const messages = this.currentPhase === 'competitive' 
                ? CompetitiveAPI.progressMessages 
                : MarketAPI.progressMessages;
            
            if (messages && messages.length > 0) {
                const currentMessage = messages.filter(m => m.time <= elapsed).pop();
                if (currentMessage && messages.indexOf(currentMessage) !== lastMessageIndex) {
                    lastMessageIndex = messages.indexOf(currentMessage);
                    const statusEl = document.getElementById('progressStatus');
                    if (statusEl) {
                        statusEl.textContent = currentMessage.message;
                    }
                }
            }
        }, 500);
    },
    
    // Stop progress animation with cleanup
    stopProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        // Complete progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        
        // Reset time
        this.startTime = null;
    },
    
    // Show specific section with proper layout preservation
    showSection(section) {
        const validSections = ['input', 'loading', 'assessment', 'error'];
        
        if (!validSections.includes(section)) {
            console.error(`Invalid section: ${section}`);
            return;
        }
        
        validSections.forEach(s => {
            const el = document.getElementById(`${s}Section`);
            if (el) {
                if (s === section) {
                    // Preserve specific layout requirements
                    if (s === 'loading') {
                        el.style.display = 'flex'; // Center the loading modal
                    } else if (s === 'assessment') {
                        el.style.display = 'flex';
                        el.style.flexDirection = 'column';
                        el.style.flex = '1';
                    } else {
                        el.style.display = 'block';
                    }
                } else {
                    el.style.display = 'none';
                }
            }
        });
    },
    
    // Update header with truncation
    updateHeader(techDescription) {
        const nameEl = document.getElementById('companyName');
        const metaEl = document.getElementById('companyMeta');
        
        if (nameEl) {
            nameEl.textContent = Formatters.truncate(techDescription, 60);
        }
        if (metaEl) {
            metaEl.textContent = 'Competitive Risk & Market Opportunity Analysis';
        }
    },
    
    // Show validation error with improved UX
    showValidationError(message) {
        const input = document.getElementById('techDescription');
        if (!input) return;
        
        // Remove any existing error
        const existingError = input.parentElement.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        input.style.borderColor = 'var(--danger)';
        input.focus();
        
        // Add error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'validation-error';
        errorMsg.textContent = message;
        errorMsg.style.cssText = `
            color: var(--danger);
            font-size: 0.875rem;
            margin-top: 0.5rem;
            animation: fadeIn 0.3s ease;
        `;
        
        input.parentElement.appendChild(errorMsg);
        
        // Remove after 5 seconds
        setTimeout(() => {
            input.style.borderColor = '';
            errorMsg.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => errorMsg.remove(), 300);
        }, 5000);
    },
    
    // Show error section with details
    showError(error) {
        this.showSection('error');
        
        const messageEl = document.getElementById('errorMessage');
        const detailsEl = document.getElementById('errorDetails');
        
        if (messageEl) {
            messageEl.textContent = error.message || 'An unexpected error occurred';
        }
        
        if (detailsEl) {
            // Only show stack trace in development mode
            const isDev = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
            
            if (isDev && error.stack) {
                detailsEl.textContent = error.stack;
                detailsEl.style.display = 'block';
            } else {
                detailsEl.style.display = 'none';
            }
        }
        
        // Store error for retry
        StateManager.setState({ lastError: error });
    },
    
    // Show initialization error
    showInitializationError(error) {
        const container = document.body;
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 0.5rem;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                max-width: 400px;
                text-align: center;
            ">
                <h2 style="color: var(--danger); margin-bottom: 1rem;">Initialization Error</h2>
                <p style="margin-bottom: 1rem;">${error.message || 'Failed to initialize application'}</p>
                <button onclick="location.reload()" style="
                    padding: 0.5rem 1rem;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                ">Reload Page</button>
            </div>
        `;
        container.appendChild(errorDiv);
    },
    
    // Retry analysis
    async retryAnalysis() {
        const state = StateManager.getState();
        if (state.techDescription) {
            await this.runAnalysis();
        } else {
            this.showSection('input');
        }
    },
    
    // Start new analysis with confirmation
    startNewAnalysis() {
        const hasData = StateManager.getState().assessments.competitive.data || 
                       StateManager.getState().assessments.market.data;
        
        if (hasData) {
            if (!confirm('Are you sure you want to start a new analysis? Current progress will be lost.')) {
                return;
            }
        }
        
        // Reset state
        StateManager.reset();
        
        // Clear input
        const techInput = document.getElementById('techDescription');
        if (techInput) {
            techInput.value = '';
            techInput.focus();
        }
        
        // Reset UI
        this.resetUI();
    },
    
    // Reset UI to initial state
    resetUI() {
        this.showSection('input');
        
        // Hide controls
        const elementsToHide = [
            'assessmentTabs',
            'newAnalysisBtn',
            'exportBtn',
            'assessmentProgress'
        ];
        
        elementsToHide.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
        // Reset header
        const nameEl = document.getElementById('companyName');
        const metaEl = document.getElementById('companyMeta');
        
        if (nameEl) nameEl.textContent = 'Venture Assessment Platform';
        if (metaEl) metaEl.textContent = 'Enter technology description to begin assessment';
    },
    
    // Handle export with validation
    async handleExport() {
        try {
            // Check if jsPDF is loaded
            if (!window.jspdf) {
                throw new Error('PDF library not loaded. Please refresh the page and try again.');
            }
            
            await ExportUtility.generateReport();
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error.message}`);
        }
    },
    
    // Show success notification
    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <span>✓</span>
            <div>
                <strong>Analysis Complete!</strong>
                <p>You can now assess both competitive risk and market opportunity.</p>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: var(--success);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-xl);
            display: flex;
            align-items: center;
            gap: 1rem;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    },
    
    // Inject CSS animations
    injectAnimations() {
        if (document.getElementById('appAnimations')) return;
        
        const style = document.createElement('style');
        style.id = 'appAnimations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            
            @keyframes scaleIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            @keyframes scaleOut {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
            }
            
            .no-data {
                opacity: 0.5;
                font-style: italic;
            }
            
            .empty-list {
                opacity: 0.7;
            }
            
            .validation-error {
                animation: fadeIn 0.3s ease;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // Cleanup application
    cleanup() {
        // Stop any running intervals
        this.stopProgress();
        
        // Cleanup components
        if (AssessmentComponent.cleanup) {
            AssessmentComponent.cleanup();
        }
        
        // Reset state
        this.initialized = false;
        this.isAnalyzing = false;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    // DOM is already ready
    App.init();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (App.isAnalyzing) {
        return 'Analysis in progress. Are you sure you want to leave?';
    }
});