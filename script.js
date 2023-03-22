const fenToArr = (fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") => {
  const field = fen.split(" ");
  const files = field[0].split("/");
  const arr = [...Array(8)].map((ele) => Array(8));
  for (let i = 0; i < files.length; i++) {
    for (let j = 0; j < files[i].length; j++) {
      if (!isNaN(files[i][j])) {
        j += files[i][j] - 1;
      } else {
        arr[i][j] = [
          files[i][j],
          files[i][j] == files[i][j].toLowerCase() ? 0 : 1,
        ];
      }
    }
  }
  return arr;
};

const chessBoard = document.querySelector(".chess-board");
let currentPos = "4k2r/6r1/8/8/8/8/3R4/R3K3 w Qk - 0 1";
const pieceIn = [new Map(), new Map()];
let activePiece = null;
let activeOriginalPos = null;
let isDown = false;
const board = fenToArr();
let promoting = false;
const captureAudio = new Audio("./chess_assets/capture.mp3");
const moveAudio = new Audio("./chess_assets/move-self.mp3");
const over = new Audio("./chess_assets/check-mate.mp3");
let turn = 1;
let touchx = 0;
let touchy = 0;
let canEnpass = false;
let enpassPiece = null;
let state = false;
let castleRightsWhiteKingSide = true;
let castleRightsWhiteQueenSide = true;
let castleRightsBlackKingSide = true;
let castleRightsBlackQueenSide = true;
let run = true;
let clicked = false;
const pieces = {
  r: "br",
  n: "bn",
  b: "bb",
  k: "bk",
  q: "bq",
  R: "wr",
  N: "wn",
  B: "wb",
  K: "wk",
  Q: "wq",
  p: "bp",
  P: "wp",
};

function arrIn(arr1, arr2) {
  for (let i = 0; i < arr1.length; i++) {
    if (JSON.stringify(arr1[i]) == JSON.stringify(arr2)) {
      return true;
    }
  }
  return false;
}

const createHighLight = (
  color,
  top,
  left,
  pieceThere = false,
  debug = false
) => {
  const highlights = document.querySelector(".highlights");
  const highlightSq = document.createElement("div");
  highlightSq.classList.add("highlightSq");
  highlightSq.style.width = `${chessBoard.getBoundingClientRect().width / 8}px`;
  highlightSq.style.height = `${
    chessBoard.getBoundingClientRect().height / 8
  }px`;
  if (color == "dot") {
    const cir = document.createElement("div");
    if (pieceThere) {
      cir.classList.add("outer-circle");
      highlightSq.append(cir);
    } else {
      cir.classList.add("circle");
      highlightSq.append(cir);
    }
  } else {
    highlightSq.style.backgroundColor = color;
  }
  highlightSq.style.top = `${top}px`;
  highlightSq.style.left = `${left}px`;
  highlights.append(highlightSq);
};

function clearHighLight() {
  const highlights = document.querySelector(".highlights");
  highlights.innerHTML = "";
}

const inCheck = (color, boardToCheck, pieceIn) => {
  const attacker = color == 1 ? 0 : 1;
  let king = [0, 0];
  for (let i = 0; i < boardToCheck.length; i++) {
    for (let j = 0; j < boardToCheck[0].length; j++) {
      if (boardToCheck[i][j]) {
        if (
          boardToCheck[i][j][0].toLowerCase() == "k" &&
          boardToCheck[i][j][1] == color
        ) {
          king[0] = j;
          king[1] = i;
        }
      }
    }
  }
  // let pieceInValues = Array.from(pieceIn[attacker].values());
  for (const [key, val] of pieceIn[attacker]) {
    const from = [parseInt(key[0]), parseInt(key[1])];
    const moves = validMove(from, val, boardToCheck, attacker, false);
    if (arrIn(moves, king)) {
      return true;
    }
  }
  // for (let i = 0; i < boardToCheck.length; i++) {
  //   for (let j = 0; j < boardToCheck[i].length; j++) {
  //     if (boardToCheck[i][j] && boardToCheck[i][j][1] == attacker) {
  //       console.log(from);
  //       const moves = validMove(
  //         from,
  //         pieceIn[attacker][i],
  //         boardToCheck,
  //         attacker,
  //         false
  //       );
  //       if (arrIn(moves, king)) {
  //         return true;
  //       }
  //     }
  //   }
  // }
  return false;
};

