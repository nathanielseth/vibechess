import { useState, useEffect, useCallback } from "react";
import {
	TbChessFilled,
	TbChessKnightFilled,
	TbChessBishopFilled,
	TbChessRookFilled,
	TbChessQueenFilled,
	TbChessKingFilled,
} from "react-icons/tb";

const PIECE_VALUES = {
	p: 1, // pawn
	n: 3, // knight
	b: 3, // bishop
	r: 5, // rook
	q: 9, // queen
	k: 0, // king
};

const PIECE_ICONS = {
	white: {
		p: TbChessFilled,
		n: TbChessKnightFilled,
		b: TbChessBishopFilled,
		r: TbChessRookFilled,
		q: TbChessQueenFilled,
		k: TbChessKingFilled,
	},
	black: {
		p: TbChessFilled,
		n: TbChessKnightFilled,
		b: TbChessBishopFilled,
		r: TbChessRookFilled,
		q: TbChessQueenFilled,
		k: TbChessKingFilled,
	},
};

export const useCapturedPieces = (history, currentIndex) => {
	const [capturedPieces, setCapturedPieces] = useState({
		white: [],
		black: [],
	});
	const [materialAdvantage, setMaterialAdvantage] = useState(0);

	const calculateCapturedPieces = useCallback(() => {
		if (!history || history.length === 0) {
			setCapturedPieces({
				white: [],
				black: [],
			});
			setMaterialAdvantage(0);
			return;
		}

		const whiteCaptured = [];
		const blackCaptured = [];

		const relevantHistory = history.slice(1, currentIndex + 1);

		relevantHistory.forEach((historyItem) => {
			const move = historyItem.lastMove;
			if (move && move.captured) {
				const capturedPieceColor =
					move.color === "w" ? "black" : "white";
				const capturedPiece = {
					type: move.captured,
					color: capturedPieceColor,
					icon: PIECE_ICONS[capturedPieceColor][move.captured],
					value: PIECE_VALUES[move.captured],
				};

				if (move.color === "w") {
					whiteCaptured.push(capturedPiece);
				} else {
					blackCaptured.push(capturedPiece);
				}
			}
		});

		const sortPieces = (pieces) => {
			return pieces.sort((a, b) => {
				if (a.value !== b.value) return b.value - a.value;
				return a.type.localeCompare(b.type);
			});
		};

		const sortedWhiteCaptured = sortPieces(whiteCaptured);
		const sortedBlackCaptured = sortPieces(blackCaptured);

		setCapturedPieces({
			white: sortedWhiteCaptured,
			black: sortedBlackCaptured,
		});

		const whiteScore = sortedWhiteCaptured.reduce(
			(sum, piece) => sum + piece.value,
			0
		);
		const blackScore = sortedBlackCaptured.reduce(
			(sum, piece) => sum + piece.value,
			0
		);

		setMaterialAdvantage(whiteScore - blackScore);
	}, [history, currentIndex]);

	useEffect(() => {
		calculateCapturedPieces();
	}, [calculateCapturedPieces]);

	const getCapturedPiecesForPlayer = useCallback(
		(playerColor) => {
			return capturedPieces[playerColor] || [];
		},
		[capturedPieces]
	);

	const getMaterialAdvantageForPlayer = useCallback(
		(playerColor) => {
			if (playerColor === "white") {
				return materialAdvantage > 0 ? materialAdvantage : 0;
			} else {
				return materialAdvantage < 0 ? Math.abs(materialAdvantage) : 0;
			}
		},
		[materialAdvantage]
	);

	const getAdvantageDisplay = useCallback(
		(playerColor) => {
			const advantage = getMaterialAdvantageForPlayer(playerColor);
			return advantage > 0 ? `+${advantage}` : "";
		},
		[getMaterialAdvantageForPlayer]
	);

	return {
		capturedPieces,
		materialAdvantage,
		getCapturedPiecesForPlayer,
		getMaterialAdvantageForPlayer,
		getAdvantageDisplay,
	};
};
