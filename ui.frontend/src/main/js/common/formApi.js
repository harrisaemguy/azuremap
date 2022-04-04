import { getAfFieldId, promise } from './generic';

export function updateFormView() {
  // disable annoying autocomplete
  $('form').attr('autocomplete', 'disabled');
  // use disabled for chrome
  $('input').attr('autocomplete', 'disabled');

  // default link to popup
  $('a:not([target])').prop('target', '_blank');

  // for whatever readonly fields
}

export function disableInput(afFld) {
  let fldId = getAfFieldId(afFld);
  $(`#${fldId} input, #${fldId} textarea, #${fldId} select,`)
    .prop('tabindex', -1)
    .prop('disabled', true);
  $(`#${fldId} label`).removeProp('for');
}

// .guideRootPanel>.tabbedPanelLayout>.guideLayout>.row, set child style.order 0, 1, then swap 2 child
// so that menu display on left, but focus start with input fields;
export function swapLeftTabsToRight(afFld) {
  //  $('.guideRootPanel>.tabbedPanelLayout>.guideLayout>.row>div.afTabLeftPanel')
  //    .css('order', '1')
  //    .prependTo($('.guideRootPanel>.tabbedPanelLayout>.guideLayout>.row'));
}

export function addParamsToUrl(
  url = '/bin/dc/genericSubmission',
  params = { operationName: 'getDraftPhoto' }
) {
  return (
    `${url}?` +
    Object.keys(params)
      .map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
      })
      .join('&')
  );
}

export function sortObjByKey(
  unordered = {
    b: 'foo',
    c: 'bar',
    a: 'baz',
  }
) {
  const ordered = Object.keys(unordered)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unordered[key];
      return obj;
    }, {});
  console.log(JSON.stringify(ordered));
  // → '{"a":"baz","b":"foo","c":"bar"}'
  return ordered;
}

//Get all siblings of an element
export const my_siblings = (ele) =>
  [].slice.call(ele.parentNode.children).filter((child) => child !== ele);

// Display hh:mm:ss tick down
// Number.parseFloat(dc.form_common.moment.duration(1100000, 'ms').as('minutes').toString()).toFixed(2) // 18.33
export function getRoundMinutes(ms) {
  return Number.parseFloat(
    dc.form_common.moment.duration(ms, 'ms').as('minutes').toString()
  ).toFixed(2);
}

