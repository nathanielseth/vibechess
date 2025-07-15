import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Modal, Box, Typography, Grid, Button, Fade } from "@mui/material";
import { CircleFlag } from "react-circle-flags";
import ReplayIcon from "@mui/icons-material/Replay";

const GameOverModal = ({
	isOpen,
	onClose,
	onRematch,
	endReason,
	winner,
	players = [],
	playerColor,
	gameMode,
}) => {
	const navigate = useNavigate();
	const selectedFlag = window.localStorage.getItem("selectedFlag");

	const handleMenu = () => navigate("/");
	const handleRematch = () => {
		onRematch();
		onClose();
	};

	const getPlayerByColor = (color) => {
		if (gameMode === "multiplayer" && players.length > 0) {
			return players.find((p) => p.color === color);
		}
		return null;
	};

	const whitePlayer = getPlayerByColor("white");
	const blackPlayer = getPlayerByColor("black");

	const getWinnerMessage = () => {
		if (!winner) return endReason || "Game Over";

		if (gameMode === "local") {
			return `${winner.toUpperCase()} WON!`;
		}

		// For multiplayer/versusbot
		const winnerPlayer = players.find((p) => p.color === winner);
		const currentPlayer = players.find((p) => p.color === playerColor);

		if (winner === playerColor) {
			return `${currentPlayer?.name || "You"} WON!`;
		} else {
			return `${winnerPlayer?.name || "Opponent"} WON!`;
		}
	};

	const getPlayerName = (player, defaultName) => {
		if (gameMode === "multiplayer" && player?.name) {
			return player.name;
		}
		return defaultName;
	};

	const getPlayerFlag = (player) => {
		if (gameMode === "multiplayer" && player?.flag) {
			return player.flag;
		}
		return selectedFlag || "us";
	};

	return (
		<Modal open={isOpen} onClose={onClose} autoFocus={false}>
			<Fade in={isOpen}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 440,
						bgcolor: "#1f2123",
						boxShadow: 24,
						p: 4,
						borderRadius: 3,
						textAlign: "center",
					}}
				>
					{/* Top Box */}
					<Box mb={4}>
						<Typography variant="h4">
							{getWinnerMessage()}
						</Typography>
						<Typography variant="subtitle1">{endReason}</Typography>
					</Box>

					{/* Middle Box - Player Info */}
					<Grid container spacing={2} justifyContent="center" mb={4}>
						{/* White Player */}
						<Grid item xs={6}>
							<CircleFlag
								countryCode={getPlayerFlag(whitePlayer)}
								height="90"
							/>
							<Typography variant="subtitle2">
								{getPlayerName(whitePlayer, "White Player")}
							</Typography>
							{winner === "white" && (
								<Typography
									variant="caption"
									color="success.main"
								>
									Winner
								</Typography>
							)}
						</Grid>

						{/* Black Player */}
						<Grid item xs={6}>
							<CircleFlag
								countryCode={getPlayerFlag(blackPlayer)}
								height="90"
							/>
							<Typography variant="subtitle2">
								{getPlayerName(blackPlayer, "Black Player")}
							</Typography>
							{winner === "black" && (
								<Typography
									variant="caption"
									color="success.main"
								>
									Winner
								</Typography>
							)}
						</Grid>
					</Grid>

					{/* Bottom Box - Action Buttons */}
					<Grid container spacing={2} justifyContent="center">
						<Grid item xs={6}>
							<Button
								variant="contained"
								color="primary"
								fullWidth
								onClick={handleMenu}
								sx={{ height: "50px" }}
							>
								Back to Menu
							</Button>
						</Grid>
						<Grid item xs={6}>
							<Button
								variant="contained"
								color="secondary"
								fullWidth
								startIcon={<ReplayIcon />}
								onClick={handleRematch}
								sx={{ height: "50px" }}
							>
								Rematch
							</Button>
						</Grid>
					</Grid>
				</Box>
			</Fade>
		</Modal>
	);
};

GameOverModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onRematch: PropTypes.func,
	onNewGame: PropTypes.func,
	endReason: PropTypes.string,
	winner: PropTypes.string,
	players: PropTypes.array,
	playerColor: PropTypes.string,
	gameMode: PropTypes.string,
};

export default GameOverModal;
