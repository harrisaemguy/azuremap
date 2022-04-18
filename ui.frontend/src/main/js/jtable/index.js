//npm install --save datatables.net-dt
//npm install --save datatables.net-buttons-dt
//npm install --save datatables.net-keytable-dt
//npm install --save datatables.net-responsive-dt
//npm install --save datatables.net-select-dt

import dt from 'datatables.net-dt'; // import from IIFE module
import 'datatables.net-dt/css/jquery.dataTables.css';
import vbtn from 'datatables.net-buttons/js/buttons.colVis';
import pbtn from 'datatables.net-buttons/js/buttons.print';
import bdt from 'datatables.net-buttons-dt';
import 'datatables.net-buttons-dt/css/buttons.dataTables.css';
import kdt from 'datatables.net-keytable-dt';
import 'datatables.net-keytable-dt/css/keyTable.dataTables.css';
import rdt from 'datatables.net-responsive-dt';
import 'datatables.net-responsive-dt/css/responsive.dataTables.css';
import sdt from 'datatables.net-select-dt';
import 'datatables.net-select-dt/css/select.dataTables.css';
import cdt from 'datatables.net-colreorder-dt';
import 'datatables.net-colreorder-dt/css/colReorder.dataTables.css';

dt(window, $);
vbtn(window, $);
pbtn(window, $);
bdt(window, $);
kdt(window, $);
rdt(window, $);
sdt(window, $);
cdt(window, $);

export * from './_sample';
export * from './serverSide_sample';
export { languages } from './languages';
