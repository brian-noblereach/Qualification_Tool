/**
 * CompanyView
 * Renders a compact company overview into the Summary page (top) and exposes
 * a helper to stamp a few highlights into the header if desired.
 */

const CompanyView = (() => {
  function el(id) { return document.getElementById(id); }
  function textOrDash(v){ return (v === null || v === undefined || v === "") ? "—" : v; }
  function linkify(url){ return url ? `<a href="${url}" target="_blank" rel="noopener">${url}</a>` : "—"; }

  function renderSummary(company){
    const wrap = el("companySummary");
    const body = el("companySummaryBody");
    if (!wrap || !body) return;

    const o = company.company_overview || {};
    const t = company.technology || {};
    const p = company.products_and_applications || {};
    const m = company.market_context || {};
    const dqa = company.data_quality_assessment || {};

    body.innerHTML = `
      <div class="two-col">
        <div class="card">
          <strong>Overview</strong>
          <div style="margin-top:.5rem">
            <div><b>Name:</b> ${textOrDash(o.name)}</div>
            <div><b>Website:</b> ${linkify(o.website)}</div>
            <div><b>Founded:</b> ${textOrDash(o.founded_year)}</div>
            <div><b>HQ:</b> ${textOrDash(o.headquarters)}</div>
            <div><b>Stage:</b> ${textOrDash(o.company_stage)}</div>
            <div><b>Employees:</b> ${textOrDash(o.employee_count)}</div>
          </div>
        </div>
        <div class="card">
          <strong>Technology</strong>
          <div style="margin-top:.5rem">
            <div><b>Core tech:</b> ${textOrDash(t.core_technology)}</div>
            <div><b>Category:</b> ${textOrDash(t.technology_category)}</div>
            <div style="margin-top:.5rem"><b>Key innovations:</b><br>${(t.key_innovations||[]).map(x=>`• ${x}`).join("<br>") || "—"}</div>
          </div>
        </div>
      </div>

      <div class="two-col" style="margin-top:1rem">
        <div class="card">
          <strong>Products & Application</strong>
          <div style="margin-top:.5rem">
            <div><b>Primary application:</b> ${textOrDash(p.primary_application)}</div>
            <div style="margin-top:.5rem"><b>Products:</b><br>${(p.products||[]).map(x=>`• ${x.name} (${x.status})`).join("<br>") || "—"}</div>
            <div style="margin-top:.5rem"><b>Target industries:</b><br>${(p.target_industries||[]).map(x=>`• ${x}`).join("<br>") || "—"}</div>
          </div>
        </div>
        <div class="card">
          <strong>Market Context</strong>
          <div style="margin-top:.5rem">
            <div><b>Industry:</b> ${textOrDash(m.industry)}</div>
            <div><b>Sub-sector:</b> ${textOrDash(m.sub_sector)}</div>
            <div><b>Value prop:</b> ${textOrDash(m.value_proposition)}</div>
            <div><b>Business model:</b> ${textOrDash(m.business_model)}</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:1rem">
        <strong>Sources</strong>
        <ul style="margin-top:.5rem">
          ${(dqa.primary_sources||[]).map(s => `<li><a href="${s}" target="_blank" rel="noopener">${s}</a></li>`).join("") || "<li>—</li>"}
        </ul>
      </div>
    `;

    wrap.style.display = "block";
  }

  return { renderSummary };
})();
