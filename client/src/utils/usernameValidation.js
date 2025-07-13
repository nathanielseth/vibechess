import { Filter } from "bad-words";

const filter = new Filter();

export const validateUsername = (username) => {
	const trimmed = username.trim();

	if (trimmed.length < 2) return "Too short";
	if (trimmed.length > 14) return "Too long";
	if (trimmed.includes(" ")) return "No spaces";
	if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) return "Invalid chars";
	if (/[._-]{2,}/.test(trimmed)) return "No repeated symbols";
	if (filter.clean(trimmed) !== trimmed) return "Inappropriate";

	return null;
};
