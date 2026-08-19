const { Server } = require("socket.io");

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Allow all origins (Vercel + Local)
            methods: ["GET", "POST"]
        }
    });

    const waitingQueue = {
        'pong': [],
        'arena': []
    };

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        socket.on("join_matchmaking", (gameType) => {
            if (!waitingQueue[gameType]) return;

            // Remove if already in queue to avoid duplicates
            waitingQueue[gameType] = waitingQueue[gameType].filter(s => s.id !== socket.id);

            waitingQueue[gameType].push(socket);
            console.log(`User ${socket.id} joined ${gameType} queue`);

            // If 2 people are in queue, pair them!
            if (waitingQueue[gameType].length >= 2) {
                const p1 = waitingQueue[gameType].shift();
                const p2 = waitingQueue[gameType].shift();

                const matchId = `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                p1.join(matchId);
                p2.join(matchId);

                p1.emit('match_found', { matchId, opponentRole: 'p2' });
                p2.emit('match_found', { matchId, opponentRole: 'p1' });

                console.log(`Match Created! ${matchId} for ${gameType}`);
            }
        });

        socket.on("rejoin_match", (data) => {
            if (data?.matchId) {
                socket.join(data.matchId);
                console.log(`User ${socket.id} joined room ${data.matchId}`);
            }
        });

        socket.on("game_event", (data) => {
            if (data?.matchId) {
                socket.to(data.matchId).emit('game_event', data);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
            // Cleanup queue
            ['pong', 'arena'].forEach(type => {
                waitingQueue[type] = waitingQueue[type].filter(s => s.id !== socket.id);
            });
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIo };
