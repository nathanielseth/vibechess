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

	const [roomState, setRoomState] = useState(null);
	const [isCopied, setIsCopied] = useState(false);
	const [selectedIncrement, setSelectedIncrement] = useState(0);
	const [preferredColor, setPreferredColor] = useState("white");

	const hasEmittedCreate = useRef(false);
	const { selectedTimeControl } = location.state || {};
	const selectedPieceSet =
		window.localStorage.getItem("selectedPieces") || "tatiana";

	const handleCreateRoom = useCallback(() => {
		if (
			!socket ||
			hasEmittedCreate.current ||
			roomState === "creating" ||
			roomState?.roomCode
		) {
			return;
		}

		const playerName = localStorage.getItem("username");
		hasEmittedCreate.current = true;
		setRoomState("creating");

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
		roomState,
	]);

	const handleUpdateRoomSettings = useCallback(() => {
		if (!socket || !roomState?.roomCode) return;

		socket.emit("updateRoomSettings", {
			roomCode: roomState.roomCode,
			increment: selectedIncrement,
			preferredColor,
		});
	}, [socket, roomState, selectedIncrement, preferredColor]);

	useEffect(() => {
		if (!socket) return;

		const handleRoomCreated = (data) => {
			console.log("Room created:", data);
			setRoomState(data);
		};

		const handleError = (data) => {
			console.error("Room creation error:", data.message);
			setRoomState(null);
			hasEmittedCreate.current = false;
		};

		const handleGameStarted = (data) => {
			console.log("Game started:", data);
			navigate("/multiplayer", {
				state: {
					roomCode: data.roomCode,
					gameState: data.gameState,
					players: data.players,
					timeControl: selectedTimeControl,
					increment: selectedIncrement,
				},
			});
		};

		const handleGameInitialized = (data) => {
			console.log("Game initialized:", data);
			navigate("/multiplayer", {
				state: {
					roomCode: data.roomCode,
					gameState: data.gameState,
					playerColor: data.playerColor,
					opponent: data.opponent,
					timeControl: selectedTimeControl,
					increment: selectedIncrement,
				},
			});
		};

		socket.on("roomCreated", handleRoomCreated);
		socket.on("error", handleError);
		socket.on("gameStarted", handleGameStarted);
		socket.on("gameInitialized", handleGameInitialized);

		if (!hasEmittedCreate.current && !roomState) {
			setTimeout(() => {
				handleCreateRoom();
			}, 100);
		}

		return () => {
			socket.off("roomCreated", handleRoomCreated);
			socket.off("error", handleError);
			socket.off("gameStarted", handleGameStarted);
			socket.off("gameInitialized", handleGameInitialized);
		};
	}, [
		socket,
		handleCreateRoom,
		navigate,
		selectedTimeControl,
		selectedIncrement,
		roomState,
	]);

	useEffect(() => {
		if (roomState?.roomCode && roomState !== "creating") {
			handleUpdateRoomSettings();
		}
	}, [
		selectedIncrement,
		preferredColor,
		handleUpdateRoomSettings,
		roomState,
	]);

	const handleColorSelect = (color) => {
		setPreferredColor(color);
	};

	const handleIncrementClick = (incrementValue) => {
		setSelectedIncrement(incrementValue);
	};

	const handleRoomCodeCopy = () => {
		if (roomState?.roomCode) {
			navigator.clipboard?.writeText(roomState.roomCode);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 5000);
		}
	};

	const getRoomCode = () => {
		if (roomState === "creating") return "Creating...";
		if (roomState?.roomCode) return roomState.roomCode;
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
						borderColor="secondary.main"
						borderRadius={1}
						sx={{
							cursor: roomState?.roomCode ? "pointer" : "default",
							transition: "all 200ms",
							"&:hover": {
								transform: roomState?.roomCode
									? "scale(1.1)"
									: "none",
							},
						}}
						px={3}
						py={2}
						onClick={
							roomState?.roomCode ? handleRoomCodeCopy : undefined
						}
					>
						<Typography
							color="secondary.main"
							variant="h4"
							textAlign="center"
						>
							Room Code: {getRoomCode()}
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
							backgroundImage: `url(/piece/${selectedPieceSet}/wN.svg)`,
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
							backgroundImage: `url(/piece/${selectedPieceSet}/bN.svg)`,
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
