let explanationsVisible = true; // Start with explanations hidden

        // --- Progress bar ---
        const progressBar = document.getElementById("progressBar");
        window.onscroll = function() {
            updateProgressBar();
            toggleBackToTopButton();
        };

        function updateProgressBar() {
            let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            progressBar.style.width = (height > 0) ? ((winScroll / height) * 100) + "%" : "0%";
        }

        // --- Back to top button ---
        const backToTopButton = document.getElementById("backToTop");

        function toggleBackToTopButton() {
            if (backToTopButton) {
                backToTopButton.style.display = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? "flex" : "none";
            }
        }

        if (backToTopButton) {
            backToTopButton.addEventListener("click", function(e) {
                e.preventDefault();
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
        }

        // --- Filtering and Searching ---
        const criterionFilter = document.getElementById("criterionFilter");
        const searchInput = document.getElementById("searchInput");
        const searchButton = document.getElementById("searchButton");
        const questionsContainer = document.getElementById("questionsContainer");
        const questionCards = questionsContainer.querySelectorAll(".question-card");
        let noResultsMessage = document.getElementById('noResultsMessage');
        if (!noResultsMessage) {
            noResultsMessage = document.createElement('div');
            noResultsMessage.id = 'noResultsMessage';
            noResultsMessage.className = 'no-results';
            noResultsMessage.style.display = 'none';
            noResultsMessage.style.textAlign = 'center';
            noResultsMessage.style.padding = '2rem';
            noResultsMessage.style.fontSize = '1.1rem';
            noResultsMessage.style.color = 'var(--color-secondary)';
            noResultsMessage.textContent = '沒有找到符合條件的題目。';
            if (questionsContainer) {
                questionsContainer.appendChild(noResultsMessage);
            }
        }

        // Function to filter by criterion (called from grid items)
        function filterByCriterion(criterionId) {
            criterionFilter.value = criterionId;
            searchInput.value = ''; // Clear search when applying criterion filter
            filterAndSearchQuestions();
            // Scroll to the questions container smoothly
             const controlsHeight = document.querySelector('.controls').offsetHeight + document.querySelector('.criteria-container').offsetHeight + 50; // Estimate height of controls + criteria + margin
            window.scrollTo({ top: controlsHeight, behavior: 'smooth' });

        }

        criterionFilter.addEventListener("change", () => {
            searchInput.value = ''; // Clear search on filter change
            filterAndSearchQuestions();
        });
        searchButton.addEventListener("click", filterAndSearchQuestions);
        searchInput.addEventListener("keyup", function(event) {
             filterAndSearchQuestions(); // Filter as user types
        });

        function filterAndSearchQuestions() {
            let selectedCriterion = criterionFilter.value;
            let searchText = searchInput.value.toLowerCase().trim();
            let anyVisible = false;

            questionCards.forEach(function(card) {
                const criterionMatch = (selectedCriterion === "all" || card.dataset.evaluationContentId === selectedCriterion);

                const questionText = (card.querySelector('.question-content')?.textContent ?? '').toLowerCase();
                const optionsText = Array.from(card.querySelectorAll('.option-text')).map(el => el.textContent.toLowerCase()).join(' ');
                const explanationText = (card.querySelector('.explanation-content')?.textContent ?? '').toLowerCase();
                const combinedText = questionText + ' ' + optionsText + ' ' + explanationText;
                const searchMatch = (searchText === "" || combinedText.includes(searchText));

                if (criterionMatch && searchMatch) {
                    card.style.display = "block";
                    anyVisible = true;
                } else {
                    card.style.display = "none";
                }
            });

            noResultsMessage.style.display = anyVisible ? 'none' : 'block';
            if (!anyVisible) {
                 noResultsMessage.textContent = '沒有找到符合條件的題目。';
            }
        }

        // --- Toggle Explanations ---
        const toggleButton = document.getElementById("toggleExplanations");
        const allExplanations = questionsContainer.querySelectorAll(".explanation-container");

        toggleButton.addEventListener("click", function() {
            explanationsVisible = !explanationsVisible;
            allExplanations.forEach(explanation => {
                // Only toggle explanations for visible cards
                const card = explanation.closest('.question-card');
                if(card && card.style.display !== 'none'){
                     explanation.style.display = explanationsVisible ? "block" : "none";
                } else if (!card) { //Should not happen, but as fallback
                     explanation.style.display = explanationsVisible ? "block" : "none";
                }
            });
            this.textContent = explanationsVisible ? "隱藏全部解析" : "顯示全部解析";
        });

        // Toggle individual explanation on clicking option
        questionsContainer.addEventListener('click', function(e) {
             // Use .closest() to find the relevant parent elements
             const optionItem = e.target.closest('.option-item');
             const questionCard = e.target.closest('.question-card');

             if (optionItem && questionCard) { // Ensure both clicks are within a card and on an option
                 const explanation = questionCard.querySelector('.explanation-container');
                 if (explanation) {
                     explanation.style.display = (explanation.style.display === 'none' || explanation.style.display === '') ? 'block' : 'none';
                 }
             }
        });


        // --- Initial Setup ---
        document.addEventListener('DOMContentLoaded', () => {
            toggleBackToTopButton();
            updateProgressBar();
            filterAndSearchQuestions(); // Apply initial filter/search state
            // Set initial state for toggle button text based on `explanationsVisible`
            toggleButton.textContent = explanationsVisible ? "隱藏全部解析" : "顯示全部解析";
             // Set initial display state for all explanations based on global flag
             allExplanations.forEach(explanation => {
                explanation.style.display = explanationsVisible ? "block" : "none";
             });
        });
