const PALETTE = [
	{ name: "android green", body: "#3ddc84", hat: "#ffca28" },
	{ name: "classic 2013", body: "#a4ca39", hat: "#f26d21" },
	{ name: "grape", body: "#8b7cff", hat: "#ffd166" },
	{ name: "tangerine", body: "#ff8a4c", hat: "#4cc9f0" },
	{ name: "ice", body: "#31c2ff", hat: "#ff6b9a" },
	{ name: "bubblegum", body: "#ff6bb5", hat: "#7be0ad" },
];

const HATS = ["none", "cap", "crown", "party"];
const MOODS = ["neutral", "happy", "surprised", "dizzy", "sleepy"];
const KONAMI = [
	"ArrowUp",
	"ArrowUp",
	"ArrowDown",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowLeft",
	"ArrowRight",
	"b",
	"a",
];
const IDLE_MS = 9000;

const dude = document.getElementById("dude");
const status = document.getElementById("status");
const eyes = dude.querySelector(".dude__eyes");
const head = dude.querySelector(".dude__head");
const arms = {
	left: dude.querySelector(".dude__arm--left"),
	right: dude.querySelector(".dude__arm--right"),
};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = { colour: 0, hat: 0, mood: 0, sound: false, dancing: false };
let idleTimer;
let blinkTimer;
let konamiProgress = 0;
let audio;

function say(text) {
	status.textContent = text;
}

function applyState() {
	const skin = PALETTE[state.colour];
	document.documentElement.style.setProperty("--dude-body", skin.body);
	document.documentElement.style.setProperty("--dude-hat", skin.hat);
	dude.dataset.hat = HATS[state.hat];
	dude.dataset.mood = MOODS[state.mood];
	dude.classList.toggle("is-dancing", state.dancing);
	setPressed("dance", state.dancing);
	setPressed("sound", state.sound);
	button("sound").textContent = state.sound ? "Sound on" : "Sound off";
	writeHash();
}

function button(action) {
	return document.querySelector(`[data-action="${action}"]`);
}

function setPressed(action, on) {
	button(action).setAttribute("aria-pressed", String(on));
}

function writeHash() {
	const params = new URLSearchParams({
		c: String(state.colour),
		h: HATS[state.hat],
		m: MOODS[state.mood],
	});
	history.replaceState(null, "", `#${params}`);
}

function readHash() {
	const params = new URLSearchParams(location.hash.slice(1));
	const colour = Number(params.get("c"));
	if (Number.isInteger(colour) && PALETTE[colour]) state.colour = colour;
	const hat = HATS.indexOf(params.get("h"));
	if (hat >= 0) state.hat = hat;
	const mood = MOODS.indexOf(params.get("m"));
	if (mood >= 0) state.mood = mood;
}

/* --- sound ------------------------------------------------------------- */

function blip(frequency, duration = 0.14, type = "triangle") {
	if (!state.sound) return;
	audio = audio || new (window.AudioContext || window.webkitAudioContext)();
	const oscillator = audio.createOscillator();
	const gain = audio.createGain();
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
	oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.6, audio.currentTime + duration);
	gain.gain.setValueAtTime(0.08, audio.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
	oscillator.connect(gain).connect(audio.destination);
	oscillator.start();
	oscillator.stop(audio.currentTime + duration);
}

/* --- behaviour --------------------------------------------------------- */

function wakeUp() {
	if (MOODS[state.mood] === "sleepy") {
		state.mood = 0;
		applyState();
	}
	clearTimeout(idleTimer);
	idleTimer = setTimeout(fallAsleep, IDLE_MS);
}

function fallAsleep() {
	if (state.dancing) return;
	state.mood = MOODS.indexOf("sleepy");
	eyes.style.transform = "";
	head.style.transform = "";
	applyState();
	say("Shhh. He dozed off.");
}

function look(x, y) {
	if (MOODS[state.mood] === "sleepy" || state.dancing) return;
	const box = dude.getBoundingClientRect();
	const dx = clamp((x - (box.left + box.width / 2)) / (box.width / 2));
	const dy = clamp((y - (box.top + box.height / 2)) / (box.height / 2));
	eyes.style.transform = `translate(${(dx * 7).toFixed(2)}px, ${(dy * 4).toFixed(2)}px)`;
	head.style.transform = `rotate(${(dx * 6).toFixed(2)}deg) translateY(${(dy * 2).toFixed(2)}px)`;
}

function clamp(value) {
	return Math.max(-1, Math.min(1, value));
}

function flash(className, ms) {
	dude.classList.remove(className);
	void dude.getBoundingClientRect();
	dude.classList.add(className);
	setTimeout(() => dude.classList.remove(className), ms);
}

function wave() {
	wakeUp();
	flash("is-waving", 1300);
	blip(520);
	say("Hi there.");
}

function poke() {
	wakeUp();
	flash("is-poked", 520);
	state.mood = MOODS.indexOf("surprised");
	applyState();
	blip(320, 0.1, "square");
	say("Boop.");
	setTimeout(() => {
		if (MOODS[state.mood] === "surprised") {
			state.mood = MOODS.indexOf("happy");
			applyState();
		}
	}, 900);
}

function cycle(key, list, label) {
	wakeUp();
	state[key] = (state[key] + 1) % list.length;
	applyState();
	blip(440 + state[key] * 40, 0.1);
	say(label());
}

