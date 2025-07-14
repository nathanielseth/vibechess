import { useEffect, useState, useCallback, useRef } from "react";
import io from "socket.io-client";

const useSocket = (
	serverUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"
) => {
	const [socket, setSocket] = useState(null);
	const [isConnected, setIsConnected] = useState(false);
	const [connectionError, setConnectionError] = useState(null);
	const socketRef = useRef(null);
	const isInitialized = useRef(false);

	useEffect(() => {
		// Prevent multiple socket connections
		if (isInitialized.current && socketRef.current?.connected) {
			return;
		}

		isInitialized.current = true;

		// Close existing socket if any
		if (socketRef.current) {
			socketRef.current.close();
		}

		const newSocket = io(serverUrl, {
			autoConnect: true,
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 10,
			timeout: 10000,
			forceNew: false,
		});

		socketRef.current = newSocket;
		setSocket(newSocket);

		newSocket.on("connect", () => {
			console.log("🔗 Connected to server with ID:", newSocket.id);
			setIsConnected(true);
			setConnectionError(null);
		});

		newSocket.on("disconnect", (reason) => {
			console.log("🔌 Disconnected:", reason);
			setIsConnected(false);
		});

		newSocket.on("connect_error", (error) => {
			console.error("❌ Connection error:", error);
			setConnectionError(error.message);
			setIsConnected(false);
		});

		newSocket.on("reconnect", (attemptNumber) => {
			console.log(
				`🔄 Reconnected after ${attemptNumber} attempts with ID:`,
				newSocket.id
			);
			setIsConnected(true);
			setConnectionError(null);
		});

		return () => {
			if (socketRef.current) {
				socketRef.current.close();
				socketRef.current = null;
			}
			isInitialized.current = false;
		};
	}, [serverUrl]);

	const emit = useCallback(
		(event, data) => {
			if (socket && isConnected) {
				console.log(
					`📤 Emitting '${event}' with socket ID:`,
					socket.id
				);
				socket.emit(event, data);
				return true;
			}
			console.warn(`⚠️ Cannot emit '${event}' - socket not connected`);
			return false;
		},
		[socket, isConnected]
	);

	const on = useCallback(
		(event, callback) => {
			if (socket) {
				socket.on(event, callback);
				return () => socket.off(event, callback);
			}
			return null;
		},
		[socket]
	);

	return {
		socket,
		isConnected,
		connectionError,
		emit,
		on,
	};
};

export default useSocket;
