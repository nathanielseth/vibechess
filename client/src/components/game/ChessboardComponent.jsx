import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Chessboard } from "react-chessboard";
import { Stack } from "@mui/material";
import { styles } from "../../styles/styles";
import { useLocalChessGame } from "../game/hooks/useLocalChessGame.js";
import { useMultiplayerGame } from "../game/hooks/useMultiplayerChessGame.js";
import { handleSquareRightClick } from "./utils/chessboardUtils.js";
import { useChessboardState } from "./hooks/useChessboardState";
import { useMultiplayerSocket } from "./hooks/useMultiplayerSocket";
import { useChessboardEvents } from "./hooks/useChessboardEvents";
import {
	getThemeColors,
	createCustomPieces,
	getBoardOrientation,
	getCurrentPlayer,
} from "./utils/chessboardHelpers";
import PlayerInfo from "../common/PlayerInfo.jsx";
import ControlPanel from "../common/ControlPanel";
import BoardControl from "../common/BoardControl";
import Chatbox from "../common/Chatbox";
import GameOverModal from "../common/modal/GameOverModal.jsx";
import SettingsModal from "../common/modal/SettingsModal.jsx";
import ShareModal from "../common/modal/ShareModal.jsx";
import useSocketContext from "../../context/useSocketContext";

const ChessboardComponent = ({
	gameMode,
	onGameEnd,
	onGameStart,
	matchData,
}) => {
	const { socket, isConnected, emit, on } = useSocketContext();

	const localGame = useLocalChessGame();
	const multiplayerGame = useMultiplayerGame(
		matchData,
		socket,
		matchData?.yourColor || "white"
	);
	const chessGame = gameMode === "multiplayer" ? multiplayerGame : localGame;

	const {
		selectedPieceSet,
		setSelectedPieceSet,
		selectedTheme,
		setSelectedTheme,
		isSettingsModalOpen,
		setIsSettingsModalOpen,
		isSettingsHovered,
		setIsSettingsHovered,
		shareModalOpen,
		setShareModalOpen,
		boardWidth,
		playerColor,
		opponent,
		roomCode,
	} = useChessboardState(gameMode, matchData);

	useMultiplayerSocket(
		socket,
		isConnected,
		on,
		gameMode,
		chessGame,
		playerColor,
		roomCode
	);

	const { onDrop, onSquareClick, onPieceDragBegin } = useChessboardEvents(
		chessGame,
		gameMode,
		playerColor,
		roomCode,
		emit,
		selectedTheme
	);

	useEffect(() => {
		if (chessGame?.isGameOver && onGameEnd) {
			onGameEnd(chessGame.gameEndReason);
		}
	}, [chessGame?.isGameOver, chessGame?.gameEndReason, onGameEnd]);

	useEffect(() => {
		if (onGameStart && chessGame?.currentIndex > 0) {
			onGameStart();
		}
	}, [chessGame?.currentIndex, onGameStart]);

	const { customDarkSquareColor, customLightSquareColor } =
		getThemeColors(selectedTheme);
	const customPieces = useMemo(
		() => createCustomPieces(selectedPieceSet),
		[selectedPieceSet]
	);
	const boardOrientation = getBoardOrientation(
		gameMode,
		playerColor,
		chessGame
	);
	const currentPlayer = getCurrentPlayer(chessGame);

	const onSquareRightClick = (square) => {
		handleSquareRightClick(
			square,
			chessGame?.rightClickedSquares,
			chessGame?.setRightClickedSquares
		);
	};

	const modalHandlers = {
		openShare: () => setShareModalOpen(true),
		closeShare: () => setShareModalOpen(false),
		openSettings: () => setIsSettingsModalOpen(true),
		closeSettings: () => {
			setIsSettingsModalOpen(false);
			setSelectedPieceSet(
				localStorage.getItem("selectedPieces") || "tatiana"
			);
			setSelectedTheme(localStorage.getItem("selectedBoard") || "grey");
		},
	};

	const renderPlayerInfo = (player, time, isCurrentPlayer, isTop = false) => (
		<PlayerInfo
			gameMode={gameMode}
			playerColor={playerColor}
			opponent={opponent}
			player={player}
			time={time}
			isCurrentPlayer={isCurrentPlayer}
			isTop={isTop}
		/>
	);

	// don't render if chessGame is not ready
	if (!chessGame) {
		return <div>Loading...</div>;
	}

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
					{/* top player info */}
					{gameMode === "multiplayer" &&
						(playerColor === "white"
							? renderPlayerInfo(
									"black",
									chessGame.blackTime,
									currentPlayer === "black",
									true
							  )
							: renderPlayerInfo(
									"white",
									chessGame.whiteTime,
									currentPlayer === "white",
									true
							  ))}

					{/* Chessboard */}
					<Stack sx={{ zIndex: 1 }} direction="row">
						<Chessboard
							id="StyledBoard"
							boardOrientation={boardOrientation}
							boardWidth={boardWidth}
							position={chessGame.game.fen()}
							onPieceDrop={onDrop}
							onSquareClick={onSquareClick}
							customBoardStyle={{ borderRadius: "10px" }}
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

					{/* bottom player info*/}
					{gameMode === "multiplayer" &&
						(playerColor === "white"
							? renderPlayerInfo(
									"white",
									chessGame.whiteTime,
									currentPlayer === "white",
									false
							  )
							: renderPlayerInfo(
									"black",
									chessGame.blackTime,
									currentPlayer === "black",
									false
							  ))}
				</Stack>

				{/* control panel */}
				<ControlPanel
					isSettingsHovered={isSettingsHovered}
					setIsSettingsHovered={setIsSettingsHovered}
					openSettingsModal={modalHandlers.openSettings}
					toggleBoardOrientation={chessGame.toggleBoardOrientation}
					openShareModal={modalHandlers.openShare}
				/>
			</Stack>

			{/* side panel */}
			<Stack>
				<BoardControl
					currentIndex={chessGame.currentIndex}
					navigateMove={chessGame.navigateMove}
					history={chessGame.history}
					toggleAutoFlip={chessGame.toggleAutoFlip}
					autoFlip={chessGame.autoFlip}
					toggleAnalysisMode={chessGame.toggleAnalysisMode}
					analysisMode={chessGame.analysisMode}
					openSettingsModal={modalHandlers.openSettings}
					openShareModal={modalHandlers.openShare}
					pgn={chessGame.pgn}
					handleRematch={chessGame.resetGame}
					gameMode={gameMode}
					handleUndoMove={chessGame.undoMove}
					setIsGameOver={chessGame.setIsGameOver}
				/>

				{/* chat for multi */}
				{gameMode === "multiplayer" && <Chatbox />}

				{/* modals */}
				<SettingsModal
					isOpen={isSettingsModalOpen}
					onClose={modalHandlers.closeSettings}
				/>
				<ShareModal
					isOpen={shareModalOpen}
					onClose={modalHandlers.closeShare}
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
	matchData: PropTypes.object,
};

ChessboardComponent.defaultProps = {
	onGameEnd: null,
	onGameStart: null,
	matchData: null,
};

export default ChessboardComponent;
