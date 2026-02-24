
// rows needs to be 2/3 of cols with current canvas size
let rows = 12;
let cols = 18;
let mines = 30;

let cellSize;
let flagsPlaced = 0;
let cellsRevealed = 0;

let gameState = 0; // 0: not started, 1: started, 2: finished
let board = [];
let startTimestamp = null;
let restartClickedCounter = 0;

let numberColors = ["blue", "green", "red", "purple", "maroon", "turquoise", "black", "gray"];

let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");

let param = (new URLSearchParams(document.location.search)).get("seed");
let loadedWithSeed = param !== null && !isNaN(Number(param));

let rng = mulberry32(0);

let startButton = document.getElementById("start_button");
let buttonDefaultColor = startButton.style.backgroundColor;
let buttonDefaultHover = "rgba(0, 255, 0, 0.9)";
let buttonStartedColor = "rgba(255, 255, 0, 0.5)";
let buttonStartedHover = "rgba(255, 255, 0, 0.9)";
let buttonLostColor = "rgba(255, 0, 0, 0.5)";
let buttonLostHover = "rgba(255, 0, 0, 0.9)";

let screenBgColor = document.getElementsByTagName("body")[0].style.backgroundColor;

let currentButtonColor = buttonDefaultColor;
let currentButtonHover = buttonDefaultHover;

let timer = document.getElementById("time_number");
let counter = document.getElementById("mink_left_number");

let gameLostButton = document.getElementById("gameLostButton");
let gameWonButton = document.getElementById("gameWonButton");
let gameWonButton2 = document.getElementById("gameWonButton2");


let boxImg = new Image();
boxImg.src = "Images/box.gif";

let knifeImg = new Image();
// https://www.iconfinder.com/icons/1531898/bloody_horror_kill_knife_icon
knifeImg.src = "Images/kniv.png";

let minkImg = new Image();
minkImg.src = "Images/mink.png";

let restartMinkImg = new Image();
restartMinkImg.src = "Images/mink2.png";

// let minkDeadImg = new Image();
// minkDeadImg.src = "Images/mink_død.png";

let lossSound = new Audio("sounds/Dark_Souls_Sfx.mp3");
let beepSound = new Audio("sounds/Truck_Backing_Sfx.mp3");

let numbers_font = "30px open-sans-extrabold";
document.fonts.load(numbers_font);



canvas.addEventListener("click", function (event) {
    if (gameState != 1) {
        return;
    }

    restartClickedCounter = 0;

    let x = event.offsetX;
    let y = event.offsetY;
    let row = Math.floor(y / cellSize);
    let col = Math.floor(x / cellSize);
    let cell = board[row][col];

    // Mines are placed when the first cell of the game is clicked
    if (cellsRevealed == 0) {
        placeMines([row, col]);
    }

    if (!cell.revealed) {
        revealCells(row, col);

        if (cell.mine) {
            gameLost();
        } else {
            checkWin();
        }
    }
});


canvas.addEventListener("contextmenu", function (event) {
    event.preventDefault();

    if (gameState != 1) {
        return;
    }

    let x = event.offsetX;
    let y = event.offsetY;
    let row = Math.floor(y / cellSize);
    let col = Math.floor(x / cellSize);
    let cell = board[row][col];

    if (cell.revealed) {
        return;
    }

    if (cell.flagged) {
        flagsPlaced--;
    } else {
        flagsPlaced++;
    }

    counter.innerText = mines - flagsPlaced;

    cell.flagged = !cell.flagged;
    drawSquare(row, col);
    checkWin();
});


function revealCell(cell) {
    if (cell.flagged) {
        flagsPlaced--;
        counter.innerText = mines - flagsPlaced;
        cell.flagged = false;
    }

    cell.revealed = true;
    cellsRevealed++;
}


