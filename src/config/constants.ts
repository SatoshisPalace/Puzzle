// AO Process IDs
export const PROCESS_IDS = {
    // Replace this with your deployed puzzle process ID
    PUZZLE_PROCESS: "ytMAMNW_48T7rJiaGOV5F102YrUNWYYmQoVljJBXoKg",
} as const;

// Network Configuration
export const NETWORK = {
    MU_URL: import.meta.env.VITE_MU_URL || "https://mu.ao-testnet.xyz",
    CU_URL: import.meta.env.VITE_CU_URL || "https://cu.ao-testnet.xyz",
    GATEWAY_URL: import.meta.env.VITE_GATEWAY_URL || "https://arweave.net",
} as const;

// Hash Configuration
export const HASH_SALT = "saltyDumDumz";

// Game Configuration
export const GAME_CONFIG = {
    MAX_QUESTIONS: 10,  // Maximum number of questions per puzzle
    MIN_QUESTIONS: 1,   // Minimum number of questions per puzzle
    SUPPORTED_TYPES: ['text', 'image', 'video', 'iframe'] as const,
} as const;

export const DEFAULT_BANNER = '/crown.avif';