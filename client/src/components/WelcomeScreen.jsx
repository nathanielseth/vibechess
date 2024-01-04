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
import ReactFlagsSelect, { Ph } from "react-flags-select";
import { generateRandomUsername } from "../utils/randomName";

import VibeChessLogo from "../icons/vibechess.svg";

const WelcomeScreen = ({ setUsernameCallback }) => {
	const [username, setUsername] = useState("");
	const [error, setError] = useState(null);
	const [selectedFlag, setSelectedFlag] = useState("PH");

	const handleSubmit = () => {
		let newUsername = username || generateRandomUsername();

		if (newUsername.length < 2) {
			setError("Please use at least 2 characters.");
			return;
		}

		setUsernameCallback(newUsername);
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
			<Box display="flex" width={{ xs: "auto", md: "30%", lg: "20%" }}>
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
					placeholder="What's your name?"
					inputProps={{ maxLength: 14 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<ReactFlagsSelect
									defaultCountry="PH"
									selected={selectedFlag}
									onSelect={(code) => setSelectedFlag(code)}
									placeholder={<Ph />}
									countries={[
										"PH",
										"US",
										"IN",
										"UA",
										"FR",
										"GB",
										"AZ",
										"RU",
										"DE",
										"ES",
									]}
									showSelectedLabel={false}
									showOptionLabel={false}
									showSecondarySelectedLabel={false}
									showSecondaryOptionLabel={false}
									alignOptionsToRight
									selectedSize={21}
									optionsSize={21}
								/>
							</InputAdornment>
						),
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
		</Box>
	);
};

WelcomeScreen.propTypes = {
	setUsernameCallback: PropTypes.func.isRequired,
};

export default WelcomeScreen;
