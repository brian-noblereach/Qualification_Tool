// js/api/competitive.js - Competitive analysis API

const CompetitiveAPI = {
  config: {
    url: 'https://api.stack-ai.com/inference/v0/run/f913a8b8-144d-47e0-b327-8daa341b575d/68b9fba290798977e2d5ffe6',
    headers: {
      'Authorization': 'Bearer e80f3814-a651-4de7-a7ba-8478b7a9047b',
      'Content-Type': 'application/json'
    },
    timeout: 480000 // 8 minutes
  },

  /**
   * Analyze competitive landscape
   */
  async analyze(techDescription, abortSignal = null) {
    if (!techDescription || typeof techDescription !== 'string') {
      throw new Error('Technology description is required');
    }

    const trimmed = techDescription.trim();
    if (trimmed.length < 20) {
      throw new Error('Technology description too short');
    }

    const payload = {
      'user_id': `competitive_${Date.now()}`,
      'in-0': trimmed
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: this.config.headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Competitive API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return this.processResponse(data);

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Competitive analysis timeout or cancelled');
      }
      
      throw error;
    }
  },

  /**
   * Process API response with dual outputs
   */
  processResponse(data) {
    // Validate response structure
    const validation = Validators.validateApiResponse(data, ['out-6', 'out-7']);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Parse the structured competitive analysis (out-6)
    let analysis;
    try {
      const analysisRaw = data.outputs['out-6'];
      if (typeof analysisRaw === 'string') {
        analysis = JSON.parse(analysisRaw);
      } else {
        analysis = analysisRaw;
      }
    } catch (error) {
      console.error('Failed to parse competitive analysis:', error);
      throw new Error('Invalid competitive analysis format');
    }

    // Parse the graded assessment (out-7)
    let assessment;
    try {
      const assessmentRaw = data.outputs['out-7'];
      if (typeof assessmentRaw === 'string') {
        assessment = JSON.parse(assessmentRaw);
      } else {
        assessment = assessmentRaw;
      }
    } catch (error) {
      console.error('Failed to parse competitive assessment:', error);
      throw new Error('Invalid competitive assessment format');
    }

    // Validate assessment score
    if (!assessment.score || assessment.score < 1 || assessment.score > 9) {
      throw new Error(`Invalid competitive score: ${assessment.score}`);
    }

    // Ensure required fields
    this.ensureRequiredFields(analysis, assessment);

    // Return structured response
    return {
      analysis,
      assessment,
      analysisText: JSON.stringify(analysis), // For market analysis input
      formatted: this.formatForDisplay(analysis, assessment)
    };
  },

  /**
   * Ensure required fields exist
   */
  ensureRequiredFields(analysis, assessment) {
    // Ensure analysis structure
    if (!analysis.market_overview) analysis.market_overview = {};
    if (!analysis.competitors) analysis.competitors = [];
    if (!analysis.competitive_analysis) analysis.competitive_analysis = {};
    if (!analysis.data_quality) analysis.data_quality = {};

    // Ensure assessment structure
    if (!assessment.competitor_count) {
      assessment.competitor_count = {
        total: 0,
        large_companies: 0,
        mid_size_companies: 0,
        startups: 0
      };
    }
    if (!assessment.market_leaders) assessment.market_leaders = [];
    if (!assessment.competitive_intensity) assessment.competitive_intensity = 'unknown';
    if (!assessment.key_risk_factors) assessment.key_risk_factors = [];
    if (!assessment.differentiation_opportunities) assessment.differentiation_opportunities = [];
  },

  /**
   * Format data for display
   */
  formatForDisplay(analysis, assessment) {
    // Extract competitor details
    const competitors = (analysis.competitors || []).map(comp => ({
      name: comp.company_name || 'Unknown',
      size: comp.size_category || 'Unknown',
      product: comp.product_name || '',
      description: comp.product_description || '',
      strengths: comp.strengths || [],
      weaknesses: comp.weaknesses || [],
      revenue: comp.revenue || 'Unknown',
      funding: comp.funding_raised || 'N/A',
      position: comp.market_position || 'Unknown'
    }));

    // Build formatted response
    return {
      // Score and justification
      score: assessment.score,
      justification: assessment.score_justification || '',
      rubricMatch: assessment.rubric_match_explanation || '',
      
      // Competitor metrics
      competitorCount: assessment.competitor_count,
      totalCompetitors: assessment.competitor_count.total,
      competitors: competitors.slice(0, 10), // Top 10
      
      // Market analysis
      marketLeaders: assessment.market_leaders || [],
      competitiveIntensity: assessment.competitive_intensity,
      
      // Risk and opportunities
      keyRisks: assessment.key_risk_factors || [],
      opportunities: assessment.differentiation_opportunities || [],
      
      // Additional insights
      dominantPlayers: analysis.competitive_analysis?.dominant_players || [],
      emergingThreats: analysis.competitive_analysis?.emerging_threats || [],
      technologyTrends: analysis.competitive_analysis?.technology_trends || [],
      marketGaps: analysis.competitive_analysis?.market_gaps || [],
      
      // Data quality
      confidence: analysis.data_quality?.confidence_level || 0.7,
      dataDate: analysis.data_quality?.data_date || new Date().toISOString(),
      sources: analysis.data_quality?.sources_used || []
    };
  },

  /**
   * Get rubric description for a score
   */
  getRubricDescription(score) {
    const rubrics = {
      1: "Dominant established players AND little tech OR business differentiation",
      2: "Established players AND little tech OR business differentiation",
      3: "Established players AND some tech OR business differentiation",
      4: "Established players AND significant tech differentiation",
      5: "Established players AND significant tech AND business differentiation",
      6: "Existing players AND significant tech OR business differentiation",
      7: "Existing players AND significant tech AND business differentiation",
      8: "Few existing players AND significant tech AND business differentiation",
      9: "No existing players in the market"
    };
    
    return rubrics[score] || "Invalid score";
  }
};

// Make available globally
window.CompetitiveAPI = CompetitiveAPI;