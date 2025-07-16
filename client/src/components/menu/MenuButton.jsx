import React from "react";
import PropTypes from "prop-types";
import { Button, Box, Typography, Slide } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styles } from "../../styles/styles";

const MenuButton = React.memo(
	({
		onClick,
		icon,
		label,
		backgroundColor,
		description,
		isAnimating = false,
	}) => {
		const theme = useTheme();
		const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

		// Bounce animation keyframes
		const bounceAnimation = {
			"@keyframes bounce": {
				"0%, 100%": {
					transform: "translateY(0)",
					animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
				},
				"50%": {
					transform: "translateY(-8px)",
					animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
				},
			},
		};

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
						animation: isAnimating
							? "bounce 0.812s infinite"
							: "none",
						...bounceAnimation,
						"& img": {
							filter: "drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.3))",
						},
						"&:hover": {
							"& img": { filter: "brightness(0%)" },
							"& h5": { textShadow: "none" },
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
	isAnimating: PropTypes.bool,
};

export default MenuButton;
