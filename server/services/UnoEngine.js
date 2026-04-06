/**
 * UnoEngine - Server-authoritative UNO game logic
 * Supports 2-4 players. Extracted and adapted from WaddleBet's MatchService.
 */

const UNO_COLORS = ['Red', 'Blue', 'Green', 'Yellow'];
const UNO_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', '+2'];
const UNO_INITIAL_CARDS = 7;
const TURN_TIME_LIMIT_MS = 30_000;

function createDeck() {
  const deck = [];
  let uid = 0;
  UNO_COLORS.forEach(color => {
    UNO_VALUES.forEach(value => {
      const count = value === '0' ? 1 : 2;
      for (let i = 0; i < count; i++) {
        deck.push({ c: color, v: value, uid: uid++ });
      }
    });
  });
  for (let i = 0; i < 4; i++) {
    deck.push({ c: 'Black', v: 'Wild', uid: uid++ });
    deck.push({ c: 'Black', v: 'Wild +4', uid: uid++ });
  }
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default class UnoEngine {
  constructor(playerIds) {
    this.playerIds = [...playerIds];
    this.playerCount = playerIds.length;
    this.eliminated = new Set();
    this.state = this._createInitialState();
    this.status = 'playing';
    this.winnerId = null;
    this.startedAt = Date.now();
  }

  _createInitialState() {
    const deck = shuffle(createDeck());
    const hands = {};
    this.playerIds.forEach(id => { hands[id] = []; });

    for (let i = 0; i < UNO_INITIAL_CARDS; i++) {
      this.playerIds.forEach(id => { hands[id].push(deck.pop()); });
    }

    let startCard = deck.pop();
    while (startCard.c === 'Black') {
      deck.unshift(startCard);
      startCard = deck.pop();
    }

    return {
      deck,
      discard: [startCard],
      hands,
      turnIndex: 0,
      direction: 1,
      phase: 'playing',
      activeColor: startCard.c,
      activeValue: startCard.v,
      winner: null,
      turnStartedAt: Date.now(),
      skipNextTurn: false,
      lastAction: null,
      calledUno: Object.fromEntries(this.playerIds.map(id => [id, false])),
      waitingForColor: null,
      pendingWildEffect: null,
    };
  }

  get activePlayers() {
    return this.playerIds.filter(id => !this.eliminated.has(id));
  }

  get currentPlayerId() {
    return this.playerIds[this.state.turnIndex];
  }

  _isEliminated(playerId) {
    return this.eliminated.has(playerId);
  }

  removePlayer(playerId) {
    if (this.status !== 'playing') return { alreadyComplete: true };
    if (!this.playerIds.includes(playerId)) return { error: 'NOT_IN_MATCH' };
    if (this._isEliminated(playerId)) return { error: 'ALREADY_ELIMINATED' };

    this.eliminated.add(playerId);
    delete this.state.hands[playerId];

    const remaining = this.activePlayers;
    if (remaining.length <= 1) {
      this.state.phase = 'complete';
      this.state.winner = remaining[0] || null;
      this.status = 'complete';
      this.winnerId = remaining[0] || null;
      return { gameComplete: true };
    }

    if (this.currentPlayerId === playerId) {
      if (this.state.phase === 'selectColor') {
        this.state.activeColor = UNO_COLORS[Math.floor(Math.random() * UNO_COLORS.length)];
        this.state.phase = 'playing';
        this.state.pendingWildEffect = null;
        this.state.waitingForColor = null;
      }
      this._advanceToNextActive();
    }

    return { gameContinues: true };
  }

  play(playerId, action) {
    const s = this.state;
    if (s.phase === 'complete') return { error: 'GAME_OVER' };
    if (!this.playerIds.includes(playerId)) return { error: 'NOT_IN_MATCH' };
    if (this._isEliminated(playerId)) return { error: 'ELIMINATED' };

    if (action.action === 'callUno') {
      s.calledUno[playerId] = true;
      return { success: true };
    }

    if (action.action === 'selectColor') {
      if (s.phase !== 'selectColor') return { error: 'NOT_SELECTING_COLOR' };
      if (s.waitingForColor !== playerId) return { error: 'NOT_YOUR_TURN' };
      if (!UNO_COLORS.includes(action.color)) return { error: 'INVALID_COLOR' };

      s.activeColor = action.color;
      s.phase = 'playing';
      if (s.pendingWildEffect) {
        this._applyEffect(s.pendingWildEffect, playerId);
        s.pendingWildEffect = null;
      }
      this._nextTurn();
      s.waitingForColor = null;
      return { success: true };
    }

    if (this.currentPlayerId !== playerId) return { error: 'NOT_YOUR_TURN' };
    if (s.phase === 'selectColor') return { error: 'MUST_SELECT_COLOR' };

    const hand = s.hands[playerId];

    if (action.action === 'draw') {
      this._drawCards(playerId, 1);
      s.lastAction = { type: 'draw', player: playerId };
      s.calledUno[playerId] = false;
      this._nextTurn();
      return { success: true };
    }

    if (action.action === 'play') {
      const idx = hand.findIndex(c => c.uid === action.cardUid);
      if (idx === -1) return { error: 'CARD_NOT_IN_HAND' };

      const card = hand[idx];
      if (!this._isValidPlay(card)) return { error: 'INVALID_PLAY' };

      hand.splice(idx, 1);
      s.discard.push(card);
      s.activeValue = card.v;
      if (card.c !== 'Black') s.activeColor = card.c;
      s.lastAction = { type: 'play', player: playerId, card };

      if (hand.length === 0) {
        s.phase = 'complete';
        s.winner = playerId;
        this.status = 'complete';
        this.winnerId = playerId;
        return { success: true, gameComplete: true };
      }

      if (hand.length !== 1) s.calledUno[playerId] = false;

      if (card.c === 'Black') {
        s.phase = 'selectColor';
        s.waitingForColor = playerId;
        s.pendingWildEffect = card.v;
        return { success: true, needColorSelection: true };
      }

      this._applyEffect(card.v, playerId);
      this._nextTurn();
      return { success: true };
    }

    return { error: 'INVALID_ACTION' };
  }

  _isValidPlay(card) {
    if (card.c === 'Black') return true;
    if (card.c === this.state.activeColor) return true;
    if (card.v === this.state.activeValue) return true;
    return false;
  }

  _drawCards(playerId, count) {
    const s = this.state;
    for (let i = 0; i < count; i++) {
      if (s.deck.length === 0) this._reshuffleDeck();
      if (s.deck.length > 0) s.hands[playerId].push(s.deck.pop());
    }
  }

  _reshuffleDeck() {
    const s = this.state;
    const topCard = s.discard.pop();
    s.deck = shuffle([...s.discard]);
    s.discard = [topCard];
  }

  _applyEffect(value, playerId) {
    const s = this.state;
    const nextId = this._peekNextActivePlayer();

    switch (value) {
      case 'Skip':
        s.skipNextTurn = true;
        break;
      case 'Reverse':
        if (this.activePlayers.length === 2) {
          s.skipNextTurn = true;
        } else {
          s.direction *= -1;
        }
        break;
      case '+2':
        if (nextId) this._drawCards(nextId, 2);
        s.skipNextTurn = true;
        break;
      case 'Wild +4':
        if (nextId) this._drawCards(nextId, 4);
        s.skipNextTurn = true;
        break;
    }
  }

  _peekNextActivePlayer() {
    const s = this.state;
    let idx = s.turnIndex;
    for (let i = 0; i < this.playerCount; i++) {
      idx = (idx + s.direction + this.playerCount) % this.playerCount;
      if (!this.eliminated.has(this.playerIds[idx])) return this.playerIds[idx];
    }
    return null;
  }

  _nextTurn() {
    const s = this.state;
    if (s.skipNextTurn) {
      this._advanceBy(2);
      s.skipNextTurn = false;
    } else {
      this._advanceBy(1);
    }
    s.turnStartedAt = Date.now();
  }

  _advanceBy(steps) {
    const s = this.state;
    let idx = s.turnIndex;
    let moved = 0;
    let loops = 0;
    while (moved < steps) {
      idx = (idx + s.direction + this.playerCount) % this.playerCount;
      if (!this.eliminated.has(this.playerIds[idx])) moved++;
      if (++loops > this.playerCount * 2) break;
    }
    s.turnIndex = idx;
  }

  _advanceToNextActive() {
    const s = this.state;
    let idx = s.turnIndex;
    for (let i = 0; i < this.playerCount; i++) {
      if (!this.eliminated.has(this.playerIds[idx])) {
        s.turnIndex = idx;
        s.turnStartedAt = Date.now();
        return;
      }
      idx = (idx + s.direction + this.playerCount) % this.playerCount;
    }
  }

  handleTimeout() {
    const s = this.state;
    if (s.phase === 'complete') return;
    if (this._isEliminated(this.currentPlayerId)) {
      this._advanceToNextActive();
      return;
    }

    if (s.phase === 'selectColor') {
      s.activeColor = UNO_COLORS[Math.floor(Math.random() * UNO_COLORS.length)];
      s.phase = 'playing';
      if (s.pendingWildEffect) {
        this._applyEffect(s.pendingWildEffect, s.waitingForColor);
        s.pendingWildEffect = null;
      }
      this._nextTurn();
      s.waitingForColor = null;
    } else {
      this._drawCards(this.currentPlayerId, 1);
      s.lastAction = { type: 'draw', player: this.currentPlayerId };
      this._nextTurn();
    }
  }

  getStateForPlayer(playerId) {
    const s = this.state;
    const topDiscard = s.discard[s.discard.length - 1];
    const elapsed = Date.now() - s.turnStartedAt;
    const timeRemaining = Math.max(0, TURN_TIME_LIMIT_MS - elapsed);

    const opponents = {};
    this.playerIds.forEach(id => {
      if (id !== playerId && !this.eliminated.has(id)) {
        opponents[id] = s.hands[id]?.length || 0;
      }
    });

    return {
      myHand: s.hands[playerId] ? [...s.hands[playerId]] : [],
      opponents,
      topCard: topDiscard,
      deckCount: s.deck.length,
      activeColor: s.activeColor,
      activeValue: s.activeValue,
      currentTurn: this.currentPlayerId,
      phase: s.phase,
      isMyTurn: this.currentPlayerId === playerId && !this.eliminated.has(playerId),
      waitingForColor: s.waitingForColor === playerId,
      lastAction: s.lastAction,
      myUnoCall: !!s.calledUno[playerId],
      direction: s.direction,
      winner: s.winner,
      gameComplete: s.phase === 'complete',
      timeRemaining,
      playerOrder: this.activePlayers,
      eliminated: [...this.eliminated],
    };
  }

  getStateForSpectator() {
    const s = this.state;
    const topDiscard = s.discard[s.discard.length - 1];
    const elapsed = Date.now() - s.turnStartedAt;
    const timeRemaining = Math.max(0, TURN_TIME_LIMIT_MS - elapsed);

    const hands = {};
    this.playerIds.forEach(id => {
      if (!this.eliminated.has(id)) {
        hands[id] = s.hands[id]?.length || 0;
      }
    });

    return {
      myHand: [],
      opponents: hands,
      topCard: topDiscard,
      deckCount: s.deck.length,
      activeColor: s.activeColor,
      activeValue: s.activeValue,
      currentTurn: this.currentPlayerId,
      phase: s.phase,
      isMyTurn: false,
      waitingForColor: false,
      lastAction: s.lastAction,
      myUnoCall: false,
      direction: s.direction,
      winner: s.winner,
      gameComplete: s.phase === 'complete',
      timeRemaining,
      playerOrder: this.activePlayers,
      eliminated: [...this.eliminated],
    };
  }

  get turnTimeLimitMs() {
    return TURN_TIME_LIMIT_MS;
  }

  get turnStartedAt() {
    return this.state.turnStartedAt;
  }
}
