export const strings1 = [
	"Absurd",
	"Bubbly",
	"Cheeky",
	"Clever",
	"Cool",
	"Crazy",
	"Da",
	"Freakin",
	"Funky",
	"Giga",
	"Happy",
	"King",
	"Mighty",
	"Peculiar",
	"Quirky",
	"Salty",
	"Smart",
	"Sneaky",
	"Silly",
	"Spooky",
	"The",
	"Wacky",
	"Wimp",
	"Wise",
];

export const strings2 = [
	"Banana",
	"Bigfoot",
	"Blunder",
	"Cactus",
	"Cat",
	"Champ",
	"Chief",
	"Coder",
	"Dinosaur",
	"Enigma",
	"Gambit",
	"Guy",
	"Jellyfish",
	"Narwhal",
	"Noodle",
	"Noob",
	"Penguin",
	"Pirate",
	"Potato",
	"Savior",
	"Snail",
	"Unicorn",
	"Vibes",
	"Visionary",
];

export function getRandomElement(array) {
	return array[Math.floor(Math.random() * array.length)];
}

export function generateRandomUsername() {
	let randomString1, randomString2, combinedUsername;

	do {
		randomString1 = getRandomElement(strings1);
		randomString2 = getRandomElement(strings2);
		combinedUsername = randomString1 + randomString2;
	} while (combinedUsername.length > 14);

	return combinedUsername;
}
