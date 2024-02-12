import React, { useState } from "react";
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
	const [selectedFlag, setSelectedFlag] = useState("ph");

	const columns = 9;
	const rows = [];
	for (let i = 0; i < filteredFlags.length; i += columns) {
		const rowFlags = filteredFlags.slice(i, i + columns);
		rows.push(rowFlags);
	}

	useState(() => {
		setFilteredFlags(Object.keys(flagData));
	}, []);

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
		window.localStorage.setItem("selectedFlag", selectedFlag);
		onClose();
	};

	return (
		<Modal open={open} onClose={onClose} closeAfterTransition>
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
						maxHeigh: 500,
						bgcolor: "#1f2123",
						border: "2px solid #000",
						boxShadow: 24,
						p: 4,
						...styles.scrollbarStyles,
					}}
				>
					<Typography variant="h4" mb={2}>
						CHOOSE YOUR FLAG
					</Typography>

					<TextField
						label="Search for a flag"
						variant="outlined"
						fullWidth
						mb={2}
						value={searchTerm}
						onChange={handleSearchChange}
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
														: "none",
												width: "74px",
												height: "74px",
												boxSizing: "border-box",
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

					<Box display="flex" justifyContent="flex-end">
						<Button variant="outlined" onClick={onClose}>
							CANCEL
						</Button>
						<Box mr={2} />
						<Button
							variant="contained"
							style={{
								backgroundColor: "#ce1126",
								color: "white",
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
