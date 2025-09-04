// DOM Elements
// Replace the elements object at the top of app.js with this corrected version:
const elements = {
    // Sections
    inputSection: document.getElementById('inputSection'),
    loadingSection: document.getElementById('loadingSection'),
    resultsSection: document.getElementById('resultsSection'),
    errorSection: document.getElementById('errorSection'),
    
    // Input elements
    techDescription: document.getElementById('techDescription'),
    competitiveAnalysis: document.getElementById('competitiveAnalysis'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    
    // Loading elements
    progressBar: document.getElementById('progressBar'),
    progressStatus: document.getElementById('progressStatus'),
    timeElapsed: document.getElementById('timeElapsed'),
    
    // Results elements
    aiScore: document.getElementById('aiScore'),
    scoreConfidence: document.getElementById('scoreConfidence'),
    tamValue: document.getElementById('tamValue'),
    cagrValue: document.getElementById('cagrValue'),
    marketDesc: document.getElementById('marketDesc'),
    userScoreSlider: document.getElementById('userScoreSlider'),
    userScoreDisplay: document.getElementById('userScoreDisplay'),
    deviationWarning: document.getElementById('deviationWarning'),
    justificationInput: document.getElementById('justificationInput'),
    submitScoreBtn: document.getElementById('submitScoreBtn'),
    scoreComment: document.getElementById('scoreComment'), // Add this
    deviationIndicator: document.getElementById('deviationIndicator'), // Add this
    
    // View toggles
    viewToggles: document.querySelectorAll('.view-toggle'),
    summaryView: document.getElementById('summaryView'),
    detailedView: document.getElementById('detailedView'),
    evidenceView: document.getElementById('evidenceView'), // Add this
    rubricView: document.getElementById('rubricView'), // Add this
    sourcesView: document.getElementById('sourcesView'), // Add this
    dataView: document.getElementById('dataView'),
    
    // New elements for updated layout
    rubricContext: document.getElementById('rubricContext'), // Add this
    quickInsights: document.getElementById('quickInsights'), // Add this
    sourceInfo: document.getElementById('sourceInfo'), // Add this
    
    // Detail elements
    strengthsList: document.getElementById('strengthsList'),
    limitationsList: document.getElementById('limitationsList'),
    risksList: document.getElementById('risksList'), // Add this
    marketAnalysis: document.getElementById('marketAnalysis'),
    marketsTableBody: document.getElementById('marketsTableBody'),
    rubricDetails: document.getElementById('rubricDetails'),
    rawDataDisplay: document.getElementById('rawDataDisplay'),
    
    // Error elements
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    
    // Export
    exportBtn: document.getElementById('exportBtn')
};

// State management
let state = {
    isAnalyzing: false,
    startTime: null,
    progressInterval: null,
    elapsedInterval: null,
    currentView: 'summary',
    lastInputs: {
        tech: '',
        competitive: ''
    }
};

// Initialize app
function init() {
    setupEventListeners();
    loadSavedInputs();
}

// Event Listeners
function setupEventListeners() {
    // Analysis button
    elements.analyzeBtn.addEventListener('click', handleAnalyze);
    
    // User score slider
    elements.userScoreSlider.addEventListener('input', handleScoreSliderChange);
    
    // Submit score button
    elements.submitScoreBtn.addEventListener('click', handleScoreSubmit);
    
    // View toggles
    elements.viewToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => handleViewToggle(e.target.dataset.view));
    });
    
    // Retry button
    elements.retryBtn.addEventListener('click', handleRetry);
    
    // Export button
    elements.exportBtn.addEventListener('click', handleExport);
    
    // Auto-save inputs
    elements.techDescription.addEventListener('input', saveInputs);
    elements.competitiveAnalysis.addEventListener('input', saveInputs);
}

