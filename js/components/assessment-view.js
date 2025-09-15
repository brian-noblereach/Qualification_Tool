// js/components/assessment-view.js - Assessment display and user scoring

class AssessmentView {
  constructor() {
    this.currentTab = 'competitive';
    this.currentView = {
      competitive: 'summary',
      market: 'summary'
    };
    this.data = {
      company: null,
      competitive: null,
      market: null
    };
    this.userScores = {
      competitive: { score: 5, justification: '' },
      market: { score: 5, justification: '' }
    };
    this.elements = {};
  }

  /**
   * Initialize assessment view
   */
  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.initializeSliders();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Tabs
		tabs: {
		  overview: document.querySelector('[data-tab="overview"]'),  // ADD THIS LINE
		  competitive: document.querySelector('[data-tab="competitive"]'),
		  market: document.querySelector('[data-tab="market"]'),
		  summary: document.querySelector('[data-tab="summary"]')
		},
		tabContents: {
		  overview: document.getElementById('overviewTab'),  // ADD THIS LINE
		  competitive: document.getElementById('competitiveTab'),
		  market: document.getElementById('marketTab'),
		  summary: document.getElementById('summaryTab')
		},
      
      // Competitive elements
      competitive: {
        aiScore: document.getElementById('competitiveAiScore'),
        userScore: document.getElementById('competitiveUserScore'),
        slider: document.getElementById('competitiveSlider'),
        rubric: document.getElementById('competitiveRubric'),
        justification: document.getElementById('competitiveJustification'),
        warning: document.getElementById('competitiveWarning'),
        submitBtn: document.getElementById('competitiveSubmit'),
        evidence: document.getElementById('competitiveEvidence'),
        scoreBadge: document.getElementById('competitiveScoreBadge')
      },
      
      // Market elements
      market: {
        aiScore: document.getElementById('marketAiScore'),
        userScore: document.getElementById('marketUserScore'),
        slider: document.getElementById('marketSlider'),
        rubric: document.getElementById('marketRubric'),
        justification: document.getElementById('marketJustification'),
        warning: document.getElementById('marketWarning'),
        submitBtn: document.getElementById('marketSubmit'),
        evidence: document.getElementById('marketEvidence'),
        scoreBadge: document.getElementById('marketScoreBadge')
      },
      
      // Summary elements
      summary: {
        competitiveAi: document.getElementById('summaryCompetitiveAi'),
        competitiveUser: document.getElementById('summaryCompetitiveUser'),
        competitiveJustification: document.getElementById('competitiveJustificationSummary'),
        marketAi: document.getElementById('summaryMarketAi'),
        marketUser: document.getElementById('summaryMarketUser'),
        marketJustification: document.getElementById('marketJustificationSummary'),
        companySummary: document.getElementById('companySummary')
      }
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab switching
    Object.entries(this.elements.tabs).forEach(([key, tab]) => {
      if (tab) {
        tab.addEventListener('click', () => this.switchTab(key));
      }
    });
    
    // Sliders
    if (this.elements.competitive.slider) {
      this.elements.competitive.slider.addEventListener('input', (e) => {
        this.handleSliderChange('competitive', parseInt(e.target.value));
      });
    }
    
    if (this.elements.market.slider) {
      this.elements.market.slider.addEventListener('input', (e) => {
        this.handleSliderChange('market', parseInt(e.target.value));
      });
    }
    
    // Submit buttons
    if (this.elements.competitive.submitBtn) {
      this.elements.competitive.submitBtn.addEventListener('click', () => {
        this.submitAssessment('competitive');
      });
    }
    
    if (this.elements.market.submitBtn) {
      this.elements.market.submitBtn.addEventListener('click', () => {
        this.submitAssessment('market');
      });
    }
	// Continue to Assessment button
	const continueBtn = document.getElementById('continueToAssessment');
	if (continueBtn) {
	  continueBtn.addEventListener('click', () => {
		this.switchTab('competitive');
	  });
	}
    
