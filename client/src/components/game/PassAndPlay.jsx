import React, { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "../common/Navbar";
import BoardControl from "./BoardControl";
import SettingsModal from "../common/SettingsModal";
import ShareModal from "../common/ShareModal";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Howl } from "howler";
import { Stack, Grid } from "@mui/material";
import { styles } from "../../styles/styles";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const moveSound = new Howl({
	src: ["/sound/move.mp3"],
	volume: 0.6,
});

const captureSound = new Howl({
	src: ["/sound/capture.mp3"],
	volume: 0.6,
});

// functional yet spaghetti, the formatting of the notation could use some work
const generatePGN = (history) => {
	let pgn = `[Event "Game Mode"]\n`;
	pgn += `[Site "VibeChess"]\n`;
	pgn += `[Date "${new Date().toLocaleDateString()}"]\n`;

	pgn += `[White "undefined"]\n`;
	pgn += `[Black "undefined"]\n\n`;

	for (let i = 0; i < history.length; i += 2) {
		const whiteMove = history[i].lastMove
			? `${history[i].lastMove.san} `
			: "";
		const blackMove =
			i + 1 < history.length && history[i + 1].lastMove
				? `${history[i + 1].lastMove.san} `
				: "";

		pgn += `${whiteMove}${blackMove}\n`;
	}
	return pgn;
};

