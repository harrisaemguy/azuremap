// this clientlib depends on dc.jtable

import './css/jtable.css';
import { getAfFieldId, promise, urlParams } from '../common/generic';
import axios from 'axios/dist/axios';
import moment from 'moment';

const pageLang = urlParams().get('afAcceptLang') || 'en';
function getFormDesc(desc, langCode) {
  let descs = desc.split('|');
  if (descs.length == 1 || 'en' === langCode) {
    return descs[0];
  } else {
    return descs[1];
  }
}

//[cachekey, Promise]
let jcrFormsPromises = new Map();
const loadJcrForms = (ajaxUrl, objPath) => {
  if (jcrFormsPromises.get(ajaxUrl)) {
    return jcrFormsPromises.get(ajaxUrl);
  } else {
    let prom = new Promise((resolve) => {
      axios
        .get(url)
        .then((response) => {
          let jsObj = printAllVals(response.data, objPath);

          resolve(jsObj);
        })
        .catch((error) => {
          console.error('ajax error during get ' + error.message);
          resolve([]);
        });
    });

    jcrFormsPromises.set(ajaxUrl, prom);
    return prom;
  }
};

const formDescMap = new Map();

const sampleTitles = {
  en: [
    {
      title: 'id',
      data: null,
      searchable: false,
      orderable: false,
      width: '10%',
      render: (data, type, row, meta) => meta.row + 1,
    },
    {
      data: 'path',
      title: 'Form Number',
      width: '20%',
    },
    {
      data: 'desc',
      title: 'Description',
      width: '50%',
    },
    {
      data: 'mdate',
      title: 'Modified Date',
      width: '20%',
    },
    {
      data: 'cqtags',
      title: 'Tags',
      searchable: true,
      visible: false,
    },
  ],
  fr: [
    {
      title: 'id',
      data: null,
      searchable: false,
      orderable: false,
      width: '10%',
      render: (data, type, row, meta) => meta.row + 1,
    },
    {
      data: 'path',
      title: 'Numéro de formulaire',
      width: '20%',
    },
    {
      data: 'desc',
      title: 'La description',
      width: '50%',
    },
    {
      data: 'mdate',
      title: 'Date modifiée',
      width: '20%',
    },
    {
      data: 'cqtags',
      title: 'Tags',
      searchable: true,
      visible: false,
    },
  ],
};

const sampleTbl = `
  <table class="display nowrap" style="width:100%">
  </table>
  `;

// [{title, desc, path:'/content/dam/formsanddocuments/dc-sandbox/helloworld/jcr:content?wcmmode=disabled'}]
// http://localhost:4502/content/dam/formsanddocuments/OoPdfFormExample.pdf/jcr:content?type=pdf
// type: pdfForm, sling:resourceType:fd/fm/xfaforms/render, metadata.jcr:title
function printAllVals(obj, objPath, jsObj = [], formName = '') {
  for (let i in obj) {
    if (typeof obj[i] === 'object') {
      if (
        (obj[i].hasOwnProperty('type') &&
          obj[i]['type'] === 'guide' &&
          obj[i].hasOwnProperty('sling:resourceType') &&
          obj[i]['sling:resourceType'] === 'fd/fm/af/render') ||
        (obj[i].hasOwnProperty('type') &&
          obj[i]['type'] === 'pdfForm' &&
          obj[i].hasOwnProperty('sling:resourceType') &&
          obj[i]['sling:resourceType'] === 'fd/fm/xfaforms/render')
      ) {
        let desc = obj[i].metadata.description || '';
        desc = getFormDesc(desc, pageLang);
        let cqtags = obj[i].metadata['cq:tags'] || '';
        let mdate = moment(obj[i]['jcr:lastModified']).format('YYYY-MM-DD');
        let formPath = objPath;
        if (obj[i]['type'] !== 'pdfForm') {
          formPath =
            formPath.replace(
              '/content/dam/formsanddocuments',
              '/content/forms/af'
            ) +
            '.html?afAcceptLang=' +
            pageLang;
        } else {
          formPath = formPath + '/' + i + '.pdf';
        }
        let obj_i = {
          desc: desc || obj[i].metadata.title,
          cqtags: cqtags,
          mdate: mdate,
          path: `<a target="_blank" href="${formPath}">${formName}</a>`,
        };
        jsObj.push(obj_i);
        formDescMap.set(formName.replace(/\D/g, ''), obj_i.desc);
      }

      let subPath = objPath + '/' + i;
      let namex = i;
      printAllVals(obj[i], subPath, jsObj, namex);
    }
  }

  return jsObj;
}

