const imgEl = document.getElementById('pokemon-img');
const promptEl = document.getElementById('quiz-prompt');
const inputEl = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');

let currentData = {};
let nextData = null; // Stores the preloaded Pokémon
let score = 0;
let isGameActive = false;

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

// Fetch a single Pokémon's data given an ID
async function fetchPokemonData(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();

    const speciesResponse = await fetch(data.species.url);
    const speciesData = await speciesResponse.json();

    const apiGenName = speciesData.generation.name;
    
    return {
        name: data.name,
        types: data.types.map(t => t.type.name),
        abilities: data.abilities.map(a => a.ability.name),
        generationNum: genMap[apiGenName] || '1',
        sprite: data.sprites.front_default
    };
}

// Setup the game round using provided data object
function displayPokemon(data) {
    currentData = data;
    inputEl.value = '';
    feedbackEl.textContent = '';

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

    isGameActive = true;

    // Preload the *next* Pokémon in the background right after displaying this one
    preloadNextPokemon();
}

async function preloadNextPokemon() {
    try {
        const randomId = getRandomId(1, 1025);
        nextData = await fetchPokemonData(randomId);
    } catch (error) {
        console.error("Error preloading next Pokémon:", error);
    }
}

// Initial game loader
async function initGame() {
    promptEl.textContent = "Loading Pokémon...";
    try {
        const randomId1 = getRandomId(1, 1025);
        const randomId2 = getRandomId(1, 1025);
        
        // Load current and preload next simultaneously for the very first round
        const firstData = await fetchPokemonData(randomId1);
        nextData = await fetchPokemonData(randomId2);

        displayPokemon(firstData);
    } catch (error) {
        console.error("Error initializing game:", error);
        promptEl.textContent = "Failed to load Pokémon. Try refreshing!";
    }
}

// Transition to the preloaded Pokémon instantly
function loadNextRound() {
    if (nextData) {
        displayPokemon(nextData);
    } else {
        // Fallback just in case background preload failed
        initGame();
    }
}

function checkAnswer() {
    if (!isGameActive) return;

    const userVal = inputEl.value.trim().toLowerCase();

    // Check if nothing was written
    if (!userVal) {
        feedbackEl.style.color = 'red';
        feedbackEl.textContent = "You didn't submit an answer!";
        return;
    }

    isGameActive = false; // Prevent double-submitting during timeouts
    let isCorrect = false;

    switch (currentData.activeQuestionType) {
        case 'name':
            if (userVal === currentData.name) isCorrect = true;
            break;
            
        case 'type':
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

    // Format proper display for the correct answer
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
        setTimeout(loadNextRound, 2000);
    } else {
        feedbackEl.style.color = 'red';
        score = 0; // Reset score on wrong answer
        scoreEl.textContent = score;
        feedbackEl.textContent = `Incorrect! Score reset to 0. The correct answer was: ${displayAnswer}`;
        setTimeout(loadNextRound, 3000);
    }
}

// Event listeners
submitBtn.addEventListener('click', checkAnswer);

inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevents newlines/form submits
        checkAnswer();
    }
});

// Run game on load
initGame();