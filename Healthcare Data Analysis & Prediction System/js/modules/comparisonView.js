/**
 * Healthcare Data Analysis & Prediction System
 * Data Mining Comparison & Benchmarking View Module
 */

const ComparisonView = {
    clfChartInstance: null,
    regChartInstance: null,
    clustChartInstance: null,

    render() {
        const state = window.appState;
        const ds = state.activeDataset;
        const container = document.getElementById('view-container');
        if (!container) return;

        const clfModels = state.trainedModels.classification;
        const regModels = state.trainedModels.regression;
        const clustModels = state.trainedModels.clustering;
        const assocResult = state.trainedModels.association;

        const hasClf = Object.keys(clfModels).length > 0;
        const hasReg = Object.keys(regModels).length > 0;
        const hasClust = Object.keys(clustModels).length > 0;

        container.innerHTML = `
            <div class="comparison-wrapper animate-fade-in">
                <!-- Comparison Header -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Data Mining Algorithm Benchmark & Comparison Center</h2>
                            <p class="card-subtitle">Rigorous cross-algorithmic performance comparison, trade-off analysis, and clinical audit reporting</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-secondary btn-sm" onclick="ComparisonView.exportFullReport()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                Print / Export Clinical Audit Report
                            </button>
                        </div>
                    </div>

                    <div class="card-body">
                        <!-- Quick One-Click Benchmark Runners Strip -->
                        <div class="benchmark-runners-bar">
                            <div class="runner-card">
                                <div>
                                    <strong>Supervised Classification Suite</strong>
                                    <div class="text-xs text-muted">Run Decision Tree, KNN, Naive Bayes, Logistic Regression, Random Forest, and SVM on identical split</div>
                                </div>
                                <button class="btn btn-primary btn-sm" id="btn-run-all-clf" onclick="ComparisonView.benchmarkAllClassification()">
                                    Benchmark All 6 Classifiers
                                </button>
                            </div>

                            <div class="runner-card">
                                <div>
                                    <strong>Continuous Regression Suite</strong>
                                    <div class="text-xs text-muted">Run Linear, Multiple Linear, Polynomial, Tree, and Forest Regressors on identical split</div>
                                </div>
                                <button class="btn btn-primary btn-sm" id="btn-run-all-reg" onclick="ComparisonView.benchmarkAllRegression()">
                                    Benchmark All 5 Regressors
                                </button>
                            </div>

                            <div class="runner-card">
                                <div>
                                    <strong>Unsupervised Clustering Suite</strong>
                                    <div class="text-xs text-muted">Run K-Means, Agglomerative Hierarchical, and DBSCAN on identical feature space</div>
                                </div>
                                <button class="btn btn-primary btn-sm" id="btn-run-all-clust" onclick="ComparisonView.benchmarkAllClustering()">
                                    Benchmark Clustering Models
                                </button>
                            </div>
                        </div>

                        <!-- Metric Segregation Notice -->
                        <div class="alert alert-info mt-3 mb-0">
                            <strong>Note on Metric Integrity:</strong> In accordance with scientific data mining standards, metrics from distinct analytical paradigms are strictly separated into dedicated benchmark sections below. Classification Accuracy/F1, Regression R²/RMSE, and Clustering Silhouette scores are never conflated or cross-compared.
                        </div>
                    </div>
                </div>

                <!-- SECTION 1: Classification Comparison -->
                <div class="card mb-4" id="clf-benchmark-card">
                    <div class="card-header border-bottom">
                        <div>
                            <h3 class="card-title">1. Supervised Classification Benchmark Leaderboard</h3>
                            <p class="card-subtitle">Evaluated on test cohort with standardized Train/Test split</p>
                        </div>
                        <span class="badge badge-primary">Classification Domain</span>
                    </div>

                    <div class="card-body">
                        ${hasClf ? this._renderClassificationLeaderboard(clfModels) : `
                            <div class="empty-state p-4">
                                <p class="empty-state-text">No classification models trained yet. Click "Benchmark All 6 Classifiers" above to run an automated tournament!</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- SECTION 2: Regression Comparison -->
                <div class="card mb-4" id="reg-benchmark-card">
                    <div class="card-header border-bottom">
                        <div>
                            <h3 class="card-title">2. Continuous Regression Benchmark Leaderboard</h3>
                            <p class="card-subtitle">Variance explained (R²), mean absolute error, and root mean squared error</p>
                        </div>
                        <span class="badge badge-primary">Regression Domain</span>
                    </div>

                    <div class="card-body">
                        ${hasReg ? this._renderRegressionLeaderboard(regModels) : `
                            <div class="empty-state p-4">
                                <p class="empty-state-text">No regression models trained yet. Click "Benchmark All 5 Regressors" above to run the regression tournament!</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- SECTION 3: Clustering Comparison -->
                <div class="card mb-4" id="clust-benchmark-card">
                    <div class="card-header border-bottom">
                        <div>
                            <h3 class="card-title">3. Unsupervised Clustering & Cohort Partitioning</h3>
                            <p class="card-subtitle">Cluster cohesion, silhouette separation width, and discovered cohort structures</p>
                        </div>
                        <span class="badge badge-primary">Clustering Domain</span>
                    </div>

                    <div class="card-body">
                        ${hasClust ? this._renderClusteringLeaderboard(clustModels) : `
                            <div class="empty-state p-4">
                                <p class="empty-state-text">No clustering models trained yet. Click "Benchmark Clustering Models" above to run K-Means, Hierarchical, and DBSCAN.</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- SECTION 4: Association Rule Mining Summary -->
                <div class="card mb-4">
                    <div class="card-header border-bottom">
                        <div>
                            <h3 class="card-title">4. Clinical Association & Comorbidity Patterns Summary</h3>
                            <p class="card-subtitle">Apriori frequent patterns, support, confidence, and peak association lift</p>
                        </div>
                        <span class="badge badge-primary">Association Mining</span>
                    </div>

                    <div class="card-body">
                        ${assocResult ? this._renderAssociationSummary(assocResult) : `
                            <div class="empty-state p-4">
                                <p class="empty-state-text">No association rules mined yet. Navigate to the <strong>Association Rules</strong> tab to discover clinical comorbidity patterns.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        if (hasClf) this._renderClfChart(clfModels);
        if (hasReg) this._renderRegChart(regModels);
        if (hasClust) this._renderClustChart(clustModels);
    },

    // Batch Benchmark Runners
    benchmarkAllClassification() {
        const btn = document.getElementById('btn-run-all-clf');
        if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Benchmarking 6 Models...';

        setTimeout(() => {
            const ds = window.appState.activeDataset;
            const data = ds.activeData;
            const targetCol = ds.targetColumn;
            const features = ds.columns.filter(c => c !== targetCol);

            // Prepare matrix
            const X = data.map(r => features.map(f => Number(r[f]) || 0));
            const y = data.map(r => r[targetCol]);
            const split = MathUtils.trainTestSplit(X, y, 0.2, 42);

            const algos = [
                { id: 'decision_tree', name: 'Decision Tree (CART)', model: new DecisionTree({ maxDepth: 6 }) },
                { id: 'random_forest', name: 'Random Forest Ensemble', model: new RandomForest({ nEstimators: 15, maxDepth: 6 }) },
                { id: 'knn', name: 'K-Nearest Neighbors (KNN)', model: new KNNClassifier({ k: 5 }) },
                { id: 'naive_bayes', name: 'Gaussian Naive Bayes', model: new GaussianNaiveBayes() },
                { id: 'logistic_regression', name: 'Logistic Regression', model: new LogisticRegression({ learningRate: 0.05 }) },
                { id: 'svm', name: 'Support Vector Machine (SVM)', model: new SVMClassifier({ C: 1.0, kernel: 'linear' }) }
            ];

            algos.forEach(item => {
                const t0 = performance.now();
                item.model.fit(split.X_train, split.y_train, features);
                const yPred = item.model.predict(split.X_test);

                let yProb = null;
                if (item.model.predictProba) {
                    const probs = item.model.predictProba(split.X_test);
                    if (probs && probs.length > 0) {
                        const classes = Array.from(new Set(y)).sort();
                        const posClass = classes[classes.length - 1];
                        yProb = probs.map(p => p[posClass] !== undefined ? p[posClass] : 0.5);
                    }
                }

                const elapsed = Math.round(performance.now() - t0);
                const evalMetrics = MathUtils.evaluateClassification(split.y_test, yPred, yProb);
                evalMetrics.trainTimeMs = elapsed;

                window.appState.recordModelResult('classification', item.id, {
                    algorithm: item.id,
                    algorithmName: item.name,
                    metrics: evalMetrics,
                    model: item.model,
                    split,
                    features,
                    target: targetCol,
                    timestamp: new Date().toLocaleTimeString()
                });
            });

            this.render();
        }, 50);
    },

    benchmarkAllRegression() {
        const btn = document.getElementById('btn-run-all-reg');
        if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Benchmarking 5 Regressors...';

        setTimeout(() => {
            const ds = window.appState.activeDataset;
            const data = ds.activeData;
            const targetCol = ds.targetColumn;
            const features = ds.columns.filter(c => c !== targetCol);

            const X = data.map(r => features.map(f => Number(r[f]) || 0));
            const y = data.map(r => Number(r[targetCol]) || 0);
            const split = MathUtils.trainTestSplit(X, y, 0.2, 42);

            const algos = [
                { id: 'linear', name: 'Simple Linear Regression', model: new LinearRegression(), feat: [features[0]] },
                { id: 'multiple_linear', name: 'Multiple Linear Regression', model: new LinearRegression(), feat: features },
                { id: 'polynomial', name: 'Polynomial Regression (Deg 2)', model: new PolynomialRegression({ degree: 2 }), feat: features },
                { id: 'decision_tree_reg', name: 'Decision Tree Regressor', model: new DecisionTree({ isRegression: true, maxDepth: 6 }), feat: features },
                { id: 'random_forest_reg', name: 'Random Forest Regressor', model: new RandomForest({ isRegression: true, nEstimators: 15, maxDepth: 6 }), feat: features }
            ];

            algos.forEach(item => {
                const t0 = performance.now();
                const curXTrain = item.feat.length === 1 ? split.X_train.map(r => [r[0]]) : split.X_train;
                const curXTest = item.feat.length === 1 ? split.X_test.map(r => [r[0]]) : split.X_test;

                item.model.fit(curXTrain, split.y_train, item.feat);
                const yPred = item.model.predict(curXTest);
                const elapsed = Math.round(performance.now() - t0);

                const evalMetrics = MathUtils.evaluateRegression(split.y_test, yPred, item.feat.length);
                evalMetrics.trainTimeMs = elapsed;

                window.appState.recordModelResult('regression', item.id, {
                    algorithm: item.id,
                    algorithmName: item.name,
                    metrics: evalMetrics,
                    model: item.model,
                    split,
                    features: item.feat,
                    target: targetCol,
                    yTest: split.y_test,
                    yPred,
                    timestamp: new Date().toLocaleTimeString()
                });
            });

            this.render();
        }, 50);
    },

    benchmarkAllClustering() {
        const btn = document.getElementById('btn-run-all-clust');
        if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Benchmarking Clustering...';

        setTimeout(() => {
            const ds = window.appState.activeDataset;
            const data = ds.activeData;
            const features = ds.columns.filter(c => c !== ds.targetColumn);
            const X = data.map(r => features.map(f => Number(r[f]) || 0));

            const algos = [
                { id: 'kmeans', name: 'K-Means (K=3)', model: new KMeans({ k: 3 }) },
                { id: 'hierarchical', name: 'Agglomerative Hierarchical (K=3)', model: new AgglomerativeClustering({ nClusters: 3 }) },
                { id: 'dbscan', name: 'DBSCAN (ε=0.8, MinPts=4)', model: new DBSCAN({ eps: 0.8, minPts: 4 }) }
            ];

            algos.forEach(item => {
                const t0 = performance.now();
                item.model.fit(X);
                const elapsed = Math.round(performance.now() - t0);

                const clusterCounts = {};
                item.model.labels.forEach(l => clusterCounts[l] = (clusterCounts[l] || 0) + 1);

                window.appState.recordModelResult('clustering', item.id, {
                    algorithm: item.id,
                    algorithmName: item.name,
                    model: item.model,
                    labels: item.model.labels,
                    silhouetteScore: item.model.silhouetteScore || 0,
                    inertia: item.model.inertia || 0,
                    noiseCount: item.model.noiseCount || 0,
                    clusterCounts,
                    features,
                    trainTimeMs: elapsed,
                    timestamp: new Date().toLocaleTimeString(),
                    metrics: { silhouetteScore: item.model.silhouetteScore || 0 }
                });
            });

            this.render();
        }, 50);
    },

    _renderClassificationLeaderboard(models) {
        const list = Object.values(models).sort((a, b) => b.metrics.f1Score - a.metrics.f1Score);
        const bestF1 = list[0];
        const bestRecall = [...list].sort((a, b) => b.metrics.recall - a.metrics.recall)[0];

        return `
            <!-- Recommendation Badges -->
            <div class="champion-badges-grid mb-4">
                <div class="champion-card champion-primary">
                    <div class="champion-icon">🏆</div>
                    <div class="champion-info">
                        <div class="champion-title">Best Overall Classification Model</div>
                        <div class="champion-name">${bestF1.algorithmName}</div>
                        <div class="champion-metric">Highest F1-Score: <strong>${(bestF1.metrics.f1Score * 100).toFixed(1)}%</strong> | Accuracy: <strong>${(bestF1.metrics.accuracy * 100).toFixed(1)}%</strong></div>
                    </div>
                </div>

                <div class="champion-card champion-screening">
                    <div class="champion-icon">🩺</div>
                    <div class="champion-info">
                        <div class="champion-title">Recommended for Clinical Triage & Screening</div>
                        <div class="champion-name">${bestRecall.algorithmName}</div>
                        <div class="champion-metric">Highest Sensitivity/Recall: <strong>${(bestRecall.metrics.recall * 100).toFixed(1)}%</strong> (Minimizes dangerous false negatives)</div>
                    </div>
                </div>
            </div>

            <!-- Leaderboard Table -->
            <div class="table-responsive mb-4">
                <table class="clinical-data-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Algorithm</th>
                            <th>Accuracy</th>
                            <th>Precision</th>
                            <th>Recall (Sensitivity)</th>
                            <th>Specificity</th>
                            <th>F1-Score</th>
                            <th>ROC AUC</th>
                            <th>Latency</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map((m, idx) => `
                            <tr class="${idx === 0 ? 'tr-winner' : ''}">
                                <td><span class="rank-badge rank-${idx + 1}">#${idx + 1}</span></td>
                                <td><strong>${m.algorithmName}</strong></td>
                                <td>${(m.metrics.accuracy * 100).toFixed(1)}%</td>
                                <td>${(m.metrics.precision * 100).toFixed(1)}%</td>
                                <td><strong>${(m.metrics.recall * 100).toFixed(1)}%</strong></td>
                                <td>${(m.metrics.specificity * 100).toFixed(1)}%</td>
                                <td><strong class="text-teal">${(m.metrics.f1Score * 100).toFixed(1)}%</strong></td>
                                <td>${m.metrics.auc.toFixed(3)}</td>
                                <td>${m.metrics.trainTimeMs} ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Comparison Chart Container -->
            <div class="chart-container" style="height: 280px; position: relative;">
                <canvas id="clfComparisonChart"></canvas>
            </div>
        `;
    },

    _renderRegressionLeaderboard(models) {
        const list = Object.values(models).sort((a, b) => b.metrics.r2 - a.metrics.r2);
        const best = list[0];

        return `
            <div class="champion-badges-grid mb-4">
                <div class="champion-card champion-primary">
                    <div class="champion-icon">🎯</div>
                    <div class="champion-info">
                        <div class="champion-title">Top Continuous Outcome Regressor</div>
                        <div class="champion-name">${best.algorithmName}</div>
                        <div class="champion-metric">Peak R²: <strong>${(best.metrics.r2 * 100).toFixed(1)}%</strong> | Lowest RMSE: <strong>${best.metrics.rmse.toFixed(2)}</strong></div>
                    </div>
                </div>
            </div>

            <div class="table-responsive mb-4">
                <table class="clinical-data-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Model</th>
                            <th>R² Score</th>
                            <th>Adjusted R²</th>
                            <th>RMSE</th>
                            <th>MAE</th>
                            <th>MSE</th>
                            <th>Latency</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map((m, idx) => `
                            <tr class="${idx === 0 ? 'tr-winner' : ''}">
                                <td><span class="rank-badge rank-${idx + 1}">#${idx + 1}</span></td>
                                <td><strong>${m.algorithmName}</strong></td>
                                <td><strong class="text-teal">${(m.metrics.r2 * 100).toFixed(1)}%</strong></td>
                                <td>${(m.metrics.adjR2 * 100).toFixed(1)}%</td>
                                <td><strong>${m.metrics.rmse.toFixed(2)}</strong></td>
                                <td>${m.metrics.mae.toFixed(2)}</td>
                                <td>${m.metrics.mse.toFixed(1)}</td>
                                <td>${m.metrics.trainTimeMs} ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="chart-container" style="height: 270px; position: relative;">
                <canvas id="regComparisonChart"></canvas>
            </div>
        `;
    },

    _renderClusteringLeaderboard(models) {
        const list = Object.values(models).sort((a, b) => b.silhouetteScore - a.silhouetteScore);
        const best = list[0];

        return `
            <div class="champion-badges-grid mb-4">
                <div class="champion-card champion-primary">
                    <div class="champion-icon">🧬</div>
                    <div class="champion-info">
                        <div class="champion-title">Optimal Patient Segmentation Method</div>
                        <div class="champion-name">${best.algorithmName}</div>
                        <div class="champion-metric">Silhouette Separation: <strong>${best.silhouetteScore.toFixed(3)}</strong></div>
                    </div>
                </div>
            </div>

            <div class="table-responsive mb-4">
                <table class="clinical-data-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Algorithm</th>
                            <th>Silhouette Score</th>
                            <th>Discovered Clusters</th>
                            <th>Atypical / Noise Cases</th>
                            <th>Inertia (WCSS)</th>
                            <th>Latency</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map((m, idx) => `
                            <tr class="${idx === 0 ? 'tr-winner' : ''}">
                                <td><span class="rank-badge rank-${idx + 1}">#${idx + 1}</span></td>
                                <td><strong>${m.algorithmName}</strong></td>
                                <td><strong class="text-teal">${m.silhouetteScore.toFixed(3)}</strong></td>
                                <td>${Object.keys(m.clusterCounts).length}</td>
                                <td>${m.noiseCount}</td>
                                <td>${m.inertia > 0 ? m.inertia.toFixed(0) : 'N/A'}</td>
                                <td>${m.trainTimeMs} ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="chart-container" style="height: 250px; position: relative;">
                <canvas id="clustComparisonChart"></canvas>
            </div>
        `;
    },

    _renderAssociationSummary(assoc) {
        const rules = assoc.rules || [];
        const topRule = rules[0];

        return `
            <div class="row-flex mb-3">
                <div class="summary-metric-item">
                    <span class="metric-muted">Rules Mined</span>
                    <strong class="metric-strong">${rules.length}</strong>
                </div>
                <div class="summary-metric-item">
                    <span class="metric-muted">Max Association Lift</span>
                    <strong class="metric-strong text-teal">${topRule ? topRule.lift.toFixed(2) + '×' : 'N/A'}</strong>
                </div>
                <div class="summary-metric-item">
                    <span class="metric-muted">Top Antecedent</span>
                    <strong class="metric-strong text-truncate">${topRule ? topRule.antecedent.join(', ') : 'N/A'}</strong>
                </div>
                <div class="summary-metric-item">
                    <span class="metric-muted">Top Consequent</span>
                    <strong class="metric-strong text-truncate">${topRule ? topRule.consequent.join(', ') : 'N/A'}</strong>
                </div>
            </div>

            ${topRule ? `
                <div class="clinical-insight-card">
                    <div class="insight-badge">Leading Comorbidity Association Pattern</div>
                    <p class="insight-text">${topRule.clinicalInsight}</p>
                </div>
            ` : ''}
        `;
    },

    _renderClfChart(models) {
        const ctx = document.getElementById('clfComparisonChart');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.clfChartInstance) this.clfChartInstance.destroy();

        const labels = Object.values(models).map(m => m.algorithmName.split(' ')[0]);
        const accuracyData = Object.values(models).map(m => +(m.metrics.accuracy * 100).toFixed(1));
        const recallData = Object.values(models).map(m => +(m.metrics.recall * 100).toFixed(1));
        const f1Data = Object.values(models).map(m => +(m.metrics.f1Score * 100).toFixed(1));

        this.clfChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Accuracy (%)', data: accuracyData, backgroundColor: 'rgba(14, 165, 233, 0.85)' },
                    { label: 'Recall / Sensitivity (%)', data: recallData, backgroundColor: 'rgba(16, 185, 129, 0.85)' },
                    { label: 'F1-Score (%)', data: f1Data, backgroundColor: 'rgba(139, 92, 246, 0.85)' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 100, title: { display: true, text: 'Percentage (%)' } }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    },

    _renderRegChart(models) {
        const ctx = document.getElementById('regComparisonChart');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.regChartInstance) this.regChartInstance.destroy();

        const labels = Object.values(models).map(m => m.algorithmName.slice(0, 16));
        const r2Data = Object.values(models).map(m => +(m.metrics.r2 * 100).toFixed(1));

        this.regChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'R² Score (% Variance Explained)', data: r2Data, backgroundColor: 'rgba(20, 184, 166, 0.85)' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 100, title: { display: true, text: 'R² (%)' } }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    },

    _renderClustChart(models) {
        const ctx = document.getElementById('clustComparisonChart');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.clustChartInstance) this.clustChartInstance.destroy();

        const labels = Object.values(models).map(m => m.algorithmName.slice(0, 18));
        const silData = Object.values(models).map(m => +m.silhouetteScore.toFixed(3));

        this.clustChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Silhouette Coefficient', data: silData, backgroundColor: 'rgba(99, 102, 241, 0.85)' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 1, title: { display: true, text: 'Silhouette Coefficient' } }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    },

    exportFullReport() {
        window.print();
    }
};

if (typeof window !== 'undefined') window.ComparisonView = ComparisonView;
