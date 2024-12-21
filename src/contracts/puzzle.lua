local json = require("json")

-- GLOBAL VARIABLES
Puzzles = Puzzles or {}
Admins = Admins or {}

-- Constants
local HASH_SALT = "saltyDumDumz"

-- Initialize admins
if not next(Admins) then
    -- Add contract deployer
    Admins = {
        ["dUqCbSIdkxxSuIhq8ohcQMwI-oq-CPX1Ey6qUnam0jc"] = true,
        [ao.id] = true
    }
    print("Initialized admins:", json.encode(Admins))
end

local function bitXOR(a, b)
    local p, c = 1, 0
    while a > 0 or b > 0 do
        local ra, rb = a % 2, b % 2
        if ra ~= rb then c = c + p end
        a, b, p = (a - ra) // 2, (b - rb) // 2, p * 2
    end
    return c
end

local function bitRotateLeft(n, b, bits)
    local mask = (2 ^ bits) - 1
    return ((n << b) & mask) | (n >> (bits - b))
end

local function bitRotateRight(n, b, bits)
    local mask = (2 ^ bits) - 1
    return ((n >> b) & mask) | (n << (bits - b)) & mask
end

local function modAdd(a, b)
    return (a + b) % (2 ^ 32)
end

local function secureHash(input, salt)
    salt = salt or HASH_SALT
    local h1, h2, h3, h4 = 0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a
    local rounds = 64

    input = input .. salt

    for i = 1, #input do
        local byte = string.byte(input, i)
        
        -- First hash state
        h1 = bitXOR(h1, byte)
        h1 = modAdd(bitRotateLeft(h1, 13, 32), 0x5a827999)
        h1 = modAdd(h1, bitRotateRight(h2, 7, 32))

        -- Second hash state
        h2 = bitXOR(h2, byte)
        h2 = modAdd(bitRotateLeft(h2, 17, 32), 0x6ed9eba1)
        h2 = modAdd(h2, bitRotateRight(h3, 5, 32))

        -- Third hash state
        h3 = bitXOR(h3, byte)
        h3 = modAdd(bitRotateLeft(h3, 19, 32), 0x8f1bbcdc)
        h3 = modAdd(h3, bitRotateRight(h4, 11, 32))

        -- Fourth hash state
        h4 = bitXOR(h4, byte)
        h4 = modAdd(bitRotateLeft(h4, 23, 32), 0xca62c1d6)
        h4 = modAdd(h4, bitRotateRight(h1, 13, 32))
    end

    -- Final mixing for cross-entropy between hash states
    for _ = 1, rounds do
        h1 = modAdd(bitXOR(h1, h2), bitRotateLeft(h3, 7, 32))
        h2 = modAdd(bitXOR(h2, h3), bitRotateRight(h4, 11, 32))
        h3 = modAdd(bitXOR(h3, h4), bitRotateLeft(h1, 5, 32))
        h4 = modAdd(bitXOR(h4, h1), bitRotateRight(h2, 19, 32))
    end

    -- Return the 256-bit hash as a concatenated hex string
    return string.format("%08x%08x%08x%08x", h1, h2, h3, h4)
end

-- Helper function to check if a wallet is an admin
function isAdmin(wallet)
    if not wallet then return false end
    -- Print for debugging
    print("Checking admin status for: " .. wallet)
    print("Current admins: " .. json.encode(Admins))
    return Admins[wallet] == true
end

