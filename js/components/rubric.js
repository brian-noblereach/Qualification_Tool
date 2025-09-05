// js/components/rubric.js - Rubric Display Component

const RubricComponent = {
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
    
    // Initialize rubric for an assessment type
    init(assessmentType) {
        const rubricTable = document.getElementById(`${assessmentType}RubricTable`);
        const slider = document.getElementById(`${assessmentType}UserScoreSlider`);
        const scoreDisplay = document.getElementById(`${assessmentType}UserScoreDisplay`);
        const rubricDescription = document.getElementById(`${assessmentType}RubricDescription`);
        
        if (!rubricTable || !slider) return;
        
        // Build rubric table
        this.buildRubricTable(assessmentType, rubricTable);
        
        // Setup slider event listener
        slider.addEventListener('input', (e) => {
            this.handleSliderChange(assessmentType, parseInt(e.target.value));
        });
        
        // Set initial value
        this.updateRubricDisplay(assessmentType, parseInt(slider.value));
    },
    
    // Build the rubric table
    buildRubricTable(assessmentType, container) {
        const rubricData = this.rubrics[assessmentType];
        
        container.innerHTML = rubricData.map(item => `
            <div class="rubric-row" data-score="${item.score}">
                <span class="score">${item.score}</span>
                <div class="criteria">${item.description}</div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.rubric-row').forEach(row => {
            row.addEventListener('click', () => {
                const score = parseInt(row.dataset.score);
                this.setScore(assessmentType, score);
            });
        });
    },
    
    // Handle slider change
    handleSliderChange(assessmentType, score) {
        this.updateRubricDisplay(assessmentType, score);
        this.checkDeviation(assessmentType, score);
    },
    
    // Update rubric display based on score
    updateRubricDisplay(assessmentType, score) {
        const scoreDisplay = document.getElementById(`${assessmentType}UserScoreDisplay`);
        const rubricDescription = document.getElementById(`${assessmentType}RubricDescription`);
        const rubricTable = document.getElementById(`${assessmentType}RubricTable`);
        
        // Update score display
        if (scoreDisplay) {
            scoreDisplay.textContent = score;
            const scoreData = Formatters.scoreWithColor(score);
            scoreDisplay.style.color = scoreData.color;
        }
        
        // Update active rubric row
        if (rubricTable) {
            rubricTable.querySelectorAll('.rubric-row').forEach(row => {
                row.classList.toggle('active', parseInt(row.dataset.score) === score);
            });
        }
        
        // Update description
        if (rubricDescription) {
            const rubric = this.rubrics[assessmentType].find(r => r.score === score);
            if (rubric) {
                const category = this.getScoreCategory(assessmentType, score);
                rubricDescription.innerHTML = `
                    <h3 style="color: ${category.color}">Score ${score}: ${category.label}</h3>
                    <p>${rubric.description}</p>
                `;
            }
        }
    },
    
    // Get score category
    getScoreCategory(assessmentType, score) {
        if (score <= 3) {
            return { 
                label: assessmentType === 'market' ? "Weak Market" : "High Risk",
                color: "var(--danger)"
            };
        } else if (score <= 5) {
            return { 
                label: assessmentType === 'market' ? "Moderate Market" : "Moderate Risk",
                color: "var(--warning)"
            };
        } else if (score <= 7) {
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
    
    // Set score programmatically
    setScore(assessmentType, score) {
        const slider = document.getElementById(`${assessmentType}UserScoreSlider`);
        if (slider) {
            slider.value = score;
            slider.dispatchEvent(new Event('input'));
        }
    },
    
    // Check for deviation from AI score
    checkDeviation(assessmentType, userScore) {
        const assessment = StateManager.getAssessment(assessmentType);
        const warningEl = document.getElementById(`${assessmentType}DeviationWarning`);
        
        if (!assessment.aiScore || !warningEl) return;
        
        const deviation = Math.abs(userScore - assessment.aiScore);
        warningEl.style.display = deviation > 2 ? 'block' : 'none';
        
        if (deviation > 2) {
            warningEl.textContent = `⚠ Score differs by ${deviation} points from AI assessment (${assessment.aiScore})`;
        }
    },
    
    // Set AI score
    setAiScore(assessmentType, score) {
        const badgeValue = document.getElementById(`${assessmentType}AiScore`);
        if (badgeValue) {
            badgeValue.textContent = score;
        }
        
        // Also update the initial user score to match
        this.setScore(assessmentType, score);
    },
    
    // Enable/disable scoring
    setEnabled(assessmentType, enabled) {
        const slider = document.getElementById(`${assessmentType}UserScoreSlider`);
        const comment = document.getElementById(`${assessmentType}ScoreComment`);
        const submitBtn = document.getElementById(`${assessmentType}SubmitBtn`);
        
        if (slider) slider.disabled = !enabled;
        if (comment) comment.disabled = !enabled;
        if (submitBtn) {
            submitBtn.disabled = !enabled;
            if (!enabled && submitBtn.textContent === 'Submitted') {
                submitBtn.classList.add('submitted');
            }
        }
    },
    
    // Handle score submission
    async handleSubmit(assessmentType) {
        const slider = document.getElementById(`${assessmentType}UserScoreSlider`);
        const comment = document.getElementById(`${assessmentType}ScoreComment`);
        const submitBtn = document.getElementById(`${assessmentType}SubmitBtn`);
        
        if (!comment || !comment.value.trim()) {
            comment.focus();
            comment.style.borderColor = 'var(--danger)';
            setTimeout(() => {
                comment.style.borderColor = '';
            }, 2000);
            return false;
        }
        
        // Update state
        StateManager.setAssessmentData(assessmentType, {
            userScore: parseInt(slider.value),
            justification: comment.value.trim(),
            submitted: true
        });
        
        // Update UI
        submitBtn.textContent = 'Submitted';
        submitBtn.disabled = true;
        submitBtn.classList.add('submitted');
        this.setEnabled(assessmentType, false);
        
        // Update tab score
        const tabScore = document.getElementById(`${assessmentType}TabScore`);
        if (tabScore) {
            tabScore.textContent = slider.value;
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
        }
        
        // Save state
        StateManager.save();
        
        // Show success animation
        this.showSuccessAnimation();
        
        return true;
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
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(msg), 300);
        }, 2000);
    }
};