
// Script for Minesweeper game

let canvas = document.querySelector("#canvas");
let context = canvas.getContext("2d");

let startTimestamp = null;

let timer = document.querySelector("#time_number");



function timerCallback() {
    let elapsed = Date.now() - startTimestamp;
    let seconds = Math.floor(elapsed / 1000);
    timer.innerText = seconds;

    setTimeout(timerCallback, 100);
}


function startGame() {
    // Start timer
    startTimestamp = Date.now();
    timerCallback();

    let rows = 20;
    let cols = 30;
    let mines = 10;

    let board = createBoard(rows, cols, mines);
    drawBoard(board);

    canvas.addEventListener("click", function(event) {
        let x = event.offsetX;
        let y = event.offsetY;

        let row = Math.floor(y / 20);
        let col = Math.floor(x / 20);

        if (board[row][col].mine) {
            gameOver();
        } else {
            board[row][col].revealed = true;
            drawBoard(board);
        }
    });

    canvas.addEventListener("contextmenu", function(event) {
        event.preventDefault();

        let x = event.offsetX;
        let y = event.offsetY;

        let row = Math.floor(y / 20);
        let col = Math.floor(x / 20);

        board[row][col].flagged = !board[row][col].flagged;
        drawBoard(board);
    });

}

function createBoard(rows, cols, mines) {
    let board = [];
    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            row.push({mine: false, revealed: false, flagged: false, count: 0});
        }
        board.push(row);
    }

    let count = 0;
    while (count < mines) {
        let row = Math.floor(Math.random() * rows);
        let col = Math.floor(Math.random() * cols);

        if (!board[row][col].mine) {
            board[row][col].mine = true;
            count++;
        }
    }

    return board;
}

function drawBoard(board) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    let cellSize;
    if (canvas.width / board[0].length < canvas.height / board.length) {
        cellSize = canvas.width / board[0].length;
    } else {
        cellSize = canvas.height / board.length;
    }

    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            let cell = board[i][j];

            context.strokeStyle = "black";
            // context.strokeRect(j * 20, i * 20, 20, 20);
            context.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);

            if (cell.revealed) {
                if (cell.mine) {
                    context.fillStyle = "red";
                    // context.fillRect(j * 20, i * 20, 20, 20);
                } else {
                    context.fillStyle = "gray";
                    // context.fillRect(j * 20, i * 20, 20, 20);

                    if (cell.count > 0) {
                        context.fillStyle = "black";
                        context.font = "12px Arial";
                        // context.fillText(cell.count, j * 20 + 5, i * 20 + 15);
                    }
                }
            } else if (cell.flagged) {
                context.fillStyle = "yellow";
                // context.fillRect(j * 20, i * 20, 20, 20);
            }
        }
    }
}




