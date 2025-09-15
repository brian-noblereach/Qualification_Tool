// js/components/summary-view.js - Summary display component

class SummaryView {
  constructor() {
    this.elements = {};
  }

  /**
   * Initialize summary view
   */
  init() {
    this.cacheElements();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      companySummary: document.getElementById('companySummary'),
      competitiveAi: document.getElementById('summaryCompetitiveAi'),
      competitiveUser: document.getElementById('summaryCompetitiveUser'),
      competitiveJustification: document.getElementById('competitiveJustificationSummary'),
      marketAi: document.getElementById('summaryMarketAi'),
      marketUser: document.getElementById('summaryMarketUser'),
      marketJustification: document.getElementById('marketJustificationSummary')
    };
  }

  /**
   * Update summary with complete data
   */
  update(data) {
    this.displayCompanySummary(data.company);
    this.displayAssessmentSummary(data);
  }

  /**
   * Display company summary
   */
  displayCompanySummary(company) {
    if (!company || !this.elements.companySummary) return;

    const overview = company.company_overview || {};
    const tech = company.technology || {};
    const products = company.products_and_applications || {};
    const market = company.market_context || {};
    const funding = company.funding_and_investors || {};
    const team = company.team || {};

    // Build summary HTML
    let html = `
      <div class="company-overview">
        <h3>${Formatters.escapeHTML(overview.name || 'Company')}</h3>
        
        <div class="summary-grid">
          <div class="summary-section">
            <h4>Overview</h4>
            <div class="summary-items">
              <div class="summary-item">
                <span class="label">Website:</span>
                <span class="value">${Formatters.displayUrl(overview.website) || '-'}</span>
              </div>
              <div class="summary-item">
                <span class="label">Founded:</span>
                <span class="value">${overview.founded_year || '-'}</span>
              </div>
              <div class="summary-item">
                <span class="label">Stage:</span>
                <span class="value">${Formatters.companyStage(overview.company_stage)}</span>
              </div>
              <div class="summary-item">
                <span class="label">Employees:</span>
                <span class="value">${Formatters.employeeCount(overview.employee_count)}</span>
              </div>
              <div class="summary-item">
                <span class="label">Location:</span>
                <span class="value">${Formatters.escapeHTML(overview.headquarters || '-')}</span>
              </div>
            </div>
          </div>
          
          <div class="summary-section">
            <h4>Technology</h4>
            <div class="summary-items">
              <div class="summary-item">
                <span class="label">Category:</span>
                <span class="value">${Formatters.escapeHTML(tech.technology_category || '-')}</span>
              </div>
              <div class="summary-item full-width">
                <span class="label">Core Technology:</span>
                <span class="value">${Formatters.truncate(tech.core_technology, 150) || '-'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-section">
            <h4>Market</h4>
            <div class="summary-items">
              <div class="summary-item">
                <span class="label">Industry:</span>
                <span class="value">${Formatters.escapeHTML(market.industry || '-')}</span>
              </div>
              <div class="summary-item full-width">
                <span class="label">Value Proposition:</span>
                <span class="value">${Formatters.truncate(market.value_proposition, 150) || '-'}</span>
              </div>
            </div>
          </div>
          
          <div class="summary-section">
            <h4>Funding</h4>
            <div class="summary-items">
              <div class="summary-item">
                <span class="label">Total Raised:</span>
                <span class="value">${this.formatFunding(funding.total_funding)}</span>
              </div>
              <div class="summary-item">
                <span class="label">Rounds:</span>
                <span class="value">${(funding.funding_rounds || []).length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.elements.companySummary.innerHTML = html;
    this.elements.companySummary.style.display = 'block';
  }

  /**
   * Display assessment summary
   */
  displayAssessmentSummary(data) {
    // Competitive scores
    if (this.elements.competitiveAi && data.competitive) {
      this.elements.competitiveAi.textContent = data.competitive.assessment?.score || '-';
      const scoreData = Formatters.scoreColor(data.competitive.assessment?.score, 'competitive');
      this.elements.competitiveAi.style.color = scoreData.color;
    }

    if (this.elements.competitiveUser && data.competitive?.userScore) {
      this.elements.competitiveUser.textContent = data.competitive.userScore;
      const scoreData = Formatters.scoreColor(data.competitive.userScore, 'competitive');
      this.elements.competitiveUser.style.color = scoreData.color;
    }

    if (this.elements.competitiveJustification && data.competitive?.userJustification) {
      this.elements.competitiveJustification.textContent = data.competitive.userJustification;
    }

    // Market scores
    if (this.elements.marketAi && data.market) {
      this.elements.marketAi.textContent = data.market.scoring?.score || '-';
      const scoreData = Formatters.scoreColor(data.market.scoring?.score, 'market');
      this.elements.marketAi.style.color = scoreData.color;
    }

    if (this.elements.marketUser && data.market?.userScore) {
      this.elements.marketUser.textContent = data.market.userScore;
      const scoreData = Formatters.scoreColor(data.market.userScore, 'market');
      this.elements.marketUser.style.color = scoreData.color;
    }

    if (this.elements.marketJustification && data.market?.userJustification) {
      this.elements.marketJustification.textContent = data.market.userJustification;
    }
  }

  /**
   * Format funding amount
   */
  formatFunding(amount) {
    if (!amount) return '-';
    return Formatters.currency(amount);
  }

  /**
   * Clear summary
   */
  clear() {
    Object.values(this.elements).forEach(element => {
      if (element && element.textContent !== undefined) {
        element.textContent = '-';
      }
    });

    if (this.elements.companySummary) {
      this.elements.companySummary.style.display = 'none';
    }
  }
}

// Make available globally
window.SummaryView = SummaryView;