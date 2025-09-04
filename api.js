// API Configuration
const API_CONFIG = {
    url: 'https://api.stack-ai.com/inference/v0/run/f913a8b8-144d-47e0-b327-8daa341b575d/68a8bc5d5f2ffcec5ada4422',
    headers: {
        'Authorization': 'Bearer e80f3814-a651-4de7-a7ba-8478b7a9047b',
        'Content-Type': 'application/json'
    },
    timeout: 600000, // 10 minutes in milliseconds
    expectedDuration: 365000 // ~6 minutes based on your data
};

// Data store for current analysis
let currentAnalysis = {
    marketData: null,
    scoringData: null,
    userScore: null,
    justification: null,
    timestamp: null
};

// Progress messages for loading state
const PROGRESS_MESSAGES = [
    { time: 0, message: "Gathering market data..." },
    { time: 60, message: "Analyzing competitive landscape..." },
    { time: 120, message: "Evaluating market segments..." },
    { time: 180, message: "Calculating TAM and CAGR..." },
    { time: 240, message: "Applying scoring rubric..." },
    { time: 300, message: "Finalizing assessment..." },
    { time: 330, message: "Preparing results..." }
];

// API call with timeout and error handling
async function analyzeMarket(techDescription, competitiveAnalysis) {
    const payload = {
        "user_id": `session_${Date.now()}`,
        "in-1": techDescription,
        "in-2": competitiveAnalysis
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: API_CONFIG.headers,
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return processAPIResponse(data);
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Analysis timeout: The request took longer than 10 minutes.');
        }
        throw error;
    }
}

// Process and validate API response
function processAPIResponse(data) {
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
            throw new Error('Invalid API response structure');
        }

        // Store processed data
        currentAnalysis = {
            marketData,
            scoringData,
            userScore: null,
            justification: null,
            timestamp: new Date().toISOString(),
            rawResponse: data // Keep raw data for export
        };

        return currentAnalysis;
    } catch (error) {
        throw new Error(`Failed to process API response: ${error.message}`);
    }
}

