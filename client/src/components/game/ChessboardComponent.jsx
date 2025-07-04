import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Chessboard } from "react-chessboard";
import { Stack, Typography, Box, IconButton } from "@mui/material";
import { CircleFlag } from "react-circle-flags";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ReplayIcon from "@mui/icons-material/Replay";
import SettingsIcon from "@mui/icons-material/Settings";
import { styles, boardThemeColors } from "../../styles/styles";
import { useChessGame } from "../game/hooks/useChessGame.js";
import {
	moveOptionsHandler,
	handleSquareRightClick,
	formatTime,
} from "./utils/chessboardUtils.js";
import BoardControl from "../common/BoardControl";
import Chatbox from "../common/Chatbox";
import GameOverModal from "../common/modal/GameOverModal.jsx";
import SettingsModal from "../common/modal/SettingsModal.jsx";
import ShareModal from "../common/modal/ShareModal.jsx";

const ChessboardComponent = ({ gameMode, onGameEnd, onGameStart }) => {
	const chessGame = useChessGame(gameMode);

	const [selectedPieceSet, setSelectedPieceSet] = useState(
		window.localStorage.getItem("selectedPieces") || "tatiana"
	);
	const [selectedTheme, setSelectedTheme] = useState(
		window.localStorage.getItem("selectedBoard") || "grey"
	);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [isSettingsHovered, setIsSettingsHovered] = useState(false);
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [boardWidth, setBoardWidth] = useState(480);

	const customDarkSquareColor =
		boardThemeColors[selectedTheme]?.darkSquare ||
		boardThemeColors.grey.darkSquare;
	const customLightSquareColor =
		boardThemeColors[selectedTheme]?.lightSquare ||
		boardThemeColors.grey.lightSquare;
	const yellowSquare = "rgba(252, 220, 77, 0.4)";

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

	useEffect(() => {
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [handleResize]);

	// game callbacks
	useEffect(() => {
		if (chessGame.isGameOver && onGameEnd) {
			onGameEnd(chessGame.gameEndReason);
		}
	}, [chessGame.isGameOver, chessGame.gameEndReason, onGameEnd]);

	useEffect(() => {
		if (onGameStart && chessGame.currentIndex > 0) {
			onGameStart();
		}
	}, [chessGame.currentIndex, onGameStart]);

	// piece rendering
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

	// move options handler
	const getMoveOptions = moveOptionsHandler(
		chessGame.game,
		chessGame.currentIndex,
		chessGame.history,
		chessGame.setOptionSquares,
		chessGame.setHighlightedSquares,
		yellowSquare
	);

	// event handlers
	const onDrop = (sourceSquare, targetSquare, piece) => {
		const promotion = piece ? piece[1].toLowerCase() : "q";
		const move = chessGame.makeMove(sourceSquare, targetSquare, promotion);

		if (move) {
			getMoveOptions(targetSquare);
		}

		return !!move;
	};

	const onSquareClick = (square) => {
		chessGame.setRightClickedSquares({});
		chessGame.setMoveFrom("");
		chessGame.setOptionSquares({});

		const hasMoveOptions = getMoveOptions(square);

		if (hasMoveOptions) {
			chessGame.setMoveFrom(square);
		}

		if (chessGame.currentIndex !== chessGame.history.length - 1) {
			return;
		}

		if (square === chessGame.moveFrom) {
			chessGame.setMoveFrom("");
			chessGame.setOptionSquares({});
			return;
		}

		if (chessGame.moveFrom) {
			const move = chessGame.makeMove(chessGame.moveFrom, square);
			if (move) {
				chessGame.setMoveFrom("");
			}
		} else {
			chessGame.setMoveFrom(square);
			getMoveOptions(square);
		}
	};

	const onPieceDragBegin = (piece, sourceSquare) => {
		getMoveOptions(sourceSquare);
	};

	const onSquareRightClick = (square) => {
		handleSquareRightClick(
			square,
			chessGame.rightClickedSquares,
			chessGame.setRightClickedSquares
		);
	};

	// modal handlers
	const openShareModal = () => {
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

	const renderPlayerInfo = (player, time, isCurrentPlayer) => (
		<Stack flexDirection="row" justifyContent="space-between">
			<Stack
				sx={{ margin: 1 }}
				alignItems="center"
				gap={1}
				direction={{ xs: "column", md: "row" }}
			>
				<CircleFlag countryCode={"es"} height="35" />
				<Typography variant="h4">
					{player === "white" ? "player" : "opponent"}
				</Typography>
			</Stack>

			<Stack
				sx={{
					backgroundColor: isCurrentPlayer ? "white" : "#1f2123",
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
							color: isCurrentPlayer ? "black" : "grey",
						}}
					>
						{formatTime(time)}
					</Typography>
				</Box>
			</Stack>
		</Stack>
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
					{/* top player info for multiplayer */}
					{gameMode === "multiplayer" &&
						renderPlayerInfo(
							"black",
							chessGame.blackTime,
							chessGame.currentPlayer === "black"
						)}

					{/* chessboard */}
					<Stack sx={{ zIndex: 1 }} direction="row">
						<Chessboard
							id="StyledBoard"
							boardOrientation={
								chessGame.autoFlip
									? chessGame.game.turn() === "w"
										? "white"
										: "black"
									: chessGame.boardOrientation
							}
							boardWidth={boardWidth}
							position={chessGame.game.fen()}
							onPieceDrop={onDrop}
							onSquareClick={onSquareClick}
							customBoardStyle={{
								borderRadius: "10px",
							}}
							customSquareStyles={{
								...chessGame.highlightedSquares,
								...chessGame.rightClickedSquares,
								...chessGame.optionSquares,
								...(chessGame.kingInCheck
									? {
											[chessGame.kingInCheck]:
												styles.kingInCheckStyle,
									  }
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
								chessGame.analysisMode && chessGame.bestMove
									? [
											[
												chessGame.bestMove.substring(
													0,
													2
												),
												chessGame.bestMove.substring(
													2,
													4
												),
												"rgb(196, 144, 209)",
											],
									  ]
									: []
							}
							onSquareRightClick={onSquareRightClick}
						/>
					</Stack>

					{/*bottom player info for multi */}
					{gameMode === "multiplayer" &&
						renderPlayerInfo(
							"white",
							chessGame.whiteTime,
							chessGame.currentPlayer === "white"
						)}
				</Stack>

				{/* settings and controls */}
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
								onClick={chessGame.toggleBoardOrientation}
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
			</Stack>

			{/* Side panel */}
			<Stack>
				<BoardControl
					currentIndex={chessGame.currentIndex}
					navigateMove={chessGame.navigateMove}
					history={chessGame.history}
					toggleAutoFlip={chessGame.toggleAutoFlip}
					autoFlip={chessGame.autoFlip}
					toggleAnalysisMode={chessGame.toggleAnalysisMode}
					analysisMode={chessGame.analysisMode}
					openSettingsModal={openSettingsModal}
					openShareModal={openShareModal}
					pgn={chessGame.pgn}
					handleRematch={chessGame.resetGame}
					gameMode={gameMode}
					handleUndoMove={chessGame.undoMove}
					setIsGameOver={chessGame.setIsGameOver}
				/>

				{/* TODO: implement chat func*/}
				{gameMode === "multiplayer" && <Chatbox />}

				{/* mdals */}
				<SettingsModal
					isOpen={isSettingsModalOpen}
					onClose={closeSettingsModal}
				/>
				<ShareModal
					isOpen={shareModalOpen}
					onClose={closeShareModal}
					pgn={chessGame.pgn}
				/>
				{gameMode !== "passandplay" && (
					<GameOverModal
						isOpen={chessGame.isGameOver}
						onClose={() => chessGame.setIsGameOver(false)}
						onRematch={chessGame.resetGame}
						onNewGame={chessGame.resetGame}
						endReason={chessGame.gameEndReason}
						gameMode={gameMode}
					/>
				)}
			</Stack>
		</Stack>
	);
};

ChessboardComponent.propTypes = {
	gameMode: PropTypes.string.isRequired,
	onGameEnd: PropTypes.func,
	onGameStart: PropTypes.func,
};

ChessboardComponent.defaultProps = {
	onGameEnd: null,
	onGameStart: null,
};

export default ChessboardComponent;
