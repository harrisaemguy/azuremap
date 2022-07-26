//import '../common/print.css';

//export * from '../common/ui_decorator';
//export * from '../common/inputSuffix';
export * from './jtable';
export * from '../common/fileAttachment';
import { renderStaticHtml, urlParams, sleep } from '../common/generic';
import moment from 'moment';

export function rootInit(fld) {
  guideBridge.getData({
    success: function (guideResultObject) {
      console.log('data received' + guideResultObject.data);
      let dataObj = JSON.parse(guideResultObject.data);
      let lastDate = moment(dataObj.data.lastModified).format(
        'YYYY-MM-DD, h:mm:ss'
      );
      let msg =
        '<p><b>Last update: </b>' +
        lastDate +
        ' -------- <b>Login as:</b>' +
        dataObj.data.fname +
        '</p>';
      if (dataObj.data.metadata) {
        dataObj.data.metadata.map((mdata) => {
          msg += mdata.key + ': ' + mdata.value + '<br>';
        });
      }

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

export function userNameInit(fld) {
  let user = gc.international._getUserInfoBySignetID();
  let userName = `<p><b>${user.surname}, ${user.givenName}</b></p>`;
  renderStaticHtml(fld, userName);
}

let tabs = [
  'guide[0].guide1[0].guideRootPanel[0].page[0].tabs[0].forms[0]',
  'guide[0].guide1[0].guideRootPanel[0].page[0].tabs[0].myRequest[0]',
  'guide[0].guide1[0].guideRootPanel[0].page[0].tabs[0].plPendingApproval[0]',
];
const afFormReadyListener = function () {
  let pagex = urlParams().get('page') || '0';

  if (pagex !== '0') {
    sleep(100).then(() => {
      window.guideBridge.setFocus(tabs[pagex]);
    });
  }
};

window.addEventListener('bridgeInitializeStart', function (evnt) {
  // 1. get hold of the guideBridge object
  var guideBridge = evnt.detail.guideBridge;

  // 2. Register a callback to be executed when the Adaptive Form gets initialized
  guideBridge.connect(afFormReadyListener);
});
