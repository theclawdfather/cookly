/**
 * Cookly - Recipe Capture Application
 * Simple, working version
 */

class CooklyApp {
    constructor() {
        this.currentRecipe = null;
        this.savedRecipes = this.loadSavedRecipes();
        this.searchQuery = '';
        this.currentFilter = 'all';
        
        this.init();
    }

    init() {
        console.log('Initializing Cookly...');
        
        // Load saved recipes
        this.displaySavedRecipes();
        
        // Attach event listeners
        this.attachListeners();
        
        console.log('Cookly initialized!');
    }

    attachListeners() {
        // Capture button
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                console.log('Capture button clicked');
                this.captureRecipe();
            });
        }
        
        // Enter key on URL input
        const urlInput = document.getElementById('recipe-url');
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.captureRecipe();
            });
        }
        
        // Save recipe button - now opens dialog
        const saveBtn = document.getElementById('save-recipe');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.showSaveDialog());
        }
        
        // Save dialog buttons
        const confirmSaveBtn = document.getElementById('confirm-save');
        const cancelSaveBtn = document.getElementById('cancel-save');
        if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', () => this.confirmSave());
        if (cancelSaveBtn) cancelSaveBtn.addEventListener('click', () => this.hideSaveDialog());
        
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                if (clearSearchBtn) clearSearchBtn.style.display = this.searchQuery ? 'inline-block' : 'none';
                this.displaySavedRecipes();
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                this.searchQuery = '';
                clearSearchBtn.style.display = 'none';
                this.displaySavedRecipes();
            });
        }
        
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.displaySavedRecipes();
            });
        }
        
        // Step by step button
        const stepBtn = document.getElementById('step-by-step');
        if (stepBtn) {
            stepBtn.addEventListener('click', () => this.startStepByStep());
        }
        
        // Share button
        const shareBtn = document.getElementById('share-recipe');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareRecipe());
        }
        
        // Share dialog tabs
        document.querySelectorAll('.share-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchShareTab(e.target.dataset.tab));
        });
        
        // Copy buttons
        const copyCooklyUrlBtn = document.getElementById('copy-cookly-url');
        const sendEmailActionBtn = document.getElementById('send-email-action');
        const sendEmailBtn = document.getElementById('send-email-btn');
        
        if (copyCooklyUrlBtn) copyCooklyUrlBtn.addEventListener('click', () => this.copyCooklyUrl());
        if (sendEmailActionBtn) sendEmailActionBtn.addEventListener('click', () => this.sendEmailShare());
        if (sendEmailBtn) sendEmailBtn.addEventListener('click', () => this.sendEmailShare());
        
        // Step navigation
        const prevStep = document.getElementById('prev-step');
        const nextStep = document.getElementById('next-step');
        const exitStep = document.getElementById('exit-step-mode');
        
        if (prevStep) prevStep.addEventListener('click', () => this.previousStep());
        if (nextStep) nextStep.addEventListener('click', () => this.nextStep());
        if (exitStep) exitStep.addEventListener('click', () => this.exitStepMode());
        
        // Close share dialog
        const closeShare = document.getElementById('close-share');
        if (closeShare) {
            closeShare.addEventListener('click', () => {
                document.getElementById('share-dialog').style.display = 'none';
            });
        }
        
        // Copy buttons
        const copyText = document.getElementById('copy-text');
        if (copyText) {
            copyText.addEventListener('click', () => this.copyShareText());
        }
        
        // Share from saved recipe
        const shareSavedBtn = document.getElementById('share-saved-btn');
        if (shareSavedBtn) {
            shareSavedBtn.addEventListener('click', () => this.shareSavedRecipe());
        }
    }

    async captureRecipe() {
        const urlInput = document.getElementById('recipe-url');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showStatus('Please enter a recipe URL', 'error');
            return;
        }

        this.showLoading(true);
        this.hideRecipeDisplay();

        try {
            const response = await fetch('/api/extract-recipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            const recipeData = await response.json();

            if (response.ok && !recipeData.error) {
                this.currentRecipe = recipeData;
                this.displayRecipe(recipeData);
                this.showStatus('Recipe captured!', 'success');
            } else {
                this.showStatus(`Error: ${recipeData.error || 'Failed to extract'}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showStatus('Error connecting to server', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayRecipe(recipeData) {
        document.getElementById('recipe-display').style.display = 'block';
        
        document.getElementById('recipe-title').textContent = recipeData.title || 'Untitled';
        document.getElementById('recipe-description').textContent = recipeData.description || '';
        document.getElementById('recipe-author').textContent = recipeData.author ? `By ${recipeData.author}` : '';
        
        // Times
        document.getElementById('prep-time').textContent = this.formatTime(recipeData.prep_time);
        document.getElementById('cook-time').textContent = this.formatTime(recipeData.cook_time);
        document.getElementById('total-time').textContent = this.formatTime(recipeData.total_time);
        
        // Image
        const img = document.getElementById('recipe-image');
        if (recipeData.image) {
            img.src = recipeData.image;
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
        
        // Ingredients
        const ingList = document.getElementById('ingredients-list');
        ingList.innerHTML = '';
        if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
            recipeData.ingredients.forEach(ing => {
                const li = document.createElement('li');
                li.textContent = ing;
                ingList.appendChild(li);
            });
        }
        
        // Instructions
        const instList = document.getElementById('instructions-list');
        instList.innerHTML = '';
        if (recipeData.instructions && Array.isArray(recipeData.instructions)) {
            recipeData.instructions.forEach((inst, i) => {
                const li = document.createElement('li');
                li.textContent = inst;
                instList.appendChild(li);
            });
        }
        
        this.totalSteps = recipeData.instructions.length;
    }

    showSaveDialog() {
        if (!this.currentRecipe) return;
        const dialog = document.getElementById('save-dialog');
        if (dialog) dialog.style.display = 'block';
    }

    hideSaveDialog() {
        const dialog = document.getElementById('save-dialog');
        if (dialog) dialog.style.display = 'none';
    }

    confirmSave() {
        if (!this.currentRecipe) return;
        
        const categorySelect = document.getElementById('recipe-category');
        const category = categorySelect ? categorySelect.value : 'Uncategorized';
        
        const recipeToSave = {
            ...this.currentRecipe,
            id: Date.now(),
            saved_at: new Date().toISOString(),
            category: category
        };
        
        console.log('Saving recipe:', recipeToSave);
        this.savedRecipes.push(recipeToSave);
        this.saveToStorage();
        this.displaySavedRecipes();
        this.hideSaveDialog();
        this.showStatus('Recipe saved!', 'success');
        console.log('Recipe saved successfully');
    }

    saveRecipe() {
        // Legacy method - now shows dialog
        this.showSaveDialog();
    }

    displaySavedRecipes() {
        const container = document.getElementById('saved-recipes-list');
        
        // Filter recipes
        let recipesToShow = this.savedRecipes;
        
        // Category filter
        if (this.currentFilter !== 'all') {
            recipesToShow = recipesToShow.filter(r => r.category === this.currentFilter);
        }
        
        // Search filter
        if (this.searchQuery) {
            recipesToShow = recipesToShow.filter(r => {
                const titleMatch = r.title && r.title.toLowerCase().includes(this.searchQuery);
                const ingredientMatch = r.ingredients && Array.isArray(r.ingredients) && r.ingredients.some(ing => 
                    ing.toLowerCase().includes(this.searchQuery)
                );
                return titleMatch || ingredientMatch;
            });
        }
        
        if (recipesToShow.length === 0) {
            let message = 'No saved recipes yet.';
            if (this.searchQuery) {
                message = `No recipes found for "${this.searchQuery}"`;
            } else if (this.currentFilter !== 'all') {
                message = `No recipes in category "${this.currentFilter}"`;
            }
            container.innerHTML = `<p class="no-recipes">${message}</p>`;
            return;
        }
        
        container.innerHTML = '';
        recipesToShow.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            const ingredientCount = recipe.ingredients && Array.isArray(recipe.ingredients) 
                ? recipe.ingredients.length 
                : 0;
            const categoryBadge = recipe.category 
                ? `<span class="recipe-category-badge">${recipe.category}</span>` 
                : '';
            card.innerHTML = `
                <div class="recipe-card-header">
                    <h4>${recipe.title || 'Untitled'}</h4>
                    ${categoryBadge}
                </div>
                <div class="recipe-card-meta">
                    <span>${new Date(recipe.saved_at).toLocaleDateString()}</span>
                    <span>${ingredientCount} ingredients</span>
                </div>
                <div class="recipe-card-actions">
                    <button onclick="app.loadSavedRecipe(${recipe.id})" class="view-recipe-btn">View</button>
                    <button onclick="app.shareRecipeById(${recipe.id})" class="share-saved-btn">Share</button>
                    <button onclick="app.deleteRecipe(${recipe.id})" class="delete-recipe-btn">Delete</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    shareRecipeById(id) {
        const recipe = this.savedRecipes.find(r => r.id === id);
        if (recipe) {
            this.currentRecipe = recipe;
            this.shareRecipe();
        }
    }

    shareRecipeById(id) {
        const recipe = this.savedRecipes.find(r => r.id === id);
        if (recipe) {
            this.currentRecipe = recipe;
            this.shareRecipe();
        }
    }

    loadSavedRecipe(id) {
        const recipe = this.savedRecipes.find(r => r.id === id);
        if (recipe) {
            this.currentRecipe = recipe;
            this.displayRecipe(recipe);
            window.scrollTo(0, 0);
        }
    }

    deleteRecipe(id) {
        if (confirm('Delete this recipe?')) {
            this.savedRecipes = this.savedRecipes.filter(r => r.id !== id);
            this.saveToStorage();
            this.displaySavedRecipes();
        }
    }

    startStepByStep() {
        if (!this.currentRecipe || !this.currentRecipe.instructions.length) return;
        
        this.currentStep = 0;
        document.getElementById('step-mode').style.display = 'block';
        this.updateStepDisplay();
    }

    updateStepDisplay() {
        document.getElementById('current-step').textContent = this.currentStep + 1;
        document.getElementById('total-steps').textContent = this.totalSteps;
        document.getElementById('step-instruction').textContent = 
            this.currentRecipe.instructions[this.currentStep];
        
        document.getElementById('prev-step').disabled = this.currentStep === 0;
        document.getElementById('next-step').disabled = this.currentStep === this.totalSteps - 1;
        
        const progress = ((this.currentStep + 1) / this.totalSteps) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.updateStepDisplay();
        }
    }

    exitStepMode() {
        document.getElementById('step-mode').style.display = 'none';
    }

    shareRecipe() {
        if (!this.currentRecipe) return;
        
        const shareText = this.formatShareText();
        const cooklyUrl = this.generateCooklyUrl();
        
        document.getElementById('share-text').value = shareText;
        document.getElementById('cookly-url').value = cooklyUrl;
        document.getElementById('share-dialog').style.display = 'block';
        
        // Reset to text tab
        this.switchShareTab('text');
    }

    generateCooklyUrl() {
        // Create a Cookly share URL with URL-safe base64-encoded recipe data
        const jsonString = JSON.stringify(this.currentRecipe);
        const base64 = btoa(unescape(encodeURIComponent(jsonString)));
        const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?import=${urlSafe}`;
    }

    switchShareTab(tab) {
        // Update tabs
        document.querySelectorAll('.share-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        // Update content
        document.getElementById('share-text').style.display = tab === 'text' ? 'block' : 'none';
        document.getElementById('share-email').style.display = tab === 'email' ? 'block' : 'none';
        document.getElementById('share-cookly').style.display = tab === 'cookly' ? 'block' : 'none';
        
        // Update buttons
        document.getElementById('copy-text').style.display = tab === 'text' ? 'inline-block' : 'none';
        document.getElementById('copy-cookly-url').style.display = tab === 'cookly' ? 'inline-block' : 'none';
        document.getElementById('send-email-action').style.display = tab === 'email' ? 'inline-block' : 'none';
    }

    async copyCooklyUrl() {
        const url = document.getElementById('cookly-url').value;
        try {
            await navigator.clipboard.writeText(url);
            this.showStatus('Cookly URL copied!', 'success');
        } catch (err) {
            this.showStatus('Failed to copy', 'error');
        }
    }

    sendEmailShare() {
        const emailInput = document.getElementById('share-email-address');
        const email = emailInput ? emailInput.value.trim() : '';
        
        if (!email || !this.isValidEmail(email)) {
            this.showStatus('Please enter a valid email', 'error');
            return;
        }
        
        const subject = encodeURIComponent(`Recipe: ${this.currentRecipe.title || 'Shared Recipe'}`);
        const body = encodeURIComponent(this.formatShareText());
        
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        this.showStatus('Email client opened!', 'success');
    }

    shareSavedRecipe() {
        // Get the most recently viewed/clicked recipe, or use current
        if (!this.currentRecipe && this.savedRecipes.length > 0) {
            // Share the first saved recipe as default
            this.currentRecipe = this.savedRecipes[0];
        }
        if (this.currentRecipe) {
            this.shareRecipe();
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    formatShareText() {
        const r = this.currentRecipe;
        let text = `🍳 ${r.title || 'Recipe'}\n\n`;
        if (r.author) text += `By ${r.author}\n\n`;
        
        if (r.prep_time || r.cook_time) {
            text += `⏱️ Time: `;
            if (r.prep_time) text += `Prep ${this.formatTime(r.prep_time)} `;
            if (r.cook_time) text += `Cook ${this.formatTime(r.cook_time)}`;
            text += `\n`;
        }
        if (r.servings) text += `🍽️ Serves: ${r.servings}\n`;
        text += `\n`;
        
        text += `📋 Ingredients:\n`;
        if (r.ingredients && Array.isArray(r.ingredients)) {
            r.ingredients.forEach((ing, i) => text += `${i + 1}. ${ing}\n`);
        }
        text += `\n`;
        
        text += `👨‍🍳 Instructions:\n`;
        if (r.instructions && Array.isArray(r.instructions)) {
            r.instructions.forEach((inst, i) => text += `${i + 1}. ${inst}\n`);
        }
        
        if (r.source_url) {
            text += `\n🔗 Source: ${r.source_url}\n`;
        }
        
        text += `\nCaptured with Cookly 🦾`;
        return text;
    }

    async copyShareText() {
        const text = document.getElementById('share-text').value;
        try {
            await navigator.clipboard.writeText(text);
            this.showStatus('Copied!', 'success');
        } catch (err) {
            this.showStatus('Failed to copy', 'error');
        }
    }

    showLoading(show) {
        const btn = document.getElementById('capture-btn');
        const text = btn.querySelector('.button-text');
        const spinner = btn.querySelector('.loading-spinner');
        
        btn.disabled = show;
        text.style.display = show ? 'none' : 'inline';
        spinner.style.display = show ? 'inline' : 'none';
    }

    showStatus(msg, type) {
        const el = document.getElementById('status-message');
        el.textContent = msg;
        el.className = `status-message ${type}`;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 3000);
    }

    hideRecipeDisplay() {
        document.getElementById('recipe-display').style.display = 'none';
    }

    formatTime(time) {
        if (!time) return '';
        if (time.startsWith('PT')) {
            const h = time.match(/(\d+)H/);
            const m = time.match(/(\d+)M/);
            let r = '';
            if (h) r += `${h[1]}h `;
            if (m) r += `${m[1]}min`;
            return r.trim();
        }
        return time;
    }

    loadSavedRecipes() {
        try {
            const stored = localStorage.getItem('savedRecipes');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    saveToStorage() {
        localStorage.setItem('savedRecipes', JSON.stringify(this.savedRecipes));
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CooklyApp();
    
    // Check for imported recipe from URL
    const urlParams = new URLSearchParams(window.location.search);
    const importData = urlParams.get('import');
    
    if (importData) {
        try {
            // URL-safe base64 decoding
            let encoded = importData.replace(/-/g, '+').replace(/_/g, '/');
            const padding = 4 - encoded.length % 4;
            if (padding !== 4) encoded += '='.repeat(padding);
            
            const recipeData = JSON.parse(decodeURIComponent(escape(atob(encoded))));
            window.app.currentRecipe = recipeData;
            window.app.displayRecipe(recipeData);
            window.app.showStatus('Recipe imported! Click Save to keep it.', 'success');
            
            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
            console.error('Failed to import:', err);
        }
    }
});
