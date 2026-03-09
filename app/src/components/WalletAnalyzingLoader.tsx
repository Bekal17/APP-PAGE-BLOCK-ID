import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LOADING_MESSAGES = [
  "Scanning transactions...",
  "Mapping wallet network...",
  "Detecting risk patterns...",
  "Computing trust score...",
];

interface NodePosition {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const generateNodes = (): NodePosition[] => {
  const nodes: NodePosition[] = [];
  const centerX = 200;
  const centerY = 150;

  nodes.push({ id: 0, x: centerX, y: centerY, size: 16, delay: 0 });

  for (let i = 1; i <= 8; i++) {
    const angle = (i - 1) * (Math.PI / 4);
    const radius = 70 + Math.random() * 30;
    nodes.push({
      id: i,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      size: 6 + Math.random() * 6,
      delay: i * 0.1,
    });
  }

  for (let i = 9; i <= 16; i++) {
    const angle = ((i - 9) * (Math.PI / 4)) + (Math.PI / 8);
    const radius = 110 + Math.random() * 20;
    nodes.push({
      id: i,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      size: 4 + Math.random() * 4,
      delay: i * 0.08,
    });
  }

  return nodes;
};

const WalletAnalyzingLoader = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [nodes] = useState<NodePosition[]>(generateNodes);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const connections: [number, number][] = [];
  for (let i = 1; i <= 8; i++) {
    connections.push([0, i]);
  }
  for (let i = 9; i <= 16; i++) {
    const innerNode = ((i - 9) % 8) + 1;
    connections.push([innerNode, i]);
  }
  connections.push([1, 2], [3, 4], [5, 6], [7, 8]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-black to-blue-950/30" />

      <div className="relative flex flex-col items-center gap-8">
        <svg
          width="400"
          height="300"
          viewBox="0 0 400 300"
          className="overflow-visible"
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
            </linearGradient>
            <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </radialGradient>
            <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </radialGradient>
          </defs>

          {connections.map(([from, to], idx) => {
            const fromNode = nodes[from];
            const toNode = nodes[to];
            return (
              <motion.line
                key={`line-${idx}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  pathLength: { duration: 1, delay: idx * 0.05 },
                  opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
              />
            );
          })}

          {nodes.slice(1).map((node) => (
            <motion.g key={node.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size * 2}
                fill="transparent"
                stroke="#8b5cf6"
                strokeWidth="0.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: node.delay,
                  ease: "easeInOut",
                }}
              />
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill="url(#nodeGradient)"
                filter="url(#glow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  scale: { duration: 0.5, delay: node.delay },
                  opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: node.delay },
                }}
              />
            </motion.g>
          ))}

          <motion.g>
            <motion.circle
              cx={nodes[0].x}
              cy={nodes[0].y}
              r={35}
              fill="transparent"
              stroke="#a855f7"
              strokeWidth="1"
              initial={{ scale: 0 }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.circle
              cx={nodes[0].x}
              cy={nodes[0].y}
              r={25}
              fill="transparent"
              stroke="#8b5cf6"
              strokeWidth="1.5"
              initial={{ scale: 0 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
            <motion.circle
              cx={nodes[0].x}
              cy={nodes[0].y}
              r={nodes[0].size}
              fill="url(#centerGradient)"
              filter="url(#glow)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            />
          </motion.g>

          {connections.slice(0, 8).map((_, idx) => (
            <motion.circle
              key={`pulse-${idx}`}
              r="2"
              fill="#c084fc"
              filter="url(#glow)"
              initial={{ opacity: 0 }}
              animate={{
                cx: [nodes[0].x, nodes[idx + 1].x],
                cy: [nodes[0].y, nodes[idx + 1].y],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: idx * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </svg>

        <div className="flex flex-col items-center gap-3 text-center">
          <motion.h2
            className="text-2xl font-semibold bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Analyzing Wallet
          </motion.h2>

          <motion.p
            key={messageIndex}
            className="text-sm text-purple-300/80 h-5"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            {LOADING_MESSAGES[messageIndex]}
          </motion.p>

          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletAnalyzingLoader;
