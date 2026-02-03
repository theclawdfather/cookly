# Netlify Function for Recipe Extraction
# Cookly - Serverless Recipe Capture
# Created by @theclawdfather

import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def handler(event, context):
    """
    Netlify Function handler for recipe extraction
    """
    try:
        # Parse the request body
        if not event.get('body'):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No request body provided'}),
                'headers': {'Content-Type': 'application/json'}
            }
            
        body = json.loads(event['body'])
        url = body.get('url', '')
        
        if not url:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No URL provided'}),
                'headers': {'Content-Type': 'application/json'}
            }
        
        # Extract recipe data
        recipe_data = extract_recipe(url)
        
        return {
            'statusCode': 200,
            'body': json.dumps(recipe_data),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        }
        
    except json.JSONDecodeError as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON in request body'}),
            'headers': {'Content-Type': 'application/json'}
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {'Content-Type': 'application/json'}
        }

def extract_recipe(url):
    """Extract recipe data from URL (serverless version)"""
    try:
        headers = {
            'User-Agent': 'Cookly Recipe Extractor 1.0'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract recipe data (simplified version)
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
            'source_url': url,
            'source_domain': urlparse(url).netloc,
            'extracted_with': 'serverless'
        }
        
        # Extract title
        title_tag = soup.find('h1') or soup.find('title')
        if title_tag:
            recipe_data['title'] = title_tag.get_text().strip()
        
        # Extract main image
        image_tag = soup.find('meta', property='og:image') or soup.find('meta', attrs={'name': 'twitter:image'})
        if image_tag:
            recipe_data['image'] = image_tag.get('content', '')
        
        # Extract ingredients
        ingredient_selectors = [
            '.ingredients', '.recipe-ingredients', '[class*="ingredient"]',
            'ul.ingredients', 'ol.ingredients', '.ingredient-list'
        ]
        
        for selector in ingredient_selectors:
            ingredients_list = soup.select(selector)
            if ingredients_list:
                for item in ingredients_list[0].find_all('li'):
                    ingredient_text = item.get_text().strip()
                    if ingredient_text:
                        recipe_data['ingredients'].append(ingredient_text)
                break
        
        # Extract instructions
        instruction_selectors = [
            '.instructions', '.recipe-instructions', '.directions',
            '[class*="instruction"]', '[class*="step"]'
        ]
        
        for selector in instruction_selectors:
            instructions_section = soup.select(selector)
            if instructions_section:
                for step in instructions_section[0].find_all(['li', 'p']):
                    step_text = step.get_text().strip()
                    if step_text and len(step_text) > 10:
                        recipe_data['instructions'].append(step_text)
                break
        
        return recipe_data
        
    except Exception as e:
        return {'error': str(e), 'source_url': url}

# For local testing
if __name__ == "__main__":
    # Test the function locally
    test_event = {
        'body': json.dumps({'url': 'https://www.allrecipes.com/recipe/223042/chicken-parmesan/'})
    }
    result = handler(test_event, {})
    print(json.dumps(result, indent=2))