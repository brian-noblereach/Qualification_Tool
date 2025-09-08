// js/utils/formatters.js - Data Formatting Utilities

const Formatters = {
    // Format currency values
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
    
    // Format percentage values
    percentage(value) {
        if (value === null || value === undefined) return '-';
        
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        
        return `${num.toFixed(1)}%`;
    },
    
    // Format confidence scores (0-1 to percentage with fallback)
    confidence(value) {
        if (value === null || value === undefined) return 'Not available';
        
        const num = parseFloat(value);
        if (isNaN(num)) return 'Not available';
        
        // Ensure value is between 0 and 1
        const normalized = Math.max(0, Math.min(1, num));
        const percentage = (normalized * 100).toFixed(0);
        
        // Add descriptive text based on confidence level
        let descriptor = '';
        if (normalized >= 0.8) descriptor = ' (High)';
        else if (normalized >= 0.6) descriptor = ' (Moderate)';
        else if (normalized >= 0.4) descriptor = ' (Low)';
        else descriptor = ' (Very Low)';
        
        return `${percentage}%${descriptor}`;
    },
    
    // Format time duration in seconds to MM:SS
    duration(seconds) {
        if (seconds === null || seconds === undefined) return '0:00';
        
        const totalSeconds = Math.max(0, Math.floor(seconds));
        const minutes = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Format date to locale string
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
        } catch (e) {
            console.error('Date formatting error:', e);
            return '-';
        }
    },
    
    // Format date time to locale string
    dateTime(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('DateTime formatting error:', e);
            return '-';
        }
    },
    
    // Truncate text with ellipsis
    truncate(text, maxLength = 100) {
        if (!text) return '';
        
        const str = String(text).trim();
        if (str.length <= maxLength) return str;
        
        // Try to break at word boundary
        const truncated = str.substring(0, maxLength - 3);
        const lastSpace = truncated.lastIndexOf(' ');
        
        if (lastSpace > maxLength * 0.8) {
            return truncated.substring(0, lastSpace) + '...';
        }
        
        return truncated + '...';
    },
    
    // Format competitive intensity
    competitiveIntensity(value) {
        if (!value) return '-';
        
        const intensity = String(value).toLowerCase().replace(/[_-]/g, '_');
        const intensityMap = {
            'very_low': 'Very Low',
            'low': 'Low',
            'moderate': 'Moderate',
            'high': 'High',
            'very_high': 'Very High'
        };
        
        return intensityMap[intensity] || this.titleCase(value);
    },
    
    // Format score with color
    scoreWithColor(score) {
        if (score === null || score === undefined) {
            return { value: '-', color: 'var(--gray-500)', label: 'Not assessed' };
        }
        
        const num = parseInt(score);
        if (isNaN(num) || num < 1 || num > 9) {
            return { value: '-', color: 'var(--gray-500)', label: 'Invalid score' };
        }
        
        let color, label;
        
        if (num <= 3) {
            color = 'var(--danger)';
            label = 'High Risk';
        } else if (num <= 5) {
            color = 'var(--warning)';
            label = 'Moderate Risk';
        } else if (num <= 7) {
            color = 'var(--primary)';
            label = 'Low Risk';
        } else {
            color = 'var(--success)';
            label = 'Minimal Risk';
        }
        
        return { value: num, color, label };
    },
    
    // Format list to HTML with proper escaping
    listToHTML(items, maxItems = null, emptyMessage = 'No items available') {
        if (!items || !Array.isArray(items)) {
            return `<li class="empty-list-item">${this.escapeHTML(emptyMessage)}</li>`;
        }
        
        const filteredItems = items.filter(item => item !== null && item !== undefined && String(item).trim());
        
        if (filteredItems.length === 0) {
            return `<li class="empty-list-item">${this.escapeHTML(emptyMessage)}</li>`;
        }
        
        const itemsToShow = maxItems && maxItems < filteredItems.length 
            ? filteredItems.slice(0, maxItems) 
            : filteredItems;
        
        let html = itemsToShow.map(item => 
            `<li>${this.escapeHTML(String(item))}</li>`
        ).join('');
        
        if (maxItems && filteredItems.length > maxItems) {
            const remaining = filteredItems.length - maxItems;
            html += `<li class="more-items">+${remaining} more</li>`;
        }
        
        return html;
    },
    
    // Enhanced HTML escaping to prevent XSS
    escapeHTML(text) {
        if (text === null || text === undefined) return '';
        
        const str = String(text);
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        
        return str.replace(/[&<>"'`=/]/g, char => escapeMap[char]);
    },
    
    // Sanitize user input for display (removes scripts, etc.)
    sanitizeInput(text) {
        if (!text) return '';
        
        // Remove script tags and event handlers
        let sanitized = String(text)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
            .replace(/on\w+\s*=\s*'[^']*'/gi, '')
            .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
        
        return this.escapeHTML(sanitized);
    },
    
    // Format TAM category
    tamCategory(category) {
        if (!category) return '-';
        
        const categoryStr = String(category).toLowerCase();
        const categoryMap = {
            'under_500m': '<$500M',
            '500m_to_5b': '$500M-$5B',
            'over_5b': '>$5B',
            'small': '<$500M',
            'medium': '$500M-$5B',
            'large': '>$5B'
        };
        
        return categoryMap[categoryStr] || this.titleCase(category.replace(/[_-]/g, ' '));
    },
    
    // Format CAGR category
    cagrCategory(category) {
        if (!category) return '-';
        
        const categoryStr = String(category).toLowerCase();
        const categoryMap = {
            'under_10': '<10%',
            '10_to_35': '10-35%',
            'over_35': '>35%',
            'low': '<10%',
            'moderate': '10-35%',
            'high': '>35%'
        };
        
        return categoryMap[categoryStr] || this.titleCase(category.replace(/[_-]/g, ' '));
    },
    
    // Format competitor count breakdown with validation
    competitorBreakdown(data) {
        if (!data || typeof data !== 'object') {
            return { total: 0, breakdown: 'No data available', details: {} };
        }
        
        const details = {
            large: parseInt(data.large_companies || data.large || 0) || 0,
            midSize: parseInt(data.mid_size_companies || data.midSize || 0) || 0,
            startups: parseInt(data.startups || 0) || 0
        };
        
        const total = parseInt(data.total) || (details.large + details.midSize + details.startups);
        
        const breakdown = [];
        if (details.large > 0) breakdown.push(`${details.large} Large`);
        if (details.midSize > 0) breakdown.push(`${details.midSize} Mid-size`);
        if (details.startups > 0) breakdown.push(`${details.startups} Startups`);
        
        return {
            total,
            breakdown: breakdown.length > 0 ? breakdown.join(', ') : 'No competitors identified',
            details
        };
    },
    
    // Format market leaders list with proper handling
    marketLeaders(leaders) {
        if (!leaders || !Array.isArray(leaders)) {
            return 'None identified';
        }
        
        const validLeaders = leaders.filter(leader => 
            leader && String(leader).trim() && !String(leader).match(/^\{.*\}$/)
        );
        
        if (validLeaders.length === 0) {
            return 'None identified';
        }
        
        const escaped = validLeaders.map(leader => this.escapeHTML(String(leader)));
        
        if (escaped.length <= 3) {
            return escaped.join(', ');
        }
        
        return `${escaped.slice(0, 3).join(', ')} (+${escaped.length - 3} more)`;
    },
    
    // Calculate and format score comparison
    scoreComparison(aiScore, userScore) {
        const ai = parseInt(aiScore);
        const user = parseInt(userScore);
        
        if (isNaN(ai) || isNaN(user)) {
            return { text: 'Scores not available', class: 'unavailable', difference: null };
        }
        
        const diff = user - ai;
        
        if (diff === 0) {
            return { 
                text: 'Agrees with AI', 
                class: 'neutral',
                difference: 0,
                alignment: 'perfect'
            };
        } else if (diff > 0) {
            return { 
                text: `+${diff} higher than AI`, 
                class: diff > 2 ? 'much-higher' : 'higher',
                difference: diff,
                alignment: diff <= 2 ? 'close' : 'divergent'
            };
        } else {
            return { 
                text: `${diff} lower than AI`, 
                class: Math.abs(diff) > 2 ? 'much-lower' : 'lower',
                difference: diff,
                alignment: Math.abs(diff) <= 2 ? 'close' : 'divergent'
            };
        }
    },
    
    // Helper: Convert string to title case
    titleCase(str) {
        if (!str) return '';
        
        return String(str)
            .toLowerCase()
            .split(/[\s_-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },
    
    // Validate and format URL
    formatUrl(url) {
        if (!url) return null;
        
        const urlStr = String(url).trim();
        
        // Check if it's already a valid URL
        try {
            new URL(urlStr);
            return urlStr;
        } catch {
            // Try adding https://
            try {
                new URL('https://' + urlStr);
                return 'https://' + urlStr;
            } catch {
                return null;
            }
        }
    }
};