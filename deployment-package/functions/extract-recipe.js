// Netlify Function for Recipe Extraction
// Cookly - Serverless Recipe Capture
// Created by @theclawdfather

const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        // Parse the request body
        if (!event.body) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No request body provided' })
            };
        }

        const body = JSON.parse(event.body);
        const url = body.url;

        if (!url) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No URL provided' })
            };
        }

        // Extract recipe data
        const recipeData = await extractRecipe(url);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify(recipeData)
        };

    } catch (error) {
        console.error('Error in extract-recipe function:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message || 'Internal server error' })
        };
    }
};

async function extractRecipe(url) {
    try {
        const headers = {
            'User-Agent': 'Cookly Recipe Extractor 1.0'
        };

        const response = await axios.get(url, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);

        const recipeData = {
            title: '',
            description: '',
            ingredients: [],
            instructions: [],
            prep_time: '',
            cook_time: '',
            total_time: '',
            servings: '',
            image: '',
            author: '',
            source_url: url,
            source_domain: new URL(url).hostname,
            extracted_with: 'nodejs'
        };

        // Extract title
        const titleTag = $('h1').first() || $('title');
        if (titleTag.length) {
            recipeData.title = titleTag.text().trim();
        }

        // Extract main image
        const imageTag = $('meta[property="og:image"]').first() || $('meta[name="twitter:image"]').first();
        if (imageTag.length) {
            recipeData.image = imageTag.attr('content') || '';
        }

        // Extract ingredients
        const ingredientSelectors = [
            '.ingredients', '.recipe-ingredients', '[class*="ingredient"]',
            'ul.ingredients', 'ol.ingredients', '.ingredient-list'
        ];

        for (const selector of ingredientSelectors) {
            const ingredientsList = $(selector);
            if (ingredientsList.length) {
                ingredientsList.find('li').each((i, elem) => {
                    const ingredientText = $(elem).text().trim();
                    if (ingredientText) {
                        recipeData.ingredients.push(ingredientText);
                    }
                });
                break;
            }
        }

        // Extract instructions
        const instructionSelectors = [
            '.instructions', '.recipe-instructions', '.directions',
            '[class*="instruction"]', '[class*="step"]'
        ];

        for (const selector of instructionSelectors) {
            const instructionsSection = $(selector);
            if (instructionsSection.length) {
                instructionsSection.find('li, p').each((i, elem) => {
                    const stepText = $(elem).text().trim();
                    if (stepText && stepText.length > 10) {
                        recipeData.instructions.push(stepText);
                    }
                });
                break;
            }
        }

        return recipeData;

    } catch (error) {
        console.error('Error extracting recipe:', error);
        return { error: error.message, source_url: url };
    }
}