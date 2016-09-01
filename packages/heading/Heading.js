'use strict';

import TextBlock from '../../model/TextBlock'

function Heading() {
  Heading.super.apply(this, arguments);
}

TextBlock.extend(Heading);

Heading.define({
  type: "heading",
  level: { type: "number", default: 1 }
});

export default Heading;
