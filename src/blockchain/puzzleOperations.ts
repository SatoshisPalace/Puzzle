import { message, dryrun, createDataItemSigner, result } from '../config/aoConnection';
import { PROCESS_IDS, HASH_SALT } from '../config/constants';

// Bit operations
const bitXOR = (a: number, b: number): number => {
  return (a ^ b) >>> 0;
};

const bitRotateLeft = (n: number, b: number, bits: number): number => {
  const mask = (2 ** bits) - 1;
  return (((n << b) & mask) | (n >>> (bits - b))) >>> 0;
};

const bitRotateRight = (n: number, b: number, bits: number): number => {
  const mask = (2 ** bits) - 1;
  return (((n >>> b) & mask) | (n << (bits - b)) & mask) >>> 0;
};

const modAdd = (a: number, b: number): number => {
  return (a + b) % (2 ** 32);
};

// Hash function that matches the Lua implementation
export const secureHash = (input: string, salt: string = HASH_SALT): string => {
  const h1 = new Uint32Array([0x6a09e667]);
  const h2 = new Uint32Array([0xbb67ae85]);
  const h3 = new Uint32Array([0x3c6ef372]);
  const h4 = new Uint32Array([0xa54ff53a]);
  const rounds = 64;

  input = input + salt;

  for (let i = 0; i < input.length; i++) {
    const byte = input.charCodeAt(i);

    // First hash state
    h1[0] = bitXOR(h1[0], byte);
    h1[0] = modAdd(bitRotateLeft(h1[0], 13, 32), 0x5a827999);
    h1[0] = modAdd(h1[0], bitRotateRight(h2[0], 7, 32));

    // Second hash state
    h2[0] = bitXOR(h2[0], byte);
    h2[0] = modAdd(bitRotateLeft(h2[0], 17, 32), 0x6ed9eba1);
    h2[0] = modAdd(h2[0], bitRotateRight(h3[0], 5, 32));

    // Third hash state
    h3[0] = bitXOR(h3[0], byte);
    h3[0] = modAdd(bitRotateLeft(h3[0], 19, 32), 0x8f1bbcdc);
    h3[0] = modAdd(h3[0], bitRotateRight(h4[0], 11, 32));

    // Fourth hash state
    h4[0] = bitXOR(h4[0], byte);
    h4[0] = modAdd(bitRotateLeft(h4[0], 23, 32), 0xca62c1d6);
    h4[0] = modAdd(h4[0], bitRotateRight(h1[0], 13, 32));
  }

  // Final mixing for cross-entropy between hash states
  for (let i = 0; i < rounds; i++) {
    h1[0] = modAdd(bitXOR(h1[0], h2[0]), bitRotateLeft(h3[0], 7, 32));
    h2[0] = modAdd(bitXOR(h2[0], h3[0]), bitRotateRight(h4[0], 11, 32));
    h3[0] = modAdd(bitXOR(h3[0], h4[0]), bitRotateLeft(h1[0], 5, 32));
    h4[0] = modAdd(bitXOR(h4[0], h1[0]), bitRotateRight(h2[0], 19, 32));
  }

  // Return the 256-bit hash as a concatenated hex string
  return [h1[0], h2[0], h3[0], h4[0]]
    .map(h => h.toString(16).padStart(8, '0'))
    .join('');
};

export interface Question {
  type: 'text' | 'picture' | 'video' | 'iframe';
  content: string;
  mediaUrl?: string;
}

export interface Puzzle {
  id: string;
  name: string;
  reward?: string;
  bannerImage?: string;
  questions: Question[];
  answers?: string[];
  isActive: boolean;
}

export const getPuzzles = async (): Promise<Puzzle[]> => {
  try {
    console.log('Fetching puzzles from blockchain...');
    
    const dryrunResult = await dryrun({
      process: PROCESS_IDS.PUZZLE_PROCESS,
      data: JSON.stringify({}),
      tags: [{ name: "Action", value: "Get-Puzzles" }]
    });

    console.log('Dryrun result:', dryrunResult);

    if (!dryrunResult?.Messages?.[0]?.Data) {
      console.log('No puzzles found in dryrun');
      return [];
    }

    const puzzleData = JSON.parse(dryrunResult.Messages[0].Data);
    console.log('Parsed puzzle data:', puzzleData);

    // Convert puzzle data to frontend format
    const puzzles = Object.entries(puzzleData).map(([id, puzzle]: [string, any]) => ({
      id: puzzle.id,
      name: puzzle.name,
      reward: puzzle.reward,
      questions: puzzle.questions,
      isActive: true
    }));

    console.log('Converted puzzles:', puzzles);
    return puzzles;
  } catch (error) {
    console.error('Error getting puzzles:', error);
    throw error;
  }
};

