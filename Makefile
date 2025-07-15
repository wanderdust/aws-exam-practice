# AWS Architect Associate Exam Practice Webapp
# Makefile for development tasks

.PHONY: start clean validate add-question lint help

# Default port for the webserver
PORT ?= 8000

# Default directory for data files
DATA_DIR = data

help:
	@echo "AWS Exam Practice - Development Commands"
	@echo "-----------------------------------"
	@echo "make start       - Start the development webserver (default port 8000)"
	@echo "make start PORT=3000 - Start server on a custom port"
	@echo "make validate    - Validate all JSON question files"
	@echo "make clean       - Remove temporary files and caches"
	@echo "make lint        - Check JavaScript code quality"
	@echo "make add-question - Create a new JSON question file template"
	@echo "make help        - Show this help message"

# Start the development webserver
start:
	@echo "Starting development server on port $(PORT)..."
	@python3 -m http.server $(PORT)

# Validate all JSON files in the data directory
validate:
	@echo "Validating JSON files in $(DATA_DIR)..."
	@find $(DATA_DIR) -name "*.json" -type f -exec python3 -c \
		"import json, sys; json.load(open('{}', 'r'))" \; \
		&& echo "All JSON files are valid." \
		|| (echo "Error: Invalid JSON found." && exit 1)

# Create a template for a new question file
add-question:
	@read -p "Enter topic name for the new question file: " topic; \
	filename="$(DATA_DIR)/$${topic}-questions.json"; \
	if [ -f $$filename ]; then \
		echo "File $$filename already exists."; \
		exit 1; \
	else \
		echo '[{"id":"'$$topic'-001","type":"multiple-choice","question":"Your question here","options":["Option A","Option B","Option C","Option D"],"correctIndex":0,"explanation":"Explanation here","tags":["'$$topic'"]}]' > $$filename; \
		echo "Created template file $$filename"; \
	fi

# Check JavaScript code quality (requires eslint)
lint:
	@command -v npx eslint >/dev/null 2>&1 || { echo "eslint not found. Install with: npm install -g eslint"; exit 1; }
	@echo "Checking JavaScript code quality..."
	@npx eslint main.js || echo "Consider installing eslint with 'npm install -g eslint' for code quality checks"

# Clean up temporary files and caches
clean:
	@echo "Cleaning temporary files and caches..."
	@find . -name "*.DS_Store" -type f -delete
	@find . -name "*.log" -type f -delete
	@echo "Cleanup complete."

# Default target when running just 'make'
.DEFAULT_GOAL := help
