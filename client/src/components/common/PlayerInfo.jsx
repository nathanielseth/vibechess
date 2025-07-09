import React from "react";
import PropTypes from "prop-types";
import { Stack, Typography, Box } from "@mui/material";
import { CircleFlag } from "react-circle-flags";
import { formatTime } from "../game/utils/chessboardUtils";

const PlayerInfo = ({
	gameMode,
	opponent,
	player,
	time,
	isCurrentPlayer,
	isTop = false,
}) => {
	const getDisplayName = () => {
		if (gameMode === "multiplayer") {
			return isTop
				? opponent?.name || "Opponent"
				: localStorage.getItem("username") || "You";
		}
		return player === "white" ? "Player" : "Opponent";
	};

	const getPlayerFlag = () => {
		if (gameMode === "multiplayer") {
			if (isTop) {
				return opponent?.flag || opponent?.countryCode || "UN";
			} else {
				return localStorage.getItem("selectedFlag");
			}
		}
		return localStorage.getItem("selectedFlag") || "PH";
	};

	return (
		<Stack flexDirection="row" justifyContent="space-between">
			<Stack
				sx={{ margin: 1 }}
				alignItems="center"
				gap={1}
				direction={{ xs: "column", md: "row" }}
			>
				<CircleFlag countryCode={getPlayerFlag()} height="35" />
				<Typography variant="h4">{getDisplayName()}</Typography>
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
};

export default PlayerInfo;
