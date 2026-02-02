#!/usr/bin/env python3
"""
Cookly - Recipe Capture Application
International AI of Mystery 🕶️
Created by @the_clawfather
"""

from flask import Flask, render_template, request, jsonify
import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urlparse
import logging

app = Flask(__name__)
app.config['SECRET_KEY'] = 'clawstin-powers-recipe-secret'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecipeExtractor:
    """Intelligent recipe extraction for Cookly - Making cooking effortless"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def extract_recipe(self, url):
        """Extract recipe data from URL"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try multiple extraction strategies
            recipe_data = self._extract_schema_org(soup)
            if not recipe_data:
                recipe_data = self._extract_heuristic(soup)
            
            # Add source URL
            recipe_data['source_url'] = url
            recipe_data['source_domain'] = urlparse(url).netloc
            
            return recipe_data
            
        except Exception as e:
            logger.error(f"Error extracting recipe from {url}: {str(e)}")
            return {'error': str(e), 'source_url': url}
    
    def _extract_schema_org(self, soup):
        """Extract recipe data from Schema.org structured data"""
        recipe_data = {
            'title': '',
            'description': '',
            'ingredients': [],
            'instructions': [],
            'prep_time': '',
            'cook_time': '',
            'total_time': '',
            'servings': '',
            'image': '',
            'author': '',
            'extracted_with': 'schema_org'
        }
        
        # Look for Schema.org Recipe structured data
        recipe_scripts = soup.find_all('script', type='application/ld+json')
        
        for script in recipe_scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'Recipe':
                    recipe_data['title'] = data.get('name', '')
                    recipe_data['description'] = data.get('description', '')
                    recipe_data['prep_time'] = data.get('prepTime', '')
                    recipe_data['cook_time'] = data.get('cookTime', '')
                    recipe_data['total_time'] = data.get('totalTime', '')
                    recipe_data['servings'] = data.get('recipeYield', '')
                    recipe_data['image'] = data.get('image', '')
                    recipe_data['author'] = data.get('author', {}).get('name', '') if isinstance(data.get('author'), dict) else ''
                    
                    # Handle ingredients
                    if 'recipeIngredient' in data:
                        recipe_data['ingredients'] = data['recipeIngredient']
                    
                    # Handle instructions
                    if 'recipeInstructions' in data:
                        instructions = data['recipeInstructions']
                        if isinstance(instructions, list):
                            recipe_data['instructions'] = [inst.get('text', '') if isinstance(inst, dict) else str(inst) for inst in instructions]
                        else:
                            recipe_data['instructions'] = [str(instructions)]
                    
                    return recipe_data
                    
            except json.JSONDecodeError:
                continue
        
        return None
    
    def _extract_heuristic(self, soup):
        """Fallback heuristic extraction for non-Schema.org sites"""
        recipe_data = {
            'title': '',
            'description': '',
            'ingredients': [],
            'instructions': [],
            'prep_time': '',
            'cook_time': '',
            'total_time': '',
            'servings': '',
            'image': '',
            'author': '',
            'extracted_with': 'heuristic'
        }
        
        # Extract title
        title_tag = soup.find('h1') or soup.find('title')
        if title_tag:
            recipe_data['title'] = title_tag.get_text().strip()
        
        # Extract main image
        image_tag = soup.find('meta', property='og:image') or soup.find('meta', attrs={'name': 'twitter:image'})
        if image_tag:
            recipe_data['image'] = image_tag.get('content', '')
        
        # Look for ingredients in common patterns
        ingredient_selectors = [
            '.ingredients', '.recipe-ingredients', '[class*="ingredient"]',
            'ul.ingredients', 'ol.ingredients', '.ingredient-list'
        ]
        
        for selector in ingredient_selectors:
            ingredients_list = soup.select(selector)
            if ingredients_list:
                ingredients = []
                for item in ingredients_list[0].find_all('li'):
                    ingredient_text = item.get_text().strip()
                    if ingredient_text:
                        ingredients.append(ingredient_text)
                if ingredients:
                    recipe_data['ingredients'] = ingredients
                    break
        
        # Look for instructions
        instruction_selectors = [
            '.instructions', '.recipe-instructions', '.directions',
            '[class*="instruction"]', '[class*="step"]'
        ]
        
        for selector in instruction_selectors:
            instructions_section = soup.select(selector)
            if instructions_section:
                instructions = []
                for step in instructions_section[0].find_all(['li', 'p']):
                    step_text = step.get_text().strip()
                    if step_text and len(step_text) > 10:  # Filter out short text
                        instructions.append(step_text)
                if instructions:
                    recipe_data['instructions'] = instructions
                    break
        
        return recipe_data

# Initialize recipe extractor
recipe_extractor = RecipeExtractor()

@app.route('/')
def index():
    """Main page with PWA manifest and app shell"""
    return render_template('index.html', app_name="Cookly")

@app.route('/api/extract-recipe', methods=['POST'])
def extract_recipe():
    """API endpoint for recipe extraction"""
    try:
        data = request.get_json()
        url = data.get('url', '')
        
        if not url:
            return jsonify({'error': 'No URL provided'}), 400
        
        logger.info(f"Extracting recipe from: {url}")
        recipe_data = recipe_extractor.extract_recipe(url)
        
        return jsonify(recipe_data)
        
    except Exception as e:
        logger.error(f"Error in extract_recipe endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'recipe-extractor'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)