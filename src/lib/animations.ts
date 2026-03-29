import type { HTMLMotionProps } from "framer-motion";

export const modalVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 },
  },
  slideDown: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
  },
};

export const modalTransition = {
  backdrop: { duration: 0.2 },
  content: { type: "spring" as const, stiffness: 300, damping: 30 },
  slideDown: { duration: 0.2 },
};

export const buttonAnimations = {
  icon: { whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } },
  pill: { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } },
};

export type MotionButtonProps = HTMLMotionProps<"button"> & {
  variant?: "icon" | "pill";
};