/**
 * Healthcare Data Analysis & Prediction System
 * Logistic Regression Classifier
 */

class LogisticRegression {
    constructor(options = {}) {
        this.learningRate = options.learningRate || 0.05;
        this.maxIter = options.maxIter || 200;
        this.l2 = options.l2 || 1e-4;
        this.weights = [];
        this.bias = 0;
        this.classes = [];
        this.models = {}; // for multiclass OvR
        this.isBinary = true;
    }

    _sigmoid(z) {
        if (z < -40) return 0;
        if (z > 40) return 1;
        return 1 / (1 + Math.exp(-z));
    }

    fit(X, y) {
        this.classes = Array.from(new Set(y)).sort();
        const nSamples = X.length;
        const nFeatures = X[0]?.length || 0;

        if (this.classes.length === 2) {
            this.isBinary = true;
            const posClass = this.classes[1];
            const yBin = y.map(v => v === posClass ? 1 : 0);
            const { weights, bias } = this._trainBinary(X, yBin, nSamples, nFeatures);
            this.weights = weights;
            this.bias = bias;
        } else {
            // One vs Rest (OvR)
            this.isBinary = false;
            this.models = {};
            this.classes.forEach(c => {
                const yBin = y.map(v => v === c ? 1 : 0);
                this.models[c] = this._trainBinary(X, yBin, nSamples, nFeatures);
            });
        }
        return this;
    }

    _trainBinary(X, yBin, nSamples, nFeatures) {
        let weights = new Array(nFeatures).fill(0);
        let bias = 0;

        for (let iter = 0; iter < this.maxIter; iter++) {
            const gradW = new Array(nFeatures).fill(0);
            let gradB = 0;

            for (let i = 0; i < nSamples; i++) {
                let z = bias;
                for (let f = 0; f < nFeatures; f++) {
                    z += weights[f] * X[i][f];
                }
                const p = this._sigmoid(z);
                const error = p - yBin[i];

                for (let f = 0; f < nFeatures; f++) {
                    gradW[f] += error * X[i][f];
                }
                gradB += error;
            }

            // Gradient descent step with L2 regularization
            for (let f = 0; f < nFeatures; f++) {
                weights[f] -= this.learningRate * ((gradW[f] / nSamples) + this.l2 * weights[f]);
            }
            bias -= this.learningRate * (gradB / nSamples);
        }

        return { weights, bias };
    }

    predictProbaOne(sample) {
        if (this.isBinary) {
            let z = this.bias;
            for (let f = 0; f < sample.length; f++) {
                z += this.weights[f] * sample[f];
            }
            const p1 = this._sigmoid(z);
            const p0 = 1 - p1;
            const res = {};
            res[this.classes[0]] = p0;
            res[this.classes[1]] = p1;
            return res;
        } else {
            const rawProbs = {};
            let sum = 0;
            this.classes.forEach(c => {
                const m = this.models[c];
                let z = m.bias;
                for (let f = 0; f < sample.length; f++) {
                    z += m.weights[f] * sample[f];
                }
                const p = this._sigmoid(z);
                rawProbs[c] = p;
                sum += p;
            });
            const res = {};
            this.classes.forEach(c => {
                res[c] = sum > 0 ? rawProbs[c] / sum : 1 / this.classes.length;
            });
            return res;
        }
    }

    predictOne(sample) {
        const probs = this.predictProbaOne(sample);
        return Object.keys(probs).reduce((a, b) => probs[a] > probs[b] ? a : b);
    }

    predict(X) {
        return X.map(row => this.predictOne(row));
    }

    predictProba(X) {
        return X.map(row => this.predictProbaOne(row));
    }
}

if (typeof window !== 'undefined') window.LogisticRegression = LogisticRegression;
