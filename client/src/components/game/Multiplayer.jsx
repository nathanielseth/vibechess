import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../common/Navbar";
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
	const [connectionStatus, setConnectionStatus] = useState("connecting");
	const gameInitialized = useRef(false);
	const joinAttempted = useRef(false);
	const initialMatchData = useRef(null);

	const { socket, isConnected, emit, on } = useSocketContext();

	useEffect(() => {
		const data = location.state;
		if (!data) {
			toast.error("No match data found");
			navigate("/");
			return;
		}

		if (JSON.stringify(data) !== JSON.stringify(initialMatchData.current)) {
			console.log("📦 Match data received:", data);
			setMatchData(data);
			initialMatchData.current = data;
			gameInitialized.current = false;
			joinAttempted.current = false;
			setIsGameReady(false);
			setConnectionStatus("connecting");
		}
	}, [location.state, navigate]);

	// game initialization
	useEffect(() => {
		if (
			!socket ||
			!isConnected ||
			!matchData ||
			gameInitialized.current ||
			joinAttempted.current
		)
			return;

		console.log("🔌 Socket connected, initializing game...");
		setConnectionStatus("initializing");
		joinAttempted.current = true;

		const cleanup = [];

		cleanup.push(
			on("gameInitialized", (data) => {
				console.log("🎮 Game initialized:", data);
				setConnectionStatus("ready");
				setIsGameReady(true);
				gameInitialized.current = true;
				notifySound.play();
			})
		);

		cleanup.push(
			on("initializationError", (error) => {
				console.error("❌ Game initialization failed:", error);
				toast.error(`Failed to initialize: ${error.message}`);
				setConnectionStatus("error");
				joinAttempted.current = false;
			})
		);

		cleanup.push(
			on("roomNotFound", () => {
				console.error("❌ Room not found");
				toast.error("Room not found");
				navigate("/");
			})
		);

		const username = localStorage.getItem("username") || "Player";
		const selectedFlag = localStorage.getItem("selectedFlag") || "PH";

		const joinTimer = setTimeout(() => {
			if (socket && isConnected && matchData && socket.id) {
				console.log(
					`🚪 Joining room: ${matchData.roomCode} with socket ID: ${socket.id}`
				);
				emit("joinRoom", {
					roomCode: matchData.roomCode,
					playerName: username,
					flag: selectedFlag,
				});
			}
		}, 200);

		return () => {
			clearTimeout(joinTimer);
			cleanup.forEach((fn) => fn && fn());
		};
	}, [socket, isConnected, matchData, emit, on, navigate]);

	useEffect(() => {
		if (!isConnected && gameInitialized.current) {
			console.log("🔄 Connection lost, marking as reconnecting...");
			setConnectionStatus("reconnecting");
			setIsGameReady(false);
			gameInitialized.current = false;
			joinAttempted.current = false;
		}
	}, [isConnected]);

	const renderStatus = () => {
		switch (connectionStatus) {
			case "connecting":
				return "Connecting to server...";
			case "initializing":
				return "Initializing game...";
			case "reconnecting":
				return "Reconnecting...";
			case "error":
				return "Connection error. Please refresh.";
			case "ready":
				return null;
			default:
				return "Loading...";
		}
	};

	if (!isGameReady || !matchData || connectionStatus !== "ready") {
		return (
			<Stack>
				<Navbar gameMode={gameMode} />
				<Stack
					minHeight="100dvh"
					justifyContent="center"
					alignItems="center"
				>
					{renderStatus()}
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack>
			<Navbar gameMode={gameMode} />
			<Stack
				minHeight="100dvh"
				justifyContent="center"
				alignItems="center"
			>
				<ChessboardComponent
					gameMode={gameMode}
					isAnalysisMode={false}
					matchData={matchData}
					socket={socket}
					isConnected={isConnected}
				/>
			</Stack>
		</Stack>
	);
};

export default Multiplayer;
