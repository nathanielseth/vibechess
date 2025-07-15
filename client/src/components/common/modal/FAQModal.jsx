import React from "react";
import PropTypes from "prop-types";
import {
	Modal,
	Box,
	Button,
	Typography,
	Fade,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import { useTheme } from "@mui/material/styles";

function FAQModal({ isOpen, onClose }) {
	const theme = useTheme();
	const faqData = [
		{
			question: "What is VibeChess?",
			answer: "A chill, free, and open-source online chess app built for the vibes. You can play solo or multiplayer. No logins. No ads. Just vibes.",
		},
		{
			question: "Who made this?",
			answer: "VibeChess is a solo project by a CS student from the Philippines, made as a passion project and learning experience.",
		},
		{
			question:
				"Why does the server take a few seconds to load sometimes?",
			answer: "Because for now, the backend's running on Render.com's free tier. After ~15 mins, it automatically sleeps the server to save costs.",
		},
		{
			question: "Will there ever be logins or leaderboards?",
			answer: "Not likely. VibeChess isn't aiming to replace chess.com or Lichess. It's intentionally minimalist; quick games, casual matchups, and no commitment required.",
		},
		{
			question: "Are chats monitored? What about privacy?",
			answer: "Nothing is stored. VibeChess doesn't track users or save data of any kind.",
		},
	];

	return (
		<Modal open={isOpen} onClose={onClose}>
			<Fade in={isOpen}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: { xs: "90%", sm: 500 },
						maxWidth: "90vw",
						height: "55vh",
						bgcolor:
							theme.palette.mode === "dark"
								? "#1f2123"
								: "#fff8f0",
						boxShadow: 24,
						p: { xs: 3, sm: 4 },
						borderRadius: 3,
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Typography
						variant="h5"
						sx={{
							mb: 3,
							textAlign: "center",
							color: "white",
							fontWeight: "bold",
							fontSize: { xs: "1.25rem", sm: "1.5rem" },
							flexShrink: 0,
						}}
					>
						Frequently Asked Questions
					</Typography>

					<Box
						sx={{
							flex: 1,
							overflowY: "auto",
							pr: 1,
							"&::-webkit-scrollbar": {
								width: "8px",
							},
							"&::-webkit-scrollbar-track": {
								backgroundColor:
									theme.palette.mode === "dark"
										? "#2a2d2f"
										: "#f1f1f1",
								borderRadius: "4px",
							},
							"&::-webkit-scrollbar-thumb": {
								backgroundColor:
									theme.palette.mode === "dark"
										? "#555"
										: "#888",
								borderRadius: "4px",
								"&:hover": {
									backgroundColor:
										theme.palette.mode === "dark"
											? "#666"
											: "#999",
								},
							},
						}}
					>
						{faqData.map((faq, index) => (
							<Accordion
								key={index}
								sx={{
									mb: 1,
									bgcolor:
										theme.palette.mode === "dark"
											? "#050505"
											: "#e8e8e8",
									"&:before": {
										display: "none",
									},
									borderRadius: "4px !important",
									overflow: "hidden",
								}}
							>
								<AccordionSummary
									expandIcon={
										<ExpandMoreIcon
											sx={{
												color:
													theme.palette.mode ===
													"dark"
														? "white"
														: "#333",
											}}
										/>
									}
									sx={{
										"& .MuiAccordionSummary-content": {
											margin: "8px 0",
										},
									}}
								>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<LiveHelpIcon
											sx={{
												fontSize: 18,
												color:
													theme.palette.mode ===
													"dark"
														? "white"
														: "#333",
											}}
										/>
										<Typography
											sx={{
												fontSize: { xs: 14, sm: 16 },
												lineHeight: 1.3,
												color:
													theme.palette.mode ===
													"dark"
														? "white"
														: "#333",
											}}
										>
											{faq.question}
										</Typography>
									</Box>
								</AccordionSummary>
								<AccordionDetails sx={{ pt: 0 }}>
									<Typography
										sx={{
											fontSize: { xs: 13, sm: 14 },
											lineHeight: 1.6,
											color:
												theme.palette.mode === "dark"
													? "#b8b8b8"
													: "#555",
										}}
									>
										{faq.answer}
									</Typography>
								</AccordionDetails>
							</Accordion>
						))}
					</Box>

					<Box
						sx={{
							mt: 3,
							display: "flex",
							justifyContent: "flex-end",
							flexShrink: 0,
						}}
					>
						<Button
							onClick={onClose}
							variant="contained"
							sx={{
								bgcolor:
									theme.palette.mode === "dark"
										? "#f24040"
										: "primary.main",
								"&:hover": {
									bgcolor:
										theme.palette.mode === "dark"
											? "#d63636"
											: "primary.dark",
								},
							}}
						>
							GOT IT
						</Button>
					</Box>
				</Box>
			</Fade>
		</Modal>
	);
}

FAQModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

export default FAQModal;