function validMove(moveFrom, piece, board, turn, canChecked = true) {
  const color = parseInt(piece.dataset.color);
  if (color != turn) return [];
  const pieceType = piece.dataset.name.toLowerCase();
  const moves = [];
  if (pieceType == "p") {
    let start = moveFrom;
    let moveDir = color == 1 ? -1 : 1;
    if (
      ((start[1] == 6 && color == 1) || (start[1] == 1 && color == 0)) &&
      !board[start[1] + 2 * moveDir][start[0]]
    ) {
      moves.push([start[0], start[1] + 2 * moveDir]);
    }
    if (
      start[1] + 1 * moveDir <= 7 &&
      start[1] + 1 * moveDir >= 0 &&
      !board[start[1] + 1 * moveDir][start[0]]
    ) {
      moves.push([start[0], start[1] + 1 * moveDir]);
    }
    let dia1 =
      start[1] + 1 * moveDir <= 7 &&
      start[1] + 1 * moveDir >= 0 &&
      start[0] + 1 <= 7 &&
      start[0] + 1 >= 0
        ? board[start[1] + 1 * moveDir][start[0] + 1]
        : undefined;
    let dia2 =
      start[1] + 1 * moveDir <= 7 &&
      start[1] + 1 * moveDir >= 0 &&
      start[0] - 1 <= 7 &&
      start[0] + 1 >= 0
        ? board[start[1] + 1 * moveDir][start[0] - 1]
        : undefined;
    if (dia1) {
      let dia_cl = pieces[dia1[0]][0] == "w" ? 1 : 0;
      if (color != dia_cl) moves.push([start[0] + 1, start[1] + 1 * moveDir]);
    }
    if (dia2) {
      let dia_cl = pieces[dia2[0]][0] == "w" ? 1 : 0;
      if (color != dia_cl) moves.push([start[0] - 1, start[1] + 1 * moveDir]);
    }

    if (canEnpass) {
      if (
        ((color == 1 && start[1] == 3) || (color == 0 && start[1] == 4)) &&
        board[start[1]][start[0] + 1] &&
        board[start[1]][start[0] + 1][0].toLowerCase() == "p" &&
        (pieces[board[start[1]][start[0] + 1][0]][0] == "w" ? 1 : 0) != color &&
        start[1] == enpassPiece[1] &&
        start[0] + 1 == enpassPiece[0] &&
        !board[start[1] + 1 * moveDir][start[0] + 1]
      ) {
        moves.push([start[0] + 1, start[1] + 1 * moveDir]);
      } else if (
        ((color == 1 && start[1] == 3) || (color == 0 && start[1] == 4)) &&
        board[start[1]][start[0] - 1] &&
        board[start[1]][start[0] - 1][0].toLowerCase() == "p" &&
        (pieces[board[start[1]][start[0] - 1][0]][0] == "w" ? 1 : 0) != color &&
        start[1] == enpassPiece[1] &&
        start[0] - 1 == enpassPiece[0] &&
        !board[start[1] + 1 * moveDir][start[0] - 1]
      ) {
        moves.push([start[0] - 1, start[1] + 1 * moveDir]);
      }
    }
  } else if (pieceType == "r") {
    let start = moveFrom;
    for (let i = start[0] + 1; i <= 7; i++) {
      if (board[start[1]][i]) {
        if (board[start[1]][i][1] != color) {
          moves.push([i, start[1]]);
        }
        break;
      }
      moves.push([i, start[1]]);
    }
    for (let i = start[0] - 1; i >= 0; i--) {
      if (board[start[1]][i]) {
        if (board[start[1]][i][1] != color) {
          moves.push([i, start[1]]);
        }
        break;
      }
      moves.push([i, start[1]]);
    }
    for (let i = start[1] + 1; i <= 7; i++) {
      if (board[i][start[0]]) {
        if (board[i][start[0]][1] != color) {
          moves.push([start[0], i]);
        }
        break;
      }
      moves.push([start[0], i]);
    }
    for (let i = start[1] - 1; i >= 0; i--) {
      if (board[i][start[0]]) {
        if (board[i][start[0]][1] != color) {
          moves.push([start[0], i]);
        }
        break;
      }
      moves.push([start[0], i]);
    }
  } else if (pieceType == "b") {
    let start = moveFrom;
    let i = start[0] + 1;
    let j = start[1] + 1;
    while (i <= 7 && j <= 7) {
      if (board[j][i]) {
        if (board[j][i][1] != color) {
          moves.push([i, j]);
        }
        break;
      }
      moves.push([i, j]);
      i++;
      j++;
    }
    i = start[0] - 1;
    j = start[1] - 1;
    while (i >= 0 && j >= 0) {
      if (board[j][i]) {
        if (board[j][i][1] != color) {
          moves.push([i, j]);
        }
        break;
      }
      moves.push([i, j]);
      i--;
      j--;
    }
    i = start[0] + 1;
    j = start[1] - 1;
    while (i <= 7 && j >= 0) {
      if (board[j][i]) {
        if (board[j][i][1] != color) {
          moves.push([i, j]);
        }
        break;
      }
      moves.push([i, j]);
      i++;
      j--;
    }
    i = start[0] - 1;
    j = start[1] + 1;
    while (i >= 0 && j <= 7) {
      if (board[j][i]) {
        if (board[j][i][1] != color) {
          moves.push([i, j]);
        }
        break;
      }
      moves.push([i, j]);
      i--;
      j++;
    }
  } else if (pieceType == "q") {
    let start = moveFrom;

    for (let i = start[0] + 1; i <= 7; i++) {
      if (board[start[1]][i]) {
        if (board[start[1]][i][1] != color) {
          moves.push([i, start[1]]);
        }
        break;
      }
      moves.push([i, start[1]]);
    }
    for (let i = start[0] - 1; i >= 0; i--) {
      if (board[start[1]][i]) {
        if (board[start[1]][i][1] != color) {
          moves.push([i, start[1]]);
        }
        break;
      }
      moves.push([i, start[1]]);
    }
    for (let i = start[1] + 1; i <= 7; i++) {
      if (board[i][start[0]]) {
        if (board[i][start[0]][1] != color) {
          moves.push([start[0], i]);
        }
        break;
      }
      moves.push([start[0], i]);
    }
    for (let i = start[1] - 1; i >= 0; i--) {
      if (board[i][start[0]]) {
        if (board[i][start[0]][1] != color) {
          moves.push([start[0], i]);
        }
        break;
      }
      moves.push([start[0], i]);
    }
    let i = start[0] + 1;
    let j = start[1] + 1;
    while (i <= 7 && j <= 7) {
      if (board[j][i]) {
        if (board[j][i][1] != color) {
          moves.push([i, j]);
        }
        break;
      }
      moves.push([i, j]);
      i++;
      j++;
    }
    i = start[0] - 1;
    j = start[1] - 1;
    while (i >= 0 && j >= 0) {
      if (board[j][i]) {
        if (board[j][i][1] != color) {
          moves.push([i, j]);
        }
        break;
      }
      moves.push([i, j]);
      i--;
      j--;
    }
    i = start[0] + 1;
    j = start[1] - 1;
    while (i <= 7 && j >= 0) {
      if (board[j][i]) {
        if (board[j][i][1] != color) {
          moves.push([i, j]);
        }
        break;
      }
      moves.push([i, j]);
      i++;
      j--;
    }
    i = start[0] - 1;
    j = start[1] + 1;
    while (i >= 0 && j <= 7) {
      if (board[j][i]) {
        if (board[j][i][1] != color) {
          moves.push([i, j]);
        }
        break;
      }
      moves.push([i, j]);
      i--;
      j++;
    }
  } else if (pieceType == "n") {
    let start = moveFrom;
    let move = [
      [start[0] + 2, start[1] + 1],
      [start[0] + 2, start[1] - 1],
      [start[0] - 2, start[1] + 1],
      [start[0] - 2, start[1] - 1],
      [start[0] + 1, start[1] + 2],
      [start[0] + 1, start[1] - 2],
      [start[0] - 1, start[1] + 2],
      [start[0] - 1, start[1] - 2],
    ];
    for (let i = 0; i < move.length; i++) {
      if (
        move[i][1] >= 0 &&
        move[i][1] <= 7 &&
        move[i][0] >= 0 &&
        move[i][0] <= 7
      ) {
        if (board[move[i][1]][move[i][0]]) {
          if (board[move[i][1]][move[i][0]][1] != color) {
            moves.push([move[i][0], move[i][1]]);
          }
        } else {
          moves.push([move[i][0], move[i][1]]);
        }
      }
    }
  } else if (pieceType == "k") {
    let start = moveFrom;
    if (start[0] + 1 <= 7 && start[1] + 1 <= 7) {
      if (board[start[1] + 1][start[0] + 1]) {
        if (board[start[1] + 1][start[0] + 1][1] != color) {
          moves.push([start[0] + 1, start[1] + 1]);
        }
      } else {
        moves.push([start[0] + 1, start[1] + 1]);
      }
    }
    if (start[0] + 1 <= 7 && start[1] - 1 >= 0) {
      if (board[start[1] - 1][start[0] + 1]) {
        if (board[start[1] - 1][start[0] + 1][1] != color) {
          moves.push([start[0] + 1, start[1] - 1]);
        }
      } else {
        moves.push([start[0] + 1, start[1] - 1]);
      }
    }
    if (start[0] - 1 >= 0 && start[1] + 1 <= 7) {
      if (board[start[1] + 1][start[0] - 1]) {
        if (board[start[1] + 1][start[0] - 1][1] != color) {
          moves.push([start[0] - 1, start[1] + 1]);
        }
      } else {
        moves.push([start[0] - 1, start[1] + 1]);
      }
    }
    if (start[0] - 1 >= 0 && start[1] - 1 >= 0) {
      if (board[start[1] - 1][start[0] - 1]) {
        if (board[start[1] - 1][start[0] - 1][1] != color) {
          moves.push([start[0] - 1, start[1] - 1]);
        }
      } else {
        moves.push([start[0] - 1, start[1] - 1]);
      }
    }
    if (start[0] + 1 <= 7) {
      if (board[start[1]][start[0] + 1]) {
        if (board[start[1]][start[0] + 1][1] != color) {
          moves.push([start[0] + 1, start[1]]);
        }
      } else {
        moves.push([start[0] + 1, start[1]]);
      }
    }
    if (start[0] - 1 >= 0) {
      if (board[start[1]][start[0] - 1]) {
        if (board[start[1]][start[0] - 1][1] != color) {
          moves.push([start[0] - 1, start[1]]);
        }
      } else {
        moves.push([start[0] - 1, start[1]]);
      }
    }
    if (start[1] + 1 <= 7) {
      if (board[start[1] + 1][start[0]]) {
        if (board[start[1] + 1][start[0]][1] != color) {
          moves.push([start[0], start[1] + 1]);
        }
      } else {
        moves.push([start[0], start[1] + 1]);
      }
    }
    if (start[1] - 1 >= 0) {
      if (board[start[1] - 1][start[0]]) {
        if (board[start[1] - 1][start[0]][1] != color) {
          moves.push([start[0], start[1] - 1]);
        }
      } else {
        moves.push([start[0], start[1] - 1]);
      }
    }
    if (
      ((color == 1 && castleRightsWhiteKingSide) ||
        (color == 0 && castleRightsBlackKingSide)) &&
      ((board[color == 1 ? 7 : 0][7] &&
        board[color == 1 ? 7 : 0][7][0] == "R" &&
        color == 1) ||
        (board[color == 1 ? 7 : 0][7] &&
          board[color == 1 ? 7 : 0][7][0] == "r" &&
          color == 0)) &&
      !board[color == 1 ? 7 : 0][5] &&
      !board[color == 1 ? 7 : 0][6]
    ) {
      const pieceInCopy = [...pieceIn].map((ele) => new Map(ele));
      const newBoard = [...board].map((ele) => Array.from(ele));
      newBoard[color == 1 ? 7 : 0][4] = undefined;
      let temp = pieceInCopy[color].get(`4${color == 1 ? 7 : 0}`);
      let x;
      for (let i = 4; i <= 6; i++) {
        newBoard[color == 1 ? 7 : 0][i] = [color == 1 ? "K" : "k", color];
        pieceInCopy[color].set(`${i}${color == 1 ? 7 : 0}`, temp);
        if (canChecked) {
          x = inCheck(color, newBoard, pieceInCopy);
        } else {
          x = true;
        }
        if (x) {
          break;
        }
        pieceInCopy[color].delete(`${i}${color == 1 ? 7 : 0}`);
        newBoard[color == 1 ? 7 : 0][i] = undefined;
      }
      if (!x) {
        moves.push([6, color == 1 ? 7 : 0]);
      }
    }
    if (
      ((color == 1 && castleRightsWhiteQueenSide) ||
        (color == 0 && castleRightsBlackQueenSide)) &&
      ((board[color == 1 ? 7 : 0][0] &&
        board[color == 1 ? 7 : 0][0][0] == "R" &&
        color == 1) ||
        (board[color == 1 ? 7 : 0][0] &&
          board[color == 1 ? 7 : 0][0][0] == "r" &&
          color == 0)) &&
      !board[color == 1 ? 7 : 0][3] &&
      !board[color == 1 ? 7 : 0][2] &&
      !board[color == 1 ? 7 : 0][1]
    ) {
      const pieceInCopy = [...pieceIn].map((ele) => new Map(ele));
      const newBoard = [...board].map((ele) => Array.from(ele));
      newBoard[color == 1 ? 7 : 0][4] = undefined;
      let temp = pieceInCopy[color].get(`4${color == 1 ? 7 : 0}`);
      let x;
      for (let i = 4; i > 1; i--) {
        newBoard[color == 1 ? 7 : 0][i] = [color == 1 ? "K" : "k", color];
        pieceInCopy[color].set(`${i}${color == 1 ? 7 : 0}`, temp);
        if (canChecked) {
          x = inCheck(color, newBoard, pieceInCopy);
        } else {
          x = true;
        }
        if (x) {
          break;
        }
        pieceInCopy[color].delete(`${i}${color == 1 ? 7 : 0}`);
        newBoard[color == 1 ? 7 : 0][i] = undefined;
      }
      if (!x) {
        moves.push([2, color == 1 ? 7 : 0]);
      }
    }
  }
  let x = [];
  if (!canChecked) return moves;
  if (canChecked) {
    for (let i = 0; i < moves.length; i++) {
      const pieceInCopy = [...pieceIn].map((ele) => new Map(ele));
      const newBoard = [...board].map((ele) => Array.from(ele));
      newBoard[moves[i][1]][moves[i][0]] = [
        piece.dataset.name,
        parseInt(piece.dataset.color),
      ];
      newBoard[moveFrom[1]][moveFrom[0]] = undefined;
      let cColor = color == 0 ? 1 : 0;
      if (
        canEnpass &&
        moves[i][0] == enpassPiece[0] &&
        moves[i][1] + (color == 1 ? 1 : -1) == enpassPiece[1] &&
        pieceType == "p"
      ) {
        newBoard[enpassPiece[1]][enpassPiece[0]] = undefined;
        pieceInCopy[cColor].delete(`${enpassPiece[0]}${enpassPiece[1]}`);
      }
      // if(board[moves[i][1]][moves][i][0])
      pieceInCopy[cColor].delete(`${moves[i][0]}${moves[i][1]}`);
      pieceInCopy[color].set(
        `${moves[i][0]}${moves[i][1]}`,
        pieceInCopy[color].get(`${moveFrom[0]}${moveFrom[1]}`)
      );
      pieceInCopy[color].delete(`${moveFrom[0]}${moveFrom[1]}`);

      // for (let j = 0; j < pieceInCopy[cColor].length; j++) {
      //   if (
      //     pieceInCopy[cColor][j].dataset.x == moves[i][0] &&
      //     pieceInCopy[cColor][j].dataset.y == moves[i][1]
      //   ) {
      //     pieceInCopy[cColor].splice(j, 1);
      //   }
      // }
      // console.log(newBoard);
      if (inCheck(color, newBoard, pieceInCopy)) {
        x.push(i);
      }
    }
    for (let i = x.length - 1; i >= 0; i--) {
      moves.splice(x[i], 1);
    }
  }
  return moves;
}

