// js/state/store.js - Centralized State Management

const AppState = {
    // Current view state
    currentAssessment: null, // 'competitive' | 'market' | 'summary'
    isAnalyzing: false,
    analysisPhase: null, // 'competitive' | 'market'
    
    // Technology input
    techDescription: '',
    
    // Assessment data
    assessments: {
        competitive: {
            status: 'pending', // 'pending' | 'in-progress' | 'complete'
            aiScore: null,
            userScore: null,
            justification: '',
            submitted: false,
            data: null,
            rawResponse: null,
            timestamp: null
        },
        market: {
            status: 'pending',
            aiScore: null,
            userScore: null,
            justification: '',
            submitted: false,
            data: null,
            rawResponse: null,
            timestamp: null
        }
    },
    
    // Competitive analysis output (used as input for market analysis)
    competitiveAnalysisText: null,
    
    // Error tracking
    lastError: null,
    retryCount: 0,
    maxRetries: 3
};

// State management functions
const StateManager = {
    // Get current state
    getState() {
        return AppState;
    },
    
    // Update state with partial updates
    setState(updates) {
        Object.assign(AppState, updates);
        this.notifyListeners();
    },
    
    // Update assessment data
    setAssessmentData(type, data) {
        AppState.assessments[type] = {
            ...AppState.assessments[type],
            ...data,
            timestamp: new Date().toISOString()
        };
        this.notifyListeners();
    },
    
    // Get assessment data
    getAssessment(type) {
        return AppState.assessments[type];
    },
    
    // Check if all assessments are complete
    areAllAssessmentsComplete() {
        return Object.values(AppState.assessments).every(a => a.submitted);
    },
    
    // Count completed assessments
    getCompletedCount() {
        return Object.values(AppState.assessments).filter(a => a.submitted).length;
    },
    
    // Reset state for new analysis
    reset() {
        AppState.currentAssessment = null;
        AppState.isAnalyzing = false;
        AppState.analysisPhase = null;
        AppState.competitiveAnalysisText = null;
        AppState.lastError = null;
        AppState.retryCount = 0;
        
        // Reset assessments
        Object.keys(AppState.assessments).forEach(key => {
            AppState.assessments[key] = {
                status: 'pending',
                aiScore: null,
                userScore: null,
                justification: '',
                submitted: false,
                data: null,
                rawResponse: null,
                timestamp: null
            };
        });
        
        this.notifyListeners();
    },
    
    // State change listeners
    listeners: [],
    
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },
    
    notifyListeners() {
        this.listeners.forEach(callback => callback(AppState));
    },
    
    // Persistence functions
    save() {
        try {
            const stateToSave = {
                techDescription: AppState.techDescription,
                assessments: AppState.assessments,
                competitiveAnalysisText: AppState.competitiveAnalysisText
            };
            localStorage.setItem('assessmentState', JSON.stringify(stateToSave));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    },
    
    load() {
        try {
            const saved = localStorage.getItem('assessmentState');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(AppState, parsed);
                this.notifyListeners();
                return true;
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
        return false;
    },
    
    // Utility functions for assessments
    calculateAverageScore(type) {
        const scores = Object.values(AppState.assessments)
            .filter(a => a[type] !== null)
            .map(a => a[type]);
        
        if (scores.length === 0) return null;
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    },
    
    getScoreDeviation(assessmentType) {
        const assessment = AppState.assessments[assessmentType];
        if (!assessment.aiScore || !assessment.userScore) return 0;
        return Math.abs(assessment.aiScore - assessment.userScore);
    }
};