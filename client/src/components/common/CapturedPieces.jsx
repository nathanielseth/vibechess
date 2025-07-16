import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Stack } from "@mui/material";

const pieceInfo = {
	q: { value: 9, order: 1 },
	r: { value: 5, order: 2 },
	b: { value: 3, order: 3 },
	n: { value: 3, order: 4 },
	p: { value: 1, order: 5 },
};

const CapturedPieces = ({
	capturedByPlayer = [],
	capturedByOpponent = [],
	isCompact = false,
}) => {
	const playerTally = capturedByPlayer.reduce((acc, piece) => {
		acc[piece.type] = (acc[piece.type] || 0) + 1;
		return acc;
	}, {});

	const opponentTally = capturedByOpponent.reduce((acc, piece) => {
		acc[piece.type] = (acc[piece.type] || 0) + 1;
		return acc;
	}, {});

	let netMaterialAdvantage = 0;
	const netPiecesToDisplay = [];

	const pieceOrder = ["q", "r", "b", "n", "p"];

	for (const type of pieceOrder) {
		const playerHas = playerTally[type] || 0;
		const opponentHas = opponentTally[type] || 0;
		const difference = playerHas - opponentHas;

		if (pieceInfo[type]) {
			netMaterialAdvantage += difference * pieceInfo[type].value;
		}

		if (difference > 0) {
			const pieceToDisplay =
				capturedByPlayer.find((p) => p.type === type) ||
				capturedByOpponent.find((p) => p.type === type);

			if (pieceToDisplay) {
				for (let i = 0; i < difference; i++) {
					netPiecesToDisplay.push(pieceToDisplay);
				}
			}
		}
	}

	netPiecesToDisplay.sort(
		(a, b) => pieceInfo[a.type].order - pieceInfo[b.type].order
	);

	if (netPiecesToDisplay.length === 0 && netMaterialAdvantage <= 0) {
		return <Box sx={{ minHeight: isCompact ? 20 : 24 }} />;
	}

	return (
		<Stack
			direction="row"
			alignItems="center"
			spacing={0.25}
			sx={{
				minHeight: isCompact ? 20 : 24,
				flexWrap: "nowrap",
			}}
		>
			{netPiecesToDisplay.map((piece, index) => {
				const IconComponent = piece.icon;
				return (
					<Box
						key={`${piece.type}-${index}`}
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: isCompact ? "18px" : "20px",
							lineHeight: 1,
							color:
								piece.color === "white" ? "#f0f0f0" : "#333333",
							filter:
								piece.color === "black"
									? "drop-shadow(0.4px 0 0 #ffffff) drop-shadow(-0.4px 0 0 #ffffff) drop-shadow(0 0.4px 0 #ffffff) drop-shadow(0 -0.4px 0 #ffffff)"
									: "none",
						}}
					>
						<IconComponent size={isCompact ? 18 : 20} />
					</Box>
				);
			})}

			{netMaterialAdvantage > 0 && (
				<Typography
					variant="caption"
					sx={{
						color: "text.secondary",
						fontWeight: "bold",
						fontSize: isCompact ? "14px" : "16px",
						ml: 0.75,
						lineHeight: 1,
					}}
				>
					+{netMaterialAdvantage}
				</Typography>
			)}
		</Stack>
	);
};

CapturedPieces.propTypes = {
	capturedByPlayer: PropTypes.arrayOf(
		PropTypes.shape({
			type: PropTypes.string.isRequired,
			icon: PropTypes.elementType.isRequired,
			color: PropTypes.string.isRequired,
		})
	),
	capturedByOpponent: PropTypes.arrayOf(
		PropTypes.shape({
			type: PropTypes.string.isRequired,
			icon: PropTypes.elementType.isRequired,
			color: PropTypes.string.isRequired,
		})
	),
	isCompact: PropTypes.bool,
};

export default CapturedPieces;
