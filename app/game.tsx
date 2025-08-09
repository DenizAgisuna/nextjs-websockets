"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Shuffle } from "lucide-react"

interface GameCard {
  id: number
  face1: number
  face2: number
  currentFace: "face1" | "face2"
}

interface Player {
  name: string
  cards: GameCard[]
  isReady: boolean
  score: number
}

interface Guess {
  playerName: string
  targetPlayer: string
  cardIndex: number
  guess: number
  isCorrect?: boolean
}

type GamePhase = "setup" | "ready" | "guessing" | "results"

// Generate 54 unique double-faced cards
const generateDeck = (): GameCard[] => {
  const deck: GameCard[] = []
  let id = 1

  // Generate combinations to create 54 unique cards
  for (let i = 1; i <= 12; i++) {
    for (let j = i + 1; j <= 12; j++) {
      if (deck.length < 54) {
        deck.push({
          id: id++,
          face1: i,
          face2: j,
          currentFace: "face1",
        })
      }
    }
  }

  return deck.slice(0, 54) // Ensure exactly 54 cards
}

export default function CardGuessingGame() {
  const [deck, setDeck] = useState<GameCard[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayerName, setCurrentPlayerName] = useState("")
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [gamePhase, setGamePhase] = useState<GamePhase>("setup")
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)
  const [currentGuess, setCurrentGuess] = useState("")
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [targetPlayerIndex, setTargetPlayerIndex] = useState(0)
  const [targetCardIndex, setTargetCardIndex] = useState(0)

  useEffect(() => {
    setDeck(generateDeck())
  }, [])

  const shuffleDeck = (cards: GameCard[]) => {
    const shuffled = [...cards]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const addPlayer = () => {
    if (!currentPlayerName.trim() || deck.length < 3) return

    const shuffledDeck = shuffleDeck(deck)
    const playerCards = shuffledDeck.slice(0, 3).map((card) => ({
      ...card,
      currentFace: "face1" as const,
    }))

    const newPlayer: Player = {
      name: currentPlayerName.trim(),
      cards: playerCards,
      isReady: false,
      score: 0,
    }

    setPlayers([...players, newPlayer])
    setDeck(shuffledDeck.slice(3))
    setCurrentPlayerName("")
    if (players.length === 0) setGameStarted(true)
  }

  const flipCard = (playerName: string, cardId: number) => {
    setPlayers(
      players.map((player) => {
        if (player.name === playerName) {
          return {
            ...player,
            cards: player.cards.map((card) => {
              if (card.id === cardId) {
                return {
                  ...card,
                  currentFace: card.currentFace === "face1" ? "face2" : "face1",
                }
              }
              return card
            }),
          }
        }
        return player
      }),
    )
  }

  const moveCard = (playerName: string, cardId: number, direction: "left" | "right") => {
    setPlayers(
      players.map((player) => {
        if (player.name === playerName) {
          const cards = [...player.cards]
          const cardIndex = cards.findIndex((card) => card.id === cardId)

          if (direction === "left" && cardIndex > 0) {
            ;[cards[cardIndex], cards[cardIndex - 1]] = [cards[cardIndex - 1], cards[cardIndex]]
          } else if (direction === "right" && cardIndex < cards.length - 1) {
            ;[cards[cardIndex], cards[cardIndex + 1]] = [cards[cardIndex + 1], cards[cardIndex]]
          }

          return { ...player, cards }
        }
        return player
      }),
    )
  }

  const togglePlayerReady = (playerName: string) => {
    setPlayers(
      players.map((player) => {
        if (player.name === playerName) {
          return { ...player, isReady: !player.isReady }
        }
        return player
      }),
    )
  }

  const startGuessingPhase = () => {
    setGamePhase("guessing")
    setCurrentTurnIndex(0)
    setTargetPlayerIndex(1)
    setTargetCardIndex(0)
  }

  const submitGuess = () => {
    if (!currentGuess.trim()) return

    const currentPlayer = players[currentTurnIndex]
    const targetPlayer = players[targetPlayerIndex]
    const targetCard = targetPlayer.cards[targetCardIndex]
    const hiddenFace = targetCard.currentFace === "face1" ? targetCard.face2 : targetCard.face1
    const guessNumber = Number.parseInt(currentGuess)
    const isCorrect = guessNumber === hiddenFace

    const newGuess: Guess = {
      playerName: currentPlayer.name,
      targetPlayer: targetPlayer.name,
      cardIndex: targetCardIndex,
      guess: guessNumber,
      isCorrect,
    }

    setGuesses([...guesses, newGuess])

    // Update score if correct
    if (isCorrect) {
      setPlayers(
        players.map((player) => {
          if (player.name === currentPlayer.name) {
            return { ...player, score: player.score + 1 }
          }
          return player
        }),
      )
    }

    // Move to next turn
    nextTurn()
    setCurrentGuess("")
  }

  const nextTurn = () => {
    let nextPlayerIndex = currentTurnIndex
    let nextTargetIndex = targetPlayerIndex
    let nextCardIndex = targetCardIndex

    // Move to next card
    nextCardIndex++
    if (nextCardIndex >= 3) {
      nextCardIndex = 0
      // Move to next target player
      nextTargetIndex++
      if (nextTargetIndex >= players.length) {
        nextTargetIndex = 0
      }
      // Skip if target is same as current player
      if (nextTargetIndex === nextPlayerIndex) {
        nextTargetIndex++
        if (nextTargetIndex >= players.length) {
          nextTargetIndex = 0
        }
      }
      // If we've gone through all targets, move to next player
      if (nextTargetIndex === currentTurnIndex) {
        nextPlayerIndex++
        if (nextPlayerIndex >= players.length) {
          setGamePhase("results")
          return
        }
        nextTargetIndex = nextPlayerIndex === 0 ? 1 : 0
        nextCardIndex = 0
      }
    }

    setCurrentTurnIndex(nextPlayerIndex)
    setTargetPlayerIndex(nextTargetIndex)
    setTargetCardIndex(nextCardIndex)
  }

  const resetGame = () => {
    setDeck(generateDeck())
    setPlayers([])
    setGameStarted(false)
    setSelectedPlayer(null)
    setCurrentPlayerName("")
    setGamePhase("setup")
    setCurrentTurnIndex(0)
    setCurrentGuess("")
    setGuesses([])
    setTargetPlayerIndex(0)
    setTargetCardIndex(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Card Guessing Game</h1>
          <p className="text-gray-600">Draw 3 cards, arrange them, and guess the hidden faces!</p>
        </div>

        {/* Game Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Cards in Deck: {deck.length}
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Players: {players.length}
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Phase: {gamePhase.charAt(0).toUpperCase() + gamePhase.slice(1)}
          </Badge>
        </div>

        {/* Add Player Section */}
        {gamePhase === "setup" && deck.length >= 3 && (
          <Card className="mb-8 max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Join the Game</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="playerName">Player Name</Label>
                <Input
                  id="playerName"
                  value={currentPlayerName}
                  onChange={(e) => setCurrentPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  onKeyPress={(e) => e.key === "Enter" && addPlayer()}
                />
              </div>
              <Button onClick={addPlayer} className="w-full" disabled={!currentPlayerName.trim()}>
                Draw 3 Cards
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ready Check */}
        {gamePhase === "setup" && players.length > 1 && (
          <Card className="mb-8 max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Ready Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {players.map((player) => (
                  <div key={player.name} className="flex items-center justify-between">
                    <span>{player.name}</span>
                    <Badge variant={player.isReady ? "default" : "secondary"}>
                      {player.isReady ? "Ready" : "Not Ready"}
                    </Badge>
                  </div>
                ))}
              </div>
              {players.every((p) => p.isReady) && (
                <Button onClick={startGuessingPhase} className="w-full">
                  Start Guessing Phase!
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Guessing Phase */}
        {gamePhase === "guessing" && (
          <Card className="mb-8 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{players[currentTurnIndex]?.name}'s Turn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-lg mb-2">
                  Guess the hidden face of {players[targetPlayerIndex]?.name}'s card #{targetCardIndex + 1}
                </p>
                <div className="flex justify-center mb-4">
                  <Card className="w-32 h-48 border-2 border-blue-500">
                    <CardContent className="flex flex-col items-center justify-center h-full p-4">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {
                          players[targetPlayerIndex]?.cards[targetCardIndex]?.[
                            players[targetPlayerIndex]?.cards[targetCardIndex]?.currentFace
                          ]
                        }
                      </div>
                      <div className="text-xs text-gray-500">Visible Face</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  type="number"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  placeholder="Enter your guess"
                  onKeyPress={(e) => e.key === "Enter" && submitGuess()}
                />
                <Button onClick={submitGuess} disabled={!currentGuess.trim()}>
                  Confirm Guess
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Phase */}
        {gamePhase === "results" && (
          <Card className="mb-8 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Game Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Final Scores:</h3>
                  {players
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div key={player.name} className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          {index === 0 && "🏆"} {player.name}
                        </span>
                        <Badge variant={index === 0 ? "default" : "secondary"}>{player.score} points</Badge>
                      </div>
                    ))}
                </div>
                <Button onClick={resetGame} className="w-full">
                  Play Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players and their cards */}
        {(gamePhase === "setup" || gamePhase === "ready") && (
          <div className="space-y-6">
            {players.map((player) => (
              <Card key={player.name} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-semibold text-gray-800">{player.name}</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">Score: {player.score}</div>
                    {gamePhase === "setup" && (
                      <Button
                        onClick={() => togglePlayerReady(player.name)}
                        variant={player.isReady ? "default" : "outline"}
                        size="sm"
                      >
                        {player.isReady ? "Ready ✓" : "Ready?"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-center gap-4 flex-wrap">
                  {player.cards.map((card, index) => (
                    <div key={card.id} className="relative group">
                      <Card
                        className={`w-32 h-48 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 ${
                          player.isReady ? "border-green-300 bg-green-50" : "border-gray-300"
                        }`}
                        onClick={() => !player.isReady && flipCard(player.name, card.id)}
                      >
                        <CardContent className="flex flex-col items-center justify-center h-full p-4">
                          <div className="text-4xl font-bold text-blue-600 mb-2">{card[card.currentFace]}</div>
                          <div className="text-xs text-gray-500 text-center">
                            <div>Face 1: {card.face1}</div>
                            <div>Face 2: {card.face2}</div>
                          </div>
                          <div className="absolute top-2 right-2">
                            <RotateCcw className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="absolute bottom-2 left-2 text-xs text-gray-400">
                            {card.currentFace === "face1" ? "1" : "2"}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Card movement buttons */}
                      {!player.isReady && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveCard(player.name, card.id, "left")}
                              className="text-xs px-2 py-1"
                            >
                              ←
                            </Button>
                          )}
                          {index < player.cards.length - 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveCard(player.name, card.id, "right")}
                              className="text-xs px-2 py-1"
                            >
                              →
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                  {player.isReady
                    ? "Cards locked in - waiting for other players"
                    : "Click cards to flip • Hover and use arrows to reorder"}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reset Game */}
        {gameStarted && gamePhase !== "guessing" && (
          <div className="text-center mt-8">
            <Button onClick={resetGame} variant="outline" className="gap-2 bg-transparent">
              <Shuffle className="w-4 h-4" />
              Reset Game
            </Button>
          </div>
        )}

        {/* Game Rules */}
        <Card className="mt-8 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Setup Phase:</strong>
            </p>
            <p>• Each player draws 3 cards and arranges them as desired</p>
            <p>• Click cards to flip between faces, use arrows to reorder</p>
            <p>• Click "Ready" when satisfied with your arrangement</p>
            <p>
              <strong>Guessing Phase:</strong>
            </p>
            <p>• Players take turns guessing the hidden face of other players' cards</p>
            <p>• Enter your guess and confirm to score points for correct answers</p>
            <p>• The player with the most correct guesses wins!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
