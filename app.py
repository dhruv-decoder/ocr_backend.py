from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
from PIL import Image
import re
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize EasyOCR Reader
reader = easyocr.Reader(['en'])

# Temporary storage (replace with Supabase later)
UPLOAD_FOLDER = 'temp_uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def extract_info(text):
    name_pattern = r'^[A-Z][a-z]+ [A-Z][a-z]+'
    college_pattern = r'(?i)\b(?:university|college|institute)\b'
    year_pattern = r'\b(20\d{2})\b'

    extracted_data = {"name": None, "college": None, "year": None}

    for line in text:
        if extracted_data["name"] is None:
            name_match = re.search(name_pattern, line)
            if name_match:
                extracted_data["name"] = name_match.group()
        
        if extracted_data["college"] is None:
            if re.search(college_pattern, line, re.IGNORECASE):
                extracted_data["college"] = line
        
        if extracted_data["year"] is None:
            year_match = re.search(year_pattern, line)
            if year_match:
                extracted_data["year"] = year_match.group()

    return extracted_data

@app.route("/")
def home():
    return "Flask app is running on Railway!"

@app.route("/process-ocr", methods=["POST"])
def process_ocr():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            img = Image.open(filepath)
            
            # Run OCR on the image
            results = reader.readtext(img)
            text = [result[1] for result in results]  # Extract just the text from results
            
            extracted_data = extract_info(text)
            
            # TODO: Store extracted_data in Supabase
            
            # Remove the temporary file
            os.remove(filepath)
            
            return jsonify({"extracted_data": extracted_data, "is_verified": True})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
