// js/core/pipeline.js - Sequential analysis pipeline manager

class AnalysisPipeline {
  constructor() {
    this.phases = [
	  { 
		name: 'Company Analysis',
		key: 'company',
		duration: 480,  // 8 minutes (was 260 seconds)
		status: 'pending',
		startTime: null,
		endTime: null,
		data: null,
		error: null
	  },
	  { 
		name: 'Competitive Analysis',
		key: 'competitive',
		duration: 240,  // 4 minutes (was 120 seconds)
		status: 'pending',
		startTime: null,
		endTime: null,
		data: null,
		error: null
	  },
	  { 
		name: 'Market Analysis',
		key: 'market',
		duration: 480,  // 8 minutes (was 150 seconds)
		status: 'pending',
		startTime: null,
		endTime: null,
		data: null,
		error: null
	  }
	];
    
    this.currentPhaseIndex = -1;
    this.startTime = null;
    this.abortController = null;
    this.companyUrl = null;
    this.techDescription = null;
    this.callbacks = {};
  }

  /**
   * Register callback functions
   */
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  /**
   * Emit event to registered callback
   */
  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  /**
   * Start the analysis pipeline
   */
  async start(companyUrl) {
    if (this.currentPhaseIndex >= 0) {
      throw new Error('Analysis already in progress');
    }

    // Validate URL
    const validation = Validators.validateUrl(companyUrl);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.companyUrl = validation.url;
    this.startTime = Date.now();
    this.abortController = new AbortController();
    
    // Reset all phases
    this.phases.forEach(phase => {
      phase.status = 'pending';
      phase.startTime = null;
      phase.endTime = null;
      phase.data = null;
      phase.error = null;
    });

    this.emit('start', { url: this.companyUrl });

    try {
      // Run each phase sequentially
      for (let i = 0; i < this.phases.length; i++) {
        this.currentPhaseIndex = i;
        const phase = this.phases[i];
        
        await this.runPhase(phase);
        
        // Check if aborted
        if (this.abortController.signal.aborted) {
          throw new Error('Analysis cancelled');
        }
      }

      this.emit('complete', this.getResults());
      return this.getResults();

    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.currentPhaseIndex = -1;
      this.abortController = null;
    }
  }

