/**
 * Healthcare Data Analysis & Prediction System
 * K-Nearest Neighbors Classifier (KNN)
 */

class KNNClassifier {
    constructor(options = {}) {
        this.k = options.k || 5;
        this.weights = options.weights || 'uniform'; // 'uniform' or 'distance'
        this.X_train = [];
        this.y_train = [];
        this.classes = [];
    }

    fit(X, y) {
        this.X_train = X;
        this.y_train = y;
        this.classes = Array.from(new Set(y)).sort();
        return this;
    }

    _getNeighbors(sample) {
        const distances = [];
        for (let i = 0; i < this.X_train.length; i++) {
            const dist = MathUtils.euclideanDistance(sample, this.X_train[i]);
            distances.push({ dist, label: this.y_train[i] });
        }
        distances.sort((a, b) => a.dist - b.dist);
        return distances.slice(0, Math.min(this.k, distances.length));
    }

    predictOne(sample) {
        const neighbors = this._getNeighbors(sample);
        const votes = {};
        this.classes.forEach(c => votes[c] = 0);

        neighbors.forEach(n => {
            const weight = this.weights === 'distance' ? 1 / (n.dist + 1e-5) : 1;
            votes[n.label] = (votes[n.label] || 0) + weight;
        });

        return Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
    }

    predict(X) {
        return X.map(row => this.predictOne(row));
    }

    predictProbaOne(sample) {
        const neighbors = this._getNeighbors(sample);
        const votes = {};
        this.classes.forEach(c => votes[c] = 0);
        let totalWeight = 0;

        neighbors.forEach(n => {
            const weight = this.weights === 'distance' ? 1 / (n.dist + 1e-5) : 1;
            votes[n.label] = (votes[n.label] || 0) + weight;
            totalWeight += weight;
        });

        const probs = {};
        this.classes.forEach(c => {
            probs[c] = totalWeight > 0 ? (votes[c] || 0) / totalWeight : 1 / this.classes.length;
        });
        return probs;
    }

    predictProba(X) {
        return X.map(row => this.predictProbaOne(row));
    }
}

if (typeof window !== 'undefined') window.KNNClassifier = KNNClassifier;
