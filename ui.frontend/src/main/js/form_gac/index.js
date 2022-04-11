//import '../common/print.css';

//export * from '../common/ui_decorator';
//export * from '../common/inputSuffix';
export * from './jtable';
export * from '../common/fileAttachment';
import { renderStaticHtml } from '../common/generic';
import moment from 'moment';

export function rootInit(fld) {
  guideBridge.getData({
    success: function (guideResultObject) {
      console.log('data received' + guideResultObject.data);
      let dataObj = JSON.parse(guideResultObject.data);
      let lastDate = moment(dataObj.data.lastModified).format('YYYY-MM-DD, h:mm:ss');
      let msg =
        '<p><b>Last update: </b>' +
        lastDate +
        ' -------- <b>Login as:</b>' +
        dataObj.data.fname +
        '</p>';

      renderStaticHtml(fld, msg);
    },
    error: function (guideResultObject) {
      console.error('API Failed');
      var msg = guideResultObject.getNextMessage();
      while (msg != null) {
        console.error(msg.message);
        msg = guideResultObject.getNextMessage();
      }
    },
  });
}
