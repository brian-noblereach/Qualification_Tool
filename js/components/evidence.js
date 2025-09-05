// js/components/evidence.js - Evidence Display Component

const EvidenceComponent = {
    // Initialize evidence panels
    init() {
        // Evidence panels are initialized when data is loaded
        console.log('Evidence component initialized');
    },
    
    // Update competitive evidence panel
    updateCompetitiveEvidence(data) {
        if (!data) return;
        
        // Key metrics
        this.updateMetric('competitorCount', data.competitorCount.total);
        this.updateMetric('marketLeaderCount', data.marketLeaders.length);
        this.updateMetric('competitiveIntensity', 
            Formatters.competitiveIntensity(data.competitiveIntensity));
        
        // AI reasoning
        this.updateAIReasoning('competitive', data.justification);
        
        // Evidence cards
        this.updateEvidenceCard('competitiveRisksList', data.keyRisks, 3);
        this.updateEvidenceCard('competitiveOpportunitiesList', data.opportunities, 3);
        
        // Detailed view
        this.updateCompetitiveDetails(data);
        
        // Data quality
        this.updateDataQuality('competitive', data.confidence);
    },
    
    // Update market evidence panel
    updateMarketEvidence(data) {
        if (!data) return;
        
        // Key metrics
        this.updateMetric('tamValue', Formatters.currency(data.primaryMarket.tam));
        this.updateMetric('cagrValue', Formatters.percentage(data.primaryMarket.cagr));
        this.updateMetric('marketDesc', data.primaryMarket.description);
        
        // AI reasoning
        this.updateAIReasoning('market', data.justification.summary);
        
        // Evidence cards
        this.updateEvidenceCard('marketStrengthsList', data.justification.strengths, 3);
        this.updateEvidenceCard('marketLimitationsList', data.justification.limitations, 3);
        
        // Detailed view
        this.updateMarketDetails(data);
        
        // Sources
        this.updateMarketSources(data.markets);
    },
    
    // Update a metric card
    updateMetric(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || '-';
        }
    },
    
    // Update AI reasoning box
    updateAIReasoning(type, reasoning) {
        const element = document.getElementById(`${type}AiReasoning`);
        if (element) {
            element.textContent = reasoning || 'No reasoning available';
        }
    },
    
    // Update evidence card list
    updateEvidenceCard(elementId, items, maxItems = null) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = Formatters.listToHTML(items, maxItems);
        }
    },
    
    // Update competitive details
    updateCompetitiveDetails(data) {
        // Competitor breakdown chart
        this.createCompetitorBreakdown(data.competitorCount);
        
        // Market leaders
        this.updateEvidenceCard('marketLeadersList', data.marketLeaders);
        
        // All risks and opportunities
        this.updateEvidenceCard('allCompetitiveRisksList', data.keyRisks);
        this.updateEvidenceCard('allCompetitiveOpportunitiesList', data.opportunities);
    },
    
    // Create competitor breakdown visualization
    createCompetitorBreakdown(counts) {
        const container = document.getElementById('competitorBreakdown');
        if (!container) return;
        
        const types = [
            { label: 'Large', count: counts.large, color: 'var(--danger)' },
            { label: 'Mid-size', count: counts.midSize, color: 'var(--warning)' },
            { label: 'Startups', count: counts.startups, color: 'var(--info)' },
            { label: 'Total', count: counts.total, color: 'var(--primary)' }
        ];
        
        container.innerHTML = types.map(type => `
            <div class="competitor-type">
                <div class="type-label">${type.label}</div>
                <div class="type-count" style="color: ${type.color}">${type.count}</div>
            </div>
        `).join('');
    },
    
    // Update market details
    updateMarketDetails(data) {
        // Market analysis sections
        this.createMarketAnalysis(data.marketAnalysis);
        
        // Combined strengths and limitations
        const allStrengths = [
            ...data.justification.strengths,
            ...data.scoringAlignment.strengths
        ];
        const allLimitations = [
            ...data.justification.limitations,
            ...data.scoringAlignment.limitations
        ];
        
        this.updateEvidenceCard('allMarketStrengthsList', allStrengths);
        this.updateEvidenceCard('allMarketLimitationsList', allLimitations);
        this.updateEvidenceCard('marketRisksList', data.justification.risks);
    },
    
    // Create market analysis sections
    createMarketAnalysis(analysis) {
        const container = document.getElementById('marketAnalysis');
        if (!container) return;
        
        let html = '';
        
        // Executive Summary
        if (analysis.executiveSummary) {
            html += this.createSection('Executive Summary', analysis.executiveSummary, 'summary');
        }
        
        // Problem Statement
        if (analysis.problemStatement) {
            html += this.createSection('Problem Statement', analysis.problemStatement, 'statement');
        }
        
        // Differentiation
        if (analysis.differentiation) {
            html += this.createSection('Differentiation', analysis.differentiation, 'statement');
        }
        
        // Trends
        if (analysis.trends && analysis.trends.length > 0) {
            html += this.createListSection('Key Trends', analysis.trends);
        }
        
        // Opportunities
        if (analysis.opportunities && analysis.opportunities.length > 0) {
            html += this.createListSection('Market Opportunities', analysis.opportunities);
        }
        
        // Unmet Needs
        if (analysis.unmetNeeds && analysis.unmetNeeds.length > 0) {
            html += this.createListSection('Unmet Needs', analysis.unmetNeeds);
        }
        
        // Barriers to Entry
        if (analysis.barriers && analysis.barriers.length > 0) {
            html += this.createListSection('Barriers to Entry', analysis.barriers);
        }
        
        container.innerHTML = html;
    },
    
    // Create a text section
    createSection(title, content, type = 'statement') {
        return `
            <div class="${type}-section">
                <h4>${title}</h4>
                <p>${content}</p>
            </div>
        `;
    },
    
    // Create a list section
    createListSection(title, items) {
        return `
            <div class="list-section">
                <h4>${title}</h4>
                <ul class="formatted-list">
                    ${items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    },
    
    // Update market sources table
    updateMarketSources(markets) {
        const tbody = document.getElementById('marketSourcesTableBody');
        if (!tbody || !markets) return;
        
        tbody.innerHTML = markets.map((market, index) => `
            <tr>
                <td>${market.description}</td>
                <td>${Formatters.currency(market.tam_current_usd)}</td>
                <td>${Formatters.percentage(market.cagr_percent)}</td>
                <td>
                    ${market.source_url ? 
                        `<a href="${market.source_url}" target="_blank">View</a>` : 
                        'N/A'}
                </td>
            </tr>
        `).join('');
    },
    
    // Update data quality indicators
    updateDataQuality(type, confidence) {
        const bar = document.getElementById(`${type}ConfidenceBar`);
        const value = document.getElementById(`${type}ConfidenceValue`);
        
        if (bar && value) {
            const percent = confidence * 100;
            // The bar shows the inverse (gray area)
            bar.style.width = `${100 - percent}%`;
            value.textContent = `${Math.round(percent)}%`;
            
            // Color the value based on confidence level
            if (percent >= 80) {
                value.style.color = 'var(--success)';
            } else if (percent >= 60) {
                value.style.color = 'var(--primary)';
            } else if (percent >= 40) {
                value.style.color = 'var(--warning)';
            } else {
                value.style.color = 'var(--danger)';
            }
        }
        
        // Update data sources description
        this.updateDataSources(type, confidence);
    },
    
    // Update data sources description
    updateDataSources(type, confidence) {
        const container = document.getElementById(`${type}DataSources`);
        if (!container) return;
        
        const confidenceLevel = confidence >= 0.8 ? 'High' : 
                               confidence >= 0.6 ? 'Moderate' : 
                               confidence >= 0.4 ? 'Low' : 'Very Low';
        
        container.innerHTML = `
            <p>Analysis based on ${type === 'competitive' ? 
                'competitive landscape research and market positioning' : 
                'market size data, growth rates, and industry trends'}.</p>
            <p><strong>Confidence Level:</strong> ${confidenceLevel} (${Math.round(confidence * 100)}%)</p>
            <p class="data-quality-note">
                ${confidence < 0.6 ? 
                    '⚠ Lower confidence may indicate limited data availability or market uncertainty.' : 
                    '✓ Confidence level indicates strong data reliability.'}
            </p>
        `;
    },
    
    // Create visual confidence indicator
    createConfidenceIndicator(confidence) {
        const level = Math.round(confidence * 5); // 0-5 scale
        let indicators = '';
        
        for (let i = 1; i <= 5; i++) {
            const filled = i <= level;
            indicators += `<span class="confidence-dot ${filled ? 'filled' : ''}"></span>`;
        }
        
        return `<div class="confidence-indicator">${indicators}</div>`;
    },
    
    // Highlight important values
    highlightValue(value, threshold, isHighGood = true) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;
        
        let className = '';
        if (isHighGood) {
            className = numValue >= threshold ? 'highlight-good' : 'highlight-bad';
        } else {
            className = numValue <= threshold ? 'highlight-good' : 'highlight-bad';
        }
        
        return `<span class="${className}">${value}</span>`;
    },
    
    // Create comparison indicator
    createComparison(value1, value2, label1 = 'AI', label2 = 'User') {
        return `
            <div class="comparison-indicator">
                <div class="comparison-item">
                    <span class="comparison-label">${label1}</span>
                    <span class="comparison-value">${value1}</span>
                </div>
                <div class="comparison-divider">vs</div>
                <div class="comparison-item">
                    <span class="comparison-label">${label2}</span>
                    <span class="comparison-value">${value2}</span>
                </div>
            </div>
        `;
    }
};