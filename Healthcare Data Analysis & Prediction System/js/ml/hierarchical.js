/**
 * Healthcare Data Analysis & Prediction System
 * Agglomerative Hierarchical Clustering
 */

class AgglomerativeClustering {
    constructor(options = {}) {
        this.nClusters = options.nClusters || 3;
        this.linkage = options.linkage || 'average'; // 'average', 'complete', 'single'
        this.labels = [];
        this.centroids = [];
        this.silhouetteScore = 0;
    }

    fit(X) {
        const n = X.length;
        const p = X[0].length;
        const targetK = Math.min(this.nClusters, n);

        // If dataset is large, sample up to 350 for interactive browser performance
        const useSubsample = n > 350;
        const sampleIndices = useSubsample ? Array.from({ length: 350 }, () => Math.floor(Math.random() * n)) : Array.from({ length: n }, (_, i) => i);
        const activeX = sampleIndices.map(i => X[i]);
        const m = activeX.length;

        // Initialize each point in its own cluster
        let clusters = activeX.map((_, i) => [i]);

        // Build pairwise distance cache
        const distMatrix = Array.from({ length: m }, () => new Float32Array(m));
        for (let i = 0; i < m; i++) {
            for (let j = i + 1; j < m; j++) {
                const d = MathUtils.euclideanDistance(activeX[i], activeX[j]);
                distMatrix[i][j] = d;
                distMatrix[j][i] = d;
            }
        }

        function clusterDistance(c1, c2, linkage) {
            let total = 0;
            let minD = Infinity;
            let maxD = -Infinity;
            const count = c1.length * c2.length;

            for (let i = 0; i < c1.length; i++) {
                const idx1 = c1[i];
                for (let j = 0; j < c2.length; j++) {
                    const d = distMatrix[idx1][c2[j]];
                    total += d;
                    if (d < minD) minD = d;
                    if (d > maxD) maxD = d;
                }
            }

            if (linkage === 'single') return minD;
            if (linkage === 'complete') return maxD;
            return total / count; // average
        }

        // Merge closest clusters until targetK is reached
        while (clusters.length > targetK) {
            let bestDist = Infinity;
            let mergeI = 0;
            let mergeJ = 1;

            for (let i = 0; i < clusters.length; i++) {
                for (let j = i + 1; j < clusters.length; j++) {
                    const d = clusterDistance(clusters[i], clusters[j], this.linkage);
                    if (d < bestDist) {
                        bestDist = d;
                        mergeI = i;
                        mergeJ = j;
                    }
                }
            }

            // Merge mergeJ into mergeI and remove mergeJ
            clusters[mergeI] = clusters[mergeI].concat(clusters[mergeJ]);
            clusters.splice(mergeJ, 1);
        }

        // Compute centroids for the clusters
        this.centroids = clusters.map(c => {
            const centroid = new Array(p).fill(0);
            c.forEach(idx => {
                for (let j = 0; j < p; j++) {
                    centroid[j] += activeX[idx][j];
                }
            });
            for (let j = 0; j < p; j++) centroid[j] /= c.length;
            return centroid;
        });

        // Assign labels to all points in full dataset X based on nearest centroid
        this.labels = X.map(row => {
            let minDist = Infinity;
            let bestCluster = 0;
            for (let c = 0; c < this.centroids.length; c++) {
                const d = MathUtils.euclideanDistance(row, this.centroids[c]);
                if (d < minDist) {
                    minDist = d;
                    bestCluster = c;
                }
            }
            return bestCluster;
        });

        // Compute silhouette score
        this.silhouetteScore = KMeans.computeSilhouetteScore(X, this.labels, targetK);

        return this;
    }
}

if (typeof window !== 'undefined') window.AgglomerativeClustering = AgglomerativeClustering;