function revealCells(row, col) {
    let cell = board[row][col];
    revealCell(cell)

    if (cell.mine) {
        return;
    }

    drawSquare(row, col);

    if (cell.count > 0) {
        return;
    }

    for (let i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= rows) {
            continue;
        }
        for (let j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= cols) {
                continue;
            }
            if (!board[i][j].revealed) {
                if (board[i][j].count == 0) {
                    revealCells(i, j);
                } else {
                    revealCell(board[i][j]);
                    drawSquare(i, j);
                }
            }
        }
    }
}


function timerCallback() {
    if (gameState != 1) {
        return;
    }
    let elapsed = Date.now() - startTimestamp;
    let seconds = Math.floor(elapsed / 1000);
    timer.innerText = seconds;

    setTimeout(timerCallback, 100);
}


function setRngSeed() {
    const url = new URL(window.location);
    let seed;
    if (loadedWithSeed) {
        loadedWithSeed = false;
        seed = url.searchParams.get("seed");
    } else {
        seed = Math.floor(Math.random() * 1000000);
        url.searchParams.set("seed", seed);
        window.history.pushState({}, "", url);
    }

    rng = mulberry32(Number(seed));
}


// Called when start_button is pressed
function startGame() {
    if (gameState == 1) {
        restartClickedCounter++;
    }

    gameState = 1;

    cellsRevealed = 0;
    flagsPlaced = 0;

    counter.innerText = mines;

    startButton.innerText = "Genstart";
    setButtonColor(buttonStartedColor, buttonStartedHover);

    setRngSeed();

    board = createBoard(rows, cols);
    drawBoard(board);

    startTimestamp = Date.now();
    timerCallback();

    if (restartClickedCounter > 3) {
        restartClickedCounter = 0;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(restartMinkImg, 0, 0, canvas.width, canvas.height);
    }
}


function createBoard(rows, cols) {
    // Create empty board
    let board = [];
    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            row.push({ mine: false, revealed: false, flagged: false, count: 0 });
        }
        board.push(row);
    }

    // Set cell size
    if (canvas.width > canvas.height) {
        cellSize = canvas.width / cols;
    } else {
        cellSize = canvas.height / rows;
    }

    return board;
}


function placeMines(first_cell) {
    let placed = 0;
    while (placed < mines) {
        let row = Math.floor(rng() * rows);
        let col = Math.floor(rng() * cols);

        if (!board[row][col].mine && row != first_cell[0] && col != first_cell[1]) {
            board[row][col].mine = true;
            placed++;
        }
    }

    // Count mines around each cell
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (board[i][j].mine) {
                continue;
            }

            let count = 0;
            for (let k = i - 1; k <= i + 1; k++) {
                if (k < 0 || k >= rows) {
                    continue;
                }
                for (let l = j - 1; l <= j + 1; l++) {
                    if (l == j && k == i) {
                        continue;
                    }
                    if (k >= 0 && k < rows && l >= 0 && l < cols && board[k][l].mine) {
                        count++;
                    }
                }
            }

            board[i][j].count = count;
        }
    }
}

function drawBoard(board) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            context.drawImage(boxImg, j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
}


function drawSquare(row, col) {
    let cell = board[row][col];

    if (cell.revealed) {
        // Draw box with border
        context.fillStyle = "rgb(192, 192, 192)";
        context.strokeStyle = "rgb(129, 129, 129)";
        let lineWidth = 2;
        context.lineWidth = lineWidth;
        context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        context.strokeRect(col * cellSize + 1, row * cellSize + 1, cellSize - lineWidth, cellSize - lineWidth);
        // context.strokeRect(col * cellSize + lineWidth, row * cellSize + lineWidth, cellSize - 2 * lineWidth, cellSize - 2 * lineWidth);

        if (cell.mine) {
            // Draw mine (minkImg)
            let scale = 1;
            let margin = (1 - scale) * cellSize / 2;
            context.drawImage(minkImg, col * cellSize + margin, row * cellSize + margin, scale * cellSize, scale * cellSize);
        } else if (cell.count > 0) {
            // Draw number
            context.font = numbers_font;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = numberColors[cell.count - 1];
            context.fillText(cell.count, col * cellSize + cellSize / 2, row * cellSize + cellSize / 2);
        }
    }

    if (cell.flagged) {
        // Draw flag (knifeImg)
        let scale = 0.8;
        let margin = (1 - scale) * cellSize / 2;
        context.drawImage(knifeImg, col * cellSize + margin, row * cellSize + margin, scale * cellSize, scale * cellSize);
    }

    if (!cell.revealed && !cell.flagged) {
        // Draw box
        context.drawImage(boxImg, col * cellSize, row * cellSize, cellSize, cellSize);
    }
}


