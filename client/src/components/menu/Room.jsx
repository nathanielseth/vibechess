import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Stack, Typography, Tooltip, Box } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DoneIcon from "@mui/icons-material/Done";
import Navbar from "../common/Navbar";
import { useLocation } from "react-router-dom";

const generateRoomCode = () => {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let code = "";
	for (let i = 0; i < 5; i++) {
		code += characters.charAt(
			Math.floor(Math.random() * characters.length)
		);
	}
	return code;
};

const Room = () => {
	const location = useLocation();
	const { selectedTimeControl } = location.state || {};
	const [roomCode, setRoomCode] = useState(null);
	const [isCopied, setCopied] = useState(false);
	const selectedPieceSet =
		window.localStorage.getItem("selectedPieces") || "tatiana";

	const [whiteBoxOpacity, setWhiteBoxOpacity] = useState(0.3);
	const [blackBoxOpacity, setBlackBoxOpacity] = useState(0.3);

	const handleWhiteBoxClick = () => {
		setWhiteBoxOpacity(1.0);
		setBlackBoxOpacity(0.3);
	};

	const handleBlackBoxClick = () => {
		setWhiteBoxOpacity(0.3);
		setBlackBoxOpacity(1.0);
	};

	useEffect(() => {
		if (!roomCode) {
			const generatedCode = generateRoomCode();
			setRoomCode(generatedCode);
		}
	}, [roomCode]);

	return (
		<Stack
			direction="column"
			justifyContent="space-between"
			alignItems="center"
			spacing={-10}
			minHeight="100vh"
		>
			<Navbar />

			<Stack
				flexGrow={1}
				px={3}
				spacing={2}
				alignItems="center"
				justifyContent="center"
			>
				<Tooltip
					title={
						isCopied ? (
							<DoneIcon
								sx={{ color: "#87BCDE", fontSize: "1rem" }}
							/>
						) : (
							"Copy"
						)
					}
					placement="top"
					arrow
				>
					<Box
						border="2px solid"
						borderColor="secondary.main"
						borderRadius={1}
						sx={{
							cursor: "pointer",
							transition: "all 200ms",
							"&:hover": {
								transform: "scale(1.1)",
							},
						}}
						px={3}
						py={2}
						onClick={() => {
							navigator.clipboard?.writeText(roomCode);
							setCopied(true);

							const timeout = setTimeout(() => {
								setCopied(false);
							}, 8000);

							return () => clearTimeout(timeout);
						}}
					>
						<Typography
							color="secondary.main"
							variant="h4"
							textAlign="center"
						>
							Room Code: {roomCode}
						</Typography>
					</Box>
				</Tooltip>

				<Typography>Preferred color:</Typography>

				<Box display="flex" justifyContent="center">
					<Box
						borderRadius={1}
						sx={{
							cursor: "pointer",
							transition: "all 200ms",
							"&:hover": {
								transform: "scale(1.1)",
							},
							marginRight: "15px",
							backgroundImage: `url(/piece/${selectedPieceSet}/wN.svg)`,
							backgroundSize: "cover",
							bgcolor: "secondary.main",
							opacity: whiteBoxOpacity,
						}}
						px={5}
						py={5}
						onClick={handleWhiteBoxClick}
					>
						<Typography
							variant="h4"
							textAlign="center"
						></Typography>
					</Box>
					<Box
						borderRadius={1}
						sx={{
							cursor: "pointer",
							transition: "all 200ms",
							"&:hover": {
								transform: "scale(1.1)",
							},
							backgroundImage: `url(/piece/${selectedPieceSet}/bN.svg)`,
							backgroundSize: "cover",
							bgcolor: "primary.main",
							opacity: blackBoxOpacity,
						}}
						px={5}
						py={5}
						onClick={handleBlackBoxClick}
					>
						<Typography
							color="secondary.main"
							variant="h4"
							textAlign="center"
						></Typography>
					</Box>
				</Box>

				<Box display="flex" alignItems="center" color="white">
					<AccessTimeIcon />
					<Typography ml={1}>
						Time Control: {selectedTimeControl}+0 min
					</Typography>
				</Box>
			</Stack>
		</Stack>
	);
};

Room.propTypes = {
	selectedTimeControl: PropTypes.number,
};

export default Room;
