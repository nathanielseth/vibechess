import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import {
	Modal,
	Box,
	Button,
	MenuItem,
	Select,
	Switch,
	Typography,
	IconButton,
	Fade,
	TextField,
} from "@mui/material";
import { CircleFlag } from "react-circle-flags";
import FlagSelectorModal from "./FlagSelectorModal";
import { generateRandomUsername } from "../../../data/randomName";
import { validateUsername } from "../../../utils/usernameValidation";
import { useTheme } from "@mui/material/styles";
import { ThemeContext } from "../../../theme/ThemeContext";

function SettingsModal({ isOpen, onClose, onBoardChange, onPiecesChange }) {
	const theme = useTheme();
	const { switchColorMode } = useContext(ThemeContext);

	const getBooleanFromStorage = (key, defaultValue = false) => {
		const stored = window.localStorage.getItem(key);
		if (stored === null) return defaultValue;
		return stored === "true";
	};

	const [selectedBoard, setSelectedBoard] = useState(
		window.localStorage.getItem("selectedBoard") || "grey"
	);
	const [selectedPieces, setSelectedPieces] = useState(
		window.localStorage.getItem("selectedPieces") || "tatiana"
	);
	const [premoves, setPremoves] = useState(
		getBooleanFromStorage("premoves", true)
	);
	const [sounds, setSounds] = useState(getBooleanFromStorage("sounds", true));
	const [enableChatFilter, setEnableChatFilter] = useState(
		getBooleanFromStorage("enableChatFilter", true)
	);
	const [flagSelectorOpen, setFlagSelectorOpen] = useState(false);

	const selectedFlag = window.localStorage.getItem("selectedFlag");
	const [username, setUsername] = useState(
		window.localStorage.getItem("username") || "Guest"
	);
	const [usernameError, setUsernameError] = useState(null);

	const handleFlagButtonClick = () => {
		setFlagSelectorOpen(true);
	};

	const handleFlagSelect = () => {
		setFlagSelectorOpen(false);
	};

	const handleUsernameChange = (event) => {
		const newUsername = event.target.value;
		setUsername(newUsername);

		if (usernameError) {
			setUsernameError(null);
		}
	};

	const handlePremovesChange = (event) => {
		const newValue = event.target.checked;
		setPremoves(newValue);
		window.localStorage.setItem("premoves", newValue.toString());
	};

	const handleSoundsChange = (event) => {
		const newValue = event.target.checked;
		setSounds(newValue);
		window.localStorage.setItem("sounds", newValue.toString());
	};

	const handleChatFilterChange = (event) => {
		const newValue = event.target.checked;
		setEnableChatFilter(newValue);
		window.localStorage.setItem("enableChatFilter", newValue.toString());
	};

	const handleBoardChange = (event) => {
		const newValue = event.target.value;
		setSelectedBoard(newValue);
		window.localStorage.setItem("selectedBoard", newValue);

		if (onBoardChange) {
			onBoardChange(newValue);
		}
	};

	const handlePiecesChange = (event) => {
		const newValue = event.target.value;
		setSelectedPieces(newValue);
		window.localStorage.setItem("selectedPieces", newValue);

		if (onPiecesChange) {
			onPiecesChange(newValue);
		}
	};

	const handleOkay = () => {
		let finalUsername = username.trim();

		if (!finalUsername) {
			finalUsername = generateRandomUsername();
		}

		const validationError = validateUsername(finalUsername);
		if (validationError) {
			setUsernameError(validationError);
			return;
		}

		if (finalUsername !== username) {
			setUsername(finalUsername);
		}

		window.localStorage.setItem("username", finalUsername);

		window.dispatchEvent(
			new CustomEvent("settingsChanged", {
				detail: {
					username: finalUsername,
				},
			})
		);

		onClose();
	};

	const handleUIThemeChange = () => {
		const newTheme = theme.palette.mode === "dark" ? "light" : "dark";
		window.localStorage.setItem("selectedUITheme", newTheme);
		switchColorMode();
	};

	useEffect(() => {
		if (isOpen) {
			setSelectedBoard(
				window.localStorage.getItem("selectedBoard") || "grey"
			);
			setSelectedPieces(
				window.localStorage.getItem("selectedPieces") || "tatiana"
			);
			setPremoves(getBooleanFromStorage("premoves", true));
			setSounds(getBooleanFromStorage("sounds", true));
			setEnableChatFilter(
				getBooleanFromStorage("enableChatFilter", true)
			);
			setUsername(window.localStorage.getItem("username") || "Guest");
			setUsernameError(null);
		}
	}, [isOpen]);

	return (
		<Modal open={isOpen} onClose={onClose}>
			<Fade in={isOpen}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 440,
						bgcolor:
							theme.palette.mode === "dark"
								? "#1f2123"
								: "#fff8f0",
						boxShadow: 24,
						p: 4,
						borderRadius: 3,
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 3,
							borderRadius: "10px",
						}}
					>
						<IconButton
							onClick={handleFlagButtonClick}
							style={{ borderRadius: "100%" }}
						>
							<CircleFlag
								countryCode={selectedFlag}
								height="50"
							/>
						</IconButton>
						<TextField
							id="outlined-helperText"
							label={usernameError || "Username"}
							sx={{ marginLeft: 1 }}
							value={username}
							onChange={handleUsernameChange}
							error={!!usernameError}
							inputProps={{ maxLength: 14 }}
						/>
					</Box>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 2,
						}}
					>
						<Typography sx={{ fontSize: 16 }}>Board</Typography>
						<Select
							value={selectedBoard}
							onChange={handleBoardChange}
							style={{ maxHeight: 38, width: 210 }}
						>
							<MenuItem value="grey">Calm Grey</MenuItem>
							<MenuItem value="red">Vibe Red</MenuItem>
							<MenuItem value="blue">Cool Blue</MenuItem>
							<MenuItem value="mud">Mud Keep</MenuItem>
							<MenuItem value="orange">Orange Cat</MenuItem>
							<MenuItem value="green">Classic Green</MenuItem>
							<MenuItem value="lavander">
								Moonlight Lavander
							</MenuItem>
						</Select>
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							mb: 2,
						}}
					>
						<Typography sx={{ fontSize: 16 }}>Pieces</Typography>
						<Select
							value={selectedPieces}
							onChange={handlePiecesChange}
							style={{ maxHeight: 38, width: 210 }}
						>
							<MenuItem value="tatiana">Tatiana</MenuItem>
							<MenuItem value="staunty">Staunty</MenuItem>
							<MenuItem value="merida">Merida</MenuItem>
							<MenuItem value="alpha">Alpha</MenuItem>
							<MenuItem value="maestro">Maestro</MenuItem>
							<MenuItem value="anarcandy">Anarcandy</MenuItem>
						</Select>
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							mb: 2,
						}}
					>
						<Typography sx={{ fontSize: 16 }}>Premoves</Typography>
						<Switch
							checked={premoves}
							onChange={handlePremovesChange}
						/>
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							mb: 2,
						}}
					>
						<Typography sx={{ fontSize: 16 }}>Dark Mode</Typography>
						<Switch
							checked={theme.palette.mode === "dark"}
							onChange={handleUIThemeChange}
						/>
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							mb: 2,
						}}
					>
						<Typography sx={{ fontSize: 16 }}>Sounds</Typography>
						<Switch
							checked={sounds}
							onChange={handleSoundsChange}
						/>
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							mb: 3,
						}}
					>
						<Typography sx={{ fontSize: 16 }}>
							Enable Chat Filter
						</Typography>
						<Switch
							checked={enableChatFilter}
							onChange={handleChatFilterChange}
						/>
					</Box>
					<Box
						sx={{
							mt: 2,
							display: "flex",
							justifyContent: "flex-end",
							mb: -1,
						}}
					>
						<Button onClick={handleOkay} variant="contained">
							OKAY
						</Button>
					</Box>
					<FlagSelectorModal
						open={flagSelectorOpen}
						onClose={() => setFlagSelectorOpen(false)}
						onSelect={handleFlagSelect}
					/>
				</Box>
			</Fade>
		</Modal>
	);
}

SettingsModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onBoardChange: PropTypes.func,
	onPiecesChange: PropTypes.func,
};

export default SettingsModal;