function checkWin() {
    if (cellsRevealed == rows * cols - mines && flagsPlaced == mines) {
        gameWon();
    }
}


function gameWon() {
    gameState = 2;
    revealMines();
    setButtonColor(buttonDefaultColor, buttonDefaultHover);
    document.getElementById("timePerMink").innerText = (parseInt(timer.innerText) / mines).toFixed(1);
    gameWonAnimation();
}


/* 
function fadeElementsOut2() {
    // Fade body background color to black
    let bg = document.getElementsByTagName("body")[0];
    bg.style.transition = "background-color 5s";
    bg.style.backgroundColor = "rgba(0, 0, 0, 1)";
    

    // Fade elements with fade class out over 3 seconds
    let elements = document.getElementsByClassName("fade");
    let currentOpacity = 1;
    let fadeTime = 2500;
    let fadeStep = 0.01;

    let fadeOut = setInterval(function() {
        currentOpacity -= fadeStep;
        if (currentOpacity <= 0) {
            clearInterval(fadeOut);
            for (let i = 0; i < elements.length; i++) {
                elements[i].style.display = "none";
            }
        } else {
            for (let i = 0; i < elements.length; i++) {
                elements[i].style.opacity = currentOpacity;
            }
        }
    }, fadeTime * fadeStep);
}
*/


function gameWonAnimation() {
    fadeElementsOut("rgba(135, 0, 0, 1)");

    setTimeout(fadeInGameWonImg, 3000);
}


function fadeInGameWonImg() {
    let gameWonScreen = document.getElementById("gameWonScreen");
    gameWonScreen.classList.remove("hidden");
    gameWonScreen.classList.add("slowervisible");
    gameWonButton.style.display = "";
}


function gameWonButtonPressed() {
    let gameWonScreen2 = document.getElementById("gameWonScreen2");
    gameWonScreen2.classList.add("slowvisible");
    gameWonScreen2.classList.remove("hidden");

    gameWonButton.style.display = "none";
    // gameWonButton2.style.display = "none";

    beepSound.play();

    // TODO: fix button fade in

    setTimeout(() => {
        let gameWonScreen = document.getElementById("gameWonScreen");
        gameWonScreen.classList.remove("slowervisible");
        gameWonScreen.classList.add("hidden");
        gameWonButton2.style.display = "";
        gameWonButton2.classList.remove("hidden");
        gameWonButton2.classList.add("visible");
    }, 6000);
}


function gameWonButtonPressed2() {
    let gameWonScreen2 = document.getElementById("gameWonScreen2");
    gameWonScreen2.classList.remove("slowvisible");
    gameWonScreen2.classList.add("hidden");

    gameWonButton2.classList.remove("visible");
    gameWonButton2.classList.add("hidden");

    setTimeout(fadeElementsIn, 3000);
}


function gameLostAnimation() {
    fadeElementsOut("rgba(0, 0, 0, 1)");
    setTimeout(fadeInGameLostImg, 4000);
}


function fadeInGameLostImg() {
    let gameLostScreen = document.getElementById("gameLostScreen");
    gameLostScreen.classList.remove("hidden");
    gameLostScreen.classList.add("slowervisible");
    gameLostButton.style.display = "";

    setTimeout(lossSound.play(), 6000);
}


