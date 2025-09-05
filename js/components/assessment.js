// js/components/assessment.js - Assessment Management Component

const AssessmentComponent = {
    // Initialize assessment sections
    init() {
        this.setupEventListeners();
        this.initializeTabs();
        
        // Initialize rubrics for both assessments
        RubricComponent.init('competitive');
        RubricComponent.init('market');
        
        // Check if there's saved state
        if (StateManager.load()) {
            this.restoreFromState();
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Submit buttons
        const competitiveSubmit = document.getElementById('competitiveSubmitBtn');
        const marketSubmit = document.getElementById('marketSubmitBtn');
        
        if (competitiveSubmit) {
            competitiveSubmit.addEventListener('click', () => {
                this.submitAssessment('competitive');
            });
        }
        
        if (marketSubmit) {
            marketSubmit.addEventListener('click', () => {
                this.submitAssessment('market');
            });
        }
        
        // View tabs within each assessment
        document.querySelectorAll('.view-tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                const assessment = e.target.dataset.assessment;
                this.switchView(assessment, view);
            });
        });
    },
    
    // Initialize assessment tabs
    initializeTabs() {
        const tabs = document.querySelectorAll('.assessment-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const assessment = tab.dataset.assessment;
                this.switchAssessment(assessment);
            });
        });
    },
    
    // Switch between assessments
    switchAssessment(assessmentType) {
        // Update state
        StateManager.setState({ currentAssessment: assessmentType });
        
        // Update tabs
        document.querySelectorAll('.assessment-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.assessment === assessmentType);
        });
        
        // Show/hide sections
        document.getElementById('competitiveAssessment').style.display = 
            assessmentType === 'competitive' ? 'block' : 'none';
        document.getElementById('marketAssessment').style.display = 
            assessmentType === 'market' ? 'block' : 'none';
        document.getElementById('summarySection').style.display = 
            assessmentType === 'summary' ? 'block' : 'none';
        
        // Update summary if viewing it
        if (assessmentType === 'summary') {
            this.updateSummary();
        }
    },
    
    // Switch view within an assessment
    switchView(assessmentType, viewType) {
        // Update tabs
        document.querySelectorAll(`.view-tabs .tab[data-assessment="${assessmentType}"]`).forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewType);
        });
        
        // Show/hide views
        const viewIds = {
            competitive: {
                summary: 'competitiveSummaryView',
                detailed: 'competitiveDetailedView',
                sources: 'competitiveSourcesView'
            },
            market: {
                summary: 'marketSummaryView',
                detailed: 'marketDetailedView',
                sources: 'marketSourcesView'
            }
        };
        
        if (viewIds[assessmentType]) {
            Object.entries(viewIds[assessmentType]).forEach(([view, id]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.style.display = view === viewType ? 'block' : 'none';
                }
            });
        }
    },
    
    // Submit an assessment
    async submitAssessment(assessmentType) {
        const success = await RubricComponent.handleSubmit(assessmentType);
        
        if (success) {
            // Check if both assessments are complete
            if (StateManager.areAllAssessmentsComplete()) {
                this.showCompletionMessage();
            } else {
                // Suggest moving to next assessment
                if (assessmentType === 'competitive') {
                    setTimeout(() => {
                        if (confirm('Would you like to proceed to Market Opportunity assessment?')) {
                            this.switchAssessment('market');
                        }
                    }, 500);
                }
            }
            
            // Update summary
            this.updateSummary();
        }
    },
    
    // Load competitive analysis results
    loadCompetitiveResults(data) {
        const assessment = StateManager.getAssessment('competitive');
        const formattedData = CompetitiveAPI.formatForDisplay(
            data.gradedAnalysis, 
            data.competitiveAnalysisText
        );
        
        // Update state
        StateManager.setAssessmentData('competitive', {
            status: 'complete',
            aiScore: formattedData.score,
            data: formattedData,
            rawResponse: data.rawResponse
        });
        
        // Set AI score
        RubricComponent.setAiScore('competitive', formattedData.score);
        
        // Update metrics
        document.getElementById('competitorCount').textContent = formattedData.competitorCount.total;
        document.getElementById('marketLeaderCount').textContent = formattedData.marketLeaders.length;
        document.getElementById('competitiveIntensity').textContent = 
            Formatters.competitiveIntensity(formattedData.competitiveIntensity);
        
        // Update AI reasoning
        document.getElementById('competitiveAiReasoning').textContent = formattedData.justification;
        
        // Update lists
        document.getElementById('competitiveRisksList').innerHTML = 
            Formatters.listToHTML(formattedData.keyRisks, 3);
        document.getElementById('competitiveOpportunitiesList').innerHTML = 
            Formatters.listToHTML(formattedData.opportunities, 3);
        
        // Detailed view with competitor details
        this.loadCompetitiveDetailedView(formattedData);
        
        // Sources instead of data quality
        this.loadCompetitiveSources(formattedData);
    },
    
    // Load competitive detailed view
    loadCompetitiveDetailedView(data) {
        // Competitor breakdown
        const breakdown = document.getElementById('competitorBreakdown');
        if (breakdown) {
            breakdown.innerHTML = `
                <div class="competitor-type">
                    <div class="type-label">Large</div>
                    <div class="type-count">${data.competitorCount.large}</div>
                </div>
                <div class="competitor-type">
                    <div class="type-label">Mid-size</div>
                    <div class="type-count">${data.competitorCount.midSize}</div>
                </div>
                <div class="competitor-type">
                    <div class="type-label">Startups</div>
                    <div class="type-count">${data.competitorCount.startups}</div>
                </div>
                <div class="competitor-type">
                    <div class="type-label">Total</div>
                    <div class="type-count">${data.competitorCount.total}</div>
                </div>
            `;
        }
        
        // Detailed competitor analysis
        const marketLeadersList = document.getElementById('marketLeadersList');
        if (marketLeadersList && data.detailedCompetitors && data.detailedCompetitors.length > 0) {
            // Create detailed competitor cards instead of simple list
            marketLeadersList.innerHTML = data.detailedCompetitors.map((comp, index) => `
                <div class="competitor-detail-card">
                    <div class="competitor-header">
                        <h4>${index + 1}. ${comp.name}</h4>
                        <span class="size-badge size-${comp.size.toLowerCase()}">${comp.size}</span>
                    </div>
                    <p class="competitor-description">${comp.description || 'Leading competitor in the market'}</p>
                    ${comp.products && comp.products.length > 0 ? `
                        <div class="competitor-section">
                            <strong>Products/Services:</strong>
                            <ul>${comp.products.map(p => `<li>${p}</li>`).join('')}</ul>
                        </div>
                    ` : ''}
                    ${comp.strengths && comp.strengths.length > 0 ? `
                        <div class="competitor-section">
                            <strong>Key Strengths:</strong>
                            <ul>${comp.strengths.slice(0, 3).map(s => `<li>${s}</li>`).join('')}</ul>
                        </div>
                    ` : ''}
                    ${comp.weaknesses && comp.weaknesses.length > 0 ? `
                        <div class="competitor-section">
                            <strong>Potential Weaknesses:</strong>
                            <ul>${comp.weaknesses.slice(0, 2).map(w => `<li>${w}</li>`).join('')}</ul>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } else if (marketLeadersList) {
            // Fallback to simple list if no detailed data
            marketLeadersList.innerHTML = Formatters.listToHTML(data.marketLeaders);
        }
        
        // All risks and opportunities
        document.getElementById('allCompetitiveRisksList').innerHTML = 
            Formatters.listToHTML(data.keyRisks);
        document.getElementById('allCompetitiveOpportunitiesList').innerHTML = 
            Formatters.listToHTML(data.opportunities);
    },
    
    // Load competitive sources (replacing data quality)
    loadCompetitiveSources(data) {
        const sourcesView = document.getElementById('competitiveSourcesView');
        if (!sourcesView) return;
        
        // Create a sources table similar to market sources
        let sourcesHTML = `
            <table class="sources-table">
                <thead>
                    <tr>
                        <th>Competitor</th>
                        <th>Size</th>
                        <th>Focus Area</th>
                        <th>More Info</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add competitor rows
        if (data.detailedCompetitors && data.detailedCompetitors.length > 0) {
            data.detailedCompetitors.forEach(comp => {
                sourcesHTML += `
                    <tr>
                        <td>${comp.name}</td>
                        <td>${comp.size}</td>
                        <td>${Formatters.truncate(comp.description || 'Competitive solution', 100)}</td>
                        <td><a href="${comp.url || `https://www.google.com/search?q=${encodeURIComponent(comp.name)}`}" target="_blank">Search</a></td>
                    </tr>
                `;
            });
        } else {
            // Fallback with market leaders
            data.marketLeaders.forEach(leader => {
                sourcesHTML += `
                    <tr>
                        <td>${leader}</td>
                        <td>Large</td>
                        <td>Market leader in the space</td>
                        <td><a href="https://www.google.com/search?q=${encodeURIComponent(leader)}" target="_blank">Search</a></td>
                    </tr>
                `;
            });
        }
        
        sourcesHTML += `
                </tbody>
            </table>
            <div class="sources-note">
                <p><strong>Analysis Confidence:</strong> ${Formatters.confidence(data.confidence)}</p>
                <p class="data-quality-note">
                    Data compiled from competitive landscape analysis. Links provide starting points for further research.
                </p>
            </div>
        `;
        
        sourcesView.innerHTML = sourcesHTML;
    },
    
    // Load market analysis results
    loadMarketResults(data) {
        const assessment = StateManager.getAssessment('market');
        const formattedData = MarketAPI.formatForDisplay(data.marketData, data.scoringData);
        
        // Update state
        StateManager.setAssessmentData('market', {
            status: 'complete',
            aiScore: formattedData.score,
            data: formattedData,
            rawResponse: data.rawResponse
        });
        
        // Set AI score
        RubricComponent.setAiScore('market', formattedData.score);
        
        // Update metrics including confidence
        document.getElementById('tamValue').textContent = 
            Formatters.currency(formattedData.primaryMarket.tam);
        document.getElementById('cagrValue').textContent = 
            Formatters.percentage(formattedData.primaryMarket.cagr);
        document.getElementById('marketDesc').textContent = 
            formattedData.primaryMarket.description;
            
        // Add confidence display
        const marketConfidenceEl = document.getElementById('marketConfidence');
        if (marketConfidenceEl) {
            marketConfidenceEl.textContent = Formatters.confidence(formattedData.confidence);
        }
        
        // Update AI reasoning
        document.getElementById('marketAiReasoning').textContent = 
            formattedData.justification.summary;
        
        // Update lists
        document.getElementById('marketStrengthsList').innerHTML = 
            Formatters.listToHTML(formattedData.justification.strengths, 3);
        document.getElementById('marketLimitationsList').innerHTML = 
            Formatters.listToHTML(formattedData.justification.limitations, 3);
        
        // Detailed view
        this.loadMarketDetailedView(formattedData);
        
        // Sources
        this.loadMarketSources(formattedData);
    },
    
    // Load market detailed view
    loadMarketDetailedView(data) {
        // Market analysis
        const marketAnalysis = document.getElementById('marketAnalysis');
        if (marketAnalysis) {
            let html = '';
            
            if (data.marketAnalysis.executiveSummary) {
                html += `
                    <div class="summary-section">
                        <h4>Executive Summary</h4>
                        <p>${data.marketAnalysis.executiveSummary}</p>
                    </div>
                `;
            }
            
            if (data.marketAnalysis.problemStatement) {
                html += `
                    <div class="statement-section">
                        <h4>Problem Statement</h4>
                        <p>${data.marketAnalysis.problemStatement}</p>
                    </div>
                `;
            }
            
            if (data.marketAnalysis.differentiation) {
                html += `
                    <div class="statement-section">
                        <h4>Differentiation</h4>
                        <p>${data.marketAnalysis.differentiation}</p>
                    </div>
                `;
            }
            
            marketAnalysis.innerHTML = html;
        }
        
        // All lists
        document.getElementById('allMarketStrengthsList').innerHTML = 
            Formatters.listToHTML([
                ...data.justification.strengths,
                ...data.scoringAlignment.strengths
            ]);
        document.getElementById('allMarketLimitationsList').innerHTML = 
            Formatters.listToHTML([
                ...data.justification.limitations,
                ...data.scoringAlignment.limitations
            ]);
        document.getElementById('marketRisksList').innerHTML = 
            Formatters.listToHTML(data.justification.risks);
    },
    
    // Load market sources
    loadMarketSources(data) {
        const tbody = document.getElementById('marketSourcesTableBody');
        if (tbody && data.markets) {
            tbody.innerHTML = data.markets.map(m => `
                <tr>
                    <td>${m.description}</td>
                    <td>${Formatters.currency(m.tam_current_usd)}</td>
                    <td>${Formatters.percentage(m.cagr_percent)}</td>
                    <td><a href="${m.source_url}" target="_blank">View</a></td>
                </tr>
            `).join('');
        }
    },
    
    // Update summary view
    updateSummary() {
        const competitive = StateManager.getAssessment('competitive');
        const market = StateManager.getAssessment('market');
        
        // Competitive summary
        document.getElementById('summaryCompetitiveAi').textContent = 
            competitive.aiScore || '-';
        document.getElementById('summaryCompetitiveUser').textContent = 
            competitive.userScore || '-';
        document.getElementById('summaryCompetitiveJustification').textContent = 
            competitive.justification || 'No assessment provided yet';
        
        // Market summary
        document.getElementById('summaryMarketAi').textContent = 
            market.aiScore || '-';
        document.getElementById('summaryMarketUser').textContent = 
            market.userScore || '-';
        document.getElementById('summaryMarketJustification').textContent = 
            market.justification || 'No assessment provided yet';
        
        // Overall metrics
        const avgAi = StateManager.calculateAverageScore('aiScore');
        const avgUser = StateManager.calculateAverageScore('userScore');
        const completedCount = StateManager.getCompletedCount();
        
        document.getElementById('overallAiAverage').textContent = 
            avgAi ? avgAi.toFixed(1) : '-';
        document.getElementById('overallUserAverage').textContent = 
            avgUser ? avgUser.toFixed(1) : '-';
        document.getElementById('assessmentStatus').textContent = 
            `${completedCount}/2`;
    },
    
    // Show completion message
    showCompletionMessage() {
        const msg = document.createElement('div');
        msg.className = 'completion-message';
        msg.innerHTML = `
            <h2>🎉 All Assessments Complete!</h2>
            <p>You can now export the full report or review your assessments.</p>
            <button onclick="AssessmentComponent.switchAssessment('summary')">View Summary</button>
        `;
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: var(--shadow-xl);
            text-align: center;
            z-index: 10000;
            max-width: 400px;
        `;
        
        msg.querySelector('button').style.cssText = `
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 500;
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            document.body.removeChild(msg);
        }, 5000);
    },
    
    // Restore from saved state
    restoreFromState() {
        const state = StateManager.getState();
        
        // Restore technology description
        const techInput = document.getElementById('techDescription');
        if (techInput && state.techDescription) {
            techInput.value = state.techDescription;
        }
        
        // If assessments have been run, show them
        if (state.assessments.competitive.data || state.assessments.market.data) {
            // Hide input section, show assessments
            document.getElementById('inputSection').style.display = 'none';
            document.getElementById('assessmentTabs').style.display = 'flex';
            
            // Show appropriate assessment
            if (state.currentAssessment) {
                this.switchAssessment(state.currentAssessment);
            } else {
                this.switchAssessment('competitive');
            }
            
            // Restore competitive if available
            if (state.assessments.competitive.data) {
                this.loadCompetitiveResults({
                    gradedAnalysis: state.assessments.competitive.data,
                    rawResponse: state.assessments.competitive.rawResponse
                });
            }
            
            // Restore market if available
            if (state.assessments.market.data) {
                this.loadMarketResults({
                    marketData: state.assessments.market.data.marketData,
                    scoringData: state.assessments.market.data.scoringData,
                    rawResponse: state.assessments.market.rawResponse
                });
            }
        }
    }
};