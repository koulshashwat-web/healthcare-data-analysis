/**
 * Healthcare Data Analysis & Prediction System
 * DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 */

class DBSCAN {
    constructor(options = {}) {
        this.eps = options.eps || 0.5;
        this.minPts = options.minPts || 5;
        this.labels = [];
        this.nClusters = 0;
        this.noiseCount = 0;
        this.centroids = [];
        this.silhouetteScore = 0;
    }

    fit(X) {
        const n = X.length;
        const p = X[0].length;
        const visited = new Uint8Array(n);
        const labels = new Int32Array(n).fill(-1); // -1 = unclassified / noise
        let clusterId = 0;

        // Query epsilon neighborhood
        function regionQuery(pointIdx) {
            const neighbors = [];
            const pt = X[pointIdx];
            for (let i = 0; i < n; i++) {
                if (MathUtils.euclideanDistance(pt, X[i]) <= this.eps) {
                    neighbors.push(i);
                }
            }
            return neighbors;
        }

        const queryFn = regionQuery.bind(this);

        for (let i = 0; i < n; i++) {
            if (visited[i]) continue;
            visited[i] = 1;

            const neighbors = queryFn(i);
            if (neighbors.length < this.minPts) {
                labels[i] = -1; // Noise for now
            } else {
                // Expand cluster
                labels[i] = clusterId;
                const queue = [...neighbors];

                for (let q = 0; q < queue.length; q++) {
                    const neighborIdx = queue[q];

                    if (!visited[neighborIdx]) {
                        visited[neighborIdx] = 1;
                        const subNeighbors = queryFn(neighborIdx);
                        if (subNeighbors.length >= this.minPts) {
                            queue.push(...subNeighbors);
                        }
                    }

                    if (labels[neighborIdx] === -1) {
                        labels[neighborIdx] = clusterId;
                    }
                }

                clusterId++;
            }
        }

        this.labels = Array.from(labels);
        this.nClusters = clusterId;
        this.noiseCount = this.labels.filter(l => l === -1).length;

        // Compute centroids for found clusters
        this.centroids = [];
        for (let c = 0; c < this.nClusters; c++) {
            const clusterPts = X.filter((_, idx) => this.labels[idx] === c);
            if (clusterPts.length > 0) {
                const centroid = new Array(p).fill(0);
                clusterPts.forEach(pt => {
                    for (let j = 0; j < p; j++) centroid[j] += pt[j];
                });
                for (let j = 0; j < p; j++) centroid[j] /= clusterPts.length;
                this.centroids.push(centroid);
            }
        }

        // Silhouette score if at least 2 clusters formed
        if (this.nClusters >= 2) {
            this.silhouetteScore = KMeans.computeSilhouetteScore(X, this.labels, this.nClusters);
        } else {
            this.silhouetteScore = 0;
        }

        return this;
    }
}

if (typeof window !== 'undefined') window.DBSCAN = DBSCAN;
