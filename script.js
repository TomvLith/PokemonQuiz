const imgEl = document.getElementById('pokemon-img');
const promptEl = document.getElementById('quiz-prompt');
const inputEl = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');

let currentData = {};
let score = 0;

// Helper: Get a random number between min and max (inclusive)
function getRandomId(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchNewPokemon() {
    inputEl.value = '';
    feedbackEl.textContent = '';
    
    // Let's stick to generations 1-8 for reliable sprite availability (ID 1 to 898)
    const randomId = getRandomId(1, 898);

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await response.json();

        // We also need generation data, which comes from the species endpoint
        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();

        // Save current correct data
        currentData = {
            name: data.name,
            types: data.types.map(t => t.type.name), // e.g., ["grass", "poison"]
            abilities: data.abilities.map(a => a.ability.name), // e.g., ["overgrow", "chlorophyll"]
            generation: speciesData.generation.name, // e.g., "generation-i"
            sprite: data.sprites.front_default
        };

        // Show image
        imgEl.src = currentData.sprite;
        imgEl.style.display = 'inline-block';

        // Pick a random question type (0: name, 1: type, 2: ability, 3: generation)
        const questionTypes = ['name', 'type', 'ability', 'generation'];
        const chosenType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        currentData.activeQuestionType = chosenType;

        // Set prompt text based on chosen category
        if (chosenType === 'name') {
            promptEl.textContent = "What is the name of this Pokémon?";
        } else if (chosenType === 'type') {
            promptEl.textContent = "Name one of this Pokémon's types (e.g. fire, water):";
        } else if (chosenType === 'ability') {
            promptEl.textContent = "Name one of this Pokémon's possible abilities:";
        } else if (chosenType === 'generation') {
            promptEl.textContent = "What generation did it debut in? (format: generation-i, generation-ii, etc.)";
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
            if (currentData.types.includes(userVal)) isCorrect = true;
            break;
        case 'ability':
            if (currentData.abilities.includes(userVal)) isCorrect = true;
            break;
        case 'generation':
            if (userVal === currentData.generation) isCorrect = true;
            break;
    }

    if (isCorrect) {
        feedbackEl.style.color = 'green';
        feedbackEl.textContent = `Correct! It was ${currentData.name}.`;
        score++;
        scoreEl.textContent = score;
        setTimeout(fetchNewPokemon, 2000); // Load next after 2 seconds
    } else {
        feedbackEl.style.color = 'red';
        feedbackEl.textContent = `Incorrect! The correct answer was related to: ${currentData[currentData.activeQuestionType]}`;
        setTimeout(fetchNewPokemon, 2500);
    }
}

// Event listeners
submitBtn.addEventListener('click', checkAnswer);
inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});

// Run game on load
fetchNewPokemon();