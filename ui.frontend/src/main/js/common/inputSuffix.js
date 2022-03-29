import './inputSuffix.css';
import { getAfFieldId } from './generic';

// call this on input's initialize
export function applySuffix(fld, suffix) {
  let sffixSom = `${fld.panel.somExpression}.${fld.name}Suffix[0]`;
  let sffixNd = guideBridge.resolveNode(sffixSom);
  if (sffixNd) {
    suffix = $(sffixNd.value).text();
    /*to avoid print out the template*/
    let sffixId = getAfFieldId(sffixNd);
    $(`#${sffixId}`).addClass('noPrint');
  }

  if (suffix) {
    let fldId = getAfFieldId(fld);
    let input = $(`#${fldId} input`);
    input.attr('maxlength', '70');
    input.parent().append(`<span class="unit">${suffix}</span>`);
    input.parent().addClass('suffix');
  }
}
