import {
  triggerFieldValidation,
  embedPdfAttachment,
  embedImgAttachment,
  enableFieldValidation,
  disableFieldValidation,
} from './formApi';

import { getAfFieldId, promise } from './generic';

// dc.form_common.attachmentHandler(this, dc.form_common.sampleValidate, dc.form_common.sampleSubmit);
export function attachmentHandler(
  afField,
  validate = () =>
    new Promise((resolve) => {
      resolve(true);
    }),
  submit = () =>
    new Promise((resolve) => {
      resolve(true);
    }),
  submitUrl = '/bin/dc/genericSubmission'
) {
  if ('guideFileUpload' !== afField.className) {
    console.warn('Only valid for AEM form attachment component!');
    return;
  }

  // Create an observer instance
  let observer = new MutationObserver((mutationsList, ob) => {
    if (afField.fileList.length == 1) {
      // attached
      fileAttached(afField, validate, submit, submitUrl);
    } else if (afField.fileList.length == 0) {
      // detached
      fileDetached(afField);
    } else {
      // has multiples
      console.warn('Does not support multiple attachment!');
    }
  });

  // fileItemList, the node to be monitored
  let fupid = getAfFieldId(afField);
  let fileItemListEle = $('#' + fupid + ' .guide-fu-fileItemList')[0];
  observer.observe(fileItemListEle, {
    attributes: false,
    childList: true,
    characterData: false,
  });
}

// because attachment script validation does not work
export function displayAttachmentError(afField, errorMsg) {
  let fupid = getAfFieldId(afField);
  let errDiv = $('#' + fupid + ' .guideFieldError').first();
  if (errorMsg) {
    disableFieldValidation(afField);
    errDiv.parent().addClass('validation-failure');
    errDiv.html(errorMsg);
    errDiv.show();
  } else {
    enableFieldValidation(afField);
    errDiv.parent().removeClass('validation-failure');
    errDiv.html('');
    errDiv.hide();
  }
}

String.prototype.getFileExt ||
  (String.prototype.getFileExt = function () {
    let re = /(?:\.([^.]+))?$/;
    let ext = re.exec(this)[0] || '';
    return ext;
  });

export function sampleValidate(afField) {
  return new Promise((resolve) => {
    let file1 = afField.fileList[0][0].files[0];
    let fileExt = file1.name.getFileExt().toLowerCase();
    console.log('file1: ' + file1.name + ', ' + fileExt);
    if (fileExt && ['.jpeg', '.jpg', '.pdf'].includes(fileExt)) {
      let sizeMB = (file1.size / 1048576).toFixed(4);
      console.log('sizeMB: ' + sizeMB);
      if (fileExt !== '.pdf' && (sizeMB > 4 || sizeMB < 1)) {
        // wrong file size
        displayAttachmentError(
          afField,
          'Wrong file size, please select between 1MB to 4MB!'
        );
        resolve(false);
      } else {
        // pass script validation
        displayAttachmentError(afField);
        resolve(true);
      }
    } else {
      // wrong extension
      displayAttachmentError(
        afField,
        'Wrong file format, please select jpeg/jpg/pdf!'
      );
      resolve(false);
    }
  });
}

export function sampleSubmit(url, files) {
  return new Promise((resolve) => {
    console.log('sumit to: ' + url);
    resolve(true);
  });
}

// afNd.fileList[0][0].files[0].name
function fileAttached(afField, validate, submit, submitUrl) {
  console.log('fileAttached!');

  validate(afField).then((vflag) => {
    if (vflag == true) {
      console.log('valid!');
      let file1 = afField.fileList[0][0].files[0];
      submit(submitUrl, [file1]).then((sflag) => {
        if (sflag) {
          console.log('submitted!');
          if (file1.name.endsWith('.pdf')) {
            embedPdfAttachment(afField, file1);
          } else {
            embedImgAttachment(afField, file1);
          }
        }
      });
    }
  });
}

function fileDetached(afField) {
  console.log('fileDetached!');
  const fupid = getAfFieldId(afField);
  $('#' + fupid + ' img').remove();
  $('#' + fupid + ' embed').remove();
  //trigger configured validation
  enableFieldValidation(afField);
  triggerFieldValidation(afField);
}