  /**
   * Run a single phase
   */
  async runPhase(phase) {
    phase.status = 'active';
    phase.startTime = Date.now();
    
    this.emit('phaseStart', {
      phase: phase.key,
      name: phase.name,
      estimatedDuration: phase.duration
    });

    try {
      let result;
      
      switch (phase.key) {
        case 'company':
          result = await this.runCompanyAnalysis();
          break;
        case 'competitive':
          result = await this.runCompetitiveAnalysis();
          break;
        case 'market':
          result = await this.runMarketAnalysis();
          break;
        default:
          throw new Error(`Unknown phase: ${phase.key}`);
      }

      phase.data = result;
      phase.status = 'completed';
      phase.endTime = Date.now();
      
      this.emit('phaseComplete', {
        phase: phase.key,
        name: phase.name,
        duration: (phase.endTime - phase.startTime) / 1000,
        data: result
      });

    } catch (error) {
      phase.status = 'error';
      phase.error = error;
      phase.endTime = Date.now();
      
      this.emit('phaseError', {
        phase: phase.key,
        name: phase.name,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Run company analysis
   */
  async runCompanyAnalysis() {
    const response = await CompanyAPI.analyze(
      this.companyUrl,
      this.abortController.signal
    );
    
    // Validate response
    const validation = Validators.validateCompany(response);
    if (!validation.valid) {
      throw new Error(`Invalid company data: ${validation.error}`);
    }
    
    // Extract tech description for next phases
    this.techDescription = this.buildTechDescription(response);
    
    return response;
  }

  /**
   * Run competitive analysis
   */
  async runCompetitiveAnalysis() {
    if (!this.techDescription) {
      throw new Error('Tech description not available');
    }

    const response = await CompetitiveAPI.analyze(
      this.techDescription,
      this.abortController.signal
    );
    
    // Validate response
    const validation = Validators.validateCompetitive(response);
    if (!validation.valid) {
      throw new Error(`Invalid competitive data: ${validation.error}`);
    }
    
    return response;
  }

  /**
   * Run market analysis
   */
  async runMarketAnalysis() {
    if (!this.techDescription) {
      throw new Error('Tech description not available');
    }

    const competitiveData = this.phases[1].data;
    if (!competitiveData) {
      throw new Error('Competitive analysis not available');
    }

    const response = await MarketAPI.analyze(
      this.techDescription,
      competitiveData.analysisText,
      this.abortController.signal
    );
    
    // Validate response
    const validation = Validators.validateMarket(response);
    if (!validation.valid) {
      throw new Error(`Invalid market data: ${validation.error}`);
    }
    
    return response;
  }

  /**
   * Build tech description from company data
   */
  buildTechDescription(company) {
    const parts = [];
    
    // Company basics
    if (company.company_overview) {
      const o = company.company_overview;
      if (o.name) parts.push(`Company: ${o.name}`);
      if (o.mission_statement) parts.push(`Mission: ${o.mission_statement}`);
      if (o.company_description) parts.push(o.company_description);
    }
    
    // Technology
    if (company.technology) {
      const t = company.technology;
      if (t.core_technology) parts.push(`Core Technology: ${t.core_technology}`);
      if (t.technical_approach) parts.push(`Technical Approach: ${t.technical_approach}`);
      if (t.key_innovations && t.key_innovations.length > 0) {
        parts.push(`Key Innovations: ${t.key_innovations.slice(0, 3).join('; ')}`);
      }
    }
    
    // Products and applications
    if (company.products_and_applications) {
      const p = company.products_and_applications;
      if (p.primary_application) parts.push(`Primary Application: ${p.primary_application}`);
      if (p.target_industries && p.target_industries.length > 0) {
        parts.push(`Target Industries: ${p.target_industries.join(', ')}`);
      }
    }
    
    // Market context
    if (company.market_context) {
      const m = company.market_context;
      if (m.problem_addressed) parts.push(`Problem Addressed: ${m.problem_addressed}`);
      if (m.value_proposition) parts.push(`Value Proposition: ${m.value_proposition}`);
    }
    
    const description = parts.join('\n\n');
    
    // Ensure minimum length
    if (description.length < 200) {
      parts.push('This company is developing innovative technology solutions for their target market.');
    }
    
    return parts.join('\n\n');
  }

  /**
   * Cancel the analysis
   */
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.emit('cancelled', {
        phase: this.currentPhaseIndex >= 0 ? this.phases[this.currentPhaseIndex].key : null
      });
    }
  }

  /**
   * Get current progress
   */
  getProgress() {
    const totalDuration = this.phases.reduce((sum, p) => sum + p.duration, 0);
    const elapsed = (Date.now() - this.startTime) / 1000;
    
    // Calculate expected progress based on time
    let expectedProgress = 0;
    let cumulativeDuration = 0;
    
    for (let i = 0; i <= this.currentPhaseIndex; i++) {
      const phase = this.phases[i];
      
      if (i < this.currentPhaseIndex) {
        // Completed phases
        expectedProgress += (phase.duration / totalDuration) * 100;
      } else if (i === this.currentPhaseIndex) {
        // Current phase
        const phaseElapsed = (Date.now() - phase.startTime) / 1000;
        const phaseProgress = Math.min(1, phaseElapsed / phase.duration);
        expectedProgress += (phase.duration / totalDuration) * 100 * phaseProgress;
      }
    }
    
    return {
      percentage: Math.min(95, expectedProgress), // Cap at 95% until complete
      elapsed,
      estimated: totalDuration,
      remaining: Math.max(0, totalDuration - elapsed),
      currentPhase: this.currentPhaseIndex >= 0 ? this.phases[this.currentPhaseIndex].name : null
    };
  }

  /**
   * Get results
   */
  getResults() {
    return {
      company: this.phases[0].data,
      competitive: this.phases[1].data,
      market: this.phases[2].data,
      techDescription: this.techDescription,
      duration: (Date.now() - this.startTime) / 1000
    };
  }

  /**
   * Check if all phases completed
   */
  isComplete() {
    return this.phases.every(phase => phase.status === 'completed');
  }

  /**
   * Get phase status
   */
  getPhaseStatus(key) {
    const phase = this.phases.find(p => p.key === key);
    return phase ? phase.status : null;
  }

  /**
   * Reset pipeline
   */
  reset() {
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.currentPhaseIndex = -1;
    this.startTime = null;
    this.abortController = null;
    this.companyUrl = null;
    this.techDescription = null;
    
    this.phases.forEach(phase => {
      phase.status = 'pending';
      phase.startTime = null;
      phase.endTime = null;
      phase.data = null;
      phase.error = null;
    });
  }
}

// Make available globally
window.AnalysisPipeline = AnalysisPipeline;