import { useState, useEffect, useCallback } from "react";

export const useChessboardState = (gameMode, matchData) => {
	const [selectedPieceSet, setSelectedPieceSet] = useState(
		localStorage.getItem("selectedPieces") || "tatiana"
	);
	const [selectedTheme, setSelectedTheme] = useState(
		localStorage.getItem("selectedBoard") || "grey"
	);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [isSettingsHovered, setIsSettingsHovered] = useState(false);
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [boardWidth, setBoardWidth] = useState(480);

	// multiplayer state
	const [playerColor, setPlayerColor] = useState(null);
	const [opponent, setOpponent] = useState(null);
	const [roomCode, setRoomCode] = useState(null);

	useEffect(() => {
		if (matchData && gameMode === "multiplayer") {
			console.log("Processing matchData:", matchData);

			setPlayerColor(matchData.yourColor);
			setRoomCode(matchData.roomCode);

			if (matchData.opponent) {
				setOpponent({
					name: matchData.opponent.name,
					color: matchData.opponent.color,
					flag: matchData.opponent.flag || "PH",
				});
			} else {
				console.error("No opponent data found in matchData");
			}
		}
	}, [matchData, gameMode]);

	const handleResize = useCallback(() => {
		const maxWidth = 690;
		const minWidth = 310;
		const availableWidth = Math.min(window.innerWidth - 100, maxWidth);
		const availableHeight = window.innerHeight;

		const newBoardWidth = Math.max(
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

	return {
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
	};
};
