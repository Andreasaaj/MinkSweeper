
let rows = 12;
let cols = 18;
let mines = 32;

let cellSize;
let flagsPlaced = 0;
let cellsRevealed = 0;

let gameState = 0; // 0: not started, 1: started, 2: finished
let board = [];

let numberColors = ["blue", "green", "red", "purple", "maroon", "turquoise", "black", "gray"];

let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");

let startButton = document.getElementById("start_button");
let buttonDefaultColor = startButton.style.backgroundColor;
let buttonDefaultHover = "rgba(0, 255, 0, 0.9)";
let buttonStartedColor = "rgba(255, 255, 0, 0.5)";
let buttonStartedHover = "rgba(255, 255, 0, 0.9)";
let buttonLostColor = "rgba(255, 0, 0, 0.5)";
let buttonLostHover = "rgba(255, 0, 0, 0.9)";

let currentButtonColor = buttonDefaultColor;
let currentButtonHover = buttonDefaultHover;

let timer = document.getElementById("time_number");
let counter = document.getElementById("mink_left_number");

let boxImg = new Image();
boxImg.src = "Images/box.gif";

let startTimestamp = null;


canvas.addEventListener("click", function(event) {
    if (gameState != 1) {
        return;
    }

    let x = event.offsetX;
    let y = event.offsetY;
    let row = Math.floor(y / cellSize);
    let col = Math.floor(x / cellSize);
    let cell = board[row][col];

    if (!cell.revealed) {
        if (cell.flagged) {
            flagsPlaced--;
            counter.innerText = mines - flagsPlaced;
            cell.flagged = false;
        }

        if (cell.mine) {
            gameOver();
        } else {
            revealCells(row, col);
            checkWin();
        }
    }
});


canvas.addEventListener("contextmenu", function(event) {
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
    
});


function revealCells(row, col) {
    let cell = board[row][col];
    cell.revealed = true;
    cellsRevealed++;
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
                    board[i][j].revealed = true;
                    cellsRevealed++;
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


function startGame() {
    gameState = 1;

    startTimestamp = Date.now();
    timerCallback();

    cellsRevealed = 0;
    flagsPlaced = 0;

    counter.innerText = mines;

    startButton.innerText = "Genstart";
    setButtonColor(buttonStartedColor, buttonStartedHover);

    board = createBoard(rows, cols, mines);
    drawBoard(board);
}


function createBoard(rows, cols, n_mines) {
    // Create empty board
    let board = [];
    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            row.push({mine: false, revealed: false, flagged: false, count: 0});
        }
        board.push(row);
    }

    // Place mines
    let count = 0;
    while (count < n_mines) {
        let row = Math.floor(Math.random() * rows);
        let col = Math.floor(Math.random() * cols);

        if (!board[row][col].mine) {
            board[row][col].mine = true;
            count++;
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

    // Set cell size
    if (canvas.width > canvas.height) {
        cellSize = canvas.width / cols;
    } else {
        cellSize = canvas.height / rows;
    }

    return board;
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
            // Draw mine
            context.fillStyle = "red";
            context.beginPath();
            context.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 3, 0, 2 * Math.PI);
            context.fill();
        } else if (cell.count > 0){
            // Draw number
            context.font = "30px Arial bold";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = numberColors[cell.count - 1];
            context.fillText(cell.count, col * cellSize + cellSize / 2, row * cellSize + cellSize / 2);
        }
    } else if (cell.flagged) {
        // Draw flag
        context.fillStyle = "blue";
        context.beginPath();
        context.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 3, 0, 2 * Math.PI);
        context.fill();
    } else {
        // Draw box
        context.drawImage(boxImg, col * cellSize, row * cellSize, cellSize, cellSize);
    }
}


function checkWin() {
    // let count = 0;
    // for (let i = 0; i < board.length; i++) {
    //     for (let j = 0; j < board[i].length; j++) {
    //         if (board[i][j].revealed) {
    //             count++;
    //         }
    //     }
    // }
    // console.log(count, cellsRevealed);


    if (cellsRevealed == rows * cols - mines) {
        gameState = 2;
        setButtonColor(buttonDefaultColor, buttonDefaultHover);
    }
}


function gameOver() {
    gameState = 2;

    // Reveal all mines
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j].mine) {
                board[i][j].revealed = true;
                drawSquare(i, j);
            }
        }
    }


    setButtonColor(buttonLostColor, buttonLostHover);
}


function setButtonColor(bgColor, hoverColor) {
    currentButtonColor = bgColor;
    currentButtonHover = hoverColor;
    startButton.style.backgroundColor = currentButtonColor;
}


startButton.onmouseenter = function() {
    startButton.style.backgroundColor = currentButtonHover;
}

startButton.onmouseleave = function() {
    startButton.style.backgroundColor = currentButtonColor;
}



