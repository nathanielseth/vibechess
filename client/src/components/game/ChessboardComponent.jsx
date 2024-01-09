import React, { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Grid } from "@mui/material";
import { toast } from "react-toastify";
import { styles, boardThemeColors } from "../../styles/styles";
import "react-toastify/dist/ReactToastify.css";
import BoardControl from "./BoardControl";
import GameOverModal from "./GameOverModal";
import SettingsModal from "../common/SettingsModal";
import ShareModal from "../common/ShareModal";
import Engine from "./engine.js";
import {
	isKingInCheck as checkKingInCheck,
	findBestMove as findBestMoveUtil,
	generatePGN,
	moveSound,
	captureSound,
} from "./utils";

const ChessboardComponent = ({ gameMode }) => {
	const [game, setGame] = useState(() => new Chess());
	const engine = useMemo(() => new Engine(), []);
	const [lastMove, setLastMove] = useState(null);
	const [rightClickedSquares, setRightClickedSquares] = useState({});
	const [highlightedSquares, setHighlightedSquares] = useState({});
	const [optionSquares, setOptionSquares] = useState({});
	const [moveFrom, setMoveFrom] = useState("");
	const [history, setHistory] = useState([
		{ fen: game.fen(), lastMove: null },
	]);
	const [selectedPieceSet, setSelectedPieceSet] = useState(
		window.localStorage.getItem("selectedPieces") || "tatiana"
	);
	const [chessBoardPosition, setChessBoardPosition] = useState(game.fen());
	const [currentIndex, setCurrentIndex] = useState(0);
	const [kingInCheck, setKingInCheck] = useState(null);
	const [isGameOver, setIsGameOver] = useState(false);
	const [pgn, setPgn] = useState("");
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [autoFlip, setAutoFlip] = useState(false);
	const [analysisMode, setAnalysisMode] = useState(false);
	const [gameEndReason, setGameEndReason] = useState(null);
	const [selectedTheme, setSelectedTheme] = useState(
		window.localStorage.getItem("selectedBoard") || "grey"
	);
	const [bestMove, setBestMove] = useState(null);

	const customDarkSquareColor =
		boardThemeColors[selectedTheme]?.darkSquare ||
		boardThemeColors.grey.darkSquare;
	const customLightSquareColor =
		boardThemeColors[selectedTheme]?.lightSquare ||
		boardThemeColors.grey.lightSquare;
	const yellowSquare = "rgba(252, 220, 77, 0.4)";

	const findBestMove = useCallback(() => {
		findBestMoveUtil(
			engine,
			game,
			analysisMode,
			setBestMove,
			setChessBoardPosition
		);
	}, [engine, game, analysisMode, setBestMove, setChessBoardPosition]);

	const isKingInCheck = useCallback(() => {
		return checkKingInCheck(game);
	}, [game]);

	useEffect(() => {
		if ((!game.isGameOver() || game.isGameOver()) && analysisMode) {
			setTimeout(findBestMove, 300);
		}
	}, [chessBoardPosition, findBestMove, game, analysisMode]);

	const resetGame = () => {
		setGame(new Chess());
		setLastMove(null);
		setRightClickedSquares({});
		setHighlightedSquares({});
		setOptionSquares({});
		setMoveFrom("");
		setHistory([{ fen: game.fen(), lastMove: null }]);
		setCurrentIndex(0);
		setKingInCheck(null);
		setAutoFlip(false);
		setAnalysisMode(false);
		setIsGameOver(false);
		setGameEndReason(null);
		setPgn("");
		toastId.current = toast.info("The game has restarted", {
			position: toast.POSITION.TOP_CENTER,
			autoClose: 2000,
		});
	};

	const handleRematch = () => {
		resetGame();
	};

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
		setSelectedPieceSet(
			window.localStorage.getItem("selectedPieces") || "tatiana"
		);
		setSelectedTheme(
			window.localStorage.getItem("selectedBoard") || "grey"
		);
	};

	const toastId = React.useRef(null);

	const toggleAutoFlip = () => {
		if (!autoFlip) {
			if (!toastId.current) {
				toastId.current = toast.info("Auto-flip is enabled!", {
					position: toast.POSITION.TOP_CENTER,
					autoClose: 2000,
				});
			}
		}

		setAutoFlip(!autoFlip);
	};

	const toggleAnalysisMode = () => {
		if (!analysisMode) {
			if (!toastId.current) {
				toastId.current = toast.info("Stockfish evaluation enabled!", {
					position: toast.POSITION.TOP_CENTER,
					autoClose: 4000,
				});
			}
		}

		setAnalysisMode(!analysisMode);
	};

	const checkGameOver = useCallback(() => {
		let reason = null;

		if (game.isCheckmate()) {
			const loserColor = game.turn() === "w" ? "Black" : "White";
			const moves = history.length - 1;
			reason = `${loserColor} got checkmated in ${moves} moves`;
		} else if (game.isStalemate()) {
			reason = "oops... that's a stalemate...";
		} else if (game.isDraw() || game.isThreefoldRepetition()) {
			reason = "nobody won this one..";
		}

		setGameEndReason(reason);

		if (reason) {
			toastId.current = toast.info(reason, {
				position: toast.POSITION.TOP_CENTER,
				autoClose: 2000,
			});

			setTimeout(() => {
				setIsGameOver(true);
			}, 1000);
		}
	}, [game, history]);

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
				background: yellowSquare,
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
				[sourceSquare]: { backgroundColor: yellowSquare },
				[targetSquare]: { backgroundColor: yellowSquare },
			});
			setKingInCheck(isKingInCheck(gameCopy));
			getMoveOptions(targetSquare);
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
					[move.from]: { backgroundColor: yellowSquare },
					[move.to]: { backgroundColor: yellowSquare },
				});
				setKingInCheck(isKingInCheck(gameCopy));
				setCurrentIndex(history.length);
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

	const onPieceDragBegin = (piece, sourceSquare) => {
		getMoveOptions(sourceSquare);
	};

	const capturedPieces = history
		.slice(1, currentIndex + 1)
		.reduce((pieces, move) => {
			if (move.lastMove && move.lastMove.captured) {
				const capturedPiece = move.lastMove.captured.toLowerCase();
				if (!pieces.includes(capturedPiece)) {
					pieces.push(capturedPiece);
				}
			}
			return pieces;
		}, []);

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
						backgroundImage: `url(/piece/${selectedPieceSet}/${piece}.svg)`,
						backgroundSize: "100%",
					}}
				/>
			);
		});
		return pieceComponents;
	}, [selectedPieceSet]);

	const navigateMove = useCallback(
		(moveIndex) => {
			setGame(new Chess(history[moveIndex].fen));
			setCurrentIndex(moveIndex);
			setOptionSquares({});

			// if navigating back to the current index, restore the last move's highlights
			if (moveIndex === history.length - 1 && lastMove) {
				setHighlightedSquares({
					[lastMove.from]: {
						backgroundColor: yellowSquare,
					},
					[lastMove.to]: {
						backgroundColor: yellowSquare,
					},
				});
			} else {
				setHighlightedSquares({});
			}
		},
		[history, lastMove]
	);

	return (
		<Grid container>
			<Grid item xs={8} sx={{ zIndex: 1 }}>
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
						backgroundColor: customDarkSquareColor,
					}}
					customLightSquareStyle={{
						backgroundColor: customLightSquareColor,
					}}
					customArrowColor="rgb(244,159,10)"
					customPieces={customPieces}
					onPieceDragBegin={onPieceDragBegin}
					customArrows={
						analysisMode && bestMove
							? [
									[
										bestMove.substring(0, 2),
										bestMove.substring(2, 4),
										"rgb(196, 144, 209)",
									],
							  ]
							: []
					}
				/>
			</Grid>
			<Grid item xs={4}>
				<BoardControl
					currentIndex={currentIndex}
					navigateMove={navigateMove}
					history={history}
					toggleAutoFlip={toggleAutoFlip}
					autoFlip={autoFlip}
					toggleAnalysisMode={toggleAnalysisMode}
					analysisMode={analysisMode}
					openSettingsModal={openSettingsModal}
					openShareModal={openShareModal}
					pgn={pgn}
					handleRematch={handleRematch}
					capturedPieces={capturedPieces}
				/>
				<SettingsModal
					isOpen={isSettingsModalOpen}
					onClose={closeSettingsModal}
				/>
				<ShareModal
					isOpen={shareModalOpen}
					onClose={closeShareModal}
					pgn={pgn}
				/>
				{gameMode !== "passandplay" && (
					<GameOverModal
						isOpen={isGameOver}
						onClose={() => setIsGameOver(false)}
						onRematch={handleRematch}
						onNewGame={handleRematch}
						endReason={gameEndReason}
						gameMode={gameMode}
					/>
				)}
			</Grid>
		</Grid>
	);
};

ChessboardComponent.propTypes = {
	gameMode: PropTypes.string.isRequired,
	isAnalysisMode: PropTypes.bool.isRequired,
};

export default ChessboardComponent;
