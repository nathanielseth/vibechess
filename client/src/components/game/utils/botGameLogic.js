import { Chess } from "chess.js";
import {
	isKingInCheck as checkKingInCheck,
	generatePGN,
} from "../../../data/utils.js";

const HIGHLIGHT_COLOR = "rgba(252, 220, 77, 0.4)";

export const createInitialState = (playerColor) => ({
	game: new Chess(),
	lastMove: null,
	premoves: [],
	history: [{ fen: new Chess().fen(), lastMove: null }],
	currentIndex: 0,
	kingInCheck: null,
	isGameOver: false,
	gameEndReason: null,
	pgn: "",
	currentPlayer: "white",
	isThinking: false,
	isPondering: false,
	highlightedSquares: {},
	optionSquares: {},
	moveFrom: "",
	rightClickedSquares: {},
	boardOrientation: playerColor,
});

export const gameReducer = (state, action) => {
	switch (action.type) {
		case "MAKE_MOVE": {
			const { game, move, sourceSquare, targetSquare, newPlayer } =
				action.payload;
			return {
				...state,
				game,
				currentPlayer: newPlayer,
				lastMove: move,
				history: [
					...state.history,
					{ fen: game.fen(), lastMove: move },
				],
				highlightedSquares: {
					[sourceSquare]: { backgroundColor: HIGHLIGHT_COLOR },
					[targetSquare]: { backgroundColor: HIGHLIGHT_COLOR },
				},
				kingInCheck: checkKingInCheck(game),
				currentIndex: state.currentIndex + 1,
				optionSquares: {},
				moveFrom: "",
				isPondering: false,
			};
		}

		case "SET_THINKING":
			return { ...state, isThinking: action.payload };

		case "SET_PONDERING":
			return { ...state, isPondering: action.payload };

		case "SET_PREMOVES":
			return { ...state, premoves: action.payload };

		case "SET_GAME_OVER":
			return {
				...state,
				isGameOver: true,
				gameEndReason: action.payload,
				isThinking: false,
				isPondering: false,
			};

		case "SET_HIGHLIGHTED_SQUARES":
			return { ...state, highlightedSquares: action.payload };

		case "SET_OPTION_SQUARES":
			return { ...state, optionSquares: action.payload };

		case "SET_MOVE_FROM":
			return { ...state, moveFrom: action.payload };

		case "SET_RIGHT_CLICKED_SQUARES":
			return { ...state, rightClickedSquares: action.payload };

		case "SET_BOARD_ORIENTATION":
			return { ...state, boardOrientation: action.payload };

		case "NAVIGATE_MOVE": {
			const { moveIndex, history, lastMove } = action.payload;
			let highlightedSquares = {};

			if (moveIndex === history.length - 1 && lastMove) {
				highlightedSquares = {
					[lastMove.from]: { backgroundColor: HIGHLIGHT_COLOR },
					[lastMove.to]: { backgroundColor: HIGHLIGHT_COLOR },
				};
			}

			return {
				...state,
				game: new Chess(history[moveIndex].fen),
				currentIndex: moveIndex,
				optionSquares: {},
				highlightedSquares,
			};
		}

		case "UNDO_MOVE": {
			const { newGame, newHistory, newIndex, playerColor } =
				action.payload;
			return {
				...state,
				game: newGame,
				history: newHistory,
				currentIndex: newIndex,
				lastMove: null,
				highlightedSquares: {},
				rightClickedSquares: {},
				optionSquares: {},
				moveFrom: "",
				kingInCheck: checkKingInCheck(newGame),
				pgn: generatePGN(newHistory, "versus-bot"),
				currentPlayer: playerColor,
			};
		}

		case "RESET_GAME": {
			const newGame = new Chess();
			return {
				...createInitialState(action.payload.playerColor),
				game: newGame,
				kingInCheck: null,
			};
		}

		case "UPDATE_PGN":
			return { ...state, pgn: action.payload };

		default:
			return state;
	}
};
