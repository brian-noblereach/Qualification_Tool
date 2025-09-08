// js/components/evidence.js - Evidence Display Component with Enhanced Error Handling

const EvidenceComponent = {
    // Component state
    initialized: false,
    currentView: {
        competitive: 'summary',
        market: 'summary'
    },
    
    // Initialize evidence panels with error handling
    init() {
        try {
            // Setup view tab handlers
            this.setupViewTabs();
            
            // Initialize default views
            this.currentView.competitive = 'summary';
            this.currentView.market = 'summary';
            
            this.initialized = true;
            console.log('Evidence component initialized');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize evidence component:', error);
            return false;
        }
    },
    
    // Setup view tab handlers
    setupViewTabs() {
        // Handle all view tabs with delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab')) {
                const assessment = e.target.dataset.assessment;
                const view = e.target.dataset.view;
                
                if (assessment && view) {
                    this.switchView(assessment, view);
                }
            }
        });
    },
    
    // Switch view for an assessment
    switchView(assessment, view) {
        if (!['competitive', 'market'].includes(assessment)) {
            console.error(`Invalid assessment type: ${assessment}`);
            return;
        }
        
        if (!['summary', 'detailed', 'sources'].includes(view)) {
            console.error(`Invalid view type: ${view}`);
            return;
        }
        
        // Update current view
        this.currentView[assessment] = view;
        
        // Update tab active states
        document.querySelectorAll(`.tab[data-assessment="${assessment}"]`).forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });
        
        // Show/hide view content
        const views = {
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
        
        Object.entries(views[assessment]).forEach(([viewName, elementId]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.display = viewName === view ? 'block' : 'none';
            }
        });
    },
    
    // Update competitive evidence panel with validation
    updateCompetitiveEvidence(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid competitive evidence data');
            return false;
        }
        
        try {
            // Key metrics
            this.updateMetric('competitorCount', data.competitorCount?.total || 0);
            this.updateMetric('marketLeaderCount', data.marketLeaders?.length || 0);
            this.updateMetric('competitiveIntensity', 
                Formatters.competitiveIntensity(data.competitiveIntensity));
            
            // Add confidence if available
            this.updateMetric('competitiveConfidence', 
                data.confidence !== null && data.confidence !== undefined 
                    ? Formatters.confidence(data.confidence) 
                    : 'Not available');
            
            // AI reasoning
            this.updateAIReasoning('competitive', data.justification);
            
            // Evidence cards with validation
            this.updateEvidenceCard('competitiveRisksList', data.keyRisks || [], 3);
            this.updateEvidenceCard('competitiveOpportunitiesList', data.opportunities || [], 3);
            
            // Detailed view
            this.updateCompetitiveDetails(data);
            
            // Sources
            this.updateCompetitiveSources(data.sourcesUsed || [], data.detailedCompetitors || []);
            
            return true;
        } catch (error) {
            console.error('Failed to update competitive evidence:', error);
            return false;
        }
    },
    
    // Update market evidence panel with validation
    updateMarketEvidence(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid market evidence data');
            return false;
        }
        
        try {
            // Key metrics
            this.updateMetric('tamValue', 
                Formatters.currency(data.primaryMarket?.tam || 0));
            this.updateMetric('cagrValue', 
                Formatters.percentage(data.primaryMarket?.cagr || 0));
            this.updateMetric('marketDesc', 
                data.primaryMarket?.description || 'Not available');
            
            // Add confidence if available
            this.updateMetric('marketConfidence',
                data.confidence !== null && data.confidence !== undefined
                    ? Formatters.confidence(data.confidence)
                    : 'Not available');
            
            // AI reasoning
            this.updateAIReasoning('market', data.justification?.summary);
            
            // Evidence cards - Handle missing elements gracefully
            const strengthsList = document.getElementById('marketStrengthsList');
            if (strengthsList) {
                strengthsList.innerHTML = Formatters.listToHTML(data.justification?.strengths || [], 3);
            }
            
            const limitationsList = document.getElementById('marketLimitationsList');
            if (limitationsList) {
                limitationsList.innerHTML = Formatters.listToHTML(data.justification?.limitations || [], 3);
            }
            
            // Detailed view
            this.updateMarketDetails(data);
            
            // Sources
            this.updateMarketSources(data.markets || []);
            
            return true;
        } catch (error) {
            console.error('Failed to update market evidence:', error);
            return false;
        }
    },
    
    // Update a metric card with error handling
    updateMetric(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || '-';
            
            // Add visual indicator for missing data
            if (value === '-' || value === 'Not available') {
                element.classList.add('no-data');
            } else {
                element.classList.remove('no-data');
            }
        } else {
            console.debug(`Metric element not found: ${elementId}`);
        }
    },
    
    // Update AI reasoning box
    updateAIReasoning(type, reasoning) {
        const element = document.getElementById(`${type}AiReasoning`);
        if (element) {
            const text = reasoning || 'No reasoning available';
            element.textContent = text;
            
            // Add class for styling empty state
            if (!reasoning) {
                element.classList.add('no-data');
            } else {
                element.classList.remove('no-data');
            }
        }
    },
    
    // Update evidence card list with validation
    updateEvidenceCard(elementId, items, maxItems = null) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.debug(`Evidence card element not found: ${elementId}`);
            return;
        }
        
        // Validate items array
        const validItems = Array.isArray(items) ? items : [];
        
        element.innerHTML = Formatters.listToHTML(validItems, maxItems, 'No items available');
        
        // Add visual state for empty lists
        if (validItems.length === 0) {
            element.classList.add('empty-list');
        } else {
            element.classList.remove('empty-list');
        }
    },
    
    // Update competitive details with enhanced competitor display
    updateCompetitiveDetails(data) {
        if (!data) return;
        
        // Competitor breakdown chart
        this.createCompetitorBreakdown(data.competitorCount || {});
        
        // Detailed competitors (from structured data)
        if (data.detailedCompetitors && data.detailedCompetitors.length > 0) {
            this.createDetailedCompetitorsList(data.detailedCompetitors);
        } else {
            // Fallback to market leaders
            this.updateEvidenceCard('marketLeadersList', data.marketLeaders || []);
        }
        
        // All risks and opportunities
        this.updateEvidenceCard('allCompetitiveRisksList', data.keyRisks || []);
        this.updateEvidenceCard('allCompetitiveOpportunitiesList', data.opportunities || []);
    },
    
    // Create detailed competitors list with rich information
    createDetailedCompetitorsList(competitors) {
        const container = document.getElementById('marketLeadersList');
        if (!container) return;
        
        if (!competitors || competitors.length === 0) {
            container.innerHTML = '<p class="no-data">No detailed competitor information available</p>';
            return;
        }
        
        container.innerHTML = competitors.map(comp => `
            <div class="competitor-detail-card">
                <div class="competitor-header">
                    <h4>${Formatters.escapeHTML(comp.name)}</h4>
                    <span class="size-badge size-${comp.size.toLowerCase()}">${Formatters.escapeHTML(comp.size)}</span>
                </div>
                <div class="competitor-description">
                    ${Formatters.escapeHTML(comp.description)}
                </div>
                ${comp.products && comp.products.length > 0 ? `
                    <div class="competitor-section">
                        <strong>Products/Services:</strong>
                        <p>${comp.products.map(p => Formatters.escapeHTML(p)).join(', ')}</p>
                    </div>
                ` : ''}
                ${comp.strengths && comp.strengths.length > 0 ? `
                    <div class="competitor-section">
                        <strong>Strengths:</strong>
                        <ul>${comp.strengths.map(s => `<li>${Formatters.escapeHTML(s)}</li>`).join('')}</ul>
                    </div>
                ` : ''}
                ${comp.weaknesses && comp.weaknesses.length > 0 ? `
                    <div class="competitor-section">
                        <strong>Weaknesses:</strong>
                        <ul>${comp.weaknesses.map(w => `<li>${Formatters.escapeHTML(w)}</li>`).join('')}</ul>
                    </div>
                ` : ''}
                ${comp.marketPosition && comp.marketPosition !== 'Unknown' ? `
                    <div class="competitor-meta">
                        <span class="meta-badge position-${comp.marketPosition.toLowerCase()}">
                            ${Formatters.escapeHTML(comp.marketPosition)}
                        </span>
                    </div>
                ` : ''}
            </div>
        `).join('');
    },
    
    // Create competitor breakdown visualization
    createCompetitorBreakdown(counts) {
        const container = document.getElementById('competitorBreakdown');
        if (!container) return;
        
        // Ensure we have valid counts
        const safeCount = {
            large: parseInt(counts.large) || 0,
            midSize: parseInt(counts.midSize) || 0,
            startups: parseInt(counts.startups) || 0,
            total: parseInt(counts.total) || 0
        };
        
        // Calculate total if not provided
        if (safeCount.total === 0) {
            safeCount.total = safeCount.large + safeCount.midSize + safeCount.startups;
        }
        
        const types = [
            { label: 'Large', count: safeCount.large, color: 'var(--danger)' },
            { label: 'Mid-size', count: safeCount.midSize, color: 'var(--warning)' },
            { label: 'Startups', count: safeCount.startups, color: 'var(--info)' },
            { label: 'Total', count: safeCount.total, color: 'var(--primary)' }
        ];
        
        container.innerHTML = types.map(type => `
            <div class="competitor-type">
                <div class="type-label">${Formatters.escapeHTML(type.label)}</div>
                <div class="type-count" style="color: ${type.color}">${type.count}</div>
            </div>
        `).join('');
    },
    
    // Update competitive sources
    updateCompetitiveSources(sources, competitors) {
        const container = document.getElementById('competitiveSourcesView');
        if (!container) return;
        
        let html = '<div class="card"><h3>Data Sources</h3>';
        
        if (sources && sources.length > 0) {
            html += '<div class="sources-list"><ul>';
            sources.forEach(source => {
                html += `<li>${Formatters.escapeHTML(source)}</li>`;
            });
            html += '</ul></div>';
        } else {
            html += '<p class="no-data">No specific sources documented</p>';
        }
        
        // Add note about data quality
        html += `
            <div class="sources-note">
                <p><strong>Note:</strong> This analysis is based on available public information and may not reflect the complete competitive landscape.</p>
            </div>
        `;
        
        html += '</div>';
        container.innerHTML = html;
    },
    
    // Update market details
    updateMarketDetails(data) {
        if (!data) return;
        
        // Market analysis sections
        this.createMarketAnalysis(data.marketAnalysis || {});
        
        // Combined strengths and limitations with deduplication
        const allStrengths = this.deduplicateArray([
            ...(data.justification?.strengths || []),
            ...(data.scoringAlignment?.strengths || [])
        ]);
        
        const allLimitations = this.deduplicateArray([
            ...(data.justification?.limitations || []),
            ...(data.scoringAlignment?.limitations || [])
        ]);
        
        this.updateEvidenceCard('allMarketStrengthsList', allStrengths);
        this.updateEvidenceCard('allMarketLimitationsList', allLimitations);
        this.updateEvidenceCard('marketRisksList', data.justification?.risks || []);
    },
    
    // Deduplicate array items
    deduplicateArray(arr) {
        if (!Array.isArray(arr)) return [];
        return [...new Set(arr.filter(item => item && item.trim()))];
    },
    
    // Create market analysis sections with validation
    createMarketAnalysis(analysis) {
        const container = document.getElementById('marketAnalysis');
        if (!container) return;
        
        if (!analysis || Object.keys(analysis).length === 0) {
            container.innerHTML = '<p class="no-data">No detailed market analysis available</p>';
            return;
        }
        
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
        
        container.innerHTML = html || '<p class="no-data">No analysis sections available</p>';
    },
    
    // Create a text section with proper escaping
    createSection(title, content, type = 'statement') {
        if (!content) return '';
        
        return `
            <div class="${type}-section">
                <h4>${Formatters.escapeHTML(title)}</h4>
                <p>${Formatters.escapeHTML(content)}</p>
            </div>
        `;
    },
    
    // Create a list section with proper escaping
    createListSection(title, items) {
        if (!items || !Array.isArray(items) || items.length === 0) return '';
        
        return `
            <div class="list-section">
                <h4>${Formatters.escapeHTML(title)}</h4>
                <ul class="formatted-list">
                    ${items.map(item => `<li>${Formatters.escapeHTML(item)}</li>`).join('')}
                </ul>
            </div>
        `;
    },
    
    // Update market sources table with validation
    updateMarketSources(markets) {
        const tbody = document.getElementById('marketSourcesTableBody');
        if (!tbody) return;
        
        if (!markets || !Array.isArray(markets) || markets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-data" style="text-align: center;">
                        No market source data available
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = markets.map((market, index) => {
            // Validate market object
            if (!market || typeof market !== 'object') {
                return '';
            }
            
            return `
                <tr>
                    <td>${Formatters.escapeHTML(market.description || 'Unknown')}</td>
                    <td>${Formatters.currency(market.tam_current_usd || 0)}</td>
                    <td>${Formatters.percentage(market.cagr_percent || 0)}</td>
                    <td>
                        ${market.source_url ? 
                            `<a href="${Formatters.escapeHTML(market.source_url)}" 
                                target="_blank" 
                                rel="noopener noreferrer">View</a>` : 
                            'N/A'}
                    </td>
                </tr>
            `;
        }).filter(row => row).join('');
    },
    
    // Create comparison indicator for scores
    createComparison(value1, value2, label1 = 'AI', label2 = 'User') {
        return `
            <div class="comparison-indicator">
                <div class="comparison-item">
                    <span class="comparison-label">${Formatters.escapeHTML(label1)}</span>
                    <span class="comparison-value">${Formatters.escapeHTML(value1 || '-')}</span>
                </div>
                <div class="comparison-divider">vs</div>
                <div class="comparison-item">
                    <span class="comparison-label">${Formatters.escapeHTML(label2)}</span>
                    <span class="comparison-value">${Formatters.escapeHTML(value2 || '-')}</span>
                </div>
            </div>
        `;
    },
    
    // Cleanup component
    cleanup() {
        // Remove event listeners if needed
        this.initialized = false;
    }
};