    // View toggles
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        const tab = this.currentTab === 'competitive' || this.currentTab === 'market' 
          ? this.currentTab 
          : 'competitive';
        this.switchView(tab, view);
      });
    });
  }

  /**
   * Initialize sliders with default values
   */
  initializeSliders() {
    ['competitive', 'market'].forEach(type => {
      const slider = this.elements[type].slider;
      const display = this.elements[type].userScore;
      
      if (slider && display) {
        slider.value = 5;
        display.textContent = 5;
        this.updateRubricDisplay(type, 5);
      }
    });
  }

  /**
   * Load analysis results
   */
  loadResults(results) {
	  this.data = results;
	  
	  // Load and display company overview first
	  if (results.company) {
		this.displayCompanyOverview(results.company);
		this.loadCompanyData(results.company);
	  }
	  
	  // Load competitive data
	  if (results.competitive) {
		this.loadCompetitiveData(results.competitive);
	  }
	  
	  // Load market data
	  if (results.market) {
		this.loadMarketData(results.market);
	  }
	  
	  // Show assessment section
	  document.getElementById('resultsSection').style.display = 'flex';
	  
	  // Show overview tab by default
	  this.switchTab('overview');
	  

	}

  /**
   * Load competitive data
   */
  loadCompetitiveData(data) {
    const elements = this.elements.competitive;
    
    // Set AI score
    if (elements.aiScore) {
      elements.aiScore.textContent = data.assessment.score;
    }
    
    // Set score badge
    if (elements.scoreBadge) {
      elements.scoreBadge.textContent = data.assessment.score;
      const scoreData = Formatters.scoreColor(data.assessment.score, 'competitive');
      elements.scoreBadge.style.background = scoreData.color;
    }
    
    // Set initial user score to match AI
    if (elements.slider) {
      elements.slider.value = data.assessment.score;
      this.handleSliderChange('competitive', data.assessment.score);
    }
    
    // Display evidence
    this.displayCompetitiveEvidence(data.formatted);
  }

  /**
   * Load market data
   */
  loadMarketData(data) {
    const elements = this.elements.market;
    
    // Set AI score
    if (elements.aiScore) {
      elements.aiScore.textContent = data.scoring.score;
    }
    
    // Set score badge
    if (elements.scoreBadge) {
      elements.scoreBadge.textContent = data.scoring.score;
      const scoreData = Formatters.scoreColor(data.scoring.score, 'market');
      elements.scoreBadge.style.background = scoreData.color;
    }
    
    // Set initial user score to match AI
    if (elements.slider) {
      elements.slider.value = data.scoring.score;
      this.handleSliderChange('market', data.scoring.score);
    }
    
    // Display evidence
    this.displayMarketEvidence(data.formatted);
  }

  /**
   * Load company data
   */
  loadCompanyData(company) {
    if (!this.elements.summary.companySummary) return;
    
    const overview = company.company_overview || {};
    const tech = company.technology || {};
    const market = company.market_context || {};
    
    this.elements.summary.companySummary.innerHTML = `
      <h3>${Formatters.escapeHTML(overview.name || 'Unknown Company')}</h3>
      <div class="company-details">
        <div class="detail-item">
          <span class="detail-label">Website:</span>
          <span class="detail-value">${Formatters.displayUrl(overview.website)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Founded:</span>
          <span class="detail-value">${overview.founded_year || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Stage:</span>
          <span class="detail-value">${Formatters.companyStage(overview.company_stage)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Industry:</span>
          <span class="detail-value">${Formatters.escapeHTML(market.industry || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Core Technology:</span>
          <span class="detail-value">${Formatters.truncate(tech.core_technology, 100)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Display competitive evidence
   */
  displayCompetitiveEvidence(data) {
	  const container = this.elements.competitive.evidence;
	  if (!container) return;
	  
	  const summaryHTML = `
		<div class="evidence-summary">
		  <div class="metrics-row">
			<div class="metric-card">
			  <div class="metric-label">Total Competitors</div>
			  <div class="metric-value">${data.totalCompetitors || 0}</div>
			</div>
			<div class="metric-card">
			  <div class="metric-label">Market Leaders</div>
			  <div class="metric-value">${data.marketLeaders.length || 0}</div>
			</div>
			<div class="metric-card">
			  <div class="metric-label">Intensity</div>
			  <div class="metric-value">${Formatters.competitiveIntensity(data.competitiveIntensity)}</div>
			</div>
			<div class="metric-card">
			  <div class="metric-label">Confidence</div>
			  <div class="metric-value">${Formatters.confidence(data.confidence)}</div>
			</div>
		  </div>
		  
		  <div class="content-section">
			<h4>AI Assessment Rationale</h4>
			<p>${Formatters.escapeHTML(data.justification)}</p>
		  </div>
		  
		  <div class="content-section risk-section">
			<h4>Key Risks</h4>
			<ul>${Formatters.listToHTML(data.keyRisks, 5)}</ul>
		  </div>
		  
		  <div class="content-section opportunity-section">
			<h4>Opportunities</h4>
			<ul>${Formatters.listToHTML(data.opportunities, 5)}</ul>
		  </div>
		</div>
	  `;
	  
	  const detailedHTML = `
		<div class="evidence-detailed">
		  <div class="content-section">
			<h4>Competitor Breakdown</h4>
			<p>${Formatters.competitorBreakdown(data.competitorCount)}</p>
		  </div>
		  
		  <div class="content-section">
			<h4>All Competitors Identified (${data.competitors.length})</h4>
			<div class="competitor-list" id="competitorList">
			  ${this.renderAllCompetitors(data.competitors)}
			</div>
			${data.competitors.length > 5 ? '<button class="show-more-btn" onclick="window.assessmentView.toggleCompetitorList()">Show All Competitors</button>' : ''}
		  </div>
		  
		  <div class="content-section">
			<h4>Market Dynamics</h4>
			<ul>${Formatters.listToHTML(data.technologyTrends)}</ul>
		  </div>
		</div>
	  `;
	  
	  const sourcesHTML = `
		<div class="evidence-sources">
		  <div class="content-section">
			<h4>Data Sources</h4>
			${this.renderSources(data.sources || [], 'competitive')}
		  </div>
		  
		  <div class="content-section">
			<h4>Data Quality</h4>
			<div class="metrics-row">
			  <div class="metric-card">
				<div class="metric-label">Confidence Level</div>
				<div class="metric-value">${Formatters.confidence(data.confidence)}</div>
			  </div>
			  <div class="metric-card">
				<div class="metric-label">Data Date</div>
				<div class="metric-value">${Formatters.date(data.dataDate)}</div>
			  </div>
			</div>
		  </div>
		</div>
	  `;
	  
	  container.innerHTML = summaryHTML;
	  container.dataset.summary = summaryHTML;
	  container.dataset.detailed = detailedHTML;
	  container.dataset.sources = sourcesHTML;
	}

  /**
   * Display market evidence
   */
  displayMarketEvidence(data) {
	  const container = this.elements.market.evidence;
	  if (!container) return;
	  
	  const summaryHTML = `
		<div class="evidence-summary">
		  <div class="metrics-row">
			<div class="metric-card">
			  <div class="metric-label">TAM</div>
			  <div class="metric-value">${Formatters.currency(data.primaryMarket.tam)}</div>
			</div>
			<div class="metric-card">
			  <div class="metric-label">CAGR</div>
			  <div class="metric-value">${Formatters.percentage(data.primaryMarket.cagr)}</div>
			</div>
			<div class="metric-card">
			  <div class="metric-label">Category</div>
			  <div class="metric-value">${Formatters.tamCategory(data.tamCategory)}</div>
			</div>
			<div class="metric-card">
			  <div class="metric-label">Confidence</div>
			  <div class="metric-value">${Formatters.confidence(data.confidence)}</div>
			</div>
		  </div>
		  
		  <div class="content-section">
			<h4>AI Assessment Rationale</h4>
			<p>${Formatters.escapeHTML(data.justification)}</p>
		  </div>
		  
		  <div class="content-section opportunity-section">
			<h4>Strengths</h4>
			<ul>${Formatters.listToHTML(data.strengths, 5)}</ul>
		  </div>
		  
		  <div class="content-section risk-section">
			<h4>Limitations</h4>
			<ul>${Formatters.listToHTML(data.limitations, 5)}</ul>
		  </div>
		</div>
	  `;
	  
	  const detailedHTML = `
		<div class="evidence-detailed">
		  <div class="content-section">
			<h4>Executive Summary</h4>
			<p>${Formatters.escapeHTML(data.executiveSummary)}</p>
		  </div>
		  
		  <div class="content-section">
			<h4>All Market Segments Analyzed</h4>
			${this.renderAllMarkets(data.markets)}
		  </div>
		  
		  <div class="content-section">
			<h4>Market Opportunities</h4>
			<ul>${Formatters.listToHTML(data.opportunities)}</ul>
		  </div>
		  
		  <div class="content-section">
			<h4>Market Trends</h4>
			<ul>${Formatters.listToHTML(data.trends)}</ul>
		  </div>
		  
		  <div class="content-section">
			<h4>Barriers to Entry</h4>
			<ul>${Formatters.listToHTML(data.barriers)}</ul>
		  </div>
		</div>
	  `;
	  
	  const sourcesHTML = `
		<div class="evidence-sources">
		  <div class="content-section">
			<h4>TAM/CAGR Data Sources</h4>
			${this.renderMarketSources(data.markets)}
		  </div>
		  
		  <div class="content-section">
			<h4>Data Quality</h4>
			<div class="metrics-row">
			  <div class="metric-card">
				<div class="metric-label">Overall Confidence</div>
				<div class="metric-value">${Formatters.confidence(data.confidence)}</div>
			  </div>
			  <div class="metric-card">
				<div class="metric-label">Data Recency</div>
				<div class="metric-value">${data.dataRecency || 'Unknown'}</div>
			  </div>
			</div>
			${data.dataConcerns && data.dataConcerns.length > 0 ? `
			  <div class="data-concerns">
				<h5>Data Concerns:</h5>
				<ul>${Formatters.listToHTML(data.dataConcerns)}</ul>
			  </div>
			` : ''}
		  </div>
		</div>
	  `;
	  
	  container.innerHTML = summaryHTML;
	  container.dataset.summary = summaryHTML;
	  container.dataset.detailed = detailedHTML;
	  container.dataset.sources = sourcesHTML;
	}
	renderAllMarkets(markets) {
	  if (!markets || markets.length === 0) {
		return '<p>No additional market data available</p>';
	  }
	  
	  return `
		<table class="markets-table">
		  <thead>
			<tr>
			  <th>Rank</th>
			  <th>Market Description</th>
			  <th>TAM</th>
			  <th>CAGR</th>
			  <th>Confidence</th>
			</tr>
		  </thead>
		  <tbody>
			${markets.map(market => `
			  <tr>
				<td>${market.rank || '-'}</td>
				<td>${Formatters.escapeHTML(market.description)}</td>
				<td>${Formatters.currency(market.tam)}</td>
				<td>${Formatters.percentage(market.cagr)}</td>
				<td>${Formatters.confidence(market.confidence)}</td>
			  </tr>
			`).join('')}
		  </tbody>
		</table>
	  `;
	}

	renderMarketSources(markets) {
	  if (!markets || markets.length === 0) {
		return '<p>No source information available</p>';
	  }
	  
	  return markets.filter(m => m.source).map(market => `
		<div class="source-item">
		  <div>
			<strong>${Formatters.escapeHTML(market.description)}</strong><br>
			${market.source ? `<a href="${market.source}" target="_blank" rel="noopener">${market.source}</a>` : 'No source URL'}
			<br>
			<span class="source-confidence">Confidence: ${Formatters.confidence(market.confidence)}</span>
		  </div>
		</div>
	  `).join('');
	}

  /**
   * Render competitors list
   */
  renderCompetitors(competitors) {
    if (!competitors || competitors.length === 0) {
      return '<p>No detailed competitor information available</p>';
    }
    
    return competitors.slice(0, 5).map(comp => `
      <div class="competitor-card">
        <div class="competitor-header">
          <h5>${Formatters.escapeHTML(comp.name)}</h5>
          <span class="size-badge">${Formatters.companySize(comp.size)}</span>
        </div>
        <p>${Formatters.escapeHTML(comp.description)}</p>
      </div>
    `).join('');
  }
  renderAllCompetitors(competitors) {
	  if (!competitors || competitors.length === 0) {
		return '<p>No detailed competitor information available</p>';
	  }
	  
	  return competitors.map((comp, index) => `
		<div class="competitor-card" ${index >= 5 ? 'style="display:none;" data-hidden="true"' : ''}>
		  <div class="competitor-header">
			<h5>${Formatters.escapeHTML(comp.name)}</h5>
			<span class="size-badge">${Formatters.companySize(comp.size)}</span>
		  </div>
		  <p>${Formatters.escapeHTML(comp.description || comp.product || 'No description available')}</p>
		  ${comp.strengths && comp.strengths.length > 0 ? `
			<div class="competitor-strengths">
			  <strong>Strengths:</strong> ${comp.strengths.slice(0, 3).join(', ')}
			</div>
		  ` : ''}
		</div>
	  `).join('');
	}

	toggleCompetitorList() {
	  const list = document.getElementById('competitorList');
	  const hiddenCards = list.querySelectorAll('[data-hidden="true"]');
	  const button = list.parentElement.querySelector('.show-more-btn');
	  
	  if (hiddenCards[0]?.style.display === 'none') {
		hiddenCards.forEach(card => card.style.display = 'block');
		button.textContent = 'Show Less';
	  } else {
		hiddenCards.forEach(card => card.style.display = 'none');
		button.textContent = 'Show All Competitors';
	  }
	}

	renderSources(sources, type) {
	  if (!sources || sources.length === 0) {
		return '<p>No source information available</p>';
	  }
	  
	  return sources.map(source => {
		const isUrl = source.startsWith('http');
		return `
		  <div class="source-item">
			<div class="source-content">
			  ${isUrl ? `<a href="${source}" target="_blank" rel="noopener">${source}</a>` : Formatters.escapeHTML(source)}
			</div>
		  </div>
		`;
	  }).join('');
	}

  /**
   * Switch tab
   */
  /**
 * Switch tab
 */
	switchTab(tab) {
	  this.currentTab = tab;
	  
	  // Update tab buttons
	  Object.entries(this.elements.tabs).forEach(([key, element]) => {
		if (element) {
		  element.classList.toggle('active', key === tab);
		}
	  });
	  
	  // Update tab contents
	  Object.entries(this.elements.tabContents).forEach(([key, element]) => {
		if (element) {
		  element.style.display = key === tab ? 'block' : 'none';
		}
	  });
	  
	  // Also check for overview tab content (if not in tabContents)
	  const overviewContent = document.getElementById('overviewTab');
	  if (overviewContent) {
		overviewContent.style.display = tab === 'overview' ? 'block' : 'none';
	  }
	  
	  // Update summary if switching to it
	  if (tab === 'summary') {
		this.updateSummary();
	  }
	}

  /**
   * Switch view (summary/detailed)
   */
  switchView(tab, view) {
	  this.currentView[tab] = view;
	  
	  // Update view buttons
	  document.querySelectorAll(`#${tab}Tab .view-btn`).forEach(btn => {
		btn.classList.toggle('active', btn.dataset.view === view);
	  });
	  
	  // Update content
	  const container = this.elements[tab].evidence;
	  if (container) {
		if (view === 'summary' && container.dataset.summary) {
		  container.innerHTML = container.dataset.summary;
		} else if (view === 'detailed' && container.dataset.detailed) {
		  container.innerHTML = container.dataset.detailed;
		} else if (view === 'sources' && container.dataset.sources) {
		  container.innerHTML = container.dataset.sources;
		}
	  }
	}

  /**
   * Handle slider change
   */
  handleSliderChange(type, score) {
    this.userScores[type].score = score;
    
    // Update display
    if (this.elements[type].userScore) {
      this.elements[type].userScore.textContent = score;
      const scoreData = Formatters.scoreColor(score, type);
      this.elements[type].userScore.style.color = scoreData.color;
    }
    
    // Update rubric
    this.updateRubricDisplay(type, score);
    
    // Check deviation
    this.checkDeviation(type, score);
  }

  /**
   * Update rubric display
   */
  updateRubricDisplay(type, score) {
    const rubricElement = this.elements[type].rubric;
    if (!rubricElement) return;
    
    const rubricText = type === 'competitive' 
      ? CompetitiveAPI.getRubricDescription(score)
      : MarketAPI.getRubricDescription(score);
    
    const scoreData = Formatters.scoreColor(score, type);
    
    rubricElement.innerHTML = `
      <strong>Score ${score}: ${scoreData.label}</strong><br>
      ${Formatters.escapeHTML(rubricText)}
    `;
    
    rubricElement.style.borderLeftColor = scoreData.color;
  }

  /**
   * Check score deviation
   */
  checkDeviation(type, userScore) {
    const aiScore = type === 'competitive' 
      ? this.data.competitive?.assessment?.score
      : this.data.market?.scoring?.score;
    
    if (!aiScore) return;
    
    const deviation = Validators.checkScoreDeviation(aiScore, userScore);
    const warning = this.elements[type].warning;
    
    if (warning) {
      if (deviation.hasDeviation) {
        warning.textContent = deviation.message;
        warning.style.display = 'block';
      } else {
        warning.style.display = 'none';
      }
    }
  }

  /**
   * Submit assessment
   */
  submitAssessment(type) {
    const justification = this.elements[type].justification.value;
    const score = this.userScores[type].score;
    
    // Validate
    const validation = Validators.validateAssessment(score, justification);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }
    
    // Save
    this.userScores[type].justification = justification;
    this.userScores[type].submitted = true;
    
    // Update UI
    const submitBtn = this.elements[type].submitBtn;
    if (submitBtn) {
      submitBtn.textContent = 'Submitted';
      submitBtn.disabled = true;
    }
    
    // Disable inputs
    this.elements[type].slider.disabled = true;
    this.elements[type].justification.disabled = true;
    
    // Update badge
    const badge = this.elements[type].scoreBadge;
    if (badge) {
      badge.textContent = `${score} (User)`;
    }
    
    // Check if both complete
    if (this.userScores.competitive.submitted && this.userScores.market.submitted) {
      this.onComplete();
    }
  }

  /**
   * Update summary
   */
  updateSummary() {
    const summary = this.elements.summary;
    
    // Competitive scores
    if (summary.competitiveAi) {
      summary.competitiveAi.textContent = this.data.competitive?.assessment?.score || '-';
    }
    if (summary.competitiveUser) {
      summary.competitiveUser.textContent = this.userScores.competitive.submitted 
        ? this.userScores.competitive.score 
        : '-';
    }
    if (summary.competitiveJustification) {
      summary.competitiveJustification.textContent = this.userScores.competitive.justification || 'Not submitted';
    }
    
    // Market scores
    if (summary.marketAi) {
      summary.marketAi.textContent = this.data.market?.scoring?.score || '-';
    }
    if (summary.marketUser) {
      summary.marketUser.textContent = this.userScores.market.submitted 
        ? this.userScores.market.score 
        : '-';
    }
    if (summary.marketJustification) {
      summary.marketJustification.textContent = this.userScores.market.justification || 'Not submitted';
    }
  }

  /**
   * Called when both assessments complete
   */
  onComplete() {
    // Show export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.style.display = 'inline-block';
    }
  }

  /**
   * Get assessment data for export
   */
  getExportData() {
    return {
      company: this.data.company,
      competitive: {
        ...this.data.competitive,
        userScore: this.userScores.competitive.score,
        userJustification: this.userScores.competitive.justification
      },
      market: {
        ...this.data.market,
        userScore: this.userScores.market.score,
        userJustification: this.userScores.market.justification
      }
    };
  }
  displayCompanyOverview(company) {
  // Update persistent header
	const headerBar = document.getElementById('companyHeaderBar');
	if (headerBar) {
	  headerBar.classList.add('active');
	  
	  const overview = company.company_overview || {};
	  const market = company.market_context || {};
	  const tech = company.technology || {};
	  
	  document.getElementById('headerCompanyName').textContent = overview.name || 'Unknown Company';
	  
	  // Use a shorter tagline - either mission or tech category
	  const tagline = tech.technology_category || 
					   (overview.mission_statement ? Formatters.truncate(overview.mission_statement, 50) : '');
	  document.getElementById('headerTagline').textContent = tagline;
	  
	  document.getElementById('headerIndustry').textContent = market.industry || 'Technology';
	  document.getElementById('headerStage').textContent = Formatters.companyStage(overview.company_stage) || 'Early Stage';
	}
  
  // Basic Information
  const basicInfo = document.getElementById('overviewBasicInfo');
  if (basicInfo) {
    const overview = company.company_overview || {};
    basicInfo.innerHTML = `
      <div class="overview-field">
        <div class="overview-field-label">Company Name</div>
        <div class="overview-field-value">${Formatters.escapeHTML(overview.name || '-')}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Website</div>
        <div class="overview-field-value">${Formatters.displayUrl(overview.website) || '-'}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Founded</div>
        <div class="overview-field-value">${overview.founded_year || '-'}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Stage</div>
        <div class="overview-field-value">${Formatters.companyStage(overview.company_stage) || '-'}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Employees</div>
        <div class="overview-field-value">${Formatters.employeeCount(overview.employee_count) || '-'}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Description</div>
        <div class="overview-field-value">${Formatters.escapeHTML(overview.company_description || overview.mission_statement || '-')}</div>
      </div>
    `;
  }
  
  // Technology
  const techInfo = document.getElementById('overviewTechnology');
  if (techInfo) {
    const tech = company.technology || {};
    techInfo.innerHTML = `
      <div class="overview-field">
        <div class="overview-field-label">Core Technology</div>
        <div class="overview-field-value">${Formatters.escapeHTML(tech.core_technology || '-')}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Category</div>
        <div class="overview-field-value">${Formatters.escapeHTML(tech.technology_category || '-')}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Technical Approach</div>
        <div class="overview-field-value">${Formatters.escapeHTML(tech.technical_approach || '-')}</div>
      </div>
      ${tech.key_innovations && tech.key_innovations.length > 0 ? `
        <div class="overview-field">
          <div class="overview-field-label">Key Innovations</div>
          <div class="overview-field-value">
            <ul>${Formatters.listToHTML(tech.key_innovations)}</ul>
          </div>
        </div>
      ` : ''}
    `;
  }
  
  // Products
	const productsInfo = document.getElementById('overviewProducts');
	if (productsInfo) {
	  const products = company.products_and_applications || {};
	  productsInfo.innerHTML = `
		<div class="overview-field">
		  <div class="overview-field-label">Primary Application</div>
		  <div class="overview-field-value">${Formatters.escapeHTML(products.primary_application || '-')}</div>
		</div>
		${products.products && products.products.length > 0 ? `
		  <div class="overview-field">
			<div class="overview-field-label">Products</div>
			<div class="overview-field-value">
			  <ul>${products.products.map(product => {
				// Handle both string and object formats
				if (typeof product === 'string') {
				  return `<li>${Formatters.escapeHTML(product)}</li>`;
				} else if (product && typeof product === 'object') {
				  // If it's an object, try to get name, title, or convert to string
				  const productName = product.name || product.title || product.product_name || JSON.stringify(product);
				  return `<li>${Formatters.escapeHTML(productName)}</li>`;
				}
				return '';
			  }).join('')}</ul>
			</div>
		  </div>
		` : ''}
		${products.use_cases && products.use_cases.length > 0 ? `
		  <div class="overview-field">
			<div class="overview-field-label">Use Cases</div>
			<div class="overview-field-value">
			  <ul>${Formatters.listToHTML(products.use_cases, 3)}</ul>
			</div>
		  </div>
		` : ''}
	  `;
	}
  
  // Market Context
  const marketInfo = document.getElementById('overviewMarket');
  if (marketInfo) {
    const market = company.market_context || {};
    marketInfo.innerHTML = `
      <div class="overview-field">
        <div class="overview-field-label">Industry</div>
        <div class="overview-field-value">${Formatters.escapeHTML(market.industry || '-')}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Problem Addressed</div>
        <div class="overview-field-value">${Formatters.escapeHTML(market.problem_addressed || '-')}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Value Proposition</div>
        <div class="overview-field-value">${Formatters.escapeHTML(market.value_proposition || '-')}</div>
      </div>
      <div class="overview-field">
        <div class="overview-field-label">Business Model</div>
        <div class="overview-field-value">${Formatters.escapeHTML(market.business_model || '-')}</div>
      </div>
    `;
  }
}
}

// Make available globally
window.AssessmentView = AssessmentView;