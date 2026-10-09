/**
 * Healthcare Data Analysis & Prediction System
 * Gaussian Naive Bayes Classifier
 */

class GaussianNaiveBayes {
    constructor(options = {}) {
        this.varSmoothing = options.varSmoothing || 1e-9;
        this.classes = [];
        this.priors = {};
        this.stats = {}; // class -> feature -> { mean, variance }
    }

    fit(X, y) {
        this.classes = Array.from(new Set(y)).sort();
        const nSamples = X.length;
        const nFeatures = X[0]?.length || 0;

        // Group samples by class
        const classSamples = {};
        this.classes.forEach(c => classSamples[c] = []);
        for (let i = 0; i < nSamples; i++) {
            classSamples[y[i]].push(X[i]);
        }

        // Calculate priors and gaussian stats
        this.classes.forEach(c => {
            const samples = classSamples[c];
            this.priors[c] = samples.length / nSamples;
            this.stats[c] = [];

            for (let f = 0; f < nFeatures; f++) {
                const values = samples.map(s => s[f]);
                const mean = MathUtils.mean(values);
                let variance = MathUtils.variance(values, false);
                if (variance < this.varSmoothing) variance = this.varSmoothing;
                this.stats[c].push({ mean, variance });
            }
        });

        return this;
    }

    _gaussianLogPdf(x, mean, variance) {
        const diff = x - mean;
        return -0.5 * Math.log(2 * Math.PI * variance) - (diff * diff) / (2 * variance);
    }

    predictOne(sample) {
        let bestClass = this.classes[0];
        let maxLogProb = -Infinity;

        this.classes.forEach(c => {
            let logProb = Math.log(this.priors[c] || 1e-5);
            const stats = this.stats[c];
            for (let f = 0; f < sample.length; f++) {
                logProb += this._gaussianLogPdf(sample[f], stats[f].mean, stats[f].variance);
            }

            if (logProb > maxLogProb) {
                maxLogProb = logProb;
                bestClass = c;
            }
        });

        return bestClass;
    }

    predict(X) {
        return X.map(row => this.predictOne(row));
    }

    predictProbaOne(sample) {
        const logProbs = {};
        let maxLog = -Infinity;

        this.classes.forEach(c => {
            let lp = Math.log(this.priors[c] || 1e-5);
            const stats = this.stats[c];
            for (let f = 0; f < sample.length; f++) {
                lp += this._gaussianLogPdf(sample[f], stats[f].mean, stats[f].variance);
            }
            logProbs[c] = lp;
            if (lp > maxLog) maxLog = lp;
        });

        // Softmax trick to normalize exp(lp - maxLog)
        const expProbs = {};
        let sumExp = 0;
        this.classes.forEach(c => {
            const ep = Math.exp(logProbs[c] - maxLog);
            expProbs[c] = ep;
            sumExp += ep;
        });

        const probs = {};
        this.classes.forEach(c => {
            probs[c] = sumExp > 0 ? expProbs[c] / sumExp : 1 / this.classes.length;
        });
        return probs;
    }

    predictProba(X) {
        return X.map(row => this.predictProbaOne(row));
    }
}

if (typeof window !== 'undefined') window.GaussianNaiveBayes = GaussianNaiveBayes;
