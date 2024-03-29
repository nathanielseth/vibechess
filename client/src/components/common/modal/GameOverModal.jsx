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
	//gameMode,
}) => {
	const navigate = useNavigate();
	const selectedFlag = window.localStorage.getItem("selectedFlag");

	const handleMenu = () => navigate("/");

	const handleRematch = () => {
		onRematch();
		onClose();
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
							{winner && winner !== "passandplay"
								? `${winner} WON!`
								: endReason === "nobody won this one.."
								? "DRAW!"
								: "YOU WON!"}
						</Typography>
						<Typography variant="subtitle1">{endReason}</Typography>
					</Box>

					{/* Middle Box */}
					<Grid container spacing={2} justifyContent="center" mb={4}>
						{/* White Player */}
						<Grid item xs={6}>
							<CircleFlag
								countryCode={selectedFlag}
								height="90"
							/>
							<Typography variant="subtitle2">
								White Player
							</Typography>
						</Grid>

						{/* Black Player */}
						<Grid item xs={6}>
							<CircleFlag
								countryCode={selectedFlag}
								height="90"
							/>
							<Typography variant="subtitle2">
								Black Player
							</Typography>
						</Grid>
					</Grid>

					{/* Bottom Box */}
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
	gameMode: PropTypes.string,
};

export default GameOverModal;
