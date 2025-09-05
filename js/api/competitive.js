// js/api/competitive.js - Competitive Analysis API

const CompetitiveAPI = {
    // API Configuration
    config: {
        url: 'https://api.stack-ai.com/inference/v0/run/f913a8b8-144d-47e0-b327-8daa341b575d/68b9fba290798977e2d5ffe6',
        headers: {
            'Authorization': 'Bearer e80f3814-a651-4de7-a7ba-8478b7a9047b',
            'Content-Type': 'application/json'
        },
        timeout: 180000, // 3 minutes (150s typical + buffer)
        expectedDuration: 150000 // 150 seconds typical
    },
    
    // Progress messages for competitive analysis
    progressMessages: [
        { time: 0, message: "Initializing competitive analysis..." },
        { time: 20, message: "Researching market competitors..." },
        { time: 40, message: "Analyzing competitive landscape..." },
        { time: 60, message: "Evaluating market positions..." },
        { time: 80, message: "Identifying differentiation opportunities..." },
        { time: 100, message: "Assessing competitive risks..." },
        { time: 120, message: "Finalizing competitive assessment..." },
        { time: 140, message: "Preparing results..." }
    ],
    
    // Main API call
    async analyze(techDescription) {
        const payload = {
            "user_id": `competitive_${Date.now()}`,
            "in-0": techDescription
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        try {
            const response = await fetch(this.config.url, {
                method: 'POST',
                headers: this.config.headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Competitive API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return this.processResponse(data);
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Competitive analysis timeout: The request took longer than 3 minutes.');
            }
            throw error;
        }
    },
    
    // Process and validate API response
    processResponse(data) {
        try {
            // Extract outputs
            const competitiveAnalysisText = data.outputs?.['out-6'];
            const gradedAnalysisRaw = data.outputs?.['out-7'];
            
            if (!competitiveAnalysisText || !gradedAnalysisRaw) {
                throw new Error('Invalid competitive API response structure');
            }
            
            // Parse the graded analysis (it's a JSON string)
            const gradedAnalysis = typeof gradedAnalysisRaw === 'string' 
                ? JSON.parse(gradedAnalysisRaw) 
                : gradedAnalysisRaw;

            // Parse the structured competitive analysis (out-6 is JSON per contract)
            const competitiveAnalysisObj = typeof competitiveAnalysisText === 'string'
                ? JSON.parse(competitiveAnalysisText)
                : competitiveAnalysisText;
            
            // Validate required fields we rely on downstream
            if (!gradedAnalysis.score || !gradedAnalysis.competitor_count) {
                throw new Error('Missing required fields in competitive analysis');
            }
            
            return {
                competitiveAnalysisText,     // original (string)
                competitiveAnalysisObj,      // parsed object (preferred)
                gradedAnalysis,
                rawResponse: data
            };
            
        } catch (error) {
            console.error('Failed to process competitive response:', error);
            throw new Error(`Failed to process competitive analysis: ${error.message}`);
        }
    },
    
    // Format the graded analysis for display
    formatForDisplay(gradedAnalysis, competitiveAnalysisText, competitiveAnalysisObj = null) {
        // Prefer parsed object; fall back by parsing the text
        let parsed = competitiveAnalysisObj;
        if (!parsed) {
            try {
                parsed = JSON.parse(competitiveAnalysisText);
            } catch (e) {
                parsed = null;
            }
        }

        // Build detailed competitors safely from structured JSON if available
        const detailedCompetitors = this.buildCompetitorsFromJson(parsed, gradedAnalysis);

        // Confidence should come from data_quality.confidence_level (not heuristic)
        const confidence = parsed?.data_quality?.confidence_level ?? null;

        // Also surface sources_used for the Sources tab
        const sourcesUsed = Array.isArray(parsed?.data_quality?.sources_used)
            ? parsed.data_quality.sources_used
            : [];

        return {
            score: gradedAnalysis.score,
            justification: gradedAnalysis.score_justification,
            competitorCount: {
                total: gradedAnalysis.competitor_count.total,
                large: gradedAnalysis.competitor_count.large_companies,
                midSize: gradedAnalysis.competitor_count.mid_size_companies,
                startups: gradedAnalysis.competitor_count.startups
            },
            marketLeaders: gradedAnalysis.market_leaders || [],
            competitiveIntensity: gradedAnalysis.competitive_intensity,
            keyRisks: gradedAnalysis.key_risk_factors || [],
            opportunities: gradedAnalysis.differentiation_opportunities || [],
            rubricMatch: gradedAnalysis.rubric_match_explanation,
            confidence,                      // <- from out-6.data_quality.confidence_level
            sourcesUsed,                     // <- list of source strings for Competitive Sources view
            detailedCompetitors,             // <- derived from structured JSON
            rawAnalysisText: competitiveAnalysisText
        };
    },

    // Build competitor objects from structured JSON (preferred path)
    buildCompetitorsFromJson(parsed, gradedAnalysis) {
        const competitors = [];

        if (parsed && Array.isArray(parsed.competitors)) {
            parsed.competitors.forEach(c => {
                const name = (c.company_name || '').trim();
                // Skip placeholders like "{something}"
                const looksLikePlaceholder = /^\{.*\}$/.test(name);
                if (!name || looksLikePlaceholder) return;

                const size = (c.size_category || 'Unknown').trim();
                const description = (c.product_description || c.product_name || '').trim();
                const products = c.product_name ? [c.product_name] : [];
                const strengths = Array.isArray(c.strengths) ? c.strengths : [];
                const weaknesses = Array.isArray(c.weaknesses) ? c.weaknesses : [];

                competitors.push({
                    name,
                    description,
                    size,
                    products,
                    strengths,
                    weaknesses,
                    url: '' // We no longer surface per-company URLs; Sources tab will use sources_used.
                });
            });
        }

        // Fallback: if nothing parsed, use market leaders from gradedAnalysis (strings only)
        if (competitors.length === 0 && gradedAnalysis?.market_leaders?.length) {
            gradedAnalysis.market_leaders.forEach(leader => {
                competitors.push({
                    name: leader,
                    description: 'Market leader in the space',
                    size: 'Large',
                    products: ['Core platform/solution'],
                    strengths: ['Market position', 'Resources', 'Brand recognition'],
                    weaknesses: ['Legacy technology', 'Slower innovation'],
                    url: ''
                });
            });
        }

        // Limit to top 10 for display
        return competitors.slice(0, 10);
    },
    
    // (Deprecated) Heuristic confidence calculator – kept for backward compatibility but unused.
    calculateConfidence(/* gradedAnalysis */) {
        // We now rely on out-6.data_quality.confidence_level provided by the API.
        return null;
    },
    
    // Get the appropriate rubric description for a score
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
        
        return rubrics[score] || "Score out of range";
    },
    
    // Retry logic for failed requests
    async retryAnalysis(techDescription, attempt = 1) {
        const maxAttempts = 3;
        
        try {
            return await this.analyze(techDescription);
        } catch (error) {
            if (attempt >= maxAttempts) {
                throw error;
            }
            
            // Wait before retrying (exponential backoff)
            const waitTime = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            console.log(`Retrying competitive analysis (attempt ${attempt + 1}/${maxAttempts})`);
            return this.retryAnalysis(techDescription, attempt + 1);
        }
    }
};
