import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';

//https://ckeditor.com/docs/ckeditor5/latest/features/markdown.html#installation
import SourceEditing from '@ckeditor/ckeditor5-source-editing/src/sourceediting';

import { getAfFieldId, promise } from '../common/generic';

export function init(fld) {
  let fldId = getAfFieldId(fld);

  promise(`#${fldId} textarea`).then(() => {
    let ck_editor = undefined;
    ClassicEditor.create(document.querySelector(`#${fldId} textarea`), {
      plugins: [
        Essentials,
        Autoformat,
        Bold,
        Italic,
        BlockQuote,
        Heading,
        Link,
        List,
        Paragraph,
        Alignment,
        SourceEditing,
      ],
      toolbar: [
        'heading',
        '|',
        'alignment',
        'bold',
        'italic',
        'link',
        'bulletedList',
        'numberedList',
        'uploadImage',
        'blockQuote',
        'undo',
        'redo',
        'sourceEditing',
      ],
    })
      .then((editor) => {
        ck_editor = editor;
      })
      .catch((error) => {
        console.error(error);
      });

    Object.defineProperty(fld, 'value', {
      get() {
        return ck_editor.getData();
      },
      set(newValue) {},
      enumerable: true,
      configurable: true,
    });
  });
}
