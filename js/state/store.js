// js/state/store.js - Centralized State Management with Enhanced Error Handling

const AppState = {
    // Current view state
    currentAssessment: null, // 'competitive' | 'market' | 'summary'
    isAnalyzing: false,
    analysisPhase: null, // 'competitive' | 'market'
    
    // Technology input
    techDescription: '',
    
    // Assessment data with standardized structure
    assessments: {
        competitive: {
            status: 'pending', // 'pending' | 'in-progress' | 'complete' | 'error'
            aiScore: null,
            userScore: null,
            justification: '',
            submitted: false,
            data: null,        // Always stores formatted data
            rawData: null,     // Stores raw API response
            timestamp: null,
            error: null,       // Store error if analysis fails
            confidence: null   // Store confidence separately
        },
        market: {
            status: 'pending',
            aiScore: null,
            userScore: null,
            justification: '',
            submitted: false,
            data: null,        // Always stores formatted data
            rawData: null,     // Stores raw API response
            timestamp: null,
            error: null,
            confidence: null
        }
    },
    
    // Competitive analysis output (used as input for market analysis)
    competitiveAnalysisText: null,
    
    // Error tracking
    lastError: null,
    retryCount: 0,
    maxRetries: 3,
    
    // UI State
    initialized: false,
    unsavedChanges: false
};