// Format currency values
function formatCurrency(value) {
    if (value >= 1000000000) {
        return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value}`;
}

// Format percentage
function formatPercentage(value) {
    return `${value.toFixed(1)}%`;
}

// Calculate score deviation
function calculateDeviation(aiScore, userScore) {
    return Math.abs(aiScore - userScore);
}

// Export functions for PDF generation
function prepareExportData() {
    if (!currentAnalysis.marketData || !currentAnalysis.scoringData) {
        return null;
    }

    const { marketData, scoringData, userScore, justification } = currentAnalysis;
    
    return {
        summary: {
            market: marketData.primary_market.description,
            tam: formatCurrency(marketData.primary_market.tam_usd),
            cagr: formatPercentage(marketData.primary_market.cagr_percent),
            aiScore: scoringData.score,
            aiConfidence: formatPercentage(scoringData.confidence * 100),
            userScore: userScore,
            justification: justification,
            assessmentDate: new Date().toLocaleDateString()
        },
        details: {
            strengths: scoringData.justification.strengths_considered,
            limitations: scoringData.justification.limitations_considered,
            risks: scoringData.justification.key_risks,
            markets: marketData.markets.map(m => ({
                description: m.description,
                tam: formatCurrency(m.tam_current_usd),
                cagr: formatPercentage(m.cagr_percent),
                confidence: formatPercentage(m.confidence * 100)
            })),
            rubricApplication: {
                tamCategory: scoringData.rubric_application.tam_category,
                cagrCategory: scoringData.rubric_application.cagr_category,
                baseScore: scoringData.rubric_application.base_score,
                adjustment: scoringData.rubric_application.adjustment,
                rationale: scoringData.rubric_application.adjustment_rationale
            }
        },
        marketAnalysis: {
            executiveSummary: marketData.market_analysis.executive_summary,
            trends: marketData.market_analysis.trends,
            opportunities: marketData.market_analysis.opportunities,
            unmetNeeds: marketData.market_analysis.unmet_needs,
            barriers: marketData.market_analysis.barriers_to_entry,
            problemStatement: marketData.market_analysis.problem_statement,
            differentiation: marketData.market_analysis.differentiation
        }
    };
}

// Generate PDF using jsPDF
async function generatePDF() {
    const exportData = prepareExportData();
    if (!exportData) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = 280;
    
    // Helper function to add text with page break handling
    function addText(text, x = 10, fontSize = 12, isBold = false) {
        doc.setFontSize(fontSize);
        if (isBold) doc.setFont(undefined, 'bold');
        else doc.setFont(undefined, 'normal');
        
        const lines = doc.splitTextToSize(text, 190);
        lines.forEach(line => {
            if (yPosition > pageHeight) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(line, x, yPosition);
            yPosition += lineHeight;
        });
    }
    
    // Title
    addText('Market Opportunity Assessment Report', 10, 20, true);
    addText(`Date: ${exportData.summary.assessmentDate}`, 10, 10);
    yPosition += 10;
    
    // Executive Summary
    addText('EXECUTIVE SUMMARY', 10, 16, true);
    yPosition += 5;
    addText(`Market: ${exportData.summary.market}`);
    addText(`TAM: ${exportData.summary.tam}`);
    addText(`CAGR: ${exportData.summary.cagr}`);
    addText(`AI Score: ${exportData.summary.aiScore}/9 (Confidence: ${exportData.summary.aiConfidence})`);
    if (exportData.summary.userScore) {
        addText(`Assessor Score: ${exportData.summary.userScore}/9`);
        if (exportData.summary.justification) {
            addText(`Justification: ${exportData.summary.justification}`);
        }
    }
    yPosition += 10;
    
    // Market Analysis
    addText('MARKET ANALYSIS', 10, 16, true);
    yPosition += 5;
    addText(exportData.marketAnalysis.executiveSummary);
    yPosition += 5;
    
    // Problem & Differentiation
    addText('Problem Statement:', 10, 12, true);
    addText(exportData.marketAnalysis.problemStatement);
    yPosition += 5;
    addText('Differentiation:', 10, 12, true);
    addText(exportData.marketAnalysis.differentiation);
    yPosition += 10;
    
    // Strengths & Limitations
    addText('KEY STRENGTHS', 10, 16, true);
    yPosition += 5;
    exportData.details.strengths.forEach(strength => {
        addText(`• ${strength}`, 15);
    });
    yPosition += 5;
    
    addText('KEY LIMITATIONS', 10, 16, true);
    yPosition += 5;
    exportData.details.limitations.forEach(limitation => {
        addText(`• ${limitation}`, 15);
    });
    yPosition += 5;
    
    addText('KEY RISKS', 10, 16, true);
    yPosition += 5;
    exportData.details.risks.forEach(risk => {
        addText(`• ${risk}`, 15);
    });
    yPosition += 10;
    
    // Market Segments Table
    if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
    }
    addText('MARKET SEGMENTS ANALYZED', 10, 16, true);
    yPosition += 10;
    
    exportData.details.markets.forEach((market, index) => {
        if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
        }
        addText(`${index + 1}. ${market.description}`, 10, 11, true);
        addText(`   TAM: ${market.tam} | CAGR: ${market.cagr} | Confidence: ${market.confidence}`, 10, 10);
        yPosition += 5;
    });
    
    // Scoring Methodology
    yPosition += 5;
    if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
    }
    addText('SCORING METHODOLOGY', 10, 16, true);
    yPosition += 5;
    addText(`TAM Category: ${exportData.details.rubricApplication.tamCategory.replace(/_/g, ' ')}`);
    addText(`CAGR Category: ${exportData.details.rubricApplication.cagrCategory.replace(/_/g, ' ')}`);
    addText(`Base Score: ${exportData.details.rubricApplication.baseScore}`);
    addText(`Adjustment: ${exportData.details.rubricApplication.adjustment}`);
    addText(`Rationale: ${exportData.details.rubricApplication.rationale}`);
    
    // Save the PDF
    doc.save(`market_assessment_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Mock data for testing (can be toggled on/off)
const USE_MOCK_DATA = true; // Set to true for testing without API calls

function getMockData() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                marketData: {
                    markets: [
                        {
                            rank: 1,
                            description: "Voluntary carbon credit market for durable CDR",
                            tam_current_usd: 4040000000,
                            tam_current_year: 2024,
                            cagr_percent: 35.1,
                            source_url: "https://example.com",
                            confidence: 0.73
                        }
                    ],
                    primary_market: {
                        description: "Voluntary carbon credit market for durable CDR via mineralization",
                        tam_usd: 4040000000,
                        cagr_percent: 35.1,
                        selection_rationale: "Core business model aligns with market"
                    },
                    scoring_alignment: {
                        tam_category: "500M_to_5B",
                        cagr_category: "over_35",
                        suggested_score_min: 6,
                        suggested_score_max: 7,
                        strengths: ["High growth rate", "Strong alignment"],
                        limitations: ["Evolving standards", "Long sales cycles"]
                    },
                    market_analysis: {
                        executive_summary: "Strong market opportunity with rapid growth",
                        trends: ["Shift to durable removals"],
                        opportunities: ["Early mover advantage"],
                        unmet_needs: ["High-integrity MRV"],
                        barriers_to_entry: ["Certification requirements"],
                        problem_statement: "Need for durable carbon removal",
                        differentiation: "Unique mineralization approach"
                    }
                },
                scoringData: {
                    score: 6,
                    confidence: 0.7,
                    rubric_application: {
                        tam_value: 4040000000,
                        tam_category: "500M_to_5B",
                        cagr_value: 35.1,
                        cagr_category: "over_35",
                        rubric_intersection: "TAM $500M-$5B with CAGR >35%",
                        base_score: 6,
                        adjustment: 0,
                        adjustment_rationale: "No adjustment due to balanced factors"
                    },
                    justification: {
                        summary: "Strong market opportunity with some execution risks",
                        strengths_considered: ["High growth", "Market alignment"],
                        limitations_considered: ["Standards evolving", "Sales complexity"],
                        key_risks: ["Certification delays", "Market concentration"]
                    },
                    data_quality: {
                        data_recency: "2024 data",
                        data_concerns: ["Limited historical data"]
                    }
                }
            });
        }, 2000); // Simulate 2 second API call for testing
    });
}