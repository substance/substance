import ChangeRecorder from './ChangeRecorder'

export default function getChangeFromDocument (doc) {
  const recorder = new ChangeRecorder(doc)
  return recorder.generateChange()
}
