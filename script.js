const imgEl = document.getElementById('pokemon-img');
const promptEl = document.getElementById('quiz-prompt');
const inputEl = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const leaderboardListEl = document.getElementById('leaderboard-list');

let currentData = {};
let nextData = null;
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

// Load leaderboard on startup
let highScores = JSON.parse(localStorage.getItem('pokemonQuizHighScores')) || [];
updateLeaderboardUI();

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

    imgEl.src = currentData.sprite;
    imgEl.style.display = 'inline-block';

    const questionTypes = ['name', 'type', 'ability', 'generation'];
    const chosenType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    currentData.activeQuestionType = chosenType;

    if (chosenType === 'name') {
        promptEl.textContent = "What is the name of this Pokémon?";
    } else if (chosenType === 'type') {
        promptEl.textContent = "What is/are this Pokémon's type(s) (e.g., grass fire):";
    } else if (chosenType === 'ability') {
        promptEl.textContent = "Name one of this Pokémon's abilities (regular or hidden):";
    } else if (chosenType === 'generation') {
        promptEl.textContent = "What generation did it debut in? (Type a number 1-9):";
    }

    isGameActive = true;
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

async function initGame() {
    promptEl.textContent = "Loading Pokémon...";
    try {
        const randomId1 = getRandomId(1, 1025);
        const randomId2 = getRandomId(1, 1025);
        
        const firstData = await fetchPokemonData(randomId1);
        nextData = await fetchPokemonData(randomId2);

        displayPokemon(firstData);
    } catch (error) {
        console.error("Error initializing game:", error);
        promptEl.textContent = "Failed to load Pokémon. Try refreshing!";
    }
}

function loadNextRound() {
    if (nextData) {
        displayPokemon(nextData);
    } else {
        initGame();
    }
}

// Handle Game Over / Score Reset and Leaderboard check
function handleWrongAnswer(displayAnswer) {
    let finalScore = score;
    score = 0;
    scoreEl.textContent = '0';

    if (finalScore > 0) {
        let playerName = prompt(`Game Over! You scored ${finalScore} points.\nEnter your Trainer Name for the Leaderboard:`, "Trainer");
        if (!playerName || playerName.trim() === "") {
            playerName = "Anonymous";
        } else {
            playerName = playerName.trim();
        }

        // Add score and sort top 5
        highScores.push({ name: playerName, score: finalScore });
        highScores.sort((a, b) => b.score - a.score);
        highScores = highScores.slice(0, 5); // Keep top 5

        localStorage.setItem('pokemonQuizHighScores', JSON.stringify(highScores));
        updateLeaderboardUI();
    }

    feedbackEl.style.color = 'red';
    feedbackEl.textContent = `Incorrect! Score reset to 0. Correct answer: ${displayAnswer}`;
    setTimeout(loadNextRound, 3000);
}

function updateLeaderboardUI() {
    leaderboardListEl.innerHTML = '';
    if (highScores.length === 0) {
        leaderboardListEl.innerHTML = '<li>No high scores yet!</li>';
        return;
    }

    highScores.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = `${entry.name}: ${entry.score} pts`;
        leaderboardListEl.appendChild(li);
    });
}

function checkAnswer() {
    if (!isGameActive) return;

    const rawUserVal = inputEl.value.trim().toLowerCase();

    if (!rawUserVal) {
        feedbackEl.style.color = 'red';
        feedbackEl.textContent = "You didn't submit an answer!";
        return;
    }

    isGameActive = false;
    let isCorrect = false;
    const normalizedUserVal = rawUserVal.replace(/-/g, ' ');

    switch (currentData.activeQuestionType) {
        case 'name':
            const normalizedName = currentData.name.replace(/-/g, ' ');
            if (rawUserVal === currentData.name || normalizedUserVal === normalizedName) {
                isCorrect = true;
            }
            break;
            
        case 'type':
            const userTypes = rawUserVal.split(/[\s,]+/).filter(Boolean);
            if (currentData.types.length === userTypes.length && 
                currentData.types.every(t => userTypes.includes(t)) &&
                userTypes.every(t => currentData.types.includes(t))) {
                isCorrect = true;
            }
            break;
            
        case 'ability':
            const validAbilities = currentData.abilities.flatMap(a => [a, a.replace(/-/g, ' ')]);
            if (validAbilities.includes(rawUserVal) || validAbilities.includes(normalizedUserVal)) {
                isCorrect = true;
            }
            break;
            
        case 'generation':
            if (rawUserVal === currentData.generationNum) {
                isCorrect = true;
            }
            break;
    }

    let displayAnswer = '';
    if (currentData.activeQuestionType === 'name') {
        displayAnswer = currentData.name.replace(/-/g, ' ');
    } else if (currentData.activeQuestionType === 'type') {
        displayAnswer = currentData.types.join(' and ');
    } else if (currentData.activeQuestionType === 'ability') {
        displayAnswer = currentData.abilities.map(a => a.replace(/-/g, ' ')).join(', ');
    } else if (currentData.activeQuestionType === 'generation') {
        displayAnswer = `Generation ${currentData.generationNum}`;
    }

    if (isCorrect) {
        feedbackEl.style.color = 'green';
        score++;
        scoreEl.textContent = score;
        feedbackEl.textContent = `Correct! Answer: ${displayAnswer}`;
        setTimeout(loadNextRound, 2000);
    } else {
        handleWrongAnswer(displayAnswer);
    }
}

// Event listeners
submitBtn.addEventListener('click', checkAnswer);

inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        checkAnswer();
    }
});

// Run game on load
initGame();