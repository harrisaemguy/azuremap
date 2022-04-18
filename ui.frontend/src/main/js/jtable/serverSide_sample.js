import { languages } from './languages';
import { getAfFieldId, promise, renderStaticHtml } from '../common/generic';

const sampleColumns = [
  {
    data: 'first_name',
    title: 'First name',
  },
  {
    data: 'last_name',
    title: 'Last name',
  },
  {
    data: 'position',
    title: 'Position',
  },
  {
    data: 'salary',
    title: 'Salary',
  },
];

export function applyServerSideTable(
  fld,
  ajaxUrl = '/bin/dc/jdatatable',
  columns = sampleColumns
) {
  //let cleanTpl = DOMPurify.sanitize(gridTpl, { FORCE_BODY: true });
  renderStaticHtml(
    fld,
    `<table class="display responsive nowrap" style="width:100%"></table>`
  );

  let fldId = getAfFieldId(fld);
  promise(`#${fldId} table`).then(() => {
    let table = $(`#${fldId} table`).DataTable({
      processing: true,
      serverSide: true,
      ordering: false,
      searching: false,
      pageLength: 5,
      keys: true,
      dom: 'Bfrtip',
      select: {
        style: 'single',
      },
      buttons: [
        {
          text: 'Get selected data',
          action: function () {
            let datas = table
              .rows({
                selected: true,
              })
              .data()
              .toArray();
            console.log(datas);
          },
        },
      ],
      ajax: ajaxUrl,
      columns: columns,
      language: languages.en,
    });

    $(`#${fldId} table`).on('click', 'tr', function () {
      console.log(table.row(this).data());
    });
  });
}
