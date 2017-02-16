export default function(tx, file) {
  // Create file node for the image
  let imageFile = tx.create({
    type: 'file',
    fileType: 'image',
    mimeType: file.type,
    sourceFile: file
  })
  // Inserts image at current cursor pos
  tx.insertBlockNode({
    type: 'image',
    imageFile: imageFile.id
  })
}
