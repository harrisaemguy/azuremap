import './ui_decorator.less';

import { getAfFieldId, promise } from './generic';
import DOMPurify from 'dompurify';

const sampleGrid = `
<div class="grid-container-3">
  <div class="rbtn"></div>
  <div>2</div>
  <div>3</div>  
  <div class="rbtn"></div>
  <div>5</div>
  <div>6</div>  
</div>
`;

export function grid2Radio(fld, gridTpl = sampleGrid) {
  let tplSom = `${fld.panel.somExpression}.${fld.name}Template[0]`;
  let tplNd = guideBridge.resolveNode(tplSom);
  if (tplNd) {
    gridTpl = tplNd.value;
    /*to avoid print out the template*/
    let tplId = getAfFieldId(tplNd);
    $(`#${tplId}`).addClass('noPrint');
  }

  let cleanTpl = DOMPurify.sanitize(gridTpl, { FORCE_BODY: true });
  let fldId = getAfFieldId(fld);
  $(`#${fldId} .guideRadioButtonGroupItems`).before(cleanTpl);
  promise(`#${fldId} .rbtn`).then(() => {
    let cells = $(`#${fldId} .rbtn`).empty();
    $(`#${fldId} .guideRadioButtonItem`).each(function (idx, ele) {
      $(ele).css('display', 'flex').appendTo(cells[idx]);
    });
  });
}

const sampleChkGrid = `
<div class="grid-container-2">
   <div class="rbtn"></div>
   <div>2</div>
   <div class="rbtn"></div>
   <div>4</div>
   <div class="rbtn"></div>
   <div>6</div>
</div>
`;

export function grid2Chkbox(fld, gridTpl = sampleChkGrid) {
  let tplSom = `${fld.panel.somExpression}.${fld.name}Template[0]`;
  let tplNd = guideBridge.resolveNode(tplSom);
  if (tplNd) {
    gridTpl = tplNd.value;
    /*to avoid print out the template*/
    let tplId = getAfFieldId(tplNd);
    $(`#${tplId}`).addClass('noPrint');
  }

  let cleanTpl = DOMPurify.sanitize(gridTpl, { FORCE_BODY: true });
  let fldId = getAfFieldId(fld);
  $(`#${fldId} .guideCheckBoxGroupItems`).before(cleanTpl);
  promise(`#${fldId} .rbtn`).then(() => {
    let cells = $(`#${fldId} .rbtn`).empty();
    $(`#${fldId} .guideCheckBoxItem`).each(function (idx, ele) {
      $(ele).css('display', 'flex').appendTo(cells[idx]);
    });
  });
}

const sampleC1R4Grid = `
<div class="C1R4">
   <div class="rbtn"></div>
   <div class="decoration">
      <ul>
         <li>You Look Amazing.</li>
         <li>If You Want to Talk, I'm Here.</li>
      </ul>
   </div>
   <div class="rbtn"></div>
   <div class="decoration">
      <ul>
         <li>You're a Great Cook.</li>
         <li>You're So Creative.</li>
      </ul>
   </div>
</div>
`;

export function grid2RadioLst(fld, gridTpl = sampleC1R4Grid) {
  grid2Radio(fld, gridTpl);
}