// let blob = dataURLtoBlob('data:text/plain;base64,YWFhYWFhYQ==');
export function dataURLtoBlob(dataURL) {
  let arr = dataURL.split(','),
    mime = arr[0].match(/:(.*?);/)[1], // between : and ;
    byteString = atob(arr[1]),
    n = byteString.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = byteString.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// <a href="#{{fldId}}" data-som="{{fldSom}}" onclick="return IRCC.focus(this);">
export function click_focusDataSom(domEl) {
  let som = $(domEl).data('som');
  window.guideBridge.setFocus(som);
  return false;
}

// you can disable field validation by js: IRCC.af_fields.PHOTO_DATE.validationsDisabled = true;
// you can change rule by js: IRCC.af_fields.COMM_PHOTO_ADD_LINE1.jsonModel.validatePictureClause='^[0-9]*$'
// you can change rule message by js: IRCC.af_fields.COMM_PHOTO_ADD_LINE1.jsonModel.validatePictureClauseMessage='xilu';
// and then you can trigger validate: IRCC.af_fields.COMM_PHOTO_ADD_LINE1.validate([]);

// you can switch validator: IRCC.af_fields.PHOTO_DATE._compiledScripts.validateExp=fn1;
// you can change script error: .jsonModel.validateExpMessage='dddd';
// and then you can trigger validate: IRCC.af_fields.PHOTO_DATE.validate([]);

// .jsonModel.validateExpMessage
// .jsonModel.mandatoryMessage = 'require xilu'
// .jsonModel.validatePictureClauseMessage
export const disableFieldValidation = (fld) => {
  fld.validationsDisabled = true;
};

export const enableFieldValidation = (fld) => {
  fld.validationsDisabled = false;
};

// such as: setFieldValidationRegex for all PostalCode
const setFieldValidationRegex = (fld, regexStr) => {
  fld.jsonModel.validatePictureClause = regexStr;
};

const setFieldValidationRegexMsg = (fld, msg) => {
  fld.jsonModel.validatePictureClauseMessage = msg;
};

export const setFieldValidationScript = (fld, fn) => {
  fld._compiledScripts.validateExp = fn;
};

export const setFieldValidationScriptMsg = (fld, msg) => {
  fld.jsonModel.validateExpMessage = msg;
};

const setFieldMandatoryMsg = (fld, msg) => {
  fld.jsonModel.mandatoryMessage = msg;
};

export const triggerFieldValidation = (fld) => {
  fld.validate([]);
};

export function zipCodeRegex(afFld) {
  setFieldValidationRegex(afFld, '^([0-9]{5}-[0-9]{4}|[0-9]{5})$');
}

// support to show applyCollapse2Card
export function validate_focus() {
  let x = [];
  guideBridge.validate(x, null, false);
  let eNd = guideBridge.resolveNode(x[0].som);
  let eId = eNd.jsonModel.id || eNd.jsonModel.templateId;
  let underCollap = $('#' + eId).parents('.collapse').length;
  if (underCollap > 0) {
    let cParent = $('#' + eId)
      .parents('.collapse')
      .first();
    if (!cParent.hasClass('show')) {
      $('#' + eId)
        .parents('.card')
        .find('[data-target]')[0]
        .click();
    }
  }
  guideBridge.setFocus(x[0].som);
}

// used on field initialize
export function numeric_keypad_on_mobile(afInputNd) {
  let fldId = getAfFieldId(afInputNd);
  $(`#${fldId} input`).attr('pattern', '[0-9]*').attr('inputmode', 'numeric');
}

export function hideDayOnDatePicker(afInputNd) {
  $('.hideDay .comb-form-group-day.numericInput')
    .parent()
    .css('display', 'none');
}

// add Canadapost PCA to input, invoked from registered focusListener when needed

// hide city-sample image when currentComponent is not on city
// change dropdownlist to datalist, invoked from registered focusListener when needed
export const dropdownlstFocusListener = function (payload) {
  let oldSom = payload.jsonModel.prevText;
  let newSom = payload.jsonModel.newText;
  let oCmp = window.guideBridge.resolveNode(oldSom);
  let nCmp = window.guideBridge.resolveNode(newSom);

  if ('guideDropDownList' === nCmp.className) {
    // focus in
    let eId = getAfFieldId(nCmp);
    let datalistId = eId + '_datalist';
    let datainputId = eId + '_datainput';
    let select0 = $('#' + eId + ' select');
    let datalist = $('<datalist>').attr('id', datalistId);
    let datainput = $('<input name="browser">')
      .attr('list', datalistId)
      .attr('id', datainputId)
      .addClass('arrows');
    datainput.insertBefore(select0);
    datalist.insertBefore(select0);
    $('#' + eId + ' select option').each(function (idx, ele) {
      if (nCmp.value === $(ele).attr('value')) {
        $('#' + datainputId).val($(ele).text());
      }

      $('<option>').val($(ele).text()).appendTo(datalist);
    });

    nCmp.orig = select0.detach();
    $('#' + datainputId).focus();
  }

  if ('guideDropDownList' === oCmp.className) {
    // focus out
    let eId = getAfFieldId(oCmp);
    let datalistId = eId + '_datalist';
    let datainputId = eId + '_datainput';
    oCmp.orig.appendTo('#' + eId + ' .guideFieldWidget');
    let select0 = $('#' + eId + ' select');
    let dat1 = $('#' + datainputId)
      .val()
      .trim();

    // update val onlyIf contains
    let found = false;
    $('#' + eId + ' select>option').each(function (idx, ele) {
      if (dat1 === $(ele).attr('value').trim()) {
        oCmp.value = dat1;
        found = true;
      }
    });

    if (found) {
      oCmp.value = dat1;
      select0.change();
    } else {
      oCmp.value = '';
      select0.change();
    }

    $('#' + datainputId).remove();
    $('#' + datalistId).remove();
  }
};
