import React from "react";
import PropTypes from "prop-types";
import { Stack, Typography, Box } from "@mui/material";
import { CircleFlag } from "react-circle-flags";
import { formatTime } from "../game/utils/chessboardUtils";
import CapturedPieces from "./CapturedPieces";
import { useCapturedPieces } from "../game/hooks/useCapturedPieces";

const PlayerInfo = ({
	gameMode,
	opponent,
	player,
	time,
	isCurrentPlayer,
	isTop = false,
	history,
	currentIndex,
}) => {
	const { getCapturedPiecesForPlayer } = useCapturedPieces(
		history,
		currentIndex
	);

	const getDisplayInfo = () => {
		if (gameMode === "multiplayer") {
			if (isTop) {
				return {
					name: opponent?.name || "Opponent",
					flag: opponent?.flag || null,
				};
			} else {
				return {
					name: localStorage.getItem("username") || "You",
					flag: localStorage.getItem("selectedFlag"),
				};
			}
		}
		return {
			name: player === "white" ? "Player" : "Opponent",
			flag: localStorage.getItem("selectedFlag"),
		};
	};

	const { name, flag } = getDisplayInfo();
	const actualPlayerColor = player;
	const opponentColor = actualPlayerColor === "white" ? "black" : "white";
	const capturedByThisPlayer = getCapturedPiecesForPlayer(actualPlayerColor);
	const capturedByTheOpponent = getCapturedPiecesForPlayer(opponentColor);

	return (
		<Stack flexDirection="row" justifyContent="space-between">
			<Stack
				sx={{ margin: 1 }}
				alignItems="center"
				gap={1}
				direction="row"
			>
				{flag && <CircleFlag countryCode={flag} height="35" />}
				<Box display="flex" alignItems="center">
					<Typography variant="h4">{name}</Typography>
				</Box>
				{history && currentIndex !== undefined && (
					<Box display="flex" alignItems="center" sx={{ ml: 0.5 }}>
						<CapturedPieces
							capturedByPlayer={capturedByThisPlayer}
							capturedByOpponent={capturedByTheOpponent}
							isCompact={true}
						/>
					</Box>
				)}
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
};

PlayerInfo.propTypes = {
	gameMode: PropTypes.string.isRequired,
	opponent: PropTypes.object,
	player: PropTypes.string.isRequired,
	time: PropTypes.number.isRequired,
	isCurrentPlayer: PropTypes.bool.isRequired,
	isTop: PropTypes.bool,
	history: PropTypes.arrayOf(
		PropTypes.shape({
			fen: PropTypes.string.isRequired,
			lastMove: PropTypes.object,
		})
	),
	currentIndex: PropTypes.number,
};

export default PlayerInfo;
