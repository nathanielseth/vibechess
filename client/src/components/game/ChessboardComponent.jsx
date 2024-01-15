import React, { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Stack, Typography, Box } from "@mui/material";
import { toast } from "react-toastify";
import { styles, boardThemeColors } from "../../styles/styles";
import { CircleFlag } from "react-circle-flags";
import IconButton from "@mui/material/IconButton";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ReplayIcon from "@mui/icons-material/Replay";
import "react-toastify/dist/ReactToastify.css";
import BoardControl from "../common/BoardControl";
import Chatbox from "../common/Chatbox";
import GameOverModal from "../common/modal/GameOverModal.jsx";
import SettingsModal from "../common/modal/SettingsModal.jsx";
import SettingsIcon from "@mui/icons-material/Settings";
import ShareModal from "../common/modal/ShareModal.jsx";
import Engine from "./utils/engine.js";
import {
	isKingInCheck as checkKingInCheck,
	findBestMove as findBestMoveUtil,
	generatePGN,
	moveSound,
	captureSound,
	tenSecondsSound,
	notifySound,
} from "../../data/utils.js";
import {
	moveOptionsHandler,
	handleSquareRightClick,
	formatTime,
} from "./utils/chessboardUtils.js";

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
	const [isSettingsHovered, setIsSettingsHovered] = useState(false);
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [autoFlip, setAutoFlip] = useState(false);
	const [analysisMode, setAnalysisMode] = useState(false);
	const [gameEndReason, setGameEndReason] = useState(null);
	const [selectedTheme, setSelectedTheme] = useState(
		window.localStorage.getItem("selectedBoard") || "grey"
	);
	const [bestMove, setBestMove] = useState(null);
	const [boardOrientation, setBoardOrientation] = useState("white");
	const [boardWidth, setBoardWidth] = useState(480);
	const [whiteTime, setWhiteTime] = useState(10 * 60);
	const [blackTime, setBlackTime] = useState(10 * 60);
	const [currentPlayer, setCurrentPlayer] = useState("white");
	const [hasPlayed, setHasPlayed] = useState({ white: false, black: false });

	const customDarkSquareColor =
		boardThemeColors[selectedTheme]?.darkSquare ||
		boardThemeColors.grey.darkSquare;
	const customLightSquareColor =
		boardThemeColors[selectedTheme]?.lightSquare ||
		boardThemeColors.grey.lightSquare;
	const yellowSquare = "rgba(252, 220, 77, 0.4)";

	useEffect(() => {
		if (gameMode === "multiplayer") {
			const timer = setInterval(() => {
				if (!isGameOver) {
					if (currentPlayer === "white") {
						setWhiteTime((prevTime) =>
							prevTime > 0 ? prevTime - 0.1 : 0
						);
					} else {
						setBlackTime((prevTime) =>
							prevTime > 0 ? prevTime - 0.1 : 0
						);
					}

					if (
						(currentPlayer === "white" &&
							whiteTime <= 10 &&
							!hasPlayed.white) ||
						(currentPlayer === "black" &&
							blackTime <= 10 &&
							!hasPlayed.black)
					) {
						tenSecondsSound.play();
						if (currentPlayer === "white") {
							setHasPlayed((prevState) => ({
								...prevState,
								white: true,
							}));
						} else {
							setHasPlayed((prevState) => ({
								...prevState,
								black: true,
							}));
						}
					}
				}
			}, 100);

			return () => clearInterval(timer);
		}
	}, [
		currentPlayer,
		isGameOver,
		whiteTime,
		blackTime,
		hasPlayed,
		setWhiteTime,
		setBlackTime,
		gameMode,
	]);

	useEffect(() => {
		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	});

	const findBestMove = useCallback(() => {
		findBestMoveUtil(
			engine,
			game,
			analysisMode,
			setBestMove,
			setChessBoardPosition
		);
	}, [engine, game, analysisMode, setBestMove, setChessBoardPosition]);

	useEffect(() => {
		if ((!game.isGameOver() || game.isGameOver()) && analysisMode) {
			setTimeout(findBestMove, 300);
		}
	}, [chessBoardPosition, findBestMove, game, analysisMode]);

	const handleResize = useCallback(() => {
		let newBoardWidth;
		const maxWidth = 690;
		const minWidth = 310;
		const availableWidth = Math.min(window.innerWidth - 100, maxWidth);

		const availableHeight = window.innerHeight;

		newBoardWidth = Math.max(
			Math.min(availableWidth, availableHeight * 0.75),
			minWidth
		);
		setBoardWidth(newBoardWidth);
	}, []);

	const toggleBoardOrientation = () => {
		setBoardOrientation((prevOrientation) =>
			prevOrientation === "white" ? "black" : "white"
		);
	};

	// known bug: in later stages of a match, may result in inability to make subsequent moves.
	const handleUndoMove = () => {
		if (currentIndex > 0) {
			const newHistory = history.slice(0, -1);
			const newIndex = currentIndex - 1;

			const newGame = new Chess();
			for (let i = 1; i <= newIndex; i++) {
				newGame.move(history[i].lastMove);
			}

			setGame(newGame);
			setHistory(newHistory);
			setCurrentIndex(newIndex);
			setLastMove(null);
			setHighlightedSquares({});
			setRightClickedSquares({});
			setOptionSquares({});
			setMoveFrom("");
			setKingInCheck(isKingInCheck(newGame));
			setPgn(generatePGN(newHistory));
			setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
		}
	};

	const isKingInCheck = useCallback(() => {
		return checkKingInCheck(game);
	}, [game]);

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

	// move this to passandplay
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

		// Check for time out
		if (!reason) {
			if (currentPlayer === "white" && whiteTime <= 0) {
				reason = "White ran out of time!";
			} else if (currentPlayer === "black" && blackTime <= 0) {
				reason = "Black ran out of time!";
			}
		}

		setGameEndReason(reason);

		if (reason) {
			if (gameMode === "passandplay") {
				toastId.current = toast.info(reason, {
					position: toast.POSITION.TOP_CENTER,
					autoClose: 2000,
				});
			}

			setTimeout(() => {
				setIsGameOver(true);
			}, 1000);
		}
	}, [game, history, gameMode, currentPlayer, whiteTime, blackTime]);

	useEffect(() => {
		if (isGameOver) {
			notifySound.play();
		}
	}, [isGameOver]);

	const getMoveOptions = moveOptionsHandler(
		game,
		currentIndex,
		history,
		setOptionSquares,
		setHighlightedSquares,
		yellowSquare
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
			setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
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
				setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
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
		if (lastMove && currentIndex > history.length - 2) {
			moveSound.play();
			if (lastMove.captured) {
				captureSound.play();
			}
			setKingInCheck(isKingInCheck());
		}
	}, [lastMove, currentIndex, history, isKingInCheck]);

	useEffect(() => {
		checkGameOver();
		setPgn(generatePGN(history));
	}, [game, checkGameOver, history, currentPlayer, whiteTime, blackTime]);

	const onPieceDragBegin = (piece, sourceSquare) => {
		getMoveOptions(sourceSquare);
	};
	const onSquareRightClick = (square) => {
		handleSquareRightClick(
			square,
			rightClickedSquares,
			setRightClickedSquares
		);
	};

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
		<Stack
			flexDirection={{ xs: "column", md: "row" }}
			sx={{
				zIndex: 1,
				maxHeight: "100dvh",
				...(gameMode !== "multiplayer"
					? { mt: { xs: "90px", sm: "90px", md: 0 } }
					: {}),
			}}
			alignItems="center"
		>
			<Stack flexDirection="row">
				<Stack flexDirection="column">
					{/*          */}
					{gameMode === "multiplayer" && (
						<Stack
							flexDirection="row"
							justifyContent="space-between"
						>
							{/*     */}
							<Stack
								sx={{ margin: 1 }}
								alignItems="center"
								gap={1}
								direction={{ xs: "column", md: "row" }}
							>
								<CircleFlag countryCode={"es"} height="35" />
								<Typography variant="h4">opponent</Typography>
							</Stack>

							<Stack
								sx={{
									backgroundColor:
										currentPlayer === "black"
											? "white"
											: "#1f2123",
									borderRadius: "10px",
									margin: 1,
									alignItems: "center",
									gap: 1,
									direction: { xs: "column", md: "row" },
									px: 1,
								}}
							>
								<Box>
									<Typography
										variant="h4"
										sx={{
											color:
												currentPlayer === "black"
													? "black"
													: "grey",
										}}
									>
										{formatTime(blackTime)}
									</Typography>
								</Box>
							</Stack>
						</Stack>
					)}
					{/*     */}
					<Stack sx={{ zIndex: 1 }} direction="row">
						<Chessboard
							id="StyledBoard"
							boardOrientation={
								autoFlip
									? game.turn() === "w"
										? "white"
										: "black"
									: boardOrientation
							}
							boardWidth={boardWidth}
							position={game.fen()}
							onPieceDrop={onDrop}
							onSquareClick={onSquareClick}
							customBoardStyle={{
								borderRadius: "10px",
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
							customArrowColor="#f24040"
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
							onSquareRightClick={onSquareRightClick}
							// TODO: work on on premove
							// arePremovesAllowed={
							// 	gameMode === "multiplayer" ? "true" : "false"
							// }
						/>
					</Stack>
					{/*     */}
					{gameMode === "multiplayer" && (
						<Stack
							flexDirection="row"
							justifyContent="space-between"
						>
							<Stack
								sx={{ margin: 1 }}
								alignItems="center"
								gap={1}
								direction={{ xs: "column", md: "row" }}
							>
								<CircleFlag countryCode={"es"} height="35" />
								<Typography variant="h4">player</Typography>
							</Stack>

							<Stack
								sx={{
									backgroundColor:
										currentPlayer === "white"
											? "white"
											: "black",
									borderRadius: "10px",
									margin: 1,
									alignItems: "center",
									gap: 1,
									direction: { xs: "column", md: "row" },
									px: 1,
								}}
							>
								<Box>
									<Typography
										variant="h4"
										sx={{
											color:
												currentPlayer === "white"
													? "black"
													: "grey",
										}}
									>
										{formatTime(whiteTime)}
									</Typography>
								</Box>
							</Stack>
						</Stack>
					)}
				</Stack>
				{/*     */}
				<Stack
					sx={{ zIndex: 1 }}
					direction="column"
					onMouseEnter={() => setIsSettingsHovered(true)}
					onMouseLeave={() => setIsSettingsHovered(false)}
				>
					<IconButton
						aria-label="settings"
						onClick={openSettingsModal}
					>
						<SettingsIcon
							sx={{ fontSize: "1.35rem", color: "#989795" }}
						/>
					</IconButton>
					{isSettingsHovered && (
						<>
							<IconButton
								onClick={toggleBoardOrientation}
								sx={{ fontSize: "1.20rem", color: "#989795" }}
							>
								<ReplayIcon
									sx={{
										fontSize: "1.20rem",
										color: "#989795",
									}}
								/>
							</IconButton>

							<IconButton onClick={openShareModal}>
								<ShareRoundedIcon
									sx={{
										fontSize: "1.20rem",
										color: "#989795",
									}}
								/>
							</IconButton>
						</>
					)}
				</Stack>
				{/*     */}
			</Stack>
			<Stack>
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
					gameMode={gameMode}
					handleUndoMove={handleUndoMove}
					setIsGameOver={setIsGameOver}
				/>
				{gameMode === "multiplayer" && <Chatbox />}
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
			</Stack>
		</Stack>
	);
};

ChessboardComponent.propTypes = {
	gameMode: PropTypes.string.isRequired,
	isAnalysisMode: PropTypes.bool.isRequired,
};

export default ChessboardComponent;
