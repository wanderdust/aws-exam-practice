document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        allQuestions: [],
        filteredQuestions: [],
        currentQuestionIndex: -1,
        selectedTags: new Set(),
        availableTags: new Set(),
        answeredQuestions: new Set(), // Track questions that have been answered
        questionCounter: 0 // Track the sequential counter for questions
    };

    // DOM elements
    const elements = {
        tagsContainer: document.getElementById('tags-container'),
        clearFiltersBtn: document.getElementById('clear-filters'),
        nextQuestionBtn: document.getElementById('next-question'),
        questionCounter: document.getElementById('question-counter'),
        questionText: document.getElementById('question-text'),
        multipleChoiceContainer: document.getElementById('multiple-choice-container'),
        optionsContainer: document.getElementById('options-container'),
        submitAnswerBtn: document.getElementById('submit-answer'),
        feedback: document.getElementById('feedback'),
        openEndedContainer: document.getElementById('open-ended-container'),
        revealAnswerBtn: document.getElementById('reveal-answer'),
        answerText: document.getElementById('answer-text')
    };

    // Initialize the app
    async function init() {
        await loadAllQuestions();
        setupEventListeners();
        renderTags();
        showNextQuestion();
    }

    // Load all question files from data directory
    async function loadAllQuestions() {
        try {
            // Instead of trying to fetch the directory listing, we now use a manifest file
            const manifestResponse = await fetch('data/manifest.json');
            if (!manifestResponse.ok) throw new Error('Failed to access data manifest');
            
            const manifest = await manifestResponse.json();
            const fileLinks = manifest.files;
            
            console.log('Found JSON files from manifest:', fileLinks);
            
            if (fileLinks.length === 0) {
                throw new Error('No JSON files found in the manifest');
            }
            
            // Load and merge all question files
            const promises = fileLinks.map(async (fileName) => {
                const response = await fetch(`data/${fileName}`);
                if (!response.ok) throw new Error(`Failed to load ${fileName}`);
                return await response.json();
            });
            
            const questionSets = await Promise.all(promises);
            state.allQuestions = questionSets.flat();
            
            // Extract all unique tags
            state.allQuestions.forEach(question => {
                question.tags.forEach(tag => state.availableTags.add(tag));
            });
            
            // Initialize filtered questions to all questions
            state.filteredQuestions = [...state.allQuestions];
            
            updateQuestionCounter();
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Failed to load questions. Please check the console for details.');
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Next question button
        elements.nextQuestionBtn.addEventListener('click', showNextQuestion);
        
        // Clear filters button
        elements.clearFiltersBtn.addEventListener('click', () => {
            state.selectedTags.clear();
            updateTagSelection();
            filterQuestions();
        });
        
        // Submit answer button (for multiple choice)
        elements.submitAnswerBtn.addEventListener('click', checkAnswer);
        
        // We'll handle the reveal answer button in the displayOpenEndedQuestion function
        // because we need to mark the question as answered when it's revealed
    }

    // Render all available tags
    function renderTags() {
        elements.tagsContainer.innerHTML = '';
        
        Array.from(state.availableTags).sort().forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.classList.add('tag');
            if (state.selectedTags.has(tag)) {
                tagElement.classList.add('selected');
            }
            tagElement.textContent = tag;
            tagElement.addEventListener('click', () => {
                toggleTag(tag);
            });
            
            elements.tagsContainer.appendChild(tagElement);
        });
    }

    // Toggle a tag selection
    function toggleTag(tag) {
        if (state.selectedTags.has(tag)) {
            state.selectedTags.delete(tag);
        } else {
            state.selectedTags.add(tag);
        }
        
        updateTagSelection();
        filterQuestions();
    }

    // Update the visual selection of tags
    function updateTagSelection() {
        document.querySelectorAll('.tag').forEach(tagElement => {
            const tag = tagElement.textContent;
            if (state.selectedTags.has(tag)) {
                tagElement.classList.add('selected');
            } else {
                tagElement.classList.remove('selected');
            }
        });
    }

    // Filter questions based on selected tags
    function filterQuestions() {
        if (state.selectedTags.size === 0) {
            // If no tags selected, show all questions
            state.filteredQuestions = [...state.allQuestions];
        } else {
            // Filter questions that match ANY selected tag (OR logic)
            state.filteredQuestions = state.allQuestions.filter(question => {
                return Array.from(state.selectedTags).some(tag => question.tags.includes(tag));
            });
        }
        
        // Reset current question index and question counter
        state.currentQuestionIndex = -1;
        state.questionCounter = 0;
        
        // Clear answered questions when filters change
        state.answeredQuestions.clear();
        
        // Show the next question with the new filters
        showNextQuestion();
    }

    // Show the next random question
    function showNextQuestion() {
        if (state.filteredQuestions.length === 0) {
            elements.questionText.textContent = 'No questions available with the selected filters.';
            elements.multipleChoiceContainer.classList.add('hidden');
            elements.openEndedContainer.classList.add('hidden');
            updateQuestionCounter();
            return;
        }
        
        resetQuestionDisplay();
        
        // Get unanswered questions
        const unansweredQuestions = state.filteredQuestions.filter((q, index) => 
            !state.answeredQuestions.has(q.id));
            
        // If all questions have been answered, show message
        if (unansweredQuestions.length === 0) {
            elements.questionText.textContent = 'You have answered all available questions! Refresh the page to start over.';
            elements.multipleChoiceContainer.classList.add('hidden');
            elements.openEndedContainer.classList.add('hidden');
            updateQuestionCounter();
            return;
        }
        
        // Choose a random question from the unanswered filtered list
        const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
        const selectedQuestion = unansweredQuestions[randomIndex];
        
        // Find the index of this question in the filteredQuestions array
        state.currentQuestionIndex = state.filteredQuestions.findIndex(q => q.id === selectedQuestion.id);
        
        const question = state.filteredQuestions[state.currentQuestionIndex];
        elements.questionText.textContent = question.question;
        
        // Increment question counter when showing a new question
        state.questionCounter++;
        
        if (question.type === 'multiple-choice') {
            displayMultipleChoiceQuestion(question);
        } else if (question.type === 'open-ended') {
            displayOpenEndedQuestion(question);
        }
        
        updateQuestionCounter();
    }

    // Display a multiple choice question
    function displayMultipleChoiceQuestion(question) {
        elements.multipleChoiceContainer.classList.remove('hidden');
        elements.openEndedContainer.classList.add('hidden');
        
        // Populate options
        elements.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('option');
            optionElement.dataset.index = index;
            optionElement.textContent = option;
            
            optionElement.addEventListener('click', () => {
                // Deselect all options
                document.querySelectorAll('.option').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Select this option
                optionElement.classList.add('selected');
            });
            
            elements.optionsContainer.appendChild(optionElement);
        });
    }

    // Display an open-ended question
    function displayOpenEndedQuestion(question) {
        elements.multipleChoiceContainer.classList.add('hidden');
        elements.openEndedContainer.classList.remove('hidden');
        
        // Set the answer text but keep it hidden until revealed
        elements.answerText.textContent = question.answer;
        elements.answerText.classList.add('hidden');
        elements.revealAnswerBtn.disabled = false;
        
        // Add event listener to mark as answered when revealing answer
        elements.revealAnswerBtn.onclick = () => {
            elements.answerText.classList.remove('hidden');
            elements.revealAnswerBtn.disabled = true;
            // Mark this question as answered
            state.answeredQuestions.add(question.id);
        };
    }

    // Check the answer for a multiple choice question
    function checkAnswer() {
        const selectedOption = document.querySelector('.option.selected');
        if (!selectedOption) {
            alert('Please select an option first.');
            return;
        }
        
        const question = state.filteredQuestions[state.currentQuestionIndex];
        const selectedIndex = parseInt(selectedOption.dataset.index);
        const isCorrect = selectedIndex === question.correctIndex;
        
        // Mark this question as answered
        state.answeredQuestions.add(question.id);
        
        // Show feedback
        elements.feedback.classList.remove('hidden');
        
        if (isCorrect) {
            elements.feedback.classList.add('correct');
            elements.feedback.classList.remove('incorrect');
            elements.feedback.textContent = 'Correct! ' + (question.explanation || '');
        } else {
            elements.feedback.classList.add('incorrect');
            elements.feedback.classList.remove('correct');
            elements.feedback.textContent = 'Incorrect. ' + (question.explanation || '');
            
            // Highlight the correct answer
            const options = document.querySelectorAll('.option');
            options.forEach((option, index) => {
                if (index === question.correctIndex) {
                    option.classList.add('correct');
                }
                if (index === selectedIndex) {
                    option.classList.add('incorrect');
                }
            });
        }
        
        // Disable the submit button after checking
        elements.submitAnswerBtn.disabled = true;
    }

    // Reset the question display for a new question
    function resetQuestionDisplay() {
        elements.feedback.classList.add('hidden');
        elements.answerText.classList.add('hidden');
        elements.submitAnswerBtn.disabled = false;
        elements.revealAnswerBtn.disabled = false;
        
        // Clear any previously selected options
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.classList.remove('selected');
            option.classList.remove('correct');
            option.classList.remove('incorrect');
        });
    }

    // Update the question counter display
    function updateQuestionCounter() {
        const totalQuestions = state.filteredQuestions.length;
        const answeredCount = state.answeredQuestions.size;
        const remainingCount = totalQuestions - answeredCount;
        
        // Use the sequential counter instead of the index
        elements.questionCounter.textContent = `Question ${state.questionCounter} of ${totalQuestions} (${remainingCount} remaining)`;
    }

    // Start the application
    init();
});
