import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useSocketContext from "../context/useSocketContext";

export const useMatchmaking = () => {
	const [isSearching, setIsSearching] = useState(false);
	const { socket, isConnected, emit, on } = useSocketContext();
	const navigate = useNavigate();

	const handleMatchmakeClick = useCallback(() => {
		if (isSearching) {
			emit("cancelMatchmaking");
			setIsSearching(false);
			toast.info("Matchmaking cancelled");
			return;
		}

		if (!socket || !isConnected) {
			toast.error("Not connected to server. Please refresh the page.");
			return;
		}

		const username = localStorage.getItem("username");
		const selectedFlag = localStorage.getItem("selectedFlag");

		if (!username) {
			toast.error("Please set a username first");
			return;
		}

		setIsSearching(true);

		toast.info("Searching for opponent...", {
			position: "top-right",
			autoClose: false,
			hideProgressBar: false,
			closeOnClick: false,
			pauseOnHover: false,
			draggable: false,
		});

		emit("findMatch", {
			timeControl: 10,
			playerName: username,
			flag: selectedFlag,
		});
	}, [isSearching, socket, isConnected, emit]);

	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleMatchFound = (data) => {
			console.log("Match found:", data);
			setIsSearching(false);
			toast.dismiss();
			toast.success("Match found!");
			setTimeout(() => navigate("/multiplayer", { state: data }), 1000);
		};

		const handleQueueJoined = (data) => {
			console.log("Joined queue:", data);
		};

		const handleMatchmakingCancelled = () => {
			setIsSearching(false);
			toast.dismiss();
		};

		const handleConnectionError = () => {
			if (isSearching) {
				setIsSearching(false);
				toast.dismiss();
				toast.error("Connection lost. Please try again.");
			}
		};

		const cleanup = [
			on("matchFound", handleMatchFound),
			on("queueJoined", handleQueueJoined),
			on("matchmakingCancelled", handleMatchmakingCancelled),
			on("connect_error", handleConnectionError),
			on("disconnect", handleConnectionError),
		];

		return () => {
			cleanup.forEach((fn) => fn && fn());
		};
	}, [socket, isConnected, on, navigate, isSearching]);

	useEffect(() => {
		if (!isConnected && isSearching) {
			setIsSearching(false);
			toast.dismiss();
			toast.error("Lost connection. Please try again.");
		}
	}, [isConnected, isSearching]);

	return {
		isSearching,
		handleMatchmakeClick,
	};
};
