"""
Initialize NLTK data for TextBlob sentiment analysis
Run this once after installing requirements.txt
"""

import nltk
import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download required NLTK data
print("Downloading NLTK data...")
nltk.download('brown')
nltk.download('punkt')
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')
nltk.download('movie_reviews')
nltk.download('punkt_tab')

print("✅ NLTK data downloaded successfully!")
print("✅ Sentiment analysis service is ready to use")

