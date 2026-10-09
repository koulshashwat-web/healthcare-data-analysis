/**
 * Healthcare Data Analysis & Prediction System
 * Centralized State Management & Event Bus
 */

class AppState {
    constructor() {
        this.currentView = 'dashboard';
        this.activeDatasetId = 'heart_disease';
        
        this.activeDataset = {
            id: 'heart_disease',
            name: 'Heart Disease (UCI Cleveland)',
            description: '',
            targetColumn: 'target',
            defaultTask: 'classification',
            columns: [],
            rawData: [],
            activeData: [],
            isPreprocessed: false
        };

        this.preprocessor = new HealthcarePreprocessor();
        
        this.trainedModels = {
            classification: {},
            regression: {},
            clustering: {},
            association: null
        };

        this.analysisHistory = [];
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, payload) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => {
                try {
                    cb(payload);
                } catch (err) {
                    console.error(`Error in event listener for ${event}:`, err);
                }
            });
        }
    }

    setDataset(id, name, description, columns, data, targetColumn = null, defaultTask = 'classification') {
        this.activeDatasetId = id;
        this.activeDataset = {
            id,
            name,
            description,
            targetColumn: targetColumn || (columns.length > 0 ? columns[columns.length - 1] : null),
            defaultTask,
            columns: [...columns],
            rawData: JSON.parse(JSON.stringify(data)),
            activeData: JSON.parse(JSON.stringify(data)),
            isPreprocessed: false
        };

        this.preprocessor.loadDataset(data, columns);

        // Reset trained models for new dataset
        this.trainedModels = {
            classification: {},
            regression: {},
            clustering: {},
            association: null
        };

        this.emit('dataset_changed', this.activeDataset);
    }

    applyPreprocessed(newColumns, newData) {
        this.activeDataset.columns = [...newColumns];
        this.activeDataset.activeData = JSON.parse(JSON.stringify(newData));
        this.activeDataset.isPreprocessed = true;

        this.emit('preprocessed', {
            columns: this.activeDataset.columns,
            data: this.activeDataset.activeData,
            steps: this.preprocessor.pipelineSteps
        });
    }

    resetDatasetToRaw() {
        this.preprocessor.reset();
        this.activeDataset.columns = [...this.activeDataset.rawData[0] ? Object.keys(this.activeDataset.rawData[0]) : this.preprocessor.rawDataset.columns];
        this.activeDataset.activeData = JSON.parse(JSON.stringify(this.activeDataset.rawData));
        this.activeDataset.isPreprocessed = false;

        this.emit('preprocessed_reset', this.activeDataset);
    }

    recordModelResult(category, algorithmName, resultData) {
        if (!this.trainedModels[category]) {
            this.trainedModels[category] = {};
        }

        if (category === 'association') {
            this.trainedModels.association = resultData;
        } else {
            this.trainedModels[category][algorithmName] = resultData;
        }

        // Add to execution history
        this.analysisHistory.unshift({
            id: 'hist_' + Date.now(),
            category,
            algorithm: algorithmName,
            datasetName: this.activeDataset.name,
            metrics: resultData.metrics || {},
            timestamp: new Date().toLocaleTimeString(),
            fullDate: new Date().toLocaleString()
        });

        if (this.analysisHistory.length > 30) this.analysisHistory.pop();

        this.emit('model_trained', { category, algorithmName, resultData });
    }
}

if (typeof window !== 'undefined') {
    window.appState = new AppState();
}
