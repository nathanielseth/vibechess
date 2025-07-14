import React, { useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import SocketContext from "./SocketContext";
import useSocket from "../hooks/useSocket";

const CONNECTION_STATES = {
	IDLE: "idle",
	CONNECTING: "connecting",
	STARTUP_DELAY: "startup_delay",
	SHOWING_STARTUP: "showing_startup",
	CONNECTED: "connected",
	FAILED: "failed",
	RECONNECTING: "reconnecting",
};

const TIMINGS = {
	STARTUP_DELAY: 2000,
	FAILURE_TIMEOUT: 120000,
	SUCCESS_TOAST_DURATION: 3000,
	ERROR_TOAST_DURATION: 8000,
	WARNING_TOAST_DURATION: 5000,
};

const SocketProvider = ({ children }) => {
	const socket = useSocket();
	const connectionState = useRef(CONNECTION_STATES.IDLE);
	const connectionStartTime = useRef(null);
	const activeToastId = useRef(null);
	const timers = useRef({
		startupDelay: null,
		failureTimeout: null,
	});

	const clearTimers = useCallback(() => {
		Object.values(timers.current).forEach((timer) => {
			if (timer) clearTimeout(timer);
		});
		timers.current = { startupDelay: null, failureTimeout: null };
	}, []);

	const dismissActiveToast = useCallback(() => {
		if (activeToastId.current) {
			toast.dismiss(activeToastId.current);
			activeToastId.current = null;
		}
	}, []);

	const showToast = useCallback(
		(type, message, options = {}) => {
			dismissActiveToast();
			activeToastId.current = toast[type](message, {
				position: "top-right",
				...options,
			});
		},
		[dismissActiveToast]
	);

	const transitionToState = useCallback(
		(newState) => {
			const prevState = connectionState.current;
			connectionState.current = newState;

			switch (newState) {
				case CONNECTION_STATES.CONNECTING:
					connectionStartTime.current = Date.now();
					clearTimers();

					timers.current.startupDelay = setTimeout(() => {
						if (
							connectionState.current ===
							CONNECTION_STATES.CONNECTING
						) {
							transitionToState(
								CONNECTION_STATES.SHOWING_STARTUP
							);
						}
					}, TIMINGS.STARTUP_DELAY);
					break;

				case CONNECTION_STATES.SHOWING_STARTUP:
					showToast(
						"info",
						"🚀 Server is starting up, please wait...",
						{
							autoClose: false,
							closeOnClick: false,
							draggable: false,
							hideProgressBar: true,
						}
					);

					timers.current.failureTimeout = setTimeout(() => {
						if (
							connectionState.current ===
							CONNECTION_STATES.SHOWING_STARTUP
						) {
							transitionToState(CONNECTION_STATES.FAILED);
						}
					}, TIMINGS.FAILURE_TIMEOUT);
					break;

				case CONNECTION_STATES.CONNECTED: {
					clearTimers();
					dismissActiveToast();

					const connectionTime = connectionStartTime.current
						? Math.round(
								(Date.now() - connectionStartTime.current) /
									1000
						  )
						: 0;

					const message =
						connectionTime > 5
							? `Server online! (took ${connectionTime}s)`
							: "Server online!";

					showToast("success", message, {
						autoClose: TIMINGS.SUCCESS_TOAST_DURATION,
					});
					break;
				}

				case CONNECTION_STATES.FAILED:
					clearTimers();
					dismissActiveToast();

					showToast(
						"error",
						"❌ Failed to connect to server. Please try refreshing the page.",
						{
							autoClose: TIMINGS.ERROR_TOAST_DURATION,
						}
					);
					break;

				case CONNECTION_STATES.RECONNECTING: {
					if (prevState === CONNECTION_STATES.CONNECTED) {
						showToast(
							"warn",
							"⚠️ Lost connection to server. Trying to reconnect...",
							{
								autoClose: TIMINGS.WARNING_TOAST_DURATION,
							}
						);
					}
					break;
				}

				case CONNECTION_STATES.IDLE:
					clearTimers();
					dismissActiveToast();
					break;
			}
		},
		[showToast, dismissActiveToast, clearTimers]
	);

	useEffect(() => {
		if (!socket.socket) {
			if (connectionState.current !== CONNECTION_STATES.IDLE) {
				transitionToState(CONNECTION_STATES.IDLE);
			}
			return;
		}

		if (socket.isConnected) {
			if (connectionState.current !== CONNECTION_STATES.CONNECTED) {
				transitionToState(CONNECTION_STATES.CONNECTED);
			}
			return;
		}

		if (
			socket.connectionError &&
			connectionState.current !== CONNECTION_STATES.CONNECTING &&
			connectionState.current !== CONNECTION_STATES.SHOWING_STARTUP
		) {
			if (connectionState.current !== CONNECTION_STATES.FAILED) {
				transitionToState(CONNECTION_STATES.FAILED);
			}
			return;
		}

		if (connectionState.current === CONNECTION_STATES.CONNECTED) {
			transitionToState(CONNECTION_STATES.RECONNECTING);
		} else if (connectionState.current === CONNECTION_STATES.IDLE) {
			transitionToState(CONNECTION_STATES.CONNECTING);
		}
	}, [
		socket.socket,
		socket.isConnected,
		socket.connectionError,
		transitionToState,
	]);

	useEffect(() => {
		return () => {
			clearTimers();
			dismissActiveToast();
		};
	}, [clearTimers, dismissActiveToast]);

	return (
		<SocketContext.Provider value={socket}>
			{children}
		</SocketContext.Provider>
	);
};

SocketProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default SocketProvider;
