export default function(tx, file) {
  // Create file node for the image
  let imageFile = tx.create({
    type: 'file',
    fileType: 'image',
    mimeType: file.type,
    // TODO: we should be able to provide `data: file` here instead. However
    // this would require some special treatment in tx.create. For file nodes
    // the data property should just be assigned and not be treated as a
    // serializable object
    // See: https://github.com/substance/substance/issues/947
    url: URL.createObjectURL(file)
  })

  // Inserts image at current cursor pos
  tx.insertBlockNode({
    type: 'image',
    imageFile: imageFile.id
  })
}
