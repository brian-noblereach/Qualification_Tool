// js/components/rubric.js - Rubric Display Component with Enhanced Validation

const RubricComponent = {
    // Component state
    initialized: {
        competitive: false,
        market: false
    },
    
    // Rubric definitions for both assessments
    rubrics: {
        competitive: [
            { score: 1, description: "Dominant established players AND little tech OR business differentiation" },
            { score: 2, description: "Established players AND little tech OR business differentiation" },
            { score: 3, description: "Established players AND some tech OR business differentiation" },
            { score: 4, description: "Established players AND significant tech differentiation" },
            { score: 5, description: "Established players AND significant tech AND business differentiation" },
            { score: 6, description: "Existing players AND significant tech OR business differentiation" },
            { score: 7, description: "Existing players AND significant tech AND business differentiation" },
            { score: 8, description: "Few existing players AND significant tech AND business differentiation" },
            { score: 9, description: "No existing players in the market" }
        ],
        market: [
            { score: 1, description: "TAM is <$500M and CAGR is less than 10%" },
            { score: 2, description: "TAM is <$500M and CAGR is between 10 and 35%" },
            { score: 3, description: "TAM is <$500M and CAGR is greater than 35%" },
            { score: 4, description: "TAM is between $500M and $5B and CAGR is less than 10%" },
            { score: 5, description: "TAM is between $500M and $5B and CAGR is between 10 and 35%" },
            { score: 6, description: "TAM is between $500M and $5B and CAGR is greater than 35%" },
            { score: 7, description: "TAM is >$5B and CAGR is less than 10%" },
            { score: 8, description: "TAM is >$5B and CAGR is between 10 and 35%" },
            { score: 9, description: "TAM is >$5B and CAGR is greater than 35%" }
        ]
    },
    
    // Event handlers storage
    eventHandlers: {
        competitive: {},
        market: {}
    },
    
    // Initialize rubric for an assessment type with error handling
    init(assessmentType) {
        // Validate assessment type
        if (!['competitive', 'market'].includes(assessmentType)) {
            console.error(`Invalid assessment type for rubric: ${assessmentType}`);
            return false;
        }
        
        // Check if already initialized
        if (this.initialized[assessmentType]) {
            console.debug(`Rubric for ${assessmentType} already initialized`);
            return true;
        }
        
        try {
            // Get required DOM elements
            const elements = this.getElements(assessmentType);
            
            if (!elements.rubricTable || !elements.slider) {
                console.error(`Required elements not found for ${assessmentType} rubric`);
                return false;
            }
            
            // Build rubric table
            this.buildRubricTable(assessmentType, elements.rubricTable);
            
            // Setup event listeners with proper cleanup
            this.setupEventListeners(assessmentType, elements);
            
            // Set initial value
            const initialScore = parseInt(elements.slider.value) || 5;
            this.updateRubricDisplay(assessmentType, initialScore);
            
            // Setup submit button handler
            if (elements.submitBtn) {
                this.eventHandlers[assessmentType].submit = async () => {
                    await this.handleSubmit(assessmentType);
                };
                elements.submitBtn.addEventListener('click', this.eventHandlers[assessmentType].submit);
            }
            
            // Mark as initialized
            this.initialized[assessmentType] = true;
            
            console.log(`Rubric for ${assessmentType} initialized successfully`);
            return true;
            
        } catch (error) {
            console.error(`Failed to initialize rubric for ${assessmentType}:`, error);
            return false;
        }
    },
    
    // Get DOM elements with validation
    getElements(assessmentType) {
        return {
            rubricTable: document.getElementById(`${assessmentType}RubricTable`),
            slider: document.getElementById(`${assessmentType}UserScoreSlider`),
            scoreDisplay: document.getElementById(`${assessmentType}UserScoreDisplay`),
            rubricDescription: document.getElementById(`${assessmentType}RubricDescription`),
            comment: document.getElementById(`${assessmentType}ScoreComment`),
            submitBtn: document.getElementById(`${assessmentType}SubmitBtn`),
            deviationWarning: document.getElementById(`${assessmentType}DeviationWarning`),
            aiScoreBadge: document.getElementById(`${assessmentType}AiScore`),
            tabScore: document.getElementById(`${assessmentType}TabScore`)
        };
    },
    
    // Setup event listeners with cleanup
    setupEventListeners(assessmentType, elements) {
        // Clean up existing handlers
        this.cleanupEventListeners(assessmentType);
        
        // Slider change handler
        if (elements.slider) {
            this.eventHandlers[assessmentType].slider = (e) => {
                const score = parseInt(e.target.value);
                if (!isNaN(score) && score >= 1 && score <= 9) {
                    this.handleSliderChange(assessmentType, score);
                }
            };
            elements.slider.addEventListener('input', this.eventHandlers[assessmentType].slider);
        }
        
        // Comment field handler for auto-save
        if (elements.comment) {
            let autoSaveTimeout;
            this.eventHandlers[assessmentType].comment = (e) => {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    this.saveCommentDraft(assessmentType, e.target.value);
                }, 1000);
            };
            elements.comment.addEventListener('input', this.eventHandlers[assessmentType].comment);
        }
    },
    
    // Cleanup event listeners
    cleanupEventListeners(assessmentType) {
        const handlers = this.eventHandlers[assessmentType];
        
        if (handlers.slider) {
            const slider = document.getElementById(`${assessmentType}UserScoreSlider`);
            if (slider) {
                slider.removeEventListener('input', handlers.slider);
            }
            delete handlers.slider;
        }
        
        if (handlers.comment) {
            const comment = document.getElementById(`${assessmentType}ScoreComment`);
            if (comment) {
                comment.removeEventListener('input', handlers.comment);
            }
            delete handlers.comment;
        }
        
        if (handlers.submit) {
            const submitBtn = document.getElementById(`${assessmentType}SubmitBtn`);
            if (submitBtn) {
                submitBtn.removeEventListener('click', handlers.submit);
            }
            delete handlers.submit;
        }
    },
    
    // Build the rubric table with error handling
    buildRubricTable(assessmentType, container) {
        if (!container) {
            console.error('Container not provided for rubric table');
            return;
        }
        
        const rubricData = this.rubrics[assessmentType];
        
        if (!rubricData || !Array.isArray(rubricData)) {
            console.error(`Invalid rubric data for ${assessmentType}`);
            return;
        }
        
        container.innerHTML = rubricData.map(item => `
            <div class="rubric-row" data-score="${item.score}">
                <span class="score">${item.score}</span>
                <div class="criteria">${Formatters.escapeHTML(item.description)}</div>
            </div>
        `).join('');
        
        // Add click handlers with delegation
        container.addEventListener('click', (e) => {
            const row = e.target.closest('.rubric-row');
            if (row) {
                const score = parseInt(row.dataset.score);
                if (!isNaN(score)) {
                    this.setScore(assessmentType, score);
                }
            }
        });
    },
    
    // Handle slider change with validation
    handleSliderChange(assessmentType, score) {
        // Validate score
        if (!Number.isInteger(score) || score < 1 || score > 9) {
            console.error(`Invalid score for ${assessmentType}: ${score}`);
            return;
        }
        
        this.updateRubricDisplay(assessmentType, score);
        this.checkDeviation(assessmentType, score);
        
        // Update state
        StateManager.setAssessmentData(assessmentType, {
            userScore: score
        });
    },
    
    // Update rubric display based on score
    updateRubricDisplay(assessmentType, score) {
        const elements = this.getElements(assessmentType);
        
        // Update score display
        if (elements.scoreDisplay) {
            elements.scoreDisplay.textContent = score;
            const scoreData = Formatters.scoreWithColor(score);
            elements.scoreDisplay.style.color = scoreData.color;
        }
        
        // Update active rubric row
        if (elements.rubricTable) {
            elements.rubricTable.querySelectorAll('.rubric-row').forEach(row => {
                const rowScore = parseInt(row.dataset.score);
                row.classList.toggle('active', rowScore === score);
            });
        }
        
        // Update description
        if (elements.rubricDescription) {
            const rubric = this.rubrics[assessmentType].find(r => r.score === score);
            if (rubric) {
                const category = this.getScoreCategory(assessmentType, score);
                elements.rubricDescription.innerHTML = `
                    <h3 style="color: ${category.color}">Score ${score}: ${Formatters.escapeHTML(category.label)}</h3>
                    <p>${Formatters.escapeHTML(rubric.description)}</p>
                `;
            }
        }
    },
    
    // Get score category with proper types
    getScoreCategory(assessmentType, score) {
        const num = parseInt(score);
        
        if (isNaN(num) || num < 1 || num > 9) {
            return { 
                label: "Invalid Score",
                color: "var(--gray-500)"
            };
        }
        
        if (num <= 3) {
            return { 
                label: assessmentType === 'market' ? "Weak Market" : "High Risk",
                color: "var(--danger)"
            };
        } else if (num <= 5) {
            return { 
                label: assessmentType === 'market' ? "Moderate Market" : "Moderate Risk",
                color: "var(--warning)"
            };
        } else if (num <= 7) {
            return { 
                label: assessmentType === 'market' ? "Good Market" : "Low Risk",
                color: "var(--primary)"
            };
        } else {
            return { 
                label: assessmentType === 'market' ? "Exceptional Market" : "Minimal Risk",
                color: "var(--success)"
            };
        }
    },
    
    // Set score programmatically with validation
    setScore(assessmentType, score) {
        const scoreNum = parseInt(score);
        
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 9) {
            console.error(`Invalid score: ${score}`);
            return false;
        }
        
        const slider = document.getElementById(`${assessmentType}UserScoreSlider`);
        if (slider) {
            slider.value = scoreNum;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        
        return false;
    },
    
    // Check for deviation from AI score
    checkDeviation(assessmentType, userScore) {
        const elements = this.getElements(assessmentType);
        const assessment = StateManager.getAssessment(assessmentType);
        
        if (!elements.deviationWarning || !assessment || assessment.aiScore === null) {
            return;
        }
        
        const deviation = Math.abs(userScore - assessment.aiScore);
        
        if (deviation > 2) {
            elements.deviationWarning.style.display = 'block';
            elements.deviationWarning.innerHTML = `
                ⚠ Score differs by ${deviation} points from AI assessment (${assessment.aiScore})
                <br><small>Consider reviewing the AI reasoning before submitting.</small>
            `;
        } else {
            elements.deviationWarning.style.display = 'none';
        }
    },
    
    // Set AI score with validation
    setAiScore(assessmentType, score) {
        const scoreNum = parseInt(score);
        
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 9) {
            console.error(`Invalid AI score: ${score}`);
            return false;
        }
        
        const elements = this.getElements(assessmentType);
        
        if (elements.aiScoreBadge) {
            elements.aiScoreBadge.textContent = scoreNum;
        }
        
        // Also update the initial user score to match
        this.setScore(assessmentType, scoreNum);
        
        return true;
    },
    
    // Enable/disable scoring controls
    setEnabled(assessmentType, enabled) {
        const elements = this.getElements(assessmentType);
        
        if (elements.slider) {
            elements.slider.disabled = !enabled;
        }
        
        if (elements.comment) {
            elements.comment.disabled = !enabled;
        }
        
        if (elements.submitBtn) {
            elements.submitBtn.disabled = !enabled;
            
            if (!enabled && elements.submitBtn.textContent === 'Submitted') {
                elements.submitBtn.classList.add('submitted');
            } else {
                elements.submitBtn.classList.remove('submitted');
            }
        }
    },
    
    // Save comment draft
    saveCommentDraft(assessmentType, comment) {
        try {
            const key = `${assessmentType}_comment_draft`;
            if (comment && comment.trim()) {
                localStorage.setItem(key, comment);
            } else {
                localStorage.removeItem(key);
            }
        } catch (e) {
            console.debug('Could not save comment draft:', e);
        }
    },
    
    // Load comment draft
    loadCommentDraft(assessmentType) {
        try {
            const key = `${assessmentType}_comment_draft`;
            return localStorage.getItem(key) || '';
        } catch (e) {
            console.debug('Could not load comment draft:', e);
            return '';
        }
    },
    
    // Handle score submission with validation
    async handleSubmit(assessmentType) {
        const elements = this.getElements(assessmentType);
        
        // Validate comment
        if (!elements.comment || !elements.comment.value.trim()) {
            elements.comment.focus();
            elements.comment.style.borderColor = 'var(--danger)';
            
            // Show validation message
            this.showValidationMessage(elements.comment, 'Please provide a justification for your score');
            
            setTimeout(() => {
                elements.comment.style.borderColor = '';
            }, 3000);
            
            return false;
        }
        
        // Validate score
        const score = parseInt(elements.slider.value);
        if (isNaN(score) || score < 1 || score > 9) {
            console.error('Invalid score for submission');
            return false;
        }
        
        try {
            // Update state
            const success = StateManager.setAssessmentData(assessmentType, {
                userScore: score,
                justification: elements.comment.value.trim(),
                submitted: true,
                status: 'complete'
            });
            
            if (!success) {
                throw new Error('Failed to save assessment data');
            }
            
            // Update UI
            if (elements.submitBtn) {
                elements.submitBtn.textContent = '✓ Submitted';
                elements.submitBtn.disabled = true;
                elements.submitBtn.classList.add('submitted');
            }
            
            this.setEnabled(assessmentType, false);
            
            // Update tab score
            if (elements.tabScore) {
                elements.tabScore.textContent = score;
            }
            
            // Mark tab as completed
            const tab = document.querySelector(`.assessment-tab[data-assessment="${assessmentType}"]`);
            if (tab) {
                tab.classList.add('completed');
            }
            
            // Update progress indicator
            const progressItem = document.querySelector(`.progress-item[data-assessment="${assessmentType}"]`);
            if (progressItem) {
                progressItem.classList.add('complete');
                progressItem.classList.remove('in-progress');
            }
            
            // Clear comment draft
            this.saveCommentDraft(assessmentType, '');
            
            // Save state
            StateManager.save();
            
            // Show success animation
            this.showSuccessAnimation();
            
            // Check if all assessments are complete
            if (StateManager.areAllAssessmentsComplete()) {
                this.handleAllAssessmentsComplete();
            }
            
            return true;
            
        } catch (error) {
            console.error('Failed to submit assessment:', error);
            this.showErrorMessage('Failed to submit assessment. Please try again.');
            return false;
        }
    },
    
    // Show validation message
    showValidationMessage(element, message) {
        // Remove existing message
        const existing = element.parentElement.querySelector('.validation-message');
        if (existing) {
            existing.remove();
        }
        
        const msgEl = document.createElement('div');
        msgEl.className = 'validation-message';
        msgEl.textContent = message;
        msgEl.style.cssText = `
            color: var(--danger);
            font-size: 0.813rem;
            margin-top: 0.25rem;
            animation: fadeIn 0.3s ease;
        `;
        
        element.parentElement.appendChild(msgEl);
        
        setTimeout(() => {
            msgEl.remove();
        }, 3000);
    },
    
    // Show error message
    showErrorMessage(message) {
        const msg = document.createElement('div');
        msg.className = 'error-message';
        msg.innerHTML = `<span>⚠</span> ${Formatters.escapeHTML(message)}`;
        msg.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: var(--danger);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: var(--shadow-xl);
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => msg.remove(), 300);
        }, 5000);
    },
    
    // Show success animation
    showSuccessAnimation() {
        const msg = document.createElement('div');
        msg.className = 'success-message';
        msg.innerHTML = '<span>✓</span> Assessment Submitted';
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--success);
            color: white;
            padding: 1.5rem 2rem;
            border-radius: 0.5rem;
            font-weight: 500;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: var(--shadow-xl);
            animation: scaleIn 0.3s ease;
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.style.animation = 'scaleOut 0.3s ease';
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    },
    
    // Handle all assessments complete
    handleAllAssessmentsComplete() {
        // Show completion notification
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 2rem;">🎉</span>
                <div>
                    <strong>All Assessments Complete!</strong>
                    <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem;">
                        You can now export the full report or view the summary.
                    </p>
                </div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: var(--primary-gradient);
            color: white;
            padding: 1.5rem;
            border-radius: 0.75rem;
            box-shadow: var(--shadow-xl);
            z-index: 10000;
            animation: slideInRight 0.5s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    },
    
    // Cleanup component
    cleanup() {
        // Clean up all event listeners
        ['competitive', 'market'].forEach(type => {
            this.cleanupEventListeners(type);
            this.initialized[type] = false;
        });
    }
};