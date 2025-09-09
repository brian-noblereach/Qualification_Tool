// js/components/assessment.js - Assessment Management Component with Unified Data Handling

const AssessmentComponent = {
    // Component state
    initialized: false,
    currentTab: 'competitive',
    
    // Initialize assessment sections with async handling
    async init() {
        if (this.initialized) {
            console.debug('Assessment component already initialized');
            return true;
        }
        
        try {
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize tabs
            this.initializeTabs();
            
            // Initialize rubrics for both assessments
            const competitiveInit = RubricComponent.init('competitive');
            const marketInit = RubricComponent.init('market');
            
            if (!competitiveInit || !marketInit) {
                throw new Error('Failed to initialize rubric components');
            }
            
            // Initialize evidence component
            if (!EvidenceComponent.init()) {
                console.warn('Evidence component initialization failed');
            }
            
            // Check if there's saved state after components are ready
            await this.loadSavedStateIfAvailable();
            
            this.initialized = true;
            console.log('Assessment component initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize assessment component:', error);
            return false;
        }
    },
    
    // Load saved state if available (async for proper sequencing)
    async loadSavedStateIfAvailable() {
        return new Promise((resolve) => {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                if (StateManager.load()) {
                    this.restoreFromState();
                }
                resolve();
            }, 100);
        });
    },
    
    // Setup event listeners with proper delegation
    setupEventListeners() {
        // Assessment tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('assessment-tab')) {
                const assessment = e.target.dataset.assessment;
                if (assessment) {
                    this.switchAssessment(assessment);
                }
            }
        });
        
        // View tab switching (delegated to EvidenceComponent)
        // Already handled in EvidenceComponent
    },
    
    // Initialize assessment tabs
    initializeTabs() {
        const tabs = document.getElementById('assessmentTabs');
        if (tabs) {
            // Hide tabs initially until data is loaded
            tabs.style.display = 'none';
        }
        
        const progress = document.getElementById('assessmentProgress');
        if (progress) {
            progress.style.display = 'none';
        }
    },
	
	// === Company auto-flow helpers ============================================
	async runCompetitiveFromText(text) {
	  // Persist the description so export/summary can show it
	  try { StateManager.setTechDescription?.(text); } catch (_) {}

	  // Try the Competitive runner in a tolerant order
	  const runner =
		  (typeof CompetitiveAPI?.run === "function" && CompetitiveAPI.run) ||
		  (typeof CompetitiveAPI?.analyze === "function" && CompetitiveAPI.analyze) ||
		  (typeof CompetitiveAPI?.startAssessment === "function" && CompetitiveAPI.startAssessment) ||
		  (typeof CompetitiveAPI?.start === "function" && CompetitiveAPI.start) ||
		  null;

	  if (runner) {
		// Most of your API methods accept (text) or ({ text })
		// Try plain text first; if it throws a type error, try object shape.
		try {
		  return await runner.call(CompetitiveAPI, text);
		} catch (e) {
		  // fallback if API expects an options object
		  return await runner.call(CompetitiveAPI, { text });
		}
	  }

	  // Last-resort fallback: reuse any existing “manual” path
	  if (typeof this.runCompetitive === "function") {
		const ta = document.getElementById("techDescription");
		if (ta) ta.value = text;
		return await this.runCompetitive();
	  }

	  throw new Error("No competitive analysis runner found.");
	},

	async runMarketFromText(text) {
	  // Persist for consistency (some summaries read from state)
	  try { StateManager.setTechDescription?.(text); } catch (_) {}

	  const runner =
		  (typeof MarketAPI?.run === "function" && MarketAPI.run) ||
		  (typeof MarketAPI?.analyze === "function" && MarketAPI.analyze) ||
		  (typeof MarketAPI?.startAssessment === "function" && MarketAPI.startAssessment) ||
		  (typeof MarketAPI?.start === "function" && MarketAPI.start) ||
		  null;

	  if (runner) {
		try {
		  return await runner.call(MarketAPI, text);
		} catch (e) {
		  return await runner.call(MarketAPI, { text });
		}
	  }

	  if (typeof this.runMarket === "function") {
		const ta = document.getElementById("techDescription");
		if (ta) ta.value = text;
		return await this.runMarket();
	  }

	  throw new Error("No market analysis runner found.");
	},
	// ========================================================================


    // Switch between assessments with validation
    switchAssessment(assessment) {
        if (!['competitive', 'market', 'summary'].includes(assessment)) {
            console.error(`Invalid assessment type: ${assessment}`);
            return;
        }
        
        // Update current assessment in state
        StateManager.setState({ currentAssessment: assessment });
        this.currentTab = assessment;
        
        // Update tab active states
        document.querySelectorAll('.assessment-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.assessment === assessment);
        });
        
        // Show/hide assessment sections
        const sections = {
            competitive: 'competitiveAssessment',
            market: 'marketAssessment',
            summary: 'summarySection'
        };
        
        Object.entries(sections).forEach(([key, elementId]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.display = key === assessment ? 'block' : 'none';
            }
        });
        
        // Update summary if switching to it
        if (assessment === 'summary') {
            this.updateSummary();
        }
    },
    
    // Load competitive analysis results with unified data structure
    loadCompetitiveResults(data) {
        if (!data) {
            console.error('No competitive data provided');
            return false;
        }
        
        try {
            // Determine if data is already formatted
            let formattedData;
            let rawData;
            
            if (data.formatted) {
                // New standardized structure from API
                formattedData = data.formatted;
                rawData = data.rawData;
            } else if (data.isFormatted || this.isFormattedData(data)) {
                // Data is already formatted (from saved state)
                formattedData = data;
                rawData = data.rawData || null;
            } else {
                // Legacy structure - should not happen with fixed APIs
                console.error('Unexpected competitive data structure');
                return false;
            }
            
            // Validate formatted data
            if (!this.validateCompetitiveData(formattedData)) {
                throw new Error('Invalid competitive data structure');
            }
            
            // Update state with standardized structure
            StateManager.setAssessmentData('competitive', {
                status: 'complete',
                aiScore: formattedData.score,
                data: formattedData,
                rawData: rawData,
                confidence: formattedData.confidence
            });
            
            // Store competitive analysis text for market analysis
            if (data.competitiveAnalysisText) {
                StateManager.setState({ 
                    competitiveAnalysisText: data.competitiveAnalysisText 
                });
            }
            
            // Set AI score in rubric
            RubricComponent.setAiScore('competitive', formattedData.score);
			this.updateAssessmentTabScore('competitive');
            
            // Update displays
            this.updateCompetitiveDisplays(formattedData);
            
            // Update evidence panel
            EvidenceComponent.updateCompetitiveEvidence(formattedData);
            
            // Update progress
            this.updateProgressIndicator('competitive', 'complete');
            
            return true;
        } catch (error) {
            console.error('Failed to load competitive results:', error);
            StateManager.setAssessmentData('competitive', {
                status: 'error',
                error: error.message
            });
            return false;
        }
    },
    
    // Check if data appears to be formatted
    isFormattedData(data) {
        // Check for expected formatted data fields
        return !!(
            data && 
            typeof data === 'object' &&
            'score' in data &&
            'competitorCount' in data &&
            'justification' in data
        );
    },
    
    // Validate competitive data structure
    validateCompetitiveData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Check required fields
        const requiredFields = ['score', 'competitorCount', 'justification'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }
        
        // Validate score
        const score = parseInt(data.score);
        if (isNaN(score) || score < 1 || score > 9) {
            console.error(`Invalid score: ${data.score}`);
            return false;
        }
        
        return true;
    },
    
    // Update competitive displays
    updateCompetitiveDisplays(data) {
        // Update metrics
        this.safeUpdateElement('competitorCount', data.competitorCount?.total || 0);
        this.safeUpdateElement('marketLeaderCount', data.marketLeaders?.length || 0);
        this.safeUpdateElement('competitiveIntensity', 
            Formatters.competitiveIntensity(data.competitiveIntensity));
        
        // Update confidence if element exists
        this.safeUpdateElement('competitiveConfidence',
            data.confidence !== null && data.confidence !== undefined
                ? Formatters.confidence(data.confidence)
                : 'Not available');
        
        // Update AI reasoning
        this.safeUpdateElement('competitiveAiReasoning', data.justification || '');
        
        // Update rubric description
        const rubricDesc = CompetitiveAPI.getRubricDescription(data.score);
        this.safeUpdateElement('competitiveRubricDescription', rubricDesc);
        
        // Update lists
        this.safeUpdateList('competitiveRisksList', data.keyRisks, 3);
        this.safeUpdateList('competitiveOpportunitiesList', data.opportunities, 3);
        
        // Update detailed views
        this.loadCompetitiveDetailedView(data);
        this.loadCompetitiveSources(data);
    },
    
    // Load market analysis results with unified data structure
    loadMarketResults(data) {
        if (!data) {
            console.error('No market data provided');
            return false;
        }
        
        try {
            // Determine if data is already formatted
            let formattedData;
            let rawData;
            
            if (data.formatted) {
                // New standardized structure from API
                formattedData = data.formatted;
                rawData = data.rawData;
            } else if (data.isFormatted || this.isMarketFormattedData(data)) {
                // Data is already formatted (from saved state)
                formattedData = data;
                rawData = data.rawData || null;
            } else {
                // Legacy structure - should not happen with fixed APIs
                console.error('Unexpected market data structure');
                return false;
            }
            
            // Validate formatted data
            if (!this.validateMarketData(formattedData)) {
                throw new Error('Invalid market data structure');
            }
            
            // Update state with standardized structure
            StateManager.setAssessmentData('market', {
                status: 'complete',
                aiScore: formattedData.score,
                data: formattedData,
                rawData: rawData,
                confidence: formattedData.confidence
            });
            
            // Set AI score in rubric
            RubricComponent.setAiScore('market', formattedData.score);
            this.updateAssessmentTabScore('market');

            // Update displays
            this.updateMarketDisplays(formattedData);
            
            // Update evidence panel
            EvidenceComponent.updateMarketEvidence(formattedData);
            
            // Update progress
            this.updateProgressIndicator('market', 'complete');
            
            return true;
        } catch (error) {
            console.error('Failed to load market results:', error);
            StateManager.setAssessmentData('market', {
                status: 'error',
                error: error.message
            });
            return false;
        }
    },
    
    // Check if market data appears to be formatted
    isMarketFormattedData(data) {
        return !!(
            data && 
            typeof data === 'object' &&
            'score' in data &&
            'primaryMarket' in data &&
            'justification' in data
        );
    },
    
    // Validate market data structure
    validateMarketData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Check required fields
        const requiredFields = ['score', 'primaryMarket', 'justification'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }
        
        // Validate score
        const score = parseInt(data.score);
        if (isNaN(score) || score < 1 || score > 9) {
            console.error(`Invalid score: ${data.score}`);
            return false;
        }
        
        return true;
    },
    
    // Update market displays
    updateMarketDisplays(data) {
        // Update metrics
        this.safeUpdateElement('tamValue', 
            Formatters.currency(data.primaryMarket?.tam || 0));
        this.safeUpdateElement('cagrValue', 
            Formatters.percentage(data.primaryMarket?.cagr || 0));
        this.safeUpdateElement('marketDesc', 
            data.primaryMarket?.description || 'Not available');
        
        // Update confidence
        this.safeUpdateElement('marketConfidence',
            data.confidence !== null && data.confidence !== undefined
                ? Formatters.confidence(data.confidence)
                : 'Not available');
        
        // Update AI reasoning
        this.safeUpdateElement('marketAiReasoning', 
            data.justification?.summary || '');
        
        // Update rubric description
        const rubricDesc = MarketAPI.getRubricDescription(data.score);
        this.safeUpdateElement('marketRubricDescription', rubricDesc);
        
        // Update lists - handle missing elements gracefully
        this.safeUpdateList('marketStrengthsList', data.justification?.strengths, 3);
        this.safeUpdateList('marketLimitationsList', data.justification?.limitations, 3);
        
        // Update detailed views
        this.loadMarketDetailedView(data);
        this.loadMarketSources(data);
    },
    
    // Safe element update helper
    safeUpdateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            if (typeof value === 'string') {
                element.textContent = value;
            } else {
                element.textContent = String(value);
            }
        } else {
            console.debug(`Element not found: ${elementId}`);
        }
    },
    
    // Safe list update helper
    safeUpdateList(elementId, items, maxItems = null) {
        const element = document.getElementById(elementId);
        if (element) {
            const validItems = Array.isArray(items) ? items : [];
            element.innerHTML = Formatters.listToHTML(validItems, maxItems);
        } else {
            console.debug(`List element not found: ${elementId}`);
        }
    },
    
    // Load competitive detailed view
    loadCompetitiveDetailedView(data) {
        if (!data) return;
        
        // Update all risks and opportunities
        this.safeUpdateList('allCompetitiveRisksList', data.keyRisks);
        this.safeUpdateList('allCompetitiveOpportunitiesList', data.opportunities);
        
        // Let EvidenceComponent handle the complex displays
        EvidenceComponent.updateCompetitiveDetails(data);
    },
    
    // Load competitive sources
    loadCompetitiveSources(data) {
        if (!data) return;
        
        // Sources are now in data.sourcesUsed
        const sources = data.sourcesUsed || [];
        EvidenceComponent.updateCompetitiveSources(sources, data.detailedCompetitors || []);
    },
    
    // Load market detailed view
    loadMarketDetailedView(data) {
        if (!data) return;
        
        // Let EvidenceComponent handle the complex displays
        EvidenceComponent.updateMarketDetails(data);
    },
    
    // Load market sources
    loadMarketSources(data) {
        if (!data) return;
        
        // Sources are in data.markets
        EvidenceComponent.updateMarketSources(data.markets || []);
    },
    
    // Update summary section
    updateSummary() {
        const state = StateManager.getState();
        const competitive = state.assessments.competitive;
        const market = state.assessments.market;
        
        // Update competitive summary
        this.safeUpdateElement('summaryCompetitiveAi', 
            competitive.aiScore !== null ? competitive.aiScore : '-');
        this.safeUpdateElement('summaryCompetitiveUser', 
            competitive.userScore !== null ? competitive.userScore : '-');
        this.safeUpdateElement('summaryCompetitiveJustification', 
            competitive.justification || 'No assessment provided yet');
        
        // Update market summary
        this.safeUpdateElement('summaryMarketAi', 
            market.aiScore !== null ? market.aiScore : '-');
        this.safeUpdateElement('summaryMarketUser', 
            market.userScore !== null ? market.userScore : '-');
        this.safeUpdateElement('summaryMarketJustification', 
            market.justification || 'No assessment provided yet');
        
        // Update overall statistics
        const stats = StateManager.getAssessmentStats();
        
        this.safeUpdateElement('overallAiAverage', 
            stats.averageAiScore !== null ? stats.averageAiScore.toFixed(1) : '-');
        this.safeUpdateElement('overallUserAverage', 
            stats.averageUserScore !== null ? stats.averageUserScore.toFixed(1) : '-');
        this.safeUpdateElement('assessmentStatus', 
            `${stats.completed}/${stats.totalAssessments}`);
    },
    
    // Update progress indicator
    updateProgressIndicator(assessment, status) {
        const progressItem = document.querySelector(`.progress-item[data-assessment="${assessment}"]`);
        if (progressItem) {
            progressItem.classList.remove('pending', 'in-progress', 'complete');
            progressItem.classList.add(status);
        }
        
        // Update tab indicator
        const tab = document.querySelector(`.assessment-tab[data-assessment="${assessment}"]`);
        if (tab && status === 'complete') {
            const userScore = StateManager.getAssessment(assessment)?.userScore;
            if (userScore !== null && userScore !== undefined) {
                tab.classList.add('completed');
            }
        }
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
            // Update header
            if (state.techDescription) {
                const nameEl = document.getElementById('companyName');
                const metaEl = document.getElementById('companyMeta');
                
                if (nameEl) {
                    nameEl.textContent = Formatters.truncate(state.techDescription, 60);
                }
                if (metaEl) {
                    metaEl.textContent = 'Competitive Risk & Market Opportunity Analysis';
                }
            }
            
            // Hide input section, show assessments
            const inputSection = document.getElementById('inputSection');
            if (inputSection) {
                inputSection.style.display = 'none';
            }
            
            const assessmentSection = document.getElementById('assessmentSection');
            if (assessmentSection) {
                assessmentSection.style.display = 'flex';
                assessmentSection.style.flexDirection = 'column';
                assessmentSection.style.flex = '1';
            }
            
            const assessmentTabs = document.getElementById('assessmentTabs');
            if (assessmentTabs) {
                assessmentTabs.style.display = 'flex';
            }
            
            const assessmentProgress = document.getElementById('assessmentProgress');
            if (assessmentProgress) {
                assessmentProgress.style.display = 'flex';
            }
            
            // Show header buttons
            const newAnalysisBtn = document.getElementById('newAnalysisBtn');
            const exportBtn = document.getElementById('exportBtn');
            if (newAnalysisBtn) newAnalysisBtn.style.display = 'inline-block';
            if (exportBtn) exportBtn.style.display = 'inline-block';
            
            // Restore competitive if available
            if (state.assessments.competitive.data) {
                this.loadCompetitiveResults({
                    formatted: state.assessments.competitive.data,
                    rawData: state.assessments.competitive.rawData,
                    competitiveAnalysisText: state.competitiveAnalysisText
                });
                
                // Restore user assessment if submitted
                if (state.assessments.competitive.submitted) {
                    RubricComponent.setScore('competitive', state.assessments.competitive.userScore);
					this.updateAssessmentTabScore('competitive')
                    const commentEl = document.getElementById('competitiveScoreComment');
                    if (commentEl) {
                        commentEl.value = state.assessments.competitive.justification;
                    }
                    RubricComponent.setEnabled('competitive', false);
                }
            }
            
            // Restore market if available
            if (state.assessments.market.data) {
                this.loadMarketResults({
                    formatted: state.assessments.market.data,
                    rawData: state.assessments.market.rawData
                });
                
                // Restore user assessment if submitted
                if (state.assessments.market.submitted) {
                    RubricComponent.setScore('market', state.assessments.market.userScore);
					this.updateAssessmentTabScore('market');
                    const commentEl = document.getElementById('marketScoreComment');
                    if (commentEl) {
                        commentEl.value = state.assessments.market.justification;
                    }
                    RubricComponent.setEnabled('market', false);
                }
            }
            
            // Show appropriate assessment
            if (state.currentAssessment) {
                this.switchAssessment(state.currentAssessment);
            } else {
                this.switchAssessment('competitive');
            }
        }
    },
	
	updateAssessmentTabScore(assessment){
		  try{
			const st = StateManager.getAssessment(assessment);
			if(!st) return;

			const display = Number.isInteger(st.userScore) ? st.userScore : st.aiScore;
			const tab = document.querySelector(`.assessment-tab[data-assessment="${assessment}"]`);
			const chip = document.getElementById(`${assessment}TabScore`);
			if(!tab || !chip) return;

			if(display == null){
			  chip.textContent = '';
			  tab.style.removeProperty('--tab-accent');
			  chip.style.background = 'var(--gray-400)';
			  return;
			}

			const sd = Formatters.scoreWithColor(display);   // returns {value,color,label}
			chip.textContent = display;
			chip.style.background = sd.color;
			tab.style.setProperty('--tab-accent', sd.color);
		  }catch(e){ console.warn('Tab score update failed', e); }
		},

	initCompanyAnalyzeFlow() {
	  const btn = document.getElementById("analyzeCompanyBtn");
	  if (!btn) return;
		btn.addEventListener("click", async (e) => {
		  e.preventDefault();

		  // ✅ make sure this matches the input in index.html
		  const urlEl = document.getElementById("companyUrlInput");

		  let url = (urlEl?.value || "").trim();

		  // Auto-prefix if the user typed "example.com"
		  if (url && !/^https?:\/\//i.test(url)) {
			url = "https://" + url;
		  }

		  if (!url) {
			alert("Please enter a company website URL.");
			urlEl?.focus();
			return;
		  }

		  try {
			LoadingUI?.show?.({ title: "Analyzing company…", phases: ["Company","Competitive","Market"] });

			const uid = "local-user";
			const company = await CompanyAPI.run(url, uid);
			StateManager.setCompany?.(company);
			CompanyView?.renderSummary?.(company);
			LoadingUI?.completePhase?.("Company");

			const compText = CompanyMappers.mapToCompetitivePrompt(company);
			await AssessmentComponent.runCompetitiveFromText(compText);
			LoadingUI?.completePhase?.("Competitive");

			const marketText = CompanyMappers.mapToMarketPrompt(company);
			await AssessmentComponent.runMarketFromText(marketText);
			LoadingUI?.completePhase?.("Market");

			LoadingUI?.hide?.();
		  } catch (e2) {
			console.error(e2);
			LoadingUI?.error?.(String(e2?.message || e2));
			alert("Company analysis failed: " + (e2?.message || e2));
		  }
		});

	},

    // Cleanup component
    cleanup() {
        // Cleanup child components
        if (RubricComponent.cleanup) {
            RubricComponent.cleanup();
        }
        
        if (EvidenceComponent.cleanup) {
            EvidenceComponent.cleanup();
        }
        
        this.initialized = false;
    }
};

document.addEventListener("DOMContentLoaded", () => {
  if (AssessmentComponent?.initCompanyAnalyzeFlow) {
    AssessmentComponent.initCompanyAnalyzeFlow();
  }
});