-- Get all admins
Handlers.add("getAdmins", Handlers.utils.hasMatchingTag("Action", "Get-Admins"), function(msg)
    print("Get admins request from: " .. msg.From)
    
    -- Convert admins table to array for easier frontend handling
    local adminList = {}
    for admin in pairs(Admins) do
        print("Found admin:", admin)
        adminList[#adminList + 1] = admin
    end
    
    print("Admin list before sending:", json.encode(adminList))
    local response = json.encode(adminList)
    print("Encoded response:", response)
    
    ao.send({
        Target = msg.From,
        Data = response
    })
end)

-- Add a new admin (anyone can add admins)
Handlers.add("addAdmin", Handlers.utils.hasMatchingTag("Action", "Add-Admin"), function(msg)
    print("Add admin request from: " .. msg.From)
    print("Message data: " .. msg.Data)
    
    local success, data = pcall(json.decode, msg.Data)
    if not success then
        print("Failed to decode JSON:", data)
        return ao.send({
            Target = msg.From,
            Data = json.encode({
                error = "Invalid data format"
            })
        })
    end
    
    if not data.address then
        print("Missing address field")
        return ao.send({
            Target = msg.From,
            Data = json.encode({
                error = "Missing address field"
            })
        })
    end
    
    -- Add the new admin
    Admins[data.address] = true
    
    -- Get current admin list for logging
    local currentAdmins = {}
    for admin in pairs(Admins) do
        currentAdmins[#currentAdmins + 1] = admin
    end
    
    print("Added new admin:", data.address)
    print("Current admins:", json.encode(currentAdmins))
    
    ao.send({
        Target = msg.From,
        Data = json.encode({
            success = true,
            message = "Admin added successfully"
        })
    })
end)

-- Post a new puzzle
Handlers.add("postPuzzle", Handlers.utils.hasMatchingTag("Action", "Post-Puzzle"), function(msg)
    print("Create puzzle request from: " .. msg.From)
    print("Message data: " .. msg.Data)
    
    local success, data = pcall(json.decode, msg.Data)
    if not success then
        print("Failed to decode JSON:", data)
        return ao.send({
            Target = msg.From,
            Data = json.encode({
                error = "Invalid JSON format"
            })
        })
    end
    
    print("Decoded data:", json.encode(data))
    
    -- Validate required fields
    if not data.name then
        print("Missing name field")
        return ao.send({
            Target = msg.From,
            Data = json.encode({
                error = "Missing name field"
            })
        })
    end
    
    if not data.questions or type(data.questions) ~= "table" or #data.questions == 0 then
        print("Invalid questions field:", data.questions)
        return ao.send({
            Target = msg.From,
            Data = json.encode({
                error = "Invalid questions field"
            })
        })
    end
    
    if not data.hashedAnswers then
        print("Missing hashedAnswers field")
        return ao.send({
            Target = msg.From,
            Data = json.encode({
                error = "Missing hashedAnswers field"
            })
        })
    end
    
    -- Generate a unique ID for the puzzle
    local puzzleId = secureHash(data.name .. msg.From .. msg.Timestamp)
    
    -- Store the puzzle
    Puzzles[puzzleId] = {
        id = puzzleId,
        name = data.name,
        reward = data.reward,
        bannerImage = data.bannerImage,
        questions = data.questions,
        answers = { data.hashedAnswers }, -- Store as array for multiple answers
        creator = msg.From,
        timestamp = msg.Timestamp,
        solvedBy = {}
    }
    
    print("Created puzzle:", json.encode(Puzzles[puzzleId]))
    
    ao.send({
        Target = msg.From,
        Data = json.encode({
            success = true,
            puzzleId = puzzleId
        })
    })
end)

-- Get all puzzles
Handlers.add("getPuzzles", Handlers.utils.hasMatchingTag("Action", "Get-Puzzles"), function(msg)
    print("Get puzzles request from: " .. msg.From)
    
    -- Convert puzzles table to array for easier frontend handling
    local puzzleArray = {}
    for id, puzzle in pairs(Puzzles) do
        -- Don't send the answers back to frontend
        local puzzleWithoutAnswers = {
            id = puzzle.id,
            name = puzzle.name,
            reward = puzzle.reward,
            bannerImage = puzzle.bannerImage,
            questions = puzzle.questions,
            creator = puzzle.creator,
            timestamp = puzzle.timestamp,
            solvedBy = puzzle.solvedBy
        }
        table.insert(puzzleArray, puzzleWithoutAnswers)
    end
    
    print("Sending puzzles:", json.encode(puzzleArray))
    
    ao.send({
        Target = msg.From,
        Data = json.encode(puzzleArray)
    })
end)

-- Solve a puzzle
Handlers.add("solvePuzzle", Handlers.utils.hasMatchingTag("Action", "Solve-Puzzle"), function(msg)
    print("Solve puzzle request from: " .. msg.From)
    print("Message data: " .. msg.Data)
    
    local data = json.decode(msg.Data)
    local puzzleId = data.puzzleId
    local submittedAnswers = data.answers
    
    if not puzzleId or not submittedAnswers then
        return ao.send({
            Target = msg.From,
            Data = json.encode({
                error = "Missing puzzleId or answers"
            })
        })
    end
    
    local puzzle = Puzzles[puzzleId]
    if not puzzle then
        return ao.send({
            Target = msg.From,
            Data = json.encode({
                error = "Puzzle not found"
            })
        })
    end
    
    -- Hash each submitted answer exactly like the example
    local correct = true
    for i, answer in ipairs(submittedAnswers) do
        local submittedHash = secureHash(tostring(answer))
        local expectedHash = puzzle.answers[i]
        print("Submitted hash:", submittedHash)
        print("Expected hash:", expectedHash)
        
        if submittedHash ~= expectedHash then
            correct = false
            break
        end
    end
    
    if correct then
        ao.send({
            Target = msg.From,
            Data = json.encode({
                success = true,
                message = "Puzzle solved correctly!"
            })
        })
    else
        ao.send({
            Target = msg.From,
            Data = json.encode({
                error = "Incorrect solution"
            })
        })
    end
end)

-- Check if a user has solved a puzzle
Handlers.add("checkSolved", Handlers.utils.hasMatchingTag("Action", "Check-Solved"), function(msg)
    local data = json.decode(msg.Data)
    local puzzleId = data.puzzleId
    local hasSolved = false
    
    if puzzleId and Puzzles[puzzleId] then
        hasSolved = Puzzles[puzzleId].solvedBy[msg.From] or false
    end
    
    ao.send({
        Target = msg.From,
        Data = json.encode({
            solved = hasSolved
        })
    })
end)
