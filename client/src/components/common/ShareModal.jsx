import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, Box, Button, IconButton, Fade, TextField } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DoneIcon from "@mui/icons-material/Done";

const ShareModal = ({ isOpen, onClose, pgn }) => {
	const shareLink = "www.vibechess.com/pass-and-play";
	const pgnTextRef = useRef(null);
	const [showCheck, setShowCheck] = useState(false);

	useEffect(() => {
		if (pgn && pgnTextRef.current) {
			pgnTextRef.current.value = pgn;
			pgnTextRef.current.scrollTop = pgnTextRef.current.scrollHeight;
		}
	}, [pgn]);

	const handleCopyLink = () => {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(shareLink).then(
				() => {
					setShowCheck(true);

					setTimeout(() => {
						setShowCheck(false);
					}, 3000);
				},
				(err) => {
					console.error(
						"Failed to copy share link to clipboard",
						err
					);
				}
			);
		} else {
			console.error("Clipboard API not supported");
		}
	};

	const handleCopyPGN = () => {
		if (pgnTextRef.current) {
			navigator.clipboard.writeText(pgnTextRef.current.value).then(
				() => {
					setShowCheck(true);

					setTimeout(() => {
						setShowCheck(false);
					}, 5000);
				},
				(err) => {
					console.error("Failed to copy PGN to clipboard", err);
				}
			);
		} else {
			console.error("PGN Textfield reference not available");
		}
	};

	return (
		<Modal open={isOpen} onClose={onClose}>
			<Fade in={isOpen}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 500,
						bgcolor: "#1f2123",
						boxShadow: 24,
						p: 4,
						borderRadius: 3,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							mb: 3,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								width: "100%",
							}}
						>
							<TextField
								variant="outlined"
								fullWidth
								readOnly
								value={shareLink}
							/>
							<IconButton onClick={handleCopyLink}>
								{showCheck ? (
									<DoneIcon sx={{ color: "#87BCDE" }} />
								) : (
									<ContentCopyRoundedIcon />
								)}
							</IconButton>
						</Box>
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							mb: 3,
						}}
					>
						<TextField
							id="outlined-multiline-static"
							label="PGN"
							multiline
							rows={4}
							fullWidth
							variant="outlined"
							value={pgn}
							inputRef={pgnTextRef}
						/>
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "flex-end",
						}}
					>
						<Button
							variant="outlined"
							onClick={handleCopyPGN}
							mr={1}
							className="copy-pgn-button"
						>
							Copy PGN
						</Button>
						<Box mr={2} />
						<Button variant="contained" onClick={onClose}>
							Ok
						</Button>
					</Box>
				</Box>
			</Fade>
		</Modal>
	);
};

ShareModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	pgn: PropTypes.string,
};

export default ShareModal;
