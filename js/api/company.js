// js/api/company.js - Company analysis API

const CompanyAPI = {
  config: {
    url: 'https://api.stack-ai.com/inference/v0/run/f913a8b8-144d-47e0-b327-8daa341b575d/68bf33a8aedc162026050675',
    headers: {
      'Authorization': 'Bearer e80f3814-a651-4de7-a7ba-8478b7a9047b',
      'Content-Type': 'application/json'
    },
    timeout: 600000 // 10 minutes
  },

  /**
   * Analyze a company from URL
   */
  async analyze(url, abortSignal = null) {
    if (!url || typeof url !== 'string') {
      throw new Error('Valid URL is required');
    }

    const payload = {
      'user_id': `company_${Date.now()}`,
      'in-0': url.trim()
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    // Combine abort signals if provided
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: this.config.headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Company API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return this.processResponse(data);

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Company analysis timeout or cancelled');
      }
      
      throw error;
    }
  },

  /**
   * Process API response
   */
  processResponse(data) {
    // Validate basic response structure
    const validation = Validators.validateApiResponse(data, ['out-6']);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Extract company data
    const rawOutput = data.outputs['out-6'];
    let companyData;

    try {
      // Handle both string and object responses
      if (typeof rawOutput === 'string') {
        companyData = JSON.parse(rawOutput);
      } else if (rawOutput && typeof rawOutput === 'object') {
        // Check if it's wrapped in a text property
        if (rawOutput.text && typeof rawOutput.text === 'string') {
          companyData = JSON.parse(rawOutput.text);
        } else {
          companyData = rawOutput;
        }
      } else {
        throw new Error('Unexpected company data format');
      }
    } catch (parseError) {
      console.error('Failed to parse company data:', parseError);
      throw new Error('Invalid company data format from API');
    }

    // Validate against schema
    const companyValidation = Validators.validateCompany(companyData);
    if (!companyValidation.valid) {
      console.warn('Company data validation warning:', companyValidation.error);
      // Continue anyway with what we have
    }

    // Ensure critical fields exist
    this.ensureRequiredFields(companyData);

    return companyData;
  },

  /**
   * Ensure required fields have at least default values
   */
  ensureRequiredFields(data) {
    // Ensure company_overview exists
    if (!data.company_overview) {
      data.company_overview = {};
    }
    
    const overview = data.company_overview;
    if (!overview.name) overview.name = 'Unknown Company';
    if (!overview.website) overview.website = '';
    if (!overview.mission_statement) overview.mission_statement = '';
    if (!overview.company_description) overview.company_description = '';

    // Ensure technology exists
    if (!data.technology) {
      data.technology = {};
    }
    
    const tech = data.technology;
    if (!tech.core_technology) tech.core_technology = '';
    if (!tech.technology_category) tech.technology_category = '';
    if (!tech.technical_approach) tech.technical_approach = '';
    if (!tech.key_innovations) tech.key_innovations = [];

    // Ensure products_and_applications exists
    if (!data.products_and_applications) {
      data.products_and_applications = {};
    }
    
    const products = data.products_and_applications;
    if (!products.primary_application) products.primary_application = '';
    if (!products.products) products.products = [];
    if (!products.use_cases) products.use_cases = [];
    if (!products.target_industries) products.target_industries = [];

    // Ensure market_context exists
    if (!data.market_context) {
      data.market_context = {};
    }
    
    const market = data.market_context;
    if (!market.industry) market.industry = '';
    if (!market.problem_addressed) market.problem_addressed = '';
    if (!market.value_proposition) market.value_proposition = '';
    if (!market.business_model) market.business_model = '';

    return data;
  }
};

// Make available globally
window.CompanyAPI = CompanyAPI;