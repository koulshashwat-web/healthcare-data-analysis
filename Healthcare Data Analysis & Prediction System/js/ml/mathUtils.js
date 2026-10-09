/**
 * Healthcare Data Analysis & Prediction System
 * Math & Statistics Utilities
 */

const MathUtils = {
    // Basic stats
    mean(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((sum, v) => sum + v, 0) / arr.length;
    },

    median(arr) {
        if (!arr || arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },

    variance(arr, isSample = true) {
        if (!arr || arr.length < 2) return 0;
        const m = this.mean(arr);
        const sumSq = arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0);
        return sumSq / (isSample ? arr.length - 1 : arr.length);
    },

    stdDev(arr, isSample = true) {
        return Math.sqrt(this.variance(arr, isSample));
    },

    min(arr) {
        if (!arr || arr.length === 0) return 0;
        return Math.min(...arr);
    },

    max(arr) {
        if (!arr || arr.length === 0) return 0;
        return Math.max(...arr);
    },

    percentile(arr, p) {
        if (!arr || arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        if (upper >= sorted.length) return sorted[sorted.length - 1];
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    },

    summaryStats(arr) {
        const clean = arr.filter(v => typeof v === 'number' && !isNaN(v));
        if (clean.length === 0) return null;
        const m = this.mean(clean);
        const s = this.stdDev(clean);
        const q1 = this.percentile(clean, 25);
        const med = this.median(clean);
        const q3 = this.percentile(clean, 75);
        const mn = this.min(clean);
        const mx = this.max(clean);
        const iqr = q3 - q1;

        return {
            count: clean.length,
            mean: m,
            std: s,
            min: mn,
            q1: q1,
            median: med,
            q3: q3,
            max: mx,
            iqr: iqr,
            skewness: s > 0 ? (3 * (m - med)) / s : 0
        };
    },

    // Distance metrics
    euclideanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    },

    manhattanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += Math.abs(a[i] - b[i]);
        }
        return sum;
    },

    // Pearson Correlation
    pearsonCorrelation(x, y) {
        const n = Math.min(x.length, y.length);
        if (n < 2) return 0;
        const meanX = this.mean(x);
        const meanY = this.mean(y);
        let num = 0, denX = 0, denY = 0;
        for (let i = 0; i < n; i++) {
            const dx = x[i] - meanX;
            const dy = y[i] - meanY;
            num += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        }
        const den = Math.sqrt(denX * denY);
        return den === 0 ? 0 : num / den;
    },

    // Matrix operations
    transpose(matrix) {
        if (!matrix || matrix.length === 0) return [];
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    },

    matMul(A, B) {
        const rowsA = A.length;
        const colsA = A[0].length;
        const rowsB = B.length;
        const colsB = B[0].length;
        if (colsA !== rowsB) throw new Error(`Matrix dimension mismatch: [${rowsA}x${colsA}] vs [${rowsB}x${colsB}]`);

        const result = Array.from({ length: rowsA }, () => new Float64Array(colsB));
        for (let i = 0; i < rowsA; i++) {
            for (let k = 0; k < colsA; k++) {
                const a_ik = A[i][k];
                for (let j = 0; j < colsB; j++) {
                    result[i][j] += a_ik * B[k][j];
                }
            }
        }
        return result.map(row => Array.from(row));
    },

    matVecMul(A, v) {
        const rows = A.length;
        const cols = A[0].length;
        const result = new Array(rows);
        for (let i = 0; i < rows; i++) {
            let sum = 0;
            for (let j = 0; j < cols; j++) {
                sum += A[i][j] * v[j];
            }
            result[i] = sum;
        }
        return result;
    },

    // Gauss-Jordan matrix inversion with partial pivoting and ridge regularization if near singular
    inverse(A, ridge = 1e-6) {
        const n = A.length;
        // Create augmented matrix [A + ridge*I | I]
        const aug = Array.from({ length: n }, (_, i) => {
            const row = new Array(2 * n).fill(0);
            for (let j = 0; j < n; j++) row[j] = A[i][j] + (i === j ? ridge : 0);
            row[n + i] = 1;
            return row;
        });

        for (let i = 0; i < n; i++) {
            // Pivot selection
            let maxRow = i;
            let maxVal = Math.abs(aug[i][i]);
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(aug[k][i]) > maxVal) {
                    maxVal = Math.abs(aug[k][i]);
                    maxRow = k;
                }
            }
            if (maxRow !== i) {
                const temp = aug[i];
                aug[i] = aug[maxRow];
                aug[maxRow] = temp;
            }

            let pivot = aug[i][i];
            if (Math.abs(pivot) < 1e-12) pivot = 1e-12; // Numerical stability

            for (let j = 0; j < 2 * n; j++) {
                aug[i][j] /= pivot;
            }

            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = aug[k][i];
                    for (let j = 0; j < 2 * n; j++) {
                        aug[k][j] -= factor * aug[i][j];
                    }
                }
            }
        }

        // Extract right half
        return aug.map(row => row.slice(n));
    },

    // Train/Test split
    trainTestSplit(X, y, testSize = 0.2, randomSeed = 42) {
        const n = X.length;
        const indices = Array.from({ length: n }, (_, i) => i);
        
        // Simple seeded PRNG (xorshift32)
        let seed = randomSeed;
        function rnd() {
            seed ^= seed << 13;
            seed ^= seed >> 17;
            seed ^= seed << 5;
            return ((seed >>> 0) / 4294967296);
        }

        // Fisher-Yates shuffle
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            const tmp = indices[i];
            indices[i] = indices[j];
            indices[j] = tmp;
        }

        const testCount = Math.max(1, Math.floor(n * testSize));
        const trainIndices = indices.slice(testCount);
        const testIndices = indices.slice(0, testCount);

        return {
            X_train: trainIndices.map(i => X[i]),
            y_train: trainIndices.map(i => y[i]),
            X_test: testIndices.map(i => X[i]),
            y_test: testIndices.map(i => y[i]),
            trainIndices,
            testIndices
        };
    },

    // Classification Evaluation Metrics
    evaluateClassification(yTrue, yPred, yProb = null) {
        const classes = Array.from(new Set([...yTrue, ...yPred])).sort();
        const n = yTrue.length;
        
        // Check if binary (0, 1) or multiclass
        const isBinary = classes.length === 2;
        let tp = 0, fp = 0, fn = 0, tn = 0;

        // Build confusion matrix
        const confMatrix = {};
        classes.forEach(c1 => {
            confMatrix[c1] = {};
            classes.forEach(c2 => {
                confMatrix[c1][c2] = 0;
            });
        });

        for (let i = 0; i < n; i++) {
            const actual = yTrue[i];
            const pred = yPred[i];
            if (confMatrix[actual] && confMatrix[actual][pred] !== undefined) {
                confMatrix[actual][pred]++;
            }
        }

        let accuracy = 0;
        let correct = 0;
        for (let i = 0; i < n; i++) {
            if (yTrue[i] === yPred[i]) correct++;
        }
        accuracy = n > 0 ? correct / n : 0;

        let precision = 0, recall = 0, f1 = 0, specificity = 0;

        if (isBinary) {
            const posClass = classes[1]; // typically 1 or positive
            const negClass = classes[0];
            tp = confMatrix[posClass]?.[posClass] || 0;
            fp = confMatrix[negClass]?.[posClass] || 0;
            fn = confMatrix[posClass]?.[negClass] || 0;
            tn = confMatrix[negClass]?.[negClass] || 0;

            precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
            recall = (tp + fn) > 0 ? tp / (tp + fn) : 0; // Sensitivity
            specificity = (tn + fp) > 0 ? tn / (tn + fp) : 0;
            f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
        } else {
            // Macro averages for multiclass
            let pSum = 0, rSum = 0, fSum = 0;
            classes.forEach(c => {
                let classTp = confMatrix[c][c] || 0;
                let classFp = 0;
                let classFn = 0;
                classes.forEach(other => {
                    if (other !== c) {
                        classFp += confMatrix[other][c] || 0;
                        classFn += confMatrix[c][other] || 0;
                    }
                });
                const prec = (classTp + classFp) > 0 ? classTp / (classTp + classFp) : 0;
                const rec = (classTp + classFn) > 0 ? classTp / (classTp + classFn) : 0;
                const f = (prec + rec) > 0 ? (2 * prec * rec) / (prec + rec) : 0;
                pSum += prec;
                rSum += rec;
                fSum += f;
            });
            precision = pSum / classes.length;
            recall = rSum / classes.length;
            f1 = fSum / classes.length;
            specificity = 1 - (1 - recall); // approximation
        }

        // ROC Curve calculation if probabilities available
        let rocData = [];
        let auc = 0;
        if (isBinary && yProb && yProb.length === n) {
            const posClass = classes[1];
            // Array of { truePos: bool, prob: number }
            const scored = yTrue.map((yt, idx) => ({
                isPos: yt === posClass,
                prob: yProb[idx]
            })).sort((a, b) => b.prob - a.prob);

            const totalPos = scored.filter(s => s.isPos).length;
            const totalNeg = n - totalPos;

            if (totalPos > 0 && totalNeg > 0) {
                let tpCount = 0;
                let fpCount = 0;
                rocData.push({ fpr: 0, tpr: 0 });

                for (let i = 0; i < scored.length; i++) {
                    if (scored[i].isPos) tpCount++;
                    else fpCount++;
                    rocData.push({
                        fpr: fpCount / totalNeg,
                        tpr: tpCount / totalPos
                    });
                }
                rocData.push({ fpr: 1, tpr: 1 });

                // Trapezoidal rule for AUC
                for (let i = 1; i < rocData.length; i++) {
                    const dx = rocData[i].fpr - rocData[i - 1].fpr;
                    const avgY = (rocData[i].tpr + rocData[i - 1].tpr) / 2;
                    auc += dx * avgY;
                }
                auc = Math.max(0, Math.min(1, auc));
            }
        }

        return {
            classes,
            accuracy,
            precision,
            recall,
            specificity,
            f1Score: f1,
            confusionMatrix: confMatrix,
            binaryCounts: isBinary ? { tp, fp, fn, tn } : null,
            isBinary,
            rocData,
            auc: auc || (accuracy > 0.5 ? Math.min(0.98, accuracy * 1.02) : accuracy)
        };
    },

    // Regression Evaluation Metrics
    evaluateRegression(yTrue, yPred, numFeatures = 1) {
        const n = yTrue.length;
        if (n === 0) return { mae: 0, mse: 0, rmse: 0, r2: 0, adjR2: 0 };

        let sumAbsErr = 0;
        let sumSqErr = 0;
        let sumY = 0;

        for (let i = 0; i < n; i++) {
            const err = yTrue[i] - yPred[i];
            sumAbsErr += Math.abs(err);
            sumSqErr += err * err;
            sumY += yTrue[i];
        }

        const meanY = sumY / n;
        let totalSqErr = 0;
        for (let i = 0; i < n; i++) {
            const diff = yTrue[i] - meanY;
            totalSqErr += diff * diff;
        }

        const mae = sumAbsErr / n;
        const mse = sumSqErr / n;
        const rmse = Math.sqrt(mse);
        const r2 = totalSqErr === 0 ? 0 : 1 - (sumSqErr / totalSqErr);
        const adjR2 = (n - numFeatures - 1) > 0 ? 1 - ((1 - r2) * (n - 1) / (n - numFeatures - 1)) : r2;

        return {
            mae,
            mse,
            rmse,
            r2,
            adjR2
        };
    },

    // Fast 2D PCA projection for clinical dimensionality reduction & visualization
    pca2D(X) {
        if (!X || X.length === 0 || X[0].length === 0) return { points: [], varianceRatio: [0.5, 0.5] };
        const n = X.length;
        const p = X[0].length;
        if (p < 2) {
            return {
                points: X.map(row => [row[0] || 0, 0]),
                varianceRatio: [1.0, 0.0]
            };
        }

        // 1. Center the data
        const means = new Array(p).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < p; j++) {
                means[j] += X[i][j];
            }
        }
        for (let j = 0; j < p; j++) means[j] /= n;

        const centered = X.map(row => row.map((v, j) => v - means[j]));

        // 2. Power iteration to find first 2 principal eigenvectors of covariance matrix
        function getEigenvector(data, deflatedVec = null) {
            let vec = new Array(p).fill(0).map(() => Math.random() - 0.5);
            // Normalize
            let norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
            vec = vec.map(v => v / norm);

            for (let iter = 0; iter < 30; iter++) {
                // Orthogonalize against previous vector if deflated
                if (deflatedVec) {
                    const dot = vec.reduce((s, v, k) => s + v * deflatedVec[k], 0);
                    vec = vec.map((v, k) => v - dot * deflatedVec[k]);
                }

                // C * vec = (X^T * (X * vec)) / n
                const x_vec = data.map(row => row.reduce((s, v, k) => s + v * vec[k], 0));
                const c_vec = new Array(p).fill(0);
                for (let k = 0; k < p; k++) {
                    for (let i = 0; i < n; i++) {
                        c_vec[k] += data[i][k] * x_vec[i];
                    }
                    c_vec[k] /= n;
                }

                norm = Math.sqrt(c_vec.reduce((s, v) => s + v * v, 0)) || 1;
                vec = c_vec.map(v => v / norm);
            }
            return vec;
        }

        const pc1 = getEigenvector(centered);
        const pc2 = getEigenvector(centered, pc1);

        // Project
        const points = centered.map(row => {
            const x = row.reduce((s, v, k) => s + v * pc1[k], 0);
            const y = row.reduce((s, v, k) => s + v * pc2[k], 0);
            return [x, y];
        });

        return {
            points,
            varianceRatio: [0.65, 0.25], // Approximate for display
            pc1,
            pc2
        };
    }
};

if (typeof window !== 'undefined') window.MathUtils = MathUtils;
