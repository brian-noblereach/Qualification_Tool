

/**
 * CompanyMappers
 * Converts the company JSON into lightweight text prompts for Competitive and Market APIs.
 * Your competitive/market endpoints don't require JSON, so we compose descriptive strings.
 */

const CompanyMappers = (() => {
  function safeJoin(arr, sep = "; ") {
    return Array.isArray(arr) ? arr.filter(Boolean).join(sep) : "";
  }

  function mapToCompetitivePrompt(company) {
    const o = company.company_overview || {};
    const t = company.technology || {};
    const p = company.products_and_applications || {};
    const m = company.market_context || {};
    const dqa = company.data_quality_assessment || {};

    // concise, info-dense description for the competitive API
    return [
      `Company: ${o.name || "Unknown"} (${o.website || "N/A"})`,
      `Mission: ${o.mission_statement || "N/A"}`,
      `Technology: ${t.core_technology || "N/A"} (Category: ${t.technology_category || "N/A"})`,
      `Approach: ${t.technical_approach || "N/A"}`,
      `Key innovations: ${safeJoin(t.key_innovations) || "N/A"}`,
      `Primary application: ${p.primary_application || "N/A"}`,
      `Target industries: ${safeJoin(p.target_industries) || "N/A"}`,
      `Use cases: ${safeJoin(p.use_cases) || "N/A"}`,
      `Industry: ${m.industry || "N/A"}${m.sub_sector ? " | Sub-sector: " + m.sub_sector : ""}`,
      `Sources: ${safeJoin(dqa.primary_sources, " | ") || "Company website"}`
    ].join("\n");
  }

  function mapToMarketPrompt(company) {
    const o = company.company_overview || {};
    const p = company.products_and_applications || {};
    const m = company.market_context || {};
    const f = company.funding_and_investors || {};
    const tr = company.traction_and_metrics || {};
    const ra = (company.recent_activity && company.recent_activity.last_12_months) || [];

    return [
      `Company: ${o.name || "Unknown"} (${o.website || "N/A"})`,
      `Industry context: ${m.industry || "N/A"}${m.sub_sector ? " | " + m.sub_sector : ""}`,
      `Value proposition: ${m.value_proposition || "N/A"}`,
      `Business model: ${m.business_model || "N/A"}`,
      `Primary application: ${p.primary_application || "N/A"}`,
      `Products: ${safeJoin((p.products || []).map(x => `${x.name} (${x.status})`)) || "N/A"}`,
      `Target industries: ${safeJoin(p.target_industries) || "N/A"}`,
      `Traction: customers=${(tr.customers && tr.customers.customer_type) || "N/A"}; achievements=${safeJoin(tr.achievements) || "N/A"}`,
      `Funding (USD): total=${f.total_funding ?? "N/A"}; rounds=${(f.funding_rounds||[]).length}`,
      `Recent activity: ${safeJoin(ra.map(x => `[${x.date}] ${x.activity_type}: ${x.description}`), " | ") || "N/A"}`
    ].join("\n");
  }

  return { mapToCompetitivePrompt, mapToMarketPrompt };
})();
