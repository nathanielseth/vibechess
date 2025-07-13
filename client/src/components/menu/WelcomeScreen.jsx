import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
	Box,
	IconButton,
	InputAdornment,
	TextField,
	Typography,
	Button,
} from "@mui/material";
import { toast } from "react-toastify";
import { CircleFlag } from "react-circle-flags";
import { generateRandomUsername } from "../../data/randomName";
import { validateUsername } from "../../utils/usernameValidation";
import VibeChessLogo from "../../icons/vibechess.svg";
import FlagSelectorModal from "../common/modal/FlagSelectorModal";

const WelcomeScreen = ({ setUsernameCallback, setFlagCallback, onSubmit }) => {
	const [username, setUsername] = useState("");
	const [error, setError] = useState(null);
	const [selectedFlag, setSelectedFlag] = useState(() => {
		return localStorage.getItem("selectedFlag") || "ph";
	});
	const [isFlagModalOpen, setFlagModalOpen] = useState(false);

	useEffect(() => {
		setFlagCallback(selectedFlag);
	}, [selectedFlag, setFlagCallback]);

	const handleFlagSelect = (code) => {
		setSelectedFlag(code);
		setFlagModalOpen(false);
	};

	const handleSubmit = () => {
		let newUsername = username.trim() || generateRandomUsername();

		const validationError = validateUsername(newUsername);
		if (validationError) {
			setError(validationError);
			return;
		}

		setUsernameCallback(newUsername);
		setFlagCallback(selectedFlag);
		localStorage.setItem("username", newUsername);
		localStorage.setItem("selectedFlag", selectedFlag);

		toast.success(`Welcome, ${newUsername}!`, {
			position: "top-right",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: false,
			draggable: true,
			theme: "colored",
			icon: "👋🏼",
			style: { background: "#f24040" },
		});
		onSubmit();
	};

	return (
		<Box
			px={2}
			display="flex"
			flexDirection="column"
			minHeight="100vh"
			alignItems="center"
			justifyContent="center"
			bgcolor="#101010"
			color="white"
		>
			<img
				loading="lazy"
				src={VibeChessLogo}
				alt="VibeChess Logo"
				style={{ width: "100px", marginBottom: "10px" }}
			/>
			<Typography
				marginBottom={4}
				textAlign="center"
				variant="h3"
				color="inherit"
			>
				<span style={{ color: "#f24040" }}>Vibe</span>Chess
			</Typography>
			<Box
				display="flex"
				flexDirection="column"
				width={{ xs: "90%", sm: "400px", md: "30%", lg: "20%" }}
				alignItems="center"
				gap={2}
			>
				<TextField
					onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
					value={username}
					onChange={(e) => {
						setError(null);
						setUsername(e.target.value);
					}}
					fullWidth
					error={!!error}
					autoComplete="off"
					label={error || "What should we call you?"}
					inputProps={{ maxLength: 14 }}
					variant="outlined"
					sx={{
						height: "65px",
						"& .MuiOutlinedInput-input": {
							padding: "18px 14px",
						},
					}}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									onClick={() => setFlagModalOpen(true)}
									sx={{
										borderRadius: "100%",
										"&:hover": {
											backgroundColor:
												"rgba(255, 255, 255, 0.1)",
										},
									}}
									edge="end"
								>
									<CircleFlag
										countryCode={selectedFlag}
										height="40"
									/>
								</IconButton>
							</InputAdornment>
						),
					}}
				/>
				<Button
					onClick={handleSubmit}
					variant="contained"
					fullWidth
					sx={{
						backgroundColor: "#f24040",
						color: "white",
						py: 1.5,
						fontSize: "1.1rem",
						"&:hover": {
							backgroundColor: "#d63636",
						},
					}}
				>
					Enter VibeChess
				</Button>
			</Box>
			<FlagSelectorModal
				open={isFlagModalOpen}
				onClose={() => setFlagModalOpen(false)}
				onSelect={handleFlagSelect}
			/>
		</Box>
	);
};

WelcomeScreen.propTypes = {
	setUsernameCallback: PropTypes.func.isRequired,
	setFlagCallback: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
};

export default WelcomeScreen;
