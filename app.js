// Alumni Dashboard JavaScript - CORRECTED VERSION

class AlumniDashboard {
    constructor() {
        this.alumniData = [];
        this.filteredData = [];
        this.batchDistribution = [];
        this.stateDistribution = [];
        this.summaryStats = {};
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.currentTheme = 'dark';
        this.charts = {};
        
        this.init();
    }

    async init() {
        this.showLoading(true);
        
        try {
            await this.loadCorrectedData();
            this.setupEventListeners();
            this.updateSummaryStats();
            this.initializeCharts();
            this.renderStateDistribution();
            this.populateFilters();
            this.renderTable();
            this.setupPagination();
            
            setTimeout(() => {
                this.showLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Failed to load corrected alumni data');
            this.showLoading(false);
        }
    }

    async loadCorrectedData() {
        try {
            console.log('Loading corrected alumni data from Excel...');
            
            // Load the corrected data from the provided asset
            const response = await fetch('https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/ac6b6eb251b63e635b5136300edbd758/1e207528-84b7-4e84-acb6-cf8df580adf0/97d5c1d8.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Loaded data structure:', Object.keys(data));
            
            // Extract the corrected data
            this.alumniData = data.alumni_data || [];
            this.batchDistribution = data.batch_distribution || [];
            this.stateDistribution = data.state_distribution || [];
            this.summaryStats = data.summary_stats || {};
            
            console.log(`Loaded ${this.alumniData.length} alumni records`);
            console.log('Sample alumni names:', this.alumniData.slice(0, 5).map(a => a.name));
            console.log('Batch distribution:', this.batchDistribution);
            console.log('Summary stats:', this.summaryStats);
            
            this.filteredData = [...this.alumniData];
            
        } catch (error) {
            console.error('Error loading corrected data:', error);
            throw error;
        }
    }

    updateSummaryStats() {
        // Update the summary statistics cards with exact data
        document.getElementById('totalAlumniCount').textContent = this.summaryStats.total_alumni || this.alumniData.length;
        document.getElementById('totalBatches').textContent = this.summaryStats.total_batches || 16;
        document.getElementById('supportYesCount').textContent = this.summaryStats.support_yes || 0;
        document.getElementById('statesCount').textContent = this.summaryStats.states_represented || 0;
    }

    setupEventListeners() {
        // Theme toggle - both toggle button and labels
        const themeToggle = document.getElementById('themeToggle');
        const themeLabels = document.querySelectorAll('.theme-label');
        
        themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Make theme labels clickable
        themeLabels.forEach(label => {
            label.addEventListener('click', () => this.toggleTheme());
        });

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        const mobileNavClose = document.getElementById('mobileNavClose');

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileNavOverlay.style.display = 'block';
                setTimeout(() => mobileNavOverlay.classList.add('active'), 10);
            });
        }

        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', () => this.closeMobileMenu());
        }
        
        if (mobileNavOverlay) {
            mobileNavOverlay.addEventListener('click', (e) => {
                if (e.target === mobileNavOverlay) this.closeMobileMenu();
            });
        }

        // Search and filters
        const searchInput = document.getElementById('searchInput');
        const batchFilter = document.getElementById('batchFilter');
        const stateFilter = document.getElementById('stateFilter');
        const supportFilter = document.getElementById('supportFilter');

        searchInput.addEventListener('input', () => this.applyFilters());
        batchFilter.addEventListener('change', () => this.applyFilters());
        stateFilter.addEventListener('change', () => this.applyFilters());
        supportFilter.addEventListener('change', () => this.applyFilters());

        // Export PDF
        const exportBtn = document.getElementById('exportPDF');
        exportBtn.addEventListener('click', () => this.exportToPDF());

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        prevPage.addEventListener('click', () => this.changePage(-1));
        nextPage.addEventListener('click', () => this.changePage(1));

        // Table sorting
        const tableHeaders = document.querySelectorAll('.alumni-table th[data-sort]');
        tableHeaders.forEach(header => {
            header.addEventListener('click', () => this.sortTable(header.dataset.sort));
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', this.currentTheme);
        
        // Update charts with new theme
        this.updateChartsTheme();
    }

    closeMobileMenu() {
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        if (mobileNavOverlay) {
            mobileNavOverlay.classList.remove('active');
            setTimeout(() => mobileNavOverlay.style.display = 'none', 300);
        }
    }

    initializeCharts() {
        this.createBatchChart();
        this.createSupportChart();
    }

    createBatchChart() {
        const ctx = document.getElementById('batchChart').getContext('2d');
        
        // Use the exact batch distribution from loaded data
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
        
        this.charts.batchChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.batchDistribution.map(item => item.batch),
                datasets: [{
                    label: 'Alumni Count',
                    data: this.batchDistribution.map(item => item.count),
                    backgroundColor: colors,
                    borderColor: colors.map(color => color + '80'),
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                if (context.label === 'B-13') {
                                    return 'COVID-19 Impact Year';
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.currentTheme === 'dark' ? '#333' : '#e5e5e5'
                        },
                        ticks: {
                            color: this.currentTheme === 'dark' ? '#b0b0b0' : '#475569'
                        }
                    },
                    x: {
                        grid: {
                            color: this.currentTheme === 'dark' ? '#333' : '#e5e5e5'
                        },
                        ticks: {
                            color: this.currentTheme === 'dark' ? '#b0b0b0' : '#475569'
                        }
                    }
                }
            }
        });
    }

    createSupportChart() {
        const ctx = document.getElementById('supportChart').getContext('2d');
        
        // Use exact support data from summary stats
        const supportData = [
            { label: 'Yes', count: this.summaryStats.support_yes || 0, color: '#10b981' },
            { label: 'No', count: this.summaryStats.support_no || 0, color: '#ef4444' },
            { label: 'Unknown', count: this.summaryStats.support_unknown || 0, color: '#6b7280' }
        ];

        this.charts.supportChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: supportData.map(item => item.label),
                datasets: [{
                    data: supportData.map(item => item.count),
                    backgroundColor: supportData.map(item => item.color),
                    borderColor: this.currentTheme === 'dark' ? '#1a1a1a' : '#ffffff',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: this.currentTheme === 'dark' ? '#b0b0b0' : '#475569',
                            padding: 20,
                            usePointStyle: true,
                        }
                    }
                }
            }
        });
    }

    renderStateDistribution() {
        const stateList = document.getElementById('stateList');
        if (!stateList) return;

        stateList.innerHTML = '';
        
        // Use the exact state distribution data
        this.stateDistribution.forEach(stateData => {
            const stateItem = document.createElement('div');
            stateItem.className = 'state-item';
            
            // Calculate percentage for progress bar
            const percentage = (stateData.count / this.summaryStats.total_alumni) * 100;
            
            stateItem.innerHTML = `
                <div class="state-info">
                    <div class="state-name">${stateData.state}</div>
                    <div class="state-count">${stateData.count} alumni (${stateData.percentage.toFixed(1)}%)</div>
                </div>
                <div class="state-progress">
                    <div class="state-progress-bar" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
            `;
            
            stateItem.addEventListener('click', () => {
                this.filterByState(stateData.state);
            });
            
            stateList.appendChild(stateItem);
        });
    }

    filterByState(stateName) {
        const stateFilter = document.getElementById('stateFilter');
        stateFilter.value = stateName;
        this.applyFilters();
        
        // Scroll to table
        document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth' });
    }

    updateChartsTheme() {
        Object.values(this.charts).forEach(chart => {
            if (chart.options.scales) {
                // Update axis colors
                if (chart.options.scales.y) {
                    chart.options.scales.y.grid.color = this.currentTheme === 'dark' ? '#333' : '#e5e5e5';
                    chart.options.scales.y.ticks.color = this.currentTheme === 'dark' ? '#b0b0b0' : '#475569';
                }
                if (chart.options.scales.x) {
                    chart.options.scales.x.grid.color = this.currentTheme === 'dark' ? '#333' : '#e5e5e5';
                    chart.options.scales.x.ticks.color = this.currentTheme === 'dark' ? '#b0b0b0' : '#475569';
                }
            }
            
            // Update legend colors
            if (chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = this.currentTheme === 'dark' ? '#b0b0b0' : '#475569';
            }
            
            chart.update();
        });
    }

    populateFilters() {
        const batchFilter = document.getElementById('batchFilter');
        const stateFilter = document.getElementById('stateFilter');
        
        // Populate batch filter with exact batches from data
        const batches = [...new Set(this.alumniData.map(alumni => alumni.batch))].sort();
        batches.forEach(batch => {
            const option = document.createElement('option');
            option.value = batch;
            option.textContent = batch;
            batchFilter.appendChild(option);
        });
        
        // Populate state filter with exact states from data
        const states = [...new Set(this.alumniData.map(alumni => alumni.state))].sort();
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateFilter.appendChild(option);
        });
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const batchFilter = document.getElementById('batchFilter').value;
        const stateFilter = document.getElementById('stateFilter').value;
        const supportFilter = document.getElementById('supportFilter').value;
        
        this.filteredData = this.alumniData.filter(alumni => {
            const matchesSearch = alumni.name.toLowerCase().includes(searchTerm) ||
                                (alumni.designation && alumni.designation.toLowerCase().includes(searchTerm)) ||
                                (alumni.org_name && alumni.org_name.toLowerCase().includes(searchTerm)) ||
                                (alumni.mobile && alumni.mobile.toString().includes(searchTerm));
            const matchesBatch = !batchFilter || alumni.batch === batchFilter;
            const matchesState = !stateFilter || alumni.state === stateFilter;
            const matchesSupport = !supportFilter || alumni.support_status === supportFilter;
            
            return matchesSearch && matchesBatch && matchesState && matchesSupport;
        });
        
        this.currentPage = 1;
        this.renderTable();
        this.setupPagination();
    }

    sortTable(column) {
        const sortKey = {
            'name': 'name',
            'batch': 'batch',
            'state': 'state',
            'organization': 'org_name',
            'designation': 'designation',
            'mobile': 'mobile',
            'support': 'support_status'
        }[column];
        
        this.filteredData.sort((a, b) => {
            const aVal = a[sortKey] || '';
            const bVal = b[sortKey] || '';
            
            if (sortKey === 'mobile') {
                return parseInt(aVal) - parseInt(bVal);
            }
            
            return aVal.toString().localeCompare(bVal.toString());
        });
        
        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('alumniTableBody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        tbody.innerHTML = '';
        
        pageData.forEach(alumni => {
            const row = document.createElement('tr');
            
            const supportIndicator = alumni.support_status === 'Yes' 
                ? `<span class="support-indicator">
                     <span class="support-dot"></span>
                     ${alumni.name}
                   </span>`
                : alumni.name;
            
            // Format mobile number
            const mobileFormatted = alumni.mobile ? 
                (alumni.mobile.toString().startsWith('+91') ? 
                    alumni.mobile : 
                    `+91-${alumni.mobile.toString().replace(/^(\d{3})(\d{3})(\d{4})$/, '$1$2$3')}`) 
                : 'N/A';
            
            row.innerHTML = `
                <td>${supportIndicator}</td>
                <td>${alumni.batch}</td>
                <td>${alumni.state}</td>
                <td>${alumni.org_name || 'N/A'}</td>
                <td>${alumni.designation || 'N/A'}</td>
                <td>${mobileFormatted}</td>
                <td>
                    <span class="status status--${alumni.support_status.toLowerCase()}">
                        ${alumni.support_status}
                    </span>
                </td>
                <td>
                    <a href="${alumni.linkedin}" target="_blank" class="linkedin-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        Connect
                    </a>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Update pagination info
        document.getElementById('showingStart').textContent = startIndex + 1;
        document.getElementById('showingEnd').textContent = Math.min(endIndex, this.filteredData.length);
        document.getElementById('totalRecords').textContent = this.filteredData.length;
    }

    setupPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const pageNumbers = document.getElementById('pageNumbers');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        pageNumbers.innerHTML = '';
        
        // Create page number buttons
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.renderTable();
                this.setupPagination();
            });
            pageNumbers.appendChild(pageBtn);
        }
        
        // Update navigation buttons
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const newPage = this.currentPage + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.renderTable();
            this.setupPagination();
        }
    }

    exportToPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add header
            doc.setFontSize(20);
            doc.setTextColor(33, 128, 141);
            doc.text('Alumni Dashboard Report - CORRECTED', 20, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
            doc.text(`Total Alumni: ${this.summaryStats.total_alumni}`, 20, 45);
            
            // Add summary stats
            doc.text('Summary Statistics:', 20, 65);
            doc.text(`Total Alumni: ${this.summaryStats.total_alumni}`, 30, 75);
            doc.text(`Total Batches: ${this.summaryStats.total_batches}`, 30, 85);
            doc.text(`Supporting Mentoring: ${this.summaryStats.support_yes}`, 30, 95);
            doc.text(`States Represented: ${this.summaryStats.states_represented}`, 30, 105);
            
            // Add sample alumni list
            doc.text('Sample Alumni (First 20 records):', 20, 125);
            let yPos = 140;
            
            this.filteredData.slice(0, 20).forEach((alumni, index) => {
                const text = `${alumni.name} - ${alumni.batch} - ${alumni.state} - ${alumni.support_status}`;
                doc.text(text, 20, yPos);
                yPos += 8;
                
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
            });
            
            // Save the PDF
            doc.save('corrected-alumni-dashboard-report.pdf');
            
            // Show success message
            this.showNotification('PDF exported successfully!', 'success');
            
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showNotification('Error exporting PDF. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-${type === 'success' ? 'success' : type === 'error' ? 'error' : 'primary'});
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-md);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.add('visible');
        } else {
            spinner.classList.remove('visible');
        }
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        const errorContent = errorElement.querySelector('.error-content p');
        if (errorContent) {
            errorContent.textContent = message;
        }
        errorElement.style.display = 'block';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Corrected Alumni Dashboard...');
    new AlumniDashboard();
});

// Add smooth scrolling for anchor links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

// Handle window resize for responsive design
window.addEventListener('resize', () => {
    // Update charts on resize
    if (window.chartInstances) {
        Object.values(window.chartInstances).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    // ESC key to close mobile menu
    if (e.key === 'Escape') {
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        if (mobileNavOverlay && mobileNavOverlay.classList.contains('active')) {
            mobileNavOverlay.classList.remove('active');
            setTimeout(() => mobileNavOverlay.style.display = 'none', 300);
        }
    }
});

// Log when the script is loaded
console.log('Corrected Alumni Dashboard script loaded successfully');