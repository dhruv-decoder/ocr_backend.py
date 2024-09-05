from flask import Flask, request, jsonify
import easyocr
import requests
from PIL import Image
from io import BytesIO

app = Flask(__name__)

# Initialize EasyOCR Reader
reader = easyocr.Reader(['en'])

@app.route("/")
def home():
    return "Flask app is running on Railway!"

@app.route("/process-ocr", methods=["POST"])
def process_ocr():
    data = request.json
    image_url = data.get('image_url')

    if not image_url:
        return jsonify({"error": "Image URL is missing"}), 400

    try:
        response = requests.get(image_url)
        img = Image.open(BytesIO(response.content))

        # Run OCR on the image
        results = reader.readtext(img)

        extracted_data = {"name": None, "college": None, "year": None}
        for bbox, text, prob in results:
            if "college" in text.lower():
                extracted_data["college"] = text
            if "2022" in text or "2023" in text:
                extracted_data["year"] = text
            if extracted_data["name"] is None:
                extracted_data["name"] = text

        return jsonify({"extracted_data": extracted_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

