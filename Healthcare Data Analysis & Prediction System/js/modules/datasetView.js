/**
 * Healthcare Data Analysis & Prediction System
 * Dataset Management View Module
 */

const DatasetView = {
    currentPage: 1,
    pageSize: 15,
    searchTerm: '',
    sortColumn: null,
    sortAsc: true,
    activeTab: 'preview', // 'preview' or 'statistics'
    selectedColumnForChart: null,
    distChartInstance: null,

    render() {
        const state = window.appState;
        const ds = state.activeDataset;
        const container = document.getElementById('view-container');
        if (!container) return;

        const stats = DatasetManager.calculateColumnStatistics(ds.activeData, ds.columns);
        const totalMissing = Object.values(stats).reduce((acc, s) => acc + s.missingCount, 0);
        const missingPct = ds.activeData.length > 0 && ds.columns.length > 0 ? 
            ((totalMissing / (ds.activeData.length * ds.columns.length)) * 100).toFixed(2) : 0;
        
        // Data health score: 100 - missing penalty
        const healthScore = Math.max(0, Math.min(100, Math.round(100 - (missingPct * 3))));

        container.innerHTML = `
            <div class="datasets-wrapper animate-fade-in">
                <!-- Dataset Header & Benchmark Selection -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Healthcare Dataset Repository</h2>
                            <p class="card-subtitle">Manage, explore, upload, and inspect clinical benchmark datasets</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-secondary btn-sm" onclick="DatasetManager.exportToCSV(appState.activeDataset.activeData, appState.activeDataset.columns, appState.activeDataset.id + '.csv')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Export Active CSV
                            </button>
                        </div>
                    </div>

                    <div class="card-body">
                        <!-- Dataset Selection Tabs & Upload -->
                        <div class="dataset-switcher-row">
                            <div class="dropdown-wrapper">
                                <label class="input-label">Select Healthcare Benchmark Dataset</label>
                                <select class="form-select" id="dataset-select" onchange="DatasetView.onDatasetChange(this.value)">
                                    ${this._renderDatasetOptions(ds.id)}
                                </select>
                            </div>

                            <div class="target-col-wrapper">
                                <label class="input-label">Target Outcome / Label Column</label>
                                <select class="form-select" id="target-select" onchange="DatasetView.onTargetChange(this.value)">
                                    ${ds.columns.map(c => `<option value="${c}" ${c === ds.targetColumn ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                            </div>

                            <div class="upload-btn-wrapper">
                                <label class="input-label">Upload Custom Healthcare CSV</label>
                                <label class="btn btn-primary btn-block upload-trigger-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    Upload CSV Dataset
                                    <input type="file" id="csv-file-input" accept=".csv" style="display: none;" onchange="DatasetView.handleFileUpload(event)">
                                </label>
                            </div>
                        </div>

                        <!-- Dropzone for Drag-and-Drop -->
                        <div class="drag-dropzone mt-3" id="csv-dropzone" 
                             ondragover="DatasetView.handleDragOver(event)" 
                             ondragleave="DatasetView.handleDragLeave(event)" 
                             ondrop="DatasetView.handleDrop(event)">
                            <div class="dropzone-inner">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="12" y1="18" x2="12" y2="12"></line>
                                    <polyline points="9 15 12 12 15 15"></polyline>
                                </svg>
                                <span>Drag and drop any clinical CSV dataset here, or use the upload button above.</span>
                            </div>
                        </div>

                        <!-- Dataset Summary Metrics Strip -->
                        <div class="summary-metrics-strip mt-4">
                            <div class="summary-metric-item">
                                <span class="metric-muted">Dataset Name</span>
                                <strong class="metric-strong text-truncate">${ds.name}</strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Total Patients</span>
                                <strong class="metric-strong text-cyan">${ds.activeData.length.toLocaleString()} rows</strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Features</span>
                                <strong class="metric-strong text-teal">${ds.columns.length} columns</strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Missing Values</span>
                                <strong class="metric-strong ${totalMissing > 0 ? 'text-amber' : 'text-green'}">
                                    ${totalMissing} (${missingPct}%)
                                </strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Data Quality Score</span>
                                <strong class="metric-strong ${healthScore > 85 ? 'text-green' : 'text-amber'}">
                                    ${healthScore} / 100
                                </strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Pipeline Status</span>
                                <div>${ds.isPreprocessed ? '<span class="badge badge-success">Preprocessed</span>' : '<span class="badge badge-neutral">Raw Baseline</span>'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabs: Data Table Preview vs Statistical Profiling -->
                <div class="card">
                    <div class="card-header border-bottom">
                        <div class="tab-pill-group">
                            <button class="tab-pill ${this.activeTab === 'preview' ? 'active' : ''}" onclick="DatasetView.switchTab('preview')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                                Tabular Patient Records Preview
                            </button>
                            <button class="tab-pill ${this.activeTab === 'statistics' ? 'active' : ''}" onclick="DatasetView.switchTab('statistics')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                                Clinical Feature Statistics & Distribution
                            </button>
                        </div>

                        ${this.activeTab === 'preview' ? `
                            <div class="table-search-box">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input type="text" placeholder="Search patient records..." value="${this.searchTerm}" oninput="DatasetView.onSearch(this.value)">
                            </div>
                        ` : ''}
                    </div>

                    <div class="card-body p-0">
                        ${this.activeTab === 'preview' ? this._renderTablePreview(ds) : this._renderStatisticsView(ds, stats)}
                    </div>
                </div>
            </div>
        `;

        if (this.activeTab === 'statistics') {
            this._renderColumnDistributionChart();
        }
    },

    _renderDatasetOptions(activeId) {
        if (typeof PRELOADED_DATASETS === 'undefined') return '';
        let html = '';
        for (let key in PRELOADED_DATASETS) {
            const ds = PRELOADED_DATASETS[key];
            html += `<option value="${ds.id}" ${ds.id === activeId ? 'selected' : ''}>${ds.name} [${ds.defaultTask.toUpperCase()}]</option>`;
        }
        return html;
    },

    onDatasetChange(id) {
        DatasetManager.loadPreloaded(id);
        this.currentPage = 1;
        this.selectedColumnForChart = null;
        this.render();
    },

    onTargetChange(targetCol) {
        window.appState.activeDataset.targetColumn = targetCol;
        this.render();
    },

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            DatasetManager.handleFileUpload(file, () => {
                this.currentPage = 1;
                this.selectedColumnForChart = null;
                this.render();
            });
        }
    },

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('csv-dropzone')?.classList.add('drag-active');
    },

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('csv-dropzone')?.classList.remove('drag-active');
    },

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('csv-dropzone')?.classList.remove('drag-active');
        const file = e.dataTransfer.files[0];
        if (file) {
            DatasetManager.handleFileUpload(file, () => {
                this.currentPage = 1;
                this.selectedColumnForChart = null;
                this.render();
            });
        }
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.render();
    },

    onSearch(term) {
        this.searchTerm = term.toLowerCase();
        this.currentPage = 1;
        this.render();
    },

    sortBy(column) {
        if (this.sortColumn === column) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortColumn = column;
            this.sortAsc = true;
        }
        this.render();
    },

    setPage(page) {
        this.currentPage = page;
        this.render();
    },

    _renderTablePreview(ds) {
        let rows = [...ds.activeData];

        // Search filter
        if (this.searchTerm) {
            rows = rows.filter(row => {
                return ds.columns.some(col => {
                    const val = String(row[col] ?? '').toLowerCase();
                    return val.includes(this.searchTerm);
                });
            });
        }

        // Sorting
        if (this.sortColumn) {
            rows.sort((a, b) => {
                let valA = a[this.sortColumn];
                let valB = b[this.sortColumn];
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return this.sortAsc ? valA - valB : valB - valA;
                }
                valA = String(valA ?? '');
                valB = String(valB ?? '');
                return this.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }

        const totalFiltered = rows.length;
        const totalPages = Math.ceil(totalFiltered / this.pageSize) || 1;
        const start = (this.currentPage - 1) * this.pageSize;
        const paginatedRows = rows.slice(start, start + this.pageSize);

        return `
            <div class="table-responsive">
                <table class="clinical-data-table">
                    <thead>
                        <tr>
                            <th class="row-num-col">#</th>
                            ${ds.columns.map(col => {
                                const isTarget = col === ds.targetColumn;
                                const isSorted = this.sortColumn === col;
                                const sortIcon = isSorted ? (this.sortAsc ? '▲' : '▼') : '';
                                return `
                                    <th class="${isTarget ? 'th-target' : ''}" onclick="DatasetView.sortBy('${col}')">
                                        <div class="th-content">
                                            <span>${col} ${isTarget ? '<span class="target-tag">Target</span>' : ''}</span>
                                            <span class="sort-indicator">${sortIcon}</span>
                                        </div>
                                    </th>
                                `;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedRows.length === 0 ? `
                            <tr><td colspan="${ds.columns.length + 1}" class="text-center p-4">No matching patient records found.</td></tr>
                        ` : paginatedRows.map((row, idx) => `
                            <tr>
                                <td class="row-num-cell">${start + idx + 1}</td>
                                ${ds.columns.map(col => {
                                    const val = row[col];
                                    const isTarget = col === ds.targetColumn;
                                    const isNull = val === null || val === undefined || val === '' || val === '?';
                                    
                                    if (isNull) return `<td class="cell-missing"><span class="missing-badge">NULL</span></td>`;
                                    if (isTarget) return `<td class="cell-target"><strong>${val}</strong></td>`;
                                    return `<td>${typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(2) : val}</td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Pagination Bar -->
            <div class="table-pagination-footer">
                <div class="pagination-info">
                    Showing <strong>${Math.min(totalFiltered, start + 1)}</strong> to <strong>${Math.min(totalFiltered, start + this.pageSize)}</strong> of <strong>${totalFiltered}</strong> records
                    ${this.searchTerm ? `(filtered from ${ds.activeData.length} total)` : ''}
                </div>
                <div class="pagination-controls">
                    <button class="btn btn-secondary btn-sm" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="DatasetView.setPage(${this.currentPage - 1})">
                        &larr; Prev
                    </button>
                    <span class="page-badge">Page ${this.currentPage} of ${totalPages}</span>
                    <button class="btn btn-secondary btn-sm" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="DatasetView.setPage(${this.currentPage + 1})">
                        Next &rarr;
                    </button>
                </div>
            </div>
        `;
    },

    _renderStatisticsView(ds, stats) {
        if (!this.selectedColumnForChart && ds.columns.length > 0) {
            this.selectedColumnForChart = ds.targetColumn || ds.columns[0];
        }

        return `
            <div class="statistics-view-wrapper p-4">
                <!-- Column Distribution Chart on Top -->
                <div class="stat-chart-panel card mb-4">
                    <div class="card-header">
                        <div>
                            <h4 class="card-title">Feature Distribution Explorer</h4>
                            <p class="card-subtitle">Click any column below to visualize its distribution</p>
                        </div>
                        <div class="select-col-dropdown">
                            <label class="mr-2">Selected Feature:</label>
                            <select class="form-select" onchange="DatasetView.onSelectChartColumn(this.value)">
                                ${ds.columns.map(c => `<option value="${c}" ${c === this.selectedColumnForChart ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="card-body">
                        <div style="height: 240px; position: relative;">
                            <canvas id="columnDistributionChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Comprehensive Statistics Table -->
                <h4 class="mb-3">Clinical Attribute Profiling Table</h4>
                <div class="table-responsive">
                    <table class="clinical-data-table stats-table">
                        <thead>
                            <tr>
                                <th>Feature Name</th>
                                <th>Data Type</th>
                                <th>Missing Values</th>
                                <th>Unique Count</th>
                                <th>Mean</th>
                                <th>Median</th>
                                <th>Std Dev</th>
                                <th>Min</th>
                                <th>25% (Q1)</th>
                                <th>75% (Q3)</th>
                                <th>Max</th>
                                <th>Skewness</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ds.columns.map(col => {
                                const s = stats[col];
                                if (!s) return '';
                                const isNum = s.type === 'Numeric';
                                const isSelected = col === this.selectedColumnForChart;

                                return `
                                    <tr class="${isSelected ? 'tr-selected' : ''}">
                                        <td>
                                            <strong>${col}</strong>
                                            ${col === ds.targetColumn ? '<span class="target-tag">Target</span>' : ''}
                                        </td>
                                        <td><span class="badge ${isNum ? 'badge-info' : 'badge-neutral'}">${s.type}</span></td>
                                        <td>
                                            <span class="${s.missingCount > 0 ? 'text-amber' : 'text-green'}">
                                                ${s.missingCount} (${s.missingPercent}%)
                                            </span>
                                        </td>
                                        <td>${s.uniqueCount}</td>
                                        <td>${isNum ? s.mean : '-'}</td>
                                        <td>${isNum ? s.median : (s.topCategory || '-')}</td>
                                        <td>${isNum ? s.std : '-'}</td>
                                        <td>${isNum ? s.min : '-'}</td>
                                        <td>${isNum ? s.q1 : '-'}</td>
                                        <td>${isNum ? s.q3 : '-'}</td>
                                        <td>${isNum ? s.max : '-'}</td>
                                        <td>${isNum ? s.skewness : '-'}</td>
                                        <td>
                                            <button class="btn btn-ghost btn-xs" onclick="DatasetView.onSelectChartColumn('${col}')">
                                                View Plot
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    onSelectChartColumn(col) {
        this.selectedColumnForChart = col;
        this.render();
    },

    _renderColumnDistributionChart() {
        const col = this.selectedColumnForChart;
        const ds = window.appState.activeDataset;
        const ctx = document.getElementById('columnDistributionChart');
        if (!ctx || !col || typeof Chart === 'undefined') return;

        if (this.distChartInstance) {
            this.distChartInstance.destroy();
        }

        const vals = ds.activeData.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '' && v !== '?');
        const numVals = vals.map(Number).filter(v => !isNaN(v));
        const isNumeric = numVals.length >= vals.length * 0.7 && numVals.length > 0;

        let labels = [];
        let data = [];

        if (isNumeric) {
            // Create 10 histogram bins
            const mn = MathUtils.min(numVals);
            const mx = MathUtils.max(numVals);
            const numBins = 10;
            const step = (mx - mn) / numBins || 1;

            const bins = new Array(numBins).fill(0);
            const binLabels = [];
            for (let i = 0; i < numBins; i++) {
                const bStart = mn + i * step;
                const bEnd = mn + (i + 1) * step;
                binLabels.push(`${bStart.toFixed(1)} - ${bEnd.toFixed(1)}`);
            }

            numVals.forEach(v => {
                let binIdx = Math.floor((v - mn) / step);
                if (binIdx >= numBins) binIdx = numBins - 1;
                if (binIdx < 0) binIdx = 0;
                bins[binIdx]++;
            });

            labels = binLabels;
            data = bins;
        } else {
            // Categorical frequency
            const freq = {};
            vals.forEach(v => freq[v] = (freq[v] || 0) + 1);
            labels = Object.keys(freq).slice(0, 15);
            data = labels.map(l => freq[l]);
        }

        this.distChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: `Frequency of ${col}`,
                    data,
                    backgroundColor: 'rgba(14, 165, 233, 0.75)',
                    borderColor: 'rgba(14, 165, 233, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Patient Count' }
                    },
                    x: {
                        title: { display: true, text: col }
                    }
                }
            }
        });
    }
};

if (typeof window !== 'undefined') window.DatasetView = DatasetView;