// Handle analysis start
async function handleAnalyze() {
    const techDesc = elements.techDescription.value.trim();
    const compAnalysis = elements.competitiveAnalysis.value.trim();
    
    if (!techDesc || !compAnalysis) {
        alert('Please fill in both Technology Description and Competitive Analysis fields.');
        return;
    }
    
    // Save inputs for retry
    state.lastInputs = { tech: techDesc, competitive: compAnalysis };
    
    // Start analysis
    startAnalysis();
    
    try {
        let result;
        if (USE_MOCK_DATA) {
            result = await getMockData();
        } else {
            result = await analyzeMarket(techDesc, compAnalysis);
        }
        
        displayResults(result);
    } catch (error) {
        handleError(error);
    } finally {
        stopAnalysis();
    }
}

// Start analysis UI state
function startAnalysis() {
    state.isAnalyzing = true;
    state.startTime = Date.now();
    
    // Hide other sections, show loading
    hideAllSections();
    elements.loadingSection.style.display = 'block';
    
    // Disable analyze button
    elements.analyzeBtn.disabled = true;
    
    // Start progress animation
    startProgressAnimation();
    startElapsedTimer();
}

// Stop analysis UI state
function stopAnalysis() {
    state.isAnalyzing = false;
    
    // Clear intervals
    if (state.progressInterval) {
        clearInterval(state.progressInterval);
        state.progressInterval = null;
    }
    if (state.elapsedInterval) {
        clearInterval(state.elapsedInterval);
        state.elapsedInterval = null;
    }
    
    // Re-enable button
    elements.analyzeBtn.disabled = false;
}

// Progress animation
function startProgressAnimation() {
    let progress = 0;
    const expectedDuration = API_CONFIG.expectedDuration / 1000; // Convert to seconds
    
    state.progressInterval = setInterval(() => {
        const elapsed = (Date.now() - state.startTime) / 1000;
        progress = Math.min((elapsed / expectedDuration) * 100, 95); // Cap at 95%
        
        elements.progressBar.style.width = `${progress}%`;
        
        // Update status message based on elapsed time
        const currentMessage = PROGRESS_MESSAGES
            .filter(m => m.time <= elapsed)
            .pop();
        
        if (currentMessage) {
            elements.progressStatus.textContent = currentMessage.message;
        }
    }, 500);
}

