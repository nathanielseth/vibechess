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
	const selectedFlag = window.localStorage.getItem("selectedFlag") || "ph";

	const handleMenu = () => navigate("/");
	const handleRematch = () => {
		onRematch();
		onClose();
	};

	const getWinnerMessage = () => {
		if (!winner) return endReason || "Game Over";

		if (gameMode === "local") {
			return `${winner.toUpperCase()} WON!`;
		}

		if (gameMode === "versus-bot") {
			if (winner === playerColor) {
				return "YOU WON!";
			} else {
				return "BOT WON!";
			}
		}

		// For multiplayer
		const winnerPlayer = players.find((p) => p.color === winner);
		const currentPlayer = players.find((p) => p.color === playerColor);

		if (winner === playerColor) {
			return `${currentPlayer?.name || "You"} WON!`;
		} else {
			return `${winnerPlayer?.name || "Opponent"} WON!`;
		}
	};

	const getPlayerInfo = (color) => {
		if (gameMode === "local") {
			return {
				name: `${
					color.charAt(0).toUpperCase() + color.slice(1)
				} Player`,
				flag: selectedFlag,
			};
		}

		if (gameMode === "versus-bot") {
			if (color === playerColor) {
				return {
					name: "You",
					flag: selectedFlag,
				};
			} else {
				return {
					name: "Bot",
					flag: "gb", // Default bot flag
				};
			}
		}

		// For multiplayer
		const player = players.find((p) => p.color === color);
		return {
			name:
				player?.name ||
				`${color.charAt(0).toUpperCase() + color.slice(1)} Player`,
			flag: player?.flag || selectedFlag,
		};
	};

	const shouldShowBothPlayers = () => {
		return gameMode === "multiplayer" || !winner;
	};

	const getDisplayPlayers = () => {
		const whitePlayer = getPlayerInfo("white");
		const blackPlayer = getPlayerInfo("black");

		if (shouldShowBothPlayers()) {
			return [
				{ ...whitePlayer, color: "white" },
				{ ...blackPlayer, color: "black" },
			];
		}

		// For local and versus-bot, show only the winner
		if (winner === "white") {
			return [{ ...whitePlayer, color: "white" }];
		} else if (winner === "black") {
			return [{ ...blackPlayer, color: "black" }];
		}

		// Fallback - shouldn't happen but just in case
		return [{ ...whitePlayer, color: "white" }];
	};

	const displayPlayers = getDisplayPlayers();

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
						{displayPlayers.map((player) => (
							<Grid
								item
								xs={shouldShowBothPlayers() ? 6 : 12}
								key={player.color}
							>
								<CircleFlag
									countryCode={player.flag}
									height="90"
								/>
								<Typography variant="subtitle2">
									{player.name}
								</Typography>
								{winner === player.color && (
									<Typography
										variant="caption"
										color="success.main"
									>
										Winner
									</Typography>
								)}
							</Grid>
						))}
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
	endReason: PropTypes.string,
	winner: PropTypes.string,
	players: PropTypes.array,
	playerColor: PropTypes.string,
	gameMode: PropTypes.string,
};

export default GameOverModal;