function aemJson(tbl, ajaxUrl = '/content/dam/formsanddocuments.7.json') {
  let objPath = ajaxUrl.substring(0, ajaxUrl.indexOf('.'));
  axios
    .get(ajaxUrl)
    .then(function (response) {
      // handle success
      let jsObj = printAllVals(response.data, objPath);
      console.log(jsObj);
      jsObj.map((item) => {
        tbl.row.add(item).draw();
      });
    })
    .catch((error) => {
      console.log(error);
    })
    .then(() => {
      // always executed
      console.log('applyDataTableAjax done !');
    });
}

export function applyFormTableAjax(
  fld,
  gridTpl = sampleTbl,
  columns = sampleTitles[pageLang]
) {
  // let user configure rootDir
  let plHld = fld.jsonModel.placeholderText;
  if (
    plHld &&
    plHld.startsWith('/content/dam/formsanddocuments') &&
    plHld.endsWith('.json')
  );
  else {
    plHld = '/content/dam/formsanddocuments.7.json';
  }

  let fldId = getAfFieldId(fld);
  $(`#${fldId} input`).hide().after(gridTpl);

  promise(`#${fldId} table`).then(() => {
    let table = $(`#${fldId} table`).DataTable({
      columns: columns,
      pageLength: 10,
      keys: true,
      paging: true,
      ordering: true,
      info: false,
      colReorder: true,
      language: dc.jtable.languages[pageLang],
      // dom: 'Bfrtip',
      // buttons: ['colvis', 'print'],
    });

    let proms = [];
    plHld.split(',').map((ajaxUrl) => {
      ajaxUrl = ajaxUrl.trim();
      let objPath = ajaxUrl.substring(0, ajaxUrl.indexOf('.'));
      let prom = loadJcrForms(ajaxUrl, objPath);
      proms.push(prom);
    });

    Promise.all(proms).then((objs) => {
      objs.map((jsObj) => {
        jsObj.map((item) => {
          table.row.add(item).draw();
        });
      });
    });
  });
}

let myRequestCols = {
  en: [
    {
      title: 'id',
      data: null,
      searchable: false,
      orderable: false,
      width: '10%',
      render: (data, type, row, meta) => meta.row + 1,
    },
    {
      data: 'form_id',
      title: 'Form Number',
      width: '20%',
    },
    {
      data: 'form_id',
      title: 'Description',
      width: '30%',
      render: function render(data, type) {
        if (type === 'display' && formDescMap.get(data)) {
          return formDescMap.get(data);
        }

        return data;
      },
    },
    {
      data: 'status',
      title: 'Status',
      width: '10%',
    },
    {
      data: 'submitted_on',
      title: 'Submitted Date',
      width: '20%',
      render: function render(data, type) {
        if (type === 'display') {
          return data.substring(0, 10);
        }

        return data;
      },
    },
    {
      data: 'document_id',
      render: function render(data, type) {
        if (type === 'display') {
          return `<a target="_blank" href="/bin/international/document?ID=${data}">View</a>`;
        }

        return data;
      },
    },
  ],
  fr: [],
};

function loadMyRequest(tbl) {
  let fdm_url = '/bin/international/bpace';
  $.ajax({
    type: 'GET',
    url: fdm_url,
    data: {
      func: 'MyRequests',
      definition: '0',
      output: 'json',
      rows: 100,
      offset: 0,
      format: 1,
      _: new Date().getTime(),
    },
    success: function (data, textStatus, jqXHR) {
      console.log(data);
      data.rows.map(function (item) {
        tbl.row.add(item).draw();
      });
    },
    error: function (xrequest, textStatus, errorThrown) {
      alert(xrequest.responseText);
    },
    cache: false,
    async: true,
  });
}

export function applyMyReqTableAjax(
  fld,
  gridTpl = sampleTbl,
  columns = myRequestCols['en']
) {
  let fldId = getAfFieldId(fld);
  $(`#${fldId} input`).hide().after(gridTpl);

  promise(`#${fldId} table`).then(() => {
    let table = $(`#${fldId} table`).DataTable({
      columns: columns,
      pageLength: 10,
      keys: true,
      paging: true,
      ordering: true,
      info: false,
      colReorder: true,
      // dom: 'Bfrtip',
      // buttons: ['colvis', 'print'],
    });

    loadMyRequest(table);
  });
}

let pendingTblCols = [
  {
    data: 'given_name',
    title: 'First Name',
  },
  {
    data: 'surname',
    title: 'Last Name',
  },
  {
    data: 'jcr_form_name',
    title: 'Form',
  },
  {
    data: 'submitted_date',
    title: 'Submitted',
    render: function render(data, type) {
      if (type === 'display') {
        return data.substring(0, 10);
      }

      return data;
    },
  },
  {
    data: 'formId',
    title: 'Approve',
    render: function render(data, type) {
      if (type === 'display') {
        return (
          '<a href="/content/dam/formsanddocuments/applicationforms/' +
          data +
          '">' +
          'Approve' +
          '</a>'
        );
      }

      return data;
    },
  },
];