function checkGameOver(color) {
  let moveAvailable;
  for (const [key, val] of pieceIn[color].entries()) {
    moveAvailable = validMove(
      [parseInt(key[0]), parseInt(key[1])],
      val,
      board,
      color,
      true
    );
    if (moveAvailable.length != 0) return false;
  }
  over.play();
  if (inCheck(color, board, pieceIn)) {
    return `${color == 0 ? "White Wins by" : "Black Wins by"} Check Mate`;
  } else {
    return "Draw by stale mate";
  }
}

const updatePos = (ele, piece, mx, t = true, x = 0, y = 0) => {
  if (t) {
    piece.style.left = `${
      mx.clientX - (chessBoard.getBoundingClientRect().left + ele.width / 2)
    }px`;
    piece.style.top = `${
      mx.clientY - (chessBoard.getBoundingClientRect().top + ele.height / 2)
    }px`;
  } else {
    piece.style.left = `${
      x - (chessBoard.getBoundingClientRect().left + ele.width / 2)
    }px`;
    piece.style.top = `${
      y - (chessBoard.getBoundingClientRect().top + ele.height / 2)
    }px`;
  }
};

document.addEventListener("mousemove", (e) => {
  if (isDown) {
    updatePos(activeOriginalPos, activePiece, e);
  }
});
document.addEventListener("touchmove", (e) => {
  e.preventDefault();
  touchx = 0;
  touchy = 0;
  if (e.touches && e.touches[0]) {
    touchx = e.touches[0].clientX;
    touchy = e.touches[0].clientY;
  } else if (e.originalEvent && e.originalEvent.changedTouches[0]) {
    touchx = e.originalEvent.changedTouches[0].clientX;
    touchy = e.originalEvent.changedTouches[0].clientY;
  } else if (e.clientX && e.clientY) {
    touchx = e.clientX;
    touchy = e.clientY;
  }
  if (isDown) {
    updatePos(activeOriginalPos, activePiece, e, false, touchx, touchy);
  }
});

