import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Stack, Typography, Tooltip, Box, Grid } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DoneIcon from "@mui/icons-material/Done";
import Navbar from "../common/Navbar";
import { useLocation } from "react-router-dom";
import useSocketContext from "../../context/useSocketContext";
import { useNavigate } from "react-router-dom";

const Room = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { socket } = useSocketContext();

	const [isCreating, setIsCreating] = useState(false);
	const [roomCode, setRoomCode] = useState(null);
	const [error, setError] = useState(null);
	const [isCopied, setIsCopied] = useState(false);
	const [selectedIncrement, setSelectedIncrement] = useState(0);
	const [preferredColor, setPreferredColor] = useState("white");

	const hasEmittedCreate = useRef(false);
	const { selectedTimeControl } = location.state || {};
	const selectedPieceSet =
		window.localStorage.getItem("selectedPieces") || "tatiana";

	const handleCreateRoom = useCallback(() => {
		if (!socket || isCreating || roomCode) return;

		const playerName = localStorage.getItem("username");
		hasEmittedCreate.current = true;
		setIsCreating(true);
		setError(null);

		socket.emit("createRoom", {
			timeControl: selectedTimeControl,
			increment: selectedIncrement,
			playerName: playerName,
			preferredColor,
			flag: localStorage.getItem("selectedFlag") || "ph",
		});
	}, [
		socket,
		selectedTimeControl,
		selectedIncrement,
		preferredColor,
		isCreating,
		roomCode,
	]);

	useEffect(() => {
		if (!socket) return;

		const handleRoomCreated = (data) => {
			console.log("Room created:", data);
			setRoomCode(data.roomCode);
			setIsCreating(false);
			setError(null);
		};

		const handleError = (data) => {
			console.error("Room creation error:", data.message);
			setError(data.message);
			setIsCreating(false);
			setRoomCode(null);
			hasEmittedCreate.current = false;
		};

		const handleGameStarted = (data) => {
			console.log("Game started:", data);
			const player = data.players.find((p) => p.id === socket.id);
			const opponent = data.players.find((p) => p.id !== socket.id);

			navigate("/multiplayer", {
				state: {
					roomCode: data.roomCode,
					gameState: data.gameState,
					yourColor: player?.color,
					opponent: opponent,
					timeControl: selectedTimeControl,
					increment: selectedIncrement,
					isRoomMatch: true,
				},
			});
		};

		const handleGameInitialized = (data) => {
			console.log("Game initialized:", data);
			navigate("/multiplayer", {
				state: {
					roomCode: data.roomCode,
					gameState: data.gameState,
					yourColor: data.playerColor,
					opponent: data.opponent,
					timeControl: selectedTimeControl,
					increment: selectedIncrement,
					isRoomMatch: true,
				},
			});
		};

		const handleRoomSettingsUpdated = (data) => {
			setSelectedIncrement(data.increment);
			setPreferredColor(data.hostPreferredColor);
		};

		socket.on("roomCreated", handleRoomCreated);
		socket.on("error", handleError);
		socket.on("gameStarted", handleGameStarted);
		socket.on("gameInitialized", handleGameInitialized);
		socket.on("roomSettingsUpdated", handleRoomSettingsUpdated);

		if (
			!hasEmittedCreate.current &&
			!isCreating &&
			!roomCode &&
			socket.connected
		) {
			handleCreateRoom();
		}

		return () => {
			socket.off("roomCreated", handleRoomCreated);
			socket.off("error", handleError);
			socket.off("gameStarted", handleGameStarted);
			socket.off("gameInitialized", handleGameInitialized);
			socket.off("roomSettingsUpdated", handleRoomSettingsUpdated);
		};
	}, [
		socket,
		handleCreateRoom,
		navigate,
		selectedTimeControl,
		selectedIncrement,
		isCreating,
		roomCode,
	]);

	const handleColorSelect = (color) => {
		setPreferredColor(color);
		if (socket && roomCode && !isCreating) {
			socket.emit("updateRoomSettings", {
				roomCode,
				increment: selectedIncrement,
				preferredColor: color,
			});
		}
	};

	const handleIncrementClick = (incrementValue) => {
		setSelectedIncrement(incrementValue);
		if (socket && roomCode && !isCreating) {
			socket.emit("updateRoomSettings", {
				roomCode,
				increment: incrementValue,
				preferredColor,
			});
		}
	};

	const handleRoomCodeCopy = () => {
		if (roomCode) {
			navigator.clipboard?.writeText(roomCode);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 5000);
		}
	};

	const getRoomCodeDisplay = () => {
		if (error) return `Error: ${error}`;
		if (isCreating) return "Creating...";
		if (roomCode) return roomCode;
		return "Creating...";
	};

	const incrementOptions = [0, 1, 5, 10];

	return (
		<Stack
			direction="column"
			justifyContent="space-between"
			alignItems="center"
			spacing={-10}
			minHeight="100vh"
		>
			<Navbar />

			<Stack
				flexGrow={1}
				px={3}
				spacing={2}
				alignItems="center"
				justifyContent="center"
			>
				<Tooltip
					title={
						isCopied ? (
							<DoneIcon
								sx={{
									color: "secondary.main",
									fontSize: "1rem",
								}}
							/>
						) : (
							"Copy"
						)
					}
					placement="top"
					arrow
				>
					<Box
						border="2px solid"
						borderColor={error ? "error.main" : "secondary.main"}
						borderRadius={1}
						sx={{
							cursor: roomCode ? "pointer" : "default",
							transition: "all 200ms",
							"&:hover": {
								transform: roomCode ? "scale(1.1)" : "none",
							},
						}}
						px={3}
						py={2}
						onClick={roomCode ? handleRoomCodeCopy : undefined}
					>
						<Typography
							color={error ? "error.main" : "secondary.main"}
							variant="h4"
							textAlign="center"
						>
							Room Code: {getRoomCodeDisplay()}
						</Typography>
					</Box>
				</Tooltip>

				<Typography>Preferred color:</Typography>

				<Box display="flex" justifyContent="center">
					<Box
						borderRadius={1}
						sx={{
							cursor: "pointer",
							transition: "all 200ms",
							"&:hover": {
								transform: "scale(1.1)",
							},
							marginRight: "15px",
							backgroundImage: `url(./piece/${selectedPieceSet}/wN.svg)`,
							backgroundSize: "cover",
							bgcolor: "secondary.main",
							opacity: preferredColor === "white" ? 1.0 : 0.3,
						}}
						px={5}
						py={5}
						onClick={() => handleColorSelect("white")}
					/>
					<Box
						borderRadius={1}
						sx={{
							cursor: "pointer",
							transition: "all 200ms",
							"&:hover": {
								transform: "scale(1.1)",
							},
							backgroundImage: `url(./piece/${selectedPieceSet}/bN.svg)`,
							backgroundSize: "cover",
							bgcolor: "primary.main",
							opacity: preferredColor === "black" ? 1.0 : 0.3,
						}}
						px={5}
						py={5}
						onClick={() => handleColorSelect("black")}
					/>
				</Box>

				<Box display="flex" alignItems="center">
					<AccessTimeIcon />
					<Typography>
						Increment for {selectedTimeControl} min
					</Typography>
				</Box>

				<Grid container spacing={1} justifyContent="center">
					{incrementOptions.map((incrementValue) => (
						<Grid item key={incrementValue}>
							<Box
								display="flex"
								alignItems="center"
								justifyContent="center"
								borderRadius={1}
								sx={{
									cursor: "pointer",
									transition: "all 200ms",
									backgroundColor:
										selectedIncrement === incrementValue
											? "error.main"
											: "transparent",
									"&:hover": {
										transform: "scale(1.1)",
										bgcolor: "error.main",
										opacity: 1,
									},
									backgroundSize: "cover",
									width: "50px",
									height: "50px",
									opacity:
										selectedIncrement === incrementValue
											? 1.0
											: 0.3,
								}}
								onClick={() =>
									handleIncrementClick(incrementValue)
								}
							>
								<Typography variant="h5" textAlign="center">
									+{incrementValue}
								</Typography>
							</Box>
						</Grid>
					))}
				</Grid>

				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ mt: 2 }}
				>
					Share room code with your friend to start
				</Typography>
			</Stack>
		</Stack>
	);
};

Room.propTypes = {
	selectedTimeControl: PropTypes.number,
};

export default Room;
