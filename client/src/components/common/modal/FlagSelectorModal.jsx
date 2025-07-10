import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
	Modal,
	Fade,
	Box,
	Typography,
	TextField,
	Button,
	Tooltip,
} from "@mui/material";
import { CircleFlag } from "react-circle-flags";
import flagData from "../../../data/flags";
import { styles } from "../../../styles/styles";

const FlagSelectorModal = ({ open, onClose, onSelect }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredFlags, setFilteredFlags] = useState([]);
	const [selectedFlag, setSelectedFlag] = useState(() => {
		return localStorage.getItem("selectedFlag");
	});
	useEffect(() => {
		if (open) {
			setFilteredFlags(Object.keys(flagData));
			setSelectedFlag(localStorage.getItem("selectedFlag"));
		}
	}, [open]);

	const handleSearchChange = (event) => {
		const term = event.target.value.toLowerCase();
		setSearchTerm(term);

		const filtered = Object.keys(flagData).filter((countryCode) =>
			flagData[countryCode].toLowerCase().includes(term)
		);
		setFilteredFlags(filtered);
	};

	const handleFlagSelect = (countryCode) => {
		setSelectedFlag(countryCode);
	};

	const handleOK = () => {
		onSelect(selectedFlag);
		localStorage.setItem("selectedFlag", selectedFlag);
		onClose();
	};

	const handleClose = () => {
		setSearchTerm("");
		setFilteredFlags(Object.keys(flagData));
		onClose();
	};

	const columns = 9;
	const rows = [];
	for (let i = 0; i < filteredFlags.length; i += columns) {
		const rowFlags = filteredFlags.slice(i, i + columns);
		rows.push(rowFlags);
	}

	return (
		<Modal open={open} onClose={handleClose} closeAfterTransition>
			<Fade in={open}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						borderRadius: 3,
						width: "90%",
						maxWidth: 800,
						maxHeight: 500,
						bgcolor: "#1f2123",
						border: "2px solid #000",
						boxShadow: 24,
						p: 4,
						...styles.scrollbarStyles,
					}}
				>
					<Typography variant="h4" mb={2} color="white">
						CHOOSE YOUR FLAG
					</Typography>

					<TextField
						label="Search for a flag"
						variant="outlined"
						fullWidth
						value={searchTerm}
						onChange={handleSearchChange}
						sx={{
							mb: 2,
							"& .MuiOutlinedInput-root": {
								color: "white",
							},
							"& .MuiInputLabel-root": {
								color: "white",
							},
							"& .MuiOutlinedInput-notchedOutline": {
								borderColor: "white",
							},
						}}
					/>

					<Box
						sx={{
							height: "380px",
							overflowY: "auto",
							mb: 4,
							mt: 3,
							display: "flex",
							flexDirection: "row",
							flexWrap: "wrap",
							justifyContent: "flex-start",
							alignItems: "flex-start",
							gap: "10px 5px",
						}}
					>
						{rows.map((row, rowIndex) => (
							<React.Fragment key={rowIndex}>
								{row.map((countryCode) => (
									<Tooltip
										key={countryCode}
										title={flagData[countryCode]}
									>
										<Button
											onClick={() =>
												handleFlagSelect(countryCode)
											}
											sx={{
												mb: 1,
												padding: 3,
												backgroundColor: "#181a1b",
												border:
													selectedFlag === countryCode
														? "3.5px solid #ce1126"
														: "3.5px solid transparent",
												width: "74px",
												height: "74px",
												boxSizing: "border-box",
												"&:hover": {
													backgroundColor: "#2a2d2e",
												},
											}}
										>
											<CircleFlag
												countryCode={countryCode}
												height="55"
											/>
										</Button>
									</Tooltip>
								))}
							</React.Fragment>
						))}
					</Box>

					<Box display="flex" justifyContent="flex-end" gap={2}>
						<Button
							variant="outlined"
							onClick={handleClose}
							sx={{
								color: "white",
								borderColor: "white",
								"&:hover": {
									borderColor: "#ce1126",
									color: "#ce1126",
								},
							}}
						>
							CANCEL
						</Button>
						<Button
							variant="contained"
							sx={{
								backgroundColor: "#ce1126",
								color: "white",
								"&:hover": {
									backgroundColor: "#a00e1f",
								},
							}}
							onClick={handleOK}
						>
							CONFIRM
						</Button>
					</Box>
				</Box>
			</Fade>
		</Modal>
	);
};

FlagSelectorModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onSelect: PropTypes.func.isRequired,
};

export default FlagSelectorModal;
