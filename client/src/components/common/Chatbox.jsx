import React, { useState } from "react";
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
import { styles } from "../../styles/styles";

const Chatbox = ({ messages: initialMessages }) => {
	const [messages, setMessages] = useState(initialMessages || []);
	const [input, setInput] = useState("");
	const [isMuted, setIsMuted] = useState(false);

	const handleInputChange = (event) => {
		setInput(event.target.value);
	};

	const handleSubmit = () => {
		if (input.trim()) {
			setMessages([...messages, { text: input, sender: "user" }]);
			setInput("");
		}
	};

	return (
		<Stack
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				...styles.boardControlStyle,
			}}
		>
			<Box
				sx={{
					display: "flex",
					p: 2,
					alignSelf: "flex-start",
					justifyContent: "space-between",
					alignItems: "center",
					mb: -3,
					mt: -1,
					width: "100%",
				}}
			>
				<Typography variant="subtitle1" color="#dbd4d4">
					Chat
				</Typography>
				<IconButton onClick={() => setIsMuted(!isMuted)}>
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

			{/* area for messages */}
			<Box
				sx={{
					width: "100%",
					flexGrow: 1,
					overflowY: "auto",
					overflowX: "hidden",
					p: 2,
					height: "23vh",
				}}
			>
				{!isMuted &&
					messages.map((message, index) => (
						<Message key={index} message={message} />
					))}
			</Box>

			<TextField
				onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
				onChange={handleInputChange}
				value={input}
				disabled={isMuted}
				inputProps={{ maxLength: 50 }}
				placeholder={isMuted ? "Chat is muted" : "Send a message..."}
				variant="outlined"
				fullWidth
				sx={{
					width: "90%",
					borderRadius: 95,
					mx: "auto",
					my: 2,
				}}
				size="small"
				autoComplete="off"
				InputProps={{
					endAdornment: (
						<InputAdornment position="end">
							<IconButton
								disabled={isMuted}
								sx={{
									color: "#989795",
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
		</Stack>
	);
};

Chatbox.propTypes = {
	messages: PropTypes.arrayOf(
		PropTypes.shape({
			text: PropTypes.string.isRequired,
			sender: PropTypes.oneOf(["user", "opponent"]).isRequired,
		})
	),
};

const Message = ({ message }) => {
	const isUser = message.sender === "user";

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: isUser ? "flex-end" : "flex-start",
				mb: 2,
			}}
		>
			<MessageBubble isUser={isUser} text={message.text} />
		</Box>
	);
};

Message.propTypes = {
	message: PropTypes.shape({
		text: PropTypes.string.isRequired,
		sender: PropTypes.oneOf(["user", "opponent"]).isRequired,
	}).isRequired,
};

const MessageBubble = ({ isUser, text }) => {
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
			}}
		>
			<Box
				sx={{
					p: 1,
					ml: isUser ? 0 : 1,
					mr: isUser ? 1 : 0,
					backgroundColor: isUser
						? "secondary.light"
						: "primary.light",
					borderRadius: isUser
						? "20px 20px 5px 20px"
						: "20px 20px 20px 5px",
				}}
			>
				<Typography variant="body2" color="black">
					{text}
				</Typography>
			</Box>
		</Box>
	);
};

MessageBubble.propTypes = {
	isUser: PropTypes.bool.isRequired,
	text: PropTypes.string.isRequired,
};

export default Chatbox;