document.addEventListener("mouseup", (e) => {
  if (isDown && activePiece.dataset.color == turn) {
    const coords = [
      Math.floor(
        (e.clientX - chessBoard.getBoundingClientRect().left) /
          document.querySelector(".piece").getBoundingClientRect().width
      ),
      Math.floor(
        (e.clientY - chessBoard.getBoundingClientRect().top) /
          document.querySelector(".piece").getBoundingClientRect().height
      ),
    ];
    const oldCoords = [
      Math.floor(
        (activeOriginalPos.left -
          chessBoard.getBoundingClientRect().left +
          activePiece.offsetWidth / 5) /
          document.querySelector(".piece").getBoundingClientRect().width
      ),
      Math.floor(
        (activeOriginalPos.top -
          chessBoard.getBoundingClientRect().top +
          activePiece.offsetHeight / 5) /
          document.querySelector(".piece").getBoundingClientRect().height
      ),
    ];

    const valideMoves = validMove(oldCoords, activePiece, board, turn);
    if (
      JSON.stringify(oldCoords) != JSON.stringify(coords) &&
      coords[1] >= 0 &&
      coords[1] <= 7 &&
      coords[0] >= 0 &&
      coords[0] <= 7 &&
      arrIn(valideMoves, coords)
    ) {
      if (
        activePiece.dataset.name.toLowerCase() == "p" &&
        ((activePiece.dataset.color == 1 && coords[1] == 4) ||
          (activePiece.dataset.color == 0 && coords[1] == 3)) &&
        ((activePiece.dataset.color == 1 && oldCoords[1] == 6) ||
          (activePiece.dataset.color == 0 && oldCoords[1] == 1))
      ) {
        canEnpass = true;
        enpassPiece = coords;
      } else {
        if (
          canEnpass &&
          coords[0] == enpassPiece[0] &&
          coords[1] + (activePiece.dataset.color == 1 ? 1 : -1) ==
            enpassPiece[1] &&
          activePiece.dataset.name.toLowerCase() == "p"
        ) {
          captureAudio.play();
          board[enpassPiece[1]][enpassPiece[0]] = undefined;
        }
        enpassPiece = null;
        canEnpass = false;
      }

      if (activePiece.dataset.name == "K") {
        if (coords[0] == 6 && castleRightsWhiteKingSide) {
          moveAudio.play();
          board[7][7] = undefined;
          board[7][5] = ["R", 1];
        }
        if (coords[0] == 2 && castleRightsWhiteQueenSide) {
          moveAudio.play();
          board[7][0] = undefined;
          board[7][3] = ["R", 1];
        }
        castleRightsWhiteKingSide = false;
        castleRightsWhiteQueenSide = false;
      } else if (activePiece.dataset.name == "k") {
        if (coords[1] == 6 && castleRightsBlackKingSide) {
          moveAudio.play();
          board[0][7] = undefined;
          board[0][5] = ["r", 1];
        }
        if (coords[0] == 2 && castleRightsBlackQueenSide) {
          moveAudio.play();
          board[0][0] = undefined;
          board[0][3] = ["r", 1];
        }
        castleRightsBlackKingSide = false;
        castleRightsBlackQueenSide = false;
      } else if (activePiece.dataset.name == "r") {
        if (oldCoords[0] == 7) {
          castleRightsBlackKingSide = false;
        } else if (oldCoords[0] == 0) {
          castleRightsBlackQueenSide = false;
        }
      } else if (activePiece.dataset.name == "R") {
        if (oldCoords[0] == 7) {
          castleRightsWhiteKingSide = false;
        } else if (oldCoords[0] == 0) {
          castleRightsWhiteQueenSide = false;
        }
      }
      if (
        activePiece.dataset.name.toLowerCase() == "p" &&
        coords[1] == (activePiece.dataset.color == 1 ? 0 : 7)
      ) {
        const promotion = document.createElement("div");
        promotion.innerHTML = `<div data-name="Q"><img src="./chess_assets/wq.png"  /></div>
        <div data-name="B"><img src="./chess_assets/wb.png"  /></div>
        <div data-name="N"><img src="./chess_assets/wn.png"  /></div>
        <div data-name="P"><img src="./chess_assets/wp.png"  /></div>
        <div data-name="x"><img src="./chess_assets/x.svg" /></div>`;
        promotion.style.width = activeOriginalPos.width;
        promotion.classList.add("promotion");
        if (activePiece.dataset.color == 1) {
          promotion.style.top = 0;
        } else {
          promotion.style.bottom = 0;
        }

        promotion.style.left = `${
          coords[0] * activePiece.getBoundingClientRect().width
        }px`;
        const highlights = document.querySelector(".highlights");
        highlights.append(promotion);
        promotion.style.width = `${
          chessBoard.getBoundingClientRect().width / 8
        }px`;
        for (let i = 0; i < promotion.children.length; i++) {
          promotion.children[i].addEventListener("click", (ele) => {
            if (ele.target.dataset.name == "x") {
              setBoard(board);
            } else {
              turn = turn == 0 ? 1 : 0;
              if (board[coords[1]][coords[0]]) {
                captureAudio.play();
              } else {
                moveAudio.play();
              }
              board[oldCoords[1]][oldCoords[0]] = undefined;
              board[coords[1]][coords[0]] = [
                ele.target.dataset.name,
                parseInt(activePiece.dataset.color),
              ];
              let tempAct = activePiece.getBoundingClientRect();
              clearHighLight();
              setBoard(board);
              createHighLight(
                "rgba(255,255,0,.4)",
                activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
                activeOriginalPos.left - chessBoard.getBoundingClientRect().left
              );

              createHighLight(
                "rgba(255,255,0,.4)",
                coords[1] * tempAct.height,
                coords[0] * tempAct.width
              );
              state = checkGameOver(activePiece.dataset.color == 1 ? 0 : 1);
              if (state) {
                console.log(state);
              }
            }
          });
        }
      } else {
        turn = turn == 0 ? 1 : 0;
        if (board[coords[1]][coords[0]]) {
          captureAudio.play();
        } else {
          moveAudio.play();
        }
        board[oldCoords[1]][oldCoords[0]] = undefined;
        board[coords[1]][coords[0]] = [
          activePiece.dataset.name,
          parseInt(activePiece.dataset.color),
        ];
        let tempAct = activePiece.getBoundingClientRect();
        setBoard(board);
        clicked = false;
        clearHighLight();
        createHighLight(
          "rgba(255,255,0,.4)",
          activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
          activeOriginalPos.left - chessBoard.getBoundingClientRect().left
        );

        createHighLight(
          "rgba(255,255,0,.4)",
          coords[1] * tempAct.height,
          coords[0] * tempAct.width
        );
        state = checkGameOver(activePiece.dataset.color == 1 ? 0 : 1);
      }
    } else {
      board[oldCoords[1]][oldCoords[0]] = [
        activePiece.dataset.name,
        parseInt(activePiece.dataset.color),
      ];
      setBoard(board);
      clearHighLight();
      createHighLight(
        "rgba(255,255,0,.4)",
        activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
        activeOriginalPos.left - chessBoard.getBoundingClientRect().left
      );
      clicked = true;
      const valid_moves = validMove(oldCoords, activePiece, board, turn);
      for (let i = 0; i < valid_moves.length; i++) {
        let left =
          valid_moves[i][0] * (chessBoard.getBoundingClientRect().width / 8);
        let top =
          valid_moves[i][1] * (chessBoard.getBoundingClientRect().height / 8);
        if (board[valid_moves[i][1]][valid_moves[i][0]]) {
          createHighLight("dot", top, left, true);
        } else {
          createHighLight("dot", top, left);
        }
      }
    }
    if (state) {
      console.log(state);
    }
  } else if (isDown && activePiece.dataset.color != turn) {
    const oldCoords = [
      Math.floor(
        (activeOriginalPos.left -
          chessBoard.getBoundingClientRect().left +
          activePiece.offsetWidth / 5) /
          document.querySelector(".piece").getBoundingClientRect().width
      ),
      Math.floor(
        (activeOriginalPos.top -
          chessBoard.getBoundingClientRect().top +
          activePiece.offsetHeight / 5) /
          document.querySelector(".piece").getBoundingClientRect().height
      ),
    ];
    board[oldCoords[1]][oldCoords[0]] = [
      activePiece.dataset.name,
      parseInt(activePiece.dataset.color),
    ];
    setBoard(board);
    clicked = false;

    clearHighLight();
    createHighLight(
      "rgba(255,255,0,.4)",
      activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
      activeOriginalPos.left - chessBoard.getBoundingClientRect().left
    );
    activePiece.classList.remove("grabbing");
  }
  isDown = false;
});
document.addEventListener("touchend", (e) => {
  console.log(touchx, touchy);
  if (isDown && activePiece.dataset.color == turn) {
    const coords = [
      Math.floor(
        (touchx - chessBoard.getBoundingClientRect().left) /
          document.querySelector(".piece").getBoundingClientRect().width
      ),
      Math.floor(
        (touchy - chessBoard.getBoundingClientRect().top) /
          document.querySelector(".piece").getBoundingClientRect().height
      ),
    ];
    console.log(coords);
    const oldCoords = [
      Math.floor(
        (activeOriginalPos.left -
          chessBoard.getBoundingClientRect().left +
          activePiece.offsetWidth / 5) /
          document.querySelector(".piece").getBoundingClientRect().width
      ),
      Math.floor(
        (activeOriginalPos.top -
          chessBoard.getBoundingClientRect().top +
          activePiece.offsetHeight / 5) /
          document.querySelector(".piece").getBoundingClientRect().height
      ),
    ];

    const valideMoves = validMove(oldCoords, activePiece, board, turn);
    if (
      JSON.stringify(oldCoords) != JSON.stringify(coords) &&
      coords[1] >= 0 &&
      coords[1] <= 7 &&
      coords[0] >= 0 &&
      coords[0] <= 7 &&
      arrIn(valideMoves, coords)
    ) {
      if (
        activePiece.dataset.name.toLowerCase() == "p" &&
        ((activePiece.dataset.color == 1 && coords[1] == 4) ||
          (activePiece.dataset.color == 0 && coords[1] == 3)) &&
        ((activePiece.dataset.color == 1 && oldCoords[1] == 6) ||
          (activePiece.dataset.color == 0 && oldCoords[1] == 1))
      ) {
        canEnpass = true;
        enpassPiece = coords;
      } else {
        if (
          canEnpass &&
          coords[0] == enpassPiece[0] &&
          coords[1] + (activePiece.dataset.color == 1 ? 1 : -1) ==
            enpassPiece[1] &&
          activePiece.dataset.name.toLowerCase() == "p"
        ) {
          captureAudio.play();
          board[enpassPiece[1]][enpassPiece[0]] = undefined;
        }
        enpassPiece = null;
        canEnpass = false;
      }

      if (activePiece.dataset.name == "K") {
        if (coords[0] == 6 && castleRightsWhiteKingSide) {
          moveAudio.play();
          board[7][7] = undefined;
          board[7][5] = ["R", 1];
        }
        if (coords[0] == 2 && castleRightsWhiteQueenSide) {
          moveAudio.play();
          board[7][0] = undefined;
          board[7][3] = ["R", 1];
        }
        castleRightsWhiteKingSide = false;
        castleRightsWhiteQueenSide = false;
      } else if (activePiece.dataset.name == "k") {
        if (coords[1] == 6 && castleRightsBlackKingSide) {
          moveAudio.play();
          board[0][7] = undefined;
          board[0][5] = ["r", 1];
        }
        if (coords[0] == 2 && castleRightsBlackQueenSide) {
          moveAudio.play();
          board[0][0] = undefined;
          board[0][3] = ["r", 1];
        }
        castleRightsBlackKingSide = false;
        castleRightsBlackQueenSide = false;
      } else if (activePiece.dataset.name == "r") {
        if (oldCoords[0] == 7) {
          castleRightsBlackKingSide = false;
        } else if (oldCoords[0] == 0) {
          castleRightsBlackQueenSide = false;
        }
      } else if (activePiece.dataset.name == "R") {
        if (oldCoords[0] == 7) {
          castleRightsWhiteKingSide = false;
        } else if (oldCoords[0] == 0) {
          castleRightsWhiteQueenSide = false;
        }
      }
      if (
        activePiece.dataset.name.toLowerCase() == "p" &&
        coords[1] == (activePiece.dataset.color == 1 ? 0 : 7)
      ) {
        const promotion = document.createElement("div");
        promotion.innerHTML = `<div data-name="Q"><img src="./chess_assets/wq.png"  /></div>
        <div data-name="B"><img src="./chess_assets/wb.png"  /></div>
        <div data-name="N"><img src="./chess_assets/wn.png"  /></div>
        <div data-name="P"><img src="./chess_assets/wp.png"  /></div>
        <div data-name="x"><img src="./chess_assets/x.svg" /></div>`;
        promotion.style.width = activeOriginalPos.width;
        promotion.classList.add("promotion");
        if (activePiece.dataset.color == 1) {
          promotion.style.top = 0;
        } else {
          promotion.style.bottom = 0;
        }

        promotion.style.left = `${
          coords[0] * activePiece.getBoundingClientRect().width
        }px`;
        const highlights = document.querySelector(".highlights");
        highlights.append(promotion);
        promotion.style.width = `${
          chessBoard.getBoundingClientRect().width / 8
        }px`;
        for (let i = 0; i < promotion.children.length; i++) {
          promotion.children[i].addEventListener("click", (ele) => {
            if (ele.target.dataset.name == "x") {
              setBoard(board);
            } else {
              turn = turn == 0 ? 1 : 0;
              if (board[coords[1]][coords[0]]) {
                captureAudio.play();
              } else {
                moveAudio.play();
              }
              board[oldCoords[1]][oldCoords[0]] = undefined;
              board[coords[1]][coords[0]] = [
                ele.target.dataset.name,
                parseInt(activePiece.dataset.color),
              ];
              let tempAct = activePiece.getBoundingClientRect();
              clearHighLight();
              setBoard(board);
              createHighLight(
                "rgba(255,255,0,.4)",
                activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
                activeOriginalPos.left - chessBoard.getBoundingClientRect().left
              );

              createHighLight(
                "rgba(255,255,0,.4)",
                coords[1] * tempAct.height,
                coords[0] * tempAct.width
              );
              state = checkGameOver(activePiece.dataset.color == 1 ? 0 : 1);
              if (state) {
                console.log(state);
              }
            }
          });
        }
      } else {
        turn = turn == 0 ? 1 : 0;
        if (board[coords[1]][coords[0]]) {
          captureAudio.play();
        } else {
          moveAudio.play();
        }
        board[oldCoords[1]][oldCoords[0]] = undefined;
        board[coords[1]][coords[0]] = [
          activePiece.dataset.name,
          parseInt(activePiece.dataset.color),
        ];
        let tempAct = activePiece.getBoundingClientRect();
        setBoard(board);
        clicked = false;
        clearHighLight();
        createHighLight(
          "rgba(255,255,0,.4)",
          activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
          activeOriginalPos.left - chessBoard.getBoundingClientRect().left
        );

        createHighLight(
          "rgba(255,255,0,.4)",
          coords[1] * tempAct.height,
          coords[0] * tempAct.width
        );
        state = checkGameOver(activePiece.dataset.color == 1 ? 0 : 1);
      }
    } else {
      board[oldCoords[1]][oldCoords[0]] = [
        activePiece.dataset.name,
        parseInt(activePiece.dataset.color),
      ];
      setBoard(board);
      clearHighLight();
      createHighLight(
        "rgba(255,255,0,.4)",
        activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
        activeOriginalPos.left - chessBoard.getBoundingClientRect().left
      );
      clicked = true;
      const valid_moves = validMove(oldCoords, activePiece, board, turn);
      for (let i = 0; i < valid_moves.length; i++) {
        let left =
          valid_moves[i][0] * (chessBoard.getBoundingClientRect().width / 8);
        let top =
          valid_moves[i][1] * (chessBoard.getBoundingClientRect().height / 8);
        if (board[valid_moves[i][1]][valid_moves[i][0]]) {
          createHighLight("dot", top, left, true);
        } else {
          createHighLight("dot", top, left);
        }
      }
    }
    if (state) {
      console.log(state);
    }
  } else if (isDown && activePiece.dataset.color != turn) {
    const oldCoords = [
      Math.floor(
        (activeOriginalPos.left -
          chessBoard.getBoundingClientRect().left +
          activePiece.offsetWidth / 5) /
          document.querySelector(".piece").getBoundingClientRect().width
      ),
      Math.floor(
        (activeOriginalPos.top -
          chessBoard.getBoundingClientRect().top +
          activePiece.offsetHeight / 5) /
          document.querySelector(".piece").getBoundingClientRect().height
      ),
    ];
    board[oldCoords[1]][oldCoords[0]] = [
      activePiece.dataset.name,
      parseInt(activePiece.dataset.color),
    ];
    setBoard(board);
    clicked = false;

    clearHighLight();
    createHighLight(
      "rgba(255,255,0,.4)",
      activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
      activeOriginalPos.left - chessBoard.getBoundingClientRect().left
    );
    activePiece.classList.remove("grabbing");
  }
  isDown = false;
});

