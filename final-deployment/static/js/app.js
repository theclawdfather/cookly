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
        this.currentStep = 0;
        this.totalSteps = 0;
        
        this.initializeEventListeners();
        this.displaySavedRecipes();
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
        document.getElementById('save-recipe')?.addEventListener('click', () => this.saveRecipe());
        document.getElementById('step-by-step')?.addEventListener('click', () => this.startStepByStep());

        // Step navigation
        document.getElementById('prev-step')?.addEventListener('click', () => this.previousStep());
        document.getElementById('next-step')?.addEventListener('click', () => this.nextStep());
        document.getElementById('exit-step-mode')?.addEventListener('click', () => this.exitStepMode());
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
        if (!this.currentRecipe) return;
        
        // Add timestamp and ID
        const recipeToSave = {
            ...this.currentRecipe,
            id: Date.now(),
            saved_at: new Date().toISOString()
        };
        
        this.savedRecipes.push(recipeToSave);
        this.saveRecipesToStorage();
        this.displaySavedRecipes();
        this.showStatus('Recipe saved successfully!', 'success');
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
        
        if (this.savedRecipes.length === 0) {
            container.innerHTML = '<p class="no-recipes">No saved recipes yet. Capture your first recipe above!</p>';
            return;
        }
        
        container.innerHTML = '';
        this.savedRecipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.innerHTML = `
                <div class="recipe-card-header">
                    <h4 class="recipe-card-title">${recipe.title || 'Untitled Recipe'}</h4>
                    <span class="recipe-card-date">${new Date(recipe.saved_at).toLocaleDateString()}</span>
                </div>
                <div class="recipe-card-meta">
                    <span class="recipe-card-source">${recipe.source_domain}</span>
                    <span class="recipe-card-ingredients">${recipe.ingredients.length} ingredients</span>
                </div>
                <div class="recipe-card-actions">
                    <button class="view-recipe-btn" onclick="app.viewRecipe(${recipe.id})">View Recipe</button>
                    <button class="delete-recipe-btn" onclick="app.deleteRecipe(${recipe.id})">Delete</button>
                </div>
            `;
            container.appendChild(recipeCard);
        });
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
});