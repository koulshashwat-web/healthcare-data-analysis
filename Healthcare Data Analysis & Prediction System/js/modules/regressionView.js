/**
 * Healthcare Data Analysis & Prediction System
 * Regression Module View
 */

const RegressionView = {
    selectedAlgorithm: 'multiple_linear', // linear, multiple_linear, polynomial, decision_tree_reg, random_forest_reg
    testSplitRatio: 0.2,
    randomSeed: 42,
    polyDegree: 2,
    lastTrainedResult: null,
    actualPredChartInstance: null,
    residualsChartInstance: null,

    render() {
        const state = window.appState;
        const ds = state.activeDataset;
        const container = document.getElementById('view-container');
        if (!container) return;

        // Auto-select medical insurance dataset if on classification dataset and user navigates here
        if (ds.defaultTask !== 'regression' && PRELOADED_DATASETS && PRELOADED_DATASETS['medical_insurance']) {
            // Suggest or show quick load banner
        }

        const candidateFeatures = ds.columns.filter(c => c !== ds.targetColumn);
        const lastResult = this.lastTrainedResult || state.trainedModels.regression[this.selectedAlgorithm];

        container.innerHTML = `
            <div class="ml-module-wrapper animate-fade-in">
                <!-- Regression Module Header -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Healthcare Outcome & Cost Regression Analysis</h2>
                            <p class="card-subtitle">Predict continuous clinical and healthcare expenditures (e.g., Hospital Charges, Biomarkers, Blood Pressure)</p>
                        </div>
                        <span class="badge badge-primary">Supervised Regression</span>
                    </div>

                    <div class="card-body">
                        ${ds.defaultTask !== 'regression' ? `
                            <div class="alert alert-info d-flex justify-between align-center mb-3">
                                <div>
                                    <strong>Recommendation:</strong> The active dataset (<code>${ds.name}</code>) is primarily configured for classification. We recommend loading the <strong>Medical Insurance Expenditure</strong> dataset for continuous cost modeling.
                                </div>
                                <button class="btn btn-secondary btn-sm" onclick="DatasetManager.loadPreloaded('medical_insurance'); RegressionView.render();">
                                    Load Insurance Cost Dataset &rarr;
                                </button>
                            </div>
                        ` : ''}

                        <!-- Config Row -->
                        <div class="model-config-grid">
                            <div class="config-col">
                                <label class="input-label">Select Regression Algorithm</label>
                                <select class="form-select" id="reg-algo-select" onchange="RegressionView.onAlgorithmChange(this.value)">
                                    <option value="linear" ${this.selectedAlgorithm === 'linear' ? 'selected' : ''}>Simple Linear Regression</option>
                                    <option value="multiple_linear" ${this.selectedAlgorithm === 'multiple_linear' ? 'selected' : ''}>Multiple Linear Regression (OLS)</option>
                                    <option value="polynomial" ${this.selectedAlgorithm === 'polynomial' ? 'selected' : ''}>Polynomial Regression</option>
                                    <option value="decision_tree_reg" ${this.selectedAlgorithm === 'decision_tree_reg' ? 'selected' : ''}>Decision Tree Regressor (CART)</option>
                                    <option value="random_forest_reg" ${this.selectedAlgorithm === 'random_forest_reg' ? 'selected' : ''}>Random Forest Regressor</option>
                                </select>
                            </div>

                            <div class="config-col">
                                <label class="input-label">Continuous Target Column</label>
                                <select class="form-select" id="reg-target-col-select" onchange="RegressionView.onTargetChange(this.value)">
                                    ${ds.columns.map(c => `<option value="${c}" ${c === ds.targetColumn ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                            </div>

                            <div class="config-col">
                                <label class="input-label">Train / Test Split Ratio: <strong id="reg-split-val">${Math.round((1 - this.testSplitRatio) * 100)}% Train / ${Math.round(this.testSplitRatio * 100)}% Test</strong></label>
                                <input type="range" class="form-range" min="0.1" max="0.4" step="0.05" value="${this.testSplitRatio}" 
                                       oninput="RegressionView.onSplitChange(this.value)">
                            </div>
                        </div>

                        ${this.selectedAlgorithm === 'polynomial' ? `
                            <div class="mt-3 p-3 bg-subtle rounded border">
                                <label class="input-label">Polynomial Expansion Degree:</label>
                                <div class="d-flex align-center gap-3">
                                    <label class="mr-3"><input type="radio" name="poly_deg" value="2" ${this.polyDegree === 2 ? 'checked' : ''} onchange="RegressionView.polyDegree = 2"> Degree 2 (Quadratic & Interactions)</label>
                                    <label><input type="radio" name="poly_deg" value="3" ${this.polyDegree === 3 ? 'checked' : ''} onchange="RegressionView.polyDegree = 3"> Degree 3 (Cubic Expansion)</label>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Clinical Predictor Features Selection -->
                        <div class="feature-selection-section mt-3">
                            <div class="d-flex justify-between align-center mb-2">
                                <label class="input-label mb-0">Select Clinical Predictor Covariates (${candidateFeatures.length} available):</label>
                                <div>
                                    <button class="btn btn-ghost btn-xs" onclick="RegressionView.toggleAllFeatures(true)">Select All</button>
                                    <button class="btn btn-ghost btn-xs" onclick="RegressionView.toggleAllFeatures(false)">Deselect All</button>
                                </div>
                            </div>
                            <div class="feature-checkboxes-bar">
                                ${candidateFeatures.map(f => `
                                    <label class="feature-chip">
                                        <input type="checkbox" class="reg-feature-check" value="${f}" checked>
                                        <span>${f}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Train Action Bar -->
                        <div class="mt-4 pt-3 border-top d-flex align-center justify-between">
                            <div class="dataset-ready-note">
                                <span class="badge ${ds.isPreprocessed ? 'badge-success' : 'badge-neutral'}">
                                    Using: ${ds.isPreprocessed ? 'Preprocessed Data' : 'Raw Baseline Data'}
                                </span>
                                <span class="text-muted ml-2">${ds.activeData.length} records available</span>
                            </div>
                            <button class="btn btn-primary btn-lg" id="train-reg-btn" onclick="RegressionView.trainAndEvaluate()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                Fit & Evaluate Regressor
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Regression Evaluation Results Container -->
                <div id="reg-results-section">
                    ${lastResult ? this._renderEvaluationResults(lastResult) : `
                        <div class="card p-5 text-center">
                            <div class="empty-state-icon">📈</div>
                            <h3 class="mt-3">Regression Model Not Yet Evaluated</h3>
                            <p class="text-muted">Select an algorithm, choose target and features, and click <strong>"Fit & Evaluate Regressor"</strong> to generate R², RMSE, actual vs. predicted curves, and cost calculator.</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        if (lastResult) {
            this._renderCharts(lastResult);
        }
    },

    onAlgorithmChange(algo) {
        this.selectedAlgorithm = algo;
        this.render();
    },

    onTargetChange(target) {
        window.appState.activeDataset.targetColumn = target;
        this.render();
    },

    onSplitChange(val) {
        this.testSplitRatio = parseFloat(val);
        const el = document.getElementById('reg-split-val');
        if (el) el.innerText = `${Math.round((1 - this.testSplitRatio) * 100)}% Train / ${Math.round(this.testSplitRatio * 100)}% Test`;
    },

    toggleAllFeatures(checked) {
        document.querySelectorAll('.reg-feature-check').forEach(cb => cb.checked = checked);
    },

    trainAndEvaluate() {
        const state = window.appState;
        const ds = state.activeDataset;
        const data = ds.activeData;
        const targetCol = ds.targetColumn;

        let selectedFeatures = Array.from(document.querySelectorAll('.reg-feature-check:checked')).map(el => el.value);

        if (this.selectedAlgorithm === 'linear' && selectedFeatures.length > 1) {
            // Simple linear uses first feature
            selectedFeatures = [selectedFeatures[0]];
        }

        if (selectedFeatures.length === 0) {
            alert('Please select at least one feature for regression.');
            return;
        }

        const btn = document.getElementById('train-reg-btn');
        if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Fitting Model...';

        setTimeout(() => {
            try {
                const startTime = performance.now();

                // Prepare X and y
                const X = [];
                const y = [];

                data.forEach(row => {
                    const rowFeatures = selectedFeatures.map(f => {
                        const val = row[f];
                        const num = Number(val);
                        return isNaN(num) ? 0 : num;
                    });
                    const targetVal = Number(row[targetCol]);
                    if (!isNaN(targetVal)) {
                        X.push(rowFeatures);
                        y.push(targetVal);
                    }
                });

                // Train / Test split
                const split = MathUtils.trainTestSplit(X, y, this.testSplitRatio, this.randomSeed);

                let model;
                switch (this.selectedAlgorithm) {
                    case 'linear':
                    case 'multiple_linear':
                        model = new LinearRegression();
                        break;
                    case 'polynomial':
                        model = new PolynomialRegression({ degree: this.polyDegree });
                        break;
                    case 'decision_tree_reg':
                        model = new DecisionTree({ isRegression: true, maxDepth: 6 });
                        break;
                    case 'random_forest_reg':
                        model = new RandomForest({ isRegression: true, nEstimators: 15, maxDepth: 6 });
                        break;
                }

                model.fit(split.X_train, split.y_train, selectedFeatures);

                // Predict on test set
                const yPred = model.predict(split.X_test);
                const elapsed = Math.round(performance.now() - startTime);

                // Calculate metrics
                const evalMetrics = MathUtils.evaluateRegression(split.y_test, yPred, selectedFeatures.length);
                evalMetrics.trainTimeMs = elapsed;

                const result = {
                    algorithm: this.selectedAlgorithm,
                    algorithmName: this._getAlgoDisplayName(this.selectedAlgorithm),
                    metrics: evalMetrics,
                    model,
                    split,
                    features: selectedFeatures,
                    target: targetCol,
                    yTest: split.y_test,
                    yPred,
                    timestamp: new Date().toLocaleTimeString()
                };

                this.lastTrainedResult = result;
                state.recordModelResult('regression', this.selectedAlgorithm, result);

                this.render();
            } catch (err) {
                console.error(err);
                alert('Regression error: ' + err.message);
                if (btn) btn.innerHTML = 'Fit & Evaluate Regressor';
            }
        }, 60);
    },

    _getAlgoDisplayName(id) {
        const names = {
            linear: 'Simple Linear Regression',
            multiple_linear: 'Multiple Linear Regression',
            polynomial: `Polynomial Regression (Deg ${this.polyDegree})`,
            decision_tree_reg: 'Decision Tree Regressor',
            random_forest_reg: 'Random Forest Regressor'
        };
        return names[id] || id;
    },

    _renderEvaluationResults(res) {
        const m = res.metrics;

        return `
            <div class="results-container animate-fade-in">
                <!-- Evaluation Metrics KPI Grid -->
                <div class="metrics-grid mb-4">
                    <div class="metric-card">
                        <div class="metric-title">R² Score (Determination)</div>
                        <div class="metric-num text-teal">${(m.r2 * 100).toFixed(1)}%</div>
                        <div class="metric-desc">Variance explained</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Adjusted R²</div>
                        <div class="metric-num text-cyan">${(m.adjR2 * 100).toFixed(1)}%</div>
                        <div class="metric-desc">Penalized for feature count</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">RMSE</div>
                        <div class="metric-num text-blue">${m.rmse.toFixed(2)}</div>
                        <div class="metric-desc">Root mean squared error</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">MAE</div>
                        <div class="metric-num text-purple">${m.mae.toFixed(2)}</div>
                        <div class="metric-desc">Mean absolute error</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">MSE</div>
                        <div class="metric-num text-indigo">${m.mse.toFixed(1)}</div>
                        <div class="metric-desc">Mean squared deviation</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Fit Time</div>
                        <div class="metric-num text-amber">${m.trainTimeMs} ms</div>
                        <div class="metric-desc">Execution latency</div>
                    </div>
                </div>

                <!-- Charts Grid: Actual vs Predicted & Residuals -->
                <div class="dashboard-grid mb-4">
                    <!-- Actual vs Predicted Scatter -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Actual vs. Predicted Outcomes</h3>
                                <p class="card-subtitle">Points near the diagonal reference line indicate accurate predictions</p>
                            </div>
                            <span class="badge badge-info">R²: ${(m.r2 * 100).toFixed(1)}%</span>
                        </div>
                        <div class="card-body">
                            <div class="chart-container" style="height: 270px; position: relative;">
                                <canvas id="regActualPredChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Residuals Plot -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Residuals Error Plot</h3>
                                <p class="card-subtitle">Difference between actual and predicted (y - ŷ)</p>
                            </div>
                            <span class="badge badge-neutral">MAE: ${m.mae.toFixed(2)}</span>
                        </div>
                        <div class="card-body">
                            <div class="chart-container" style="height: 270px; position: relative;">
                                <canvas id="regResidualsChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Interactive Patient Continuous Outcome / Cost Calculator -->
                <div class="card mb-4 border-accent">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">
                                <span class="pulse-indicator"></span>
                                Live Clinical Outcome & Expenditure Calculator
                            </h3>
                            <p class="card-subtitle">Input patient vitals to calculate expected continuous clinical target (e.g., Medical Billing Charges)</p>
                        </div>
                        <span class="badge badge-success">Continuous Estimator</span>
                    </div>

                    <div class="card-body">
                        <div class="patient-intake-form">
                            <div class="form-grid-3">
                                ${res.features.map((feat, idx) => {
                                    const featVals = res.split.X_train.map(r => r[idx]);
                                    const avg = MathUtils.median(featVals) || 0;
                                    const min = MathUtils.min(featVals) || 0;
                                    const max = MathUtils.max(featVals) || 100;
                                    const isInt = Number.isInteger(avg);

                                    return `
                                        <div class="intake-field">
                                            <label class="intake-label">${feat}</label>
                                            <input type="number" step="${isInt ? '1' : '0.1'}" class="form-control form-control-sm reg-input-field" 
                                                   data-index="${idx}" value="${isInt ? avg : avg.toFixed(1)}">
                                            <div class="intake-range-hint">Range: [${min.toFixed(0)} - ${max.toFixed(0)}]</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>

                            <div class="mt-4 d-flex justify-between align-center">
                                <button class="btn btn-primary" onclick="RegressionView.predictPatientOutcome()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                    Calculate Estimated ${res.target}
                                </button>
                                <div id="reg-prediction-output" class="patient-prediction-badge-wrapper"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    predictPatientOutcome() {
        if (!this.lastTrainedResult) return;
        const res = this.lastTrainedResult;
        const model = res.model;

        const inputs = [];
        document.querySelectorAll('.reg-input-field').forEach(el => {
            inputs.push(parseFloat(el.value) || 0);
        });

        const predVal = model.predictOne(inputs);
        const outputEl = document.getElementById('reg-prediction-output');

        if (outputEl) {
            outputEl.innerHTML = `
                <div class="prediction-result-pill pred-low-risk">
                    <div class="pred-label">Estimated Clinical Outcome (${res.target})</div>
                    <div class="pred-details">
                        Value: <strong>${predVal.toFixed(2)}</strong> &plusmn; ${res.metrics.mae.toFixed(1)} (MAE tolerance)
                    </div>
                </div>
            `;
        }
    },

    _renderCharts(res) {
        const yTest = res.yTest;
        const yPred = res.yPred;

        // Actual vs Predicted
        const ctx1 = document.getElementById('regActualPredChart');
        if (ctx1 && typeof Chart !== 'undefined') {
            if (this.actualPredChartInstance) this.actualPredChartInstance.destroy();

            const scatterData = yTest.map((yt, idx) => ({ x: yt, y: yPred[idx] }));
            const minVal = Math.min(...yTest, ...yPred);
            const maxVal = Math.max(...yTest, ...yPred);

            this.actualPredChartInstance = new Chart(ctx1, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Patient Instances',
                            data: scatterData,
                            backgroundColor: 'rgba(14, 165, 233, 0.7)',
                            borderColor: '#0284c7',
                            borderWidth: 1,
                            pointRadius: 4
                        },
                        {
                            type: 'line',
                            label: 'Ideal 45° Fit Line',
                            data: [{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }],
                            borderColor: '#ef4444',
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: `Actual ${res.target}` } },
                        y: { title: { display: true, text: `Predicted ${res.target}` } }
                    }
                }
            });
        }

        // Residuals
        const ctx2 = document.getElementById('regResidualsChart');
        if (ctx2 && typeof Chart !== 'undefined') {
            if (this.residualsChartInstance) this.residualsChartInstance.destroy();

            const residuals = yTest.map((yt, idx) => ({ x: yPred[idx], y: yt - yPred[idx] }));

            this.residualsChartInstance = new Chart(ctx2, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Residual Error (y - ŷ)',
                            data: residuals,
                            backgroundColor: 'rgba(239, 68, 68, 0.6)',
                            borderColor: '#dc2626',
                            borderWidth: 1,
                            pointRadius: 4
                        },
                        {
                            type: 'line',
                            label: 'Zero Error Baseline',
                            data: [{ x: Math.min(...yPred), y: 0 }, { x: Math.max(...yPred), y: 0 }],
                            borderColor: '#64748b',
                            borderDash: [4, 4],
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Fitted / Predicted Value' } },
                        y: { title: { display: true, text: 'Residual (Actual - Predicted)' } }
                    }
                }
            });
        }
    }
};

if (typeof window !== 'undefined') window.RegressionView = RegressionView;