function loadFDMByStatus(tbl, filter = { status: 'pending' }) {
  let fdm_url =
    '/content/dam/formsanddocuments-fdm/aem_forms.executeDermisQuery.json?'; // alert('loading: ' + fdm_url);
  let inputs = JSON.stringify(filter);
  let operationName = 'getByStatus';

  $.ajax({
    type: 'POST',
    url: fdm_url,
    data: {
      operationName: operationName,
      operationArguments: inputs,
    },
    success: function (data, textStatus, jqXHR) {
      data.map(function (item) {
        let itemData = {
          given_name: item.given_name,
          surname: item.surname,
          jcr_form_name: item.jcr_form_name,
          division_mission: item.division_mission,
          submitted_date: item.submitted_date,
          formId:
            item.jcr_form_name +
            '/jcr:content?wcmmode=disabled&dataRef=' +
            item.id,
          position_title: item.position_title,
          json_data: item.json_data,
        };
        tbl.row.add(itemData).draw();
      });
    },
    error: function (xrequest, textStatus, errorThrown) {
      alert(xrequest.responseText);
    },
    cache: false,
    async: true,
  });
}

export function applyDataTableAjax(
  fld,
  gridTpl = sampleTbl,
  columns = pendingTblCols
) {
  let fldId = getAfFieldId(fld);
  $(`#${fldId} input`).hide().after(gridTpl);

  promise(`#${fldId} table`).then(() => {
    let table = $(`#${fldId} table`).DataTable({
      columns: columns,
      pageLength: 10,
      keys: true,
      paging: true,
      ordering: true,
      info: false,
      colReorder: true,
      // dom: 'Bfrtip',
      // buttons: ['colvis', 'print'],
    });

    loadFDMByStatus(table, { status: 'pending' });
  });
}

let submitTblCols = [
  {
    data: 'given_name',
    title: 'First Name',
  },
  {
    data: 'surname',
    title: 'Last Name',
  },
  {
    data: 'jcr_form_name',
    title: 'Form',
  },
  {
    data: 'submitted_date',
    title: 'Submitted',
    render: function render(data, type) {
      if (type === 'display') {
        return data.substring(0, 10);
      }

      return data;
    },
  },
  {
    data: 'formId',
    title: 'Approve',
    render: function render(data, type) {
      if (type === 'display') {
        return (
          '<a href="/content/dam/formsanddocuments/applicationforms/' +
          data +
          '">' +
          'DOR' +
          '</a>'
        );
      }

      return data;
    },
  },
];

let employeeTblCols = [
  {
    data: 'id',
    title: 'ID',
  },
  {
    data: 'FileName',
    title: 'File Name',
  },
  {
    data: 'dor',
    title: 'DOR',
    render: function render(data, type) {
      if (type === 'display') {
        return `<a href="#${data}" onclick="return dc.forms_online.downloadDor('${data}');">DOR</a>`;
      }

      return data;
    },
  },
];
function loadDBByStatus(tbl) {
  let fdm_url = '/bin/dbServices.json';
  let query = {
    DATA_SOURCE_NAME: 'fdm.ds1',
    operationName: 'SELECT',
    tblName: 'document',
    selector: ['doc_id', 'id', 'FileName'],
    filter: {},
    limit: 100,
    offset: 0,
  };
  let inputs = JSON.stringify(query);

  $.ajax({
    type: 'POST',
    url: fdm_url,
    data: {
      operationArguments: inputs,
    },
    success: function (data, textStatus, jqXHR) {
      data.map(function (item) {
        let itemData = {
          id: item.id,
          FileName: item.FileName,
          dor: item.doc_id,
        };
        tbl.row.add(itemData).draw();
      });
    },
    error: function (xrequest, textStatus, errorThrown) {
      alert(xrequest.responseText);
    },
    cache: false,
    async: true,
  });
}
export function loadMyRequest(
  fld,
  gridTpl = sampleTbl,
  columns = employeeTblCols
) {
  let fldId = getAfFieldId(fld);
  $(`#${fldId} input`).hide().after(gridTpl);

  promise(`#${fldId} table`).then(() => {
    let table = $(`#${fldId} table`).DataTable({
      columns: columns,
      pageLength: 10,
      keys: true,
      paging: true,
      ordering: true,
      info: false,
      colReorder: true,
      // dom: 'Bfrtip',
      // buttons: ['colvis', 'print'],
    });

    loadDBByStatus(table);

    // so that you can refresh the table
    Object.defineProperty(fld, 'valueExt', {
      set(dataObj) {
        console.log('clear table');
        table.clear().draw();
        loadDBByStatus(table);
      },
    });
  });
}
