import React, { useState } from "react";
import { Modal, Box, Button, Typography, Grid } from "@mui/material";
import PropTypes from "prop-types";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import ElectricBoltRoundedIcon from "@mui/icons-material/ElectricBoltRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import Lobby from "./Lobby"; // Import your Lobby component
import { useNavigate } from "react-router-dom";

const TimeControlModal = ({ isOpen, onClose }) => {
	const navigate = useNavigate();
	const [selectedTimeControl, setSelectedTimeControl] = useState(null);

	const handleTimeControlChange = (value) => {
		setSelectedTimeControl(value);
		onClose();
		navigate("/play-with-friend");
	};

	return (
		<>
			<Modal open={isOpen} onClose={onClose}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 380,
						bgcolor: "#1f2123",
						boxShadow: 24,
						p: 4,
						borderRadius: 3,
					}}
				>
					<Typography
						variant="h6"
						sx={{ display: "flex", alignItems: "center" }}
					>
						<AccessTimeIcon sx={{ mr: 1 }} />
						Select Time Control (min)
					</Typography>
					<Grid
						spacing={10}
						sx={{
							display: "grid",
							gridTemplateColumns: "repeat(3, 1fr)",
							gap: "10px",
							mt: 2,
						}}
					>
						{[
							{
								value: 1,
								icon: <WhatshotRoundedIcon fontSize="large" />,
							},
							{
								value: 5,
								icon: (
									<ElectricBoltRoundedIcon fontSize="large" />
								),
							},
							{
								value: 10,
								icon: <TimerRoundedIcon fontSize="large" />,
							},
						].map(({ value, icon }) => (
							<Button
								key={value}
								variant="contained"
								color="primary"
								onClick={() => handleTimeControlChange(value)}
								sx={{
									fontSize: "1.5rem",
									padding: "10px",
								}}
							>
								{icon}
								<Typography variant="h3">{`${value}`}</Typography>
							</Button>
						))}
					</Grid>
					<Box
						sx={{
							mt: 2,
							mb: -2,
							display: "flex",
							justifyContent: "flex-end",
						}}
					>
						<Button onClick={onClose} variant="text">
							Cancel
						</Button>
					</Box>
				</Box>
			</Modal>

			{/* Conditionally render Lobby based on selectedTimeControl */}
			{selectedTimeControl !== null && (
				<Lobby selectedTimeControl={selectedTimeControl} />
			)}
		</>
	);
};

TimeControlModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

export default TimeControlModal;
