/**
 * Healthcare Data Analysis & Prediction System
 * Dataset Manager & CSV Parsing Service
 */

const DatasetManager = {
    // Initialize default benchmark dataset
    initDefault() {
        if (typeof PRELOADED_DATASETS !== 'undefined' && PRELOADED_DATASETS['heart_disease']) {
            this.loadPreloaded('heart_disease');
        }
    },

    // Load one of the preloaded public benchmark datasets
    loadPreloaded(datasetKey) {
        if (typeof PRELOADED_DATASETS === 'undefined' || !PRELOADED_DATASETS[datasetKey]) {
            console.error('Dataset not found:', datasetKey);
            return false;
        }

        const meta = PRELOADED_DATASETS[datasetKey];
        const parsed = this.parseCSVString(meta.csvContent);

        if (parsed && parsed.data.length > 0) {
            window.appState.setDataset(
                meta.id,
                meta.name,
                meta.description,
                parsed.columns,
                parsed.data,
                meta.target,
                meta.defaultTask
            );
            return true;
        }
        return false;
    },

    // Parse CSV text string (via PapaParse if available or robust regex parser)
    parseCSVString(csvText) {
        if (!csvText || typeof csvText !== 'string') return null;

        if (typeof Papa !== 'undefined') {
            const result = Papa.parse(csvText.trim(), {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });
            const columns = result.meta.fields || (result.data[0] ? Object.keys(result.data[0]) : []);
            return {
                columns,
                data: result.data
            };
        } else {
            // Fallback manual CSV parser
            const lines = csvText.trim().split(/\r?\n/);
            if (lines.length < 2) return null;
            const columns = lines[0].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
                const row = {};
                columns.forEach((col, idx) => {
                    const rawVal = parts[idx];
                    const num = Number(rawVal);
                    row[col] = (!isNaN(num) && rawVal !== '') ? num : rawVal;
                });
                data.push(row);
            }

            return { columns, data };
        }
    },

    // Handle user CSV File upload
    handleFileUpload(file, onComplete, onError) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const parsed = this.parseCSVString(text);

                if (!parsed || parsed.data.length === 0) {
                    throw new Error('Unable to parse CSV or file contains no data rows.');
                }

                // Detect default task based on potential target columns
                const cols = parsed.columns;
                const lastCol = cols[cols.length - 1];
                let task = 'classification';

                // If last column has more than 15 unique numbers, guess regression
                const uniqueVals = new Set(parsed.data.map(r => r[lastCol]));
                if (uniqueVals.size > 15 && typeof parsed.data[0][lastCol] === 'number') {
                    task = 'regression';
                }

                window.appState.setDataset(
                    'custom_upload_' + Date.now(),
                    file.name.replace(/\.[^/.]+$/, ''),
                    `User uploaded clinical dataset: ${file.name} (${parsed.data.length} records, ${cols.length} attributes).`,
                    cols,
                    parsed.data,
                    lastCol,
                    task
                );

                if (onComplete) onComplete(window.appState.activeDataset);
            } catch (err) {
                if (onError) onError(err);
                else alert('Error uploading dataset: ' + err.message);
            }
        };

        reader.onerror = () => {
            if (onError) onError(new Error('File reading failed.'));
        };

        reader.readAsText(file);
    },

    // Calculate deep column statistics for any dataset
    calculateColumnStatistics(data, columns) {
        const stats = {};
        const n = data.length;

        columns.forEach(col => {
            const rawVals = data.map(r => r[col]);
            let missingCount = 0;
            const validVals = [];

            rawVals.forEach(v => {
                if (v === null || v === undefined || v === '' || v === '?' || v === 'NA' || v === 'NaN') {
                    missingCount++;
                } else {
                    validVals.push(v);
                }
            });

            const uniqueCount = new Set(validVals).size;
            const numVals = validVals.map(Number).filter(v => !isNaN(v));
            const isNumeric = numVals.length >= validVals.length * 0.7 && validVals.length > 0;

            if (isNumeric && numVals.length > 0) {
                const summary = MathUtils.summaryStats(numVals);
                stats[col] = {
                    type: 'Numeric',
                    count: n,
                    validCount: validVals.length,
                    missingCount,
                    missingPercent: ((missingCount / n) * 100).toFixed(1),
                    uniqueCount,
                    mean: summary.mean.toFixed(2),
                    median: summary.median.toFixed(2),
                    std: summary.std.toFixed(2),
                    min: summary.min.toFixed(2),
                    q1: summary.q1.toFixed(2),
                    q3: summary.q3.toFixed(2),
                    max: summary.max.toFixed(2),
                    iqr: summary.iqr.toFixed(2),
                    skewness: summary.skewness.toFixed(2)
                };
            } else {
                // Categorical distribution
                const freq = {};
                validVals.forEach(v => freq[v] = (freq[v] || 0) + 1);
                const topVal = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b, 'None');

                stats[col] = {
                    type: 'Categorical',
                    count: n,
                    validCount: validVals.length,
                    missingCount,
                    missingPercent: ((missingCount / n) * 100).toFixed(1),
                    uniqueCount,
                    topCategory: topVal,
                    topCount: freq[topVal] || 0,
                    frequencies: freq
                };
            }
        });

        return stats;
    },

    // Export dataset as CSV download
    exportToCSV(data, columns, filename = 'healthcare_dataset.csv') {
        if (!data || data.length === 0) return;

        let csvContent = columns.join(',') + '\n';
        data.forEach(row => {
            const line = columns.map(c => {
                let v = row[c];
                if (v === null || v === undefined) v = '';
                if (typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n'))) {
                    return `"${v.replace(/"/g, '""')}"`;
                }
                return v;
            }).join(',');
            csvContent += line + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

if (typeof window !== 'undefined') window.DatasetManager = DatasetManager;
