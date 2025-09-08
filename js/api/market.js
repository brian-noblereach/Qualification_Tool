// js/api/market.js - Market Opportunity API with Enhanced Error Handling

const MarketAPI = {
    // API Configuration
    config: {
        url: 'https://api.stack-ai.com/inference/v0/run/f913a8b8-144d-47e0-b327-8daa341b575d/68a8bc5d5f2ffcec5ada4422',
        headers: {
            'Authorization': 'Bearer e80f3814-a651-4de7-a7ba-8478b7a9047b',
            'Content-Type': 'application/json'
        },
        timeout: 600000, // 10 minutes
        expectedDuration: 365000, // ~6 minutes typical
        maxRetries: 3,
        retryDelay: 3000 // Base delay for exponential backoff
    },
    
    // Progress messages for market analysis
    progressMessages: [
        { time: 0, message: "Starting market opportunity analysis..." },
        { time: 60, message: "Analyzing market segments..." },
        { time: 120, message: "Calculating TAM and CAGR..." },
        { time: 180, message: "Evaluating growth trajectories..." },
        { time: 240, message: "Identifying market trends..." },
        { time: 300, message: "Applying scoring rubric..." },
        { time: 330, message: "Finalizing market assessment..." },
        { time: 350, message: "Preparing results..." }
    ],
    
    // Main API call with comprehensive error handling
    async analyze(techDescription, competitiveAnalysis) {
        // Validate inputs
        if (!techDescription || typeof techDescription !== 'string' || !techDescription.trim()) {
            throw new Error('Invalid technology description provided for market analysis');
        }
        
        if (!competitiveAnalysis) {
            throw new Error('Competitive analysis is required for market analysis');
        }
        
        // Ensure competitive analysis is a string
        const competitiveStr = typeof competitiveAnalysis === 'object' 
            ? JSON.stringify(competitiveAnalysis) 
            : String(competitiveAnalysis);
        
        const payload = {
            "user_id": `market_${Date.now()}`,
            "in-1": techDescription.trim(),
            "in-2": competitiveStr
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
                throw new Error(`Market API error: ${response.status} ${response.statusText}. ${errorDetails}`);
            }
            
            const data = await response.json();
            return this.processResponse(data);
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Market analysis timeout: The request took longer than 10 minutes.');
            }
            
            // Network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to the market analysis service. Please check your connection.');
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
                throw new Error('Invalid response format from market API');
            }
            
            if (!data.outputs || typeof data.outputs !== 'object') {
                throw new Error('Missing outputs in market API response');
            }
            
            // Parse the nested JSON strings with error handling
            let marketData, scoringData;
            
            try {
                marketData = typeof data.outputs['out-2'] === 'string' 
                    ? JSON.parse(data.outputs['out-2']) 
                    : data.outputs['out-2'];
            } catch (parseError) {
                throw new Error(`Failed to parse market data: ${parseError.message}`);
            }
            
            try {
                scoringData = typeof data.outputs['out-3'] === 'string'
                    ? JSON.parse(data.outputs['out-3'])
                    : data.outputs['out-3'];
            } catch (parseError) {
                throw new Error(`Failed to parse scoring data: ${parseError.message}`);
            }
            
            // Validate required fields
            this.validateMarketData(marketData);
            this.validateScoringData(scoringData);
            
            // Format the data for consistent structure
            const formattedData = this.formatForDisplay(marketData, scoringData);
            
            return {
                formatted: formattedData,  // Standardized formatted data
                rawData: {                 // Raw data for reference
                    marketData,
                    scoringData,
                    originalResponse: data
                }
            };
            
        } catch (error) {
            console.error('Failed to process market response:', error);
            throw new Error(`Failed to process market analysis: ${error.message}`);
        }
    },
    
    // Validate market data structure
    validateMarketData(marketData) {
        if (!marketData || typeof marketData !== 'object') {
            throw new Error('Invalid market data structure');
        }
        
        if (!marketData.primary_market || typeof marketData.primary_market !== 'object') {
            throw new Error('Missing primary market information');
        }
        
        // Validate primary market fields
        const primaryMarket = marketData.primary_market;
        
        if (!primaryMarket.description) {
            primaryMarket.description = 'Market description not available';
        }
        
        // Validate TAM
        if (primaryMarket.tam_usd === undefined || primaryMarket.tam_usd === null) {
            console.warn('TAM value missing, setting to 0');
            primaryMarket.tam_usd = 0;
        }
        
        // Validate CAGR
        if (primaryMarket.cagr_percent === undefined || primaryMarket.cagr_percent === null) {
            console.warn('CAGR value missing, setting to 0');
            primaryMarket.cagr_percent = 0;
        }
        
        // Set defaults for missing optional fields
        marketData.markets = marketData.markets || [];
        marketData.market_analysis = marketData.market_analysis || {};
        marketData.scoring_alignment = marketData.scoring_alignment || {};
    },
    
    // Validate scoring data structure
    validateScoringData(scoringData) {
        if (!scoringData || typeof scoringData !== 'object') {
            throw new Error('Invalid scoring data structure');
        }
        
        // Validate score
        if (scoringData.score === undefined || scoringData.score === null) {
            throw new Error('Missing score in market analysis');
        }
        
        const score = parseInt(scoringData.score);
        if (isNaN(score) || score < 1 || score > 9) {
            throw new Error(`Invalid market score: ${scoringData.score}. Score must be between 1 and 9.`);
        }
        
        // Set defaults for missing fields
        scoringData.confidence = scoringData.confidence !== undefined ? scoringData.confidence : 0.7;
        scoringData.justification = scoringData.justification || {};
        scoringData.rubric_application = scoringData.rubric_application || {};
        scoringData.data_quality = scoringData.data_quality || {};
    },
    
    // Format the market data for display with enhanced error handling
    formatForDisplay(marketData, scoringData) {
        // Validate confidence value
        let confidence = scoringData.confidence;
        if (typeof confidence === 'number' && (confidence < 0 || confidence > 1)) {
            console.warn(`Invalid confidence value: ${confidence}, using default`);
            confidence = 0.7;
        } else if (confidence === null || confidence === undefined) {
            confidence = 0.7;
        }
        
        return {
            score: parseInt(scoringData.score),
            confidence,
            primaryMarket: {
                description: marketData.primary_market?.description || 'Not available',
                tam: this.validateNumber(marketData.primary_market?.tam_usd, 0),
                cagr: this.validateNumber(marketData.primary_market?.cagr_percent, 0),
                rationale: marketData.primary_market?.selection_rationale || ''
            },
            justification: {
                summary: scoringData.justification?.summary || 'No summary available',
                strengths: this.validateStringArray(scoringData.justification?.strengths_considered, 'strengths'),
                limitations: this.validateStringArray(scoringData.justification?.limitations_considered, 'limitations'),
                risks: this.validateStringArray(scoringData.justification?.key_risks, 'risks')
            },
            rubricApplication: this.formatRubricApplication(scoringData.rubric_application),
            marketAnalysis: this.formatMarketAnalysis(marketData.market_analysis),
            markets: this.formatMarkets(marketData.markets),
            scoringAlignment: this.formatScoringAlignment(marketData.scoring_alignment),
            dataQuality: {
                recency: scoringData.data_quality?.data_recency || 'Unknown',
                concerns: this.validateStringArray(scoringData.data_quality?.data_concerns, 'concerns')
            }
        };
    },
    
    // Format rubric application with defaults
    formatRubricApplication(rubricApp) {
        if (!rubricApp || typeof rubricApp !== 'object') {
            return {
                tamValue: 0,
                tamCategory: 'Unknown',
                cagrValue: 0,
                cagrCategory: 'Unknown',
                intersection: 'Unknown',
                baseScore: 5,
                adjustment: 0,
                adjustmentRationale: 'No adjustment rationale available'
            };
        }
        
        return {
            tamValue: this.validateNumber(rubricApp.tam_value, 0),
            tamCategory: rubricApp.tam_category || 'Unknown',
            cagrValue: this.validateNumber(rubricApp.cagr_value, 0),
            cagrCategory: rubricApp.cagr_category || 'Unknown',
            intersection: rubricApp.rubric_intersection || 'Unknown',
            baseScore: this.validateNumber(rubricApp.base_score, 5),
            adjustment: this.validateNumber(rubricApp.adjustment, 0),
            adjustmentRationale: rubricApp.adjustment_rationale || 'No adjustment rationale available'
        };
    },
    
    // Format market analysis with validation
    formatMarketAnalysis(analysis) {
        if (!analysis || typeof analysis !== 'object') {
            return {
                executiveSummary: '',
                trends: [],
                opportunities: [],
                unmetNeeds: [],
                barriers: [],
                problemStatement: '',
                differentiation: ''
            };
        }
        
        return {
            executiveSummary: analysis.executive_summary || '',
            trends: this.validateStringArray(analysis.trends, 'trends'),
            opportunities: this.validateStringArray(analysis.opportunities, 'opportunities'),
            unmetNeeds: this.validateStringArray(analysis.unmet_needs, 'unmet needs'),
            barriers: this.validateStringArray(analysis.barriers_to_entry, 'barriers'),
            problemStatement: analysis.problem_statement || '',
            differentiation: analysis.differentiation || ''
        };
    },
    
    // Format markets array with validation
    formatMarkets(markets) {
        if (!Array.isArray(markets)) {
            return [];
        }
        
        return markets.map((market, index) => {
            if (!market || typeof market !== 'object') {
                console.warn(`Invalid market at index ${index}`);
                return null;
            }
            
            return {
                description: market.description || 'Unknown market',
                tam_current_usd: this.validateNumber(market.tam_current_usd, 0),
                cagr_percent: this.validateNumber(market.cagr_percent, 0),
                source_url: this.validateUrl(market.source_url)
            };
        }).filter(market => market !== null);
    },
    
    // Format scoring alignment with defaults
    formatScoringAlignment(alignment) {
        if (!alignment || typeof alignment !== 'object') {
            return {
                tamCategory: 'Unknown',
                cagrCategory: 'Unknown',
                suggestedMin: 1,
                suggestedMax: 9,
                strengths: [],
                limitations: []
            };
        }
        
        return {
            tamCategory: alignment.tam_category || 'Unknown',
            cagrCategory: alignment.cagr_category || 'Unknown',
            suggestedMin: this.validateNumber(alignment.suggested_score_min, 1, 1, 9),
            suggestedMax: this.validateNumber(alignment.suggested_score_max, 9, 1, 9),
            strengths: this.validateStringArray(alignment.strengths, 'strengths'),
            limitations: this.validateStringArray(alignment.limitations, 'limitations')
        };
    },
    
    // Validate number with min/max bounds
    validateNumber(value, defaultValue = 0, min = null, max = null) {
        if (value === null || value === undefined) {
            return defaultValue;
        }
        
        const num = parseFloat(value);
        if (isNaN(num)) {
            return defaultValue;
        }
        
        let result = num;
        if (min !== null && result < min) result = min;
        if (max !== null && result > max) result = max;
        
        return result;
    },
    
    // Validate string array
    validateStringArray(arr, type = 'items') {
        if (!Array.isArray(arr)) {
            console.debug(`Expected array for ${type}, got ${typeof arr}`);
            return [];
        }
        
        return arr.filter(item => item && typeof item === 'string' && item.trim().length > 0);
    },
    
    // Validate URL
    validateUrl(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }
        
        const trimmed = url.trim();
        if (!trimmed) return null;
        
        // Basic URL validation
        try {
            new URL(trimmed);
            return trimmed;
        } catch {
            // Try adding https://
            try {
                new URL('https://' + trimmed);
                return 'https://' + trimmed;
            } catch {
                return null;
            }
        }
    },
    
    // Get the appropriate rubric description for a score
    getRubricDescription(score) {
        const scoreNum = parseInt(score);
        
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 9) {
            return "Invalid score";
        }
        
        const rubrics = {
            1: "TAM is <$500M and CAGR is less than 10%",
            2: "TAM is <$500M and CAGR is between 10 and 35%",
            3: "TAM is <$500M and CAGR is greater than 35%",
            4: "TAM is between $500M and $5B and CAGR is less than 10%",
            5: "TAM is between $500M and $5B and CAGR is between 10 and 35%",
            6: "TAM is between $500M and $5B and CAGR is greater than 35%",
            7: "TAM is >$5B and CAGR is less than 10%",
            8: "TAM is >$5B and CAGR is between 10 and 35%",
            9: "TAM is >$5B and CAGR is greater than 35%"
        };
        
        return rubrics[scoreNum];
    },
    
    // Get simplified rubric category
    getRubricCategory(score) {
        const scoreNum = parseInt(score);
        
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 9) {
            return { 
                label: "Invalid", 
                description: "Invalid score",
                color: "var(--gray-500)"
            };
        }
        
        if (scoreNum <= 3) {
            return { 
                label: "Weak Market", 
                description: "Limited market size and/or growth",
                color: "var(--danger)"
            };
        } else if (scoreNum <= 5) {
            return { 
                label: "Moderate Market", 
                description: "Moderate market size or growth",
                color: "var(--warning)"
            };
        } else if (scoreNum <= 7) {
            return { 
                label: "Good Market", 
                description: "Strong market size or growth",
                color: "var(--primary)"
            };
        } else {
            return { 
                label: "Exceptional Market", 
                description: "Large market with high growth",
                color: "var(--success)"
            };
        }
    },
    
    // Enhanced retry logic with exponential backoff
    async retryAnalysis(techDescription, competitiveAnalysis, attempt = 1) {
        try {
            return await this.analyze(techDescription, competitiveAnalysis);
        } catch (error) {
            console.error(`Market analysis attempt ${attempt} failed:`, error);
            
            // Don't retry for client errors (400-499)
            if (error.message.includes('4') && error.message.includes('API error')) {
                throw error;
            }
            
            if (attempt >= this.config.maxRetries) {
                throw new Error(`Market analysis failed after ${this.config.maxRetries} attempts: ${error.message}`);
            }
            
            // Calculate delay with exponential backoff and jitter
            const baseDelay = this.config.retryDelay;
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
            
            console.log(`Retrying market analysis in ${Math.round(delay / 1000)} seconds (attempt ${attempt + 1}/${this.config.maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.retryAnalysis(techDescription, competitiveAnalysis, attempt + 1);
        }
    }
};