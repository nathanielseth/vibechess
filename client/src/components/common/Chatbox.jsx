import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	IconButton,
	Stack,
} from "@mui/material";
import ArrowIcon from "@mui/icons-material/Send";
import NotificationsRoundedIcon from "@mui/icons-material/Notifications";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import { toast } from "react-toastify";
import { styles } from "../../styles/styles";
import { useTheme } from "@mui/material/styles";
import useSocketContext from "../../context/useSocketContext";

const RATE_LIMIT_CONFIG = {
	TIME_WINDOW: 10000,
	MAX_MESSAGES: 5,
	COOLDOWN: 10000,
};

const MESSAGE_GROUP_THRESHOLD = 60000;

const Chatbox = ({ roomCode }) => {
	const theme = useTheme();
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [isMuted, setIsMuted] = useState(false);
	const [isRateLimited, setIsRateLimited] = useState(false);
	const [cooldownTime, setCooldownTime] = useState(0);
	const [hasShownSpamWarning, setHasShownSpamWarning] = useState(false);

	const messagesEndRef = useRef(null);
	const messageTimestamps = useRef([]);
	const cooldownTimer = useRef(null);

	const { socket, emit, on } = useSocketContext();

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const clearCooldownTimer = useCallback(() => {
		if (cooldownTimer.current) {
			clearInterval(cooldownTimer.current);
			cooldownTimer.current = null;
		}
	}, []);

	const checkRateLimit = useCallback(() => {
		const now = Date.now();
		const { TIME_WINDOW, MAX_MESSAGES, COOLDOWN } = RATE_LIMIT_CONFIG;

		messageTimestamps.current = messageTimestamps.current.filter(
			(timestamp) => now - timestamp < TIME_WINDOW
		);

		if (messageTimestamps.current.length >= MAX_MESSAGES) {
			if (!hasShownSpamWarning && !isRateLimited) {
				toast.warn(
					`You're sending messages too quickly! Please wait ${Math.ceil(
						COOLDOWN / 1000
					)} seconds.`,
					{
						position: "top-right",
						autoClose: 3000,
						hideProgressBar: false,
						closeOnClick: true,
						pauseOnHover: true,
						draggable: true,
					}
				);
				setHasShownSpamWarning(true);
			}

			setIsRateLimited(true);
			setCooldownTime(Math.ceil(COOLDOWN / 1000));

			clearCooldownTimer();

			let timeLeft = Math.ceil(COOLDOWN / 1000);
			cooldownTimer.current = setInterval(() => {
				timeLeft--;
				setCooldownTime(timeLeft);

				if (timeLeft <= 0) {
					setIsRateLimited(false);
					setCooldownTime(0);
					setHasShownSpamWarning(false);
					clearCooldownTimer();
				}
			}, 1000);

			return false;
		}

		messageTimestamps.current.push(now);
		return true;
	}, [clearCooldownTimer, hasShownSpamWarning, isRateLimited]);

	const handleInputChange = useCallback((event) => {
		setInput(event.target.value);
	}, []);

	const handleSubmit = useCallback(() => {
		const trimmedInput = input.trim();
		if (!trimmedInput || !socket || isRateLimited) return;

		if (!checkRateLimit()) return;

		emit("chatMessage", {
			roomCode,
			message: trimmedInput,
		});

		setInput("");
	}, [input, socket, isRateLimited, checkRateLimit, emit, roomCode]);

	const handleKeyPress = useCallback(
		(event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit]
	);

	const handleMuteToggle = useCallback(() => {
		const wasMuted = isMuted;
		setIsMuted(!isMuted);

		if (wasMuted) {
			setTimeout(() => {
				scrollToBottom();
			}, 100);
		}
	}, [isMuted, scrollToBottom]);

	const getMessageTime = useCallback((message) => {
		if (message.createdAt) {
			return new Date(message.createdAt).getTime();
		}
		if (message.timestamp) {
			const today = new Date();
			const [time, period] = message.timestamp.split(" ");
			const [hours, minutes] = time.split(":").map(Number);
			let hour24 = hours;

			if (period === "PM" && hours !== 12) hour24 += 12;
			if (period === "AM" && hours === 12) hour24 = 0;

			const messageDate = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate(),
				hour24,
				minutes
			);
			return messageDate.getTime();
		}
		return Date.now();
	}, []);

	const getGroupedMessages = useCallback(() => {
		if (!messages.length) return [];

		return messages.map((message, index) => {
			const prevMessage = index > 0 ? messages[index - 1] : null;
			const nextMessage =
				index < messages.length - 1 ? messages[index + 1] : null;

			const currentTime = getMessageTime(message);
			const prevTime = prevMessage ? getMessageTime(prevMessage) : 0;
			const nextTime = nextMessage ? getMessageTime(nextMessage) : 0;

			const shouldGroupWithPrev =
				prevMessage &&
				prevMessage.sender === message.sender &&
				currentTime - prevTime <= MESSAGE_GROUP_THRESHOLD;

			const shouldGroupWithNext =
				nextMessage &&
				nextMessage.sender === message.sender &&
				nextTime - currentTime <= MESSAGE_GROUP_THRESHOLD;

			let groupPosition = "single";
			if (shouldGroupWithPrev && shouldGroupWithNext) {
				groupPosition = "middle";
			} else if (shouldGroupWithPrev) {
				groupPosition = "last";
			} else if (shouldGroupWithNext) {
				groupPosition = "first";
			}

			return {
				...message,
				groupPosition,
				showTimestamp:
					groupPosition === "single" || groupPosition === "last",
				isGrouped: shouldGroupWithPrev || shouldGroupWithNext,
			};
		});
	}, [messages, getMessageTime]);

	useEffect(() => {
		if (!socket) return;

		const handleChatMessage = (chatMessage) => {
			const isCurrentUser = chatMessage.playerId === socket.id;
			const messageWithSender = {
				...chatMessage,
				sender: isCurrentUser ? "user" : "opponent",
				timestamp: new Date().toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				}),
				createdAt: new Date().toISOString(),
			};
			setMessages((prev) => [...prev, messageWithSender]);
		};

		const handleChatHistory = (data) => {
			const messagesWithSender = (data.messages || []).map((msg) => {
				const isCurrentUser = msg.playerId === socket.id;
				return {
					...msg,
					sender: isCurrentUser ? "user" : "opponent",
					timestamp:
						msg.timestamp ||
						new Date(
							msg.createdAt || Date.now()
						).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						}),
				};
			});
			setMessages(messagesWithSender);
		};

		const cleanupChatMessage = on("chatMessage", handleChatMessage);
		const cleanupChatHistory = on("chatHistory", handleChatHistory);

		return () => {
			cleanupChatMessage?.();
			cleanupChatHistory?.();
			clearCooldownTimer();
		};
	}, [socket, on, clearCooldownTimer]);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const getPlaceholderText = () => {
		if (isMuted) return "Chat is muted";
		if (isRateLimited) return `Rate limited (${cooldownTime}s)`;
		return "Send a message...";
	};

	const groupedMessages = getGroupedMessages();

	return (
		<Stack
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: "400px",
				maxHeight: "50vh",
				...styles.boardControlStyle,
				backgroundColor:
					theme.palette.mode === "light" ? "#fff" : "#1f2123",
			}}
		>
			<Box
				sx={{
					display: "flex",
					p: 2,
					justifyContent: "space-between",
					alignItems: "center",
					mb: -2,
					mt: -1,
					width: "100%",
					flexShrink: 0,
				}}
			>
				<Typography variant="subtitle1" color="#dbd4d4">
					Chat
				</Typography>
				<IconButton onClick={handleMuteToggle}>
					{isMuted ? (
						<NotificationsOffRoundedIcon
							sx={{ fontSize: "1.15rem", color: "grey" }}
						/>
					) : (
						<NotificationsRoundedIcon
							sx={{ fontSize: "1.15rem", color: "#989795" }}
						/>
					)}
				</IconButton>
			</Box>

			<Box
				sx={{
					width: "100%",
					flex: 1,
					overflowY: "auto",
					overflowX: "hidden",
					p: 2,
					minHeight: 0,
				}}
			>
				{!isMuted &&
					groupedMessages.map((msg) => (
						<Message key={msg.id} message={msg} />
					))}
				<div ref={messagesEndRef} />
			</Box>

			<Box
				sx={{
					flexShrink: 0,
					p: 0,
					m: 0,
					width: "100%",
					display: "flex",
					justifyContent: "center",
					pb: 2,
				}}
			>
				<TextField
					onKeyDown={handleKeyPress}
					onChange={handleInputChange}
					value={input}
					disabled={isMuted || isRateLimited}
					inputProps={{ maxLength: 50 }}
					placeholder={getPlaceholderText()}
					variant="outlined"
					sx={{
						width: "90%",
						m: 0,
						"& .MuiOutlinedInput-root": {
							borderRadius: "8px",
						},
					}}
					size="small"
					autoComplete="off"
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									disabled={isMuted || isRateLimited}
									sx={{
										color: isRateLimited
											? "#ff6b6b"
											: "#989795",
									}}
									onClick={handleSubmit}
									edge="end"
								>
									<ArrowIcon />
								</IconButton>
							</InputAdornment>
						),
					}}
				/>
			</Box>
		</Stack>
	);
};

