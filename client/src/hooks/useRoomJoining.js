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
			navigate("/multiplayer", { state: data });
		};

		const handleRoomJoined = (data) => {
			toast.dismiss();
			toast.success("Joined room successfully!");
			navigate("/multiplayer", { state: data });
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
			on("gameStarted", handleRoomJoined),
			on("roomNotFound", handleRoomNotFound),
			on("roomFull", handleRoomFull),
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
