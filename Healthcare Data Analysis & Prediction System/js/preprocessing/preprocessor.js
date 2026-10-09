/**
 * Healthcare Data Analysis & Prediction System
 * Comprehensive Data Preprocessor Engine
 */

class HealthcarePreprocessor {
    constructor() {
        this.rawDataset = null;
        this.currentDataset = null;
        this.pipelineSteps = [];
        this.labelEncoders = {};
        this.scalers = {};
        this.columnTypes = {};
    }

    loadDataset(data, columns) {
        // Deep copy of data
        this.rawDataset = {
            data: JSON.parse(JSON.stringify(data)),
            columns: [...columns]
        };
        this.currentDataset = {
            data: JSON.parse(JSON.stringify(data)),
            columns: [...columns]
        };
        this.pipelineSteps = [];
        this.labelEncoders = {};
        this.scalers = {};
        this._detectColumnTypes();
        return this;
    }

    _detectColumnTypes() {
        const types = {};
        const data = this.currentDataset.data;
        const cols = this.currentDataset.columns;

        cols.forEach(col => {
            let numCount = 0;
            let strCount = 0;
            let validCount = 0;

            for (let i = 0; i < Math.min(100, data.length); i++) {
                const v = data[i][col];
                if (v !== null && v !== undefined && v !== '' && v !== '?') {
                    validCount++;
                    const n = Number(v);
                    if (!isNaN(n) && typeof v !== 'boolean') numCount++;
                    else strCount++;
                }
            }

            // If majority are numbers, classify as numeric
            types[col] = (numCount >= strCount && validCount > 0) ? 'numeric' : 'categorical';
        });

        this.columnTypes = types;
        return types;
    }

    // 1. Missing Value Handling
    handleMissingValues(strategy = 'mean', columns = null, fillValue = 0) {
        const targetCols = columns || this.currentDataset.columns;
        const data = this.currentDataset.data;
        let imputedCount = 0;

        if (strategy === 'drop_rows') {
            const beforeCount = data.length;
            this.currentDataset.data = data.filter(row => {
                for (let col of targetCols) {
                    const val = row[col];
                    if (val === null || val === undefined || val === '' || val === '?' || val === 'NA' || val === 'NaN') {
                        return false;
                    }
                }
                return true;
            });
            imputedCount = beforeCount - this.currentDataset.data.length;
        } else {
            targetCols.forEach(col => {
                const isNum = this.columnTypes[col] === 'numeric';
                let replacement = fillValue;

                // Calculate replacement
                const validVals = data
                    .map(r => r[col])
                    .filter(v => v !== null && v !== undefined && v !== '' && v !== '?' && v !== 'NA' && v !== 'NaN');

                if (isNum) {
                    const numVals = validVals.map(Number).filter(v => !isNaN(v));
                    if (numVals.length > 0) {
                        if (strategy === 'mean') replacement = MathUtils.mean(numVals);
                        else if (strategy === 'median') replacement = MathUtils.median(numVals);
                        else if (strategy === 'zero') replacement = 0;
                        else if (strategy === 'mode') {
                            const counts = {};
                            numVals.forEach(v => counts[v] = (counts[v] || 0) + 1);
                            replacement = Number(Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b));
                        }
                    }
                } else {
                    // Categorical mode
                    const counts = {};
                    validVals.forEach(v => counts[v] = (counts[v] || 0) + 1);
                    if (Object.keys(counts).length > 0) {
                        replacement = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                    } else {
                        replacement = 'Unknown';
                    }
                }

                // Impute
                data.forEach(row => {
                    const v = row[col];
                    if (v === null || v === undefined || v === '' || v === '?' || v === 'NA' || v === 'NaN') {
                        row[col] = replacement;
                        imputedCount++;
                    } else if (isNum && typeof v === 'string') {
                        const parsed = parseFloat(v);
                        if (!isNaN(parsed)) row[col] = parsed;
                    }
                });
            });
        }

        this.pipelineSteps.push({
            name: 'Missing Value Handling',
            strategy,
            columns: targetCols,
            affectedRecords: imputedCount,
            timestamp: new Date().toLocaleTimeString()
        });

