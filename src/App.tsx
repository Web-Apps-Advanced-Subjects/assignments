import { useState } from "react";

import {
  Button,
  Card,
  CardActionArea,
  CardMedia,
  Dialog,
  Grid2 as Grid,
  Stack,
  Typography,
} from "@mui/material";

import O from "./assets/o.png";
import X from "./assets/x.png";
import Empty from "./assets/empty.jpg";
import "./App.css";

type Player = "X" | "O";

type BoardCell = Player | null;

type Board = [
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell
];

const defaultBoard: Board = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];
const defaultPlayer: Player = "X";

const cellSize = 56;
const boardSpacing = 2;

const checkWinner = (board: Board) => {
  const winCons: [number, number, number][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < winCons.length; i++) {
    const [a, b, c] = winCons[i];
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

function App() {
  const [board, setBoard] = useState<Board>(defaultBoard);
  const [turn, setTurn] = useState<Player>(defaultPlayer);

  const boardFilled = board.every((cell) => cell === "O" || cell === "X");
  const winner = checkWinner(board);

  const handleCellClick = (idx: number) => () => {
    setBoard((oldBoard) => {
      const newBoard: Board = [...oldBoard];
      newBoard[idx] = turn;

      setTurn((oldTurn) => {
        if (oldTurn === "O") {
          return "X";
        } else {
          return "O";
        }
      });

      return newBoard;
    });
  };

  const handleRestartClick = () => {
    setBoard(defaultBoard);
    setTurn(defaultPlayer);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h3">MIX DRIX</Typography>
      <Grid
        container
        width={cellSize * 3 + (boardSpacing * 2 + 1) * 8}
        height={cellSize * 3 + (boardSpacing * 2 + 1) * 8}
        spacing={boardSpacing}
      >
        {board.map((cell, idx) => (
          <Grid
            key={idx}
            size={4}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Card variant="outlined">
              {cell === null ? (
                <CardActionArea onClick={handleCellClick(idx)}>
                  <CardMedia
                    component="img"
                    src={cell === "O" ? O : cell === "X" ? X : Empty}
                    width={cellSize}
                    height={cellSize}
                  />
                </CardActionArea>
              ) : (
                <CardMedia
                  component="img"
                  src={cell === "O" ? O : X}
                  width={cellSize}
                  height={cellSize}
                />
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
      <Typography variant="h4">{turn} TURN</Typography>
      <Dialog open={boardFilled || winner !== null}>
        <Stack
          sx={{
            width: 200,
            height: 150,
            padding: 2,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4">
            {winner === null ? "DRAW" : `${winner} WON`}
          </Typography>
          <Button onClick={handleRestartClick} sx={{ textTransform: "none" }}>
            Play Again
          </Button>
        </Stack>
      </Dialog>
    </Stack>
  );
}

export default App;