function toggleDance() {
	wakeUp();
	state.dancing = !state.dancing;
	if (state.dancing) {
		state.mood = MOODS.indexOf("happy");
		eyes.style.transform = "";
		head.style.transform = "";
	}
	applyState();
	say(state.dancing ? "Dancing. Press D to stop." : "Back to standing around.");
	if (state.dancing) beat();
}

function beat() {
	if (!state.dancing) return;
	blip(220 + Math.random() * 220, 0.09, "sawtooth");
	setTimeout(beat, 550);
}

function toggleSound() {
	state.sound = !state.sound;
	applyState();
	blip(660, 0.12);
	say(state.sound ? "Sound on." : "Sound off.");
}

async function share() {
	writeHash();
	try {
		await navigator.clipboard.writeText(location.href);
		say("Link copied — it restores this exact dude.");
	} catch {
		say(`Copy this link: ${location.href}`);
	}
}

function scheduleBlink() {
	clearTimeout(blinkTimer);
	blinkTimer = setTimeout(
		() => {
			if (MOODS[state.mood] !== "sleepy") flash("is-blinking", 140);
			scheduleBlink();
		},
		2500 + Math.random() * 4000,
	);
}

/* --- arm dragging ------------------------------------------------------ */

const SHOULDERS = { left: { x: 33, y: 127 }, right: { x: 227, y: 127 } };

function startDrag(event) {
	const arm = event.target.closest(".dude__arm");
	if (!arm) return;
	const side = arm.dataset.side;
	arm.classList.add("is-dragging");
	arm.setPointerCapture(event.pointerId);
	wakeUp();

	const move = (moveEvent) => {
		const point = toSvgPoint(moveEvent);
		const shoulder = SHOULDERS[side];
		const angle = (Math.atan2(point.y - shoulder.y, point.x - shoulder.x) * 180) / Math.PI - 90;
		arm.style.transform = `rotate(${clampAngle(angle)}deg)`;
	};

	const end = () => {
		arm.classList.remove("is-dragging");
		arm.style.transform = "";
		dude.removeEventListener("pointermove", move);
		dude.removeEventListener("pointerup", end);
		dude.removeEventListener("pointercancel", end);
		blip(600, 0.1);
		say("Boing.");
	};

	dude.addEventListener("pointermove", move);
	dude.addEventListener("pointerup", end);
	dude.addEventListener("pointercancel", end);
}

function clampAngle(angle) {
	const wrapped = ((angle + 180) % 360) - 180;
	return Math.max(-150, Math.min(150, wrapped));
}

function toSvgPoint(event) {
	const point = dude.createSVGPoint();
	point.x = event.clientX;
	point.y = event.clientY;
	return point.matrixTransform(dude.getScreenCTM().inverse());
}

/* --- easter egg -------------------------------------------------------- */

function swarm() {
	if (reducedMotion.matches) {
		say("A swarm of tiny dudes marched past. (Motion is reduced, so take our word for it.)");
		return;
	}
	const layer = document.createElement("div");
	layer.className = "swarm";
	document.body.append(layer);

	for (let index = 0; index < 14; index += 1) {
		const clone = dude.cloneNode(true);
		clone.removeAttribute("id");
		clone.removeAttribute("tabindex");
		clone.removeAttribute("aria-label");
		clone.removeAttribute("aria-describedby");
		clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
		clone.setAttribute("aria-hidden", "true");
		clone.classList.add("swarm__dude");
		clone.style.top = `${Math.random() * 85}vh`;
		clone.style.animationDelay = `${Math.random() * 1.6}s`;
		clone.style.animationDuration = `${2.4 + Math.random() * 1.6}s`;
		layer.append(clone);
	}

	blip(880, 0.3);
	say("You found it.");
	setTimeout(() => layer.remove(), 5000);
}

/* --- wiring ------------------------------------------------------------ */

document.addEventListener("pointermove", (event) => {
	look(event.clientX, event.clientY);
	wakeUp();
});

dude.addEventListener("pointerdown", (event) => {
	if (event.target.closest(".dude__arm")) startDrag(event);
	else poke();
});

dude.addEventListener("keydown", (event) => {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		wave();
	}
});

document.addEventListener("keydown", (event) => {
	if (event.target.matches("button")) return;
	const key = event.key.toLowerCase();
	if (key === "d") toggleDance();
	else if (key === "m") cycle("mood", MOODS, () => `Mood: ${MOODS[state.mood]}.`);
	else if (key === "c") cycle("colour", PALETTE, () => `Colour: ${PALETTE[state.colour].name}.`);
	else if (key === "h") cycle("hat", HATS, () => `Hat: ${HATS[state.hat]}.`);
	else if (key === "s") toggleSound();

	konamiProgress = event.key === KONAMI[konamiProgress] ? konamiProgress + 1 : 0;
	if (konamiProgress === KONAMI.length) {
		konamiProgress = 0;
		swarm();
	}
});

const ACTIONS = {
	wave,
	dance: toggleDance,
	mood: () => cycle("mood", MOODS, () => `Mood: ${MOODS[state.mood]}.`),
	colour: () => cycle("colour", PALETTE, () => `Colour: ${PALETTE[state.colour].name}.`),
	hat: () => cycle("hat", HATS, () => `Hat: ${HATS[state.hat]}.`),
	sound: toggleSound,
	share,
};

document.querySelectorAll("[data-action]").forEach((element) => {
	element.addEventListener("click", () => ACTIONS[element.dataset.action]());
});

window.addEventListener("hashchange", () => {
	readHash();
	applyState();
});

readHash();
applyState();
scheduleBlink();
wakeUp();
say("Move your pointer — he is watching.");