        this._detectColumnTypes();
        return this;
    }

    // 2. Duplicate Removal
    removeDuplicates() {
        const data = this.currentDataset.data;
        const initialCount = data.length;
        const seen = new Set();
        const uniqueData = [];

        data.forEach(row => {
            const key = JSON.stringify(row);
            if (!seen.has(key)) {
                seen.add(key);
                uniqueData.push(row);
            }
        });

        this.currentDataset.data = uniqueData;
        const removed = initialCount - uniqueData.length;

        this.pipelineSteps.push({
            name: 'Duplicate Removal',
            strategy: 'exact_match',
            affectedRecords: removed,
            timestamp: new Date().toLocaleTimeString()
        });

        return this;
    }

    // 3. Label Encoding
    labelEncode(columns) {
        const data = this.currentDataset.data;
        let totalEncoded = 0;

        columns.forEach(col => {
            const uniqueVals = Array.from(new Set(data.map(r => r[col]))).sort();
            const mapping = {};
            uniqueVals.forEach((val, idx) => mapping[val] = idx);

            this.labelEncoders[col] = mapping;

            data.forEach(row => {
                row[col] = mapping[row[col]] ?? 0;
                totalEncoded++;
            });

            this.columnTypes[col] = 'numeric';
        });

        this.pipelineSteps.push({
            name: 'Label Encoding',
            columns,
            affectedRecords: totalEncoded,
            timestamp: new Date().toLocaleTimeString()
        });

        return this;
    }

    // 4. One-Hot Encoding
    oneHotEncode(columns) {
        const data = this.currentDataset.data;
        let newCols = [...this.currentDataset.columns];

        columns.forEach(col => {
            const uniqueVals = Array.from(new Set(data.map(r => r[col]))).sort();
            // Drop original column from list
            newCols = newCols.filter(c => c !== col);

            // Add dummy column names
            const dummyColNames = uniqueVals.map(val => `${col}_${String(val).replace(/[^a-zA-Z0-9]/g, '_')}`);
            newCols.push(...dummyColNames);

            // Populate dummy values
            data.forEach(row => {
                const currentVal = row[col];
                uniqueVals.forEach((val, idx) => {
                    row[dummyColNames[idx]] = (currentVal === val) ? 1 : 0;
                });
                delete row[col];
            });

            dummyColNames.forEach(dc => this.columnTypes[dc] = 'numeric');
            delete this.columnTypes[col];
        });

        this.currentDataset.columns = newCols;

        this.pipelineSteps.push({
            name: 'One-Hot Encoding',
            columns,
            affectedRecords: data.length,
            timestamp: new Date().toLocaleTimeString()
        });

        return this;
    }

    // 5. Min-Max Normalization: x' = (x - min) / (max - min)
    minMaxNormalize(columns) {
        const data = this.currentDataset.data;
        const targetCols = columns || this.currentDataset.columns.filter(c => this.columnTypes[c] === 'numeric');

        targetCols.forEach(col => {
            const vals = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
            const mn = MathUtils.min(vals);
            const mx = MathUtils.max(vals);
            const range = mx - mn;

            this.scalers[col] = { type: 'minmax', min: mn, max: mx, range };

            data.forEach(row => {
                const val = parseFloat(row[col]);
                if (!isNaN(val)) {
                    row[col] = range === 0 ? 0 : (val - mn) / range;
                }
            });
        });

        this.pipelineSteps.push({
            name: 'Min-Max Normalization',
            columns: targetCols,
            affectedRecords: data.length,
            timestamp: new Date().toLocaleTimeString()
        });

        return this;
    }

    // 6. Standardization: z = (x - mean) / stdDev
    standardize(columns) {
        const data = this.currentDataset.data;
        const targetCols = columns || this.currentDataset.columns.filter(c => this.columnTypes[c] === 'numeric');

        targetCols.forEach(col => {
            const vals = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
            const mean = MathUtils.mean(vals);
            const std = MathUtils.stdDev(vals);

            this.scalers[col] = { type: 'standard', mean, std };

            data.forEach(row => {
                const val = parseFloat(row[col]);
                if (!isNaN(val)) {
                    row[col] = std === 0 ? 0 : (val - mean) / std;
                }
            });
        });

        this.pipelineSteps.push({
            name: 'Standardization (Z-Score)',
            columns: targetCols,
            affectedRecords: data.length,
            timestamp: new Date().toLocaleTimeString()
        });

        return this;
    }

    // 7. Outlier Detection & Handling (IQR or Z-Score threshold)
    handleOutliers(method = 'iqr', action = 'clip', columns = null) {
        const data = this.currentDataset.data;
        const targetCols = columns || this.currentDataset.columns.filter(c => this.columnTypes[c] === 'numeric');
        let affected = 0;

        if (action === 'remove') {
            const beforeCount = data.length;
            this.currentDataset.data = data.filter(row => {
                for (let col of targetCols) {
                    const val = parseFloat(row[col]);
                    if (isNaN(val)) continue;

                    const allVals = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
                    if (method === 'iqr') {
                        const q1 = MathUtils.percentile(allVals, 25);
                        const q3 = MathUtils.percentile(allVals, 75);
                        const iqr = q3 - q1;
                        const low = q1 - 1.5 * iqr;
                        const high = q3 + 1.5 * iqr;
                        if (val < low || val > high) return false;
                    } else {
                        // Z-score (|z| > 3)
                        const mean = MathUtils.mean(allVals);
                        const std = MathUtils.stdDev(allVals);
                        if (std > 0 && Math.abs((val - mean) / std) > 3) return false;
                    }
                }
                return true;
            });
            affected = beforeCount - this.currentDataset.data.length;
        } else {
            // Clip / Winsorize
            targetCols.forEach(col => {
                const allVals = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
                let low, high;

                if (method === 'iqr') {
                    const q1 = MathUtils.percentile(allVals, 25);
                    const q3 = MathUtils.percentile(allVals, 75);
                    const iqr = q3 - q1;
                    low = q1 - 1.5 * iqr;
                    high = q3 + 1.5 * iqr;
                } else {
                    const mean = MathUtils.mean(allVals);
                    const std = MathUtils.stdDev(allVals);
                    low = mean - 3 * std;
                    high = mean + 3 * std;
                }

                data.forEach(row => {
                    const val = parseFloat(row[col]);
                    if (!isNaN(val)) {
                        if (val < low) {
                            row[col] = low;
                            affected++;
                        } else if (val > high) {
                            row[col] = high;
                            affected++;
                        }
                    }
                });
            });
        }

        this.pipelineSteps.push({
            name: 'Outlier Handling',
            strategy: `${method.toUpperCase()} (${action})`,
            columns: targetCols,
            affectedRecords: affected,
            timestamp: new Date().toLocaleTimeString()
        });

        return this;
    }

    // 8. Feature Selection
    selectFeatures(selectedColumns) {
        if (!selectedColumns || selectedColumns.length === 0) return this;

        const data = this.currentDataset.data;
        const currentCols = this.currentDataset.columns;
        const removed = currentCols.filter(c => !selectedColumns.includes(c));

        data.forEach(row => {
            removed.forEach(col => delete row[col]);
        });

        this.currentDataset.columns = [...selectedColumns];
        this._detectColumnTypes();

        this.pipelineSteps.push({
            name: 'Feature Selection',
            selectedCount: selectedColumns.length,
            removedColumns: removed,
            timestamp: new Date().toLocaleTimeString()
        });

        return this;
    }

    // Variance Threshold filter helper
    filterLowVariance(threshold = 0.01) {
        const data = this.currentDataset.data;
        const kept = [];

        this.currentDataset.columns.forEach(col => {
            if (this.columnTypes[col] === 'numeric') {
                const vals = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
                const v = MathUtils.variance(vals);
                if (v >= threshold) kept.push(col);
            } else {
                kept.push(col);
            }
        });

        return this.selectFeatures(kept);
    }

    // Reset to raw initial state
    reset() {
        if (this.rawDataset) {
            this.currentDataset = {
                data: JSON.parse(JSON.stringify(this.rawDataset.data)),
                columns: [...this.rawDataset.columns]
            };
            this.pipelineSteps = [];
            this.labelEncoders = {};
            this.scalers = {};
            this._detectColumnTypes();
        }
        return this;
    }

    // Dataset Profiling Comparison (Before vs After)
    getComparisonMetrics() {
        if (!this.rawDataset || !this.currentDataset) return null;

        const rawData = this.rawDataset.data;
        const rawCols = this.rawDataset.columns;
        const procData = this.currentDataset.data;
        const procCols = this.currentDataset.columns;

        // Raw missing count
        let rawMissing = 0;
        rawData.forEach(row => {
            rawCols.forEach(col => {
                const v = row[col];
                if (v === null || v === undefined || v === '' || v === '?' || v === 'NA' || v === 'NaN') {
                    rawMissing++;
                }
            });
        });

        // Processed missing count
        let procMissing = 0;
        procData.forEach(row => {
            procCols.forEach(col => {
                const v = row[col];
                if (v === null || v === undefined || v === '' || v === '?' || v === 'NA' || v === 'NaN') {
                    procMissing++;
                }
            });
        });

        return {
            raw: {
                rowCount: rawData.length,
                colCount: rawCols.length,
                missingCount: rawMissing,
                columns: rawCols
            },
            processed: {
                rowCount: procData.length,
                colCount: procCols.length,
                missingCount: procMissing,
                columns: procCols
            },
            pipelineLength: this.pipelineSteps.length,
            steps: this.pipelineSteps
        };
    }
}

if (typeof window !== 'undefined') window.HealthcarePreprocessor = HealthcarePreprocessor;