Chatbox.propTypes = {
	roomCode: PropTypes.string.isRequired,
};

const Message = React.memo(({ message }) => {
	const isUser = message.sender === "user";

	// calculate margin based on grouping
	const getMarginBottom = () => {
		if (message.groupPosition === "single") return 2;
		if (message.groupPosition === "last") return 2;
		return 0.5;
	};

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: isUser ? "flex-end" : "flex-start",
				mb: getMarginBottom(),
			}}
		>
			<MessageBubble
				isUser={isUser}
				text={message.message || message.text}
				timestamp={message.showTimestamp ? message.timestamp : null}
				groupPosition={message.groupPosition}
			/>
		</Box>
	);
});

Message.propTypes = {
	message: PropTypes.shape({
		id: PropTypes.string,
		message: PropTypes.string,
		text: PropTypes.string,
		sender: PropTypes.string,
		timestamp: PropTypes.string,
		groupPosition: PropTypes.string,
		showTimestamp: PropTypes.bool,
	}).isRequired,
};

Message.displayName = "Message";

const MessageBubble = React.memo(
	({ isUser, text, timestamp, groupPosition }) => {
		const theme = useTheme();

		const getBorderRadius = () => {
			const baseRadius = 20;
			const tightRadius = 5;

			if (groupPosition === "single") {
				return `${baseRadius}px ${baseRadius}px ${baseRadius}px ${baseRadius}px`;
			}

			if (isUser) {
				switch (groupPosition) {
					case "first":
						return `${baseRadius}px ${baseRadius}px ${tightRadius}px ${baseRadius}px`;
					case "middle":
						return `${baseRadius}px ${tightRadius}px ${tightRadius}px ${baseRadius}px`;
					case "last":
						return `${baseRadius}px ${tightRadius}px ${baseRadius}px ${baseRadius}px`;
					default:
						return `${baseRadius}px ${baseRadius}px ${tightRadius}px ${baseRadius}px`;
				}
			} else {
				switch (groupPosition) {
					case "first":
						return `${baseRadius}px ${baseRadius}px ${baseRadius}px ${tightRadius}px`;
					case "middle":
						return `${tightRadius}px ${baseRadius}px ${baseRadius}px ${tightRadius}px`;
					case "last":
						return `${tightRadius}px ${baseRadius}px ${baseRadius}px ${baseRadius}px`;
					default:
						return `${baseRadius}px ${baseRadius}px ${baseRadius}px ${tightRadius}px`;
				}
			}
		};

		return (
			<Box
				sx={{
					display: "flex",
					alignItems: "flex-end",
					flexDirection: isUser ? "row-reverse" : "row",
					gap: 1,
				}}
			>
				<Box
					sx={{
						p: 1,
						backgroundColor: isUser
							? theme.palette.secondary.light
							: theme.palette.mode === "light"
							? "#e0e0e0"
							: "#424242",
						borderRadius: getBorderRadius(),
						maxWidth: "250px",
						wordBreak: "break-word",
					}}
				>
					<Typography
						variant="body2"
						color={
							isUser
								? "black"
								: theme.palette.mode === "light"
								? "#333"
								: "#fff"
						}
					>
						{text}
					</Typography>
				</Box>
				{timestamp && (
					<Typography
						variant="caption"
						sx={{
							fontSize: "0.7rem",
							color:
								theme.palette.mode === "light"
									? "#666"
									: "#aaa",
							mb: 0.5,
						}}
					>
						{timestamp}
					</Typography>
				)}
			</Box>
		);
	}
);

MessageBubble.propTypes = {
	isUser: PropTypes.bool.isRequired,
	text: PropTypes.string.isRequired,
	timestamp: PropTypes.string,
	groupPosition: PropTypes.string,
};

MessageBubble.displayName = "MessageBubble";

export default Chatbox;
