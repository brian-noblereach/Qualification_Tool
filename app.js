// Initialize elements object
let elements = {};
let state = {
    isAnalyzing: false,
    currentView: 'summary',
    aiScore: null,
    userScore: null
};

// Initialize when DOM is ready
function init() {
    elements = {
        // Input elements
        techDescription: document.getElementById('techDescription'),
        competitiveAnalysis: document.getElementById('competitiveAnalysis'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        
        // Header elements
        companyName: document.getElementById('companyName'),
        companyMeta: document.getElementById('companyMeta'),
        newAnalysisBtn: document.getElementById('newAnalysisBtn'),
        exportBtn: document.getElementById('exportBtn'),
        
        // Sections
        inputSection: document.getElementById('inputSection'),
        loadingSection: document.getElementById('loadingSection'),
        assessmentSection: document.getElementById('assessmentSection'),
        errorSection: document.getElementById('errorSection'),
        
        // Loading elements
        progressBar: document.getElementById('progressBar'),
        progressStatus: document.getElementById('progressStatus'),
        timeElapsed: document.getElementById('timeElapsed'),
        
        // Scoring elements
        aiScore: document.getElementById('aiScore'),
        aiScoreReason: document.getElementById('aiScoreReason'),
        userScoreSlider: document.getElementById('userScoreSlider'),
        userScoreDisplay: document.getElementById('userScoreDisplay'),
        rubricDescription: document.getElementById('rubricDescription'),
        scoreComment: document.getElementById('scoreComment'),
        deviationWarning: document.getElementById('deviationWarning'),
        submitScoreBtn: document.getElementById('submitScoreBtn'),
        
        // Evidence elements
        tamValue: document.getElementById('tamValue'),
        cagrValue: document.getElementById('cagrValue'),
        marketDesc: document.getElementById('marketDesc'),
        aiReasoning: document.getElementById('aiReasoning'),
        strengthsList: document.getElementById('strengthsList'),
        limitationsList: document.getElementById('limitationsList'),
        
        // Detailed view elements
        marketAnalysis: document.getElementById('marketAnalysis'),
        allStrengthsList: document.getElementById('allStrengthsList'),
        allLimitationsList: document.getElementById('allLimitationsList'),
        risksList: document.getElementById('risksList'),
        sourcesTableBody: document.getElementById('sourcesTableBody'),
        
        // View controls
        viewTabs: document.querySelectorAll('.tab'),
        summaryView: document.getElementById('summaryView'),
        detailedView: document.getElementById('detailedView'),
        sourcesView: document.getElementById('sourcesView'),
        showMoreBtn: document.getElementById('showMoreBtn'),
        
        // Error elements
        errorMessage: document.getElementById('errorMessage'),
        retryBtn: document.getElementById('retryBtn')
    };
    
    setupEventListeners();
    loadSavedInputs();
}

// Event listeners
function setupEventListeners() {
    // Analysis
    elements.analyzeBtn?.addEventListener('click', handleAnalyze);
    elements.newAnalysisBtn?.addEventListener('click', startNewAnalysis);
    
    // Scoring
    elements.userScoreSlider?.addEventListener('input', handleSliderChange);
    elements.submitScoreBtn?.addEventListener('click', handleSubmitScore);
    
    // Views
    elements.viewTabs?.forEach(tab => {
        tab.addEventListener('click', (e) => switchView(e.target.dataset.view));
    });
    elements.showMoreBtn?.addEventListener('click', () => switchView('detailed'));
    
    // Export and retry
    elements.exportBtn?.addEventListener('click', handleExport);
    elements.retryBtn?.addEventListener('click', handleRetry);
    
    // Auto-save inputs
    elements.techDescription?.addEventListener('input', saveInputs);
    elements.competitiveAnalysis?.addEventListener('input', saveInputs);
}

// Handle analysis
async function handleAnalyze() {
    const tech = elements.techDescription.value.trim();
    const competitive = elements.competitiveAnalysis.value.trim();
    
    if (!tech || !competitive) {
        alert('Please fill in both fields');
        return;
    }
    
    // Update header with tech description (truncated)
    elements.companyName.textContent = tech.substring(0, 50) + (tech.length > 50 ? '...' : '');
    elements.companyMeta.textContent = 'Market Opportunity Analysis';
    
    showSection('loading');
    startProgress();
    
    try {
        const result = USE_MOCK_DATA ? await getMockData() : await analyzeMarket(tech, competitive);
        displayResults(result);
    } catch (error) {
        showError(error.message);
    }
}

// Display results
function displayResults(data) {
    const { marketData, scoringData } = data;
    
    showSection('assessment');
    elements.newAnalysisBtn.style.display = 'inline-block';
    elements.exportBtn.style.display = 'inline-block';
    
    // Set AI score
    state.aiScore = scoringData.score;
    elements.aiScore.textContent = scoringData.score;
    elements.aiScoreReason.textContent = scoringData.score;
    
    // Set initial user score to AI score
    elements.userScoreSlider.value = scoringData.score;
    elements.userScoreDisplay.textContent = scoringData.score;
    updateRubricDisplay(scoringData.score);
    
    // Populate metrics
    elements.tamValue.textContent = formatCurrency(marketData.primary_market.tam_usd);
    elements.cagrValue.textContent = formatPercentage(marketData.primary_market.cagr_percent);
    elements.marketDesc.textContent = marketData.primary_market.description;
    
    // AI reasoning
    elements.aiReasoning.textContent = scoringData.justification.summary;
    
    // Summary lists (top 3 items)
    populateList(elements.strengthsList, scoringData.justification.strengths_considered.slice(0, 3));
    populateList(elements.limitationsList, scoringData.justification.limitations_considered.slice(0, 3));
    
    // Detailed lists (all items)
    populateList(elements.allStrengthsList, [
        ...scoringData.justification.strengths_considered,
        ...marketData.scoring_alignment.strengths
    ]);
    populateList(elements.allLimitationsList, [
        ...scoringData.justification.limitations_considered,
        ...marketData.scoring_alignment.limitations
    ]);
    populateList(elements.risksList, scoringData.justification.key_risks);
    
    // Market analysis
    populateMarketAnalysis(marketData.market_analysis);
    
    // Sources table
    populateSourcesTable(marketData.markets);
    
    // Store data for export
    currentAnalysis.marketData = marketData;
    currentAnalysis.scoringData = scoringData;
}

// Handle slider change
function handleSliderChange(e) {
    const score = parseInt(e.target.value);
    elements.userScoreDisplay.textContent = score;
    updateRubricDisplay(score);
    
    // Check deviation
    const deviation = Math.abs(score - state.aiScore);
    elements.deviationWarning.style.display = deviation > 2 ? 'block' : 'none';
}

// Update rubric display based on score
function updateRubricDisplay(score) {
    // Update active rubric row
    document.querySelectorAll('.rubric-row').forEach(row => {
        row.classList.remove('active');
    });
    
    if (score <= 3) {
        document.querySelector('.score-1-3').classList.add('active');
        elements.rubricDescription.innerHTML = `
            <h3>Score ${score}: Weak Market</h3>
            <p>TAM <$500M with limited growth potential</p>
        `;
    } else if (score <= 5) {
        document.querySelector('.score-4-5').classList.add('active');
        elements.rubricDescription.innerHTML = `
            <h3>Score ${score}: Moderate Market</h3>
            <p>TAM $500M-$5B with CAGR <35% OR TAM <$500M with CAGR >10%</p>
        `;
    } else if (score <= 7) {
        document.querySelector('.score-6-7').classList.add('active');
        elements.rubricDescription.innerHTML = `
            <h3>Score ${score}: Good Market</h3>
            <p>TAM $500M-$5B with CAGR >35% OR TAM >$5B with CAGR 10-35%</p>
        `;
    } else {
        document.querySelector('.score-8-9').classList.add('active');
        elements.rubricDescription.innerHTML = `
            <h3>Score ${score}: Exceptional Market</h3>
            <p>TAM >$5B with CAGR >35%</p>
        `;
    }
}

// Handle submit score
function handleSubmitScore() {
    const comment = elements.scoreComment.value.trim();
    if (!comment) {
        alert('Please provide an assessment rationale');
        elements.scoreComment.focus();
        return;
    }
    
    currentAnalysis.userScore = parseInt(elements.userScoreSlider.value);
    currentAnalysis.justification = comment;
    
    // Show success message
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--primary-gradient);
        color: white;
        padding: 2rem;
        border-radius: 0.5rem;
        z-index: 1000;
    `;
    msg.innerHTML = '<h3>✓ Assessment Submitted</h3>';
    document.body.appendChild(msg);
    
    setTimeout(() => document.body.removeChild(msg), 2000);
    
    // Disable controls
    elements.userScoreSlider.disabled = true;
    elements.scoreComment.disabled = true;
    elements.submitScoreBtn.disabled = true;
    elements.submitScoreBtn.textContent = 'Submitted';
}

// Switch view
function switchView(view) {
    elements.viewTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
    });
    
    elements.summaryView.style.display = view === 'summary' ? 'block' : 'none';
    elements.detailedView.style.display = view === 'detailed' ? 'block' : 'none';
    elements.sourcesView.style.display = view === 'sources' ? 'block' : 'none';
    
    state.currentView = view;
}

// Helper functions
function showSection(section) {
    ['input', 'loading', 'assessment', 'error'].forEach(s => {
        const el = elements[s + 'Section'];
        if (el) el.style.display = s === section ? 'block' : 'none';
    });
}

function populateList(element, items) {
    if (!element || !items) return;
    element.innerHTML = items.map(item => `<li>${item}</li>`).join('');
}

function populateMarketAnalysis(analysis) {
    if (!elements.marketAnalysis || !analysis) return;
    
    let html = '';
    
    // Executive Summary with better formatting
    if (analysis.executive_summary) {
        html += `
            <div class="summary-section">
                <h4>Executive Summary:</h4>
                <p>${analysis.executive_summary}</p>
            </div>
        `;
    }
    
    // Trends with better formatting
    if (analysis.trends?.length) {
        html += `
            <div class="list-section">
                <h4>Key Trends:</h4>
                <ul class="formatted-list">
        `;
        analysis.trends.forEach(trend => {
            html += `<li>${trend}</li>`;
        });
        html += '</ul></div>';
    }
    
    // Opportunities
    if (analysis.opportunities?.length) {
        html += `
            <div class="list-section">
                <h4>Market Opportunities:</h4>
                <ul class="formatted-list">
        `;
        analysis.opportunities.forEach(opp => {
            html += `<li>${opp}</li>`;
        });
        html += '</ul></div>';
    }
    
    // Problem Statement
    if (analysis.problem_statement) {
        html += `
            <div class="statement-section">
                <h4>Problem Statement:</h4>
                <p>${analysis.problem_statement}</p>
            </div>
        `;
    }
    
    // Differentiation
    if (analysis.differentiation) {
        html += `
            <div class="statement-section">
                <h4>Differentiation:</h4>
                <p>${analysis.differentiation}</p>
            </div>
        `;
    }
    
    elements.marketAnalysis.innerHTML = html;
}

function populateSourcesTable(markets) {
    if (!elements.sourcesTableBody || !markets) return;
    
    elements.sourcesTableBody.innerHTML = markets.map(m => `
        <tr>
            <td>${m.description}</td>
            <td>${formatCurrency(m.tam_current_usd)}</td>
            <td>${formatPercentage(m.cagr_percent)}</td>
            <td><a href="${m.source_url}" target="_blank">View</a></td>
        </tr>
    `).join('');
}

function startNewAnalysis() {
    showSection('input');
    elements.newAnalysisBtn.style.display = 'none';
    elements.exportBtn.style.display = 'none';
    
    // Reset form
    elements.userScoreSlider.disabled = false;
    elements.scoreComment.disabled = false;
    elements.scoreComment.value = '';
    elements.submitScoreBtn.disabled = false;
    elements.submitScoreBtn.textContent = 'Submit Assessment';
}

function handleRetry() {
    showSection('input');
}

async function handleExport() {
    await generatePDF();
}

function showError(message) {
    showSection('error');
    elements.errorMessage.textContent = message;
}

function saveInputs() {
    localStorage.setItem('techDescription', elements.techDescription.value);
    localStorage.setItem('competitiveAnalysis', elements.competitiveAnalysis.value);
}

function loadSavedInputs() {
    const tech = localStorage.getItem('techDescription');
    const comp = localStorage.getItem('competitiveAnalysis');
    if (tech) elements.techDescription.value = tech;
    if (comp) elements.competitiveAnalysis.value = comp;
}

// Progress animation
function startProgress() {
    let startTime = Date.now();
    let progress = 0;
    
    const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        
        elements.timeElapsed.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        progress = Math.min(95, (elapsed / 365) * 100);
        elements.progressBar.style.width = progress + '%';
        
        const message = PROGRESS_MESSAGES.filter(m => m.time <= elapsed).pop();
        if (message) elements.progressStatus.textContent = message.message;
        
        if (elapsed > 600) clearInterval(interval);
    }, 500);
    
    state.progressInterval = interval;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}