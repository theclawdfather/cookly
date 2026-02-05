/**
 * Cookly - Recipe Capture Application
 */

class CooklyApp {
    constructor() {
        this.currentRecipe = null;
        this.savedRecipes = this.loadSavedRecipes();
        this.shoppingList = this.loadShoppingList();
        this.shoppingListVisible = false;
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        this.init();
    }

    init() {
        console.log('Initializing Cookly...');
        this.displaySavedRecipes();
        this.displayShoppingList();
        this.attachListeners();
        console.log('Cookly initialized!');
    }

    attachListeners() {
        // Capture button
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.captureRecipe());
        }
        
        // URL input enter key
        const urlInput = document.getElementById('recipe-url');
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.captureRecipe();
            });
        }
        
        // Save recipe button - shows dialog
        const saveBtn = document.getElementById('save-recipe');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.showSaveDialog());
        }
        
        // Save dialog buttons
        const confirmSave = document.getElementById('confirm-save');
        const cancelSave = document.getElementById('cancel-save');
        if (confirmSave) confirmSave.addEventListener('click', () => this.saveRecipe());
        if (cancelSave) cancelSave.addEventListener('click', () => this.hideSaveDialog());
        
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
        
        // Add to shopping list button (in recipe display)
        const addToShoppingBtn = document.getElementById('add-to-shopping');
        if (addToShoppingBtn) {
            addToShoppingBtn.addEventListener('click', () => this.addCurrentRecipeToShoppingList());
        }
        
        // Shopping list toggle
        const toggleShoppingList = document.getElementById('toggle-shopping-list');
        if (toggleShoppingList) {
            toggleShoppingList.addEventListener('click', () => this.toggleShoppingList());
        }
        
        // Add manual shopping item
        const addItemBtn = document.getElementById('add-shopping-item');
        const newItemInput = document.getElementById('new-shopping-item');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addManualShoppingItem());
        }
        if (newItemInput) {
            newItemInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addManualShoppingItem();
            });
        }
        
        // Clear purchased items
        const clearPurchasedBtn = document.getElementById('clear-purchased');
        if (clearPurchasedBtn) {
            clearPurchasedBtn.addEventListener('click', () => this.clearPurchasedItems());
        }
        
        // Clear all items
        const clearAllBtn = document.getElementById('clear-all-items');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllShoppingItems());
        }
        
        // Shop ingredients button
        const shopIngredientsBtn = document.getElementById('shop-ingredients');
        if (shopIngredientsBtn) {
            shopIngredientsBtn.addEventListener('click', () => this.openShopDialog());
        }
        
        // Close shop dialog
        const closeShopBtn = document.getElementById('close-shop');
        if (closeShopBtn) {
            closeShopBtn.addEventListener('click', () => this.closeShopDialog());
        }
        
        // Shop dialog actions
        const copyShopListBtn = document.getElementById('copy-shop-list');
        const openInstacartBtn = document.getElementById('open-instacart');
        const openAmazonBtn = document.getElementById('open-amazon');
        const emailShopListBtn = document.getElementById('email-shop-list');
        
        if (copyShopListBtn) copyShopListBtn.addEventListener('click', () => this.copyShopList());
        if (openInstacartBtn) openInstacartBtn.addEventListener('click', () => this.openInstacart());
        if (openAmazonBtn) openAmazonBtn.addEventListener('click', () => this.openAmazonFresh());
        if (emailShopListBtn) emailShopListBtn.addEventListener('click', () => this.emailShopList());
        
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
        
        // Copy text button
        const copyText = document.getElementById('copy-text');
        if (copyText) {
            copyText.addEventListener('click', () => this.copyShareText());
        }
        
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const clearSearch = document.getElementById('clear-search');
        const categoryFilter = document.getElementById('category-filter');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                if (clearSearch) clearSearch.style.display = this.searchQuery ? 'block' : 'none';
                this.displaySavedRecipes();
            });
        }
        
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                this.searchQuery = '';
                clearSearch.style.display = 'none';
                this.displaySavedRecipes();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.displaySavedRecipes();
            });
        }
        
        console.log('Event listeners attached');
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
        
        document.getElementById('prep-time').textContent = this.formatTime(recipeData.prep_time);
        document.getElementById('cook-time').textContent = this.formatTime(recipeData.cook_time);
        document.getElementById('total-time').textContent = this.formatTime(recipeData.total_time);
        
        const img = document.getElementById('recipe-image');
        if (recipeData.image) {
            img.src = recipeData.image;
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
        
        const ingList = document.getElementById('ingredients-list');
        ingList.innerHTML = '';
        if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
            recipeData.ingredients.forEach(ing => {
                const li = document.createElement('li');
                li.textContent = ing;
                ingList.appendChild(li);
            });
        }
        
        const instList = document.getElementById('instructions-list');
        instList.innerHTML = '';
        if (recipeData.instructions && Array.isArray(recipeData.instructions)) {
            recipeData.instructions.forEach(inst => {
                const li = document.createElement('li');
                li.textContent = inst;
                instList.appendChild(li);
            });
        }
    }

    showSaveDialog() {
        if (!this.currentRecipe) return;
        document.getElementById('save-dialog').style.display = 'block';
    }

    hideSaveDialog() {
        document.getElementById('save-dialog').style.display = 'none';
    }

    saveRecipe() {
        console.log('Save button clicked');
        if (!this.currentRecipe) {
            console.log('No current recipe to save');
            return;
        }
        
        const categorySelect = document.getElementById('recipe-category');
        const category = categorySelect ? categorySelect.value : 'Dinner';
        
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
                const ingredientMatch = r.ingredients && Array.isArray(r.ingredients) && 
                    r.ingredients.some(ing => ing.toLowerCase().includes(this.searchQuery));
                return titleMatch || ingredientMatch;
            });
        }
        
        if (recipesToShow.length === 0) {
            let message = 'No saved recipes yet.';
            if (this.searchQuery) message = `No recipes found for "${this.searchQuery}"`;
            else if (this.currentFilter !== 'all') message = `No recipes in category "${this.currentFilter}"`;
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
                ? `<span class="category-badge">${recipe.category}</span>` 
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
                    <button onclick="app.addRecipeToShoppingList(${recipe.id})" class="add-to-list-btn">🛒 Add to List</button>
                    <button onclick="app.shareRecipeById(${recipe.id})" class="share-saved-btn">Share</button>
                    <button onclick="app.deleteRecipe(${recipe.id})" class="delete-recipe-btn">Delete</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    loadSavedRecipe(id) {
        const recipe = this.savedRecipes.find(r => r.id === id);
        if (recipe) {
            this.currentRecipe = recipe;
            this.displayRecipe(recipe);
            window.scrollTo(0, 0);
        }
    }

    shareRecipeById(id) {
        const recipe = this.savedRecipes.find(r => r.id === id);
        if (recipe) {
            this.currentRecipe = recipe;
            this.shareRecipe();
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
        this.totalSteps = this.currentRecipe.instructions.length;
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
        
        this.switchShareTab('text');
    }

    generateCooklyUrl() {
        const jsonString = JSON.stringify(this.currentRecipe);
        const base64 = btoa(unescape(encodeURIComponent(jsonString)));
        const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?import=${urlSafe}`;
    }

    switchShareTab(tab) {
        document.querySelectorAll('.share-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        document.getElementById('share-text').style.display = tab === 'text' ? 'block' : 'none';
        document.getElementById('share-email').style.display = tab === 'email' ? 'block' : 'none';
        document.getElementById('share-cookly').style.display = tab === 'cookly' ? 'block' : 'none';
        
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

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    formatShareText() {
        const r = this.currentRecipe;
        let text = `🍳 ${r.title || 'Recipe'}\n\n`;
        if (r.author) text += `By ${r.author}\n\n`;
        if (r.category) text += `Category: ${r.category}\n\n`;
        
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

    // ==================== SHOPPING LIST METHODS ====================

    loadShoppingList() {
        try {
            const stored = localStorage.getItem('shoppingList');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    saveShoppingList() {
        localStorage.setItem('shoppingList', JSON.stringify(this.shoppingList));
        this.displayShoppingList();
    }

    toggleShoppingList() {
        this.shoppingListVisible = !this.shoppingListVisible;
        const content = document.getElementById('shopping-list-content');
        const toggleBtn = document.getElementById('toggle-shopping-list');
        
        if (content) {
            content.style.display = this.shoppingListVisible ? 'block' : 'none';
        }
        if (toggleBtn) {
            toggleBtn.textContent = this.shoppingListVisible ? 'Hide' : 'Show';
        }
        
        if (this.shoppingListVisible) {
            this.displayShoppingList();
        }
    }

    displayShoppingList() {
        const container = document.getElementById('shopping-list-items');
        const emptyState = document.getElementById('shopping-list-empty');
        
        if (!container) return;
        
        if (this.shoppingList.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        container.innerHTML = '';
        this.shoppingList.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `shopping-list-item ${item.purchased ? 'purchased' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="item-checkbox" 
                    ${item.purchased ? 'checked' : ''} 
                    onchange="app.toggleItemPurchased(${index})">
                <span class="item-text">${this.escapeHtml(item.text)}</span>
                ${item.recipe ? `<span class="item-recipe-tag">${this.escapeHtml(item.recipe)}</span>` : ''}
                <button class="remove-item-btn" onclick="app.removeShoppingItem(${index})" title="Remove">×</button>
            `;
            container.appendChild(li);
        });
    }

    addCurrentRecipeToShoppingList() {
        if (!this.currentRecipe || !this.currentRecipe.ingredients) {
            this.showStatus('No ingredients to add', 'error');
            return;
        }
        
        const recipeName = this.currentRecipe.title || 'Recipe';
        let addedCount = 0;
        
        this.currentRecipe.ingredients.forEach(ingredient => {
            // Check for duplicates (case-insensitive)
            const isDuplicate = this.shoppingList.some(item => 
                item.text.toLowerCase() === ingredient.toLowerCase()
            );
            
            if (!isDuplicate) {
                this.shoppingList.push({
                    text: ingredient,
                    purchased: false,
                    recipe: recipeName,
                    addedAt: new Date().toISOString()
                });
                addedCount++;
            }
        });
        
        this.saveShoppingList();
        
        if (addedCount > 0) {
            this.showStatus(`Added ${addedCount} items to shopping list!`, 'success');
            // Auto-show shopping list
            if (!this.shoppingListVisible) {
                this.toggleShoppingList();
            }
        } else {
            this.showStatus('All ingredients already in list', 'info');
        }
    }

    addRecipeToShoppingList(recipeId) {
        const recipe = this.savedRecipes.find(r => r.id === recipeId);
        if (!recipe || !recipe.ingredients) {
            this.showStatus('Recipe not found', 'error');
            return;
        }
        
        const recipeName = recipe.title || 'Recipe';
        let addedCount = 0;
        
        recipe.ingredients.forEach(ingredient => {
            // Check for duplicates
            const isDuplicate = this.shoppingList.some(item => 
                item.text.toLowerCase() === ingredient.toLowerCase()
            );
            
            if (!isDuplicate) {
                this.shoppingList.push({
                    text: ingredient,
                    purchased: false,
                    recipe: recipeName,
                    addedAt: new Date().toISOString()
                });
                addedCount++;
            }
        });
        
        this.saveShoppingList();
        
        if (addedCount > 0) {
            this.showStatus(`Added ${addedCount} items from "${recipeName}"`, 'success');
            // Auto-show shopping list
            if (!this.shoppingListVisible) {
                this.toggleShoppingList();
            }
        } else {
            this.showStatus('All ingredients already in list', 'info');
        }
    }

    addManualShoppingItem() {
        const input = document.getElementById('new-shopping-item');
        const text = input.value.trim();
        
        if (!text) return;
        
        // Check for duplicates
        const isDuplicate = this.shoppingList.some(item => 
            item.text.toLowerCase() === text.toLowerCase()
        );
        
        if (isDuplicate) {
            this.showStatus('Item already in list', 'info');
            input.value = '';
            return;
        }
        
        this.shoppingList.push({
            text: text,
            purchased: false,
            recipe: null,
            addedAt: new Date().toISOString()
        });
        
        this.saveShoppingList();
        input.value = '';
        this.showStatus('Item added!', 'success');
    }

    toggleItemPurchased(index) {
        if (this.shoppingList[index]) {
            this.shoppingList[index].purchased = !this.shoppingList[index].purchased;
            this.saveShoppingList();
        }
    }

    removeShoppingItem(index) {
        this.shoppingList.splice(index, 1);
        this.saveShoppingList();
        this.showStatus('Item removed', 'success');
    }

    clearPurchasedItems() {
        const beforeCount = this.shoppingList.length;
        this.shoppingList = this.shoppingList.filter(item => !item.purchased);
        const removedCount = beforeCount - this.shoppingList.length;
        
        this.saveShoppingList();
        
        if (removedCount > 0) {
            this.showStatus(`Cleared ${removedCount} purchased items`, 'success');
        } else {
            this.showStatus('No purchased items to clear', 'info');
        }
    }

    clearAllShoppingItems() {
        if (this.shoppingList.length === 0) {
            this.showStatus('Shopping list is already empty', 'info');
            return;
        }
        
        if (confirm('Clear all items from your shopping list?')) {
            this.shoppingList = [];
            this.saveShoppingList();
            this.showStatus('Shopping list cleared', 'success');
        }
    }

    // ==================== SHOP INGREDIENTS METHODS ====================

    openShopDialog() {
        if (this.shoppingList.length === 0) {
            this.showStatus('Shopping list is empty', 'info');
            return;
        }
        
        const dialog = document.getElementById('shop-dialog');
        if (dialog) {
            dialog.style.display = 'flex';
            this.updateShopListPreview();
        }
    }

    closeShopDialog() {
        const dialog = document.getElementById('shop-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    updateShopListPreview() {
        const preview = document.getElementById('shop-list-preview');
        const textarea = document.getElementById('shop-list-text');
        
        if (!preview || !textarea) return;
        
        const listText = this.formatShopListText();
        textarea.value = listText;
        preview.style.display = 'block';
    }

    formatShopListText() {
        const unpurchased = this.shoppingList.filter(item => !item.purchased);
        
        if (unpurchased.length === 0) {
            return '🛒 Shopping List\n\nAll items have been purchased!';
        }
        
        let text = '🛒 Shopping List\n\n';
        
        // Group by recipe
        const grouped = {};
        const manual = [];
        
        unpurchased.forEach(item => {
            if (item.recipe) {
                if (!grouped[item.recipe]) grouped[item.recipe] = [];
                grouped[item.recipe].push(item.text);
            } else {
                manual.push(item.text);
            }
        });
        
        // Add grouped items
        Object.keys(grouped).forEach(recipe => {
            text += `📖 ${recipe}\n`;
            grouped[recipe].forEach(ing => {
                text += `  ☐ ${ing}\n`;
            });
            text += '\n';
        });
        
        // Add manual items
        if (manual.length > 0) {
            text += '📝 Other Items\n';
            manual.forEach(item => {
                text += `  ☐ ${item}\n`;
            });
        }
        
        return text;
    }

    async copyShopList() {
        const text = this.formatShopListText();
        try {
            await navigator.clipboard.writeText(text);
            this.showStatus('Shopping list copied!', 'success');
        } catch (err) {
            this.showStatus('Failed to copy', 'error');
        }
    }

    openInstacart() {
        // Get first few unpurchased items for search
        const unpurchased = this.shoppingList.filter(item => !item.purchased);
        if (unpurchased.length === 0) {
            this.showStatus('No items to shop for', 'info');
            return;
        }
        
        // Open Instacart in new tab
        const instacartUrl = 'https://www.instacart.com/store';
        window.open(instacartUrl, '_blank');
        this.showStatus('Instacart opened! Paste your copied list.', 'success');
    }

    openAmazonFresh() {
        const amazonUrl = 'https://www.amazon.com/alm/storefront?almBrandId=QW1hem9uIEZyZXNo';
        window.open(amazonUrl, '_blank');
        this.showStatus('Amazon Fresh opened! Paste your copied list.', 'success');
    }

    emailShopList() {
        const text = this.formatShopListText();
        const subject = encodeURIComponent('Cookly Shopping List');
        const body = encodeURIComponent(text);
        
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        this.showStatus('Email client opened!', 'success');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            let encoded = importData.replace(/-/g, '+').replace(/_/g, '/');
            const padding = 4 - encoded.length % 4;
            if (padding !== 4) encoded += '='.repeat(padding);
            
            const recipeData = JSON.parse(decodeURIComponent(escape(atob(encoded))));
            window.app.currentRecipe = recipeData;
            window.app.displayRecipe(recipeData);
            window.app.showStatus('Recipe imported! Click Save to keep it.', 'success');
            
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
            console.error('Failed to import:', err);
        }
    }
});