export const postPuzzle = async (
  name: string,
  questions: Question[],
  answers: string[],
  reward: string,
  bannerImage: string,
  wallet: any
): Promise<void> => {
  try {
    if (!wallet) {
      throw new Error('Wallet is required to post a puzzle');
    }

    if (!wallet.signDataItem) {
      throw new Error('Invalid wallet object - missing signDataItem method');
    }

    console.log('Posting puzzle:', { name, questions, answers, reward, bannerImage });

    // Ensure answers is an array and hash each answer
    const hashedAnswers = (answers || []).map(answer => secureHash(answer.toString()));
    console.log('Hashed answers:', hashedAnswers);

    const messageData = {
      process: PROCESS_IDS.PUZZLE_PROCESS,
      tags: [{ name: "Action", value: "Post-Puzzle" }],
      data: JSON.stringify({
        name,
        questions,
        hashedAnswers: hashedAnswers[0], // Send first answer for now
        reward,
        bannerImage
      }),
      signer: createDataItemSigner(wallet)
    };

    console.log('Sending message:', messageData);
    const response = await message(messageData);
    console.log('Message sent, response:', response);

    if (!response?.Messages?.[0]?.ID) {
      throw new Error('Failed to post puzzle: No response message ID');
    }

    const result = await waitForResult(response.Messages[0].ID);
    console.log('Message result:', result);

    if (result.Error) {
      throw new Error(`Failed to post puzzle: ${result.Error}`);
    }
  } catch (error) {
    console.error('Error posting puzzle:', error);
    throw error;
  }
};

export const solvePuzzle = async (
  puzzleId: string,
  answers: string[],
  wallet: any
): Promise<void> => {
  try {
    console.log('Solving puzzle:', { puzzleId, answers });

    const messageData = {
      process: PROCESS_IDS.PUZZLE_PROCESS,
      tags: [{ name: "Action", value: "Solve-Puzzle" }],
      data: JSON.stringify({
        puzzleId,
        answers: answers.map(answer => answer.toString())
      }),
      signer: createDataItemSigner(wallet)
    };

    console.log('Sending message:', messageData);
    const response = await message(messageData);
    console.log('Message sent, response:', response);

    if (!response?.Messages?.[0]?.ID) {
      throw new Error('Failed to solve puzzle: No response message ID');
    }

    const result = await waitForResult(response.Messages[0].ID);
    console.log('Message result:', result);

    if (result.Error) {
      throw new Error(`Failed to solve puzzle: ${result.Error}`);
    }

    if (!result.Messages?.[0]?.Data) {
      throw new Error('Failed to solve puzzle: No response data');
    }

    const data = JSON.parse(result.Messages[0].Data);
    if (data.error) {
      throw new Error(`Failed to solve puzzle: ${data.error}`);
    }
  } catch (error) {
    console.error('Error solving puzzle:', error);
    throw error;
  }
};

export const addAdmin = async (adminAddress: string, wallet: any): Promise<void> => {
  try {
    console.log('Adding admin:', adminAddress);

    const messageData = {
      process: PROCESS_IDS.PUZZLE_PROCESS,
      tags: [{ name: "Action", value: "Add-Admin" }],
      data: JSON.stringify({
        address: adminAddress
      }),
      signer: createDataItemSigner(wallet)
    };

    console.log('Sending message:', messageData);
    const response = await message(messageData);
    console.log('Message sent, response:', response);

    if (!response?.Messages?.[0]?.ID) {
      throw new Error('Failed to add admin: No response message ID');
    }

    const result = await waitForResult(response.Messages[0].ID);
    console.log('Message result:', result);

    if (result.Error) {
      throw new Error(`Failed to add admin: ${result.Error}`);
    }

    if (!result.Messages?.[0]?.Data) {
      throw new Error('Failed to add admin: No response data');
    }

    const data = JSON.parse(result.Messages[0].Data);
    if (data.error) {
      throw new Error(`Failed to add admin: ${data.error}`);
    }
  } catch (error) {
    console.error('Error adding admin:', error);
    throw error;
  }
};

export const getAdmins = async (): Promise<string[]> => {
  try {
    console.log('Getting admins');

    const dryrunResult = await dryrun({
      process: PROCESS_IDS.PUZZLE_PROCESS,
      data: JSON.stringify({}),
      tags: [{ name: "Action", value: "Get-Admins" }]
    });

    console.log('Dryrun result:', dryrunResult);

    if (!dryrunResult?.Messages?.[0]?.Data) {
      console.log('No admins found in dryrun');
      return [];
    }

    const admins = JSON.parse(dryrunResult.Messages[0].Data);
    console.log('Parsed admin list:', admins);

    return Array.isArray(admins) ? admins : [];
  } catch (error) {
    console.error('Error getting admins:', error);
    throw error;
  }
};

// Helper function to wait for result
const waitForResult = async (messageId: string): Promise<{
  Messages?: Array<{
    Data: string;
  }>;
  Error?: string;
}> => {
  return await result({
    message: messageId,
    process: PROCESS_IDS.PUZZLE_PROCESS
  });
};
