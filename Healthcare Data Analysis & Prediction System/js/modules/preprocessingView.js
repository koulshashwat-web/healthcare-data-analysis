/**
 * Healthcare Data Analysis & Prediction System
 * Data Preprocessing View Module
 */

const PreprocessingView = {
    selectedTab: 'imputation', // imputation, duplicates, encoding, scaling, outliers, feature_selection
    comparisonChart: null,

    render() {
        const state = window.appState;
        const ds = state.activeDataset;
        const prep = state.preprocessor;
        const container = document.getElementById('view-container');
        if (!container) return;

        const metrics = prep.getComparisonMetrics();
        const steps = prep.pipelineSteps;

        container.innerHTML = `
            <div class="preprocessing-wrapper animate-fade-in">
                <!-- Preprocessing Header & Action Bar -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Clinical Data Preprocessing Pipeline</h2>
                            <p class="card-subtitle">Clean, impute, encode, scale, and engineer healthcare data for robust modeling</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-secondary btn-sm" onclick="PreprocessingView.resetPipeline()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                                Reset to Baseline
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="PreprocessingView.applyAndSave()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Apply & Save to Active Pipeline
                            </button>
                        </div>
                    </div>

                    <div class="card-body">
                        <!-- Before vs After Comparison Summary Strip -->
                        <div class="summary-metrics-strip">
                            <div class="summary-metric-item">
                                <span class="metric-muted">Original Rows / Cols</span>
                                <strong class="metric-strong">${metrics ? metrics.raw.rowCount : 0} / ${metrics ? metrics.raw.colCount : 0}</strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Current Rows / Cols</span>
                                <strong class="metric-strong text-cyan">${metrics ? metrics.processed.rowCount : 0} / ${metrics ? metrics.processed.colCount : 0}</strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Baseline Missing Values</span>
                                <strong class="metric-strong ${metrics && metrics.raw.missingCount > 0 ? 'text-amber' : 'text-green'}">${metrics ? metrics.raw.missingCount : 0}</strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Processed Missing Values</span>
                                <strong class="metric-strong ${metrics && metrics.processed.missingCount > 0 ? 'text-amber' : 'text-green'}">${metrics ? metrics.processed.missingCount : 0}</strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Transformations Applied</span>
                                <strong class="metric-strong text-teal">${steps.length} steps</strong>
                            </div>
                            <div class="summary-metric-item">
                                <span class="metric-muted">Export Preprocessed</span>
                                <button class="btn btn-ghost btn-xs mt-1" onclick="DatasetManager.exportToCSV(appState.preprocessor.currentDataset.data, appState.preprocessor.currentDataset.columns, 'preprocessed_' + appState.activeDataset.id + '.csv')">
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Grid: Tools Panel on Left, Pipeline Audit & Before/After on Right -->
                <div class="preprocessing-grid">
                    <!-- Left: Preprocessing Modules / Tabs -->
                    <div class="card">
                        <div class="card-header border-bottom">
                            <div class="tab-pill-group flex-wrap">
                                <button class="tab-pill ${this.selectedTab === 'imputation' ? 'active' : ''}" onclick="PreprocessingView.switchTab('imputation')">
                                    Missing Values
                                </button>
                                <button class="tab-pill ${this.selectedTab === 'duplicates' ? 'active' : ''}" onclick="PreprocessingView.switchTab('duplicates')">
                                    Duplicates & Clean
                                </button>
                                <button class="tab-pill ${this.selectedTab === 'encoding' ? 'active' : ''}" onclick="PreprocessingView.switchTab('encoding')">
                                    Encoding
                                </button>
                                <button class="tab-pill ${this.selectedTab === 'scaling' ? 'active' : ''}" onclick="PreprocessingView.switchTab('scaling')">
                                    Feature Scaling
                                </button>
                                <button class="tab-pill ${this.selectedTab === 'outliers' ? 'active' : ''}" onclick="PreprocessingView.switchTab('outliers')">
                                    Outlier Handling
                                </button>
                                <button class="tab-pill ${this.selectedTab === 'feature_selection' ? 'active' : ''}" onclick="PreprocessingView.switchTab('feature_selection')">
                                    Feature Selection
                                </button>
                            </div>
                        </div>

                        <div class="card-body">
                            ${this._renderSelectedTabContent(ds, prep)}
                        </div>
                    </div>

                    <!-- Right: Pipeline Audit Trail & Before/After Comparison Chart -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Transformation Audit Trail</h3>
                                <p class="card-subtitle">Logged pipeline operations applied to this dataset</p>
                            </div>
                        </div>
                        <div class="card-body">
                            <!-- Steps List -->
                            <div class="pipeline-history-list" id="pipeline-steps-list">
                                ${steps.length === 0 ? `
                                    <div class="empty-state p-3">
                                        <p class="empty-state-text">No preprocessing transformations applied yet. Use the tool tabs on the left to clean and transform the dataset.</p>
                                    </div>
                                ` : steps.map((s, idx) => `
                                    <div class="pipeline-step-item">
                                        <div class="step-badge">${idx + 1}</div>
                                        <div class="step-content">
                                            <div class="step-header">
                                                <strong>${s.name}</strong>
                                                <span class="step-time">${s.timestamp}</span>
                                            </div>
                                            <div class="step-meta">
                                                ${s.strategy ? `Strategy: <code>${s.strategy}</code> | ` : ''}
                                                ${s.affectedRecords !== undefined ? `Records affected: <strong>${s.affectedRecords}</strong>` : ''}
                                                ${s.selectedCount ? `Kept: ${s.selectedCount} features` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <div class="mt-4 border-top pt-3">
                                <h4 class="mb-2">Before / After Feature Distribution</h4>
                                <div class="chart-container" style="height: 220px; position: relative;">
                                    <canvas id="prepComparisonChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._renderComparisonChart();
    },

    switchTab(tab) {
        this.selectedTab = tab;
        this.render();
    },

    _renderSelectedTabContent(ds, prep) {
        const cols = prep.currentDataset.columns;
        const colTypes = prep.columnTypes;

        switch (this.selectedTab) {
            case 'imputation':
                return `
                    <div class="tab-pane-content">
                        <h4>Missing Value Imputation</h4>
                        <p class="text-muted mb-4">Replace null, NaN, or corrupted values with statistical estimates or drop incomplete records.</p>

                        <div class="form-group mb-3">
                            <label class="form-label">Imputation Strategy</label>
                            <select class="form-select" id="impute-strategy">
                                <option value="mean">Mean Imputation (Replace with column average)</option>
                                <option value="median">Median Imputation (Robust to skewed outliers)</option>
                                <option value="mode">Mode Imputation (Most frequent category/value)</option>
                                <option value="zero">Zero / Constant (Fill with 0)</option>
                                <option value="drop_rows">Drop Incomplete Patient Records</option>
                            </select>
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Select Target Columns to Impute</label>
                            <div class="columns-checkbox-grid">
                                <label class="checkbox-pill"><input type="checkbox" id="impute-all" onchange="PreprocessingView.toggleAllChecks('impute-col', this.checked)" checked> <strong>All Columns</strong></label>
                                ${cols.map(c => `
                                    <label class="checkbox-pill">
                                        <input type="checkbox" class="impute-col" value="${c}" checked>
                                        ${c}
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <button class="btn btn-primary" onclick="PreprocessingView.executeImputation()">
                            Execute Imputation Step
                        </button>
                    </div>
                `;

            case 'duplicates':
                return `
                    <div class="tab-pane-content">
                        <h4>Duplicate Records & String Cleaning</h4>
                        <p class="text-muted mb-4">Identify and purge exact duplicate patient rows and sanitize text artifacts.</p>

                        <div class="alert alert-info mb-4">
                            <strong>Dataset Check:</strong> Total active records: <strong>${prep.currentDataset.data.length}</strong>
                        </div>

                        <button class="btn btn-primary mr-2" onclick="PreprocessingView.executeRemoveDuplicates()">
                            Purge Duplicate Patient Rows
                        </button>
                    </div>
                `;

            case 'encoding':
                return `
                    <div class="tab-pane-content">
                        <h4>Categorical Variable Encoding</h4>
                        <p class="text-muted mb-4">Convert nominal or ordinal categorical clinical variables (e.g., Sex, Smoker, Region) into numerical vectors for ML algorithms.</p>

                        <div class="form-group mb-3">
                            <label class="form-label">Encoding Technique</label>
                            <select class="form-select" id="encoding-type">
                                <option value="label">Label Encoding (Map distinct categories to 0, 1, 2...)</option>
                                <option value="onehot">One-Hot Encoding (Create binary indicator columns)</option>
                            </select>
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Select Categorical Columns</label>
                            <div class="columns-checkbox-grid">
                                ${cols.map(c => {
                                    const isCat = colTypes[c] === 'categorical';
                                    return `
                                        <label class="checkbox-pill ${isCat ? 'cat-recommended' : ''}">
                                            <input type="checkbox" class="encode-col" value="${c}" ${isCat ? 'checked' : ''}>
                                            ${c} ${isCat ? '<span class="tag-small">Categorical</span>' : ''}
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <button class="btn btn-primary" onclick="PreprocessingView.executeEncoding()">
                            Execute Categorical Encoding
                        </button>
                    </div>
                `;

            case 'scaling':
                return `
                    <div class="tab-pane-content">
                        <h4>Feature Scaling & Normalization</h4>
                        <p class="text-muted mb-4">Scale continuous clinical parameters to uniform ranges to prevent distance-based models (KNN, SVM, Logistic Regression) from being dominated by large units.</p>

                        <div class="form-group mb-3">
                            <label class="form-label">Scaling Method</label>
                            <select class="form-select" id="scaling-type">
                                <option value="standard">Standardization / Z-Score (Mean = 0, Std Dev = 1)</option>
                                <option value="minmax">Min-Max Normalization (Rescales values into [0, 1])</option>
                            </select>
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Select Numerical Features to Scale (Excludes Target)</label>
                            <div class="columns-checkbox-grid">
                                ${cols.filter(c => c !== ds.targetColumn).map(c => `
                                    <label class="checkbox-pill">
                                        <input type="checkbox" class="scale-col" value="${c}" checked>
                                        ${c}
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <button class="btn btn-primary" onclick="PreprocessingView.executeScaling()">
                            Execute Feature Scaling
                        </button>
                    </div>
                `;

            case 'outliers':
                return `
                    <div class="tab-pane-content">
                        <h4>Clinical Outlier Detection & Treatment</h4>
                        <p class="text-muted mb-4">Detect anomalous physiological readings using Interquartile Range (IQR) or Z-score thresholds, and either winsorize (clip) or drop outlier records.</p>

                        <div class="form-row mb-3">
                            <div class="form-col">
                                <label class="form-label">Detection Criterion</label>
                                <select class="form-select" id="outlier-method">
                                    <option value="iqr">Interquartile Range IQR (1.5 × IQR boundary)</option>
                                    <option value="zscore">Z-Score Threshold (|z| > 3.0 standard deviations)</option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label class="form-label">Outlier Action</label>
                                <select class="form-select" id="outlier-action">
                                    <option value="clip">Winsorize / Clip to Boundaries (Preserves sample size)</option>
                                    <option value="remove">Remove Outlier Rows (Cleanest sample)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Select Continuous Numerical Features</label>
                            <div class="columns-checkbox-grid">
                                ${cols.filter(c => c !== ds.targetColumn && colTypes[c] === 'numeric').map(c => `
                                    <label class="checkbox-pill">
                                        <input type="checkbox" class="outlier-col" value="${c}" checked>
                                        ${c}
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <button class="btn btn-primary" onclick="PreprocessingView.executeOutliers()">
                            Apply Outlier Treatment
                        </button>
                    </div>
                `;

            case 'feature_selection':
                return `
                    <div class="tab-pane-content">
                        <h4>Feature Selection & Dimension Pruning</h4>
                        <p class="text-muted mb-4">Eliminate non-informative, low-variance, or redundant clinical attributes to improve model interpretability and reduce overfitting.</p>

                        <div class="mb-3">
                            <button class="btn btn-secondary btn-sm mr-2" onclick="PreprocessingView.filterLowVariance()">
                                Auto-Filter Near-Constant Features (Variance < 0.01)
                            </button>
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Manually Select Features to Retain in Modeling Pipeline:</label>
                            <div class="columns-checkbox-grid">
                                ${cols.map(c => `
                                    <label class="checkbox-pill">
                                        <input type="checkbox" class="feature-sel-col" value="${c}" checked>
                                        ${c} ${c === ds.targetColumn ? '<span class="target-tag">Target</span>' : ''}
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <button class="btn btn-primary" onclick="PreprocessingView.executeFeatureSelection()">
                            Apply Feature Subsetting
                        </button>
                    </div>
                `;
        }
    },

    toggleAllChecks(className, checked) {
        document.querySelectorAll(`.${className}`).forEach(cb => cb.checked = checked);
    },

    executeImputation() {
        const strategy = document.getElementById('impute-strategy').value;
        const selectedCols = Array.from(document.querySelectorAll('.impute-col:checked')).map(el => el.value);

        if (selectedCols.length === 0) {
            alert('Please select at least one column to impute.');
            return;
        }

        window.appState.preprocessor.handleMissingValues(strategy, selectedCols);
        this.render();
    },

    executeRemoveDuplicates() {
        window.appState.preprocessor.removeDuplicates();
        this.render();
    },

    executeEncoding() {
        const type = document.getElementById('encoding-type').value;
        const selectedCols = Array.from(document.querySelectorAll('.encode-col:checked')).map(el => el.value);

        if (selectedCols.length === 0) {
            alert('Please select at least one categorical column to encode.');
            return;
        }

        if (type === 'label') {
            window.appState.preprocessor.labelEncode(selectedCols);
        } else {
            window.appState.preprocessor.oneHotEncode(selectedCols);
        }
        this.render();
    },

    executeScaling() {
        const type = document.getElementById('scaling-type').value;
        const selectedCols = Array.from(document.querySelectorAll('.scale-col:checked')).map(el => el.value);

        if (selectedCols.length === 0) {
            alert('Please select at least one feature to scale.');
            return;
        }

        if (type === 'standard') {
            window.appState.preprocessor.standardize(selectedCols);
        } else {
            window.appState.preprocessor.minMaxNormalize(selectedCols);
        }
        this.render();
    },

    executeOutliers() {
        const method = document.getElementById('outlier-method').value;
        const action = document.getElementById('outlier-action').value;
        const selectedCols = Array.from(document.querySelectorAll('.outlier-col:checked')).map(el => el.value);

        if (selectedCols.length === 0) {
            alert('Please select at least one feature for outlier analysis.');
            return;
        }

        window.appState.preprocessor.handleOutliers(method, action, selectedCols);
        this.render();
    },

    filterLowVariance() {
        window.appState.preprocessor.filterLowVariance(0.01);
        this.render();
    },

    executeFeatureSelection() {
        const selectedCols = Array.from(document.querySelectorAll('.feature-sel-col:checked')).map(el => el.value);
        if (selectedCols.length === 0) {
            alert('Please select at least one feature to keep.');
            return;
        }
        window.appState.preprocessor.selectFeatures(selectedCols);
        this.render();
    },

    applyAndSave() {
        const prep = window.appState.preprocessor;
        window.appState.applyPreprocessed(prep.currentDataset.columns, prep.currentDataset.data);
        alert('Successfully applied preprocessed dataset to active modeling pipeline!');
        this.render();
    },

    resetPipeline() {
        if (confirm('Are you sure you want to reset all preprocessing transformations back to baseline raw data?')) {
            window.appState.resetDatasetToRaw();
            this.render();
        }
    },

    _renderComparisonChart() {
        const ctx = document.getElementById('prepComparisonChart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.comparisonChart) {
            this.comparisonChart.destroy();
        }

        const raw = window.appState.preprocessor.rawDataset?.data || [];
        const proc = window.appState.preprocessor.currentDataset?.data || [];
        const targetCol = window.appState.activeDataset.targetColumn || 'age';

        // Sample first feature or target
        const rawVals = raw.map(r => Number(r[targetCol])).filter(v => !isNaN(v)).slice(0, 50);
        const procVals = proc.map(r => Number(r[targetCol])).filter(v => !isNaN(v)).slice(0, 50);

        const labels = Array.from({ length: Math.min(rawVals.length, 30) }, (_, i) => `P-${i + 1}`);

        this.comparisonChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: `Raw ${targetCol}`,
                        data: rawVals.slice(0, 30),
                        borderColor: 'rgba(148, 163, 184, 0.8)',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        tension: 0.2
                    },
                    {
                        label: `Processed ${targetCol}`,
                        data: procVals.slice(0, 30),
                        borderColor: 'rgba(14, 165, 233, 1)',
                        backgroundColor: 'rgba(14, 165, 233, 0.1)',
                        fill: true,
                        borderWidth: 2,
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: { title: { display: true, text: 'Value' } }
                }
            }
        });
    }
};

if (typeof window !== 'undefined') window.PreprocessingView = PreprocessingView;