function onClickEvent(e) {
  const highlights = document.querySelector(".highlights");
  const cir = Array.from(document.querySelectorAll(".circle"));
  const sq = Array.from(document.querySelectorAll(".highlightSq"));
  if (
    e.target != chessBoard &&
    !cir.includes(e.target) &&
    !sq.includes(e.target) &&
    !(e.target.dataset.color && parseInt(e.target.color) != turn)
  ) {
    clearHighLight();
    clicked = false;
  } else {
    if (clicked && activePiece.dataset.color == turn) {
      const coords = [
        Math.floor(
          (e.clientX - chessBoard.getBoundingClientRect().left) /
            document.querySelector(".piece").getBoundingClientRect().width
        ),
        Math.floor(
          (e.clientY - chessBoard.getBoundingClientRect().top) /
            document.querySelector(".piece").getBoundingClientRect().height
        ),
      ];
      const oldCoords = [
        Math.floor(
          (activeOriginalPos.left -
            chessBoard.getBoundingClientRect().left +
            document.querySelector(".piece").offsetWidth / 5) /
            document.querySelector(".piece").getBoundingClientRect().width
        ),
        Math.floor(
          (activeOriginalPos.top -
            chessBoard.getBoundingClientRect().top +
            document.querySelector(".piece").offsetHeight / 5) /
            document.querySelector(".piece").getBoundingClientRect().height
        ),
      ];
      // console.log(
      //   coords,
      //   oldCoords,
      //   activePiece,
      //   activeOriginalPos,
      //   Math.floor(
      //     (activeOriginalPos.left -
      //       chessBoard.getBoundingClientRect().left +
      //       document.querySelector(".piece").offsetWidth / 5) /
      //       document.querySelector(".piece").getBoundingClientRect().width
      //   )
      // );
      const valideMoves = validMove(oldCoords, activePiece, board, turn);
      // console.log(valideMoves);
      if (
        JSON.stringify(oldCoords) != JSON.stringify(coords) &&
        coords[1] >= 0 &&
        coords[1] <= 7 &&
        coords[0] >= 0 &&
        coords[0] <= 7 &&
        arrIn(valideMoves, coords)
      ) {
        if (
          activePiece.dataset.name.toLowerCase() == "p" &&
          ((activePiece.dataset.color == 1 && coords[1] == 4) ||
            (activePiece.dataset.color == 0 && coords[1] == 3)) &&
          ((activePiece.dataset.color == 1 && oldCoords[1] == 6) ||
            (activePiece.dataset.color == 0 && oldCoords[1] == 1))
        ) {
          canEnpass = true;
          enpassPiece = coords;
        } else {
          if (
            canEnpass &&
            coords[0] == enpassPiece[0] &&
            coords[1] + (activePiece.dataset.color == 1 ? 1 : -1) ==
              enpassPiece[1] &&
            activePiece.dataset.name.toLowerCase() == "p"
          ) {
            captureAudio.play();
            board[enpassPiece[1]][enpassPiece[0]] = undefined;
          }
          enpassPiece = null;
          canEnpass = false;
        }

        if (activePiece.dataset.name == "K") {
          if (coords[0] == 6 && castleRightsWhiteKingSide) {
            moveAudio.play();
            board[7][7] = undefined;
            board[7][5] = ["R", 1];
          }
          if (coords[0] == 2 && castleRightsWhiteQueenSide) {
            moveAudio.play();
            board[7][0] = undefined;
            board[7][3] = ["R", 1];
          }
          castleRightsWhiteKingSide = false;
          castleRightsWhiteQueenSide = false;
        } else if (activePiece.dataset.name == "k") {
          if (coords[1] == 6 && castleRightsBlackKingSide) {
            moveAudio.play();
            board[0][7] = undefined;
            board[0][5] = ["r", 1];
          }
          if (coords[0] == 2 && castleRightsBlackQueenSide) {
            moveAudio.play();
            board[0][0] = undefined;
            board[0][3] = ["r", 1];
          }
          castleRightsBlackKingSide = false;
          castleRightsBlackQueenSide = false;
        } else if (activePiece.dataset.name == "r") {
          if (oldCoords[0] == 7) {
            castleRightsBlackKingSide = false;
          } else if (oldCoords[0] == 0) {
            castleRightsBlackQueenSide = false;
          }
        } else if (activePiece.dataset.name == "R") {
          if (oldCoords[0] == 7) {
            castleRightsWhiteKingSide = false;
          } else if (oldCoords[0] == 0) {
            castleRightsWhiteQueenSide = false;
          }
        }
        if (activePiece.dataset.name == "P" && coords[1] == 0) {
          const promotion = document.createElement("div");
          promotion.innerHTML = `<div data-name="Q"><img src="./chess_assets/wq.png"  /></div>
            <div data-name="B"><img src="./chess_assets/wb.png"  /></div>
            <div data-name="N"><img src="./chess_assets/wn.png"  /></div>
            <div data-name="P"><img src="./chess_assets/wp.png"  /></div>
            <div data-name="x"><img src="./chess_assets/x.svg" /></div>`;
          promoting = true;
          promotion.style.width = activeOriginalPos.width;
          promotion.classList.add("promotion");
          promotion.style.top = 0;
          promotion.style.left = `${
            coords[0] *
            document.querySelector(".piece").getBoundingClientRect().width
          }px`;
          const highlights = document.querySelector(".highlights");
          highlights.append(promotion);
          promotion.style.width = `${
            chessBoard.getBoundingClientRect().width / 8
          }px`;
          for (let i = 0; i < promotion.children.length; i++) {
            promotion.children[i].addEventListener("click", (ele) => {
              if (ele.target.dataset.name == "x") {
                setBoard(board);
              } else {
                turn = turn == 0 ? 1 : 0;
                if (board[coords[1]][coords[0]]) {
                  captureAudio.play();
                } else {
                  moveAudio.play();
                }
                board[oldCoords[1]][oldCoords[0]] = undefined;
                board[coords[1]][coords[0]] = [
                  ele.target.dataset.name,
                  parseInt(activePiece.dataset.color),
                ];
                let tempAct = activePiece.getBoundingClientRect();
                clearHighLight();
                setBoard(board);
                createHighLight(
                  "rgba(255,255,0,.4)",
                  activeOriginalPos.top -
                    chessBoard.getBoundingClientRect().top,
                  activeOriginalPos.left -
                    chessBoard.getBoundingClientRect().left
                );

                createHighLight(
                  "rgba(255,255,0,.4)",
                  coords[1] * tempAct.height,
                  coords[0] * tempAct.width
                );
                state = checkGameOver(activePiece.dataset.color == 1 ? 0 : 1);
                if (state) {
                  console.log(state);
                }
              }
            });
          }
        } else {
          turn = turn == 0 ? 1 : 0;
          if (board[coords[1]][coords[0]]) {
            captureAudio.play();
          } else {
            moveAudio.play();
          }
          board[oldCoords[1]][oldCoords[0]] = undefined;
          board[coords[1]][coords[0]] = [
            activePiece.dataset.name,
            parseInt(activePiece.dataset.color),
          ];
          setBoard(board);
          let tempAct = document
            .querySelector(".piece")
            .getBoundingClientRect();

          clearHighLight();
          createHighLight(
            "rgba(255,255,0,.4)",
            oldCoords[1] * tempAct.height,
            oldCoords[0] * tempAct.width,
            false,
            true
          );

          createHighLight(
            "rgba(255,255,0,.4)",
            coords[1] * tempAct.height,
            coords[0] * tempAct.width,
            false,
            true
          );
          state = checkGameOver(activePiece.dataset.color == 1 ? 0 : 1);
        }
      } else {
        board[oldCoords[1]][oldCoords[0]] = [
          activePiece.dataset.name,
          parseInt(activePiece.dataset.color),
        ];
        setBoard(board);
        clearHighLight();
        createHighLight(
          "rgba(255,255,0,.4)",
          activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
          activeOriginalPos.left - chessBoard.getBoundingClientRect().left
        );
        const valid_moves = validMove(oldCoords, activePiece, board, turn);
        for (let i = 0; i < valid_moves.length; i++) {
          let left =
            valid_moves[i][0] * (chessBoard.getBoundingClientRect().width / 8);
          let top =
            valid_moves[i][1] * (chessBoard.getBoundingClientRect().height / 8);
          if (board[valid_moves[i][1]][valid_moves[i][0]]) {
            createHighLight("dot", top, left, true);
          } else {
            createHighLight("dot", top, left);
          }
        }
      }
      if (state) {
        console.log(state);
      }
    } else if (clicked && activePiece.dataset.color != turn) {
      const oldCoords = [
        Math.floor(
          (activeOriginalPos.left -
            chessBoard.getBoundingClientRect().left +
            activePiece.offsetWidth / 5) /
            document.querySelector(".piece").getBoundingClientRect().width
        ),
        Math.floor(
          (activeOriginalPos.top -
            chessBoard.getBoundingClientRect().top +
            activePiece.offsetHeight / 5) /
            document.querySelector(".piece").getBoundingClientRect().height
        ),
      ];
      board[oldCoords[1]][oldCoords[0]] = [
        activePiece.dataset.name,
        parseInt(activePiece.dataset.color),
      ];
      setBoard(board);
      clearHighLight();
      createHighLight(
        "rgba(255,255,0,.4)",
        activeOriginalPos.top - chessBoard.getBoundingClientRect().top,
        activeOriginalPos.left - chessBoard.getBoundingClientRect().left
      );
      activePiece.classList.remove("grabbing");
    }
  }
  clicked = false;
}

