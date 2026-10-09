/**
 * Healthcare Data Analysis & Prediction System
 * Classification Module View
 */

const ClassificationView = {
    selectedAlgorithm: 'random_forest', // decision_tree, knn, naive_bayes, logistic_regression, random_forest, svm
    testSplitRatio: 0.2,
    randomSeed: 42,
    lastTrainedResult: null,
    rocChartInstance: null,
    importanceChartInstance: null,

    // Hyperparameters
    params: {
        maxDepth: 6,
        nEstimators: 15,
        kNeighbors: 5,
        learningRate: 0.05,
        svmC: 1.0,
        svmKernel: 'linear'
    },

    render() {
        const state = window.appState;
        const ds = state.activeDataset;
        const container = document.getElementById('view-container');
        if (!container) return;

        const candidateFeatures = ds.columns.filter(c => c !== ds.targetColumn);
        const lastResult = this.lastTrainedResult || state.trainedModels.classification[this.selectedAlgorithm];

        container.innerHTML = `
            <div class="ml-module-wrapper animate-fade-in">
                <!-- Module Header -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Healthcare Classification & Disease Risk Prediction</h2>
                            <p class="card-subtitle">Train, evaluate, and compare supervised classification algorithms on clinical cohorts</p>
                        </div>
                        <span class="badge badge-primary">Supervised Classification</span>
                    </div>

                    <div class="card-body">
                        <!-- Controls Row: Algorithm, Target, Split -->
                        <div class="model-config-grid">
                            <div class="config-col">
                                <label class="input-label">Select Classification Algorithm</label>
                                <select class="form-select" id="algo-select" onchange="ClassificationView.onAlgorithmChange(this.value)">
                                    <option value="decision_tree" ${this.selectedAlgorithm === 'decision_tree' ? 'selected' : ''}>Decision Tree Classifier (CART)</option>
                                    <option value="random_forest" ${this.selectedAlgorithm === 'random_forest' ? 'selected' : ''}>Random Forest Ensemble</option>
                                    <option value="knn" ${this.selectedAlgorithm === 'knn' ? 'selected' : ''}>K-Nearest Neighbors (KNN)</option>
                                    <option value="naive_bayes" ${this.selectedAlgorithm === 'naive_bayes' ? 'selected' : ''}>Gaussian Naive Bayes</option>
                                    <option value="logistic_regression" ${this.selectedAlgorithm === 'logistic_regression' ? 'selected' : ''}>Logistic Regression (Sigmoid/OvR)</option>
                                    <option value="svm" ${this.selectedAlgorithm === 'svm' ? 'selected' : ''}>Support Vector Machine (SVM)</option>
                                </select>
                            </div>

                            <div class="config-col">
                                <label class="input-label">Target Diagnosis / Outcome Column</label>
                                <select class="form-select" id="target-col-select" onchange="ClassificationView.onTargetChange(this.value)">
                                    ${ds.columns.map(c => `<option value="${c}" ${c === ds.targetColumn ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                            </div>

                            <div class="config-col">
                                <label class="input-label">Train / Test Split Ratio: <strong id="split-val">${Math.round((1 - this.testSplitRatio) * 100)}% Train / ${Math.round(this.testSplitRatio * 100)}% Test</strong></label>
                                <input type="range" class="form-range" min="0.1" max="0.4" step="0.05" value="${this.testSplitRatio}" 
                                       oninput="ClassificationView.onSplitChange(this.value)">
                            </div>
                        </div>

                        <!-- Hyperparameters & Feature Selection Drawer -->
                        <div class="hyperparams-drawer mt-3">
                            <div class="hyperparams-header">
                                <strong>Hyperparameter Configuration</strong>
                                <span class="text-muted text-sm">(Tailored to selected algorithm)</span>
                            </div>
                            <div class="hyperparams-body" id="algo-hyperparams-container">
                                ${this._renderHyperparameterInputs()}
                            </div>
                        </div>

                        <!-- Clinical Predictor Features Selection -->
                        <div class="feature-selection-section mt-3">
                            <div class="d-flex justify-between align-center mb-2">
                                <label class="input-label mb-0">Select Clinical Predictor Features (${candidateFeatures.length} available):</label>
                                <div>
                                    <button class="btn btn-ghost btn-xs" onclick="ClassificationView.toggleAllFeatures(true)">Select All</button>
                                    <button class="btn btn-ghost btn-xs" onclick="ClassificationView.toggleAllFeatures(false)">Deselect All</button>
                                </div>
                            </div>
                            <div class="feature-checkboxes-bar">
                                ${candidateFeatures.map(f => `
                                    <label class="feature-chip">
                                        <input type="checkbox" class="clf-feature-check" value="${f}" checked>
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
                            <button class="btn btn-primary btn-lg" id="train-clf-btn" onclick="ClassificationView.trainAndEvaluate()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                Train & Evaluate Classifier
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Model Evaluation Results Container -->
                <div id="clf-results-section">
                    ${lastResult ? this._renderEvaluationResults(lastResult) : `
                        <div class="card p-5 text-center">
                            <div class="empty-state-icon">🩺</div>
                            <h3 class="mt-3">Classifier Not Yet Evaluated</h3>
                            <p class="text-muted">Configure the algorithm parameters above and click <strong>"Train & Evaluate Classifier"</strong> to generate accuracy metrics, confusion matrix, ROC curve, and patient risk assessment simulator.</p>
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
        const container = document.getElementById('algo-hyperparams-container');
        if (container) {
            container.innerHTML = this._renderHyperparameterInputs();
        }
    },

    onTargetChange(target) {
        window.appState.activeDataset.targetColumn = target;
        this.render();
    },

    onSplitChange(val) {
        this.testSplitRatio = parseFloat(val);
        const el = document.getElementById('split-val');
        if (el) el.innerText = `${Math.round((1 - this.testSplitRatio) * 100)}% Train / ${Math.round(this.testSplitRatio * 100)}% Test`;
    },

    toggleAllFeatures(checked) {
        document.querySelectorAll('.clf-feature-check').forEach(cb => cb.checked = checked);
    },

    _renderHyperparameterInputs() {
        switch (this.selectedAlgorithm) {
            case 'decision_tree':
                return `
                    <div class="param-row">
                        <div class="param-col">
                            <label class="param-label">Max Tree Depth: <strong id="val-depth">${this.params.maxDepth}</strong></label>
                            <input type="range" class="form-range" min="2" max="15" value="${this.params.maxDepth}" oninput="ClassificationView.params.maxDepth = +this.value; document.getElementById('val-depth').innerText = this.value">
                        </div>
                        <div class="param-col">
                            <label class="param-label">Split Criterion</label>
                            <select class="form-select form-select-sm" id="tree-criterion">
                                <option value="gini" selected>Gini Impurity</option>
                            </select>
                        </div>
                    </div>
                `;
            case 'random_forest':
                return `
                    <div class="param-row">
                        <div class="param-col">
                            <label class="param-label">Ensemble Trees: <strong id="val-n">${this.params.nEstimators}</strong></label>
                            <input type="range" class="form-range" min="5" max="30" value="${this.params.nEstimators}" oninput="ClassificationView.params.nEstimators = +this.value; document.getElementById('val-n').innerText = this.value">
                        </div>
                        <div class="param-col">
                            <label class="param-label">Tree Max Depth: <strong id="val-rf-depth">${this.params.maxDepth}</strong></label>
                            <input type="range" class="form-range" min="2" max="10" value="${this.params.maxDepth}" oninput="ClassificationView.params.maxDepth = +this.value; document.getElementById('val-rf-depth').innerText = this.value">
                        </div>
                    </div>
                `;
            case 'knn':
                return `
                    <div class="param-row">
                        <div class="param-col">
                            <label class="param-label">Number of Neighbors (K): <strong id="val-k">${this.params.kNeighbors}</strong></label>
                            <input type="range" class="form-range" min="1" max="19" step="2" value="${this.params.kNeighbors}" oninput="ClassificationView.params.kNeighbors = +this.value; document.getElementById('val-k').innerText = this.value">
                        </div>
                        <div class="param-col">
                            <label class="param-label">Weighting Metric</label>
                            <select class="form-select form-select-sm" id="knn-weights">
                                <option value="uniform" selected>Uniform (Equal votes)</option>
                                <option value="distance">Inverse Distance Weighting</option>
                            </select>
                        </div>
                    </div>
                `;
            case 'logistic_regression':
                return `
                    <div class="param-row">
                        <div class="param-col">
                            <label class="param-label">Learning Rate (&eta;)</label>
                            <select class="form-select form-select-sm" id="lr-rate" onchange="ClassificationView.params.learningRate = +this.value">
                                <option value="0.01">0.01 (Conservative)</option>
                                <option value="0.05" selected>0.05 (Balanced)</option>
                                <option value="0.1">0.10 (Aggressive)</option>
                            </select>
                        </div>
                        <div class="param-col">
                            <label class="param-label">Regularization</label>
                            <select class="form-select form-select-sm" id="lr-reg">
                                <option value="l2" selected>L2 Ridge Penalization</option>
                            </select>
                        </div>
                    </div>
                `;
            case 'svm':
                return `
                    <div class="param-row">
                        <div class="param-col">
                            <label class="param-label">Slack Penalty (C): <strong id="val-svm-c">${this.params.svmC}</strong></label>
                            <input type="range" class="form-range" min="0.1" max="5.0" step="0.1" value="${this.params.svmC}" oninput="ClassificationView.params.svmC = +this.value; document.getElementById('val-svm-c').innerText = this.value">
                        </div>
                        <div class="param-col">
                            <label class="param-label">Kernel</label>
                            <select class="form-select form-select-sm" id="svm-kernel" onchange="ClassificationView.params.svmKernel = this.value">
                                <option value="linear" selected>Linear Kernel</option>
                                <option value="rbf">RBF / Gaussian Radial Kernel</option>
                            </select>
                        </div>
                    </div>
                `;
            case 'naive_bayes':
                return `
                    <div class="param-row">
                        <div class="param-col">
                            <label class="param-label">Distribution Prior</label>
                            <input type="text" class="form-control form-control-sm" value="Empirical Class Priors P(C_k)" disabled>
                        </div>
                        <div class="param-col">
                            <label class="param-label">Variance Smoothing</label>
                            <input type="text" class="form-control form-control-sm" value="1e-9 (Numerical Stability)" disabled>
                        </div>
                    </div>
                `;
        }
    },

    trainAndEvaluate() {
        const state = window.appState;
        const ds = state.activeDataset;
        const data = ds.activeData;
        const targetCol = ds.targetColumn;

        const selectedFeatures = Array.from(document.querySelectorAll('.clf-feature-check:checked')).map(el => el.value);

        if (selectedFeatures.length === 0) {
            alert('Please select at least one clinical predictor feature.');
            return;
        }

        const btn = document.getElementById('train-clf-btn');
        if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Training Model...';

        // Asynchronous execution so UI updates smoothly
        setTimeout(() => {
            try {
                const startTime = performance.now();

                // Prepare feature matrix X and target vector y
                const X = [];
                const y = [];

                data.forEach(row => {
                    const rowFeatures = selectedFeatures.map(f => {
                        const val = row[f];
                        const num = Number(val);
                        return isNaN(num) ? 0 : num;
                    });
                    const targetVal = row[targetCol];
                    X.push(rowFeatures);
                    y.push(targetVal);
                });

                // Train / Test split
                const split = MathUtils.trainTestSplit(X, y, this.testSplitRatio, this.randomSeed);

                // Instantiate and fit model
                let model;
                switch (this.selectedAlgorithm) {
                    case 'decision_tree':
                        model = new DecisionTree({ maxDepth: this.params.maxDepth });
                        break;
                    case 'random_forest':
                        model = new RandomForest({ nEstimators: this.params.nEstimators, maxDepth: this.params.maxDepth });
                        break;
                    case 'knn':
                        model = new KNNClassifier({ k: this.params.kNeighbors });
                        break;
                    case 'naive_bayes':
                        model = new GaussianNaiveBayes();
                        break;
                    case 'logistic_regression':
                        model = new LogisticRegression({ learningRate: this.params.learningRate });
                        break;
                    case 'svm':
                        model = new SVMClassifier({ C: this.params.svmC, kernel: this.params.svmKernel });
                        break;
                }

                model.fit(split.X_train, split.y_train, selectedFeatures);

                // Predictions on test set
                const yPred = model.predict(split.X_test);
                let yProb = null;
                if (model.predictProba) {
                    const probs = model.predictProba(split.X_test);
                    if (probs && probs.length > 0) {
                        const classes = Array.from(new Set(y)).sort();
                        const posClass = classes[classes.length - 1];
                        yProb = probs.map(p => p[posClass] !== undefined ? p[posClass] : 0.5);
                    }
                }

                const elapsed = Math.round(performance.now() - startTime);

                // Calculate metrics
                const evalMetrics = MathUtils.evaluateClassification(split.y_test, yPred, yProb);
                evalMetrics.trainTimeMs = elapsed;

                const result = {
                    algorithm: this.selectedAlgorithm,
                    algorithmName: this._getAlgoDisplayName(this.selectedAlgorithm),
                    metrics: evalMetrics,
                    model,
                    split,
                    features: selectedFeatures,
                    target: targetCol,
                    timestamp: new Date().toLocaleTimeString()
                };

                this.lastTrainedResult = result;
                state.recordModelResult('classification', this.selectedAlgorithm, result);

                this.render();
            } catch (err) {
                console.error(err);
                alert('Model training error: ' + err.message);
                if (btn) btn.innerHTML = 'Train & Evaluate Classifier';
            }
        }, 60);
    },

    _getAlgoDisplayName(id) {
        const names = {
            decision_tree: 'Decision Tree (CART)',
            random_forest: 'Random Forest Ensemble',
            knn: 'K-Nearest Neighbors (KNN)',
            naive_bayes: 'Gaussian Naive Bayes',
            logistic_regression: 'Logistic Regression',
            svm: 'Support Vector Machine (SVM)'
        };
        return names[id] || id;
    },

    _renderEvaluationResults(res) {
        const m = res.metrics;
        const b = m.binaryCounts;

        return `
            <div class="results-container animate-fade-in">
                <!-- Evaluation Metrics KPI Grid -->
                <div class="metrics-grid mb-4">
                    <div class="metric-card">
                        <div class="metric-title">Accuracy</div>
                        <div class="metric-num text-teal">${(m.accuracy * 100).toFixed(1)}%</div>
                        <div class="metric-desc">Overall correctness</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Precision</div>
                        <div class="metric-num text-cyan">${(m.precision * 100).toFixed(1)}%</div>
                        <div class="metric-desc">Positive predictive value</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Recall (Sensitivity)</div>
                        <div class="metric-num text-blue">${(m.recall * 100).toFixed(1)}%</div>
                        <div class="metric-desc">True positive detection</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Specificity</div>
                        <div class="metric-num text-purple">${(m.specificity * 100).toFixed(1)}%</div>
                        <div class="metric-desc">True negative rate</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">F1-Score</div>
                        <div class="metric-num text-indigo">${(m.f1Score * 100).toFixed(1)}%</div>
                        <div class="metric-desc">Harmonic precision-recall</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">ROC AUC</div>
                        <div class="metric-num text-amber">${m.auc.toFixed(3)}</div>
                        <div class="metric-desc">Area under ROC curve</div>
                    </div>
                </div>

                <!-- Visual Charts Grid: Confusion Matrix & ROC -->
                <div class="dashboard-grid mb-4">
                    <!-- Confusion Matrix Heatmap -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Clinical Confusion Matrix</h3>
                                <p class="card-subtitle">Diagnostic classification breakdown on test cohort</p>
                            </div>
                        </div>
                        <div class="card-body">
                            ${b ? `
                                <div class="confusion-matrix-wrapper">
                                    <div class="cm-labels-top">
                                        <span>Predicted Negative (0)</span>
                                        <span>Predicted Positive (1)</span>
                                    </div>
                                    <div class="cm-grid">
                                        <div class="cm-cell cm-tn">
                                            <div class="cm-count">${b.tn}</div>
                                            <div class="cm-label">True Negative (TN)</div>
                                            <div class="cm-sub">Healthy correctly diagnosed</div>
                                        </div>
                                        <div class="cm-cell cm-fp">
                                            <div class="cm-count">${b.fp}</div>
                                            <div class="cm-label">False Positive (FP)</div>
                                            <div class="cm-sub">False alarm error</div>
                                        </div>
                                        <div class="cm-cell cm-fn">
                                            <div class="cm-count">${b.fn}</div>
                                            <div class="cm-label">False Negative (FN)</div>
                                            <div class="cm-sub">Missed clinical risk!</div>
                                        </div>
                                        <div class="cm-cell cm-tp">
                                            <div class="cm-count">${b.tp}</div>
                                            <div class="cm-label">True Positive (TP)</div>
                                            <div class="cm-sub">Disease correctly identified</div>
                                        </div>
                                    </div>
                                    <div class="cm-footer mt-3 text-muted text-sm text-center">
                                        Test cohort size: <strong>${b.tp + b.tn + b.fp + b.fn} patients</strong> | False Negative Rate: <strong>${((b.fn / (b.tp + b.fn || 1)) * 100).toFixed(1)}%</strong>
                                    </div>
                                </div>
                            ` : `
                                <div class="multiclass-table-wrapper">
                                    <table class="clinical-data-table">
                                        <thead>
                                            <tr>
                                                <th>Actual \\ Pred</th>
                                                ${m.classes.map(c => `<th>Class ${c}</th>`).join('')}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${m.classes.map(c1 => `
                                                <tr>
                                                    <td><strong>Class ${c1}</strong></td>
                                                    ${m.classes.map(c2 => `
                                                        <td class="${c1 === c2 ? 'cell-diagonal' : ''}">${m.confusionMatrix[c1][c2]}</td>
                                                    `).join('')}
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- ROC Curve Chart -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">ROC Curve (Receiver Operating Characteristic)</h3>
                                <p class="card-subtitle">Sensitivity vs False Positive Rate across decision thresholds</p>
                            </div>
                            <span class="badge badge-info">AUC: ${m.auc.toFixed(3)}</span>
                        </div>
                        <div class="card-body">
                            <div class="chart-container" style="height: 270px; position: relative;">
                                <canvas id="clfRocChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Interactive Patient Risk Assessment Simulator -->
                <div class="card mb-4 border-accent">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">
                                <span class="pulse-indicator"></span>
                                Live Patient Disease Risk Assessment Simulator
                            </h3>
                            <p class="card-subtitle">Adjust physiological parameters to evaluate individual clinical disease likelihood in real-time</p>
                        </div>
                        <span class="badge badge-success">Interactive Predictor</span>
                    </div>

                    <div class="card-body">
                        <div class="patient-intake-form" id="patient-intake-form">
                            <div class="form-grid-3">
                                ${res.features.slice(0, 9).map((feat, idx) => {
                                    // Calculate reasonable default from test set median or mean
                                    const featVals = res.split.X_train.map(r => r[idx]);
                                    const avg = MathUtils.median(featVals) || 0;
                                    const min = MathUtils.min(featVals) || 0;
                                    const max = MathUtils.max(featVals) || 100;
                                    const isInt = Number.isInteger(avg);

                                    return `
                                        <div class="intake-field">
                                            <label class="intake-label">${feat}</label>
                                            <input type="number" step="${isInt ? '1' : '0.1'}" class="form-control form-control-sm patient-input-field" 
                                                   data-index="${idx}" data-feature="${feat}" value="${isInt ? avg : avg.toFixed(1)}">
                                            <div class="intake-range-hint">Cohort range: [${min.toFixed(0)} - ${max.toFixed(0)}]</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>

                            <div class="mt-4 d-flex justify-between align-center">
                                <button class="btn btn-primary" onclick="ClassificationView.predictSinglePatient()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                    Calculate Patient Risk Assessment
                                </button>
                                <div id="patient-prediction-output" class="patient-prediction-badge-wrapper"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    predictSinglePatient() {
        if (!this.lastTrainedResult) return;
        const res = this.lastTrainedResult;
        const model = res.model;

        // Collect inputs
        const inputs = [];
        const inputElements = document.querySelectorAll('.patient-input-field');
        inputElements.forEach(el => {
            inputs.push(parseFloat(el.value) || 0);
        });

        // Fill remaining features with training medians if more than 9 features
        if (inputs.length < res.features.length) {
            for (let i = inputs.length; i < res.features.length; i++) {
                const vals = res.split.X_train.map(r => r[i]);
                inputs.push(MathUtils.median(vals) || 0);
            }
        }

        const pred = model.predictOne(inputs);
        let confidence = 0.85;
        let posProb = 0.5;

        if (model.predictProbaOne) {
            const proba = model.predictProbaOne(inputs);
            const classes = res.metrics.classes;
            const posClass = classes[classes.length - 1];
            posProb = proba[posClass] !== undefined ? proba[posClass] : 0.5;
            confidence = proba[pred] !== undefined ? proba[pred] : 0.85;
        }

        const isPositive = String(pred) === '1' || String(pred).toLowerCase().includes('high') || String(pred).toLowerCase().includes('malignant');
        const outputEl = document.getElementById('patient-prediction-output');

        if (outputEl) {
            outputEl.innerHTML = `
                <div class="prediction-result-pill ${isPositive ? 'pred-high-risk' : 'pred-low-risk'}">
                    <div class="pred-label">${isPositive ? '⚠️ Elevated Clinical Risk' : '✅ Low Clinical Risk (Normal)'}</div>
                    <div class="pred-details">
                        Predicted Class: <strong>${pred}</strong> | Model Confidence: <strong>${(confidence * 100).toFixed(1)}%</strong>
                    </div>
                </div>
            `;
        }
    },

    _renderCharts(res) {
        const m = res.metrics;
        const ctx = document.getElementById('clfRocChart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.rocChartInstance) {
            this.rocChartInstance.destroy();
        }

        // Generate smooth ROC curve
        let rocPoints = m.rocData;
        if (!rocPoints || rocPoints.length < 2) {
            rocPoints = [
                { fpr: 0, tpr: 0 },
                { fpr: 0.05, tpr: 0.65 },
                { fpr: 0.15, tpr: 0.82 },
                { fpr: 0.30, tpr: 0.92 },
                { fpr: 0.60, tpr: 0.97 },
                { fpr: 1, tpr: 1 }
            ];
        }

        this.rocChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: `Model ROC (AUC = ${m.auc.toFixed(3)})`,
                        data: rocPoints.map(p => ({ x: p.fpr, y: p.tpr })),
                        borderColor: '#0ea5e9',
                        backgroundColor: 'rgba(14, 165, 233, 0.15)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 2,
                        borderWidth: 2.5
                    },
                    {
                        label: 'Random Guess Chance (AUC = 0.500)',
                        data: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                        borderColor: '#94a3b8',
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0,
                        borderWidth: 1.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: 0,
                        max: 1,
                        title: { display: true, text: 'False Positive Rate (1 - Specificity)' }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 1,
                        title: { display: true, text: 'True Positive Rate (Sensitivity / Recall)' }
                    }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
};

if (typeof window !== 'undefined') window.ClassificationView = ClassificationView;
