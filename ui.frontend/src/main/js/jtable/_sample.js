import { languages } from './languages';
import { getAfFieldId, promise, renderStaticHtml } from '../common/generic';
import axios from 'axios/dist/axios';
//import DOMPurify from 'dompurify';

const sampleTitles = [
  {
    data: 'name',
    title: 'Name',
  },
  {
    data: 'id',
    title: 'ID',
  },
  {
    data: 'username',
    title: 'username',
  },
  {
    data: 'address.city',
    title: 'City',
    searchable: true,
    visible: true,
  },
  {
    data: 'email',
    title: 'Email',
    render: function (data, type) {
      if (type === 'display') {
        return '<a href="mailto:' + data + '">' + data + '</a>';
      }
      return data;
    },
  },
];

const fetchPostDetail = (tbl, ajaxUrl) => {
  axios
    .get(ajaxUrl)
    .then((resp) => {
      resp.data.map((item) => {
        tbl.row.add(item).draw();
      });
    })
    .catch((error) => {
      console.log(error);
    })
    .then(() => {
      // always executed
      console.log('applyDataTableAjax fetchPostDetail done !');
    });
};

export function applyDataTableAjax(
  fld,
  ajaxUrl = 'https://jsonplaceholder.typicode.com/users',
  columns = sampleTitles
) {
  //let cleanTpl = DOMPurify.sanitize(gridTpl, { FORCE_BODY: true });
  renderStaticHtml(
    fld,
    `<table class="display responsive nowrap" style="width:100%"></table>`
  );

  let fldId = getAfFieldId(fld);
  promise(`#${fldId} table`).then(() => {
    let table = $(`#${fldId} table`).DataTable({
      columns: columns,
      pageLength: 5,
      keys: true,
      paging: true,
      // scrollX: true, // in case too many cols
      ordering: true,
      info: true, // info at left of pagination
      dom: 'Bfrtip',
      colReorder: true,
      buttons: ['colvis', 'print'],
    });

    fetchPostDetail(table, ajaxUrl);
  });
}
