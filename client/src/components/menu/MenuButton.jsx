import React from "react";
import PropTypes from "prop-types";
import { Button, Box, Typography, Slide } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styles } from "../../styles/styles";

const MenuButton = React.memo(
	({ onClick, icon, label, backgroundColor, description }) => {
		const theme = useTheme();
		const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
		return (
			<Slide direction="up" in={true} mountOnEnter unmountOnExit>
				<Button
					onClick={onClick}
					variant="contained"
					sx={{
						...styles.commonButtonStyles,
						backgroundColor,
						position: "relative",
						overflow: "hidden",
						"&:hover": {
							"& img": { filter: "brightness(0%)" },
							"& .description": {
								position: "relative",
								visibility: "visible",
								transform: "translateY(-10px)",
								transition:
									"transform 0.5s ease, opacity 0.5s ease",
								opacity: 1,
							},
							"& .buttonContent": {
								transform: "translateY(-20px)",
								transition: "transform 0.5s ease",
							},
						},
						"&.MuiButton-root:hover": {
							bgcolor: "white",
							color: "black",
						},
					}}
				>
					<Box
						className="buttonContent"
						sx={{
							display: "flex",
							flexDirection: isMobile ? "row" : "column",
							alignItems: "center",
							justifyContent: "center",
							transition: "transform 0.5s ease",
						}}
					>
						{!isMobile && (
							<Typography
								variant="body2"
								className="empty-space"
								sx={{
									visibility: "hidden",
								}}
							>
								{description}
							</Typography>
						)}
						{!isMobile && (
							<img
								src={icon}
								alt="Icon"
								style={styles.iconStyles}
							/>
						)}
						<Typography variant="h5" sx={styles.buttonTextStyles}>
							{label}
						</Typography>
						{!isMobile && (
							<Typography
								variant="body2"
								className="description"
								sx={{
									top: "100%",
									left: "0",
									width: "100%",
									fontSize: 12,
									visibility: "hidden",
									transform: "translateY(0)",
									mt: "15px",
									opacity: 0,
								}}
							>
								{description}
							</Typography>
						)}
					</Box>
				</Button>
			</Slide>
		);
	}
);

MenuButton.displayName = "MenuButton";

MenuButton.propTypes = {
	onClick: PropTypes.func.isRequired,
	icon: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	backgroundColor: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
};

export default MenuButton;
