import React, { useState, useEffect } from "react";
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
import FlagSelectorModal from "../common/FlagSelectorModal";
import { generateRandomUsername } from "../../data/randomName";

function SettingsModal({ isOpen, onClose }) {
	const [selectedBoard, setSelectedBoard] = useState(
		window.localStorage.getItem("selectedBoard") || "calmGrey"
	);
	const [selectedPieces, setSelectedPieces] = useState(
		window.localStorage.getItem("selectedPieces") || "tatiana"
	);
	const [premoves, setPremove] = useState(
		window.localStorage.getItem("premoves") === "true" || true
	);
	const [selectedUITheme, setSelectedUITheme] = useState(
		window.localStorage.getItem("selectedUITheme") || "dark"
	);
	const [sounds, setSounds] = useState(
		window.localStorage.getItem("sounds") === "true" || true
	);
	const [enableChatFilter, setEnableChatFilter] = useState(
		window.localStorage.getItem("enableChatFilter") === "true" || true
	);
	const [flagSelectorOpen, setFlagSelectorOpen] = useState(false);

	const selectedFlag = window.localStorage.getItem("selectedFlag");
	const [username, setUsername] = useState(
		window.localStorage.getItem("username") || "Guest"
	);

	const handleFlagButtonClick = () => {
		setFlagSelectorOpen(true);
	};

	const handleFlagSelect = () => {
		setFlagSelectorOpen(false);
	};

	const handleUsernameChange = (event) => {
		setUsername(event.target.value);
	};

	const handleConfirm = () => {
		if (!username.trim()) {
			setUsername(generateRandomUsername());
		}

		window.localStorage.setItem("username", username);
		window.localStorage.setItem("selectedBoard", selectedBoard);
		window.localStorage.setItem("selectedPieces", selectedPieces);
		window.localStorage.setItem("premoves", premoves);
		window.localStorage.setItem("selectedUITheme", selectedUITheme);
		window.localStorage.setItem("sounds", sounds);
		window.localStorage.setItem("enableChatFilter", enableChatFilter);

		onClose();
	};

	useEffect(() => {
		window.localStorage.setItem("selectedBoard", selectedBoard);
		window.localStorage.setItem("selectedPieces", selectedPieces);
		window.localStorage.setItem("premoves", premoves);
		window.localStorage.setItem("selectedUITheme", selectedUITheme);
		window.localStorage.setItem("sounds", sounds);
		window.localStorage.setItem("enableChatFilter", enableChatFilter);
	}, [
		selectedBoard,
		selectedPieces,
		premoves,
		selectedUITheme,
		sounds,
		enableChatFilter,
	]);

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
						bgcolor: "#1f2123",
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
							label="Username"
							sx={{ marginLeft: 1 }}
							value={username}
							onChange={handleUsernameChange}
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
							onChange={(e) => setSelectedBoard(e.target.value)}
							style={{ maxHeight: 38, width: 210 }}
						>
							<MenuItem value="calmGrey">Calm Grey</MenuItem>
							<MenuItem value="vibeRed">Vibe Red</MenuItem>
							<MenuItem value="chillBlue">Chill Blue</MenuItem>
							<MenuItem value="vicePink">Vice Pink</MenuItem>
							<MenuItem value="classicGreen">
								Classic Green
							</MenuItem>
							<MenuItem value="tabbyCatOrange">
								Tabby Cat Orange
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
							onChange={(e) => setSelectedPieces(e.target.value)}
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
							onChange={() => setPremove(!premoves)}
						/>
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							mb: 2,
						}}
					>
						<Typography sx={{ fontSize: 16 }}>UI Theme</Typography>
						<Select
							value={selectedUITheme}
							onChange={(e) => setSelectedUITheme(e.target.value)}
							style={{ maxHeight: 38, width: 210 }}
						>
							<MenuItem value="dark">Dark</MenuItem>
							<MenuItem value="light">Light</MenuItem>
						</Select>
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
							onChange={() => setSounds(!sounds)}
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
							onChange={() =>
								setEnableChatFilter(!enableChatFilter)
							}
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
						<Button onClick={handleConfirm} variant="contained">
							CONFIRM
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
};

export default SettingsModal;
