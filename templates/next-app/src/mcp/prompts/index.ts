import { allPromptDefinitions } from './prompts'
import { generationPromptDefinitions } from './generation-protocol'

export const allPrompts = [...allPromptDefinitions, ...generationPromptDefinitions]
