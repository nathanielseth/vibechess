import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const useMenuNavigation = (playClickSound) => {
	const navigate = useNavigate();

	const handlePassAndPlayClick = useCallback(() => {
		playClickSound();
		navigate("/pass-and-play");
	}, [playClickSound, navigate]);

	const handlePlayWithFriendClick = useCallback(() => {
		playClickSound();
		return true;
	}, [playClickSound]);

	const handleVersusBotClick = useCallback(() => {
		playClickSound();
		toast.info("Bot gameplay coming soon!");
	}, [playClickSound]);

	const handleSettingsClick = useCallback(() => {
		playClickSound();
		return true;
	}, [playClickSound]);

	return {
		handlePassAndPlayClick,
		handlePlayWithFriendClick,
		handleVersusBotClick,
		handleSettingsClick,
	};
};
