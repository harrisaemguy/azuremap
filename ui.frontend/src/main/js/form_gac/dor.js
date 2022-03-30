import download from 'downloadjs';
import axios from 'axios/dist/axios';

export function downloadDor(id) {
  let fdm_url = '/bin/dbServices.dor';
  let query = {
    DATA_SOURCE_NAME: 'fdm.ds1',
    operationName: 'SELECT',
    tblName: 'document',
    selector: ['FileName', 'data'],
    filter: { id: id },
  };
  let inputs = JSON.stringify(query);

  let formData = new FormData();
  //formData.append('yinyang.png', blob);
  formData.append('operationArguments', inputs);

  let extraData = {
    headers: {
      'content-type': 'arraybuffer',
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
