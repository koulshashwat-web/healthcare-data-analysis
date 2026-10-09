/**
 * Healthcare Data Analysis & Prediction System
 * Linear Regression & Multiple Linear Regression
 */

class LinearRegression {
    constructor(options = {}) {
        this.fitIntercept = options.fitIntercept !== false;
        this.ridgeLambda = options.ridgeLambda || 1e-5;
        this.coefficients = [];
        this.intercept = 0;
        this.featureNames = [];
    }

    fit(X, y, featureNames = []) {
        const n = X.length;
        const p = X[0]?.length || 0;
        this.featureNames = featureNames.length === p ? featureNames : Array.from({ length: p }, (_, i) => `Feature ${i}`);

        // Add intercept column (bias = 1) if fitIntercept is true
        const X_design = X.map(row => this.fitIntercept ? [1, ...row] : [...row]);
        const cols = this.fitIntercept ? p + 1 : p;

        // Normal equation: beta = (X^T * X + lambda * I)^(-1) * X^T * y
        const Xt = MathUtils.transpose(X_design);
        const XtX = MathUtils.matMul(Xt, X_design);

        // Add ridge regularization
        for (let i = 0; i < cols; i++) {
            XtX[i][i] += this.ridgeLambda;
        }

        const XtX_inv = MathUtils.inverse(XtX);
        const Xty = MathUtils.matVecMul(Xt, y);
        const beta = MathUtils.matVecMul(XtX_inv, Xty);

        if (this.fitIntercept) {
            this.intercept = beta[0];
            this.coefficients = beta.slice(1);
        } else {
            this.intercept = 0;
            this.coefficients = beta;
        }

        return this;
    }

    predictOne(sample) {
        let val = this.intercept;
        for (let i = 0; i < this.coefficients.length; i++) {
            val += this.coefficients[i] * (sample[i] || 0);
        }
        return val;
    }

    predict(X) {
        return X.map(row => this.predictOne(row));
    }
}

if (typeof window !== 'undefined') window.LinearRegression = LinearRegression;
