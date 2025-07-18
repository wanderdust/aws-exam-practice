#!/usr/bin/env python3
"""
Script to shuffle options in multiple-choice questions and update correct indices accordingly.
This script will process all *-questions.json files in the data directory by default,
or a single specified file if provided as a command-line argument.

Usage:
    python3 shuffle_options.py                  # Process all question files
    python3 shuffle_options.py path/to/file.json # Process only the specified file
"""

import json
import random
import glob
import os
import sys
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional

def shuffle_options_in_file(file_path: str) -> None:
    """
    Process a single question file, shuffle options for multiple-choice questions,
    and update the correct indices.
    
    Args:
        file_path: Path to the question JSON file
    """
    print(f"Processing file: {file_path}")
    
    try:
        with open(file_path, 'r') as f:
            questions = json.load(f)
    except json.JSONDecodeError:
        print(f"Error: {file_path} is not a valid JSON file.")
        return
    except FileNotFoundError:
        print(f"Error: File {file_path} not found.")
        return
    
    # Track stats for reporting
    total_questions = len(questions)
    mc_questions = 0
    shuffled = 0
    
    for question in questions:
        # Only process multiple-choice questions
        if question.get("type") == "multiple-choice" and "options" in question and "correctIndex" in question:
            mc_questions += 1
            
            # Get the current correct answer and all options
            correct_index = question["correctIndex"]
            options = question["options"]
            correct_answer = options[correct_index]
            
            # Create paired list of (option, is_correct)
            option_pairs = [(option, i == correct_index) for i, option in enumerate(options)]
            
            # Shuffle the pairs
            random.shuffle(option_pairs)
            
            # Update the question with shuffled options and new correct index
            question["options"] = [pair[0] for pair in option_pairs]
            question["correctIndex"] = next(i for i, pair in enumerate(option_pairs) if pair[1])
            
            shuffled += 1
    
    # Write the updated questions back to the file
    with open(file_path, 'w') as f:
        json.dump(questions, f, indent=4)
    
    print(f"✅ File processed: {file_path}")
    print(f"   Total questions: {total_questions}")
    print(f"   Multiple-choice questions: {mc_questions}")
    print(f"   Questions shuffled: {shuffled}")
    print()

def main() -> None:
    """Main function to find and process question files."""
    parser = argparse.ArgumentParser(description='Shuffle options in multiple-choice questions.')
    parser.add_argument('file', nargs='?', help='Specific question file to process (optional)')
    args = parser.parse_args()
    
    # If a specific file is provided, process only that file
    if args.file:
        file_path = args.file
        if not os.path.exists(file_path):
            print(f"Error: File {file_path} not found.")
            sys.exit(1)
        
        print(f"Processing single file: {file_path}")
        shuffle_options_in_file(file_path)
        print("File processed successfully!")
        return
    
    # Otherwise process all question files in the data directory
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    question_files = glob.glob(os.path.join(data_dir, "*-questions.json"))
    
    if not question_files:
        print("No question files found in the data directory.")
        sys.exit(1)
    
    print(f"Found {len(question_files)} question file(s):")
    for file_path in question_files:
        print(f"- {os.path.basename(file_path)}")
    print()
    
    # Process each file
    for file_path in question_files:
        shuffle_options_in_file(file_path)
    
    print("All files processed successfully!")

if __name__ == "__main__":
    # Set a random seed for consistent results if needed
    random.seed()
    main()
