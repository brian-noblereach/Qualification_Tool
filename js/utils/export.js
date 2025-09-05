// js/utils/export.js - PDF Export Utility

const ExportUtility = {
    // Generate complete PDF report
    async generateReport() {
        const state = StateManager.getState();
        
        // Check if both assessments are complete
        if (!state.assessments.competitive.data || !state.assessments.market.data) {
            alert('Please complete both assessments before exporting the report.');
            return;
        }
        
        try {
            // Show loading indicator
            this.showExportProgress();
            
            // Generate PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set document properties
            doc.setProperties({
                title: 'Venture Assessment Report',
                subject: 'Competitive Risk and Market Opportunity Assessment',
                author: 'SCA Platform',
                keywords: 'venture, assessment, competitive, market',
                creator: 'SCA Venture Assessment Platform'
            });
            
            let yPosition = 20;
            
            // Title page
            this.addTitlePage(doc, state);
            
            // Executive summary
            doc.addPage();
            yPosition = this.addExecutiveSummary(doc, state, 20);
            
            // Competitive Risk Assessment
            doc.addPage();
            yPosition = this.addCompetitiveAssessment(doc, state, 20);
            
            // Market Opportunity Assessment
            doc.addPage();
            yPosition = this.addMarketAssessment(doc, state, 20);
            
            // Detailed Analysis
            doc.addPage();
            yPosition = this.addDetailedAnalysis(doc, state, 20);
            
            // Save the PDF
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `venture_assessment_${timestamp}.pdf`;
            doc.save(filename);
            
            // Hide loading indicator
            this.hideExportProgress();
            
            // Show success message
            this.showExportSuccess(filename);
            
        } catch (error) {
            console.error('Export failed:', error);
            this.hideExportProgress();
            alert('Failed to generate PDF report. Please try again.');
        }
    },
    
    // Add title page
    addTitlePage(doc, state) {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // Title
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('Venture Assessment Report', pageWidth / 2, 60, { align: 'center' });
        
        // Subtitle
        doc.setFontSize(16);
        doc.setFont(undefined, 'normal');
        doc.text('Competitive Risk & Market Opportunity Analysis', pageWidth / 2, 75, { align: 'center' });
        
        // Date
        doc.setFontSize(12);
        const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(date, pageWidth / 2, 90, { align: 'center' });
        
        // Technology description box
        if (state.techDescription) {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('Technology Description:', 20, 120);
            doc.setFont(undefined, 'normal');
            
            const lines = doc.splitTextToSize(state.techDescription, pageWidth - 40);
            doc.text(lines, 20, 130);
        }
        
        // Scores summary box
        const competitive = state.assessments.competitive;
        const market = state.assessments.market;
        
        const boxY = 200;
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(0.5);
        doc.rect(20, boxY, pageWidth - 40, 60);
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Assessment Scores', pageWidth / 2, boxY + 15, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        // Competitive scores
        doc.text('Competitive Risk:', 30, boxY + 30);
        doc.text(`AI: ${competitive.aiScore}/9`, 30, boxY + 38);
        doc.text(`User: ${competitive.userScore}/9`, 80, boxY + 38);
        
        // Market scores
        doc.text('Market Opportunity:', pageWidth / 2 + 10, boxY + 30);
        doc.text(`AI: ${market.aiScore}/9`, pageWidth / 2 + 10, boxY + 38);
        doc.text(`User: ${market.userScore}/9`, pageWidth / 2 + 60, boxY + 38);
        
        // Overall average
        const avgAi = StateManager.calculateAverageScore('aiScore');
        const avgUser = StateManager.calculateAverageScore('userScore');
        
        doc.setFont(undefined, 'bold');
        doc.text(`Overall Average:  AI: ${avgAi.toFixed(1)}/9   User: ${avgUser.toFixed(1)}/9`, 
                 pageWidth / 2, boxY + 52, { align: 'center' });
    },
    
    // Add executive summary
    addExecutiveSummary(doc, state, startY) {
        let y = startY;
        const pageWidth = doc.internal.pageSize.width;
        
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Executive Summary', 20, y);
        y += 15;
        
        const competitive = state.assessments.competitive;
        const market = state.assessments.market;
        
        // Key findings
        doc.setFontSize(14);
        doc.text('Key Findings', 20, y);
        y += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        // Competitive landscape
        const competitiveRisk = competitive.aiScore <= 3 ? 'High' : 
                                competitive.aiScore <= 5 ? 'Moderate' : 
                                competitive.aiScore <= 7 ? 'Low' : 'Minimal';
        
        doc.text(`• Competitive Risk Level: ${competitiveRisk}`, 25, y);
        y += 7;
        
        if (competitive.data) {
            doc.text(`• Total Competitors Identified: ${competitive.data.competitorCount.total}`, 25, y);
            y += 7;
            doc.text(`• Market Leaders: ${competitive.data.marketLeaders.length}`, 25, y);
            y += 7;
        }
        
        // Market opportunity
        const marketStrength = market.aiScore <= 3 ? 'Weak' : 
                              market.aiScore <= 5 ? 'Moderate' : 
                              market.aiScore <= 7 ? 'Good' : 'Exceptional';
        
        doc.text(`• Market Opportunity: ${marketStrength}`, 25, y);
        y += 7;
        
        if (market.data) {
            doc.text(`• Total Addressable Market: ${Formatters.currency(market.data.primaryMarket.tam)}`, 25, y);
            y += 7;
            doc.text(`• CAGR: ${Formatters.percentage(market.data.primaryMarket.cagr)}`, 25, y);
            y += 10;
        }
        
        // Assessment comparison
        doc.setFont(undefined, 'bold');
        doc.text('Assessment Alignment', 20, y);
        y += 10;
        
        doc.setFont(undefined, 'normal');
        const competitiveDeviation = Math.abs(competitive.aiScore - competitive.userScore);
        const marketDeviation = Math.abs(market.aiScore - market.userScore);
        
        const alignment = competitiveDeviation <= 1 && marketDeviation <= 1 ? 'Strong' :
                         competitiveDeviation <= 2 && marketDeviation <= 2 ? 'Moderate' : 'Divergent';
        
        doc.text(`Overall alignment between AI and user assessments: ${alignment}`, 25, y);
        y += 7;
        
        if (competitiveDeviation > 2 || marketDeviation > 2) {
            doc.text('Note: Significant divergence detected in assessments. Review justifications.', 25, y);
            y += 10;
        }
        
        return y;
    },
    
    // Add competitive assessment section
    addCompetitiveAssessment(doc, state, startY) {
        let y = startY;
        const pageWidth = doc.internal.pageSize.width;
        const competitive = state.assessments.competitive;
        
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Competitive Risk Assessment', 20, y);
        y += 15;
        
        // Scores
        doc.setFontSize(12);
        doc.text(`AI Score: ${competitive.aiScore}/9`, 20, y);
        doc.text(`User Score: ${competitive.userScore}/9`, 80, y);
        y += 10;
        
        // User justification
        if (competitive.justification) {
            doc.setFont(undefined, 'bold');
            doc.text('User Assessment:', 20, y);
            y += 7;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(competitive.justification, pageWidth - 40);
            doc.text(lines, 20, y);
            y += lines.length * 5 + 5;
        }
        
        // AI justification
        if (competitive.data) {
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('AI Analysis:', 20, y);
            y += 7;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(competitive.data.justification, pageWidth - 40);
            doc.text(lines, 20, y);
            y += lines.length * 5 + 5;
            
            // Key metrics
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Competitive Landscape:', 20, y);
            y += 7;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`• Large Companies: ${competitive.data.competitorCount.large}`, 25, y);
            y += 5;
            doc.text(`• Mid-size Companies: ${competitive.data.competitorCount.midSize}`, 25, y);
            y += 5;
            doc.text(`• Startups: ${competitive.data.competitorCount.startups}`, 25, y);
            y += 5;
            doc.text(`• Competitive Intensity: ${Formatters.competitiveIntensity(competitive.data.competitiveIntensity)}`, 25, y);
            y += 8;
            
            // Check for page break
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            // Key risks
            if (competitive.data.keyRisks && competitive.data.keyRisks.length > 0) {
                doc.setFont(undefined, 'bold');
                doc.text('Key Risk Factors:', 20, y);
                y += 7;
                
                doc.setFont(undefined, 'normal');
                competitive.data.keyRisks.forEach(risk => {
                    const lines = doc.splitTextToSize(`• ${risk}`, pageWidth - 45);
                    doc.text(lines, 25, y);
                    y += lines.length * 5;
                    
                    if (y > 260) {
                        doc.addPage();
                        y = 20;
                    }
                });
            }
        }
        
        return y;
    },
    
    // Add market assessment section
    addMarketAssessment(doc, state, startY) {
        let y = startY;
        const pageWidth = doc.internal.pageSize.width;
        const market = state.assessments.market;
        
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Market Opportunity Assessment', 20, y);
        y += 15;
        
        // Scores
        doc.setFontSize(12);
        doc.text(`AI Score: ${market.aiScore}/9`, 20, y);
        doc.text(`User Score: ${market.userScore}/9`, 80, y);
        y += 10;
        
        // User justification
        if (market.justification) {
            doc.setFont(undefined, 'bold');
            doc.text('User Assessment:', 20, y);
            y += 7;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(market.justification, pageWidth - 40);
            doc.text(lines, 20, y);
            y += lines.length * 5 + 5;
        }
        
        // Market data
        if (market.data) {
            // Primary market
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Primary Market:', 20, y);
            y += 7;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`• Description: ${market.data.primaryMarket.description}`, 25, y);
            y += 5;
            doc.text(`• TAM: ${Formatters.currency(market.data.primaryMarket.tam)}`, 25, y);
            y += 5;
            doc.text(`• CAGR: ${Formatters.percentage(market.data.primaryMarket.cagr)}`, 25, y);
            y += 8;
            
            // AI justification
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('AI Analysis:', 20, y);
            y += 7;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(market.data.justification.summary, pageWidth - 40);
            doc.text(lines, 20, y);
            y += lines.length * 5 + 5;
            
            // Check for page break
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            // Strengths and limitations
            if (market.data.justification.strengths && market.data.justification.strengths.length > 0) {
                doc.setFont(undefined, 'bold');
                doc.text('Key Strengths:', 20, y);
                y += 7;
                
                doc.setFont(undefined, 'normal');
                market.data.justification.strengths.slice(0, 5).forEach(strength => {
                    const lines = doc.splitTextToSize(`• ${strength}`, pageWidth - 45);
                    doc.text(lines, 25, y);
                    y += lines.length * 5;
                });
                y += 3;
            }
            
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            if (market.data.justification.limitations && market.data.justification.limitations.length > 0) {
                doc.setFont(undefined, 'bold');
                doc.text('Key Limitations:', 20, y);
                y += 7;
                
                doc.setFont(undefined, 'normal');
                market.data.justification.limitations.slice(0, 5).forEach(limitation => {
                    const lines = doc.splitTextToSize(`• ${limitation}`, pageWidth - 45);
                    doc.text(lines, 25, y);
                    y += lines.length * 5;
                });
            }
        }
        
        return y;
    },
    
    // Add detailed analysis
    addDetailedAnalysis(doc, state, startY) {
        let y = startY;
        const pageWidth = doc.internal.pageSize.width;
        
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Detailed Analysis', 20, y);
        y += 15;
        
        // Market analysis
        const market = state.assessments.market;
        if (market.data && market.data.marketAnalysis) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Market Analysis', 20, y);
            y += 10;
            
            if (market.data.marketAnalysis.executiveSummary) {
                doc.setFontSize(11);
                doc.setFont(undefined, 'normal');
                const lines = doc.splitTextToSize(market.data.marketAnalysis.executiveSummary, pageWidth - 40);
                doc.text(lines, 20, y);
                y += lines.length * 5 + 5;
            }
            
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            // Problem statement
            if (market.data.marketAnalysis.problemStatement) {
                doc.setFont(undefined, 'bold');
                doc.text('Problem Statement:', 20, y);
                y += 7;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                const lines = doc.splitTextToSize(market.data.marketAnalysis.problemStatement, pageWidth - 40);
                doc.text(lines, 20, y);
                y += lines.length * 5 + 5;
            }
            
            // Differentiation
            if (market.data.marketAnalysis.differentiation) {
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('Differentiation:', 20, y);
                y += 7;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                const lines = doc.splitTextToSize(market.data.marketAnalysis.differentiation, pageWidth - 40);
                doc.text(lines, 20, y);
                y += lines.length * 5 + 5;
            }
        }
        
        // Data quality note
        if (y > 240) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.text('Note: This assessment is based on available data at the time of analysis.', 20, 280);
        doc.text(`Report generated on ${new Date().toLocaleString()}`, 20, 285);
        
        return y;
    },
    
    // Show export progress
    showExportProgress() {
        const progress = document.createElement('div');
        progress.id = 'exportProgress';
        progress.innerHTML = `
            <div class="export-overlay">
                <div class="export-modal">
                    <div class="spinner"></div>
                    <h3>Generating Report...</h3>
                    <p>Please wait while we compile your assessment report.</p>
                </div>
            </div>
        `;
        
        progress.querySelector('.export-overlay').style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        progress.querySelector('.export-modal').style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            box-shadow: var(--shadow-xl);
        `;
        
        document.body.appendChild(progress);
    },
    
    // Hide export progress
    hideExportProgress() {
        const progress = document.getElementById('exportProgress');
        if (progress) {
            progress.remove();
        }
    },
    
    // Show export success
    showExportSuccess(filename) {
        const success = document.createElement('div');
        success.innerHTML = `
            <div class="export-success">
                <span>✓</span>
                <h3>Report Generated!</h3>
                <p>Your report has been saved as:<br><strong>${filename}</strong></p>
            </div>
        `;
        
        success.querySelector('.export-success').style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--success);
            color: white;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            box-shadow: var(--shadow-xl);
            z-index: 10000;
        `;
        
        document.body.appendChild(success);
        
        setTimeout(() => {
            success.remove();
        }, 3000);
    }
};