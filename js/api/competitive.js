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
            
            // Validate required fields
            if (!gradedAnalysis.score || !gradedAnalysis.competitor_count) {
                throw new Error('Missing required fields in competitive analysis');
            }
            
            return {
                competitiveAnalysisText, // This will be used as input for market analysis
                gradedAnalysis,
                rawResponse: data
            };
            
        } catch (error) {
            console.error('Failed to process competitive response:', error);
            throw new Error(`Failed to process competitive analysis: ${error.message}`);
        }
    },
    
    // Format the graded analysis for display
    formatForDisplay(gradedAnalysis, competitiveAnalysisText) {
        // Extract detailed competitor info from the competitive analysis text
        const detailedCompetitors = this.extractDetailedCompetitors(competitiveAnalysisText);
        
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
            confidence: this.calculateConfidence(gradedAnalysis),
            detailedCompetitors: detailedCompetitors,
            rawAnalysisText: competitiveAnalysisText
        };
    },
    
    // Extract detailed competitor information from analysis text
    extractDetailedCompetitors(analysisText) {
        if (!analysisText) return [];
        
        // Parse the competitive analysis to extract competitor details
        // This is a simplified extraction - in production you'd want more robust parsing
        const competitors = [];
        
        try {
            // Look for competitor sections in the text
            const lines = analysisText.split('\n');
            let currentCompetitor = null;
            
            lines.forEach(line => {
                // Check for company name patterns
                if (line.includes('company_name":') || line.includes('Company:')) {
                    const name = line.split(':')[1]?.trim().replace(/[",]/g, '');
                    if (name) {
                        currentCompetitor = { 
                            name, 
                            description: '', 
                            size: 'Unknown',
                            products: [],
                            strengths: [],
                            weaknesses: [],
                            url: ''
                        };
                        competitors.push(currentCompetitor);
                    }
                } else if (currentCompetitor) {
                    // Extract other details
                    if (line.includes('size_category":') || line.includes('Size:')) {
                        currentCompetitor.size = line.split(':')[1]?.trim().replace(/[",]/g, '');
                    } else if (line.includes('product_description":') || line.includes('Description:')) {
                        currentCompetitor.description = line.split(':')[1]?.trim().replace(/[",]/g, '');
                    } else if (line.includes('strengths":')) {
                        currentCompetitor.strengths.push(line.split(':')[1]?.trim().replace(/[",\[\]]/g, ''));
                    } else if (line.includes('weaknesses":')) {
                        currentCompetitor.weaknesses.push(line.split(':')[1]?.trim().replace(/[",\[\]]/g, ''));
                    }
                }
            });
            
            // If parsing fails or returns nothing, create sample data from market leaders
            if (competitors.length === 0 && gradedAnalysis.market_leaders) {
                gradedAnalysis.market_leaders.forEach(leader => {
                    competitors.push({
                        name: leader,
                        description: 'Market leader in the space',
                        size: 'Large',
                        products: ['Core platform/solution'],
                        strengths: ['Market position', 'Resources', 'Brand recognition'],
                        weaknesses: ['Legacy technology', 'Slower innovation'],
                        url: `https://www.google.com/search?q=${encodeURIComponent(leader)}`
                    });
                });
            }
            
        } catch (error) {
            console.error('Error extracting competitor details:', error);
        }
        
        return competitors.slice(0, 10); // Limit to top 10 for display
    },
    
    // Calculate confidence score based on data quality
    calculateConfidence(gradedAnalysis) {
        // Basic confidence calculation based on completeness of data
        let confidence = 0.5; // Base confidence
        
        // Add confidence based on data completeness
        if (gradedAnalysis.competitor_count?.total > 0) confidence += 0.1;
        if (gradedAnalysis.market_leaders?.length > 0) confidence += 0.1;
        if (gradedAnalysis.key_risk_factors?.length > 0) confidence += 0.1;
        if (gradedAnalysis.differentiation_opportunities?.length > 0) confidence += 0.1;
        if (gradedAnalysis.competitive_intensity) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
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