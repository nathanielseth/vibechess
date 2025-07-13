import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useSocketContext from "../context/useSocketContext";

export const useRoomJoining = () => {
	const [enteredRoomCode, setEnteredRoomCode] = useState("");
	const { socket, isConnected, emit, on } = useSocketContext();
	const navigate = useNavigate();

	const handleJoinRoom = useCallback(() => {
		const roomCode = enteredRoomCode.trim();

		if (!roomCode) {
			toast.error("Please enter a room code");
			return;
		}

		if (!socket || !isConnected) {
			toast.error("Not connected to server");
			return;
		}

		const username = localStorage.getItem("username");
		const selectedFlag = localStorage.getItem("selectedFlag") || "ph";

		toast.info("Joining room...");

		emit("joinRoom", {
			roomCode: roomCode.toUpperCase(),
			playerName: username,
			flag: selectedFlag,
		});
	}, [enteredRoomCode, socket, isConnected, emit]);

	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleGameStarted = (data) => {
			toast.dismiss();
			toast.success("Game started!");

			const player = data.players?.find((p) => p.id === socket.id);
			const opponent = data.players?.find((p) => p.id !== socket.id);

			navigate("/multiplayer", {
				state: {
					roomCode: data.roomCode,
					gameState: data.gameState,
					yourColor: player?.color,
					opponent: opponent,
					timeControl: data.timeControl,
					increment: data.increment,
					isRoomMatch: true,
				},
			});
		};

		const handleGameInitialized = (data) => {
			toast.dismiss();
			toast.success("Joined room successfully!");
			navigate("/multiplayer", {
				state: {
					...data,
					isRoomMatch: true,
				},
			});
		};

		const handleRoomNotFound = () => {
			toast.dismiss();
			toast.error("Room not found. Please check the room code.");
		};

		const handleRoomFull = () => {
			toast.dismiss();
			toast.error("Room is full. Cannot join.");
		};

		const cleanup = [
			on("gameStarted", handleGameStarted),
			on("gameInitialized", handleGameInitialized),
			on("roomNotFound", handleRoomNotFound),
			on("initializationError", handleRoomFull),
		];

		return () => {
			cleanup.forEach((fn) => fn && fn());
		};
	}, [socket, isConnected, on, navigate]);

	return {
		enteredRoomCode,
		setEnteredRoomCode,
		handleJoinRoom,
	};
};
