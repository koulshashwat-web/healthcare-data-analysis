/**
 * Healthcare Data Analysis & Prediction System
 * Random Forest (Classification & Regression Ensemble)
 */

class RandomForest {
    constructor(options = {}) {
        this.nEstimators = options.nEstimators || 15;
        this.maxDepth = options.maxDepth || 6;
        this.minSamplesSplit = options.minSamplesSplit || 4;
        this.isRegression = options.isRegression || false;
        this.trees = [];
        this.featureImportances = {};
        this.featureNames = [];
        this.classes = [];
    }

    fit(X, y, featureNames = []) {
        const nSamples = X.length;
        const nFeatures = X[0]?.length || 0;
        this.featureNames = featureNames.length === nFeatures ? featureNames : Array.from({ length: nFeatures }, (_, i) => `Feature ${i}`);
        this.classes = this.isRegression ? [] : Array.from(new Set(y)).sort();
        this.trees = [];

        // Number of features to consider per split: sqrt(p) for classification, p/3 for regression
        const maxFeatures = Math.max(1, Math.floor(this.isRegression ? nFeatures / 3 : Math.sqrt(nFeatures)));
        const combinedImportances = {};
        this.featureNames.forEach(fn => combinedImportances[fn] = 0);

        for (let t = 0; t < this.nEstimators; t++) {
            // Bootstrap sampling with replacement
            const bootX = [];
            const bootY = [];
            for (let i = 0; i < nSamples; i++) {
                const idx = Math.floor(Math.random() * nSamples);
                bootX.push(X[idx]);
                bootY.push(y[idx]);
            }

            const tree = new DecisionTree({
                maxDepth: this.maxDepth,
                minSamplesSplit: this.minSamplesSplit,
                isRegression: this.isRegression
            });

            tree.fit(bootX, bootY, this.featureNames);
            this.trees.push(tree);

            for (const fn in tree.featureImportances) {
                combinedImportances[fn] = (combinedImportances[fn] || 0) + tree.featureImportances[fn];
            }
        }

        // Normalize aggregated feature importances
        const sumImp = Object.values(combinedImportances).reduce((s, v) => s + v, 0);
        this.featureImportances = {};
        for (const fn in combinedImportances) {
            this.featureImportances[fn] = sumImp > 0 ? combinedImportances[fn] / sumImp : 1 / nFeatures;
        }

        return this;
    }

    predict(X) {
        if (this.trees.length === 0) return [];

        if (this.isRegression) {
            // Average regression predictions
            return X.map(row => {
                const preds = this.trees.map(tree => tree.predictOne(row));
                return MathUtils.mean(preds);
            });
        } else {
            // Majority vote
            return X.map(row => {
                const votes = {};
                this.classes.forEach(c => votes[c] = 0);
                this.trees.forEach(tree => {
                    const pred = tree.predictOne(row);
                    votes[pred] = (votes[pred] || 0) + 1;
                });
                return Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
            });
        }
    }

    predictProba(X) {
        if (this.isRegression) return null;
        return X.map(row => {
            const avgProba = {};
            this.classes.forEach(c => avgProba[c] = 0);
            this.trees.forEach(tree => {
                const prob = tree.predictProbaOne(row);
                if (prob) {
                    for (const c in prob) {
                        avgProba[c] = (avgProba[c] || 0) + prob[c];
                    }
                }
            });
            for (const c in avgProba) {
                avgProba[c] /= this.trees.length;
            }
            return avgProba;
        });
    }
}

if (typeof window !== 'undefined') window.RandomForest = RandomForest;
