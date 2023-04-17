import { unwrapJSON, unwrapURI } from '../../utils'
import { isValidInteraction } from '../shared/helpers'

import { Attribute } from '../../common'
import { Interaction } from './enums'
import { CreatedBase, CreatedCollection, CreatedNFT, EquippableOption, IAttribute, InteractionValue, IProperties, IRoyaltyAttribute, RoyaltyInfo } from './types'
export const toInteraction = (interaction: string): Interaction => {
  isValidInteraction(interaction)
  return interaction as Interaction
}

export const resolveValue = (interaction: Interaction, id: string, restValues: string[]): InteractionValue => {
  switch (interaction) {
    case Interaction.ACCEPT:
      return {
        id,
        entity_type: restValues[0] as 'RES' | 'NFT',
        entity_id: restValues[1]
      }
    case Interaction.BASE:
      return {
        value: unwrapJSON(id) as CreatedBase
      }
    case Interaction.EQUIP:
      return {
        id,
        baseslot: restValues[0]
      }
    case Interaction.EQUIPPABLE:
      return {
        id,
        slot: restValues[0],
        value: restValues[1]
      }
    case Interaction.LOCK:
      return {
        id
      }
    case Interaction.RESADD:
      return {
        id,
        value: unwrapJSON(restValues[0]),
        replace: restValues[1]
      }
    case Interaction.SETPRIORITY:
      return {
        id,
        value: unwrapURI(restValues[0])
      }
    case Interaction.SETPROPERTY:
      return {
        id,
        name: unwrapURI(restValues[0]),
        value: unwrapURI(restValues[1])
      }
    case Interaction.THEMEADD:
      return {
        base_id: id,
        name: restValues[0],
        value: unwrapJSON(restValues[1]) as Record<string, string>
      }
    case Interaction.BUY:
      return {
        id,
        recipient: restValues[0]
      }
    case Interaction.EMOTE:
      return {
        namespace: id,
        id: restValues[0],
        value: restValues[1]
      }
    case Interaction.SEND:
      return {
        id,
        recipient: restValues[0]
      }
    case Interaction.LIST:
      return {
        id,
        price: restValues[0]
      }
    case Interaction.CHANGEISSUER:
      return {
        id,
        value: restValues[0]
      }
    case Interaction.CREATE:
      return {
        value: unwrapJSON(id) as CreatedCollection
      }
    case Interaction.MINT:
      return {
        value: unwrapJSON(id) as CreatedNFT,
        recipient: restValues[0]
      }
    case Interaction.BURN:
      return {
        id
      }
  }
}

export const resolveRoyalty = (properties?: IProperties): RoyaltyInfo | undefined => {
  if (!properties) {
    return undefined
  }
  const royaltyInfo: IRoyaltyAttribute = properties.royaltyInfo as IRoyaltyAttribute

  if (!royaltyInfo) {
    return undefined
  }

  const { value } = royaltyInfo

  if (!value) {
    return undefined
  }

  return {
    receiver: value.receiver,
    percent: Number(value.royaltyPercentFloat)
  }
}

export const makeRoyalty = (royalty?: RoyaltyInfo): IRoyaltyAttribute | undefined => {
  if (!royalty || !royalty.receiver || !royalty.percent) {
    return undefined
  }

  if (royalty.percent < 0 || royalty.percent > 100) {
    // eslint-disable-next-line no-console
    console.warn('[MINIMARK] Royalty percent should be between 0 and 100')
    return undefined
  }

  return {
    type: 'royalty',
    value: {
      receiver: royalty.receiver,
      royaltyPercentFloat: royalty.percent
    }
  }
}

export const resolveEquippable = (value: string): EquippableOption => {
  const operation = value[0] as '+' | '-' | '*'
  const offset = Number(['+', '-', '*'].includes(operation))
  const collections = value.slice(offset).split(',').filter(Boolean)

  if (operation === '*' || (!offset && collections.length)) {
    return {
      operation: '*',
      collections: !offset ? collections : ['*']
    }
  }

  return {
    operation,
    collections
  }
}

export const makeProperty = (value: number | string, type?: string): IAttribute => {
  return {
    type: type || typeof value === 'number' ? 'int' : 'string',
    value
  }
}

export const convertAttributesToProperties = (attributes: Attribute[]): IProperties => {
  const properties: IProperties = {}

  attributes.filter(attr => attr.trait_type).forEach((attribute) => {
    properties[attribute.trait_type as string] = makeProperty(attribute.value)
  })

  return properties
}

export const mergeProperties = (properties: IProperties, key: string, value: IAttribute | IRoyaltyAttribute): IProperties => {
  return {
    ...properties,
    [key]: value
  }
}