// Elapsed timer
function startElapsedTimer() {
    state.elapsedInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        elements.timeElapsed.textContent = `Time elapsed: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Display results
function displayResults(data) {
    const { marketData, scoringData } = data;
    
    // Hide other sections, show results
    hideAllSections();
    elements.resultsSection.style.display = 'block';
    elements.exportBtn.style.display = 'flex';
    
    // Populate summary with new layout
    populateSummaryCard(marketData, scoringData);
    
    // Set user slider to AI score initially
    elements.userScoreSlider.value = scoringData.score;
    elements.userScoreDisplay.textContent = scoringData.score;
    
    // Populate detailed views
    populateEvidenceLists(scoringData, marketData);
    populateMarketsTable(marketData.markets);
    populateRubricDetails(scoringData.rubric_application);
    populateMarketAnalysis(marketData.market_analysis);
    
    // Raw data
    elements.rawDataDisplay.textContent = JSON.stringify({ marketData, scoringData }, null, 2);
}
// New function for cleaner summary card
function populateSummaryCard(marketData, scoringData) {
    // AI Score section
    if (elements.aiScore) elements.aiScore.textContent = scoringData.score;
    if (elements.scoreConfidence) elements.scoreConfidence.textContent = `Confidence: ${(scoringData.confidence * 100).toFixed(0)}%`;
    if (elements.tamValue) elements.tamValue.textContent = formatCurrency(marketData.primary_market.tam_usd);
    if (elements.cagrValue) elements.cagrValue.textContent = formatPercentage(marketData.primary_market.cagr_percent);
    if (elements.marketDesc) elements.marketDesc.textContent = marketData.primary_market.description;
    
    // Add rubric context - check if element exists
    if (elements.rubricContext) {
        elements.rubricContext.innerHTML = `
            <div class="rubric-reference">
                <h4>Score ${scoringData.score} Means:</h4>
                <p>${getRubricDescription(scoringData.rubric_application)}</p>
                <div class="score-factors">
                    <span class="factor-badge tam-${scoringData.rubric_application.tam_category}">
                        TAM: ${formatTAMCategory(scoringData.rubric_application.tam_category)}
                    </span>
                    <span class="factor-badge cagr-${scoringData.rubric_application.cagr_category}">
                        CAGR: ${formatCAGRCategory(scoringData.rubric_application.cagr_category)}
                    </span>
                </div>
            </div>
        `;
    }
    
    // Quick insights - check if element exists
    if (elements.quickInsights) {
        elements.quickInsights.innerHTML = `
            <div class="insight-grid">
                <div class="insight-card strength">
                    <h4>Top Strength</h4>
                    <p>${scoringData.justification.strengths_considered[0] || 'Strong market fundamentals'}</p>
                </div>
                <div class="insight-card risk">
                    <h4>Key Risk</h4>
                    <p>${scoringData.justification.key_risks[0] || 'Market execution risk'}</p>
                </div>
                <div class="insight-card opportunity">
                    <h4>Opportunity</h4>
                    <p>${marketData.market_analysis.opportunities[0] || 'Growing market demand'}</p>
                </div>
            </div>
        `;
    }
    
    // Primary source - check if element exists
    const primarySource = marketData.markets.find(m => m.rank === 1);
    if (primarySource && elements.sourceInfo) {
        elements.sourceInfo.innerHTML = `
            <div class="source-reference">
                <span class="source-label">Primary Data Source:</span>
                <a href="${primarySource.source_url}" target="_blank" class="source-link">
                    ${new URL(primarySource.source_url).hostname}
                </a>
                <span class="source-confidence">Confidence: ${(primarySource.confidence * 100).toFixed(0)}%</span>
            </div>
        `;
    }
}

// Helper functions for rubric context
function getRubricDescription(rubricApplication) {
    const descriptions = {
        '1': 'Very weak market opportunity with minimal growth potential',
        '2': 'Weak market with limited size and slow growth',
        '3': 'Small market with some growth potential',
        '4': 'Moderate market size with limited growth',
        '5': 'Moderate market with reasonable growth',
        '6': 'Good market opportunity with strong growth potential',
        '7': 'Large market with solid growth or strong niche with exceptional growth',
        '8': 'Very large market with good growth potential',
        '9': 'Exceptional market opportunity with both large size and rapid growth'
    };
    return descriptions[rubricApplication.base_score] || descriptions['5'];
}

function formatTAMCategory(category) {
    const formats = {
        'under_500M': '<$500M',
        '500M_to_5B': '$500M-$5B',
        'over_5B': '>$5B'
    };
    return formats[category] || category;
}

function formatCAGRCategory(category) {
    const formats = {
        'under_10': '<10%',
        '10_to_35': '10-35%',
        'over_35': '>35%'
    };
    return formats[category] || category;
}

// Update handleScoreSubmit to always require a comment
function handleScoreSubmit() {
    const userScore = parseInt(elements.userScoreSlider.value);
    const aiScore = parseInt(elements.aiScore.textContent);
    const deviation = calculateDeviation(aiScore, userScore);
    const comment = elements.scoreComment.value.trim();
    
    if (!comment) {
        alert('Please provide a comment explaining your score assessment.');
        elements.scoreComment.focus();
        return;
    }
    
    // Save user score and comment
    currentAnalysis.userScore = userScore;
    currentAnalysis.justification = comment;
    currentAnalysis.hasDeviation = deviation > 2;
    
    // Show confirmation with updated message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem 3rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        text-align: center;
    `;
    successMsg.innerHTML = `
        <h3 style="margin-bottom: 1rem;">✓ Assessment Submitted</h3>
        <p>Score: ${userScore}/9</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Comment saved</p>
    `;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        document.body.removeChild(successMsg);
    }, 3000);
    
    // Disable further changes
    elements.userScoreSlider.disabled = true;
    elements.submitScoreBtn.disabled = true;
    elements.submitScoreBtn.textContent = 'Assessment Submitted';
    elements.scoreComment.disabled = true;
}

