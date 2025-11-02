# GSAP Animation Customization Guide

This guide explains how to customize GSAP animations throughout the application.

## BaseLayout Component (`src/components/BaseLayout.tsx`)

The `BaseLayout` component provides the consistent dark background and header across all pages.

### GSAP Configuration

Inside `BaseLayout.tsx`, you'll find a `GSAP_CONFIG` object with customizable timing values:

```typescript
const GSAP_CONFIG = {
  headerAnimationDelay: 0,           // Delay before header animates (seconds)
  contentAnimationDelay: 0.3,        // Delay before content animates (seconds)
  pageTransitionDuration: 0.5,       // Duration of page fade out/in (seconds)
  contentAnimationDuration: 1,       // Duration of content entrance (seconds)
  headerEasing: "power4.out",        // Easing for header animation
  contentEasing: "power4.out",       // Easing for content animation
  transitionEasing: "power2.inOut",  // Easing for page transitions
};
```

### Available Easing Functions

- `"power1.out"` - Gentle ease out
- `"power2.out"` - Moderate ease out
- `"power3.out"` - Strong ease out
- `"power4.out"` - Very strong ease out (default)
- `"expo.out"` - Exponential ease out (fast start, slow end)
- `"back.out"` - Slight overshoot at end
- `"elastic.out"` - Elastic bounce effect
- `"bounce.out"` - Bounce effect
- `"power2.inOut"` - Smooth in/out transition

### Customizing BaseLayout Animations

1. **Header Animation Speed**: Change `headerEasing` and duration (currently 0.8s)
2. **Content Entrance Speed**: Adjust `contentAnimationDuration` and `contentAnimationDelay`
3. **Page Transition Speed**: Modify `pageTransitionDuration`
4. **Animation Style**: Change easing functions to get different feels

## PageTransition Component (`src/components/PageTransition.tsx`)

Handles smooth transitions between pages with fade out/in effects.

### GSAP Configuration

```typescript
const GSAP_CONFIG = {
  transitionOutDuration: 0.25,      // Duration of fade out
  transitionInDuration: 0.5,        // Duration of fade in
  transitionOutEasing: "power2.in", // Easing for fade out
  transitionInEasing: "power2.out",  // Easing for fade in
};
```

## useAnimatedHeading Hook (`src/hooks/useAnimatedHeading.ts`)

Custom hook for animating headings with letter-by-letter stagger effects.

### Usage Example

```typescript
import { useAnimatedHeading } from "../hooks/useAnimatedHeading";

function MyPage() {
  const headingRef = useAnimatedHeading({
    delay: 0.3,           // Delay before animation starts
    duration: 0.8,       // Duration of each letter animation
    ease: "expo.out",    // Easing function
    staggerAmount: 1.2,  // Total stagger duration
    startY: 40,          // Starting Y position (pixels)
    startScale: 0.8,     // Starting scale (0-1)
    rotationX: -15,      // 3D rotation on X axis (degrees)
    showShimmer: true,   // Enable gradient shimmer effect
  });

  return <h1 ref={headingRef}>Your Heading Text</h1>;
}
```

### Alternative: AnimatedHeadingWrapper Component

```typescript
import { AnimatedHeadingWrapper } from "../hooks/useAnimatedHeading";

function MyPage() {
  return (
    <AnimatedHeadingWrapper
      delay={0.3}
      duration={0.8}
      ease="expo.out"
      showShimmer={true}
      className="text-4xl"
    >
      Your Heading Text
    </AnimatedHeadingWrapper>
  );
}
```

## AnimatedLogo Component (`src/components/AnimatedLogo.tsx`)

The "CineAI" logo animation. Currently uses:
- Letter-by-letter stagger
- Fade-in with upward motion
- Scale animation
- Gradient shimmer effect

### Customization

Edit the `gsap.from()` call in `AnimatedLogo.tsx` to adjust:
- `duration`: Animation duration (default: 0.6)
- `ease`: Easing function (default: "power4.out")
- `stagger.amount`: Stagger delay between letters (default: 0.4)

## Performance Optimization

### Preventing Re-animations

Animations are designed to run once per page load using:
- React refs to track animation state
- `useEffect` dependencies to trigger only on mount/page change
- GSAP cleanup functions to prevent memory leaks

### Disabling Animations for Development

To temporarily disable animations for faster development:

1. **BaseLayout**: Comment out the GSAP animations in `useEffect`
2. **PageTransition**: Set `opacity: 1` directly in style prop
3. **useAnimatedHeading**: Return ref without running animations

### Optimizing Animation Performance

- Use `will-change` CSS property for elements that will animate
- Reduce `staggerAmount` for faster animations
- Use `power2` instead of `power4` for smoother performance on slower devices
- Consider using `transform` and `opacity` only (GPU-accelerated)

## Custom Animation Examples

### Faster Page Transitions

```typescript
// In BaseLayout.tsx
const GSAP_CONFIG = {
  pageTransitionDuration: 0.3,  // Faster transitions
  contentAnimationDuration: 0.6, // Faster entrance
  // ...
};
```

### Slower, More Dramatic Heading Animation

```typescript
const headingRef = useAnimatedHeading({
  delay: 0.5,
  duration: 1.2,
  staggerAmount: 2.0,
  ease: "elastic.out", // Dramatic bounce effect
});
```

### Disable Shimmer Effect

```typescript
const headingRef = useAnimatedHeading({
  showShimmer: false,
});
```

## Troubleshooting

### Animations Not Triggering

1. Check that `currentPage` prop is being passed to `BaseLayout`
2. Verify that page content is wrapped in `PageTransition`
3. Ensure GSAP is properly imported

### Stuttering or Janky Animations

1. Reduce animation complexity (fewer properties animated)
2. Lower `staggerAmount` values
3. Use simpler easing functions (`power2` instead of `power4`)
4. Check browser DevTools Performance tab for bottlenecks

### Animations Running Multiple Times

1. Verify `useEffect` dependencies are correct
2. Check that cleanup functions are properly removing GSAP tweens
3. Ensure components aren't re-mounting unnecessarily

