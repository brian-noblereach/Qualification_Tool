// js/utils/formatters.js - Data Formatting Utilities

const Formatters = {
    // Format currency values
    currency(value) {
        if (!value && value !== 0) return '-';
        
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
        if (!value && value !== 0) return '-';
        
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        
        return `${num.toFixed(1)}%`;
    },
    
    // Format confidence scores (0-1 to percentage)
    confidence(value) {
        if (!value && value !== 0) return '-';
        
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        
        return `${(num * 100).toFixed(0)}%`;
    },
    
    // Format time duration in seconds to MM:SS
    duration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Format date to locale string
    date(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    },
    
    // Format date time to locale string
    dateTime(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    },
    
    // Truncate text with ellipsis
    truncate(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    },
    
    // Format competitive intensity
    competitiveIntensity(value) {
        if (!value) return '-';
        
        const intensity = value.toString().toLowerCase();
        const intensityMap = {
            'very_low': 'Very Low',
            'low': 'Low',
            'moderate': 'Moderate',
            'high': 'High',
            'very_high': 'Very High'
        };
        
        return intensityMap[intensity] || value;
    },
    
    // Format score with color
    scoreWithColor(score) {
        if (!score) return { value: '-', color: 'var(--gray-500)' };
        
        const num = parseInt(score);
        let color;
        
        if (num <= 3) {
            color = 'var(--danger)';
        } else if (num <= 5) {
            color = 'var(--warning)';
        } else if (num <= 7) {
            color = 'var(--primary)';
        } else {
            color = 'var(--success)';
        }
        
        return { value: num, color };
    },
    
    // Format list to HTML
    listToHTML(items, maxItems = null) {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return '<li>No items available</li>';
        }
        
        const itemsToShow = maxItems ? items.slice(0, maxItems) : items;
        return itemsToShow.map(item => `<li>${this.escapeHTML(item)}</li>`).join('');
    },
    
    // Escape HTML to prevent XSS
    escapeHTML(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Format TAM category
    tamCategory(category) {
        if (!category) return '-';
        
        const categoryMap = {
            'under_500M': '<$500M',
            '500M_to_5B': '$500M-$5B',
            'over_5B': '>$5B'
        };
        
        return categoryMap[category] || category.replace(/_/g, ' ');
    },
    
    // Format CAGR category
    cagrCategory(category) {
        if (!category) return '-';
        
        const categoryMap = {
            'under_10': '<10%',
            '10_to_35': '10-35%',
            'over_35': '>35%'
        };
        
        return categoryMap[category] || category.replace(/_/g, ' ');
    },
    
    // Format competitor count breakdown
    competitorBreakdown(data) {
        if (!data) return { total: '-', breakdown: [] };
        
        const breakdown = [];
        
        if (data.large_companies) {
            breakdown.push(`${data.large_companies} Large`);
        }
        if (data.mid_size_companies) {
            breakdown.push(`${data.mid_size_companies} Mid-size`);
        }
        if (data.startups) {
            breakdown.push(`${data.startups} Startups`);
        }
        
        return {
            total: data.total || '-',
            breakdown: breakdown.join(', ')
        };
    },
    
    // Format market leaders list
    marketLeaders(leaders) {
        if (!leaders || !Array.isArray(leaders) || leaders.length === 0) {
            return 'None identified';
        }
        
        if (leaders.length <= 3) {
            return leaders.join(', ');
        }
        
        return `${leaders.slice(0, 3).join(', ')} (+${leaders.length - 3} more)`;
    },
    
    // Calculate and format score comparison
    scoreComparison(aiScore, userScore) {
        if (!aiScore || !userScore) return null;
        
        const diff = userScore - aiScore;
        
        if (diff === 0) {
            return { text: 'Agrees with AI', class: 'neutral' };
        } else if (diff > 0) {
            return { text: `+${diff} higher than AI`, class: 'higher' };
        } else {
            return { text: `${diff} lower than AI`, class: 'lower' };
        }
    }
};