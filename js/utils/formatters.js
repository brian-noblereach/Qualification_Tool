// js/utils/formatters.js - Data formatting utilities

const Formatters = {
  /**
   * Format currency values
   */
  currency(value) {
    if (value === null || value === undefined) return '-';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    
    if (num >= 1000000000000) {
      return `$${(num / 1000000000000).toFixed(2)}T`;
    } else if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  },

  /**
   * Format percentage values
   */
  percentage(value) {
    if (value === null || value === undefined) return '-';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    
    return `${num.toFixed(1)}%`;
  },

  /**
   * Format confidence scores (0-1 to percentage)
   */
  confidence(value) {
    if (value === null || value === undefined) return 'Not available';
    
    const num = parseFloat(value);
    if (isNaN(num)) return 'Not available';
    
    const normalized = Math.max(0, Math.min(1, num));
    const percentage = (normalized * 100).toFixed(0);
    
    let descriptor = '';
    if (normalized >= 0.8) descriptor = 'High';
    else if (normalized >= 0.6) descriptor = 'Moderate';
    else if (normalized >= 0.4) descriptor = 'Low';
    else descriptor = 'Very Low';
    
    return `${percentage}% (${descriptor})`;
  },

  /**
   * Format time duration in seconds to MM:SS
   */
  duration(seconds) {
    if (seconds === null || seconds === undefined) return '0:00';
    
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Format date to locale string
   */
  date(dateString) {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  },

  /**
   * Truncate text with ellipsis
   */
  truncate(text, maxLength = 100) {
    if (!text) return '';
    
    const str = String(text).trim();
    if (str.length <= maxLength) return str;
    
    const truncated = str.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  },

  /**
   * Format competitive intensity
   */
  competitiveIntensity(value) {
    if (!value) return '-';
    
    const intensity = String(value).toLowerCase().replace(/[_-]/g, ' ');
    const intensityMap = {
      'very low': 'Very Low',
      'low': 'Low',
      'moderate': 'Moderate',
      'high': 'High',
      'very high': 'Very High'
    };
    
    return intensityMap[intensity] || this.titleCase(value);
  },

  /**
   * Get score color and label
   */
  scoreColor(score, type = 'competitive') {
    const num = parseInt(score);
    
    if (isNaN(num) || num < 1 || num > 9) {
      return { color: 'var(--gray-500)', label: 'Invalid' };
    }
    
    if (type === 'competitive') {
      // For competitive: lower is worse (more risk)
      if (num <= 3) return { color: 'var(--danger)', label: 'High Risk' };
      if (num <= 5) return { color: 'var(--warning)', label: 'Moderate Risk' };
      if (num <= 7) return { color: 'var(--primary)', label: 'Low Risk' };
      return { color: 'var(--success)', label: 'Minimal Risk' };
    } else {
      // For market: lower is worse (less opportunity)
      if (num <= 3) return { color: 'var(--danger)', label: 'Weak Market' };
      if (num <= 5) return { color: 'var(--warning)', label: 'Moderate Market' };
      if (num <= 7) return { color: 'var(--primary)', label: 'Good Market' };
      return { color: 'var(--success)', label: 'Exceptional Market' };
    }
  },

  /**
   * Format array as HTML list
   */
  listToHTML(items, maxItems = null) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return '<li class="empty-item">No items available</li>';
    }
    
    const validItems = items.filter(item => item && String(item).trim());
    
    if (validItems.length === 0) {
      return '<li class="empty-item">No items available</li>';
    }
    
    const itemsToShow = maxItems && maxItems < validItems.length 
      ? validItems.slice(0, maxItems) 
      : validItems;
    
    let html = itemsToShow.map(item => 
      `<li>${this.escapeHTML(String(item))}</li>`
    ).join('');
    
    if (maxItems && validItems.length > maxItems) {
      const remaining = validItems.length - maxItems;
      html += `<li class="more-items">+${remaining} more items</li>`;
    }
    
    return html;
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(text) {
    if (text === null || text === undefined) return '';
    
    const str = String(text);
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'/]/g, char => escapeMap[char]);
  },

  /**
   * Format TAM category
   */
  tamCategory(value, tam) {
    if (!value && !tam) return '-';
    
    if (value) {
      const categoryMap = {
        'under_500M': '<$500M',
        '500M_to_5B': '$500M-$5B',
        'over_5B': '>$5B'
      };
      return categoryMap[value] || value;
    }
    
    // Derive from TAM value
    const numTam = parseFloat(tam);
    if (isNaN(numTam)) return '-';
    
    if (numTam < 500000000) return '<$500M';
    if (numTam <= 5000000000) return '$500M-$5B';
    return '>$5B';
  },

  /**
   * Format CAGR category
   */
  cagrCategory(value, cagr) {
    if (!value && !cagr) return '-';
    
    if (value) {
      const categoryMap = {
        'under_10': '<10%',
        '10_to_35': '10-35%',
        'over_35': '>35%'
      };
      return categoryMap[value] || value;
    }
    
    // Derive from CAGR value
    const numCagr = parseFloat(cagr);
    if (isNaN(numCagr)) return '-';
    
    if (numCagr < 10) return '<10%';
    if (numCagr <= 35) return '10-35%';
    return '>35%';
  },

  /**
   * Format competitor breakdown
   */
  competitorBreakdown(count) {
    if (!count || typeof count !== 'object') {
      return 'No data available';
    }
    
    const parts = [];
    
    if (count.large_companies > 0) {
      parts.push(`${count.large_companies} Large`);
    }
    if (count.mid_size_companies > 0) {
      parts.push(`${count.mid_size_companies} Mid-size`);
    }
    if (count.startups > 0) {
      parts.push(`${count.startups} Startups`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No competitors identified';
  },

  /**
   * Format company size
   */
  companySize(size) {
    if (!size) return 'Unknown';
    
    const sizeMap = {
      'large': 'Large Enterprise',
      'large_companies': 'Large Enterprise',
      'mid-size': 'Mid-size',
      'mid_size': 'Mid-size',
      'midsize': 'Mid-size',
      'startup': 'Startup',
      'startups': 'Startup'
    };
    
    const normalized = String(size).toLowerCase();
    return sizeMap[normalized] || this.titleCase(size);
  },

  /**
   * Convert to title case
   */
  titleCase(str) {
    if (!str) return '';
    
    return String(str)
      .toLowerCase()
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Format number with commas
   */
  numberWithCommas(num) {
    if (num === null || num === undefined) return '-';
    
    const number = parseFloat(num);
    if (isNaN(number)) return '-';
    
    return number.toLocaleString('en-US');
  },

  /**
   * Format employee count
   */
  employeeCount(count) {
    if (!count) return '-';
    
    // Handle ranges like "50-100"
    if (String(count).includes('-')) {
      return count;
    }
    
    const num = parseInt(count);
    if (isNaN(num)) return count;
    
    if (num < 10) return '1-10';
    if (num < 50) return '11-50';
    if (num < 200) return '51-200';
    if (num < 500) return '201-500';
    if (num < 1000) return '501-1000';
    if (num < 5000) return '1000-5000';
    return '5000+';
  },

  /**
   * Format company stage
   */
  companyStage(stage) {
    if (!stage) return 'Unknown';
    
    const stageMap = {
      'pre-seed': 'Pre-Seed',
      'seed': 'Seed',
      'series-a': 'Series A',
      'series-b': 'Series B',
      'series-c+': 'Series C+',
      'growth': 'Growth',
      'mature': 'Mature'
    };
    
    const normalized = String(stage).toLowerCase();
    return stageMap[normalized] || this.titleCase(stage);
  },

  /**
   * Format URL for display
   */
  displayUrl(url) {
    if (!url) return '-';
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  },

  /**
   * Pluralize word based on count
   */
  pluralize(count, singular, plural = null) {
    const num = parseInt(count);
    if (isNaN(num)) return singular;
    
    if (num === 1) return `${num} ${singular}`;
    return `${num} ${plural || singular + 's'}`;
  }
};

// Make available globally
window.Formatters = Formatters;