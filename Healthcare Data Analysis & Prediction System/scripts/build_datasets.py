import os
import json

os.makedirs('js/datasets', exist_ok=True)

datasets = {
    'heart_disease': {
        'id': 'heart_disease',
        'name': 'Heart Disease (UCI Cleveland)',
        'description': 'Clinical assessment of 303 cardiac patients across 13 hemodynamic and diagnostic attributes to predict coronary heart disease presence.',
        'target': 'target',
        'defaultTask': 'classification',
        'file': 'data/heart_disease.csv'
    },
    'diabetes': {
        'id': 'diabetes',
        'name': 'Diabetes Risk (Pima Indians)',
        'description': 'Diagnostic measurements from the National Institute of Diabetes and Digestive and Kidney Diseases to predict diabetes onset.',
        'target': 'Outcome',
        'defaultTask': 'classification',
        'file': 'data/diabetes.csv'
    },
    'breast_cancer': {
        'id': 'breast_cancer',
        'name': 'Breast Cancer Diagnostic (Wisconsin)',
        'description': 'Digitized fine needle aspirate (FNA) measurements of breast mass cell nuclei characteristics (radius, texture, concavity) to classify malignancy.',
        'target': 'diagnosis',
        'defaultTask': 'classification',
        'file': 'data/breast_cancer.csv'
    },
    'medical_insurance': {
        'id': 'medical_insurance',
        'name': 'Medical Insurance Expenditure',
        'description': 'Individual demographic and health risk parameters (BMI, smoking status, age) to predict annual healthcare expenditure and billing charges.',
        'target': 'charges',
        'defaultTask': 'regression',
        'file': 'data/medical_insurance.csv'
    },
    'stroke_risk': {
        'id': 'stroke_risk',
        'name': 'Stroke Risk Assessment',
        'description': 'Clinical attributes including hypertension, glucose levels, heart disease history, and lifestyle factors to predict cerebrovascular stroke risk.',
        'target': 'stroke',
        'defaultTask': 'classification',
        'file': 'data/stroke_risk.csv'
    },
    'symptoms_association': {
        'id': 'symptoms_association',
        'name': 'Patient Symptoms & Comorbidity',
        'description': 'Discrete categorical clinical profiles with hypertension, cholesterol, smoking, symptoms, and cardiac events for association mining and clustering.',
        'target': 'CardiacEvent',
        'defaultTask': 'association',
        'file': 'data/symptoms_association.csv'
    }
}

for key, meta in datasets.items():
    with open(meta['file'], 'r', encoding='utf-8') as f:
        meta['csvContent'] = f.read()

with open('js/datasets/preloadedDatasets.js', 'w', encoding='utf-8') as f:
    f.write('// Preloaded Benchmark Healthcare Datasets\n')
    f.write('const PRELOADED_DATASETS = ' + json.dumps(datasets, indent=2) + ';\n')
    f.write('if (typeof window !== "undefined") window.PRELOADED_DATASETS = PRELOADED_DATASETS;\n')

print('Generated js/datasets/preloadedDatasets.js successfully!')