const PassAndPlay = () => {
	const [game, setGame] = useState(() => new Chess());
	const [lastMove, setLastMove] = useState(null);
	const [rightClickedSquares, setRightClickedSquares] = useState({});
	const [highlightedSquares, setHighlightedSquares] = useState({});
	const [optionSquares, setOptionSquares] = useState({});
	const [moveFrom, setMoveFrom] = useState("");
	const [history, setHistory] = useState([
		{ fen: game.fen(), lastMove: null },
	]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [kingInCheck, setKingInCheck] = useState(null);
	const [autoFlip, setAutoFlip] = useState(false);
	const [isGameOver, setIsGameOver] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [pgn, setPgn] = useState("");

	const openShareModal = () => {
		setPgn(generatePGN(history));
		setShareModalOpen(true);
	};

	const closeShareModal = () => {
		setShareModalOpen(false);
	};

	const openSettingsModal = () => {
		setIsSettingsModalOpen(true);
	};

	const closeSettingsModal = () => {
		setIsSettingsModalOpen(false);
	};

	const toastId = React.useRef(null);

	const toggleAutoFlip = () => {
		if (!autoFlip) {
			if (!toastId.current) {
				toastId.current = toast.success("Auto-flip is enabled!", {
					position: toast.POSITION.TOP_CENTER,
					autoClose: 2000,
				});
			}
		}

		setAutoFlip(!autoFlip);
	};

	const checkGameOver = useCallback(() => {
		if (game.isCheckmate()) {
			toast.error(
				`Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins!`
			);
			setIsGameOver(true);
		} else if (
			game.isDraw() ||
			game.isStalemate() ||
			game.isThreefoldRepetition()
		) {
			toast.info("It's a draw!");
			setIsGameOver(true);
		}
	}, [game]);

	useEffect(() => {
		checkGameOver();
		setPgn(generatePGN(history));
	}, [game, checkGameOver, history]);

	const getMoveOptions = useCallback(
		(square) => {
			const moves = game.moves({
				square,
				verbose: true,
			});

			if (moves.length === 0) {
				setOptionSquares({});
				return false;
			}

			if (currentIndex !== history.length - 1) {
				setOptionSquares({});
				setHighlightedSquares({});
				return false;
			}

			const newSquares = {};
			moves.forEach((move) => {
				const isCapture = move.flags.includes("c");
				newSquares[move.to] = isCapture
					? styles.captureSquareStyle
					: {
							background:
								game.get(move.to) &&
								game.get(move.to).color !==
									game.get(square).color
									? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
									: "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
							borderRadius: "50%",
					  };
			});

			newSquares[square] = {
				background: "rgba(255, 255, 0, 0.4)",
			};

			setOptionSquares(newSquares);
			return true;
		},
		[game, currentIndex, history.length]
	);

	const onDrop = (sourceSquare, targetSquare, piece) => {
		const gameCopy = new Chess(game.fen());
		const move = gameCopy.move({
			from: sourceSquare,
			to: targetSquare,
			promotion: piece[1].toLowerCase() ?? "q",
		});

		if (currentIndex !== history.length - 1 || isGameOver) {
			return false;
		}

		if (move) {
			setLastMove(move);
			setHistory((prevHistory) => [
				...prevHistory,
				{ fen: gameCopy.fen(), lastMove: move },
			]);
			setHighlightedSquares({
				[sourceSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
				[targetSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
			});
			setKingInCheck(isKingInCheck(gameCopy));
			getMoveOptions(targetSquare);
			checkGameOver();
		} else {
			setKingInCheck(null);
		}

		setGame(gameCopy);
		setOptionSquares({});
		setCurrentIndex(history.length);
		console.log(gameCopy.pgn());
		setPgn(generatePGN(history));
		return move;
	};

	const isKingInCheck = useCallback(() => {
		if (game.inCheck()) {
			const pieces = game.board();
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					const piece = pieces[i][j];
					if (
						piece &&
						piece.type === "k" &&
						piece.color === game.turn()
					) {
						return String.fromCharCode(97 + j) + (8 - i);
					}
				}
			}
		}
		return null;
	}, [game]);

	const onPieceDragBegin = (piece, sourceSquare) => {
		getMoveOptions(sourceSquare);
	};

	const onSquareClick = (square) => {
		setRightClickedSquares({});
		setMoveFrom("");
		setOptionSquares({});

		const hasMoveOptions = getMoveOptions(square);

		if (hasMoveOptions) {
			setMoveFrom(square);
		}

		if (currentIndex !== history.length - 1) {
			return;
		}

		if (square === moveFrom) {
			setMoveFrom("");
			setOptionSquares({});
			return;
		}

		if (moveFrom) {
			const gameCopy = new Chess(game.fen());
			const move = gameCopy.move({
				from: moveFrom,
				to: square,
				promotion: "q",
			});

			if (move) {
				setLastMove(move);
				setHistory([
					...history,
					{ fen: gameCopy.fen(), lastMove: move },
				]);
				setHighlightedSquares({
					[move.from]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
					[move.to]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
				});
				setKingInCheck(isKingInCheck(gameCopy));
				setCurrentIndex(history.length);
				checkGameOver();
			}
			setOptionSquares({});
			setMoveFrom("");
			setGame(gameCopy);
			setPgn(generatePGN(history));
		} else {
			setMoveFrom(square);
			getMoveOptions(square);
		}
	};

	useEffect(() => {
		if (lastMove) {
			moveSound.play();
			if (lastMove.captured) {
				captureSound.play();
			}
			setKingInCheck(isKingInCheck());
		}
	}, [lastMove, isKingInCheck]);

	const customPieces = useMemo(() => {
		const pieces = [
			"wP",
			"wN",
			"wB",
			"wR",
			"wQ",
			"wK",
			"bP",
			"bN",
			"bB",
			"bR",
			"bQ",
			"bK",
		];

		const pieceComponents = {};
		pieces.forEach((piece) => {
			pieceComponents[piece] = ({ squareWidth }) => (
				<div
					style={{
						width: squareWidth,
						height: squareWidth,
						backgroundImage: `url(/piece/tatiana/${piece}.svg)`,
						backgroundSize: "100%",
					}}
				/>
			);
		});
		return pieceComponents;
	}, []);

	const navigateMove = useCallback(
		(moveIndex) => {
			setGame(new Chess(history[moveIndex].fen));
			setCurrentIndex(moveIndex);
			setOptionSquares({});

			// if navigating back to the current index, restore the last move's highlights
			if (moveIndex === history.length - 1 && lastMove) {
				setHighlightedSquares({
					[lastMove.from]: {
						backgroundColor: "rgba(255, 255, 0, 0.4)",
					},
					[lastMove.to]: {
						backgroundColor: "rgba(255, 255, 0, 0.4)",
					},
				});
			} else {
				setHighlightedSquares({});
			}
		},
		[history, lastMove]
	);

	return (
		<Stack
			direction="column"
			justifyContent="center"
			alignItems="center"
			spacing={-10}
			minHeight="100vh"
		>
			<Navbar title="" />
			<div style={styles.passAndPlayContainerStyle}>
				<Grid
					container
					spacing={1}
					style={{ margin: 0, alignItems: "stretch" }}
				>
					{/* Chessboard */}
					<Grid item xs={8}>
						<Chessboard
							id="StyledBoard"
							boardOrientation={
								autoFlip && game.turn() === "w"
									? "white"
									: autoFlip && game.turn() === "b"
									? "black"
									: "white"
							}
							boardWidth={680}
							position={game.fen()}
							onPieceDrop={onDrop}
							onSquareClick={onSquareClick}
							customBoardStyle={{
								borderRadius: "4px",
								boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
							}}
							customSquareStyles={{
								...highlightedSquares,
								...rightClickedSquares,
								...optionSquares,
								...(kingInCheck
									? { [kingInCheck]: styles.kingInCheckStyle }
									: {}),
							}}
							customDarkSquareStyle={{
								backgroundColor: "#84828f",
							}}
							customLightSquareStyle={{
								backgroundColor: "#eeeeee",
							}}
							customPieces={customPieces}
							onPieceDragBegin={onPieceDragBegin}
						/>
					</Grid>

					{/* Board Control Box */}
					<Grid item xs={4}>
						<BoardControl
							currentIndex={currentIndex}
							navigateMove={navigateMove}
							history={history}
							toggleAutoFlip={toggleAutoFlip}
							autoFlip={autoFlip}
							openSettingsModal={openSettingsModal}
							openShareModal={openShareModal}
							pgn={pgn}
						/>
					</Grid>
				</Grid>
			</div>
			<SettingsModal
				isOpen={isSettingsModalOpen}
				onClose={closeSettingsModal}
			/>
			<ShareModal
				isOpen={shareModalOpen}
				onClose={closeShareModal}
				pgn={pgn}
			/>
		</Stack>
	);
};

export default PassAndPlay;
