/**
 * Cookly Firebase Integration
 * Real-time recipe syncing between users
 */

class CooklyFirebase {
    constructor() {
        this.db = null;
        this.householdId = this.getHouseholdId();
        this.unsubscribe = null;
    }

    getHouseholdId() {
        // Get or create household ID
        let id = localStorage.getItem('cooklyHouseholdId');
        if (!id) {
            // Default household - you can change this to sync with your wife
            id = 'default-household';
            localStorage.setItem('cooklyHouseholdId', id);
        }
        return id;
    }

    setHouseholdId(id) {
        this.householdId = id;
        localStorage.setItem('cooklyHouseholdId', id);
        // Reload to sync with new household
        location.reload();
    }

    async init() {
        // Firebase config from your project
        const firebaseConfig = {
            apiKey: "AIzaSyBrHikdnB62dV5qQvOWabPnfdA4ipPUr-A",
            authDomain: "cookly-shared.firebaseapp.com",
            projectId: "cookly-shared",
            storageBucket: "cookly-shared.firebasestorage.app",
            messagingSenderId: "253302721623",
            appId: "1:253302721623:web:3252fe1e5f66a2a4b5a712"
        };

        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        this.db = firebase.firestore(app);
        
        console.log('Firebase initialized for household:', this.householdId);
        return true;
    }

    // Save recipe to shared collection
    async saveRecipe(recipe) {
        if (!this.db) return;
        
        try {
            const recipeData = {
                ...recipe,
                householdId: this.householdId,
                synced_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('recipes').doc(String(recipe.id)).set(recipeData);
            console.log('Recipe synced to Firebase');
        } catch (error) {
            console.error('Error saving recipe:', error);
        }
    }

    // Delete recipe from shared collection
    async deleteRecipe(recipeId) {
        if (!this.db) return;
        
        try {
            await this.db.collection('recipes').doc(String(recipeId)).delete();
            console.log('Recipe deleted from Firebase');
        } catch (error) {
            console.error('Error deleting recipe:', error);
        }
    }

    // Listen for real-time updates
    onRecipesChanged(callback) {
        if (!this.db) return;
        
        this.unsubscribe = this.db.collection('recipes')
            .where('householdId', '==', this.householdId)
            .orderBy('synced_at', 'desc')
            .onSnapshot((snapshot) => {
                const recipes = [];
                snapshot.forEach((doc) => {
                    recipes.push(doc.data());
                });
                callback(recipes);
            }, (error) => {
                console.error('Error listening to recipes:', error);
            });
    }

    // Stop listening
    stopListening() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Create global instance
window.cooklyFirebase = new CooklyFirebase();
