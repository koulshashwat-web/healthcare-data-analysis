/**
 * Healthcare Data Analysis & Prediction System
 * Dashboard View Module
 */

const DashboardView = {
    chartInstances: {},

    render() {
        const state = window.appState;
        const ds = state.activeDataset;
        const dataCount = ds.activeData.length;
        const colCount = ds.columns.length;
        const preprocessedBadge = ds.isPreprocessed ? 
            '<span class="badge badge-success"><i class="icon-check"></i> Preprocessed Pipeline Active</span>' : 
            '<span class="badge badge-neutral"><i class="icon-info"></i> Raw Baseline Data</span>';

        const modelsCount = Object.keys(state.trainedModels.classification).length + 
                            Object.keys(state.trainedModels.regression).length + 
                            Object.keys(state.trainedModels.clustering).length + 
                            (state.trainedModels.association ? 1 : 0);

        const container = document.getElementById('view-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-wrapper animate-fade-in">
                <!-- Medical Disclaimer Header Banner -->
                <div class="clinical-disclaimer-banner">
                    <div class="disclaimer-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="M12 8v4"></path>
                            <path d="M12 16h.01"></path>
                        </svg>
                    </div>
                    <div class="disclaimer-content">
                        <strong>Clinical & Educational Disclaimer:</strong>
                        <span>This platform is designed strictly for academic research, health data mining education, and statistical experimentation. Outputs do not constitute medical diagnosis, clinical prognosis, or treatment protocols. Always consult qualified clinical healthcare professionals.</span>
                    </div>
                </div>

                <!-- KPI Quick Glance Cards -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper kpi-teal">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                        </div>
                        <div class="kpi-details">
                            <div class="kpi-label">Active Cohort / Dataset</div>
                            <div class="kpi-value text-truncate" title="${ds.name}">${ds.name}</div>
                            <div class="kpi-subtext">${preprocessedBadge}</div>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper kpi-cyan">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div class="kpi-details">
                            <div class="kpi-label">Patient Records</div>
                            <div class="kpi-value">${dataCount.toLocaleString()}</div>
                            <div class="kpi-subtext">Clinical cohort instances</div>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper kpi-blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                        </div>
                        <div class="kpi-details">
                            <div class="kpi-label">Clinical Features</div>
                            <div class="kpi-value">${colCount}</div>
                            <div class="kpi-subtext">Target: <strong class="text-accent">${ds.targetColumn || 'None'}</strong></div>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper kpi-purple">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                        </div>
                        <div class="kpi-details">
                            <div class="kpi-label">Trained ML Models</div>
                            <div class="kpi-value">${modelsCount}</div>
                            <div class="kpi-subtext">Across Classification, Reg & Clust</div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="dashboard-grid">
                    <!-- Left: Clinical Dataset Switcher & Details -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Clinical Benchmark Repositories</h3>
                                <p class="card-subtitle">Select standard open healthcare datasets or upload custom data</p>
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="app.navigateTo('datasets')">
                                Manage Datasets &rarr;
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="benchmark-pills-grid" id="dashboard-datasets-list">
                                ${this._renderDatasetPills(ds.id)}
                            </div>

                            <div class="active-dataset-callout mt-4">
                                <div class="callout-header">
                                    <div class="callout-title">
                                        <span class="pulse-indicator"></span>
                                        <strong>${ds.name}</strong>
                                    </div>
                                    <span class="badge badge-primary">${ds.defaultTask.toUpperCase()}</span>
                                </div>
                                <p class="callout-desc">${ds.description || 'Clinical parameters extracted for medical data mining and outcome prediction.'}</p>
                                
                                <div class="callout-actions">
                                    <button class="btn btn-primary btn-sm" onclick="app.navigateTo('preprocessing')">
                                        <i class="icon-sliders"></i> Preprocess Cohort
                                    </button>
                                    <button class="btn btn-secondary btn-sm" onclick="app.navigateTo('${ds.defaultTask === 'regression' ? 'regression' : (ds.defaultTask === 'association' ? 'association' : 'classification')}')">
                                        <i class="icon-cpu"></i> Train ${ds.defaultTask.toUpperCase()} Models
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Cohort Feature Distribution / Correlation Preview -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Patient Cohort Distribution</h3>
                                <p class="card-subtitle">Visual overview of key target or risk distribution</p>
                            </div>
                            <span class="badge badge-info">Real-time Analytics</span>
                        </div>
                        <div class="card-body">
                            <div class="chart-container" style="height: 260px; position: relative;">
                                <canvas id="dashboardTargetChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Secondary Grid: Analysis History & Workflow Navigation -->
                <div class="dashboard-grid mt-4">
                    <!-- Workflow Guidance Card -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Healthcare Data Mining Pipeline</h3>
                                <p class="card-subtitle">Step-by-step end-to-end analytical workflow</p>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="pipeline-stepper">
                                <div class="step-node completed" onclick="app.navigateTo('datasets')">
                                    <div class="step-num">1</div>
                                    <div class="step-info">
                                        <div class="step-title">Cohort Ingestion</div>
                                        <div class="step-desc">Upload or choose healthcare dataset</div>
                                    </div>
                                </div>
                                <div class="step-node ${ds.isPreprocessed ? 'completed' : 'active'}" onclick="app.navigateTo('preprocessing')">
                                    <div class="step-num">2</div>
                                    <div class="step-info">
                                        <div class="step-title">Clinical Preprocessing</div>
                                        <div class="step-desc">Imputation, encoding, scaling & outliers</div>
                                    </div>
                                </div>
                                <div class="step-node ${modelsCount > 0 ? 'completed' : ''}" onclick="app.navigateTo('classification')">
                                    <div class="step-num">3</div>
                                    <div class="step-info">
                                        <div class="step-title">ML Modeling</div>
                                        <div class="step-desc">Classification, regression & clustering</div>
                                    </div>
                                </div>
                                <div class="step-node" onclick="app.navigateTo('comparison')">
                                    <div class="step-num">4</div>
                                    <div class="step-info">
                                        <div class="step-title">Clinical Comparison & Audit</div>
                                        <div class="step-desc">Cross-algorithm benchmarks & report export</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Analysis History Feed -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Recent Analytical Executions</h3>
                                <p class="card-subtitle">Audit trail of trained models and experiments</p>
                            </div>
                            <button class="btn btn-ghost btn-sm" onclick="app.navigateTo('comparison')">
                                Full Benchmarks &rarr;
                            </button>
                        </div>
                        <div class="card-body p-0">
                            <div class="history-feed" id="dashboard-history-feed">
                                ${this._renderHistoryFeed(state.analysisHistory)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._renderCharts();
    },

    _renderDatasetPills(activeId) {
        if (typeof PRELOADED_DATASETS === 'undefined') return '';
        return Object.keys(PRELOADED_DATASETS).map(key => {
            const item = PRELOADED_DATASETS[key];
            const isSelected = item.id === activeId;
            return `
                <div class="benchmark-pill ${isSelected ? 'selected' : ''}" onclick="DashboardView.selectBenchmark('${item.id}')">
                    <div class="pill-top">
                        <span class="pill-badge pill-${item.defaultTask}">${item.defaultTask}</span>
                        ${isSelected ? '<span class="pill-active-icon">✓</span>' : ''}
                    </div>
                    <div class="pill-name">${item.name}</div>
                </div>
            `;
        }).join('');
    },

    _renderHistoryFeed(history) {
        if (!history || history.length === 0) {
            return `
                <div class="empty-state p-4">
                    <div class="empty-state-icon">⏱️</div>
                    <p class="empty-state-text">No models executed yet. Navigate to Classification, Regression, or Clustering to train algorithms.</p>
                </div>
            `;
        }

        return `
            <div class="feed-list">
                ${history.slice(0, 6).map(h => {
                    let scoreText = '';
                    if (h.metrics.accuracy !== undefined) scoreText = `Acc: ${(h.metrics.accuracy * 100).toFixed(1)}% | F1: ${(h.metrics.f1Score * 100).toFixed(1)}%`;
                    else if (h.metrics.r2 !== undefined) scoreText = `R²: ${h.metrics.r2.toFixed(3)} | RMSE: ${h.metrics.rmse.toFixed(2)}`;
                    else if (h.metrics.silhouetteScore !== undefined) scoreText = `Silhouette: ${h.metrics.silhouetteScore.toFixed(3)}`;
                    else if (h.metrics.rulesCount !== undefined) scoreText = `${h.metrics.rulesCount} Rules mined`;

                    return `
                        <div class="feed-item">
                            <div class="feed-badge feed-${h.category}">${h.category.toUpperCase().slice(0, 5)}</div>
                            <div class="feed-details">
                                <div class="feed-algo"><strong>${h.algorithm}</strong> <span class="feed-time">${h.timestamp}</span></div>
                                <div class="feed-score">${scoreText}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    selectBenchmark(id) {
        DatasetManager.loadPreloaded(id);
        this.render();
    },

    _renderCharts() {
        const state = window.appState;
        const ds = state.activeDataset;
        const ctx = document.getElementById('dashboardTargetChart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.chartInstances.targetChart) {
            this.chartInstances.targetChart.destroy();
        }

        const data = ds.activeData;
        const targetCol = ds.targetColumn;

        if (!targetCol || data.length === 0) return;

        // Extract distribution of target column
        const counts = {};
        data.forEach(r => {
            const v = r[targetCol];
            const k = (v === null || v === undefined) ? 'Missing' : String(v);
            counts[k] = (counts[k] || 0) + 1;
        });

        const labels = Object.keys(counts);
        const values = Object.values(counts);

        // Friendly medical colors
        const bgColors = [
            'rgba(14, 165, 233, 0.85)',
            'rgba(239, 68, 68, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(139, 92, 246, 0.85)'
        ];

        this.chartInstances.targetChart = new Chart(ctx, {
            type: labels.length <= 4 ? 'doughnut' : 'bar',
            data: {
                labels: labels.map(l => {
                    if (l === '0') return 'Class 0 (Negative / Healthy)';
                    if (l === '1') return 'Class 1 (Positive / At Risk)';
                    return l;
                }),
                datasets: [{
                    label: `Distribution of ${targetCol}`,
                    data: values,
                    backgroundColor: bgColors.slice(0, labels.length),
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#334155',
                            font: { family: "'Inter', sans-serif", size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(item) {
                                const total = values.reduce((a, b) => a + b, 0);
                                const pct = ((item.raw / total) * 100).toFixed(1);
                                return ` Patients: ${item.raw} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
};

if (typeof window !== 'undefined') window.DashboardView = DashboardView;
