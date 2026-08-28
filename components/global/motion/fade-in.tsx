"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  replay?: boolean;
  amount?: number;
};

export function FadeIn({ children, className, delay = 0, replay = false, amount = 0.1 }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: !replay, amount, margin: "-32px" }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({ children, className }: Omit<Props, "delay">) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.03 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function StaggerContainer({ children, className }: Omit<Props, "delay">) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={containerVariants}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "show"}
      viewport={{ once: true, amount: 0.08, margin: "-24px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: Omit<Props, "delay">) {
  return (
    <motion.div variants={itemVariants} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className, delay = 0 }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.975 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.1, margin: "-32px" }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.42, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
