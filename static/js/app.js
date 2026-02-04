/**
 * Cookly - Recipe Capture Application
 * International AI of Mystery 🕶️
 * Created by @theclawdfather
 * Making recipe capture and cooking effortless
 */

class CooklyApp {
    constructor() {
        this.currentRecipe = null;
        this.savedRecipes = this.loadSavedRecipes();
        this.categories = this.loadCategories();
        this.currentFilter = 'all';
        this.currentStep = 0;
        this.totalSteps = 0;
        
        this.initializeEventListeners();
        this.displaySavedRecipes();
        this.initializeCategories();
    }

    initializeEventListeners() {
        // Capture button
        const captureBtn = document.getElementById('capture-btn');
        const recipeUrl = document.getElementById('recipe-url');
        
        captureBtn.addEventListener('click', () => this.captureRecipe());
        recipeUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.captureRecipe();
        });

        // Recipe actions
        document.getElementById('save-recipe')?.addEventListener('click', () => this.showSaveDialog());
        document.getElementById('step-by-step')?.addEventListener('click', () => this.startStepByStep());
        document.getElementById('share-recipe')?.addEventListener('click', () => this.shareRecipe());

        // Step navigation
        document.getElementById('prev-step')?.addEventListener('click', () => this.previousStep());
        document.getElementById('next-step')?.addEventListener('click', () => this.nextStep());
        document.getElementById('exit-step-mode')?.addEventListener('click', () => this.exitStepMode());

        // Category filter
        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.displaySavedRecipes();
        });

        // Save dialog
        document.getElementById('confirm-save')?.addEventListener('click', () => this.confirmSave());
        document.getElementById('cancel-save')?.addEventListener('click', () => this.hideSaveDialog());
        document.getElementById('new-category-btn')?.addEventListener('click', () => this.addNewCategory());

        // Share dialog tabs
        document.querySelectorAll('.share-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchShareTab(e.target.dataset.tab));
        });
        document.getElementById('copy-text')?.addEventListener('click', () => this.copyShareText());
        document.getElementById('copy-json')?.addEventListener('click', () => this.copyShareJson());
        document.getElementById('copy-cookly-url')?.addEventListener('click', () => this.copyCooklyUrl());
        document.getElementById('close-share')?.addEventListener('click', () => this.hideShareDialog());
        document.getElementById('send-email-action')?.addEventListener('click', () => this.sendEmailShare());
        document.getElementById('send-email-btn')?.addEventListener('click', () => this.sendEmailShare());
    }

    initializeCategories() {
        // Default categories if none exist
        if (this.categories.length === 0) {
            this.categories = ['Dinner', 'Breakfast', 'Dessert', 'Snack', 'Drinks'];
            this.saveCategories();
        }
        this.populateCategorySelects();
    }

    loadCategories() {
        try {
            const stored = localStorage.getItem('recipeCategories');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading categories:', error);
            return [];
        }
    }

    saveCategories() {
        try {
            localStorage.setItem('recipeCategories', JSON.stringify(this.categories));
        } catch (error) {
            console.error('Error saving categories:', error);
        }
    }

    populateCategorySelects() {
        // Populate filter dropdown
        const filterSelect = document.getElementById('category-filter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="all">All Categories</option>';
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                filterSelect.appendChild(option);
            });
        }

        // Populate save dialog dropdown
        const saveSelect = document.getElementById('save-category');
        if (saveSelect) {
            saveSelect.innerHTML = '';
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                saveSelect.appendChild(option);
            });
        }
    }

    addNewCategory() {
        const input = document.getElementById('new-category-input');
        const name = input.value.trim();
        
        if (name && !this.categories.includes(name)) {
            this.categories.push(name);
            this.saveCategories();
            this.populateCategorySelects();
            
            // Select the new category
            const saveSelect = document.getElementById('save-category');
            if (saveSelect) saveSelect.value = name;
            
            input.value = '';
            this.showStatus(`Category "${name}" created!`, 'success');
        }
    }

    async captureRecipe() {
        const urlInput = document.getElementById('recipe-url');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showStatus('Please enter a recipe URL', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showStatus('Please enter a valid URL', 'error');
            return;
        }

        this.showLoading(true);
        this.hideRecipeDisplay();
        this.hideStepMode();

        try {
            const response = await fetch('/api/extract-recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            const recipeData = await response.json();

            if (response.ok && !recipeData.error) {
                this.currentRecipe = recipeData;
                this.displayRecipe(recipeData);
                this.showStatus('Recipe captured successfully!', 'success');
            } else {
                this.showStatus(`Error: ${recipeData.error || 'Failed to extract recipe'}`, 'error');
            }
        } catch (error) {
            console.error('Error capturing recipe:', error);
            this.showStatus('Error connecting to server. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayRecipe(recipeData) {
        this.showRecipeDisplay();
        
        // Title and description
        document.getElementById('recipe-title').textContent = recipeData.title || 'Untitled Recipe';
        document.getElementById('recipe-description').textContent = recipeData.description || '';
        document.getElementById('recipe-author').textContent = recipeData.author ? `By ${recipeData.author}` : '';
        document.getElementById('recipe-servings').textContent = recipeData.servings ? `Serves ${recipeData.servings}` : '';
        
        // Show category badge if exists
        const categoryBadge = document.getElementById('recipe-category-badge');
        if (categoryBadge) {
            if (recipeData.category) {
                categoryBadge.textContent = recipeData.category;
                categoryBadge.style.display = 'inline-block';
            } else {
                categoryBadge.style.display = 'none';
            }
        }
        
        // Times
        document.getElementById('prep-time').textContent = this.formatTime(recipeData.prep_time);
        document.getElementById('cook-time').textContent = this.formatTime(recipeData.cook_time);
        document.getElementById('total-time').textContent = this.formatTime(recipeData.total_time);
        
        // Image
        const recipeImage = document.getElementById('recipe-image');
        if (recipeData.image) {
            recipeImage.src = recipeData.image;
            recipeImage.style.display = 'block';
        } else {
            recipeImage.style.display = 'none';
        }
        
        // Ingredients
        const ingredientsList = document.getElementById('ingredients-list');
        ingredientsList.innerHTML = '';
        recipeData.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient;
            ingredientsList.appendChild(li);
        });
        
        // Instructions
        const instructionsList = document.getElementById('instructions-list');
        instructionsList.innerHTML = '';
        recipeData.instructions.forEach((instruction, index) => {
            const li = document.createElement('li');
            li.textContent = instruction;
            li.className = 'instruction-step';
            li.dataset.step = index + 1;
            instructionsList.appendChild(li);
        });
        
        this.totalSteps = recipeData.instructions.length;
    }

    showSaveDialog() {
        if (!this.currentRecipe) return;
        document.getElementById('save-dialog').style.display = 'block';
    }

    hideSaveDialog() {
        document.getElementById('save-dialog').style.display = 'none';
    }

    confirmSave() {
        if (!this.currentRecipe) return;
        
        const categorySelect = document.getElementById('save-category');
        const category = categorySelect ? categorySelect.value : 'Uncategorized';
        
        // Add timestamp, ID, and category
        const recipeToSave = {
            ...this.currentRecipe,
            id: Date.now(),
            saved_at: new Date().toISOString(),
            category: category
        };
        
        this.savedRecipes.push(recipeToSave);
        this.saveRecipesToStorage();
        this.displaySavedRecipes();
        this.hideSaveDialog();
        this.showStatus('Recipe saved successfully!', 'success');
    }

    shareRecipe() {
        if (!this.currentRecipe) return;
        
        const shareText = this.generateShareText();
        const shareJson = JSON.stringify(this.currentRecipe, null, 2);
        const cooklyUrl = this.generateCooklyUrl();
        
        document.getElementById('share-text').value = shareText;
        document.getElementById('share-json').value = shareJson;
        document.getElementById('cookly-url').value = cooklyUrl;
        document.getElementById('share-dialog').style.display = 'block';
        
        // Reset to text tab
        this.switchShareTab('text');
    }

    generateCooklyUrl() {
        // Create a Cookly share URL with URL-safe base64-encoded recipe data
        const jsonString = JSON.stringify(this.currentRecipe);
        // Convert to base64, then make URL-safe
        const base64 = btoa(unescape(encodeURIComponent(jsonString)));
        const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?import=${urlSafe}`;
    }

    async copyCooklyUrl() {
        const url = document.getElementById('cookly-url').value;
        try {
            await navigator.clipboard.writeText(url);
            this.showStatus('Cookly URL copied! Share it with other Cookly users.', 'success');
        } catch (err) {
            this.showStatus('Failed to copy. Please select and copy manually.', 'error');
        }
    }

    checkForImportedRecipe() {
        // Check URL params for imported recipe
        const urlParams = new URLSearchParams(window.location.search);
        const importData = urlParams.get('import');
        
        if (importData) {
            try {
                const recipeData = JSON.parse(atob(decodeURIComponent(importData)));
                this.currentRecipe = recipeData;
                this.displayRecipe(recipeData);
                this.showRecipeDisplay();
                this.showStatus('Recipe imported successfully! Click "Save Recipe" to keep it.', 'success');
                
                // Clear the URL parameter without reloading
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (err) {
                console.error('Failed to import recipe:', err);
                this.showStatus('Failed to import recipe. Invalid URL.', 'error');
            }
        }
    }

    hideShareDialog() {
        document.getElementById('share-dialog').style.display = 'none';
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
        document.getElementById('share-json').style.display = tab === 'json' ? 'block' : 'none';
        
        // Update buttons
        document.getElementById('copy-text').style.display = tab === 'text' ? 'inline-block' : 'none';
        document.getElementById('copy-cookly-url').style.display = tab === 'cookly' ? 'inline-block' : 'none';
        document.getElementById('copy-json').style.display = tab === 'json' ? 'inline-block' : 'none';
        document.getElementById('send-email-action').style.display = tab === 'email' ? 'inline-block' : 'none';
    }

    sendEmailShare() {
        const email = document.getElementById('share-email-address').value;
        if (!email || !this.isValidEmail(email)) {
            this.showStatus('Please enter a valid email address', 'error');
            return;
        }
        
        const subject = encodeURIComponent(`Recipe: ${this.currentRecipe.title || 'Shared Recipe'}`);
        const body = encodeURIComponent(this.generateShareText());
        
        // Open mailto link
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        
        this.showStatus('Email client opened!', 'success');
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    generateShareText() {
        const r = this.currentRecipe;
        let text = `🍳 ${r.title || 'Recipe'}\n`;
        if (r.author) text += `By ${r.author}\n`;
        text += `\n`;
        
        if (r.prep_time || r.cook_time) {
            text += `⏱️ Time: `;
            if (r.prep_time) text += `Prep ${this.formatTime(r.prep_time)} `;
            if (r.cook_time) text += `Cook ${this.formatTime(r.cook_time)}`;
            text += `\n`;
        }
        if (r.servings) text += `🍽️ Serves: ${r.servings}\n`;
        text += `\n`;
        
        text += `📋 Ingredients:\n`;
        r.ingredients.forEach((ing, i) => {
            text += `${i + 1}. ${ing}\n`;
        });
        text += `\n`;
        
        text += `👨‍🍳 Instructions:\n`;
        r.instructions.forEach((inst, i) => {
            text += `${i + 1}. ${inst}\n`;
        });
        
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
            this.showStatus('Recipe copied to clipboard!', 'success');
        } catch (err) {
            this.showStatus('Failed to copy. Please select and copy manually.', 'error');
        }
    }

    async copyShareJson() {
        const json = document.getElementById('share-json').value;
        try {
            await navigator.clipboard.writeText(json);
            this.showStatus('JSON copied to clipboard!', 'success');
        } catch (err) {
            this.showStatus('Failed to copy. Please select and copy manually.', 'error');
        }
    }

    startStepByStep() {
        if (!this.currentRecipe || this.currentRecipe.instructions.length === 0) {
            this.showStatus('No instructions available for step-by-step mode', 'error');
            return;
        }
        
        this.currentStep = 0;
        this.showStepMode();
        this.updateStepDisplay();
    }

    updateStepDisplay() {
        document.getElementById('current-step').textContent = this.currentStep + 1;
        document.getElementById('total-steps').textContent = this.totalSteps;
        document.getElementById('step-instruction').textContent = this.currentRecipe.instructions[this.currentStep];
        
        // Update navigation buttons
        document.getElementById('prev-step').disabled = this.currentStep === 0;
        document.getElementById('next-step').disabled = this.currentStep === this.totalSteps - 1;
        
        // Update progress bar
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
        this.hideStepMode();
        this.showRecipeDisplay();
    }

    saveRecipe() {
        // Legacy save without category - now shows dialog
        this.showSaveDialog();
    }

    loadSavedRecipes() {
        try {
            const stored = localStorage.getItem('savedRecipes');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading saved recipes:', error);
            return [];
        }
    }

    saveRecipesToStorage() {
        try {
            localStorage.setItem('savedRecipes', JSON.stringify(this.savedRecipes));
        } catch (error) {
            console.error('Error saving recipes:', error);
        }
    }

    displaySavedRecipes() {
        const container = document.getElementById('saved-recipes-list');
        
        // Filter recipes
        let recipesToShow = this.savedRecipes;
        if (this.currentFilter !== 'all') {
            recipesToShow = this.savedRecipes.filter(r => r.category === this.currentFilter);
        }
        
        if (recipesToShow.length === 0) {
            const message = this.currentFilter === 'all' 
                ? 'No saved recipes yet. Capture your first recipe above!'
                : `No recipes in category "${this.currentFilter}"`;
            container.innerHTML = `<p class="no-recipes">${message}</p>`;
            return;
        }
        
        container.innerHTML = '';
        recipesToShow.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            const categoryBadge = recipe.category 
                ? `<span class="recipe-card-category">${recipe.category}</span>` 
                : '';
            recipeCard.innerHTML = `
                <div class="recipe-card-header">
                    <h4 class="recipe-card-title">${recipe.title || 'Untitled Recipe'}</h4>
                    ${categoryBadge}
                </div>
                <div class="recipe-card-meta">
                    <span class="recipe-card-date">${new Date(recipe.saved_at).toLocaleDateString()}</span>
                    <span class="recipe-card-source">${recipe.source_domain}</span>
                    <span class="recipe-card-ingredients">${recipe.ingredients.length} ingredients</span>
                </div>
                <div class="recipe-card-actions">
                    <button class="view-recipe-btn" onclick="app.viewRecipe(${recipe.id})">View</button>
                    <button class="share-saved-btn" onclick="app.shareSavedRecipe(${recipe.id})">Share</button>
                    <button class="delete-recipe-btn" onclick="app.deleteRecipe(${recipe.id})">Delete</button>
                </div>
            `;
            container.appendChild(recipeCard);
        });
    }

    shareSavedRecipe(recipeId) {
        const recipe = this.savedRecipes.find(r => r.id === recipeId);
        if (recipe) {
            this.currentRecipe = recipe;
            this.shareRecipe();
        }
    }

    viewRecipe(recipeId) {
        const recipe = this.savedRecipes.find(r => r.id === recipeId);
        if (recipe) {
            this.currentRecipe = recipe;
            this.displayRecipe(recipe);
            this.showRecipeDisplay();
            this.hideStepMode();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    deleteRecipe(recipeId) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            this.savedRecipes = this.savedRecipes.filter(r => r.id !== recipeId);
            this.saveRecipesToStorage();
            this.displaySavedRecipes();
            this.showStatus('Recipe deleted', 'info');
        }
    }

    // Utility functions
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    formatTime(timeString) {
        if (!timeString) return '';
        
        // Handle ISO 8601 duration format (PT30M, PT1H30M, etc.)
        if (timeString.startsWith('PT')) {
            const duration = timeString.substring(2);
            const hours = duration.match(/(\d+)H/);
            const minutes = duration.match(/(\d+)M/);
            
            let result = '';
            if (hours) result += `${hours[1]}h `;
            if (minutes) result += `${minutes[1]}min`;
            return result.trim();
        }
        
        return timeString;
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('status-message');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.style.display = 'block';
        
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }

    showLoading(show) {
        const captureBtn = document.getElementById('capture-btn');
        const buttonText = captureBtn.querySelector('.button-text');
        const spinner = captureBtn.querySelector('.loading-spinner');
        
        if (show) {
            captureBtn.disabled = true;
            buttonText.style.display = 'none';
            spinner.style.display = 'inline';
        } else {
            captureBtn.disabled = false;
            buttonText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    showRecipeDisplay() {
        document.getElementById('recipe-display').style.display = 'block';
    }

    hideRecipeDisplay() {
        document.getElementById('recipe-display').style.display = 'none';
    }

    showStepMode() {
        document.getElementById('step-mode').style.display = 'block';
    }

    hideStepMode() {
        document.getElementById('step-mode').style.display = 'none';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CooklyApp();
    window.app.checkForImportedRecipe();
});
