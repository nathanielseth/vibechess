import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Stack, Typography, Tooltip, Box, Grid } from "@mui/material";
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

	const [selectedPiece, setSelectedPiece] = useState(selectedPieceSet);
	const [whiteBoxOpacity, setWhiteBoxOpacity] = useState(0.3);
	const [blackBoxOpacity, setBlackBoxOpacity] = useState(0.3);
	const [incrementOneOpacity, setIncrementOneOpacity] = useState(0.3);
	const [incrementFiveOpacity, setIncrementFiveOpacity] = useState(0.3);
	const [incrementTenOpacity, setIncrementTenOpacity] = useState(0.3);
	const [selectedIncrement, setSelectedIncrement] = useState(null);

	const handleWhiteSelect = () => {
		setWhiteBoxOpacity(1.0);
		setBlackBoxOpacity(0.3);
		setSelectedPiece("white");
		console.log(selectedPiece);
	};

	const handleBlackSelect = () => {
		setWhiteBoxOpacity(0.3);
		setBlackBoxOpacity(1.0);
		setSelectedPiece("black");
		console.log(selectedPiece);
	};

	const handleIncrementClick = (incrementValue) => {
		setSelectedIncrement(incrementValue);

		switch (incrementValue) {
			case 1:
				setIncrementOneOpacity(1.0);
				setIncrementFiveOpacity(0.3);
				setIncrementTenOpacity(0.3);
				break;
			case 5:
				setIncrementOneOpacity(0.3);
				setIncrementFiveOpacity(1.0);
				setIncrementTenOpacity(0.3);
				break;
			case 10:
				setIncrementOneOpacity(0.3);
				setIncrementFiveOpacity(0.3);
				setIncrementTenOpacity(1.0);
				break;
			default:
				break;
		}
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
								sx={{
									color: "secondary.main",
									fontSize: "1rem",
								}}
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
							}, 5000);

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
						onClick={handleWhiteSelect}
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
						onClick={handleBlackSelect}
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
						Increment for {selectedTimeControl} min
					</Typography>
				</Box>

				<Grid container spacing={1} justifyContent="center">
					{[1, 5, 10].map((incrementValue) => (
						<Grid item key={incrementValue}>
							<Box
								display="flex"
								alignItems="center"
								justifyContent="center"
								borderRadius={1}
								sx={{
									cursor: "pointer",
									transition: "all 200ms",
									backgroundColor:
										selectedIncrement === incrementValue
											? "error.main"
											: "transparent",
									"&:hover": {
										transform: "scale(1.1)",
										bgcolor: "error.main",
										opacity: 1,
									},
									color: "white",
									backgroundSize: "cover",
									width: "50px",
									height: "50px",
									opacity:
										incrementValue === 1
											? incrementOneOpacity
											: incrementValue === 5
											? incrementFiveOpacity
											: incrementTenOpacity,
								}}
								onClick={() =>
									handleIncrementClick(incrementValue)
								}
							>
								<Typography variant="h5" textAlign="center">
									+{incrementValue}
								</Typography>
							</Box>
						</Grid>
					))}
				</Grid>
			</Stack>
		</Stack>
	);
};

Room.propTypes = {
	selectedTimeControl: PropTypes.number,
};

export default Room;
