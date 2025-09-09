// js/utils/export.js - PDF Export Utility (clean)

const ExportUtility = {
  async generateReport() {
    const state = StateManager.getState();

    if (!state.assessments.competitive.data || !state.assessments.market.data) {
      alert("Please complete both assessments before exporting the report.");
      return;
    }

    try {
      this.showExportProgress();

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setProperties({
        title: "Venture Assessment Report",
        subject: "Competitive Risk and Market Opportunity Assessment",
        author: "SCA Platform",
        keywords: "venture, assessment, competitive, market",
        creator: "SCA Venture Assessment Platform",
      });

      // Title page
      this.addTitlePage(doc, state);

      // Company overview (new)
      doc.addPage();
      this.addCompanyOverview(doc, state, 20);

      // Executive summary
      doc.addPage();
      this.addExecutiveSummary(doc, state, 20);

      // Competitive
      doc.addPage();
      this.addCompetitiveAssessment(doc, state, 20);

      // Market
      doc.addPage();
      this.addMarketAssessment(doc, state, 20);

      // Detailed
      doc.addPage();
      this.addDetailedAnalysis(doc, state, 20);

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `venture_assessment_${timestamp}.pdf`;
      doc.save(filename);

      this.hideExportProgress();
      this.showExportSuccess(filename);
    } catch (err) {
      console.error("Export failed:", err);
      this.hideExportProgress();
      alert("Failed to generate PDF report. Please try again.");
    }
  },

  addTitlePage(doc, state) {
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(24);
    doc.setFont(undefined, "bold");
    doc.text("Venture Assessment Report", pageWidth / 2, 60, { align: "center" });

    doc.setFontSize(16);
    doc.setFont(undefined, "normal");
    doc.text("Competitive Risk & Market Opportunity Analysis", pageWidth / 2, 75, { align: "center" });

    doc.setFontSize(12);
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    doc.text(date, pageWidth / 2, 90, { align: "center" });

    if (state.techDescription) {
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Technology Description:", 20, 120);
      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(state.techDescription, pageWidth - 40);
      doc.text(lines, 20, 130);
    }

    // Scores box
    const competitive = state.assessments.competitive;
    const market = state.assessments.market;
    const boxY = 200;
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.rect(20, boxY, pageWidth - 40, 60);
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Assessment Scores", pageWidth / 2, boxY + 15, { align: "center" });
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text("Competitive Risk:", 30, boxY + 30);
    doc.text(`AI: ${competitive.aiScore}/9`, 30, boxY + 38);
    doc.text(`User: ${competitive.userScore}/9`, 80, boxY + 38);
    doc.text("Market Opportunity:", pageWidth / 2 + 10, boxY + 30);
    doc.text(`AI: ${market.aiScore}/9`, pageWidth / 2 + 10, boxY + 38);
    doc.text(`User: ${market.userScore}/9`, pageWidth / 2 + 60, boxY + 38);

    const avgAi = StateManager.calculateAverageScore("aiScore");
    const avgUser = StateManager.calculateAverageScore("userScore");
    doc.setFont(undefined, "bold");
    doc.text(
      `Overall Average:  AI: ${avgAi.toFixed(1)}/9   User: ${avgUser.toFixed(1)}/9`,
      pageWidth / 2,
      boxY + 52,
      { align: "center" }
    );
  },

  // NEW: Write company JSON into PDF (no HTML)
  addCompanyOverview(doc, state, startY) {
    const pageWidth = doc.internal.pageSize.width;
    let y = startY;

    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text("Company Overview", 20, y);
    y += 12;

    const company = StateManager.getCompany?.() || null;
    if (!company) {
      doc.setFontSize(11);
      doc.setFont(undefined, "italic");
      doc.text("No company analysis available.", 20, y);
      return;
    }

    const o = company.company_overview || {};
    const t = company.technology || {};
    const p = company.products_and_applications || {};
    const m = company.market_context || {};
    const dqa = company.data_quality_assessment || {};

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Basics", 20, y); y += 7;
    doc.setFont(undefined, "normal");
    const basics = [
      `Name: ${o.name || "—"}`,
      `Website: ${o.website || "—"}`,
      `Founded: ${o.founded_year ?? "—"}`,
      `Headquarters: ${o.headquarters || "—"}`,
      `Stage: ${o.company_stage || "—"}`,
      `Employees: ${o.employee_count || "—"}`
    ];
    basics.forEach(line => { doc.text(line, 20, y); y += 6; });

    y += 3;
    if (y > 260) { doc.addPage(); y = 20; }

    doc.setFont(undefined, "bold");
    doc.text("Technology", 20, y); y += 7;
    doc.setFont(undefined, "normal");
    let lines = doc.splitTextToSize(`Core: ${t.core_technology || "—"}`, pageWidth - 40);
    doc.text(lines, 20, y); y += lines.length * 5 + 3;
    doc.text(`Category: ${t.technology_category || "—"}`, 20, y); y += 6;

    y += 3;
    if (y > 260) { doc.addPage(); y = 20; }

    doc.setFont(undefined, "bold");
    doc.text("Products & Applications", 20, y); y += 7;
    doc.setFont(undefined, "normal");
    lines = doc.splitTextToSize(`Primary application: ${p.primary_application || "—"}`, pageWidth - 40);
    doc.text(lines, 20, y); y += lines.length * 5 + 3;

    y += 3;
    if (y > 260) { doc.addPage(); y = 20; }

    doc.setFont(undefined, "bold");
    doc.text("Market Context", 20, y); y += 7;
    doc.setFont(undefined, "normal");
    doc.text(`Industry: ${m.industry || "—"}${m.sub_sector ? " | " + m.sub_sector : ""}`, 20, y); y += 6;
    lines = doc.splitTextToSize(`Value proposition: ${m.value_proposition || "—"}`, pageWidth - 40);
    doc.text(lines, 20, y); y += lines.length * 5 + 3;

    // Sources (first 6)
    const sources = (dqa.primary_sources || []).slice(0, 6);
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont(undefined, "bold"); doc.text("Sources", 20, y); y += 7;
    doc.setFont(undefined, "normal"); doc.setFontSize(10);
    sources.forEach(s => {
      const sl = doc.splitTextToSize(`• ${s}`, pageWidth - 40);
      doc.text(sl, 20, y);
      y += sl.length * 5;
      if (y > 260) { doc.addPage(); y = 20; }
    });
  },

  // The remaining methods are your existing (clean) versions.
  addExecutiveSummary(doc, state, startY) { /* use your existing clean block */ },
  addCompetitiveAssessment(doc, state, startY) { /* existing clean block */ },
  addMarketAssessment(doc, state, startY) { /* existing clean block */ },
  addDetailedAnalysis(doc, state, startY) { /* existing clean block */ },

  showExportProgress() { /* existing clean block */ },
  hideExportProgress() { /* existing clean block */ },
  showExportSuccess(filename) { /* existing clean block */ }
};
