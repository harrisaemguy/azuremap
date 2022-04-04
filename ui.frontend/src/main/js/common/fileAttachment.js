import {
  triggerFieldValidation,
  enableFieldValidation,
  disableFieldValidation,
} from './formApi';
import axios from 'axios/dist/axios';
import { getAfFieldId } from './generic';
import 'jquery.md5';
import './fileAttachment.css';
import download from 'downloadjs';

// jdatatable link onclick
export function downloadDor(doc_id) {
  let fdm_url = '/bin/dbServices.dor';
  let query = {
    DATA_SOURCE_NAME: 'fdm.ds1',
    operationName: 'SELECT',
    tblName: 'document',
    selector: ['FileName', 'data'],
    filter: { doc_id: doc_id },
  };
  let inputs = JSON.stringify(query);

  let formData = new FormData();
  // formData.append('yinyang.png', blob);
  formData.append('operationArguments', inputs);

  let extraData = {
    responseType: 'arraybuffer',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  axios
    .post(fdm_url, formData, extraData)
    .then((response) => {
      let headerLine = response.headers['content-disposition'];
      let startFileNameIndex = headerLine.indexOf('filename=') + 9;
      let filename = headerLine.substring(startFileNameIndex);
      filename = filename || 'jsHtml.pdf';
      download(response.data, filename, response.headers['content-type']);
    })
    .catch(function (error) {
      console.log(error);
    });

  return false;
}

//AEM jcr /tmp/fd/af/_16489095682129049/certificate/*, only support unique filename
//can't handle remove, can't read if not login

//build md5 to file map, to track all the files (added, deleted) per form
//key: md5, val: File
let attachmentsInfo_reference = new Map();
let jtableRef = new Map();
//dc.form_poc.observeFileUpload(this, valueChanged);
export function observeFileUpload(
  afField,
  valueChanged = (afField, filesRemoved, filesAdded, uniqueFiles) => {},
  tblHolder
) {
  if ('guideFileUpload' !== afField.className) {
    console.warn('Only valid for AEM form attachment component!');
    return;
  }

  //fileItemList, the node to be monitored
  let fupid = getAfFieldId(afField);
  if(tblHolder) {
    jtableRef.set(fupid, tblHolder);
  }
  let fileItemListEle = $('#' + fupid + ' .guide-fu-fileItemList')[0];

  // Create an observer instance
  let observer = new MutationObserver((mutationsList, observer) => {
    //console.log('collect all files (include duplicate)');
    let proms = [],
      files = [];
    afField.fileList.forEach((obj) => {
      for (let i = 0; i < obj[0].files.length; i++) {
        let file = obj[0].files[i];
        files.push(file);
        proms.push(readAsDataURL_prom(file));
      }
    });

    // find duplicates
    Promise.all(proms).then((results) => {
      let duplicates = [];
      let attachmentsInfo = new Map();

      for (let i = 0; i < results.length; i++) {
        let x = $.md5(results[i]);
        if (attachmentsInfo.has(x)) {
          duplicates.push(i);
        } else {
          attachmentsInfo.set(x, files[i]);
        }
      }

      // mark duplicates
      // console.log('mark duplicates: ' + duplicates);
      $(`#${fupid} .guide-fu-fileItemList>.guide-fu-fileItem`).each(
        (idx, ele) => {
          if (duplicates.includes(idx)) {
            $(ele)
              .addClass('duplicated')
              .find('.guide-fu-filePreview')
              .text('(duplicated)');
          }
        }
      );

      // compare current map with previous map, find the added and removed, sync database
      let filesAdded = new Map();
      let filesRemoved = new Map();
      attachmentsInfo_reference.forEach((file, md5) => {
        if (!attachmentsInfo.has(md5)) {
          filesRemoved.set(md5, file);
        }
      });
      attachmentsInfo.forEach((file, md5) => {
        if (!attachmentsInfo_reference.has(md5)) {
          filesAdded.set(md5, file);
        }
      });
      filesRemoved.forEach((file, md5) => {
        attachmentsInfo_reference.delete(md5);
      });
      filesAdded.forEach((file, md5) => {
        attachmentsInfo_reference.set(md5, file);
      });

      valueChanged(afField, filesRemoved, filesAdded, attachmentsInfo);
    });
  });

  observer.observe(fileItemListEle, {
    attributes: false,
    childList: true,
    characterData: false,
  });
}

//To display inline img or pdf
//<embed src="the.pdf" width="500" height="375" type="application/pdf">
//<img src="the.png" width="500" height="375">
//good for text files and binary files

//readUserSelectedFile_asDataURL(ele[0][0].files[0]).then((result)=>{image.src = result});
//or
//read blob from servlet output:
//let arrayBuf = oReq.response;
//let blob = new Blob([ arrayBuf ], {});
//readUserSelectedFile_asDataURL(blob).then((result)=>{image.src = result});
function readAsDataURL_prom(file) {
  return new Promise(function (resolve) {
    let reader = new FileReader();
    reader.addEventListener('load', (event) => {
      resolve(event.target.result);
    });

    // Convert data to base64
    reader.readAsDataURL(file);
  });
}

//jQuery not able to create <embed>, so use document.createElement
function inlinePdf4Attachment(afField, fileBlob) {
  let fupid = getAfFieldId(afField);
  // remove pdf if existing
  $('#' + fupid + ' img').remove();
  $('#' + fupid + ' embed').remove();
  let pdf = document.createElement('embed');
  pdf.setAttribute('class', 'showAttached');
  pdf.setAttribute('type', 'application/pdf');
  $('#' + fupid + ' .guideFieldWidget')[0].prepend(pdf);

  readAsDataURL_prom(fileBlob).then((result) => {
    $('#' + fupid + ' embed').attr('src', result);
  });
}

function inlineImg4Attachment(afField, fileBlob, alt = 'Uploaded image') {
  let fupid = getAfFieldId(afField);

  readAsDataURL_prom(fileBlob).then((result) => {
    // remove if image existing
    $('#' + fupid + ' img').remove();
    $('#' + fupid + ' embed').remove();
    if (result.startsWith('data:image/')) {
      let image = new Image();
      image.alt = alt;
      image.width = 300;
      image.height = 200;
      image.addEventListener('load', () => {
        // alert(this.width + " X " + this.height);
        $('#' + fupid + ' .guideFieldWidget')[0].prepend(image);
        // no need validation
        // disableFieldValidation(afField);

        // display and focus status to screen reader
        $('#inform_uploaded')
          .attr('role', 'status')
          .attr('tabindex', -1)
          .focus();
      });

      image.src = result;
    }
  });
}

// sample function as parameter
function attachmentHandler(
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
) {}

// because attachment script validation does not work
export function setAttachmentError(afField, errorMsg) {
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

function sampleFileValidate(afField, file) {
  let fileExt = file.name.getFileExt().toLowerCase();
  if (fileExt && ['.jpeg', '.jpg', '.pdf', '.png'].includes(fileExt)) {
    let sizeMB = (file.size / 1048576).toFixed(4);
    console.log('sizeMB: ' + sizeMB);
    if (fileExt !== '.pdf' && (sizeMB > 4 || sizeMB < 0.8)) {
      // wrong file size
      setAttachmentError(
        afField,
        'Wrong file size, please select between 1MB to 4MB!'
      );
      return false;
    } else {
      // pass script validation
      setAttachmentError(afField);
      return true;
    }
  } else {
    // wrong extension
    setAttachmentError(
      afField,
      'Wrong file format, please select jpeg/jpg/pdf!'
    );
    return false;
  }
}

function sampleUpload({ payload, files }) {
  return new Promise((resolve, reject) => {
    if (typeof files !== 'undefined' && typeof payload !== 'undefined') {
      let fdm_url = '/bin/dbServices.json';
      let query = {
        DATA_SOURCE_NAME: 'fdm.ds1',
        operationName: 'INSERT',
        tblName: 'document',
        payload: payload,
      };

      let inputs = JSON.stringify(query);
      let formData = new FormData();
      formData.append('operationArguments', inputs);

      //console.log('append file binary');
      for (let i = 0; i < files.length; i++) {
        console.log('append file binary');
        formData.append('file_' + i, files[i], files[i].name);
      }

      let extraData = {};
      axios
        .post(fdm_url, formData, extraData)
        .then((response) => {
          //console.log(response);
          resolve(true);
        })
        .catch(function (error) {
          console.log(error);
          reject(error);
        });
    } else {
      resolve(false);
    }
  });
}

function sampleDelete(FileName) {
  return new Promise((resolve, reject) => {
    let fdm_url = '/bin/dbServices.json';
    let query = {
      DATA_SOURCE_NAME: 'fdm.ds1',
      operationName: 'DELETE',
      tblName: 'document',
      idName: 'FileName',
      idVal: FileName,
    };

    let inputs = JSON.stringify(query);
    let formData = new FormData();
    formData.append('operationArguments', inputs);

    //console.log('append file binary');

    let extraData = {};
    axios
      .post(fdm_url, formData, extraData)
      .then((response) => {
        //console.log(response);
        resolve(true);
      })
      .catch(function (error) {
        console.log(error);
        reject(error);
      });
  });
}

// afField, map, map
export function sampleFileChangeHandler(
  afField,
  filesRemoved,
  filesAdded,
  uniqueFiles
) {
  console.log('filesRemoved: ' + filesRemoved.size);
  console.log('filesAdded: ' + filesAdded.size);

  const fupid = getAfFieldId(afField);
  // remove old inline images
  $('#' + fupid + ' img').remove();
  $('#' + fupid + ' embed').remove();

  let proms = [];

  filesRemoved.forEach((file, md5) => {
    //trigger configured validation
    setAttachmentError(afField);
    enableFieldValidation(afField);
    triggerFieldValidation(afField);

    proms.push(sampleDelete(file.name));
  });

  filesAdded.forEach((file, md5) => {
    let vflag = sampleFileValidate(afField, file);

    console.log('validate status:' + vflag);
    if (vflag) {
      let payload = { id: 10001 };
      proms.push(sampleUpload({ payload, files: [file] }));
    }
  });

  if (proms.length > 0) {
    Promise.all(proms).then((sFlags) => {
      console.log('Submit status:' + sFlags);
      if(jtableRef.get(fupid)) {
        // redraw table
        jtableRef.get(fupid).valueExt = {};
      }
      uniqueFiles.forEach((file, md5) => {
        if (file.name.endsWith('.pdf')) {
          inlinePdf4Attachment(afField, file);
        } else {
          inlineImg4Attachment(afField, file);
        }
      });
    });
  }
}
