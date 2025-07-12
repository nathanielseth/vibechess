import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Stack, Typography, Tooltip, Box, Grid, Button } from "@mui/material";
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
	const [selectedIncrement, setSelectedIncrement] = useState(1);

	const [preferredColor, setPreferredColor] = useState("white");
	const [whiteBoxOpacity, setWhiteBoxOpacity] = useState(1.0);
	const [blackBoxOpacity, setBlackBoxOpacity] = useState(0.3);

	const [incrementOneOpacity, setIncrementOneOpacity] = useState(1.0);
	const [incrementFiveOpacity, setIncrementFiveOpacity] = useState(0.3);
	const [incrementTenOpacity, setIncrementTenOpacity] = useState(0.3);

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
		)
			return;

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

	const handleWhiteSelect = () => {
		setPreferredColor("white");
		setWhiteBoxOpacity(1.0);
		setBlackBoxOpacity(0.3);
	};

	const handleBlackSelect = () => {
		setPreferredColor("black");
		setWhiteBoxOpacity(0.3);
		setBlackBoxOpacity(1.0);
	};

	const handleIncrementClick = (incrementValue) => {
		setSelectedIncrement(incrementValue);

		setIncrementOneOpacity(0.3);
		setIncrementFiveOpacity(0.3);
		setIncrementTenOpacity(0.3);

		switch (incrementValue) {
			case 1:
				setIncrementOneOpacity(1.0);
				break;
			case 5:
				setIncrementFiveOpacity(1.0);
				break;
			case 10:
				setIncrementTenOpacity(1.0);
				break;
			default:
				break;
		}
	};

	const handleRoomCodeCopy = () => {
		if (roomState?.roomCode) {
			navigator.clipboard?.writeText(roomState.roomCode);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 5000);
		}
	};

	const getIncrementOpacity = (incrementValue) => {
		switch (incrementValue) {
			case 1:
				return incrementOneOpacity;
			case 5:
				return incrementFiveOpacity;
			case 10:
				return incrementTenOpacity;
			default:
				return 0.3;
		}
	};

	const getRoomCode = () => {
		if (roomState === "creating") return "Creating...";
		if (roomState?.roomCode) return roomState.roomCode;
		return "Click Create Room";
	};

	const handleManualCreateRoom = () => {
		if (roomState?.roomCode || roomState === "creating") return;

		hasEmittedCreate.current = false;
		setRoomState(null);
		handleCreateRoom();
	};

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
							opacity: whiteBoxOpacity,
						}}
						px={5}
						py={5}
						onClick={handleWhiteSelect}
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
							opacity: blackBoxOpacity,
						}}
						px={5}
						py={5}
						onClick={handleBlackSelect}
					/>
				</Box>

				<Box display="flex" alignItems="center">
					<AccessTimeIcon />
					<Typography>
						Increment for {selectedTimeControl} min
					</Typography>
				</Box>

				<Grid container spacing={1} justifyContent="center">
					{[1, 5, 10].map((incrementValue) => (
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
										getIncrementOpacity(incrementValue),
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

				<Button
					variant="contained"
					color="primary"
					size="large"
					onClick={handleManualCreateRoom}
					disabled={roomState === "creating" || !!roomState?.roomCode}
					sx={{ mt: 3 }}
				>
					{roomState === "creating"
						? "Creating Room..."
						: roomState?.roomCode
						? "Room Created - Waiting for Opponent"
						: "Create Room"}
				</Button>

				{roomState?.roomCode && (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 2 }}
					>
						Share the room code with your opponent to start the game
					</Typography>
				)}
			</Stack>
		</Stack>
	);
};

Room.propTypes = {
	selectedTimeControl: PropTypes.number,
};

export default Room;
