// js/api/market.js - Market Opportunity API

const MarketAPI = {
    // API Configuration
    config: {
        url: 'https://api.stack-ai.com/inference/v0/run/f913a8b8-144d-47e0-b327-8daa341b575d/68a8bc5d5f2ffcec5ada4422',
        headers: {
            'Authorization': 'Bearer e80f3814-a651-4de7-a7ba-8478b7a9047b',
            'Content-Type': 'application/json'
        },
        timeout: 600000, // 10 minutes
        expectedDuration: 365000 // ~6 minutes typical
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
    
    // Main API call
    async analyze(techDescription, competitiveAnalysis) {
        const payload = {
            "user_id": `market_${Date.now()}`,
            "in-1": techDescription,
            "in-2": competitiveAnalysis
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
                throw new Error(`Market API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return this.processResponse(data);
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Market analysis timeout: The request took longer than 10 minutes.');
            }
            throw error;
        }
    },
    
    // Process and validate API response
    processResponse(data) {
        try {
            // Parse the nested JSON strings
            const marketData = typeof data.outputs['out-2'] === 'string' 
                ? JSON.parse(data.outputs['out-2']) 
                : data.outputs['out-2'];
                
            const scoringData = typeof data.outputs['out-3'] === 'string'
                ? JSON.parse(data.outputs['out-3'])
                : data.outputs['out-3'];
            
            // Validate required fields
            if (!marketData || !marketData.primary_market || !scoringData || !scoringData.score) {
                throw new Error('Invalid market API response structure');
            }
            
            return {
                marketData,
                scoringData,
                rawResponse: data
            };
            
        } catch (error) {
            console.error('Failed to process market response:', error);
            throw new Error(`Failed to process market analysis: ${error.message}`);
        }
    },
    
    // Format the market data for display
    formatForDisplay(marketData, scoringData) {
        return {
            score: scoringData.score,
            confidence: scoringData.confidence || 0.7,
            primaryMarket: {
                description: marketData.primary_market.description,
                tam: marketData.primary_market.tam_usd,
                cagr: marketData.primary_market.cagr_percent,
                rationale: marketData.primary_market.selection_rationale
            },
            justification: {
                summary: scoringData.justification.summary,
                strengths: scoringData.justification.strengths_considered || [],
                limitations: scoringData.justification.limitations_considered || [],
                risks: scoringData.justification.key_risks || []
            },
            rubricApplication: {
                tamValue: scoringData.rubric_application.tam_value,
                tamCategory: scoringData.rubric_application.tam_category,
                cagrValue: scoringData.rubric_application.cagr_value,
                cagrCategory: scoringData.rubric_application.cagr_category,
                intersection: scoringData.rubric_application.rubric_intersection,
                baseScore: scoringData.rubric_application.base_score,
                adjustment: scoringData.rubric_application.adjustment,
                adjustmentRationale: scoringData.rubric_application.adjustment_rationale
            },
            marketAnalysis: {
                executiveSummary: marketData.market_analysis.executive_summary,
                trends: marketData.market_analysis.trends || [],
                opportunities: marketData.market_analysis.opportunities || [],
                unmetNeeds: marketData.market_analysis.unmet_needs || [],
                barriers: marketData.market_analysis.barriers_to_entry || [],
                problemStatement: marketData.market_analysis.problem_statement,
                differentiation: marketData.market_analysis.differentiation
            },
            markets: marketData.markets || [],
            scoringAlignment: {
                tamCategory: marketData.scoring_alignment.tam_category,
                cagrCategory: marketData.scoring_alignment.cagr_category,
                suggestedMin: marketData.scoring_alignment.suggested_score_min,
                suggestedMax: marketData.scoring_alignment.suggested_score_max,
                strengths: marketData.scoring_alignment.strengths || [],
                limitations: marketData.scoring_alignment.limitations || []
            },
            dataQuality: {
                recency: scoringData.data_quality?.data_recency || 'Unknown',
                concerns: scoringData.data_quality?.data_concerns || []
            }
        };
    },
    
    // Get the appropriate rubric description for a score
    getRubricDescription(score) {
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
        
        return rubrics[score] || "Score out of range";
    },
    
    // Get simplified rubric category
    getRubricCategory(score) {
        if (score <= 3) {
            return { 
                label: "Weak Market", 
                description: "Limited market size and/or growth",
                color: "var(--danger)"
            };
        } else if (score <= 5) {
            return { 
                label: "Moderate Market", 
                description: "Moderate market size or growth",
                color: "var(--warning)"
            };
        } else if (score <= 7) {
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
    
    // Retry logic for failed requests
    async retryAnalysis(techDescription, competitiveAnalysis, attempt = 1) {
        const maxAttempts = 3;
        
        try {
            return await this.analyze(techDescription, competitiveAnalysis);
        } catch (error) {
            if (attempt >= maxAttempts) {
                throw error;
            }
            
            // Wait before retrying (exponential backoff)
            const waitTime = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            console.log(`Retrying market analysis (attempt ${attempt + 1}/${maxAttempts})`);
            return this.retryAnalysis(techDescription, competitiveAnalysis, attempt + 1);
        }
    }
};