// Populate evidence lists
function populateEvidenceLists(scoringData, marketData) {
    // Strengths
    if (elements.strengthsList) {
        elements.strengthsList.innerHTML = '';
        const strengths = [
            ...scoringData.justification.strengths_considered,
            ...marketData.scoring_alignment.strengths
        ];
        strengths.forEach(strength => {
            const li = document.createElement('li');
            li.textContent = strength;
            elements.strengthsList.appendChild(li);
        });
    }
    
    // Limitations
    if (elements.limitationsList) {
        elements.limitationsList.innerHTML = '';
        const limitations = [
            ...scoringData.justification.limitations_considered,
            ...marketData.scoring_alignment.limitations
        ];
        limitations.forEach(limitation => {
            const li = document.createElement('li');
            li.textContent = limitation;
            elements.limitationsList.appendChild(li);
        });
    }
    
    // Risks - ADD THIS SECTION
    if (elements.risksList) {
        elements.risksList.innerHTML = '';
        const risks = scoringData.justification.key_risks || [];
        risks.forEach(risk => {
            const li = document.createElement('li');
            li.textContent = risk;
            elements.risksList.appendChild(li);
        });
    }
}

// Populate markets table
function populateMarketsTable(markets) {
    elements.marketsTableBody.innerHTML = '';
    
    markets.forEach(market => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${market.rank}</td>
            <td>${market.description}</td>
            <td>${formatCurrency(market.tam_current_usd)} (${market.tam_current_year})</td>
            <td>${formatPercentage(market.cagr_percent)}</td>
            <td>${(market.confidence * 100).toFixed(0)}%</td>
            <td><a href="${market.source_url}" target="_blank">Source</a></td>
        `;
        elements.marketsTableBody.appendChild(row);
    });
}

// Populate rubric details
function populateRubricDetails(rubricApplication) {
    elements.rubricDetails.innerHTML = `
        <div class="rubric-detail-item">
            <strong>TAM Category:</strong> ${rubricApplication.tam_category.replace(/_/g, ' ')}
        </div>
        <div class="rubric-detail-item">
            <strong>CAGR Category:</strong> ${rubricApplication.cagr_category.replace(/_/g, ' ')}
        </div>
        <div class="rubric-detail-item">
            <strong>Rubric Intersection:</strong> ${rubricApplication.rubric_intersection}
        </div>
        <div class="rubric-detail-item">
            <strong>Base Score:</strong> ${rubricApplication.base_score}
        </div>
        <div class="rubric-detail-item">
            <strong>Adjustment Applied:</strong> ${rubricApplication.adjustment > 0 ? '+' : ''}${rubricApplication.adjustment}
        </div>
        <div class="rubric-detail-item">
            <strong>Adjustment Rationale:</strong> ${rubricApplication.adjustment_rationale}
        </div>
    `;
}

// Populate market analysis
function populateMarketAnalysis(analysis) {
    let html = `<p><strong>Executive Summary:</strong> ${analysis.executive_summary}</p>`;
    
    if (analysis.trends && analysis.trends.length > 0) {
        html += '<p><strong>Key Trends:</strong></p><ul>';
        analysis.trends.forEach(trend => {
            html += `<li>${trend}</li>`;
        });
        html += '</ul>';
    }
    
    if (analysis.opportunities && analysis.opportunities.length > 0) {
        html += '<p><strong>Opportunities:</strong></p><ul>';
        analysis.opportunities.forEach(opp => {
            html += `<li>${opp}</li>`;
        });
        html += '</ul>';
    }
    
    html += `<p><strong>Problem Statement:</strong> ${analysis.problem_statement}</p>`;
    html += `<p><strong>Differentiation:</strong> ${analysis.differentiation}</p>`;
    
    elements.marketAnalysis.innerHTML = html;
}

// Handle score slider change
function handleScoreSliderChange(e) {
    const userScore = parseInt(e.target.value);
    elements.userScoreDisplay.textContent = userScore;
    
    // Check for deviation
    const aiScore = parseInt(elements.aiScore.textContent);
    const deviation = calculateDeviation(aiScore, userScore);
    
    // Use deviationIndicator instead of deviationWarning
    if (deviation > 2) {
        if (elements.deviationIndicator) {
            elements.deviationIndicator.style.display = 'flex';
        }
    } else {
        if (elements.deviationIndicator) {
            elements.deviationIndicator.style.display = 'none';
        }
    }
}


// Handle view toggle
function handleViewToggle(view) {
    // Update active toggle
    elements.viewToggles.forEach(toggle => {
        toggle.classList.toggle('active', toggle.dataset.view === view);
    });
    
    // Hide all views
    if (elements.summaryView) elements.summaryView.style.display = 'none';
    if (elements.evidenceView) elements.evidenceView.style.display = 'none';
    if (elements.rubricView) elements.rubricView.style.display = 'none';
    if (elements.sourcesView) elements.sourcesView.style.display = 'none';
    if (elements.detailedView) elements.detailedView.style.display = 'none';
    if (elements.dataView) elements.dataView.style.display = 'none';
    
    // Show selected view
    switch(view) {
        case 'summary':
            if (elements.summaryView) elements.summaryView.style.display = 'block';
            break;
        case 'detailed':
            if (elements.evidenceView) elements.evidenceView.style.display = 'block';
            break;
        case 'rubric':
            if (elements.rubricView) elements.rubricView.style.display = 'block';
            break;
        case 'sources':
            if (elements.sourcesView) elements.sourcesView.style.display = 'block';
            break;
        case 'data':
            if (elements.dataView) elements.dataView.style.display = 'block';
            break;
    }
    
    state.currentView = view;
}

// Handle error
function handleError(error) {
    hideAllSections();
    elements.errorSection.style.display = 'block';
    elements.errorMessage.textContent = error.message || 'An unexpected error occurred.';
    console.error('Analysis error:', error);
}

// Handle retry
function handleRetry() {
    // Restore inputs
    elements.techDescription.value = state.lastInputs.tech;
    elements.competitiveAnalysis.value = state.lastInputs.competitive;
    
    // Reset UI
    hideAllSections();
    elements.inputSection.style.display = 'block';
    
    // Auto-start analysis
    handleAnalyze();
}

// Handle export
async function handleExport() {
    try {
        await generatePDF();
        
        // Show success message
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: #48bb78;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        msg.textContent = 'PDF exported successfully!';
        document.body.appendChild(msg);
        
        setTimeout(() => {
            document.body.removeChild(msg);
        }, 3000);
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export PDF. Please try again.');
    }
}

// Helper functions
function hideAllSections() {
    elements.inputSection.style.display = 'none';
    elements.loadingSection.style.display = 'none';
    elements.resultsSection.style.display = 'none';
    elements.errorSection.style.display = 'none';
    elements.exportBtn.style.display = 'none';
}

function saveInputs() {
    localStorage.setItem('techDescription', elements.techDescription.value);
    localStorage.setItem('competitiveAnalysis', elements.competitiveAnalysis.value);
}

function loadSavedInputs() {
    const savedTech = localStorage.getItem('techDescription');
    const savedComp = localStorage.getItem('competitiveAnalysis');
    
    if (savedTech) elements.techDescription.value = savedTech;
    if (savedComp) elements.competitiveAnalysis.value = savedComp;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);