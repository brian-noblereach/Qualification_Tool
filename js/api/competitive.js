// js/api/competitive.js - Competitive Analysis API with Enhanced Error Handling

const CompetitiveAPI = {
    // API Configuration
    config: {
        url: 'https://api.stack-ai.com/inference/v0/run/f913a8b8-144d-47e0-b327-8daa341b575d/68b9fba290798977e2d5ffe6',
        headers: {
            'Authorization': 'Bearer e80f3814-a651-4de7-a7ba-8478b7a9047b',
            'Content-Type': 'application/json'
        },
        timeout: 180000, // 3 minutes (150s typical + buffer)
        expectedDuration: 150000, // 150 seconds typical
        maxRetries: 3,
        retryDelay: 2000 // Base delay for exponential backoff
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
    
    // Main API call with comprehensive error handling
    async analyze(techDescription) {
        // Validate input
        if (!techDescription || typeof techDescription !== 'string' || !techDescription.trim()) {
            throw new Error('Invalid technology description provided');
        }
        
        const payload = {
            "user_id": `competitive_${Date.now()}`,
            "in-0": techDescription.trim()
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
                const errorDetails = await this.extractErrorDetails(response);
                throw new Error(`Competitive API error: ${response.status} ${response.statusText}. ${errorDetails}`);
            }
            
            const data = await response.json();
            return this.processResponse(data);
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Competitive analysis timeout: The request took longer than 3 minutes.');
            }
            
            // Network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to the analysis service. Please check your connection.');
            }
            
            throw error;
        }
    },
    
    // Extract error details from response
    async extractErrorDetails(response) {
        try {
            const errorData = await response.json();
            return errorData.message || errorData.error || '';
        } catch {
            return '';
        }
    },
    
    // Process and validate API response with comprehensive checks
    processResponse(data) {
        try {
            // Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format from API');
            }
            
            if (!data.outputs || typeof data.outputs !== 'object') {
                throw new Error('Missing outputs in API response');
            }
            
            // Extract outputs
            const competitiveAnalysisText = data.outputs?.['out-6'];
            const gradedAnalysisRaw = data.outputs?.['out-7'];
            
            if (!competitiveAnalysisText || !gradedAnalysisRaw) {
                throw new Error('Missing required output fields in competitive API response');
            }
            
            // Parse the graded analysis (it's a JSON string)
            let gradedAnalysis;
            try {
                gradedAnalysis = typeof gradedAnalysisRaw === 'string' 
                    ? JSON.parse(gradedAnalysisRaw) 
                    : gradedAnalysisRaw;
            } catch (parseError) {
                throw new Error(`Failed to parse graded analysis: ${parseError.message}`);
            }

            // Parse the structured competitive analysis
            let competitiveAnalysisObj;
            try {
                competitiveAnalysisObj = typeof competitiveAnalysisText === 'string'
                    ? JSON.parse(competitiveAnalysisText)
                    : competitiveAnalysisText;
            } catch (parseError) {
                // If parsing fails, create a minimal object
                console.warn('Failed to parse competitive analysis as JSON, using fallback');
                competitiveAnalysisObj = null;
            }
            
            // Validate required fields in graded analysis
            this.validateGradedAnalysis(gradedAnalysis);
            
            // Format the data for consistent structure
            const formattedData = this.formatForDisplay(
                gradedAnalysis,
                competitiveAnalysisText,
                competitiveAnalysisObj
            );
            
            return {
                formatted: formattedData,          // Standardized formatted data
                competitiveAnalysisText,           // Original text (for market analysis)
                rawData: {                         // Raw data for reference
                    gradedAnalysis,
                    competitiveAnalysisObj,
                    originalResponse: data
                }
            };
            
        } catch (error) {
            console.error('Failed to process competitive response:', error);
            throw new Error(`Failed to process competitive analysis: ${error.message}`);
        }
    },
    
    // Validate graded analysis structure
    validateGradedAnalysis(gradedAnalysis) {
        if (!gradedAnalysis || typeof gradedAnalysis !== 'object') {
            throw new Error('Invalid graded analysis structure');
        }
        
        // Check required fields
        const requiredFields = ['score', 'competitor_count'];
        const missingFields = requiredFields.filter(field => 
            gradedAnalysis[field] === undefined || gradedAnalysis[field] === null
        );
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields in competitive analysis: ${missingFields.join(', ')}`);
        }
        
        // Validate score range
        const score = parseInt(gradedAnalysis.score);
        if (isNaN(score) || score < 1 || score > 9) {
            throw new Error(`Invalid competitive score: ${gradedAnalysis.score}. Score must be between 1 and 9.`);
        }
        
        // Validate competitor count structure
        if (!gradedAnalysis.competitor_count || typeof gradedAnalysis.competitor_count !== 'object') {
            throw new Error('Invalid competitor count structure');
        }
        
        // Set defaults for missing optional fields
        gradedAnalysis.score_justification = gradedAnalysis.score_justification || 'No justification provided';
        gradedAnalysis.market_leaders = gradedAnalysis.market_leaders || [];
        gradedAnalysis.competitive_intensity = gradedAnalysis.competitive_intensity || 'unknown';
        gradedAnalysis.key_risk_factors = gradedAnalysis.key_risk_factors || [];
        gradedAnalysis.differentiation_opportunities = gradedAnalysis.differentiation_opportunities || [];
        gradedAnalysis.rubric_match_explanation = gradedAnalysis.rubric_match_explanation || '';
    },
    
    // Format the graded analysis for display with enhanced error handling
    formatForDisplay(gradedAnalysis, competitiveAnalysisText, competitiveAnalysisObj = null) {
        // Ensure we have valid input
        if (!gradedAnalysis) {
            throw new Error('Cannot format null graded analysis');
        }
        
        // Build detailed competitors safely from structured JSON if available
        const detailedCompetitors = this.buildCompetitorsFromJson(competitiveAnalysisObj, gradedAnalysis);

        // Extract confidence from structured data with fallback
        let confidence = null;
        if (competitiveAnalysisObj?.data_quality?.confidence_level !== undefined) {
            confidence = competitiveAnalysisObj.data_quality.confidence_level;
            
            // Validate confidence range
            if (typeof confidence === 'number' && (confidence < 0 || confidence > 1)) {
                console.warn(`Invalid confidence level: ${confidence}, setting to null`);
                confidence = null;
            }
        }

        // Extract sources with validation
        const sourcesUsed = this.extractSources(competitiveAnalysisObj);

        // Format competitor count with defaults
        const competitorCount = {
            total: parseInt(gradedAnalysis.competitor_count?.total) || 0,
            large: parseInt(gradedAnalysis.competitor_count?.large_companies) || 0,
            midSize: parseInt(gradedAnalysis.competitor_count?.mid_size_companies) || 0,
            startups: parseInt(gradedAnalysis.competitor_count?.startups) || 0
        };
        
        // Ensure total is at least the sum of categories
        const calculatedTotal = competitorCount.large + competitorCount.midSize + competitorCount.startups;
        if (competitorCount.total < calculatedTotal) {
            competitorCount.total = calculatedTotal;
        }

        return {
            score: parseInt(gradedAnalysis.score),
            justification: gradedAnalysis.score_justification || 'No justification provided',
            competitorCount,
            marketLeaders: this.validateMarketLeaders(gradedAnalysis.market_leaders),
            competitiveIntensity: gradedAnalysis.competitive_intensity || 'unknown',
            keyRisks: this.validateStringArray(gradedAnalysis.key_risk_factors, 'risks'),
            opportunities: this.validateStringArray(gradedAnalysis.differentiation_opportunities, 'opportunities'),
            rubricMatch: gradedAnalysis.rubric_match_explanation || '',
            confidence,
            sourcesUsed,
            detailedCompetitors,
            rawAnalysisText: competitiveAnalysisText
        };
    },

    // Extract sources from structured data
    extractSources(competitiveAnalysisObj) {
        if (!competitiveAnalysisObj?.data_quality?.sources_used) {
            return [];
        }
        
        const sources = competitiveAnalysisObj.data_quality.sources_used;
        
        if (!Array.isArray(sources)) {
            console.warn('sources_used is not an array');
            return [];
        }
        
        // Filter and validate sources
        return sources.filter(source => 
            source && typeof source === 'string' && source.trim().length > 0
        );
    },

    // Validate market leaders array
    validateMarketLeaders(leaders) {
        if (!Array.isArray(leaders)) {
            return [];
        }
        
        return leaders.filter(leader => {
            if (!leader || typeof leader !== 'string') return false;
            
            const trimmed = leader.trim();
            // Filter out placeholder values
            return trimmed.length > 0 && !trimmed.match(/^\{.*\}$/);
        });
    },

    // Validate string array with type for better error messages
    validateStringArray(arr, type = 'items') {
        if (!Array.isArray(arr)) {
            console.warn(`Expected array for ${type}, got ${typeof arr}`);
            return [];
        }
        
        return arr.filter(item => item && typeof item === 'string' && item.trim().length > 0);
    },

    // Build competitor objects from structured JSON with enhanced validation
    buildCompetitorsFromJson(parsed, gradedAnalysis) {
        const competitors = [];

        if (parsed && Array.isArray(parsed.competitors)) {
            parsed.competitors.forEach((c, index) => {
                try {
                    // Validate competitor object
                    if (!c || typeof c !== 'object') {
                        console.warn(`Invalid competitor at index ${index}`);
                        return;
                    }
                    
                    const name = (c.company_name || '').trim();
                    
                    // Skip invalid entries
                    if (!name || name.match(/^\{.*\}$/)) {
                        return;
                    }

                    // Extract and validate fields with defaults
                    const competitor = {
                        name,
                        description: (c.product_description || c.product_name || 'No description available').trim(),
                        size: this.normalizeSize(c.size_category),
                        products: this.extractProducts(c),
                        strengths: this.validateStringArray(c.strengths, 'strengths'),
                        weaknesses: this.validateStringArray(c.weaknesses, 'weaknesses'),
                        marketPosition: c.market_position || 'Unknown',
                        url: '' // URLs no longer surfaced per company
                    };
                    
                    competitors.push(competitor);
                } catch (error) {
                    console.warn(`Error processing competitor at index ${index}:`, error);
                }
            });
        }

        // Fallback: use market leaders if no structured competitors
        if (competitors.length === 0 && Array.isArray(gradedAnalysis?.market_leaders)) {
            const validLeaders = this.validateMarketLeaders(gradedAnalysis.market_leaders);
            
            validLeaders.forEach(leader => {
                competitors.push({
                    name: leader,
                    description: 'Market leader in the space',
                    size: 'Large',
                    products: ['Core platform/solution'],
                    strengths: ['Market position', 'Resources', 'Brand recognition'],
                    weaknesses: ['Legacy technology', 'Slower innovation'],
                    marketPosition: 'Leader',
                    url: ''
                });
            });
        }

        // Limit to top 10 for display
        return competitors.slice(0, 10);
    },

    // Normalize size category
    normalizeSize(size) {
        if (!size) return 'Unknown';
        
        const sizeStr = String(size).toLowerCase().trim();
        const sizeMap = {
            'large': 'Large',
            'large_companies': 'Large',
            'mid-size': 'Mid-size',
            'mid_size': 'Mid-size',
            'midsize': 'Mid-size',
            'mid_size_companies': 'Mid-size',
            'startup': 'Startup',
            'startups': 'Startup',
            'small': 'Startup'
        };
        
        return sizeMap[sizeStr] || 'Unknown';
    },

	// Extract products from competitor data
	extractProducts(item) {
	  try {
		// Works whether 'item' is a competitor object or a looser shape
		const products = [];

		// Common shapes we’ve seen coming back:
		if (Array.isArray(item?.products)) products.push(...item.products);
		if (typeof item?.product_name === "string") products.push(item.product_name);

		// Extra fallbacks (optional)
		if (typeof item?.product === "string") products.push(item.product);
		if (typeof item?.product_description === "string" && !products.length) {
		  // very conservative extraction—only push if short-ish and single token
		  const maybe = item.product_description.trim();
		  if (maybe && maybe.length < 80 && !maybe.includes("\n")) products.push(maybe);
		}

		const unique = [...new Set(products.map(p => String(p).trim()))].filter(Boolean);
		return unique.slice(0, 5);
	  } catch (e) {
		console.warn("extractProducts failed", e);
		return [];
	  }
	},


    
    // Get the appropriate rubric description for a score
    getRubricDescription(score) {
        const scoreNum = parseInt(score);
        
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 9) {
            return "Invalid score";
        }
        
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
        
        return rubrics[scoreNum];
    },
    
    // Enhanced retry logic with exponential backoff
    async retryAnalysis(techDescription, attempt = 1) {
        try {
            return await this.analyze(techDescription);
        } catch (error) {
            console.error(`Competitive analysis attempt ${attempt} failed:`, error);
            
            // Don't retry for client errors (400-499)
            if (error.message.includes('4') && error.message.includes('API error')) {
                throw error;
            }
            
            if (attempt >= this.config.maxRetries) {
                throw new Error(`Competitive analysis failed after ${this.config.maxRetries} attempts: ${error.message}`);
            }
            
            // Calculate delay with exponential backoff and jitter
            const baseDelay = this.config.retryDelay;
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
            
            console.log(`Retrying competitive analysis in ${Math.round(delay / 1000)} seconds (attempt ${attempt + 1}/${this.config.maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.retryAnalysis(techDescription, attempt + 1);
        }
    }
};