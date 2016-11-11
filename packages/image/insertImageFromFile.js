export default function(tx, params) {
  let file = params.file

  // Create file node for the image
  let imageFile = tx.create({
    type: 'npfile',
    fileType: 'image',
    mimeType: file.type,
    data: file
  })

  // Inserts image at current cursor pos
  tx.insertNode({
    type: 'image',
    imageFile: imageFile.id
  })
}