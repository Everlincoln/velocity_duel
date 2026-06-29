import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  },
});

const rooms = new Map();

function createRoomState(roomCode) {
  return {
    roomCode,
    players: [],
  };
}

function normalizeNickname(nickname, playerNumber) {
  const trimmedNickname = typeof nickname === "string" ? nickname.trim() : "";

  if (!trimmedNickname) {
    return `Player ${playerNumber}`;
  }

  return trimmedNickname.slice(0, 24);
}

function nextPlayerNumber(players) {
  if (!players.find((player) => player.playerNumber === 1)) {
    return 1;
  }

  if (!players.find((player) => player.playerNumber === 2)) {
    return 2;
  }

  return null;
}

function serializeRoom(room) {
  return {
    roomCode: room.roomCode,
    players: room.players.map((player) => ({
      socketId: player.socketId,
      playerNumber: player.playerNumber,
      nickname: player.nickname,
      ready: player.ready,
      reactionTimeMs: player.reactionTimeMs,
    })),
  };
}

function emitRoomUpdate(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }

  io.to(roomCode).emit("roomUpdated", serializeRoom(room));
}

function removePlayerFromRoom(socket) {
  const { roomCode } = socket.data;
  if (!roomCode) {
    return;
  }

  const room = rooms.get(roomCode);
  if (!room) {
    socket.data.roomCode = null;
    socket.data.playerNumber = null;
    return;
  }

  room.players = room.players.filter((player) => player.socketId !== socket.id);
  socket.leave(roomCode);
  socket.data.roomCode = null;
  socket.data.playerNumber = null;

  if (room.players.length === 0) {
    rooms.delete(roomCode);
    return;
  }

  io.to(roomCode).emit("playerLeft", serializeRoom(room));
  emitRoomUpdate(roomCode);
}

function upsertPlayer(roomCode, socket, nickname) {
  let room = rooms.get(roomCode);
  if (!room) {
    room = createRoomState(roomCode);
    rooms.set(roomCode, room);
  }

  if (room.players.length >= 2) {
    return { error: "Room is full" };
  }

  const playerNumber = nextPlayerNumber(room.players);
  if (!playerNumber) {
    return { error: "Room is full" };
  }

  const player = {
    socketId: socket.id,
    playerNumber,
    nickname: normalizeNickname(nickname, playerNumber),
    ready: false,
    reactionTimeMs: null,
  };

  room.players.push(player);
  socket.join(roomCode);
  socket.data.roomCode = roomCode;
  socket.data.playerNumber = playerNumber;

  return { room, player };
}

io.on("connection", (socket) => {
  socket.data.roomCode = null;
  socket.data.playerNumber = null;

  socket.on("createRoom", ({ roomCode, nickname }, callback) => {
    if (!roomCode) {
      callback?.({ ok: false, error: "roomCode is required" });
      return;
    }

    removePlayerFromRoom(socket);

    const result = upsertPlayer(roomCode, socket, nickname);
    if (result.error) {
      callback?.({ ok: false, error: result.error });
      return;
    }

    emitRoomUpdate(roomCode);
    socket.emit("roomCreated", {
      room: serializeRoom(result.room),
      playerNumber: result.player.playerNumber,
    });
    callback?.({
      ok: true,
      room: serializeRoom(result.room),
      playerNumber: result.player.playerNumber,
    });
  });

  socket.on("joinRoom", ({ roomCode, nickname }, callback) => {
    if (!roomCode) {
      callback?.({ ok: false, error: "roomCode is required" });
      return;
    }

    removePlayerFromRoom(socket);

    const room = rooms.get(roomCode);
    if (!room) {
      callback?.({ ok: false, error: "Room not found" });
      return;
    }

    const result = upsertPlayer(roomCode, socket, nickname);
    if (result.error) {
      callback?.({ ok: false, error: result.error });
      return;
    }

    emitRoomUpdate(roomCode);
    io.to(roomCode).emit("playerJoined", {
      room: serializeRoom(result.room),
      playerNumber: result.player.playerNumber,
    });
    callback?.({
      ok: true,
      room: serializeRoom(result.room),
      playerNumber: result.player.playerNumber,
    });
  });

  socket.on("playerReady", ({ roomCode, ready = true }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) {
      callback?.({ ok: false, error: "Room not found" });
      return;
    }

    const player = room.players.find((entry) => entry.socketId === socket.id);
    if (!player) {
      callback?.({ ok: false, error: "Player not in room" });
      return;
    }

    player.ready = Boolean(ready);
    player.reactionTimeMs = null;
    emitRoomUpdate(roomCode);

    if (room.players.length === 2 && room.players.every((entry) => entry.ready)) {
      io.to(roomCode).emit("bothPlayersReady", serializeRoom(room));
    }

    callback?.({ ok: true, room: serializeRoom(room) });
  });

  socket.on("leaveRoom", ({ roomCode } = {}, callback) => {
    const activeRoomCode = roomCode || socket.data.roomCode;
    if (!activeRoomCode) {
      callback?.({ ok: true });
      return;
    }

    removePlayerFromRoom(socket);
    callback?.({ ok: true });
  });

  socket.on("playerFired", ({ roomCode, reactionTimeMs }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) {
      callback?.({ ok: false, error: "Room not found" });
      return;
    }

    const player = room.players.find((entry) => entry.socketId === socket.id);
    if (!player) {
      callback?.({ ok: false, error: "Player not in room" });
      return;
    }

    player.reactionTimeMs = typeof reactionTimeMs === "number" ? reactionTimeMs : null;
    io.to(roomCode).emit("playerFired", {
      playerNumber: player.playerNumber,
      reactionTimeMs: player.reactionTimeMs,
      room: serializeRoom(room),
    });

    const firedPlayers = room.players.filter((entry) => typeof entry.reactionTimeMs === "number");
    if (firedPlayers.length === 2) {
      const sortedPlayers = [...firedPlayers].sort((a, b) => a.reactionTimeMs - b.reactionTimeMs);
      const [winner, loser] = sortedPlayers;
      io.to(roomCode).emit("gameResult", {
        winnerPlayerNumber: winner.playerNumber,
        winnerReactionTimeMs: winner.reactionTimeMs,
        loserPlayerNumber: loser.playerNumber,
        loserReactionTimeMs: loser.reactionTimeMs,
        players: serializeRoom(room).players,
      });
    }

    callback?.({ ok: true, room: serializeRoom(room) });
  });

  socket.on("disconnect", () => {
    removePlayerFromRoom(socket);
  });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log(`Velocity Duel server listening on port ${port}`);
});
