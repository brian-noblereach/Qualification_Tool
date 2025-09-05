// js/app.js - Main Application Controller

const App = {
    // Application state
    initialized: false,
    progressInterval: null,
    startTime: null,
    currentPhase: null,
    
    // Initialize application
    init() {
        if (this.initialized) return;
        
        console.log('Initializing Venture Assessment Platform...');
        
        // Initialize components
        AssessmentComponent.init();
        EvidenceComponent.init();
        
        // Setup main event listeners
        this.setupEventListeners();
        
        // Load saved state if available
        this.loadSavedState();
        
        // Add CSS animations if not present
        this.injectAnimations();
        
        this.initialized = true;
        console.log('Application initialized successfully');
    },
    
    // Setup main event listeners
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
            exportBtn.addEventListener('click', () => ExportUtility.generateReport());
        }
        if (finalExportBtn) {
            finalExportBtn.addEventListener('click', () => ExportUtility.generateReport());
        }
        
        // Retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryAnalysis());
        }
        
        // Auto-save technology description
        const techInput = document.getElementById('techDescription');
        if (techInput) {
            techInput.addEventListener('input', () => {
                StateManager.setState({ techDescription: techInput.value });
                StateManager.save();
            });
        }
    },
    
    // Run complete analysis
    async runAnalysis() {
        const techDescription = document.getElementById('techDescription').value.trim();
        
        if (!techDescription) {
            this.showValidationError('Please provide a technology description');
            return;
        }
        
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
            console.log('Market analysis complete');
            
            // Process and display results
            this.processResults(competitiveResult, marketResult);
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showError(error);
        } finally {
            this.stopProgress();
            StateManager.setState({ isAnalyzing: false });
        }
    },
    
    // Process analysis results
    processResults(competitiveResult, marketResult) {
        // Load competitive results
        AssessmentComponent.loadCompetitiveResults(competitiveResult);
        
        // Load market results
        AssessmentComponent.loadMarketResults(marketResult);
        
        // Show assessment section
        this.showSection('assessment');
        
        // Show tabs and controls
        document.getElementById('assessmentTabs').style.display = 'flex';
        document.getElementById('newAnalysisBtn').style.display = 'inline-block';
        document.getElementById('exportBtn').style.display = 'inline-block';
        document.getElementById('assessmentProgress').style.display = 'flex';
        
        // Default to competitive assessment
        AssessmentComponent.switchAssessment('competitive');
        
        // Save state
        StateManager.save();
        
        // Show success notification
        this.showSuccessNotification();
    },
    
    // Update loading phase
    updatePhase(phase) {
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
            loadingTitle.textContent = phase === 'competitive' ? 
                'Analyzing Competitive Landscape' : 
                'Analyzing Market Opportunity';
        }
    },
    
    // Start progress animation
    startProgress() {
        this.startTime = Date.now();
        let lastMessageIndex = -1;
        
        this.progressInterval = setInterval(() => {
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
            const messages = this.currentPhase === 'competitive' ? 
                CompetitiveAPI.progressMessages : 
                MarketAPI.progressMessages;
            
            const currentMessage = messages.filter(m => m.time <= elapsed).pop();
            if (currentMessage && messages.indexOf(currentMessage) !== lastMessageIndex) {
                lastMessageIndex = messages.indexOf(currentMessage);
                const statusEl = document.getElementById('progressStatus');
                if (statusEl) {
                    statusEl.textContent = currentMessage.message;
                }
            }
        }, 500);
    },
    
    // Stop progress animation
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
    },
    
    // Show specific section
    showSection(section) {
        const sections = ['input', 'loading', 'assessment', 'error'];
        sections.forEach(s => {
            const el = document.getElementById(`${s}Section`);
            if (el) {
                el.style.display = s === section ? 'block' : 'none';
                
                // Special handling for assessment section
                if (s === 'assessment' && section === 'assessment') {
                    el.style.display = 'flex';
                    el.style.flexDirection = 'column';
                    el.style.flex = '1';
                }
            }
        });
    },
    
    // Update header
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
    
    // Show validation error
    showValidationError(message) {
        const input = document.getElementById('techDescription');
        if (input) {
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
            `;
            
            input.parentElement.appendChild(errorMsg);
            
            // Remove after 3 seconds
            setTimeout(() => {
                input.style.borderColor = '';
                errorMsg.remove();
            }, 3000);
        }
    },
    
    // Show error section
    showError(error) {
        this.showSection('error');
        
        const messageEl = document.getElementById('errorMessage');
        const detailsEl = document.getElementById('errorDetails');
        
        if (messageEl) {
            messageEl.textContent = error.message || 'An unexpected error occurred';
        }
        
        if (detailsEl) {
            detailsEl.textContent = error.stack || '';
            detailsEl.style.display = error.stack ? 'block' : 'none';
        }
        
        // Store error for retry
        StateManager.setState({ lastError: error });
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
    
    // Start new analysis
    startNewAnalysis() {
        if (confirm('Are you sure you want to start a new analysis? Current progress will be lost.')) {
            // Reset state
            StateManager.reset();
            
            // Clear input
            const techInput = document.getElementById('techDescription');
            if (techInput) {
                techInput.value = '';
            }
            
            // Reset UI
            this.showSection('input');
            document.getElementById('assessmentTabs').style.display = 'none';
            document.getElementById('newAnalysisBtn').style.display = 'none';
            document.getElementById('exportBtn').style.display = 'none';
            document.getElementById('assessmentProgress').style.display = 'none';
            
            // Update header
            document.getElementById('companyName').textContent = 'Venture Assessment Platform';
            document.getElementById('companyMeta').textContent = 'Enter technology description to begin assessment';
        }
    },
    
    // Load saved state
    loadSavedState() {
        if (StateManager.load()) {
            const state = StateManager.getState();
            
            // Restore technology description
            const techInput = document.getElementById('techDescription');
            if (techInput && state.techDescription) {
                techInput.value = state.techDescription;
            }
            
            // If analysis was completed, show results
            if (state.assessments.competitive.data || state.assessments.market.data) {
                AssessmentComponent.restoreFromState();
            }
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
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
            
            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -40%);
                }
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
        `;
        
        document.head.appendChild(style);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}