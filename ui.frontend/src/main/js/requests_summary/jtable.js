// this clientlib depends on dc.jtable

import './css/jtable.css';
import { getAfFieldId, promise, urlParams } from '../common/generic';
import axios from 'axios/dist/axios';
//printJS({printable:'docs/xx_large_printjs.pdf', type:'pdf', showModal:true})
import 'print-js/dist/print.js';

import download from 'downloadjs';
import moment from 'moment';

const pageLang = urlParams().get('afAcceptLang') || 'en';

const sampleTbl = `
  <table class="display nowrap" style="width:100%">
  </table>
  `;

let statuses = new Map();
let summaryCols = {
  en: [
    {
      data: 'form_id',
      title: 'Form Number',
      width: '10%',
    },
    {
      data: 'first_last_name',
      title: 'Full Name',
      width: '20%',
    },
    {
      data: 'division_mission',
      title: 'division_mission',
      width: '10%',
    },
    {
      data: 'title',
      title: 'title',
      width: '30%',
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
      data: 'status',
      title: 'Status',
      width: '10%',
      render: function render(data, type) {
        if (type === 'display' && statuses.get(data)) {
          return statuses.get(data);
        }

        return data;
      },
    },
  ],
  fr: [],
};

function loadSummaries(tbl) {
  let fdm_url = '/bin/international/bpace';
  let extraData = {
    params: {
      func: 'summary',
      definition: '0',
      output: 'json',
      rows: 1000,
      offset: 0,
      format: 0,
      _: new Date().getTime(),
    },
  };

  axios
    .get(fdm_url, {
      params: {
        func: 'liststatus',
        output: 'json',
        _: new Date().getTime(),
      },
    })
    .then((response1) => {
      response1.data.statuses.map((st) => {
        statuses.set(st['key'], st[`description_${pageLang}`]);
      });

      axios.get(fdm_url, extraData).then((response) => {
        console.log(response.data);
        response.data.rows.map(function (item) {
          let itemx = {
            form_id: item.form_id,
            first_last_name: `${item.first_name}, ${item.last_name}`,
            division_mission: item.division_mission,
            title: item[`title_${pageLang}`],
            status: item.status,
            submitted_on: item.submitted_on,
          };

          tbl.row.add(itemx).draw();
        });
      });
    });
}

export function initSummaryTable(
  fld,
  gridTpl = sampleTbl,
  columns = summaryCols['en']
) {
  let fldId = getAfFieldId(fld);
  $(`#${fldId} input`).parent().removeClass('guideFieldWidget');
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
      order: [[4, 'desc']],
      // dom: 'Bfrtip',
      // buttons: ['colvis', 'print'],
    });

    loadSummaries(table);
  });
}
