/**
 * Healthcare Data Analysis & Prediction System
 * Support Vector Machine (Linear / RBF Soft-Margin SVM)
 */

class SVMClassifier {
    constructor(options = {}) {
        this.C = options.C || 1.0;
        this.kernel = options.kernel || 'linear'; // 'linear' or 'rbf'
        this.gamma = options.gamma || 0.1;
        this.maxIter = options.maxIter || 150;
        this.learningRate = options.learningRate || 0.01;
        this.weights = [];
        this.bias = 0;
        this.classes = [];
        this.supportVectors = [];
        this.alphas = [];
    }

    _rbfKernel(x1, x2) {
        let distSq = 0;
        for (let i = 0; i < x1.length; i++) {
            const d = x1[i] - x2[i];
            distSq += d * d;
        }
        return Math.exp(-this.gamma * distSq);
    }

    fit(X, y) {
        this.classes = Array.from(new Set(y)).sort();
        const nSamples = X.length;
        const nFeatures = X[0]?.length || 0;

        // Map to -1 and +1
        const posClass = this.classes[this.classes.length - 1];
        const yMapped = y.map(v => v === posClass ? 1 : -1);

        if (this.kernel === 'linear') {
            this.weights = new Array(nFeatures).fill(0);
            this.bias = 0;

            // Subgradient descent on Hinge Loss: L(w) = 0.5 * ||w||^2 + C * sum(max(0, 1 - y_i(w.x_i + b)))
            let lr = this.learningRate;
            for (let epoch = 1; epoch <= this.maxIter; epoch++) {
                const currentLr = lr / Math.sqrt(epoch);
                for (let i = 0; i < nSamples; i++) {
                    let score = this.bias;
                    for (let f = 0; f < nFeatures; f++) {
                        score += this.weights[f] * X[i][f];
                    }

                    if (yMapped[i] * score < 1) {
                        // Margin violation
                        for (let f = 0; f < nFeatures; f++) {
                            this.weights[f] = (1 - currentLr) * this.weights[f] + currentLr * this.C * yMapped[i] * X[i][f];
                        }
                        this.bias += currentLr * this.C * yMapped[i];
                    } else {
                        // Correctly classified outside margin
                        for (let f = 0; f < nFeatures; f++) {
                            this.weights[f] = (1 - currentLr) * this.weights[f];
                        }
                    }
                }
            }
        } else {
            // Kernel SVM (simplified dual representation)
            this.supportVectors = X;
            this.alphas = new Array(nSamples).fill(0);
            this.bias = 0;

            for (let epoch = 1; epoch <= this.maxIter; epoch++) {
                const currentLr = this.learningRate / Math.sqrt(epoch);
                for (let i = 0; i < nSamples; i++) {
                    let score = this.bias;
                    for (let j = 0; j < nSamples; j++) {
                        if (Math.abs(this.alphas[j]) > 1e-5) {
                            score += this.alphas[j] * yMapped[j] * this._rbfKernel(this.supportVectors[j], X[i]);
                        }
                    }

                    if (yMapped[i] * score < 1) {
                        this.alphas[i] = Math.min(this.C, this.alphas[i] + currentLr);
                        this.bias += currentLr * yMapped[i];
                    }
                }
            }
        }

        return this;
    }

    _decisionFunction(sample) {
        if (this.kernel === 'linear') {
            let score = this.bias;
            for (let f = 0; f < sample.length; f++) {
                score += this.weights[f] * sample[f];
            }
            return score;
        } else {
            let score = this.bias;
            const posClass = this.classes[this.classes.length - 1];
            for (let j = 0; j < this.supportVectors.length; j++) {
                if (Math.abs(this.alphas[j]) > 1e-5) {
                    score += this.alphas[j] * this._rbfKernel(this.supportVectors[j], sample);
                }
            }
            return score;
        }
    }

    predictOne(sample) {
        const score = this._decisionFunction(sample);
        const posClass = this.classes[this.classes.length - 1];
        const negClass = this.classes[0];
        return score >= 0 ? posClass : negClass;
    }

    predict(X) {
        return X.map(row => this.predictOne(row));
    }

    predictProbaOne(sample) {
        const score = this._decisionFunction(sample);
        // Platt scaling approximation: 1 / (1 + exp(-score))
        const p1 = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, score))));
        const p0 = 1 - p1;
        const res = {};
        res[this.classes[0]] = p0;
        res[this.classes[this.classes.length - 1]] = p1;
        return res;
    }

    predictProba(X) {
        return X.map(row => this.predictProbaOne(row));
    }
}

if (typeof window !== 'undefined') window.SVMClassifier = SVMClassifier;
