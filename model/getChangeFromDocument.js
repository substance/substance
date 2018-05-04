import ChangeRecorder from './ChangeRecorder'

export default function getChangeFromDocument(doc) {
  let recorder = new ChangeRecorder(doc)
  return recorder.generateChange()
}