function gameLostButtonPressed() {
    // console.log("gameLostButtonPressed");
    let gameLostScreen = document.getElementById("gameLostScreen");
    gameLostScreen.classList.add("hidden");
    gameLostScreen.classList.remove("slowervisible");

    setTimeout(fadeElementsIn, 2500);
}


function fadeElementsOut(bgColor) {
    // Fade body background color to black
    let bg = document.getElementsByTagName("body")[0];
    bg.style.transition = "background-color 5s";
    bg.style.backgroundColor = bgColor;

    startButton.style.display = "none";

    // apply .hidden css to all elements with class .fade
    let elements = document.getElementsByClassName("fade");
    for (let i = 0; i < elements.length; i++) {
        elements[i].classList.remove("visible");
        elements[i].classList.add("hidden");
    }
}


function fadeElementsIn() {
    // Fade body background color to white
    let bg = document.getElementsByTagName("body")[0];
    bg.style.transition = "background-color 5s";
    bg.style.backgroundColor = screenBgColor;

    // remove .hidden css from all elements with class .fade, and add .visible
    let elements = document.getElementsByClassName("fade");
    for (let i = 0; i < elements.length; i++) {
        elements[i].classList.remove("hidden");
        elements[i].classList.add("visible");
    }

    // startButton.classList.add("visible");
    startButton.style.display = "";
    gameLostButton.style.display = "none";
    gameWonButton.style.display = "none";
    gameWonButton2.style.display = "none";
}


function revealMines() {
    // Reveal all mines
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j].mine) {
                board[i][j].revealed = true;
                drawSquare(i, j);
            }
        }
    }
}


function gameLost() {
    gameState = 2;
    revealMines()
    setButtonColor(buttonLostColor, buttonLostHover);

    // If there are any flags placed on a mine, the game is really lost,
    // so call fadeElementsOut
    let minesFlagged = 0;
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j].mine && board[i][j].flagged) {
                minesFlagged++;
            }
        }
    }

    if (minesFlagged > 0) {
        document.getElementById("minkKilled").innerText = `${minesFlagged} ud af ${mines}`;
        gameLostAnimation();
    }
}


function setButtonColor(bgColor, hoverColor) {
    currentButtonColor = bgColor;
    currentButtonHover = hoverColor;
    startButton.style.backgroundColor = currentButtonColor;
}


startButton.onmouseenter = function () {
    startButton.style.backgroundColor = currentButtonHover;
}

startButton.onmouseleave = function () {
    startButton.style.backgroundColor = currentButtonColor;
}


// --- Info pop-up ---
document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('infoButton');
    const infoOverlay = document.getElementById('infoOverlay');
    const infoModal = document.getElementById('infoModal');
    const infoClose = document.getElementById('infoClose');

    if (!infoButton || !infoOverlay || !infoModal || !infoClose) {
        return; // Nothing to do if elements not present
    }

    function openInfo() {
        infoOverlay.classList.add('info-show');
        requestAnimationFrame(() => infoModal.classList.add('info-show'));

        // Prevent background scroll while pop-up is open
        document.body.style.overflow = 'hidden';
    }

    function closeInfo() {
        infoModal.classList.remove('info-show');

        // Remove overlay's visible state after animation finishes
        setTimeout(() => {
            infoOverlay.classList.remove('info-show');
        }, 100);

        // Allow background scrolling again
        document.body.style.overflow = '';
    }

    infoButton.addEventListener('click', openInfo);
    infoClose.addEventListener('click', closeInfo);

    // Clicking outside the pop-up closes it
    infoOverlay.addEventListener('click', (e) => {
        if (e.target === infoOverlay) {
            closeInfo();
        }
    });

    // ESC key also closes it
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoModal.classList.contains('info-show')) {
            closeInfo();
        }
    });
});



