'use strict';

import DocumentNode from '../../model/DocumentNode'

function Image() {
  Image.super.apply(this, arguments);
}

DocumentNode.extend(Image);

Image.define({
  type: "image",
  src: { type: "string", default: "http://" },
  previewSrc: { type: "string", optional: true }
});

export default Image;
