import axios from 'axios/dist/axios';

/*
  const formData = new FormData();
  // file - field name, this will help you to read file on backend
  // Blob - main data to send
  // BlobName - name of the file, default it will be name of your input
  formData.append('file', blob, 'a4.pdf');

  // Append json data
  formData.append('some-key', 'kkkk');

  axios.post('/bin/dc/genericSubmission', formData, {});
*/

axios.interceptors.request.use(
  function (request) {
    request.headers['Content-Type'] = 'multipart/form-data';
    return request;
  },
  null,
  { synchronous: true }
);

axios.interceptors.response.use(
  function (response) {
    //Dispatch any action on success
    return response;
  },
  function (error) {
    if (error.response.status === 401) {
      //Add Logic to
      //1. Redirect to login page or
      //2. Request refresh token
    }
    return Promise.reject(error);
  }
);

const axiosClient = axios.create();

axiosClient.defaults.baseURL = 'https://example.com/api/v1';

axiosClient.defaults.headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

//All request will wait 2 seconds before timeout
axiosClient.defaults.timeout = 2000;

axiosClient.defaults.withCredentials = true;

export function getRequest(URL) {
  return axiosClient.get(`/${URL}`).then((response) => response);
}

export function postRequest(URL, payload) {
  return axiosClient.post(`/${URL}`, payload).then((response) => response);
}

export function patchRequest(URL, payload) {
  return axiosClient.patch(`/${URL}`, payload).then((response) => response);
}

export function deleteRequest(URL) {
  return axiosClient.delete(`/${URL}`).then((response) => response);
}

/*
Ex:

import { getRequest } from 'axiosClient';

async function fetchUser() {
try {
  const user = await getRequest('users');
} catch(error) {
   //Log errors
  }
}
*/

/*
You can track upload progress in Axios very easily

const [progress, setProgress] = useState(0);

//Logic to show upload progress

const config = {
   onUploadProgress: progressEvent => {
     const percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
     setProgress(percentCompleted);
   }
 };

try {
   const updatedData = axios.put('/upload/server', data, config);
   return updatedData.response.data;
 } cactch(error) {
   //log error
   }
}
*/
