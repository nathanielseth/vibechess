import React, { useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Chessboard } from "react-chessboard";
import { Stack } from "@mui/material";
import { styles } from "../../styles/styles";
import { useLocalChessGame } from "./hooks/useLocalChessGame.js";
import { useVersusBot } from "./hooks/useVersusBot.js";
import { useMultiplayerGame } from "./hooks/useMultiplayerChessGame.js";
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
	onGameEnd = null,
	onGameStart = null,
	matchData = null,
}) => {
	const { socket, isConnected, emit, on } = useSocketContext();

	const localGame = useLocalChessGame();
	const versusBotGame = useVersusBot("white", 18);
	const multiplayerGame = useMultiplayerGame(
		matchData,
		socket,
		matchData?.yourColor || "white"
	);
	const chessGame =
		gameMode === "multiplayer"
			? multiplayerGame
			: gameMode === "versus-bot"
			? versusBotGame
			: localGame;

	const {
		selectedPieceSet,
		selectedTheme,
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
		handleBoardChange,
		handlePiecesChange,
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

	const themeColors = useMemo(
		() => getThemeColors(selectedTheme),
		[selectedTheme]
	);

	const customPieces = useMemo(
		() => createCustomPieces(selectedPieceSet),
		[selectedPieceSet]
	);

	const boardOrientation = useMemo(
		() => getBoardOrientation(gameMode, playerColor, chessGame),
		[gameMode, playerColor, chessGame]
	);

	const currentPlayer = useMemo(
		() => getCurrentPlayer(chessGame),
		[chessGame]
	);

	const isMultiplayer = gameMode === "multiplayer";
	const isPassAndPlay = gameMode === "passandplay";
	//const isVersusBot = gameMode === "versus-bot";

	const isGameReady = chessGame?.game?.fen;

	const onSquareRightClick = useCallback(
		(square) => {
			handleSquareRightClick(
				square,
				chessGame?.rightClickedSquares,
				chessGame?.setRightClickedSquares
			);

			if (chessGame?.clearPremoves) {
				chessGame.clearPremoves();
			}
		},
		[chessGame]
	);

	const modalHandlers = useMemo(
		() => ({
			openShare: () => setShareModalOpen(true),
			closeShare: () => setShareModalOpen(false),
			openSettings: () => setIsSettingsModalOpen(true),
			closeSettings: () => {
				setIsSettingsModalOpen(false);
			},
		}),
		[setShareModalOpen, setIsSettingsModalOpen]
	);

	const boardControlProps = useMemo(() => {
		const baseProps = {
			currentIndex: chessGame?.currentIndex,
			navigateMove: chessGame?.navigateMove,
			history: chessGame?.history,
			openSettingsModal: modalHandlers.openSettings,
			openShareModal: modalHandlers.openShare,
			pgn: chessGame?.pgn,
			handleRematch: chessGame?.resetGame,
			gameMode: gameMode,
			setIsGameOver: chessGame?.setIsGameOver,
		};

		if (isMultiplayer) {
			return {
				...baseProps,
				toggleAutoFlip: () => {},
				autoFlip: false,
				toggleAnalysisMode: () => {},
				analysisMode: false,
				handleUndoMove: () => {},
			};
		}

		return {
			...baseProps,
			toggleAutoFlip: chessGame?.toggleAutoFlip,
			autoFlip: chessGame?.autoFlip,
			toggleAnalysisMode: chessGame?.toggleAnalysisMode,
			analysisMode: chessGame?.analysisMode,
			handleUndoMove: chessGame?.undoMove,
		};
	}, [chessGame, modalHandlers, gameMode, isMultiplayer]);

	const customSquareStyles = useMemo(() => {
		const squareStyles = {
			...chessGame?.highlightedSquares,
			...chessGame?.rightClickedSquares,
			...chessGame?.optionSquares,
			...(chessGame?.kingInCheck
				? {
						[chessGame.kingInCheck]: styles.kingInCheckStyle,
				  }
				: {}),
		};

		if (chessGame?.premoves) {
			chessGame.premoves.forEach((premove) => {
				squareStyles[premove.sourceSquare] = {
					backgroundColor: "rgba(255, 0, 0, 0.3)",
					...squareStyles[premove.sourceSquare],
				};
				squareStyles[premove.targetSquare] = {
					backgroundColor: "rgba(255, 0, 0, 0.3)",
					...squareStyles[premove.targetSquare],
				};
			});
		}

		return squareStyles;
	}, [
		chessGame?.highlightedSquares,
		chessGame?.rightClickedSquares,
		chessGame?.optionSquares,
		chessGame?.kingInCheck,
		chessGame?.premoves,
	]);

	const customArrows = useMemo(() => {
		if (chessGame?.analysisMode && chessGame?.bestMove) {
			return [
				[
					chessGame.bestMove.substring(0, 2),
					chessGame.bestMove.substring(2, 4),
					"rgb(196, 144, 209)",
				],
			];
		}
		return [];
	}, [chessGame?.analysisMode, chessGame?.bestMove]);

	const renderPlayerInfo = useCallback(
		(player, time, isCurrentPlayer, isTop = false) => (
			<PlayerInfo
				gameMode={gameMode}
				playerColor={playerColor}
				opponent={opponent}
				player={player}
				time={time}
				isCurrentPlayer={isCurrentPlayer}
				isTop={isTop}
				history={chessGame?.history}
				currentIndex={chessGame?.currentIndex}
			/>
		),
		[
			gameMode,
			playerColor,
			opponent,
			chessGame?.history,
			chessGame?.currentIndex,
		]
	);

	if (!isGameReady) {
		return null;
	}

	return (
		<Stack
			flexDirection={{ xs: "column", md: "row" }}
			sx={{
				zIndex: 1,
				maxHeight: "100dvh",
				...(!isMultiplayer
					? { mt: { xs: "90px", sm: "90px", md: 0 } }
					: {}),
			}}
			alignItems="center"
		>
			<Stack flexDirection="row">
				<Stack flexDirection="column">
					{/* Top player info */}
					{isMultiplayer &&
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
							position={chessGame?.game?.fen()}
							onPieceDrop={onDrop}
							onSquareClick={onSquareClick}
							customBoardStyle={{ borderRadius: "12px" }}
							customSquareStyles={customSquareStyles}
							customDarkSquareStyle={{
								backgroundColor:
									themeColors.customDarkSquareColor,
							}}
							customLightSquareStyle={{
								backgroundColor:
									themeColors.customLightSquareColor,
							}}
							customArrowColor="#f24040"
							customPieces={customPieces}
							onPieceDragBegin={onPieceDragBegin}
							customArrows={customArrows}
							onSquareRightClick={onSquareRightClick}
						/>
					</Stack>

					{/* Bottom player info */}
					{isMultiplayer &&
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

				{/* Control panel */}
				<ControlPanel
					isSettingsHovered={isSettingsHovered}
					setIsSettingsHovered={setIsSettingsHovered}
					openSettingsModal={modalHandlers.openSettings}
					toggleBoardOrientation={chessGame.toggleBoardOrientation}
					openShareModal={modalHandlers.openShare}
				/>
			</Stack>

			{/* Side panel */}
			<Stack spacing={2}>
				<BoardControl {...boardControlProps} />

				{/* Chat for multiplayer */}
				{isMultiplayer && <Chatbox roomCode={roomCode} />}

				{/* Modals */}
				<SettingsModal
					isOpen={isSettingsModalOpen}
					onClose={modalHandlers.closeSettings}
					onBoardChange={handleBoardChange}
					onPiecesChange={handlePiecesChange}
				/>
				<ShareModal
					isOpen={shareModalOpen}
					onClose={modalHandlers.closeShare}
					pgn={chessGame?.pgn}
				/>
				{!isPassAndPlay && (
					<GameOverModal
						isOpen={chessGame?.isGameOver}
						onClose={() => chessGame?.setIsGameOver(false)}
						onRematch={chessGame?.resetGame}
						onNewGame={chessGame?.resetGame}
						endReason={chessGame?.gameEndReason}
						winner={chessGame?.winner}
						players={chessGame?.players || []}
						playerColor={playerColor}
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

export default React.memo(ChessboardComponent);
