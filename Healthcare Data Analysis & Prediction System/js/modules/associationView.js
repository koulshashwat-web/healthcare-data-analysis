/**
 * Healthcare Data Analysis & Prediction System
 * Association Rule Mining View Module
 */

const AssociationView = {
    minSupport: 0.12,
    minConfidence: 0.50,
    minLift: 1.1,
    targetConsequentFilter: '',
    lastMinedResult: null,
    scatterChartInstance: null,

    render() {
        const state = window.appState;
        const ds = state.activeDataset;
        const container = document.getElementById('view-container');
        if (!container) return;

        const lastResult = this.lastMinedResult || state.trainedModels.association;

        container.innerHTML = `
            <div class="ml-module-wrapper animate-fade-in">
                <!-- Association Module Header -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Clinical Association Rule Mining (Apriori Analysis)</h2>
                            <p class="card-subtitle">Discover high-leverage risk factor co-occurrences, comorbidity patterns, and multi-symptom associations</p>
                        </div>
                        <span class="badge badge-primary">Unsupervised Pattern Mining</span>
                    </div>

                    <div class="card-body">
                        ${ds.id !== 'symptoms_association' ? `
                            <div class="alert alert-info d-flex justify-between align-center mb-3">
                                <div>
                                    <strong>Recommended Benchmark:</strong> While any discrete dataset can be mined, the <strong>Patient Symptoms & Comorbidity</strong> dataset is purpose-built with symptom-risk transactions.
                                </div>
                                <button class="btn btn-secondary btn-sm" onclick="DatasetManager.loadPreloaded('symptoms_association'); AssociationView.render();">
                                    Load Symptoms Dataset &rarr;
                                </button>
                            </div>
                        ` : ''}

                        <!-- Apriori Controls Grid -->
                        <div class="model-config-grid">
                            <div class="config-col">
                                <label class="input-label">Minimum Support: <strong id="val-supp">${Math.round(this.minSupport * 100)}%</strong></label>
                                <input type="range" class="form-range" min="0.05" max="0.40" step="0.01" value="${this.minSupport}" 
                                       oninput="AssociationView.minSupport = +this.value; document.getElementById('val-supp').innerText = Math.round(this.value * 100) + '%'">
                                <div class="text-xs text-muted mt-1">Itemset occurrence frequency in cohort</div>
                            </div>

                            <div class="config-col">
                                <label class="input-label">Minimum Confidence: <strong id="val-conf">${Math.round(this.minConfidence * 100)}%</strong></label>
                                <input type="range" class="form-range" min="0.20" max="0.90" step="0.05" value="${this.minConfidence}" 
                                       oninput="AssociationView.minConfidence = +this.value; document.getElementById('val-conf').innerText = Math.round(this.value * 100) + '%'">
                                <div class="text-xs text-muted mt-1">Conditional probability P(Consequent | Antecedent)</div>
                            </div>

                            <div class="config-col">
                                <label class="input-label">Filter by Target Consequent (Optional)</label>
                                <input type="text" class="form-control" placeholder="e.g., High_Risk or 1" value="${this.targetConsequentFilter}" 
                                       oninput="AssociationView.targetConsequentFilter = this.value">
                                <div class="text-xs text-muted mt-1">Isolates rules leading to specific disease outcomes</div>
                            </div>
                        </div>

                        <!-- Feature Checkboxes -->
                        <div class="feature-selection-section mt-3">
                            <div class="d-flex justify-between align-center mb-2">
                                <label class="input-label mb-0">Select Categorical Attributes & Clinical Risk Factors:</label>
                                <div>
                                    <button class="btn btn-ghost btn-xs" onclick="AssociationView.toggleAllFeatures(true)">Select All</button>
                                    <button class="btn btn-ghost btn-xs" onclick="AssociationView.toggleAllFeatures(false)">Deselect All</button>
                                </div>
                            </div>
                            <div class="feature-checkboxes-bar">
                                ${ds.columns.filter(c => c !== 'PatientID' && c !== 'id').map(f => `
                                    <label class="feature-chip">
                                        <input type="checkbox" class="assoc-feature-check" value="${f}" checked>
                                        <span>${f}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Mine Action Bar -->
                        <div class="mt-4 pt-3 border-top d-flex align-center justify-between">
                            <div class="dataset-ready-note">
                                <span class="badge badge-success">Apriori Engine Ready</span>
                                <span class="text-muted ml-2">${ds.activeData.length} patient transactions</span>
                            </div>
                            <button class="btn btn-primary btn-lg" id="run-apriori-btn" onclick="AssociationView.mineAssociationRules()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                Mine Association Rules
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Association Rules Output Section -->
                <div id="assoc-results-section">
                    ${lastResult ? this._renderAssociationResults(lastResult) : `
                        <div class="card p-5 text-center">
                            <div class="empty-state-icon">🔗</div>
                            <h3 class="mt-3">No Association Rules Mined Yet</h3>
                            <p class="text-muted">Adjust support and confidence thresholds above and click <strong>"Mine Association Rules"</strong> to discover frequent clinical itemsets and high-lift medical rules.</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        if (lastResult) {
            this._renderScatterPlot(lastResult);
        }
    },

    toggleAllFeatures(checked) {
        document.querySelectorAll('.assoc-feature-check').forEach(cb => cb.checked = checked);
    },

    mineAssociationRules() {
        const state = window.appState;
        const ds = state.activeDataset;
        const data = ds.activeData;

        const selectedFeatures = Array.from(document.querySelectorAll('.assoc-feature-check:checked')).map(el => el.value);

        if (selectedFeatures.length < 2) {
            alert('Please select at least two features for association analysis.');
            return;
        }

        const btn = document.getElementById('run-apriori-btn');
        if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Mining Rules...';

        setTimeout(() => {
            try {
                const startTime = performance.now();

                // Discretize tabular dataset into categorical transactions
                const transactions = Apriori.discretizeDataset(data, selectedFeatures);

                const apriori = new Apriori({
                    minSupport: this.minSupport,
                    minConfidence: this.minConfidence,
                    minLift: this.minLift,
                    maxItemsetSize: 3,
                    targetConsequent: this.targetConsequentFilter || null
                });

                apriori.fit(transactions);

                const elapsed = Math.round(performance.now() - startTime);

                const result = {
                    rules: apriori.rules,
                    frequentItemsets: apriori.frequentItemsets,
                    totalTransactions: transactions.length,
                    executionTimeMs: elapsed,
                    timestamp: new Date().toLocaleTimeString(),
                    metrics: { rulesCount: apriori.rules.length }
                };

                this.lastMinedResult = result;
                state.recordModelResult('association', 'apriori', result);

                this.render();
            } catch (err) {
                console.error(err);
                alert('Association rule mining error: ' + err.message);
                if (btn) btn.innerHTML = 'Mine Association Rules';
            }
        }, 60);
    },

    _renderAssociationResults(res) {
        const rules = res.rules;
        const maxLift = rules.length > 0 ? Math.max(...rules.map(r => r.lift)).toFixed(2) : '0';

        return `
            <div class="results-container animate-fade-in">
                <!-- Metrics Strip -->
                <div class="metrics-grid mb-4">
                    <div class="metric-card">
                        <div class="metric-title">Discovered Rules</div>
                        <div class="metric-num text-teal">${rules.length}</div>
                        <div class="metric-desc">Satisfying min criteria</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Frequent Itemsets</div>
                        <div class="metric-num text-cyan">${res.frequentItemsets.length}</div>
                        <div class="metric-desc">L1, L2, L3 sets found</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Maximum Lift</div>
                        <div class="metric-num text-blue">${maxLift}&times;</div>
                        <div class="metric-desc">Peak association strength</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Mining Latency</div>
                        <div class="metric-num text-purple">${res.executionTimeMs} ms</div>
                        <div class="metric-desc">Apriori search time</div>
                    </div>
                </div>

                <!-- Visual Scatter: Support vs Confidence -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Association Rules Distribution (Support vs. Confidence)</h3>
                            <p class="card-subtitle">Rules positioned top-right have both high prevalence and strong predictive reliability</p>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="height: 270px; position: relative;">
                            <canvas id="assocScatterPlot"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Discovered Medical Rules Table -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Discovered Clinical Association Rules</h3>
                            <p class="card-subtitle">Sorted by Lift (ratio of observed confidence to expected baseline occurrence)</p>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="clinical-data-table">
                                <thead>
                                    <tr>
                                        <th>Antecedent (IF)</th>
                                        <th></th>
                                        <th>Consequent (THEN)</th>
                                        <th>Support</th>
                                        <th>Confidence</th>
                                        <th>Lift</th>
                                        <th>Conviction</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rules.length === 0 ? `
                                        <tr><td colspan="7" class="text-center p-4">No rules found matching current thresholds. Try lowering minimum support or confidence.</td></tr>
                                    ` : rules.slice(0, 25).map(r => `
                                        <tr>
                                            <td>
                                                <div class="rule-items-tags">
                                                    ${r.antecedent.map(a => `<span class="rule-pill pill-ant">${a}</span>`).join(' & ')}
                                                </div>
                                            </td>
                                            <td class="text-center"><strong class="text-accent">&rArr;</strong></td>
                                            <td>
                                                <div class="rule-items-tags">
                                                    ${r.consequent.map(c => `<span class="rule-pill pill-con">${c}</span>`).join(' & ')}
                                                </div>
                                            </td>
                                            <td><strong>${(r.support * 100).toFixed(1)}%</strong></td>
                                            <td><span class="badge badge-info">${(r.confidence * 100).toFixed(1)}%</span></td>
                                            <td><strong class="text-teal">${r.lift.toFixed(2)}&times;</strong></td>
                                            <td>${r.conviction.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- High-Impact Clinical Takeaway Cards -->
                <div class="card mb-4">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Top Clinical Translation Takeaways</h3>
                            <p class="card-subtitle">Automated natural language medical insights from highest-lift association patterns</p>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="clinical-insights-grid">
                            ${rules.slice(0, 4).map((r, i) => `
                                <div class="clinical-insight-card">
                                    <div class="insight-badge">Clinical Pattern #${i + 1} &bull; ${r.lift.toFixed(2)}&times; Lift</div>
                                    <p class="insight-text">${r.clinicalInsight}</p>
                                    <div class="insight-stats">
                                        Support: <strong>${(r.support * 100).toFixed(1)}%</strong> | Confidence: <strong>${(r.confidence * 100).toFixed(1)}%</strong>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    _renderScatterPlot(res) {
        const ctx = document.getElementById('assocScatterPlot');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.scatterChartInstance) {
            this.scatterChartInstance.destroy();
        }

        const dataPoints = res.rules.map(r => ({
            x: r.support * 100,
            y: r.confidence * 100,
            lift: r.lift
        }));

        this.scatterChartInstance = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Mined Association Rules',
                    data: dataPoints,
                    backgroundColor: 'rgba(14, 165, 233, 0.7)',
                    borderColor: '#0284c7',
                    borderWidth: 1,
                    pointRadius: 6,
                    pointHoverRadius: 9
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Support (%)' } },
                    y: { title: { display: true, text: 'Confidence (%)' } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const pt = item.raw;
                                return ` Support: ${pt.x.toFixed(1)}% | Conf: ${pt.y.toFixed(1)}% | Lift: ${pt.lift.toFixed(2)}x`;
                            }
                        }
                    }
                }
            }
        });
    }
};

if (typeof window !== 'undefined') window.AssociationView = AssociationView;
