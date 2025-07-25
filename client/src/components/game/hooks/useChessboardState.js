import { useState, useEffect, useCallback, useRef } from "react";

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
	const [gameState, setGameState] = useState({
		playerColor: null,
		opponent: null,
		roomCode: null,
	});

	const lastProcessedMatchData = useRef(null);

	const handleBoardChange = useCallback((newTheme) => {
		setSelectedTheme(newTheme);
	}, []);

	const handlePiecesChange = useCallback((newPieces) => {
		setSelectedPieceSet(newPieces);
	}, []);

	useEffect(() => {
		const handleStorageChange = (e) => {
			if (e.key === "selectedBoard") {
				setSelectedTheme(e.newValue || "grey");
			} else if (e.key === "selectedPieces") {
				setSelectedPieceSet(e.newValue || "tatiana");
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	useEffect(() => {
		if (!matchData || gameMode !== "multiplayer") return;

		if (lastProcessedMatchData.current?.roomCode === matchData.roomCode) {
			return;
		}

		console.log("Processing matchData:", matchData);
		lastProcessedMatchData.current = matchData;

		setGameState({
			playerColor: matchData.yourColor,
			roomCode: matchData.roomCode,
			opponent: matchData.opponent
				? {
						name: matchData.opponent.name,
						color: matchData.opponent.color,
						flag: matchData.opponent.flag?.toLowerCase(),
				  }
				: null,
		});
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
		handleBoardChange,
		handlePiecesChange,
		...gameState,
	};
};
