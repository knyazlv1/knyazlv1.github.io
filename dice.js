document.addEventListener('DOMContentLoaded', () => {
    const diceContainer = document.getElementById('dice-container');
    const spinButton = document.getElementById('spin');
    const restartButton = document.getElementById('restart');
    const scoreTable = document.getElementById('player-tables');
    const winnerMessage = document.getElementById('winner-message');
    const currentPlayerMessage = document.getElementById('current-player-message');
    
    let currentPlayer = 1;
    let playerScores = [];
    let playerThrows = [];
    let lastThrowScores = [];
    let isGameOpened = [];
    let isGameOver = false;
    let numberOfPlayers = 0;
    let isComputerMode = false;
    let previousDiceValues = Array(5).fill(0);

    const urlParams = new URLSearchParams(window.location.search);
    const mode = parseInt(urlParams.get('mode')) || 2;

    function initGame() {
        numberOfPlayers = mode;
        isComputerMode = numberOfPlayers === 1;
        if (isComputerMode) numberOfPlayers = 2;
        playerScores = Array(numberOfPlayers).fill(0);
        playerThrows = Array(numberOfPlayers).fill(0);
        lastThrowScores = Array(numberOfPlayers).fill(0);
        isGameOpened = Array(numberOfPlayers).fill(false);
        previousDiceValues = Array(5).fill(0);
        currentPlayer = 1;
        isGameOver = false;
        winnerMessage.style.display = 'none';
        createDice();
        updateScoreboard();
        updateCurrentPlayerMessage();
    }

    function createDice(count = 5) {
        diceContainer.innerHTML = '';
        if (count !== 5) {
            alert("Тільки 5 кубиків можуть бути кинуто одночасно!");
            return;
        }
        for (let i = 0; i < count; i++) {
            const dice = document.createElement('div');
            dice.classList.add('dice');
            dice.innerHTML = `
                <div class="side one">
                    <span class="dot center"></span>
                </div>
                <div class="side two">
                    <span class="dot bottom-left"></span>
                    <span class="dot top-right"></span>
                </div>
                <div class="side three">
                    <span class="dot bottom-left"></span>
                    <span class="dot center"></span>
                    <span class="dot top-right"></span>
                </div>
                <div class="side four">
                    <span class="dot top-left"></span>
                    <span class="dot top-right"></span>
                    <span class="dot bottom-left"></span>
                    <span class="dot bottom-right"></span>
                </div>
                <div class="side five">
                    <span class="dot top-left"></span>
                    <span class="dot top-right"></span>
                    <span class="dot center"></span>
                    <span class="dot bottom-left"></span>
                    <span class="dot bottom-right"></span>
                </div>
                <div class="side six">
                    <span class="dot top-left"></span>
                    <span class="dot top-center"></span>
                    <span class="dot top-right"></span>
                    <span class="dot bottom-left"></span>
                    <span class="dot bottom-center"></span>
                    <span class="dot bottom-right"></span>
                </div>
            `;
            diceContainer.appendChild(dice);
        }
    }

    function updateCurrentPlayerMessage() {
        if (isGameOver) {
            currentPlayerMessage.textContent = '';
            return;
        }
        const playerName = isComputerMode && currentPlayer === 2 ? 'Комп\'ютер' : `Гравець ${currentPlayer}`;
        currentPlayerMessage.textContent = `Зараз кидає ${playerName}`;
    }

    function rollDice() {
        if (isGameOver) return;

        const diceValues = [];
        const diceElements = document.querySelectorAll('.dice');
        diceElements.forEach((dice, index) => {
            const randomSide = Math.floor(Math.random() * 6) + 1;
            diceValues.push(randomSide);

            let rotationX = 720;
            let rotationY = 720;

            if (previousDiceValues[index] === randomSide) {
                rotationY += 360;
            }

            switch (randomSide) {
                case 1: rotationX += 0; rotationY += 0; break;
                case 2: rotationX += 0; rotationY += -90; break;
                case 3: rotationX += 90; rotationY += 0; break;
                case 4: rotationX += -90; rotationY += 0; break;
                case 5: rotationX += 0; rotationY += 90; break;
                case 6: rotationX += 180; rotationY += 0; break;
            }

            dice.style.transform = `translateZ(-33px) rotateY(${rotationY}deg) rotateX(${rotationX}deg)`;
            previousDiceValues[index] = randomSide;
        });

        // Дебаг: виводимо згенеровані значення у консоль
        console.log("Згенеровані значення кубиків:", diceValues);

        calculateScore(diceValues);
    }

    function calculateScore(diceValues) {
        const score = countScores(diceValues);
        playerThrows[currentPlayer - 1]++;
        lastThrowScores[currentPlayer - 1] = score;

        if (!isGameOpened[currentPlayer - 1]) {
            if (score >= 50) {
                isGameOpened[currentPlayer - 1] = true;
                playerScores[currentPlayer - 1] += score;
            }
        } else {
            playerScores[currentPlayer - 1] += score;
        }

        updateScoreboard();

        if (playerScores[currentPlayer - 1] >= 1000) {
            isGameOver = true;
            const winnerName = isComputerMode && currentPlayer === 2 ? 'Комп\'ютер' : `Гравець ${currentPlayer}`;
            winnerMessage.style.display = 'block';
            winnerMessage.textContent = `${winnerName} виграв!`;
            currentPlayerMessage.textContent = '';
        } else {
            currentPlayer = (currentPlayer % numberOfPlayers) + 1;
            updateCurrentPlayerMessage();
            if (isComputerMode && currentPlayer === 2) {
                setTimeout(computerTurn, 1000);
            }
        }
    }

    function countScores(diceValues) {
        let score = 0;

        // 1. Підраховуємо кількість кожної грані
        const count = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        diceValues.forEach(val => {
            count[val]++;
        });

        // Дебаг: виводимо кількість кожної грані у консоль
        console.log("Кількість кожної грані:", count);

        // 2. Перевіряємо особливі комбінації "2 3 4 5 6" і "1 2 3 4 5"
        const uniqueValues = Object.keys(count).filter(key => count[key] > 0).map(Number).sort((a, b) => a - b);
        if (uniqueValues.length === 5) {
            if (uniqueValues.join('') === '23456') {
                console.log("Особлива комбінація 2 3 4 5 6: +250 очок");
                return 250; // 2 3 4 5 6
            }
            if (uniqueValues.join('') === '12345') {
                console.log("Особлива комбінація 1 2 3 4 5: +125 очок");
                return 125; // 1 2 3 4 5
            }
        }

        // 3. Перевіряємо комбінації за таблицею очок
        // Обробляємо кожну грань (1–6)
        for (let val = 1; val <= 6; val++) {
            let remaining = count[val];

            // 5 кубиків
            if (remaining === 5) {
                const points = val === 1 ? 1000 : val * 100;
                console.log(`5 ${val}-ок: +${points} очок`);
                score += points;
                remaining = 0;
            }

            // 4 кубики
            if (remaining >= 4) {
                if (val === 1) {
                    console.log("4 одиниці: +110 очок");
                    score += 110;
                    remaining -= 4;
                } else if (val === 5) {
                    console.log("4 п’ятірки: +55 очок");
                    score += 55;
                    remaining -= 4;
                }
            }

            // 3 кубики
            if (remaining >= 3) {
                if (val === 1) {
                    console.log("3 одиниці: +100 очок");
                    score += 100;
                } else if (val === 5) {
                    console.log("3 п’ятірки: +50 очок");
                    score += 50;
                } else {
                    const points = val * 10;
                    console.log(`3 ${val}-ки: +${points} очок`);
                    score += points;
                }
                remaining -= 3;
            }

            // 2 кубики
            if (remaining >= 2) {
                if (val === 1) {
                    console.log("2 одиниці: +20 очок");
                    score += 20;
                    remaining -= 2;
                } else if (val === 5) {
                    console.log("2 п’ятірки: +10 очок");
                    score += 10;
                    remaining -= 2;
                }
            }

            // 1 кубик
            if (remaining === 1) {
                if (val === 1) {
                    console.log("1 один: +10 очок");
                    score += 10;
                } else if (val === 5) {
                    console.log("1 п’ять: +5 очок");
                    score += 5;
                }
            }
        }

        console.log("Загальний результат:", score);
        return score;
    }

    function updateScoreboard() {
        scoreTable.innerHTML = '';
        for (let i = 0; i < numberOfPlayers; i++) {
            const playerName = isComputerMode && i === 1 ? 'Комп\'ютер' : `Гравець ${i + 1}`;
            const status = isGameOpened[i] ? '' : ' (гра не відкрита)';
            scoreTable.innerHTML += `
                <div class="player-table">
                    <h3>${playerName}${status}</h3>
                    <p>Очки: ${playerScores[i]}</p>
                    <p>Останній кидок: ${lastThrowScores[i]}</p>
                </div>
            `;
        }
    }

    function computerTurn() {
        if (isGameOver) return;
        rollDice();
    }

    function restartGame() {
        initGame();
    }

    spinButton.addEventListener('click', () => {
        if (!isGameOver && (!isComputerMode || currentPlayer === 1)) {
            rollDice();
        }
    });
    restartButton.addEventListener('click', restartGame);

    initGame();
});