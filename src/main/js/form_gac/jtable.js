import dt from 'datatables.net-dt'; // import from IIFE module
import 'datatables.net-dt/css/jquery.dataTables.css';
import vbtn from 'datatables.net-buttons/js/buttons.colVis';
import pbtn from 'datatables.net-buttons/js/buttons.print';
import bdt from 'datatables.net-buttons-dt';
import 'datatables.net-buttons-dt/css/buttons.dataTables.css';
import kdt from 'datatables.net-keytable-dt';
import 'datatables.net-keytable-dt/css/keyTable.dataTables.css';
import cdt from 'datatables.net-colreorder-dt';
import 'datatables.net-colreorder-dt/css/colReorder.dataTables.css';

import './css/jtable.css';
import { getAfFieldId, promise } from '../common/generic';
import axios from 'axios/dist/axios';
import moment from 'moment';

dt(window, $);
vbtn(window, $);
pbtn(window, $);
bdt(window, $);
kdt(window, $);
cdt(window, $);

const sampleTitles = [
  {
    data: 'name',
    title: 'Number',
    width: '15%',
  },
  {
    data: 'path',
    title: 'Form',
    width: '10%',
    render: function (data, type) {
      if (type === 'display') {
        return `<a target="_blank" href="${data}"><span class="pdf"></span></a>`;
      }
      return data;
    },
  },
  {
    data: 'title',
    title: 'Title',
    width: '25%',
  },
  {
    data: 'desc',
    title: 'Description',
    width: '30%',
  },
  {
    data: 'mdate',
    title: 'Dete Modified',
    width: '20%',
  },
  {
    data: 'cqtags',
    title: 'Tags',
    searchable: true,
    visible: false,
  },
];

const sampleTbl = `
  <style>
  </style>
  <table class="display nowrap" style="width:100%">
  </table>
  `;

// [{title, desc, path:'/content/dam/formsanddocuments/dc-sandbox/helloworld/jcr:content?wcmmode=disabled'}]
// http://localhost:4502/content/dam/formsanddocuments/OoPdfFormExample.pdf/jcr:content?type=pdf
// type: pdfForm, sling:resourceType:fd/fm/xfaforms/render, metadata.jcr:title
function printAllVals(
  obj,
  objPath = '/content/dam/formsanddocuments',
  jsObj = [],
  formName = ''
) {
  for (let i in obj) {
    if (typeof obj[i] === 'object') {
      if (
        obj[i].hasOwnProperty('type') &&
        obj[i]['type'] === 'guide' &&
        obj[i].hasOwnProperty('sling:resourceType') &&
        obj[i]['sling:resourceType'] === 'fd/fm/af/render'
      ) {
        let desc = obj[i].metadata.description || '';
        let cqtags = obj[i].metadata['cq:tags'] || '';
        let mdate = moment(obj[i]['jcr:lastModified']).format('YYYY-MM-DD');
        let obj_i = {
          name: formName,
          title: obj[i].metadata.title,
          desc: desc,
          cqtags: cqtags,
          mdate: mdate,
          path: objPath + '/' + i + '?wcmmode=disabled',
        };
        jsObj.push(obj_i);
      } else if (
        obj[i].hasOwnProperty('type') &&
        obj[i]['type'] === 'pdfForm' &&
        obj[i].hasOwnProperty('sling:resourceType') &&
        obj[i]['sling:resourceType'] === 'fd/fm/xfaforms/render'
      ) {
        let desc = obj[i].metadata.description || '';
        let cqtags = obj[i].metadata['cq:tags'] || '';
        let mdate = moment(obj[i]['jcr:lastModified']).format('YYYY-MM-DD');
        let obj_i = {
          name: formName,
          title: obj[i].metadata.title,
          desc: desc,
          cqtags: cqtags,
          mdate: mdate,
          path: objPath + '/' + i + '?type=pdf',
        };
        jsObj.push(obj_i);
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
  columns = sampleTitles
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
      pageLength: 5,
      keys: true,
      paging: true,
      ordering: true,
      info: false,
      colReorder: true,
      // dom: 'Bfrtip',
      // buttons: ['colvis', 'print'],
    });

    aemJson(table, plHld);
  });
}

let surveyTitles = [
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

function loadSurveys(tbl) {
  let fdm_url =
    '/content/dam/formsanddocuments-fdm/aem_forms.executeDermisQuery.json?'; // alert('loading: ' + fdm_url);
  let inputs = JSON.stringify({});
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
  columns = surveyTitles
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
      pageLength: 5,
      keys: true,
      paging: true,
      ordering: true,
      info: false,
      colReorder: true,
      // dom: 'Bfrtip',
      // buttons: ['colvis', 'print'],
    });

    // aemJson(table, plHld);
    loadSurveys(table);
  });
}
