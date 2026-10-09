/**
 * Healthcare Data Analysis & Prediction System
 * Decision Tree (CART - Classification & Regression)
 */

class DecisionTreeNode {
    constructor() {
        this.featureIndex = null;
        this.threshold = null;
        this.left = null;
        this.right = null;
        this.isLeaf = false;
        this.value = null; // predicted class or regression mean
        this.probabilities = null; // class probabilities if classifier
        this.samples = 0;
        this.impurity = 0;
    }
}

class DecisionTree {
    constructor(options = {}) {
        this.maxDepth = options.maxDepth || 6;
        this.minSamplesSplit = options.minSamplesSplit || 4;
        this.minSamplesLeaf = options.minSamplesLeaf || 2;
        this.criterion = options.criterion || 'gini'; // 'gini' or 'mse' (regression)
        this.isRegression = options.isRegression || false;
        this.root = null;
        this.featureImportances = {};
        this.featureCount = 0;
    }

    fit(X, y, featureNames = []) {
        this.featureCount = X[0]?.length || 0;
        this.featureNames = featureNames.length === this.featureCount ? featureNames : Array.from({ length: this.featureCount }, (_, i) => `Feature ${i}`);
        this.importancesRaw = new Array(this.featureCount).fill(0);
        
        this.classes = this.isRegression ? [] : Array.from(new Set(y)).sort();
        this.root = this._buildTree(X, y, 0);

        // Normalize feature importances
        const sumImp = this.importancesRaw.reduce((s, v) => s + v, 0);
        this.featureImportances = {};
        this.featureNames.forEach((name, idx) => {
            this.featureImportances[name] = sumImp > 0 ? this.importancesRaw[idx] / sumImp : 1 / this.featureCount;
        });

        return this;
    }

    _buildTree(X, y, depth) {
        const node = new DecisionTreeNode();
        node.samples = y.length;

        // Stopping criteria
        const isHomogeneous = this.isRegression ? (MathUtils.variance(y) < 1e-7) : (new Set(y).size <= 1);
        if (depth >= this.maxDepth || y.length < this.minSamplesSplit || isHomogeneous) {
            node.isLeaf = true;
            if (this.isRegression) {
                node.value = MathUtils.mean(y);
            } else {
                // Majority class & probabilities
                const counts = {};
                this.classes.forEach(c => counts[c] = 0);
                y.forEach(c => counts[c] = (counts[c] || 0) + 1);

                let maxCount = -1;
                let bestClass = this.classes[0];
                const probs = {};
                this.classes.forEach(c => {
                    probs[c] = counts[c] / y.length;
                    if (counts[c] > maxCount) {
                        maxCount = counts[c];
                        bestClass = c;
                    }
                });
                node.value = bestClass;
                node.probabilities = probs;
            }
            return node;
        }

        // Find best split
        let bestGain = -Infinity;
        let bestFeature = null;
        let bestThreshold = null;
        let bestLeftIdx = null;
        let bestRightIdx = null;

        const currentImpurity = this._calculateImpurity(y);
        node.impurity = currentImpurity;

        for (let feat = 0; feat < this.featureCount; feat++) {
            const values = X.map(r => r[feat]);
            const uniqueVals = Array.from(new Set(values)).sort((a, b) => a - b);
            if (uniqueVals.length <= 1) continue;

            // Test midpoints
            for (let i = 0; i < uniqueVals.length - 1; i++) {
                const threshold = (uniqueVals[i] + uniqueVals[i + 1]) / 2;
                const leftIdx = [];
                const rightIdx = [];

                for (let k = 0; k < X.length; k++) {
                    if (X[k][feat] <= threshold) leftIdx.push(k);
                    else rightIdx.push(k);
                }

                if (leftIdx.length < this.minSamplesLeaf || rightIdx.length < this.minSamplesLeaf) continue;

                const leftY = leftIdx.map(k => y[k]);
                const rightY = rightIdx.map(k => y[k]);

                const leftImp = this._calculateImpurity(leftY);
                const rightImp = this._calculateImpurity(rightY);
                const weightedImp = (leftIdx.length / y.length) * leftImp + (rightIdx.length / y.length) * rightImp;
                const gain = currentImpurity - weightedImp;

                if (gain > bestGain) {
                    bestGain = gain;
                    bestFeature = feat;
                    bestThreshold = threshold;
                    bestLeftIdx = leftIdx;
                    bestRightIdx = rightIdx;
                }
            }
        }

        if (bestGain <= 1e-7 || bestFeature === null) {
            node.isLeaf = true;
            if (this.isRegression) {
                node.value = MathUtils.mean(y);
            } else {
                const counts = {};
                this.classes.forEach(c => counts[c] = 0);
                y.forEach(c => counts[c] = (counts[c] || 0) + 1);
                node.value = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                node.probabilities = {};
                this.classes.forEach(c => node.probabilities[c] = counts[c] / y.length);
            }
            return node;
        }

        // Record feature importance
        this.importancesRaw[bestFeature] += bestGain * (y.length / node.samples);

        node.featureIndex = bestFeature;
        node.threshold = bestThreshold;

        const leftX = bestLeftIdx.map(k => X[k]);
        const leftY = bestLeftIdx.map(k => y[k]);
        const rightX = bestRightIdx.map(k => X[k]);
        const rightY = bestRightIdx.map(k => y[k]);

        node.left = this._buildTree(leftX, leftY, depth + 1);
        node.right = this._buildTree(rightX, rightY, depth + 1);

        return node;
    }

    _calculateImpurity(y) {
        if (y.length === 0) return 0;
        if (this.isRegression) {
            // Mean Squared Error (variance * n)
            return MathUtils.variance(y, false);
        } else {
            // Gini Impurity = 1 - sum(p_i^2)
            const counts = {};
            y.forEach(v => counts[v] = (counts[v] || 0) + 1);
            let sumSq = 0;
            const n = y.length;
            for (const c in counts) {
                const p = counts[c] / n;
                sumSq += p * p;
            }
            return 1 - sumSq;
        }
    }

    predictOne(sample) {
        let curr = this.root;
        while (curr && !curr.isLeaf) {
            if (sample[curr.featureIndex] <= curr.threshold) {
                curr = curr.left;
            } else {
                curr = curr.right;
            }
        }
        return curr ? curr.value : (this.classes[0] ?? 0);
    }

    predict(X) {
        return X.map(row => this.predictOne(row));
    }

    predictProbaOne(sample) {
        let curr = this.root;
        while (curr && !curr.isLeaf) {
            if (sample[curr.featureIndex] <= curr.threshold) {
                curr = curr.left;
            } else {
                curr = curr.right;
            }
        }
        return curr ? curr.probabilities : null;
    }

    predictProba(X) {
        if (this.isRegression) return null;
        return X.map(row => this.predictProbaOne(row));
    }
}

if (typeof window !== 'undefined') window.DecisionTree = DecisionTree;
