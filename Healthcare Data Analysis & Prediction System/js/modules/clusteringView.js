/**
 * Healthcare Data Analysis & Prediction System
 * Clustering & Patient Segmentation View Module
 */

const ClusteringView = {
    selectedAlgorithm: 'kmeans', // kmeans, hierarchical, dbscan
    kClusters: 3,
    linkage: 'average',
    dbscanEps: 0.8,
    dbscanMinPts: 4,
    lastTrainedResult: null,
    clusterScatterChart: null,
    elbowChartInstance: null,

    render() {
        const state = window.appState;
        const ds = state.activeDataset;
        const container = document.getElementById('view-container');
        if (!container) return;

        const candidateFeatures = ds.columns.filter(c => c !== ds.targetColumn);
        const lastResult = this.lastTrainedResult || state.trainedModels.clustering[this.selectedAlgorithm];

        container.innerHTML = `
            <div class="ml-module-wrapper animate-fade-in">
                <!-- Clustering Header -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Patient Cohort Clustering & Segmentation</h2>
                            <p class="card-subtitle">Uncover hidden sub-phenotypes and clinical patient profiles through unsupervised machine learning</p>
                        </div>
                        <span class="badge badge-primary">Unsupervised Learning</span>
                    </div>

                    <div class="card-body">
                        <!-- Controls Row -->
                        <div class="model-config-grid">
                            <div class="config-col">
                                <label class="input-label">Select Clustering Algorithm</label>
                                <select class="form-select" id="clust-algo-select" onchange="ClusteringView.onAlgorithmChange(this.value)">
                                    <option value="kmeans" ${this.selectedAlgorithm === 'kmeans' ? 'selected' : ''}>K-Means Clustering (Lloyd's ++)</option>
                                    <option value="hierarchical" ${this.selectedAlgorithm === 'hierarchical' ? 'selected' : ''}>Agglomerative Hierarchical Clustering</option>
                                    <option value="dbscan" ${this.selectedAlgorithm === 'dbscan' ? 'selected' : ''}>DBSCAN (Density-Based with Noise)</option>
                                </select>
                            </div>

                            <div class="config-col" id="clust-k-container">
                                ${this.selectedAlgorithm === 'dbscan' ? `
                                    <div class="d-flex gap-2">
                                        <div style="flex: 1;">
                                            <label class="input-label">Epsilon (&epsilon;): <strong id="val-eps">${this.dbscanEps}</strong></label>
                                            <input type="range" class="form-range" min="0.2" max="3.0" step="0.1" value="${this.dbscanEps}" 
                                                   oninput="ClusteringView.dbscanEps = +this.value; document.getElementById('val-eps').innerText = this.value">
                                        </div>
                                        <div style="flex: 1;">
                                            <label class="input-label">MinPts: <strong id="val-minpts">${this.dbscanMinPts}</strong></label>
                                            <input type="range" class="form-range" min="2" max="15" value="${this.dbscanMinPts}" 
                                                   oninput="ClusteringView.dbscanMinPts = +this.value; document.getElementById('val-minpts').innerText = this.value">
                                        </div>
                                    </div>
                                ` : `
                                    <label class="input-label">Number of Clusters (K): <strong id="val-k-clusters">${this.kClusters}</strong></label>
                                    <input type="range" class="form-range" min="2" max="8" value="${this.kClusters}" 
                                           oninput="ClusteringView.kClusters = +this.value; document.getElementById('val-k-clusters').innerText = this.value">
                                `}
                            </div>

                            <div class="config-col d-flex align-end">
                                <button class="btn btn-secondary btn-block" onclick="ClusteringView.runElbowAnalysis()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                    Generate Elbow Curve (Optimal K)
                                </button>
                            </div>
                        </div>

                        <!-- Clinical Predictor Features Selection -->
                        <div class="feature-selection-section mt-3">
                            <div class="d-flex justify-between align-center mb-2">
                                <label class="input-label mb-0">Select Features for Patient Clustering Space (${candidateFeatures.length} available):</label>
                                <div>
                                    <button class="btn btn-ghost btn-xs" onclick="ClusteringView.toggleAllFeatures(true)">Select All</button>
                                    <button class="btn btn-ghost btn-xs" onclick="ClusteringView.toggleAllFeatures(false)">Deselect All</button>
                                </div>
                            </div>
                            <div class="feature-checkboxes-bar">
                                ${candidateFeatures.map(f => `
                                    <label class="feature-chip">
                                        <input type="checkbox" class="clust-feature-check" value="${f}" checked>
                                        <span>${f}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Run Action Bar -->
                        <div class="mt-4 pt-3 border-top d-flex align-center justify-between">
                            <div class="dataset-ready-note">
                                <span class="badge ${ds.isPreprocessed ? 'badge-success' : 'badge-neutral'}">
                                    Using: ${ds.isPreprocessed ? 'Preprocessed Data' : 'Raw Baseline Data'}
                                </span>
                                <span class="text-muted ml-2">${ds.activeData.length} records</span>
                            </div>
                            <button class="btn btn-primary btn-lg" id="run-clust-btn" onclick="ClusteringView.runClustering()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>
                                Execute Patient Clustering
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Elbow Curve Modal / Drawer -->
                <div id="elbow-container" class="card mb-4" style="display: none;">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">K-Means Elbow Method Analysis</h3>
                            <p class="card-subtitle">Within-Cluster Sum of Squares (Inertia) across K = 2 to 8. Look for the "elbow point" where inertia curve flattens.</p>
                        </div>
                        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('elbow-container').style.display='none'">Close</button>
                    </div>
                    <div class="card-body">
                        <div style="height: 220px; position: relative;">
                            <canvas id="elbowCurveChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Clustering Results Container -->
                <div id="clust-results-section">
                    ${lastResult ? this._renderClusteringResults(lastResult) : `
                        <div class="card p-5 text-center">
                            <div class="empty-state-icon">🧬</div>
                            <h3 class="mt-3">Clustering Not Yet Executed</h3>
                            <p class="text-muted">Configure clustering parameters above and click <strong>"Execute Patient Clustering"</strong> to generate silhouette scores, 2D PCA cluster projections, and patient clinical personas.</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        if (lastResult) {
            this._renderScatterChart(lastResult);
        }
    },

    onAlgorithmChange(algo) {
        this.selectedAlgorithm = algo;
        this.render();
    },

    toggleAllFeatures(checked) {
        document.querySelectorAll('.clust-feature-check').forEach(cb => cb.checked = checked);
    },

    runClustering() {
        const state = window.appState;
        const ds = state.activeDataset;
        const data = ds.activeData;

        const selectedFeatures = Array.from(document.querySelectorAll('.clust-feature-check:checked')).map(el => el.value);

        if (selectedFeatures.length < 2) {
            alert('Please select at least two features for clustering.');
            return;
        }

        const btn = document.getElementById('run-clust-btn');
        if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Clustering Patients...';

        setTimeout(() => {
            try {
                const startTime = performance.now();

                // Build numerical feature matrix
                const X = [];
                data.forEach(row => {
                    const rowFeatures = selectedFeatures.map(f => {
                        const val = row[f];
                        const num = Number(val);
                        return isNaN(num) ? 0 : num;
                    });
                    X.push(rowFeatures);
                });

                let model;
                switch (this.selectedAlgorithm) {
                    case 'kmeans':
                        model = new KMeans({ k: this.kClusters });
                        break;
                    case 'hierarchical':
                        model = new AgglomerativeClustering({ nClusters: this.kClusters, linkage: this.linkage });
                        break;
                    case 'dbscan':
                        model = new DBSCAN({ eps: this.dbscanEps, minPts: this.dbscanMinPts });
                        break;
                }

                model.fit(X);

                // Compute PCA 2D projection for visualization
                const pca = MathUtils.pca2D(X);

                // Cluster counts
                const clusterCounts = {};
                model.labels.forEach(l => clusterCounts[l] = (clusterCounts[l] || 0) + 1);

                // Clinical personas (averages of features by cluster)
                const personas = this._calculateClusterPersonas(data, model.labels, selectedFeatures);

                const elapsed = Math.round(performance.now() - startTime);

                const result = {
                    algorithm: this.selectedAlgorithm,
                    algorithmName: this._getAlgoDisplayName(this.selectedAlgorithm),
                    model,
                    labels: model.labels,
                    silhouetteScore: model.silhouetteScore || 0,
                    inertia: model.inertia || 0,
                    noiseCount: model.noiseCount || 0,
                    clusterCounts,
                    personas,
                    pcaPoints: pca.points,
                    features: selectedFeatures,
                    trainTimeMs: elapsed,
                    timestamp: new Date().toLocaleTimeString()
                };

                this.lastTrainedResult = result;
                state.recordModelResult('clustering', this.selectedAlgorithm, {
                    ...result,
                    metrics: { silhouetteScore: result.silhouetteScore }
                });

                this.render();
            } catch (err) {
                console.error(err);
                alert('Clustering error: ' + err.message);
                if (btn) btn.innerHTML = 'Execute Patient Clustering';
            }
        }, 60);
    },

    _getAlgoDisplayName(id) {
        const names = {
            kmeans: `K-Means (K=${this.kClusters})`,
            hierarchical: `Agglomerative Hierarchical (K=${this.kClusters})`,
            dbscan: `DBSCAN (ε=${this.dbscanEps})`
        };
        return names[id] || id;
    },

    _calculateClusterPersonas(data, labels, features) {
        const clusters = Array.from(new Set(labels)).sort((a, b) => a - b);
        const personas = [];

        clusters.forEach(c => {
            const memberIndices = labels.map((l, idx) => l === c ? idx : -1).filter(idx => idx !== -1);
            const count = memberIndices.length;
            const pct = ((count / labels.length) * 100).toFixed(1);

            const featureAvgs = {};
            features.forEach(f => {
                const vals = memberIndices.map(idx => Number(data[idx][f])).filter(v => !isNaN(v));
                featureAvgs[f] = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            });

            // Medical Persona label generator
            let personaLabel = c === -1 ? 'Clinical Outliers / Atypical Presentations' : `Sub-Cohort Phenotype ${c + 1}`;
            personas.push({
                clusterId: c,
                label: personaLabel,
                count,
                percentage: pct,
                averages: featureAvgs
            });
        });

        return personas;
    },

    runElbowAnalysis() {
        const state = window.appState;
        const data = state.activeDataset.activeData;
        const selectedFeatures = Array.from(document.querySelectorAll('.clust-feature-check:checked')).map(el => el.value);

        if (selectedFeatures.length < 2) {
            alert('Please select features first.');
            return;
        }

        const X = data.map(r => selectedFeatures.map(f => Number(r[f]) || 0));
        const ks = [2, 3, 4, 5, 6, 7, 8];
        const inertias = [];

        ks.forEach(k => {
            const km = new KMeans({ k, maxIter: 50 });
            km.fit(X);
            inertias.push(km.inertia);
        });

        const drawer = document.getElementById('elbow-container');
        if (drawer) drawer.style.display = 'block';

        const ctx = document.getElementById('elbowCurveChart');
        if (ctx && typeof Chart !== 'undefined') {
            if (this.elbowChartInstance) this.elbowChartInstance.destroy();

            this.elbowChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ks.map(k => `K = ${k}`),
                    datasets: [{
                        label: 'Inertia (Within-Cluster Sum of Squares)',
                        data: inertias,
                        borderColor: '#0ea5e9',
                        backgroundColor: 'rgba(14, 165, 233, 0.2)',
                        fill: true,
                        tension: 0.2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { title: { display: true, text: 'Inertia (WCSS)' } }
                    }
                }
            });
        }
    },

    _renderClusteringResults(res) {
        const clusters = Object.keys(res.clusterCounts);

        return `
            <div class="results-container animate-fade-in">
                <!-- Clustering Metrics KPI Strip -->
                <div class="metrics-grid mb-4">
                    <div class="metric-card">
                        <div class="metric-title">Silhouette Score</div>
                        <div class="metric-num text-teal">${res.silhouetteScore.toFixed(3)}</div>
                        <div class="metric-desc">${res.silhouetteScore > 0.4 ? 'Good cohort separation' : 'Moderate cohesion'}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Formed Clusters</div>
                        <div class="metric-num text-cyan">${clusters.length}</div>
                        <div class="metric-desc">Discovered sub-phenotypes</div>
                    </div>
                    ${res.noiseCount > 0 ? `
                        <div class="metric-card">
                            <div class="metric-title">Noise / Outlier Points</div>
                            <div class="metric-num text-amber">${res.noiseCount}</div>
                            <div class="metric-desc">Unclustered atypical cases</div>
                        </div>
                    ` : `
                        <div class="metric-card">
                            <div class="metric-title">Inertia (WCSS)</div>
                            <div class="metric-num text-blue">${res.inertia > 0 ? res.inertia.toFixed(0) : 'N/A'}</div>
                            <div class="metric-desc">Compactness score</div>
                        </div>
                    `}
                    <div class="metric-card">
                        <div class="metric-title">Execution Latency</div>
                        <div class="metric-num text-purple">${res.trainTimeMs} ms</div>
                        <div class="metric-desc">Clustering computation time</div>
                    </div>
                </div>

                <!-- 2D PCA Cluster Scatter Plot -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">2D Principal Component Projection (Patient Phenotype Space)</h3>
                            <p class="card-subtitle">High-dimensional clinical variables projected into 2 principal axes (PC1 vs PC2) with cluster assignments</p>
                        </div>
                        <span class="badge badge-info">PCA 2D Space</span>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="height: 320px; position: relative;">
                            <canvas id="clusterScatterPlot"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Patient Clinical Persona Archetypes -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Discovered Patient Cohort Personas</h3>
                            <p class="card-subtitle">Synthesized clinical profiles and mean physiological markers for each discovered patient cluster</p>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="persona-cards-grid">
                            ${res.personas.map(p => `
                                <div class="persona-card ${p.clusterId === -1 ? 'persona-outlier' : ''}">
                                    <div class="persona-header">
                                        <div class="persona-title">${p.label}</div>
                                        <span class="badge ${p.clusterId === -1 ? 'badge-amber' : 'badge-primary'}">${p.count} Patients (${p.percentage}%)</span>
                                    </div>
                                    <div class="persona-averages-list">
                                        ${Object.keys(p.averages).slice(0, 5).map(f => `
                                            <div class="persona-stat-row">
                                                <span class="text-muted">${f}:</span>
                                                <strong>${p.averages[f].toFixed(1)}</strong>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    _renderScatterChart(res) {
        const ctx = document.getElementById('clusterScatterPlot');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.clusterScatterChart) {
            this.clusterScatterChart.destroy();
        }

        const palette = [
            '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
        ];

        // Group points by cluster label
        const clusters = Array.from(new Set(res.labels)).sort((a, b) => a - b);
        const datasets = clusters.map((c, idx) => {
            const pts = [];
            for (let i = 0; i < res.labels.length; i++) {
                if (res.labels[i] === c) {
                    pts.push({ x: res.pcaPoints[i][0], y: res.pcaPoints[i][1] });
                }
            }

            const color = c === -1 ? '#94a3b8' : palette[idx % palette.length];
            return {
                label: c === -1 ? 'Noise / Atypical' : `Cohort Phenotype ${c + 1} (${pts.length})`,
                data: pts,
                backgroundColor: color + 'cc',
                borderColor: color,
                pointRadius: c === -1 ? 3 : 5,
                borderWidth: 1
            };
        });

        this.clusterScatterChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Principal Component 1 (PC1)' } },
                    y: { title: { display: true, text: 'Principal Component 2 (PC2)' } }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
};

if (typeof window !== 'undefined') window.ClusteringView = ClusteringView;
