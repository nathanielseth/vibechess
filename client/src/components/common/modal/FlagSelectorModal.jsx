import React, {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
} from "react";
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

const FlagButton = React.memo(
	({ countryCode, flagName, isSelected, onSelect }) => {
		const handleClick = useCallback(() => {
			onSelect(countryCode);
		}, [countryCode, onSelect]);

		return (
			<Tooltip
				title={flagName}
				placement="top"
				arrow
				disablePortal
				PopperProps={{
					container: () =>
						document.querySelector("[data-flag-container]"),
					modifiers: [
						{
							name: "offset",
							options: {
								offset: [0, -10],
							},
						},
						{
							name: "preventOverflow",
							options: {
								boundary: "clippingParents",
								altAxis: true,
								padding: 8,
							},
						},
						{
							name: "flip",
							options: {
								fallbackPlacements: ["bottom", "top"],
							},
						},
					],
				}}
				componentsProps={{
					tooltip: {
						sx: {
							bgcolor: "#333",
							color: "white",
							fontSize: "0.75rem",
							"& .MuiTooltip-arrow": {
								color: "#333",
							},
						},
					},
				}}
			>
				<Button
					onClick={handleClick}
					sx={{
						mb: 1,
						padding: 3,
						backgroundColor: "#181a1b",
						border: isSelected
							? "3.5px solid #ce1126"
							: "3.5px solid transparent",
						width: "74px",
						height: "74px",
						boxSizing: "border-box",
						transition: "background-color 0.2s ease-in-out",
						"&:hover": {
							backgroundColor: "#2a2d2e",
						},
					}}
				>
					<CircleFlag countryCode={countryCode} height="55" />
				</Button>
			</Tooltip>
		);
	}
);

FlagButton.displayName = "FlagButton";

FlagButton.propTypes = {
	countryCode: PropTypes.string.isRequired,
	flagName: PropTypes.string.isRequired,
	isSelected: PropTypes.bool.isRequired,
	onSelect: PropTypes.func.isRequired,
};

const useDebounce = (value, delay) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
};

const VirtualizedFlagGrid = React.memo(
	({ flags, selectedFlag, onFlagSelect }) => {
		const containerRef = useRef(null);
		const [visibleRange, setVisibleRange] = useState({ start: 0, end: 54 });
		const itemHeight = 84;
		const itemsPerRow = 9;
		const rowHeight = itemHeight;

		const handleScroll = useCallback(() => {
			if (!containerRef.current) return;

			const scrollTop = containerRef.current.scrollTop;
			const containerHeight = containerRef.current.clientHeight;

			const startRow = Math.floor(scrollTop / rowHeight);
			const endRow = Math.min(
				Math.ceil((scrollTop + containerHeight) / rowHeight) + 1,
				Math.ceil(flags.length / itemsPerRow)
			);

			const start = startRow * itemsPerRow;
			const end = Math.min(endRow * itemsPerRow, flags.length);

			setVisibleRange({ start, end });
		}, [flags.length, rowHeight, itemsPerRow]);

		useEffect(() => {
			const container = containerRef.current;
			if (!container) return;

			container.addEventListener("scroll", handleScroll);
			handleScroll();

			return () => {
				container.removeEventListener("scroll", handleScroll);
			};
		}, [handleScroll]);

		useEffect(() => {
			setVisibleRange({ start: 0, end: Math.min(54, flags.length) });
		}, [flags.length]);

		const totalHeight = Math.ceil(flags.length / itemsPerRow) * rowHeight;
		const offsetY =
			Math.floor(visibleRange.start / itemsPerRow) * rowHeight;

		const visibleFlags = flags.slice(visibleRange.start, visibleRange.end);

		return (
			<Box
				ref={containerRef}
				data-flag-container
				sx={{
					height: "380px",
					overflowY: "auto",
					mb: 4,
					mt: 3,
					position: "relative",
					...styles.scrollbarStyles,
				}}
			>
				<div style={{ height: totalHeight, position: "relative" }}>
					<Box
						sx={{
							position: "absolute",
							top: offsetY,
							left: 0,
							right: 0,
							display: "flex",
							flexDirection: "row",
							flexWrap: "wrap",
							justifyContent: "flex-start",
							alignItems: "flex-start",
							gap: "10px 5px",
						}}
					>
						{visibleFlags.map((countryCode) => (
							<FlagButton
								key={countryCode}
								countryCode={countryCode}
								flagName={flagData[countryCode]}
								isSelected={selectedFlag === countryCode}
								onSelect={onFlagSelect}
							/>
						))}
					</Box>
				</div>
			</Box>
		);
	}
);

VirtualizedFlagGrid.displayName = "VirtualizedFlagGrid";

VirtualizedFlagGrid.propTypes = {
	flags: PropTypes.arrayOf(PropTypes.string).isRequired,
	selectedFlag: PropTypes.string.isRequired,
	onFlagSelect: PropTypes.func.isRequired,
};

const FlagSelectorModal = ({ open, onClose, onSelect }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFlag, setSelectedFlag] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 200);

	useEffect(() => {
		if (open && !selectedFlag) {
			const savedFlag = localStorage.getItem("selectedFlag");
			if (savedFlag) {
				setSelectedFlag(savedFlag);
			}
		}
	}, [open, selectedFlag]);

	const filteredFlags = useMemo(() => {
		if (!debouncedSearchTerm) {
			return Object.keys(flagData);
		}

		const term = debouncedSearchTerm.toLowerCase();
		return Object.keys(flagData).filter((countryCode) =>
			flagData[countryCode].toLowerCase().includes(term)
		);
	}, [debouncedSearchTerm]);

	const handleSearchChange = useCallback((event) => {
		setSearchTerm(event.target.value);
	}, []);

	const handleFlagSelect = useCallback((countryCode) => {
		setSelectedFlag(countryCode);
	}, []);

	const handleOK = useCallback(() => {
		onSelect(selectedFlag);
		localStorage.setItem("selectedFlag", selectedFlag);
		onClose();
	}, [selectedFlag, onSelect, onClose]);

	const handleClose = useCallback(() => {
		setSearchTerm("");
		onClose();
	}, [onClose]);

	useEffect(() => {
		if (!open) {
			setSearchTerm("");
		}
	}, [open]);

	return (
		<Modal
			open={open}
			onClose={handleClose}
			closeAfterTransition
			disableAutoFocus
			disableEnforceFocus
		>
			<Fade in={open} timeout={150}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						borderRadius: 3,
						width: "90%",
						maxWidth: 800,
						bgcolor: "#1f2123",
						boxShadow: 24,
						p: 4,
						outline: "none",
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
						autoComplete="off"
						sx={{
							mb: 2,
							"& .MuiOutlinedInput-root": {
								color: "white",
								transition: "all 0.2s ease-in-out",
							},
							"& .MuiInputLabel-root": {
								color: "white",
							},
							"& .MuiOutlinedInput-notchedOutline": {
								borderColor: "white",
							},
							"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
								{
									borderColor: "#ce1126",
								},
							"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
								{
									borderColor: "#ce1126",
								},
						}}
					/>

					<VirtualizedFlagGrid
						flags={filteredFlags}
						selectedFlag={selectedFlag}
						onFlagSelect={handleFlagSelect}
					/>

					<Box display="flex" justifyContent="flex-end" gap={2}>
						<Button
							variant="outlined"
							onClick={handleClose}
							sx={{
								color: "white",
								borderColor: "white",
								transition: "all 0.2s ease-in-out",
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
								transition: "all 0.2s ease-in-out",
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
