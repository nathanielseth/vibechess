import React, { useState } from "react";
import PropTypes from "prop-types";
import {
	Modal,
	Box,
	Button,
	MenuItem,
	Select,
	Switch,
	Typography,
} from "@mui/material";

function SettingsModal({ isOpen, onClose }) {
	const [selectedBoard, setSelectedBoard] = useState("default");
	const [selectedPieces, setSelectedPieces] = useState("default");
	const [premoves, setPremove] = useState(false);
	const [selectedUITheme, setSelectedUITheme] = useState("dark");
	const [autoRematch, setAutoRematch] = useState(true);
	const [sounds, setSounds] = useState(true);
	const [muteChat, setMuteChat] = useState(false);
	const [enableChatFilter, setEnableChatFilter] = useState(false);

	return (
		<Modal open={isOpen} onClose={onClose}>
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
						justifyContent: "space-between",
						mb: 2,
					}}
				>
					<Typography sx={{ fontSize: 17 }}>Board:</Typography>
					<Select
						value={selectedBoard}
						onChange={(e) => setSelectedBoard(e.target.value)}
						style={{ maxHeight: 38 }}
					>
						<MenuItem value="calmGrey">Calm Grey</MenuItem>
						<MenuItem value="vibeRed">Vibe Red</MenuItem>
						<MenuItem value="chillBlue">Chill Blue</MenuItem>
						<MenuItem value="vicePink">Vice Pink</MenuItem>
						<MenuItem value="classicGreen">Classic Green</MenuItem>
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
					<Typography sx={{ fontSize: 17 }}>Pieces:</Typography>
					<Select
						value={selectedPieces}
						onChange={(e) => setSelectedPieces(e.target.value)}
						style={{ maxHeight: 38 }}
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
					<Typography sx={{ fontSize: 17 }}>Premoves:</Typography>
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
					<Typography sx={{ fontSize: 17 }}>UI Theme:</Typography>
					<Select
						value={selectedUITheme}
						onChange={(e) => setSelectedUITheme(e.target.value)}
						style={{ maxHeight: 38 }}
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
					<Typography sx={{ fontSize: 17 }}>Auto Rematch:</Typography>
					<Switch
						checked={autoRematch}
						onChange={() => setAutoRematch(!autoRematch)}
					/>
				</Box>

				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						mb: 2,
					}}
				>
					<Typography sx={{ fontSize: 17 }}>Sounds:</Typography>
					<Switch
						checked={sounds}
						onChange={() => setSounds(!sounds)}
					/>
				</Box>

				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						mb: 2,
					}}
				>
					<Typography sx={{ fontSize: 17 }}>Mute Chat:</Typography>
					<Switch
						checked={muteChat}
						onChange={() => setMuteChat(!muteChat)}
					/>
				</Box>

				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						mb: 3,
					}}
				>
					<Typography sx={{ fontSize: 17 }}>
						Enable Chat Filter:
					</Typography>
					<Switch
						checked={enableChatFilter}
						onChange={() => setEnableChatFilter(!enableChatFilter)}
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
					<Button onClick={() => onClose()} variant="contained">
						CONFIRM
					</Button>
				</Box>
			</Box>
		</Modal>
	);
}

SettingsModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

export default SettingsModal;
