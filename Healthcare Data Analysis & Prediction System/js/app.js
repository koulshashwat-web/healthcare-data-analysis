/**
 * Healthcare Data Analysis & Prediction System
 * Main Application Orchestrator & Router
 */

class HealthAnalyticsApp {
    constructor() {
        this.currentRoute = 'dashboard';
        this.views = {
            dashboard: DashboardView,
            datasets: DatasetView,
            preprocessing: PreprocessingView,
            classification: ClassificationView,
            regression: RegressionView,
            clustering: ClusteringView,
            association: AssociationView,
            comparison: ComparisonView
        };
    }

    init() {
        console.log('Initializing Healthcare Data Analysis & Prediction System...');

        // Initialize default benchmark dataset
        DatasetManager.initDefault();

        // Listen for dataset or state updates to refresh navbar badges
        window.appState.on('dataset_changed', (ds) => this.updateTopBar(ds));
        window.appState.on('preprocessed', () => this.updateTopBar(window.appState.activeDataset));
        window.appState.on('preprocessed_reset', () => this.updateTopBar(window.appState.activeDataset));

        // Initial topbar render
        this.updateTopBar(window.appState.activeDataset);

        // Initial navigation
        this.navigateTo('dashboard');

        // Setup mobile sidebar toggle
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.getElementById('app-sidebar')?.classList.toggle('mobile-open');
            });
        }
    }

    navigateTo(route) {
        if (!this.views[route]) {
            console.error('Unknown route:', route);
            route = 'dashboard';
        }

        this.currentRoute = route;
        window.appState.currentView = route;

        // Update sidebar active classes
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === route);
        });

        // Close mobile drawer if open
        document.getElementById('app-sidebar')?.classList.remove('mobile-open');

        // Update header breadcrumb title
        const titles = {
            dashboard: 'Clinical Overview & Executive Dashboard',
            datasets: 'Cohort Dataset Management & Profiling',
            preprocessing: 'Clinical Data Preprocessing Pipeline',
            classification: 'Disease Classification & Risk Prediction',
            regression: 'Continuous Healthcare Outcome & Cost Regression',
            clustering: 'Patient Phenotype Clustering & Segmentation',
            association: 'Apriori Clinical Association Rule Mining',
            comparison: 'Data Mining Algorithm Comparison & Benchmark Center'
        };
        const titleEl = document.getElementById('view-header-title');
        if (titleEl) titleEl.innerText = titles[route] || 'Healthcare Analytics';

        // Render target view
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.views[route].render();
    }

    updateTopBar(ds) {
        const badgeEl = document.getElementById('topbar-active-dataset-badge');
        if (badgeEl && ds) {
            badgeEl.innerHTML = `
                <span class="active-pulse"></span>
                <span class="dataset-text text-truncate"><strong>${ds.name}</strong> (${ds.activeData.length} records)</span>
                ${ds.isPreprocessed ? '<span class="badge-mini badge-mini-success">Preprocessed</span>' : '<span class="badge-mini badge-mini-neutral">Raw</span>'}
            `;
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `clinical-toast toast-${type} animate-slide-in`;
        toast.innerHTML = `
            <div class="toast-content">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
}

// Global instance
window.app = new HealthAnalyticsApp();

// Boot on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
