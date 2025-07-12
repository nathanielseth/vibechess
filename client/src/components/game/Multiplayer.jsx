import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../common/Navbar";
import Loading from "../common/Loading";
import { Stack } from "@mui/material";
import ChessboardComponent from "./ChessboardComponent";
import { notifySound } from "../../data/utils";
import { toast } from "react-toastify";
import useSocketContext from "../../context/useSocketContext";

const Multiplayer = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [gameMode] = useState("multiplayer");
	const [matchData, setMatchData] = useState(null);
	const [isGameReady, setIsGameReady] = useState(false);
	const gameInitialized = useRef(false);

	const { socket, isConnected, emit, on } = useSocketContext();

	useEffect(() => {
		const data = location.state;
		if (!data) {
			toast.error("No match data found");
			navigate("/");
			return;
		}

		setMatchData(data);
		console.log("📦 Match data received:", data);

		gameInitialized.current = false;
		setIsGameReady(false);

		if (!socket || !isConnected) return;

		console.log("🔌 Socket connected, initializing game...");

		const cleanup = [];

		cleanup.push(
			on("gameInitialized", (data) => {
				console.log("🎮 Game initialized:", data);
				setIsGameReady(true);
				gameInitialized.current = true;
				notifySound.play();
			})
		);

		cleanup.push(
			on("initializationError", (error) => {
				console.error("❌ Game initialization failed:", error);
				toast.error(`Failed to initialize: ${error.message}`);
			})
		);

		cleanup.push(
			on("roomNotFound", () => {
				console.error("❌ Room not found");
				toast.error("Room not found");
				navigate("/");
			})
		);

		const joinTimer = setTimeout(() => {
			if (socket?.id) {
				const username = localStorage.getItem("username") || "Player";
				const selectedFlag = localStorage.getItem("selectedFlag");

				console.log(
					`🚪 Joining room: ${data.roomCode} with socket ID: ${socket.id}`
				);
				emit("joinRoom", {
					roomCode: data.roomCode,
					playerName: username,
					flag: selectedFlag,
				});
			}
		}, 200);

		return () => {
			clearTimeout(joinTimer);
			cleanup.forEach((fn) => fn && fn());
		};
	}, [location.state, socket, isConnected, navigate, emit, on]);

	useEffect(() => {
		if (!isConnected && gameInitialized.current) {
			console.log("🔄 Connection lost, resetting...");
			setIsGameReady(false);
			gameInitialized.current = false;
			toast.info("Reconnecting...");
		}
	}, [isConnected]);

	if (!isGameReady || !matchData) {
		return (
			<Stack>
				<Navbar gameMode={gameMode} />
				<Stack
					minHeight="100dvh"
					justifyContent="center"
					alignItems="center"
				>
					<Loading />
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack minHeight="100dvh">
			<Navbar gameMode={gameMode} />
			<Stack flexGrow={1} justifyContent="center" alignItems="center">
				<ChessboardComponent
					gameMode={gameMode}
					matchData={matchData}
					socket={socket}
					isConnected={isConnected}
				/>
			</Stack>
		</Stack>
	);
};

export default Multiplayer;
