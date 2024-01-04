import React, { useState } from "react";
import PropTypes from "prop-types";
import {
	Box,
	IconButton,
	InputAdornment,
	TextField,
	Typography,
} from "@mui/material";
import ArrowIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { toast } from "react-toastify";
import { CircleFlag } from "react-circle-flags";
import { generateRandomUsername } from "../utils/randomName";
import VibeChessLogo from "../icons/vibechess.svg";
import FlagSelectorModal from "./FlagSelectorModal";

const WelcomeScreen = ({ setUsernameCallback, setFlagCallback, onSubmit }) => {
	const [username, setUsername] = useState("");
	const [error, setError] = useState(null);
	const [selectedFlag, setSelectedFlag] = useState("ph");
	const [isFlagModalOpen, setFlagModalOpen] = useState(false);

	const handleFlagSelect = (code) => {
		setSelectedFlag(code);
		setFlagModalOpen(false);
	};

	const handleSubmit = () => {
		let newUsername = username || generateRandomUsername();

		if (newUsername.length < 2) {
			setError("Please use at least 2 characters.");
			return;
		}

		setUsernameCallback(newUsername);
		setFlagCallback(selectedFlag);
		window.localStorage.setItem("username", newUsername);
		window.localStorage.setItem("selectedFlag", selectedFlag);

		toast.success(`Welcome, ${newUsername}!`, {
			position: "top-right",
			autoClose: 4000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: false,
			draggable: true,
			theme: "colored",
			icon: "👋🏼",
			style: { background: "#ce1126" },
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
				style={{ width: "100px", marginBottom: "20px" }}
			/>
			<Typography
				marginBottom={4}
				textAlign="center"
				variant="h5"
				color="inherit"
			>
				Welcome to VibeChess
			</Typography>
			<Box
				display="flex"
				width={{ xs: "auto", md: "32%", lg: "22%" }}
				alignItems="center"
			>
				<IconButton
					onClick={() => setFlagModalOpen(true)}
					style={{ marginRight: "0px", borderRadius: "100%" }}
				>
					<CircleFlag countryCode={selectedFlag} height="40" />
				</IconButton>
				<TextField
					onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
					value={username}
					onChange={(e) => {
						setError(null);
						setUsername(e.target.value);
					}}
					fullWidth
					error={error}
					helperText={error}
					autoComplete="off"
					label="What's your name?"
					inputProps={{ maxLength: 14 }}
					InputLabelProps={{
						sx: {
							color: "#a6a6a6",
							"&.Mui-focused": {
								color: "#fff",
							},
						},
					}}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									sx={{
										color: "#a6a6a6",
										"&:hover, &:focus": { color: "#ce1126" },
									}}
									disabled={false}
									onClick={handleSubmit}
									edge="end"
								>
									<ArrowIcon />
								</IconButton>
							</InputAdornment>
						),
					}}
					variant="outlined"
					sx={{
						"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
							{
								borderColor: "#ce1126",
							},
					}}
				/>
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
