/*
 * //const processChange = debounce(fn); // <button onclick="processChange()">Click me</button> // window.addEventListener("scroll", processChange); //ex: let fn1 = debounce(fn)
 */
export function debounce(func, context, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(context || this, args);
    }, timeout);
  };
}

// call immediately, and ignore subsequent
// ex: let fn1=debounce_leading(fn)
export function debounce_leading(func, context, timeout = 300) {
  let timer;
  return (...args) => {
    if (!timer) {
      func.apply(context || this, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
    }, timeout);
  };
}

// ex: let fn1 = execOnce(loadAtlas)
export function execOnce(func, context) {
  let result;
  return (...args) => {
    if (func) {
      result = func.apply(context || this, args);
      func = null;
    }
    return result;
  };
}

// ex: sleep(2000).then( ()=>{} );
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// id is available for repeatable items
export function getAfFieldId(afField) {
  return afField.jsonModel.id || afField.jsonModel.templateId;
}

export function renderStaticHtml(fld, html) {
  if ('guideTextDraw' === fld.className) {
    let fldId = getAfFieldId(fld);
    $('#' + fldId).html(html);
  }
}

// promise('#idd1').then( ()={} );
export function promise(cssSelector, visible = false) {
  return new Promise(function (resolve) {
    let checking = setInterval(() => {
      let total = $(cssSelector).length;
      if (
        (visible && $(cssSelector).is(':visible')) ||
        (!visible && $(cssSelector).length > 0)
      ) {
        clearInterval(checking);
        resolve(true);
      }
    }, 5);
  });
}

// urlParams().get('wcmmode'), toString()
export function urlParams() {
  return new URL(document.location).searchParams;
}

// ex: getUrlParam('wcmmode')
function getUrlParam(name, url = window.location.href) {
  let results = new RegExp('[?&]' + name.toLowerCase() + '=([^&#]*)').exec(
    url.toLowerCase()
  );
  if (results == null) {
    return null;
  } else {
    return decodeURI(results[1]) || 0;
  }
}

// guidelib.util.GuideUtil.navigateToURL('/content/dam/formsanddocuments/dc-sandbox/ttt/jcr:content?wcmmode=disabled','SAME_TAB')
// guidelib.util.GuideUtil.navigateToURL('http://www.google.com','SAME_TAB')
export function navigateToURL(url) {
  guidelib.util.GuideUtil.navigateToURL(url, 'SAME_TAB');
}

let cdnPromises = new Map();
// promise load once for all invoker
export function CDN_inHead({ type = 'text/javascript', href, src }) {
  let key = 'text/css' === type ? href : src;
  if (key && cdnPromises.get(key)) {
    return cdnPromises.get(key);
  } else if ('text/css' === type && href) {
    let prom = new Promise((resolve) => {
      let link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.type = type;
      document.head.appendChild(link);
      resolve({});
    });

    cdnPromises.set(href, prom);
    return prom;
  } else if ('text/javascript' === type && src) {
    let prom = new Promise((resolve) => {
      let script = document.createElement('script');
      script.type = type;
      script.onload = () => {
        resolve({});
      };
      script.src = src;
      document.head.appendChild(script);
    });

    cdnPromises.set(src, prom);
    return prom;
  }
}
