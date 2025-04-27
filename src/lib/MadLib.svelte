<script lang="ts">
	import { createAnimatable } from 'animejs';
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { playMadLibPopSound } from '$lib/utils/sound';

	const RETREAT_MULTIPLIER = 20;
	const RETREAT_DISTANCE_SCALAR = 2;
	const SHAPE_DEFORM_AMOUNT = 8;
	const SHAPE_POINTS = 32;
	const SHAPE_ANIMATION_DURATION = 200;
	const BUBBLE_ANIMATION_DURATION = 600;
	const POP_ANIMATION_DURATION = 300;
	const POP_SOUND_DELAY = 20;
	const POP_COOLDOWN = 100;

	const GLOW_FILTER = `
   <filter id="glow" x="-300%" y="-300%" width="900%" height="900%">
     <feGaussianBlur stdDeviation="10" result="blur" />
     <feComposite in="SourceGraphic" in2="blur" operator="over" />
   </filter>
 `;

	const PASTEL_COLORS = [
		'fill-pink-300',
		'fill-yellow-300',
		'fill-indigo-300',
		'fill-emerald-300',
		'fill-purple-300',
		'fill-cyan-300',
		'fill-lime-300',
		'fill-red-300',
	] as const;

	const PASTEL_COLORS_HOVER = [
		'fill-pink-200',
		'fill-yellow-200',
		'fill-indigo-200',
		'fill-emerald-200',
		'fill-purple-200',
		'fill-cyan-200',
		'fill-lime-200',
		'fill-red-200',
	] as const;

	const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	function getColorForWord(word: string, hover = false): string {
		let hash = 0;
		for (let i = 0; i < word.length; i++) {
			hash = (hash << 5) - hash + word.charCodeAt(i);
			hash = hash & hash;
		}
		const colors = hover ? PASTEL_COLORS_HOVER : PASTEL_COLORS;
		const colorIndex = Math.abs(hash) % colors.length;
		return colors[colorIndex] ?? colors[0] ?? '';
	}

	let canChange = true;
	let svgAnimatable: ReturnType<typeof createAnimatable> | undefined;
	let lastPopTime = 0;
	let hasInteracted = false;
	let isHovering = false;
	let scrambleIntervals = $state<ReturnType<typeof setInterval>[]>([]);
	let mousePosition = { x: 0, y: 0 };
	let prefersReducedMotion = $state(false);

	const { word: initialWord, wordList = [], onWordChange, ...restProps } = $props();

	let currentWord = $state(initialWord);

	const initialColor = $derived(getColorForWord(currentWord, false));

	$effect(() => {
		if (initialWord !== currentWord) {
			currentWord = initialWord;
			setupWordElement();
			initializeBubbleShape();
		}
	});

	let wordElement: HTMLElement;
	let bubbleElement: HTMLElement;
	let svgElement: SVGElement;
	let pathElement: SVGPathElement;
	let letterElements: HTMLElement[] = [];
	let animatable: ReturnType<typeof createAnimatable> | undefined;
	let shapeAnimatable: ReturnType<typeof createAnimatable> | undefined;
	let bubbleRect = { width: 0, height: 0, verticalOffset: 0 };
	let roundedRectanglePoints: { x: number; y: number; baseX: number; baseY: number }[] = [];

	function generateRoundedRectanglePoints(width: number, height: number, radius = 8) {
		const points: { x: number; y: number; baseX: number; baseY: number }[] = [];
		const pointsPerSection = SHAPE_POINTS / 4;

		for (let i = 0; i < SHAPE_POINTS; i++) {
			const section = Math.floor(i / pointsPerSection);
			const t = (i % pointsPerSection) / pointsPerSection;

			let x = 0;
			let y = 0;

			switch (section) {
				case 0: {
					if (t < 0.5) {
						x = radius + (width - 2 * radius) * (t * 2);
						y = 0;
					} else {
						const angle = -Math.PI / 2 + (t - 0.5) * Math.PI;
						x = width - radius + radius * Math.cos(angle);
						y = radius + radius * Math.sin(angle);
					}
					break;
				}
				case 1: {
					if (t < 0.5) {
						x = width;
						y = radius + (height - 2 * radius) * (t * 2);
					} else {
						const angle = (t - 0.5) * Math.PI;
						x = width - radius + radius * Math.cos(angle);
						y = height - radius + radius * Math.sin(angle);
					}
					break;
				}
				case 2: {
					if (t < 0.5) {
						x = width - radius - (width - 2 * radius) * (t * 2);
						y = height;
					} else {
						const angle = Math.PI / 2 + (t - 0.5) * Math.PI;
						x = radius + radius * Math.cos(angle);
						y = height - radius + radius * Math.sin(angle);
					}
					break;
				}
				case 3: {
					if (t < 0.5) {
						x = 0;
						y = height - radius - (height - 2 * radius) * (t * 2);
					} else {
						const angle = Math.PI + (t - 0.5) * Math.PI;
						x = radius + radius * Math.cos(angle);
						y = radius + radius * Math.sin(angle);
					}
					break;
				}
			}

			points.push({ x, y, baseX: x, baseY: y });
		}

		return points;
	}

	function createPathFromPoints(points: { x: number; y: number }[]) {
		if (points.length === 0) {
			return '';
		}

		const firstPoint = points[0];
		if (!firstPoint) {
			return '';
		}

		let path = `M ${firstPoint.x} ${firstPoint.y}`;
		for (let i = 1; i < points.length; i++) {
			const point = points[i];
			if (point) {
				path += ` L ${point.x} ${point.y}`;
			}
		}
		path += ' Z';
		return path;
	}

	function initializeBubbleShape() {
		const rect = bubbleElement.getBoundingClientRect();
		const heightReduction = rect.height * 0.2;
		const newHeight = rect.height - heightReduction;
		const verticalOffset = heightReduction / 2;

		bubbleRect = {
			width: rect.width,
			height: newHeight,
			verticalOffset,
		};

		roundedRectanglePoints = generateRoundedRectanglePoints(bubbleRect.width, bubbleRect.height);
		roundedRectanglePoints = roundedRectanglePoints.map((point) => ({
			...point,
			y: point.y + verticalOffset,
			baseY: point.baseY + verticalOffset,
		}));

		pathElement.setAttribute('d', createPathFromPoints(roundedRectanglePoints));
		pathElement.classList.remove(...PASTEL_COLORS, ...PASTEL_COLORS_HOVER);
		pathElement.classList.add(getColorForWord(currentWord, isHovering));
	}

	function createBubbleAnimatable() {
		return createAnimatable(bubbleElement, {
			x: BUBBLE_ANIMATION_DURATION,
			y: BUBBLE_ANIMATION_DURATION,
			ease: 'out(4)',
		});
	}

	function createSvgAnimatable() {
		return createAnimatable(svgElement, {
			scale: POP_ANIMATION_DURATION,
			ease: 'out(4)',
		});
	}

	function createShapeAnimatable() {
		const initialShapeData: Record<string, number> = Array(SHAPE_POINTS)
			.fill(0)
			.reduce(
				(acc, _, i) => {
					acc[`x${i}`] = 0;
					acc[`y${i}`] = 0;
					return acc;
				},
				{} as Record<string, number>
			);

		return createAnimatable(initialShapeData, {
			...Object.keys(initialShapeData).reduce(
				(acc, key) => {
					acc[key] = SHAPE_ANIMATION_DURATION;
					return acc;
				},
				{} as Record<string, number>
			),
			ease: 'out(3)',
		});
	}

	function animateBubblePosition(e: MouseEvent, rect: DOMRect) {
		if (!animatable) {
			return;
		}

		const bubbleX = rect.left + rect.width / 2;
		const bubbleY = rect.top + rect.height / 2;
		const maxDistance = Math.max(rect.width, rect.height) * RETREAT_DISTANCE_SCALAR;
		const distance = Math.hypot(e.clientX - bubbleX, e.clientY - bubbleY);

		let moveX = 0;
		let moveY = 0;

		if (distance < maxDistance) {
			const intensity = ((maxDistance - distance) / maxDistance) * RETREAT_MULTIPLIER;
			const dirX = (bubbleX - e.clientX) / distance;
			const dirY = (bubbleY - e.clientY) / distance;

			moveX = dirX * intensity;
			moveY = dirY * intensity;
		}

		(animatable as any).x(moveX);
		(animatable as any).y(moveY);
	}

	function animateShapeDeformation(e: MouseEvent, rect: DOMRect) {
		if (!shapeAnimatable) {
			return;
		}

		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		roundedRectanglePoints.forEach((point, i) => {
			if (!shapeAnimatable) {
				return;
			}

			const pointDistance = Math.hypot(mouseX - point.baseX, mouseY - point.baseY);
			const deformRadius = Math.max(bubbleRect.width, bubbleRect.height) * 0.8;

			if (pointDistance < deformRadius) {
				const deformIntensity =
					((deformRadius - pointDistance) / deformRadius) * SHAPE_DEFORM_AMOUNT;
				const dirX = (point.baseX - mouseX) / pointDistance;
				const dirY = (point.baseY - mouseY) / pointDistance;

				(shapeAnimatable as any)[`x${i}`](dirX * deformIntensity);
				(shapeAnimatable as any)[`y${i}`](dirY * deformIntensity);
			} else {
				(shapeAnimatable as any)[`x${i}`](0);
				(shapeAnimatable as any)[`y${i}`](0);
			}
		});

		updateShapePath();
	}

	function updateShapePath() {
		if (!shapeAnimatable) {
			return;
		}

		const deformedPoints = roundedRectanglePoints.map((point, i) => ({
			x: point.baseX + ((shapeAnimatable as any)[`x${i}`]() as number),
			y: point.baseY + ((shapeAnimatable as any)[`y${i}`]() as number),
		}));

		pathElement.setAttribute('d', createPathFromPoints(deformedPoints));
	}

	function getLettersSortedByDistance(mouseX: number, mouseY: number) {
		const rect = bubbleElement.getBoundingClientRect();
		const relativeMouseX = mouseX - rect.left;
		const relativeMouseY = mouseY - rect.top;

		const lettersWithDistance = letterElements.map((el, i) => {
			const letterRect = el.getBoundingClientRect();
			const letterCenterX = letterRect.left - rect.left + letterRect.width / 2;
			const letterCenterY = letterRect.top - rect.top + letterRect.height / 2;
			const distance = Math.hypot(relativeMouseX - letterCenterX, relativeMouseY - letterCenterY);
			return { el, i, distance };
		});

		return lettersWithDistance.sort((a, b) => a.distance - b.distance);
	}

	function handleMouseEnter() {
		isHovering = true;
		pathElement.classList.remove(getColorForWord(currentWord));
		pathElement.classList.add(getColorForWord(currentWord, true));

		scrambleIntervals.forEach(clearInterval);
		scrambleIntervals = [];

		const sortedLetters = getLettersSortedByDistance(mousePosition.x, mousePosition.y);

		sortedLetters.forEach(({ el }, index) => {
			setTimeout(() => {
				if (!isHovering) {
					return;
				}

				const intervalId = setInterval(() => {
					const randomIndex = Math.floor(Math.random() * LETTERS.length);
					const randomLetter = LETTERS[randomIndex];
					if (randomLetter) {
						el.innerText = randomLetter;
					}
				}, 50);
				scrambleIntervals.push(intervalId);
			}, index * 30);
		});
	}

	function handleMouseLeave() {
		if (!animatable) {
			return;
		}

		isHovering = false;
		pathElement.classList.remove(getColorForWord(currentWord, true));
		pathElement.classList.add(getColorForWord(currentWord));

		scrambleIntervals.forEach(clearInterval);
		scrambleIntervals = [];

		const sortedLetters = getLettersSortedByDistance(mousePosition.x, mousePosition.y);

		sortedLetters.forEach(({ el, i }, index) => {
			setTimeout(() => {
				el.innerText = currentWord[i] ?? '';
			}, index * 30);
		});

		(animatable as any).x(0);
		(animatable as any).y(0);
	}

	function handleMouseDown() {
		pathElement.classList.remove(...PASTEL_COLORS_HOVER);
		pathElement.classList.add(getColorForWord(currentWord, false));
	}

	function handleMouseUp() {
		if (isHovering) {
			pathElement.classList.remove(...PASTEL_COLORS);
			pathElement.classList.add(getColorForWord(currentWord, true));
		}
	}

	function handleMouseMove(e: MouseEvent) {
		mousePosition = { x: e.clientX, y: e.clientY };
		if (!bubbleElement || !animatable || !pathElement) {
			return;
		}

		const rect = bubbleElement.getBoundingClientRect();
		animateBubblePosition(e, rect);
		animateShapeDeformation(e, rect);
	}

	function handleClick() {
		if (!canChange || !svgAnimatable) {
			return;
		}

		const now = Date.now();
		if (now - lastPopTime < POP_COOLDOWN) {
			return;
		}

		canChange = false;
		lastPopTime = now;
		hasInteracted = true;

		if (wordList.length > 1) {
			if (!prefersReducedMotion) {
				(svgAnimatable as any).scale(1.2);
			}

			setTimeout(() => {
				if (hasInteracted && !prefersReducedMotion) {
					playMadLibPopSound();
				}
			}, POP_SOUND_DELAY);

			setTimeout(
				() => {
					if (!svgAnimatable) {
						return;
					}

					let newWord;
					do {
						newWord = wordList[Math.floor(Math.random() * wordList.length)];
					} while (newWord === currentWord);
					currentWord = newWord;
					onWordChange?.(currentWord);
					setupWordElement();
					initializeBubbleShape();
					if (!prefersReducedMotion) {
						(svgAnimatable as any).scale(1);
					}
					canChange = true;
				},
				prefersReducedMotion ? 0 : POP_ANIMATION_DURATION / 2
			);
		}
	}

	function setupWordElement() {
		wordElement.innerHTML = currentWord.replace(/./g, "<span class='letter'>$&</span>");
		letterElements = Array.from(wordElement.querySelectorAll('.letter'));
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mediaQuery.matches;
		const listener = (e: { matches: boolean }) => (prefersReducedMotion = e.matches);
		mediaQuery.addEventListener('change', listener);

		setupWordElement();
		initializeBubbleShape();
		animatable = createBubbleAnimatable();
		svgAnimatable = createSvgAnimatable();
		shapeAnimatable = createShapeAnimatable();

		const animationLoop = () => {
			if (!prefersReducedMotion) {
				updateShapePath();
			}
			requestAnimationFrame(animationLoop);
		};

		if (!prefersReducedMotion) {
			window.addEventListener('mousemove', handleMouseMove);
			bubbleElement.addEventListener('mouseenter', handleMouseEnter);
			bubbleElement.addEventListener('mouseleave', handleMouseLeave);
			bubbleElement.addEventListener('mousedown', handleMouseDown);
			bubbleElement.addEventListener('mouseup', handleMouseUp);
		}
		bubbleElement.addEventListener('click', handleClick);

		requestAnimationFrame(animationLoop);

		return () => {
			mediaQuery.removeEventListener('change', listener);
			if (!prefersReducedMotion) {
				window.removeEventListener('mousemove', handleMouseMove);
				bubbleElement.removeEventListener('mouseenter', handleMouseEnter);
				bubbleElement.removeEventListener('mouseleave', handleMouseLeave);
				bubbleElement.removeEventListener('mousedown', handleMouseDown);
				bubbleElement.removeEventListener('mouseup', handleMouseUp);
			}
			bubbleElement.removeEventListener('click', handleClick);
		};
	});
</script>

<button
	bind:this={bubbleElement}
	{...restProps}
	class={twMerge('group relative inline-block', restProps.class)}
	type="button"
>
	<svg
		bind:this={svgElement}
		class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
	>
		<defs>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html GLOW_FILTER}
		</defs>
		<path
			bind:this={pathElement}
			class="transition-colors duration-200 {initialColor}"
			filter={prefersReducedMotion ? '' : 'url(#glow)'}
			d=""
		/>
	</svg>
	<span
		bind:this={wordElement}
		class="pointer-events-none relative z-10 block px-1 py-1 font-mono text-slate-800"
	>
		{currentWord}
	</span>
</button>