// State management functions with validation
const StateManager = {
    // State change listeners
    listeners: [],
    validationRules: {},
    
    // Initialize state manager
    init() {
        // Set up validation rules
        this.validationRules = {
            aiScore: (value) => value === null || (Number.isInteger(value) && value >= 1 && value <= 9),
            userScore: (value) => value === null || (Number.isInteger(value) && value >= 1 && value <= 9),
            status: (value) => ['pending', 'in-progress', 'complete', 'error'].includes(value),
            confidence: (value) => value === null || (typeof value === 'number' && value >= 0 && value <= 1)
        };
        
        // Try to load existing state, with error recovery
        try {
            this.load();
        } catch (error) {
            console.error('Failed to load saved state, clearing corrupted data:', error);
            this.clearStorage();
        }
        
        // Set up auto-save
        this.setupAutoSave();
        
        // Mark as initialized
        AppState.initialized = true;
    },
    
    // Get current state (returns deep copy to prevent direct mutations)
    getState() {
        return this.deepCopy(AppState);
    },
    
    // Update state with validation and error handling
    setState(updates) {
        try {
            // Validate updates
            this.validateUpdates(updates);
            
            // Apply updates
            Object.assign(AppState, updates);
            
            // Mark as having unsaved changes
            AppState.unsavedChanges = true;
            
            // Notify listeners
            this.notifyListeners();
            
            return true;
        } catch (error) {
            console.error('State update failed:', error);
            return false;
        }
    },
    
    // Update assessment data with validation
    setAssessmentData(type, data) {
        if (!['competitive', 'market'].includes(type)) {
            console.error(`Invalid assessment type: ${type}`);
            return false;
        }
        
        try {
            // Validate assessment data
            if (data.aiScore !== undefined) {
                if (!this.validationRules.aiScore(data.aiScore)) {
                    throw new Error(`Invalid AI score: ${data.aiScore}`);
                }
            }
            
            if (data.userScore !== undefined) {
                if (!this.validationRules.userScore(data.userScore)) {
                    throw new Error(`Invalid user score: ${data.userScore}`);
                }
            }
            
            if (data.status !== undefined) {
                if (!this.validationRules.status(data.status)) {
                    throw new Error(`Invalid status: ${data.status}`);
                }
            }
            
            if (data.confidence !== undefined) {
                if (!this.validationRules.confidence(data.confidence)) {
                    throw new Error(`Invalid confidence: ${data.confidence}`);
                }
            }
            
            // Standardize data structure if raw data is provided
            if (data.data && !data.isFormatted) {
                console.warn('Received unformatted data, will be stored as-is');
            }
            
            // Update assessment
            AppState.assessments[type] = {
                ...AppState.assessments[type],
                ...data,
                timestamp: new Date().toISOString()
            };
            
            // Mark as having unsaved changes
            AppState.unsavedChanges = true;
            
            // Notify listeners
            this.notifyListeners();
            
            return true;
        } catch (error) {
            console.error(`Failed to set assessment data for ${type}:`, error);
            
            // Store error in assessment
            AppState.assessments[type].error = error.message;
            AppState.assessments[type].status = 'error';
            
            this.notifyListeners();
            return false;
        }
    },
    
    // Get assessment data with safety checks
    getAssessment(type) {
        if (!['competitive', 'market'].includes(type)) {
            console.error(`Invalid assessment type: ${type}`);
            return null;
        }
        
        return this.deepCopy(AppState.assessments[type]);
    },
    
    // Check if all assessments are complete
    areAllAssessmentsComplete() {
        return Object.values(AppState.assessments).every(a => 
            a.submitted && a.status === 'complete'
        );
    },
    
    // Count completed assessments
    getCompletedCount() {
        return Object.values(AppState.assessments).filter(a => 
            a.submitted && a.status === 'complete'
        ).length;
    },
    
    // Get assessment statistics
    getAssessmentStats() {
        const stats = {
            totalAssessments: Object.keys(AppState.assessments).length,
            completed: 0,
            pending: 0,
            inProgress: 0,
            error: 0,
            averageAiScore: null,
            averageUserScore: null,
            averageDeviation: null
        };
        
        const aiScores = [];
        const userScores = [];
        const deviations = [];
        
        Object.values(AppState.assessments).forEach(assessment => {
            stats[assessment.status] = (stats[assessment.status] || 0) + 1;
            
            if (assessment.aiScore !== null) {
                aiScores.push(assessment.aiScore);
            }
            
            if (assessment.userScore !== null) {
                userScores.push(assessment.userScore);
            }
            
            if (assessment.aiScore !== null && assessment.userScore !== null) {
                deviations.push(Math.abs(assessment.aiScore - assessment.userScore));
            }
        });
        
        if (aiScores.length > 0) {
            stats.averageAiScore = aiScores.reduce((a, b) => a + b, 0) / aiScores.length;
        }
        
        if (userScores.length > 0) {
            stats.averageUserScore = userScores.reduce((a, b) => a + b, 0) / userScores.length;
        }
        
        if (deviations.length > 0) {
            stats.averageDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
        }
        
        return stats;
    },
    
    // Reset state for new analysis
    reset(preserveTechDescription = false) {
        const techDesc = AppState.techDescription;
        
        // Reset to initial state
        AppState.currentAssessment = null;
        AppState.isAnalyzing = false;
        AppState.analysisPhase = null;
        AppState.competitiveAnalysisText = null;
        AppState.lastError = null;
        AppState.retryCount = 0;
        AppState.unsavedChanges = false;
        
        if (!preserveTechDescription) {
            AppState.techDescription = '';
        } else {
            AppState.techDescription = techDesc;
        }
        
        // Reset assessments
        Object.keys(AppState.assessments).forEach(key => {
            AppState.assessments[key] = {
                status: 'pending',
                aiScore: null,
                userScore: null,
                justification: '',
                submitted: false,
                data: null,
                rawData: null,
                timestamp: null,
                error: null,
                confidence: null
            };
        });
        
        // Clear local storage
        this.clearStorage();
        
        // Notify listeners
        this.notifyListeners();
    },
    
    // Subscribe to state changes
    subscribe(callback) {
        if (typeof callback !== 'function') {
            console.error('Subscriber must be a function');
            return null;
        }
        
        this.listeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },
    
    // Notify all listeners of state change
    notifyListeners() {
        const state = this.getState();
        this.listeners.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    },
    
    // Persistence functions with error handling
    save() {
        try {
            const stateToSave = {
                version: '1.0', // Add versioning for future migrations
                techDescription: AppState.techDescription,
                assessments: AppState.assessments,
                competitiveAnalysisText: AppState.competitiveAnalysisText,
                currentAssessment: AppState.currentAssessment,
                timestamp: new Date().toISOString()
            };
            
            const serialized = JSON.stringify(stateToSave);
            
            // Check storage quota
            if (serialized.length > 5 * 1024 * 1024) { // 5MB limit
                console.warn('State too large to save, truncating raw data');
                
                // Remove raw data to reduce size
                stateToSave.assessments.competitive.rawData = null;
                stateToSave.assessments.market.rawData = null;
            }
            
            localStorage.setItem('assessmentState', JSON.stringify(stateToSave));
            AppState.unsavedChanges = false;
            
            return true;
        } catch (e) {
            console.error('Failed to save state:', e);
            
            if (e.name === 'QuotaExceededError') {
                // Try to clear old data and retry
                this.clearOldData();
                try {
                    localStorage.setItem('assessmentState', JSON.stringify(stateToSave));
                    return true;
                } catch (retryError) {
                    console.error('Failed to save even after clearing old data:', retryError);
                }
            }
            
            return false;
        }
    },
    
    // Load saved state with validation
    load() {
        try {
            const saved = localStorage.getItem('assessmentState');
            if (!saved) return false;
            
            const parsed = JSON.parse(saved);
            
            // Check version for compatibility
            if (parsed.version !== '1.0') {
                console.warn(`State version mismatch: expected 1.0, got ${parsed.version}`);
                // Could implement migration logic here
            }
            
            // Validate loaded data
            if (!this.validateLoadedState(parsed)) {
                console.error('Loaded state validation failed');
                return false;
            }
            
            // Apply loaded state
            Object.assign(AppState, {
                techDescription: parsed.techDescription || '',
                assessments: parsed.assessments || AppState.assessments,
                competitiveAnalysisText: parsed.competitiveAnalysisText || null,
                currentAssessment: parsed.currentAssessment || null
            });
            
            AppState.unsavedChanges = false;
            
            // Notify listeners
            this.notifyListeners();
            
            return true;
        } catch (e) {
            console.error('Failed to load state:', e);
            
            // Clear corrupted data
            this.clearStorage();
            return false;
        }
    },
    
    // Auto-save functionality
    setupAutoSave() {
        let autoSaveTimeout;
        
        // Save after 5 seconds of inactivity
        this.subscribe(() => {
            if (AppState.unsavedChanges) {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    if (AppState.unsavedChanges) {
                        this.save();
                    }
                }, 5000);
            }
        });
        
        // Save before page unload
        window.addEventListener('beforeunload', (e) => {
            if (AppState.unsavedChanges) {
                this.save();
                
                // Show warning if analysis is in progress
                if (AppState.isAnalyzing) {
                    e.preventDefault();
                    e.returnValue = 'Analysis in progress. Are you sure you want to leave?';
                }
            }
        });
    },
    
    // Validation helpers
    validateUpdates(updates) {
        // Add validation logic as needed
        if (updates.retryCount !== undefined && updates.retryCount < 0) {
            throw new Error('Retry count cannot be negative');
        }
        
        if (updates.maxRetries !== undefined && updates.maxRetries < 1) {
            throw new Error('Max retries must be at least 1');
        }
    },
    
    validateLoadedState(state) {
        // Basic structure validation
        if (!state || typeof state !== 'object') return false;
        
        // Validate assessments if present
        if (state.assessments) {
            for (const [type, assessment] of Object.entries(state.assessments)) {
                if (assessment.aiScore !== null && assessment.aiScore !== undefined) {
                    if (!this.validationRules.aiScore(assessment.aiScore)) {
                        console.warn(`Invalid AI score for ${type}: ${assessment.aiScore}`);
                        assessment.aiScore = null;
                    }
                }
                
                if (assessment.userScore !== null && assessment.userScore !== undefined) {
                    if (!this.validationRules.userScore(assessment.userScore)) {
                        console.warn(`Invalid user score for ${type}: ${assessment.userScore}`);
                        assessment.userScore = null;
                    }
                }
            }
        }
        
        return true;
    },
    
    // Utility functions
    calculateAverageScore(type) {
        const scores = Object.values(AppState.assessments)
            .filter(a => a[type] !== null && a[type] !== undefined)
            .map(a => a[type]);
        
        if (scores.length === 0) return null;
        
        const sum = scores.reduce((total, score) => total + score, 0);
        return Math.round((sum / scores.length) * 10) / 10; // Round to 1 decimal
    },
    
    getScoreDeviation(assessmentType) {
        const assessment = AppState.assessments[assessmentType];
        
        if (assessment.aiScore === null || assessment.userScore === null) {
            return null;
        }
        
        return Math.abs(assessment.aiScore - assessment.userScore);
    },
    
    // Helper to create deep copy
    deepCopy(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepCopy(item));
        if (obj instanceof Object) {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepCopy(obj[key]);
                }
            }
            return clonedObj;
        }
    },
    
    // Clear storage
    clearStorage() {
        try {
            localStorage.removeItem('assessmentState');
        } catch (e) {
            console.error('Failed to clear storage:', e);
        }
    },
    
    // Clear old data to free up space
    clearOldData() {
        try {
            // Clear items older than 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('assessmentState_backup_')) {
                    const timestamp = parseInt(key.split('_').pop());
                    if (timestamp < thirtyDaysAgo) {
                        localStorage.removeItem(key);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to clear old data:', e);
        }
    }
};

// Initialize state manager when module loads
if (typeof window !== 'undefined') {
    StateManager.init();
}