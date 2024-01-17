import React from "react";
import PropTypes from "prop-types";
import { Modal, Box, Typography, Button } from "@mui/material";

const ConfirmationModal = ({
	isOpen,
	onClose,
	onConfirm,
	message,
	isResignation,
	setIsGameOver,
}) => {
	const handleConfirm = () => {
		onClose();
		if (isResignation) {
			setIsGameOver(true);
		}
	};
	return (
		<Modal open={isOpen} onClose={onClose}>
			<Box
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					bgcolor: "#1f2123",
					boxShadow: 24,
					borderRadius: 3,
					p: 3,
					textAlign: "center",
					justifyContent: "center",
					alignItems: "center",
					width: "28vh",
					maxHeight: "23vh",
				}}
			>
				<Typography component="div" gutterBottom sx={{ mb: 3 }}>
					{message}
				</Typography>
				<Button
					onClick={onClose}
					sx={{ marginRight: 2 }}
					variant="contained"
					color="secondary"
				>
					NO
				</Button>
				<Button
					onClick={isResignation ? handleConfirm : onConfirm}
					variant="contained"
					color="secondary"
				>
					YES
				</Button>
			</Box>
		</Modal>
	);
};

ConfirmationModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onConfirm: PropTypes.func.isRequired,
	message: PropTypes.string.isRequired,
	isResignation: PropTypes.bool.isRequired,
	setIsGameOver: PropTypes.bool.isRequired,
};

export default ConfirmationModal;
