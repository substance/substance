import { Container } from 'substance'

export default class Body extends Container {}

Body.schema = {
  type: 'body',
  nodes: { type: ['array', 'id'], default: [], owned: true, defaultTextType: 'paragraph' }
}
