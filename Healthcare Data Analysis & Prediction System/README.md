# Healthcare Data Analysis & Prediction System

A modern, standalone clinical data mining and machine learning web application engineered for healthcare analytics, disease risk prediction, continuous medical expenditure estimation, patient phenotyping, and comorbidity association discovery.

---

## 🌟 Key Modules & Capabilities

### 1. Clinical Overview & Dashboard
- **Clinical KPIs**: Active cohort tracking, patient record counters, clinical feature counts, data quality score, and active trained model tally.
- **Clinical & Educational Disclaimer**: Prominent notice that system outputs are strictly for educational research and statistical exploration, not medical diagnostic devices.
- **Cohort Distribution Visualizer**: Interactive doughnut/bar charts displaying target outcome distribution.
- **Analytical Execution Audit Trail**: Real-time chronological logging of all model training runs and performance metrics.

### 2. Dataset Management & Profiling
- **Preloaded Benchmark Clinical Datasets**:
  - `Heart Disease (UCI Cleveland)` (303 patient records, 14 clinical attributes: resting BP, cholesterol, thalach, etc.)
  - `Diabetes Risk (Pima Indians / UCI)` (768 records, glucose, insulin, BMI, pedigree)
  - `Breast Cancer Diagnostic (Wisconsin)` (569 records, nuclear radius, texture, concavity)
  - `Medical Insurance Expenditure` (1,338 records, age, BMI, smoker status, billing charges)
  - `Stroke Risk Assessment` (400 records, hypertension, heart disease, glucose, stroke outcome)
  - `Patient Symptoms & Comorbidity` (500 records, discrete comorbidity transactions for association mining)
- **Custom CSV Ingestion**: Drag-and-drop file upload zone and file browser with automatic typing.
- **Tabular Data Table**: Search filtering, ascending/descending column sorting, and pagination (10/25/50/100).
- **Deep Statistical Profiling**: Mean, Median, Standard Deviation, Min, 25% (Q1), 50%, 75% (Q3), Max, Skewness, and Missing value counts with interactive histogram distributions.
- **CSV Data Export**: One-click download of active datasets.

### 3. Clinical Data Preprocessing Pipeline
- **Missing Value Imputation**: Mean, Median, Mode, Zero/Constant, or Row deletion strategies.
- **Duplicate Removal & Cleaning**: Exact record deduplication and string sanitation.
- **Categorical Variable Encoding**: Label Encoding and One-Hot (Dummy) Encoding.
- **Feature Scaling & Normalization**: Standardization (Z-score: $\mu=0, \sigma=1$) and Min-Max Normalization ($[0, 1]$).
- **Clinical Outlier Detection**: Interquartile Range (IQR, $1.5 \times \text{IQR}$) and Z-Score ($|z| > 3.0$) with Winsorize (clipping) or row removal.
- **Feature Selection**: Near-constant variance threshold filtering and manual feature subsetting.
- **Before / After Comparison**: Side-by-side comparison strip, transformation audit log, and comparative feature distribution charts.
- **Pipeline Persistence**: "Apply & Save to Active Pipeline" propagates cleaned data to all downstream ML tabs.

### 4. Disease Classification & Clinical Risk Prediction
- **Algorithms Implemented**:
  1. Decision Tree Classifier (CART with Gini Impurity)
  2. Random Forest Classifier (Bagged ensemble with feature subspace sampling)
  3. K-Nearest Neighbors (KNN with Euclidean distance and uniform/distance weighting)
  4. Gaussian Naive Bayes (Log-likelihood Gaussian PDF)
  5. Logistic Regression (Sigmoid activation, gradient descent, L2 regularization, OvR multiclass)
  6. Support Vector Machine (Linear & RBF Soft-Margin SVM via subgradient hinge loss)
- **Evaluation Metrics**: Accuracy, Precision, Recall / Sensitivity, Specificity, F1-Score, and ROC AUC.
- **Interactive Visualizations**:
  - Confusion Matrix Heatmap (True Positive, False Positive, True Negative, False Negative with counts and percentages).
  - Receiver Operating Characteristic (ROC) Curve with AUC calculation.
- **Live Patient Disease Risk Simulator**:
  - Dynamically builds an interactive patient intake form with cohort baseline defaults.
  - Generates instant risk categorization (Low vs. Elevated Risk) with model confidence percentage.

### 5. Healthcare Outcome & Expenditure Regression
- **Algorithms Implemented**:
  1. Simple Linear Regression (OLS)
  2. Multiple Linear Regression (Multivariate OLS Normal Equations)
  3. Polynomial Regression (Degrees 2 and 3 feature expansion with Ridge regularization)
  4. Decision Tree Regressor (CART MSE variance reduction)
  5. Random Forest Regressor (Ensemble averaging)
- **Evaluation Metrics**: MAE, MSE, RMSE, R² Score (% variance explained), and Adjusted R².
- **Visualizations**:
  - Actual vs. Predicted scatter plot with $45^\circ$ ideal fit reference line.
  - Residuals plot ($y - \hat{y}$) against fitted values.
- **Live Clinical Outcome & Cost Calculator**:
  - Interactive prediction of expected continuous targets (e.g., Hospital Charges, Biomarkers).

### 6. Patient Cohort Clustering & Segmentation
- **Algorithms Implemented**:
  1. K-Means Clustering (Lloyd's algorithm with K-Means++ centroid initialization)
  2. Agglomerative Hierarchical Clustering (Linkage analysis)
  3. DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
- **Evaluation Metrics**: Silhouette Coefficient, Within-Cluster Sum of Squares (Inertia), Discovered cluster sizes, and Noise point counts.
- **Elbow Method Curve Generator**: Evaluates inertia across $K = 2 \dots 8$ to discover optimal cluster inflection points.
- **Visualizations & Personas**:
  - 2D Principal Component Projection (PCA space: PC1 vs PC2) with cluster assignments.
  - Patient Cohort Personas (Clinical archetypes summarizing mean vitals and attributes per cluster).

### 7. Clinical Association Rule Mining
- **Algorithm**: Apriori algorithm with candidate generation and pruning.
- **Metrics**: Support, Confidence, Lift, and Conviction.
- **Discretization**: Converts continuous physiological markers into risk brackets.
- **Visualizations**:
  - Interactive Support vs. Confidence scatter plot colored by Lift.
  - Association Rules leaderboard table filterable by target consequent.
  - Natural language Clinical Knowledge Translation cards.

### 8. Data Mining Comparison & Benchmark Center
- **Automated Tournament Runners**:
  - "Benchmark All 6 Classifiers" (evaluates all classification models simultaneously on identical test splits).
  - "Benchmark All 5 Regressors" (evaluates all continuous models simultaneously).
  - "Benchmark Clustering Models" (evaluates K-Means, Hierarchical, and DBSCAN).
- **Strict Metric Segregation**: Dedicated leaderboard tables and charts for Classification, Regression, and Clustering ensuring scientific validity.
- **Champion Recommendations**:
  - 🏆 Best Overall Model (Peak F1-Score).
  - 🩺 Best for Clinical Screening (Highest Recall / Sensitivity to minimize false negatives).
- **Clinical Audit Report Export**: Print-ready formatting for clinical reporting.

---

## 🚀 Running the Application Locally

The application runs directly in any modern web browser with zero compilation or setup required.

### Option 1: Double-Click Launcher (Python)
Run the launcher:
```powershell
python launch.py
```
This automatically starts a local server on `http://localhost:8080` and opens your default browser.

### Option 2: Standard HTTP Server
```powershell
python -m http.server 8080
```
Then navigate to: [http://localhost:8080](http://localhost:8080)
