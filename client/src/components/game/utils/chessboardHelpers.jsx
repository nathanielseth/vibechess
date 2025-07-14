import React from "react";
import { boardThemeColors } from "../../../styles/styles";

export const getThemeColors = (selectedTheme) => {
	const customDarkSquareColor =
		boardThemeColors[selectedTheme]?.darkSquare ||
		boardThemeColors.grey.darkSquare;
	const customLightSquareColor =
		boardThemeColors[selectedTheme]?.lightSquare ||
		boardThemeColors.grey.lightSquare;

	return { customDarkSquareColor, customLightSquareColor };
};

export const createCustomPieces = (selectedPieceSet) => {
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
					backgroundImage: `url(./piece/${selectedPieceSet}/${piece}.svg)`,
					backgroundSize: "100%",
				}}
			/>
		);
	});
	return pieceComponents;
};

export const getBoardOrientation = (gameMode, playerColor, chessGame) => {
	if (gameMode === "multiplayer" && playerColor) {
		return playerColor;
	}
	return chessGame.autoFlip
		? chessGame.game.turn() === "w"
			? "white"
			: "black"
		: chessGame.boardOrientation;
};

export const getCurrentPlayer = (chessGame) => {
	return chessGame.game.turn() === "w" ? "white" : "black";
};
