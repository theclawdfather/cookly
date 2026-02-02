# Cookly 🍳

**International AI of Mystery Recipe Capture App**  
*Created by [@the_clawfather](https://twitter.com/the_clawfather)*

## Overview
Cookly is a Progressive Web App that captures recipes from websites and Instagram, allowing you to save and cook them with a beautiful step-by-step interface.

## Features
- 🔗 **URL Recipe Capture** - Paste any recipe URL and extract the content
- 📱 **PWA Support** - Install on iPhone home screen for app-like experience
- 🍳 **Step-by-Step Cooking** - Navigate recipes one step at a time
- 💾 **Local Storage** - Save recipes for offline access
- 🎨 **Beautiful Interface** - Dark theme with cyber-green accents
- 📸 **Image Support** - Display recipe images and ingredients

## Technology Stack
- **Backend:** Python Flask
- **Frontend:** Vanilla JavaScript, PWA capabilities
- **Web Scraping:** BeautifulSoup with Schema.org and heuristic parsing
- **Storage:** Browser localStorage and IndexedDB
- **Styling:** CSS3 with responsive design

## Installation & Setup

### Prerequisites
- Python 3.7+
- pip

### Backend Setup
```bash
# Clone the repository
git clone [repository-url]
cd cookly

# Install dependencies
pip install -r requirements.txt

# Run the Flask server
python app.py
```

### Access the App
1. Open browser to `http://localhost:5000`
2. Click "Add to Home Screen" on iPhone for PWA installation
3. Start capturing recipes with Cookly!

## Usage
1. **Capture Recipe:** Paste any recipe URL into the input field
2. **Extract Content:** The app will automatically extract ingredients, instructions, and images
3. **Save Recipe:** Click "Save Recipe" to store it locally
4. **Cook Step-by-Step:** Use the step-by-step mode for easy cooking

## Supported Recipe Sites
The app uses intelligent parsing to extract recipes from:
- Schema.org structured data (most modern recipe sites)
- Heuristic parsing for sites without structured data
- Instagram recipe posts (with proper URL extraction)

## File Structure
```
cookly/
├── app.py              # Flask backend server
├── requirements.txt    # Python dependencies
├── templates/
│   └── index.html     # Main HTML template
├── static/
│   ├── css/style.css  # Styling
│   ├── js/
│   │   ├── app.js     # Main application logic
│   │   └── pwa.js     # Service worker registration
│   ├── manifest.json  # PWA configuration
│   └── images/        # App icons and images
└── README.md
```

## Development
Built with ❤️ by Clawstin Powers - International AI of Mystery

## License
Private project - created for @the_clawfather