document.addEventListener("click", onClickEvent);

const createPiece = (pieceName, ps) => {
  const piece = document.createElement("div");
  piece.classList.add("piece");
  piece.draggable = false;
  piece.dataset.name = ps;
  piece.dataset.color = pieceName[0] == "w" ? 1 : 0;
  piece.addEventListener("mousedown", (e) => {
    isDown = true;
    let x = e.target.getBoundingClientRect();
    let w = e.target.offsetHeight;
    if (clicked && parseInt(piece.dataset.color) != turn) {
      isDown = false;
      onClickEvent(e);
    }
    activePiece = e.target;
    e.target.classList.add("grabbing");
    activeOriginalPos = e.target.getBoundingClientRect();
    if (!promoting) {
      clearHighLight();
      createHighLight(
        "rgba(255,255,0,.4)",
        x.top - chessBoard.getBoundingClientRect().top,
        x.left - chessBoard.getBoundingClientRect().left
      );
    }
    const oldCoords = [
      Math.floor(
        (x.left - chessBoard.getBoundingClientRect().left + w / 5) /
          document.querySelector(".piece").getBoundingClientRect().width
      ),
      Math.floor(
        (x.top - chessBoard.getBoundingClientRect().top + w / 5) /
          document.querySelector(".piece").getBoundingClientRect().height
      ),
    ];
    if (activePiece.offsetWidth != 0 && !promoting) {
      const valid_moves = validMove(oldCoords, activePiece, board, turn);
      for (let i = 0; i < valid_moves.length; i++) {
        let left =
          valid_moves[i][0] * (chessBoard.getBoundingClientRect().width / 8);
        let top =
          valid_moves[i][1] * (chessBoard.getBoundingClientRect().height / 8);
        if (board[valid_moves[i][1]][valid_moves[i][0]]) {
          createHighLight("dot", top, left, true);
        } else {
          createHighLight("dot", top, left);
        }
      }
    }
    promoting = false;

    // updatePos(ele, piece, e);
    // console.log(window.event.clientX);
    // console.log(chessBoard.getBoundingClientRect());
  });
  piece.addEventListener("touchstart", (e) => {
    console.log("Running");
    isDown = true;
    // console.log(e.target);
    // const touch =
    //   e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
    // console.log("this");
    // console.log(touch.pageX, touch.pageY);
    const ele = e.target;
    console.log(ele);
    let x = ele.getBoundingClientRect();
    let w = ele.offsetHeight;
    if (clicked && parseInt(piece.dataset.color) != turn) {
      isDown = false;
      onClickEvent(e);
    }
    activePiece = ele;
    ele.classList.add("grabbing");
    activeOriginalPos = ele.getBoundingClientRect();
    if (!promoting) {
      clearHighLight();
      createHighLight(
        "rgba(255,255,0,.4)",
        x.top - chessBoard.getBoundingClientRect().top,
        x.left - chessBoard.getBoundingClientRect().left
      );
    }
    const oldCoords = [
      Math.floor(
        (x.left - chessBoard.getBoundingClientRect().left + w / 5) /
          document.querySelector(".piece").getBoundingClientRect().width
      ),
      Math.floor(
        (x.top - chessBoard.getBoundingClientRect().top + w / 5) /
          document.querySelector(".piece").getBoundingClientRect().height
      ),
    ];
    if (activePiece.offsetWidth != 0 && !promoting) {
      const valid_moves = validMove(oldCoords, activePiece, board, turn);
      for (let i = 0; i < valid_moves.length; i++) {
        let left =
          valid_moves[i][0] * (chessBoard.getBoundingClientRect().width / 8);
        let top =
          valid_moves[i][1] * (chessBoard.getBoundingClientRect().height / 8);
        if (board[valid_moves[i][1]][valid_moves[i][0]]) {
          createHighLight("dot", top, left, true);
        } else {
          createHighLight("dot", top, left);
        }
      }
    }
    promoting = false;

    // updatePos(ele, piece, e);
    // console.log(window.event.clientX);
    // console.log(chessBoard.getBoundingClientRect());
  });
  piece.innerHTML = `<img src="./chess_assets/${pieceName}.png" />`;
  return piece;
};

const setBoard = (board) => {
  pieceIn[0] = new Map();
  pieceIn[1] = new Map();
  chessBoard.innerHTML =
    '<img src="./assets/Chess_Board.svg" /><div class="highlights"></div>';
  let w_h = chessBoard.offsetWidth / 8;
  let x = 0;
  let y = 0;
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (!board[i][j]) {
        x += w_h;
      } else {
        const piece = createPiece(pieces[board[i][j][0]], board[i][j][0]);
        piece.style.top = `${y}px`;
        piece.style.left = `${x}px`;
        piece.dataset.x = j;
        piece.dataset.y = i;
        if (pieces[board[i][j][0]][1] == "p") {
          piece.firstChild.style.transform = ` scale(1)`;
        }
        if (board[i][j][1] == 0) {
          pieceIn[0].set(`${j}${i}`, piece);
        } else {
          pieceIn[1].set(`${j}${i}`, piece);
        }
        chessBoard.append(piece);
        x += w_h;
      }
    }
    y += w_h;
    x = 0;
  }
  // activeOriginalPos = null;
};

setBoard(board);
window.onresize = () => {
  setBoard(board);
};
