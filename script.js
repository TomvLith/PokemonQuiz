const imgEl = document.getElementById('pokemon-img');
const promptEl = document.getElementById('quiz-prompt');
const inputEl = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');

let currentData = {};
let score = 0;

// Map API generation names to simple numbers (1-9)
const genMap = {
    'generation-i': '1',
    'generation-ii': '2',
    'generation-iii': '3',
    'generation-iv': '4',
    'generation-v': '5',
    'generation-vi': '6',
    'generation-vii': '7',
    'generation-viii': '8',
    'generation-ix': '9'
};

// Helper: Get a random number between min and max (inclusive)
function getRandomId(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchNewPokemon() {
    inputEl.value = '';
    feedbackEl.textContent = '';
    
    // Gen 1 to 9 (1 to 1025)
    const randomId = getRandomId(1, 1025);

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await response.json();

        // Fetch species data for generation info
        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();

        // Save current correct data (data.abilities includes hidden abilities automatically)
        const apiGenName = speciesData.generation.name;
        currentData = {
            name: data.name,
            types: data.types.map(t => t.type.name), // e.g., ["grass", "poison"]
            abilities: data.abilities.map(a => a.ability.name), // e.g., ["overgrow", "chlorophyll", "solar-power"]
            generationNum: genMap[apiGenName] || '1',
            sprite: data.sprites.front_default
        };

        // Show image
        imgEl.src = currentData.sprite;
        imgEl.style.display = 'inline-block';

        // Pick a random question type
        const questionTypes = ['name', 'type', 'ability', 'generation'];
        const chosenType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        currentData.activeQuestionType = chosenType;

        // Set prompt text based on chosen category
        if (chosenType === 'name') {
            promptEl.textContent = "What is the name of this Pokémon?";
        } else if (chosenType === 'type') {
            if (currentData.types.length > 1) {
                promptEl.textContent = `Type both types (e.g., ${currentData.types.join(' ')}):`;
            } else {
                promptEl.textContent = "What is this Pokémon's type?";
            }
        } else if (chosenType === 'ability') {
            promptEl.textContent = "Name one of this Pokémon's abilities (regular or hidden):";
        } else if (chosenType === 'generation') {
            promptEl.textContent = "What generation did it debut in? (Type a number 1-9):";
        }

    } catch (error) {
        console.error("Error fetching data:", error);
        promptEl.textContent = "Failed to load Pokémon. Try refreshing!";
    }
}

function checkAnswer() {
    const userVal = inputEl.value.trim().toLowerCase();
    let isCorrect = false;

    if (!userVal) return;

    switch (currentData.activeQuestionType) {
        case 'name':
            if (userVal === currentData.name) isCorrect = true;
            break;
            
        case 'type':
            // Split user input by spaces or commas to handle dual types (order-independent)
            const userTypes = userVal.split(/[\s,]+/).filter(Boolean);
            if (currentData.types.length === userTypes.length && 
                currentData.types.every(t => userTypes.includes(t)) &&
                userTypes.every(t => currentData.types.includes(t))) {
                isCorrect = true;
            }
            break;
            
        case 'ability':
            if (currentData.abilities.includes(userVal)) isCorrect = true;
            break;
            
        case 'generation':
            if (userVal === currentData.generationNum) isCorrect = true;
            break;
    }

    // Format proper display for the correct answer on failure
    let displayAnswer = '';
    if (currentData.activeQuestionType === 'name') {
        displayAnswer = currentData.name;
    } else if (currentData.activeQuestionType === 'type') {
        displayAnswer = currentData.types.join(' and ');
    } else if (currentData.activeQuestionType === 'ability') {
        displayAnswer = currentData.abilities.join(', ');
    } else if (currentData.activeQuestionType === 'generation') {
        displayAnswer = `Generation ${currentData.generationNum}`;
    }

    if (isCorrect) {
        feedbackEl.style.color = 'green';
        feedbackEl.textContent = `Correct! It was ${currentData.name}.`;
        score++;
        scoreEl.textContent = score;
        setTimeout(fetchNewPokemon, 2000);
    } else {
        feedbackEl.style.color = 'red';
        feedbackEl.textContent = `Incorrect! The correct answer was: ${displayAnswer}`;
        setTimeout(fetchNewPokemon, 2500);
    }
}

// Event listeners
submitBtn.addEventListener('click', checkAnswer);

inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevents default form behavior/newlines
        checkAnswer();
    }
});

// Run game on load
fetchNewPokemon();