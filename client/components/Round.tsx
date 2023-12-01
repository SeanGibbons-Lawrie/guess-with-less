import { FormEvent, useState } from 'react'
import * as models from '../../models/prompts.js'
import * as api from '../apis/prompts.js'
import { useQuery } from '@tanstack/react-query'
import { GuessForm } from './GuessForm.js'
import { Stage } from './Stage.js'
import { GameEnding } from './GameEnding.js'
interface Categories {
  [category: string]: models.Prompt[]
}

function Round() {
  const [category, setCategory] = useState<string | null>(null)
  const [gameState, setGameState] = useState({
    currentPrompt: undefined,
    prompts: [],
    currentStage: undefined,
    guessInfo: [],
  } as models.GameState)

  const {
    data: prompts,
    isError,
    isLoading,
  }: {
    data: models.Prompt[] | undefined
    isError: boolean
    isLoading: boolean
  } = useQuery({
    queryKey: ['prompts'],
    queryFn: api.getAllPrompts,
  })

  if (isError || isLoading || !prompts) {
    return <p>Stuff</p>
  }

  function checkGuessInfo() {
    //If guessinfo doesn't exist and no currentPrompt creates first prompt
    if (!gameState.guessInfo?.length && !gameState.currentPrompt) {
      nextPrompt()
      console.log('39')
      return
    } else if (gameState.currentPrompt && gameState.guessInfo?.length) {
      //if lastGuess wasCorrect next Prompt, if false Next Stage
      const lastGuessIndex = gameState.guessInfo.length - 1
      const lastGuess = gameState.guessInfo[lastGuessIndex]
      if (
        lastGuess.stage === gameState.currentStage &&
        gameState.currentPrompt.name == lastGuess.prompt
      ) {
        if (lastGuess.wasCorrect) {
          nextPrompt()
          console.log('47')
        } else {
          nextStage()
        }
      }
    }
  }

  function nextPrompt() {
    const promptLength = gameState.prompts.length
    if (promptLength) {
      console.log('before pop', JSON.stringify(gameState.prompts))
      //choose random prompt. update current Prompt and remove current promp from gameState.prompts
      const prompts = gameState.prompts
      const currentPrompt = prompts.pop()
      console.log('after pop', JSON.stringify(prompts))
      // console.log(currentPrompt)
      setGameState({
        ...gameState,
        currentPrompt,
        prompts,
        currentStage: 1,
      })
      //If there are no prompts left, sets currentPrompt to undefined
    } else {
      console.log('66')
      setGameState({
        ...gameState,
        currentPrompt: undefined,
      })
    }
  }

  //If there aren't any stages left go to next Prompt
  function nextStage() {
    const maxStages = gameState.currentPrompt?.images.length
    if (maxStages === gameState.currentStage) {
      nextPrompt()
      console.log('82')
    } else {
      setGameState({
        ...gameState,
        currentStage: (gameState.currentStage || 0) + 1,
      })
    }
  }

  if (gameState.prompts?.length || gameState.currentPrompt) {
    checkGuessInfo()
  } else if (gameState.guessInfo?.length && !gameState.currentPrompt) {
    return <GameEnding gameState={gameState} setGameState={setGameState} />
  }

  const categories: Categories = {}

  prompts.forEach((prompt) => {
    if (categories[prompt.category]) {
      categories[prompt.category].push(prompt)
    } else {
      categories[prompt.category] = [prompt]
    }
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const categoryPrompts = category ? categories[category] : prompts
    setGameState({
      ...gameState,
      prompts: categoryPrompts as models.Prompt[],
      currentStage: 1,
    })
  }

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setCategory(event.target.value)
  }

  return (
    <>
      {!gameState.currentStage ? (
        <form onSubmit={handleSubmit}>
          <select onChange={handleChange}>
            <option value="">All</option>

            {Object.keys(categories).map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <button>Start</button>
        </form>
      ) : (
        <>
          <Stage gameState={gameState} setGameState={setGameState} />
          <GuessForm gameState={gameState} setGameState={setGameState} />
        </>
      )}
    </>
  )
}

export default Round
