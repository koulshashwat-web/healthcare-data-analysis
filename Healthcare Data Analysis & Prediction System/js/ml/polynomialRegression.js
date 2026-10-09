/**
 * Healthcare Data Analysis & Prediction System
 * Polynomial Regression
 */

class PolynomialRegression {
    constructor(options = {}) {
        this.degree = options.degree || 2;
        this.ridgeLambda = options.ridgeLambda || 1e-4;
        this.linearModel = new LinearRegression({ ridgeLambda: this.ridgeLambda });
        this.polyFeatureNames = [];
    }

    _transformFeatures(X) {
        return X.map(row => {
            const polyRow = [...row];
            const p = row.length;

            if (this.degree >= 2) {
                // Squared terms
                for (let i = 0; i < p; i++) {
                    polyRow.push(row[i] * row[i]);
                }
                // Interaction terms for first few features to keep dimensions reasonable
                const maxInteractions = Math.min(p, 5);
                for (let i = 0; i < maxInteractions; i++) {
                    for (let j = i + 1; j < maxInteractions; j++) {
                        polyRow.push(row[i] * row[j]);
                    }
                }
            }

            if (this.degree >= 3) {
                // Cubic terms for first few features
                const maxCubic = Math.min(p, 4);
                for (let i = 0; i < maxCubic; i++) {
                    polyRow.push(row[i] * row[i] * row[i]);
                }
            }

            return polyRow;
        });
    }

    fit(X, y, featureNames = []) {
        const X_poly = this._transformFeatures(X);
        const p = featureNames.length || X[0].length;
        this.polyFeatureNames = [];
        for (let i = 0; i < p; i++) {
            this.polyFeatureNames.push(featureNames[i] || `X${i}`);
        }
        if (this.degree >= 2) {
            for (let i = 0; i < p; i++) {
                this.polyFeatureNames.push(`${featureNames[i] || `X${i}`}^2`);
            }
            const maxInteractions = Math.min(p, 5);
            for (let i = 0; i < maxInteractions; i++) {
                for (let j = i + 1; j < maxInteractions; j++) {
                    this.polyFeatureNames.push(`${featureNames[i] || `X${i}`}*${featureNames[j] || `X${j}`}`);
                }
            }
        }
        if (this.degree >= 3) {
            const maxCubic = Math.min(p, 4);
            for (let i = 0; i < maxCubic; i++) {
                this.polyFeatureNames.push(`${featureNames[i] || `X${i}`}^3`);
            }
        }

        this.linearModel.fit(X_poly, y, this.polyFeatureNames);
        return this;
    }

    predict(X) {
        const X_poly = this._transformFeatures(X);
        return this.linearModel.predict(X_poly);
    }

    predictOne(sample) {
        return this.predict([sample])[0];
    }
}

if (typeof window !== 'undefined') window.PolynomialRegression = PolynomialRegression;
