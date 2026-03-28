export const TOOL_PRICES = {
  image: 0.005, // USDC
  summarise: 0.001,
  pdf: 0.002,
  code: 0.003,
} as const;

export type ToolName = keyof typeof TOOL_PRICES;
