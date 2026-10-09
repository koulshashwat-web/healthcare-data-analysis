/**
 * Healthcare Data Analysis & Prediction System
 * K-Means Clustering & Silhouette Score
 */

class KMeans {
    constructor(options = {}) {
        this.k = options.k || 3;
        this.maxIter = options.maxIter || 100;
        this.tol = options.tol || 1e-4;
        this.centroids = [];
        this.labels = [];
        this.inertia = 0;
        this.silhouetteScore = 0;
    }

    _initCentroidsPlusPlus(X) {
        const n = X.length;
        const p = X[0].length;
        const centroids = [];

        // 1. Pick first centroid randomly
        centroids.push([...X[Math.floor(Math.random() * n)]]);

        // 2. Pick remaining centroids with probability proportional to dist^2
        while (centroids.length < this.k) {
            const distsSq = new Array(n);
            let sumDistSq = 0;

            for (let i = 0; i < n; i++) {
                let minDist = Infinity;
                for (let c = 0; c < centroids.length; c++) {
                    const d = MathUtils.euclideanDistance(X[i], centroids[c]);
                    if (d < minDist) minDist = d;
                }
                const dSq = minDist * minDist;
                distsSq[i] = dSq;
                sumDistSq += dSq;
            }

            // Sample next centroid
            const r = Math.random() * sumDistSq;
            let acc = 0;
            let nextIdx = 0;
            for (let i = 0; i < n; i++) {
                acc += distsSq[i];
                if (acc >= r) {
                    nextIdx = i;
                    break;
                }
            }
            centroids.push([...X[nextIdx]]);
        }

        return centroids;
    }

    fit(X) {
        const n = X.length;
        const p = X[0].length;
        const actualK = Math.min(this.k, n);

        this.centroids = this._initCentroidsPlusPlus(X);
        let assignments = new Array(n).fill(0);

        for (let iter = 0; iter < this.maxIter; iter++) {
            let changed = 0;

            // Step 1: Assign each point to nearest centroid
            for (let i = 0; i < n; i++) {
                let minDist = Infinity;
                let bestCluster = 0;
                for (let c = 0; c < actualK; c++) {
                    const dist = MathUtils.euclideanDistance(X[i], this.centroids[c]);
                    if (dist < minDist) {
                        minDist = dist;
                        bestCluster = c;
                    }
                }
                if (assignments[i] !== bestCluster) {
                    assignments[i] = bestCluster;
                    changed++;
                }
            }

            // Step 2: Recompute centroids
            const newCentroids = Array.from({ length: actualK }, () => new Array(p).fill(0));
            const counts = new Array(actualK).fill(0);

            for (let i = 0; i < n; i++) {
                const c = assignments[i];
                counts[c]++;
                for (let j = 0; j < p; j++) {
                    newCentroids[c][j] += X[i][j];
                }
            }

            let maxCentroidShift = 0;
            for (let c = 0; c < actualK; c++) {
                if (counts[c] > 0) {
                    for (let j = 0; j < p; j++) {
                        newCentroids[c][j] /= counts[c];
                    }
                } else {
                    // Empty cluster fallback: re-init to random point
                    newCentroids[c] = [...X[Math.floor(Math.random() * n)]];
                }
                const shift = MathUtils.euclideanDistance(this.centroids[c], newCentroids[c]);
                if (shift > maxCentroidShift) maxCentroidShift = shift;
            }

            this.centroids = newCentroids;

            if (maxCentroidShift < this.tol || changed === 0) break;
        }

        this.labels = assignments;

        // Calculate Inertia (Within-cluster sum of squares)
        this.inertia = 0;
        for (let i = 0; i < n; i++) {
            const c = assignments[i];
            const dist = MathUtils.euclideanDistance(X[i], this.centroids[c]);
            this.inertia += dist * dist;
        }

        // Calculate Silhouette Score
        this.silhouetteScore = KMeans.computeSilhouetteScore(X, assignments, actualK);

        return this;
    }

    predict(X) {
        return X.map(row => {
            let minDist = Infinity;
            let bestCluster = 0;
            for (let c = 0; c < this.centroids.length; c++) {
                const dist = MathUtils.euclideanDistance(row, this.centroids[c]);
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = c;
                }
            }
            return bestCluster;
        });
    }

    static computeSilhouetteScore(X, labels, k) {
        const n = X.length;
        if (n <= k || k <= 1) return 0;

        // Sample up to 500 points for speed if dataset is large
        const sampleIndices = n > 500 ? Array.from({ length: 500 }, () => Math.floor(Math.random() * n)) : Array.from({ length: n }, (_, i) => i);
        const sampleN = sampleIndices.length;

        let totalSil = 0;
        for (let idx = 0; idx < sampleN; idx++) {
            const i = sampleIndices[idx];
            const clusterI = labels[i];

            // Mean intra-cluster distance a(i)
            let sumA = 0;
            let countA = 0;

            // Distance to other clusters b(i)
            const sumDistByCluster = {};
            const countByCluster = {};

            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const d = MathUtils.euclideanDistance(X[i], X[j]);
                const cj = labels[j];
                if (cj === -1) continue; // skip noise

                if (cj === clusterI) {
                    sumA += d;
                    countA++;
                } else {
                    sumDistByCluster[cj] = (sumDistByCluster[cj] || 0) + d;
                    countByCluster[cj] = (countByCluster[cj] || 0) + 1;
                }
            }

            const a_i = countA > 0 ? sumA / countA : 0;

            let b_i = Infinity;
            for (const c in sumDistByCluster) {
                const avgD = sumDistByCluster[c] / countByCluster[c];
                if (avgD < b_i) b_i = avgD;
            }
            if (b_i === Infinity) b_i = 0;

            const maxAB = Math.max(a_i, b_i);
            const s_i = maxAB > 0 ? (b_i - a_i) / maxAB : 0;
            totalSil += s_i;
        }

        return totalSil / sampleN;
    }
}

if (typeof window !== 'undefined') window.KMeans = KMeans;
