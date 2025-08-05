document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        allQuestions: [],
        filteredQuestions: [],
        currentQuestionIndex: -1,
        selectedTags: new Set(),
        availableTags: new Set(),
        answeredQuestions: new Set(), // Track questions that have been answered
        questionCounter: 0, // Track the sequential counter for questions
        profiles: {}, // Available exam profiles
        selectedProfile: 'all' // Currently selected profile
    };

    // DOM elements
    const elements = {
        profileSelector: document.getElementById('profile-selector'),
        tagSearch: document.getElementById('tag-search'),
        tagSuggestions: document.getElementById('tag-suggestions'),
        selectedTagsContainer: document.getElementById('selected-tags-container'),
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
        initTagSystem();
        showNextQuestion();
    }

    // Load profiles and initialize profile selector
    async function loadProfiles() {
        try {
            const manifestResponse = await fetch('data/manifest.json');
            if (!manifestResponse.ok) throw new Error('Failed to access data manifest');
            
            const manifest = await manifestResponse.json();
            state.profiles = manifest.profiles || {};
            
            // Populate profile selector
            Object.entries(state.profiles).forEach(([profileId, profile]) => {
                const option = document.createElement('option');
                option.value = profileId;
                option.textContent = profile.name;
                elements.profileSelector.appendChild(option);
            });
            
            return manifest;
        } catch (error) {
            console.error('Error loading profiles:', error);
            throw error;
        }
    }

    // Load questions based on selected profile
    async function loadQuestionsForProfile(profileId, manifest) {
        try {
            let fileLinks;
            
            if (profileId === 'all') {
                // Load all files if 'all' is selected
                fileLinks = manifest.files;
            } else if (state.profiles[profileId]) {
                // Load files for specific profile
                fileLinks = state.profiles[profileId].files;
            } else {
                throw new Error(`Profile ${profileId} not found`);
            }
            
            console.log(`Loading questions for profile '${profileId}':`, fileLinks);
            
            if (fileLinks.length === 0) {
                throw new Error('No question files found for selected profile');
            }
            
            // Load all question files for the profile
            const promises = fileLinks.map(async (file) => {
                const response = await fetch(`data/${file}`);
                if (!response.ok) throw new Error(`Failed to load ${file}`);
                return response.json();
            });
            
            const questionSets = await Promise.all(promises);
            state.allQuestions = questionSets.flat();
            
            // Extract all unique tags
            state.availableTags.clear();
            state.allQuestions.forEach(question => {
                question.tags.forEach(tag => state.availableTags.add(tag));
            });
            
            // Reset filters and initialize filtered questions
            state.selectedTags.clear();
            state.filteredQuestions = [...state.allQuestions];
            state.answeredQuestions.clear();
            state.questionCounter = 0;
            
            // Update UI
            renderSelectedTags();
            updateQuestionCounter();
            
        } catch (error) {
            console.error('Error loading questions for profile:', error);
            alert('Failed to load questions. Please check the console for details.');
        }
    }

    // Load all question files from data directory
    async function loadAllQuestions() {
        try {
            const manifest = await loadProfiles();
            await loadQuestionsForProfile(state.selectedProfile, manifest);
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Failed to load questions. Please check the console for details.');
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Profile selector
        elements.profileSelector.addEventListener('change', async (e) => {
            state.selectedProfile = e.target.value;
            console.log(`Switching to profile: ${state.selectedProfile}`);
            
            // Load manifest and questions for new profile
            try {
                const manifestResponse = await fetch('data/manifest.json');
                if (!manifestResponse.ok) throw new Error('Failed to access data manifest');
                const manifest = await manifestResponse.json();
                
                await loadQuestionsForProfile(state.selectedProfile, manifest);
                showNextQuestion();
            } catch (error) {
                console.error('Error switching profile:', error);
                alert('Failed to switch profile. Please check the console for details.');
            }
        });
        
        // Tag search input
        elements.tagSearch.addEventListener('input', (e) => {
            const searchQuery = e.target.value.trim();
            // Always show suggestions, but filter based on query
            showTagSuggestions(searchQuery);
        });
        
        // Focus and blur events for tag search
        elements.tagSearch.addEventListener('focus', () => {
            // Always show all tags when focused, regardless of input value
            showTagSuggestions(elements.tagSearch.value.trim());
        });
        
        elements.tagSearch.addEventListener('blur', (e) => {
            // Don't hide suggestions immediately to allow for clicking on them
            setTimeout(() => {
                if (!elements.tagSuggestions.contains(document.activeElement)) {
                    hideTagSuggestions();
                }
            }, 150);
        });
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!elements.tagSearch.contains(e.target) && 
                !elements.tagSuggestions.contains(e.target)) {
                hideTagSuggestions();
            }
        });
        
        // Next question button
        elements.nextQuestionBtn.addEventListener('click', showNextQuestion);
        
        // Clear filters button
        elements.clearFiltersBtn.addEventListener('click', () => {
            state.selectedTags.clear();
            renderSelectedTags();
            filterQuestions();
            elements.tagSearch.value = '';
        });
        
        // Submit answer button (for multiple choice)
        elements.submitAnswerBtn.addEventListener('click', checkAnswer);
        
        // We'll handle the reveal answer button in the displayOpenEndedQuestion function
        // because we need to mark the question as answered when it's revealed
    }

    // Show tag suggestions based on search query with multi-select support
    function showTagSuggestions(searchQuery) {
        elements.tagSuggestions.innerHTML = '';
        elements.tagSuggestions.classList.remove('hidden');
        
        // Filter tags based on search query (if provided)
        // When empty, show all tags (when clicked on the input)
        const filteredTags = Array.from(state.availableTags)
            .filter(tag => searchQuery === '' || tag.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(tag => !state.selectedTags.has(tag)) // Exclude already selected tags
            .sort();
        
        if (filteredTags.length === 0) {
            const noResults = document.createElement('div');
            noResults.classList.add('tag-suggestion');
            noResults.textContent = 'No matching tags found';
            noResults.style.fontStyle = 'italic';
            noResults.style.color = '#888';
            elements.tagSuggestions.appendChild(noResults);
            return;
        }
        
        // Temporary state for multi-select
        const tempSelectedTags = new Set();
        
        // Create suggestion elements
        filteredTags.forEach(tag => {
            const suggestion = document.createElement('div');
            suggestion.classList.add('tag-suggestion');
            
            // Create checkbox for multi-select
            const checkbox = document.createElement('span');
            checkbox.classList.add('checkbox');
            
            // Create tag text
            const tagText = document.createElement('span');
            tagText.textContent = tag;
            tagText.style.flexGrow = '1';
            
            // Add elements to suggestion
            suggestion.appendChild(checkbox);
            suggestion.appendChild(tagText);
            
            // Click handler for multi-select
            suggestion.addEventListener('click', () => {
                if (suggestion.classList.contains('selected')) {
                    suggestion.classList.remove('selected');
                    tempSelectedTags.delete(tag);
                } else {
                    suggestion.classList.add('selected');
                    tempSelectedTags.add(tag);
                }
            });
            
            elements.tagSuggestions.appendChild(suggestion);
        });
        
        // Add action buttons for multi-select
        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('multi-select-actions');
        
        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            hideTagSuggestions();
            elements.tagSearch.value = '';
        });
        
        // Apply button
        const applyButton = document.createElement('button');
        applyButton.textContent = 'Apply Selected';
        applyButton.classList.add('apply');
        applyButton.addEventListener('click', () => {
            // Add all temporarily selected tags
            tempSelectedTags.forEach(tag => {
                state.selectedTags.add(tag);
            });
            
            // Update UI and filter questions
            renderSelectedTags();
            filterQuestions();
            
            // Clear search and hide suggestions
            elements.tagSearch.value = '';
            hideTagSuggestions();
        });
        
        // Add buttons to actions container
        actionsContainer.appendChild(cancelButton);
        actionsContainer.appendChild(applyButton);
        
        // Add actions container to suggestions
        elements.tagSuggestions.appendChild(actionsContainer);
    }
    
    // Hide tag suggestions
    function hideTagSuggestions() {
        elements.tagSuggestions.classList.add('hidden');
    }
    
    // Render selected tags
    function renderSelectedTags() {
        elements.selectedTagsContainer.innerHTML = '';
        
        if (state.selectedTags.size === 0) {
            return;
        }
        
        Array.from(state.selectedTags).sort().forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.classList.add('tag', 'selected');
            
            // Create tag content with remove icon
            tagElement.innerHTML = `${tag} <i class="fas fa-times-circle"></i>`;
            
            tagElement.addEventListener('click', () => {
                toggleTag(tag);
            });
            
            elements.selectedTagsContainer.appendChild(tagElement);
        });
    }

    // Toggle a tag selection
    function toggleTag(tag) {
        if (state.selectedTags.has(tag)) {
            state.selectedTags.delete(tag);
        } else {
            state.selectedTags.add(tag);
        }
        
        renderSelectedTags();
        filterQuestions();
    }

    // Initialize tag system
    function initTagSystem() {
        renderSelectedTags();
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
